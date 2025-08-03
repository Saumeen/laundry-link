import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FormState } from '@/shared/types';
import { OrderStatus } from '@prisma/client';
import logger from '@/lib/logger';

// Types
export interface OrderHistoryEntry {
  id: number;
  orderId: number;
  staffId: number | null;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  metadata: string | null;
  createdAt: string;
  staff?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface DriverAssignment {
  id: number;
  driverId: number;
  orderId: number;
  assignmentType: 'pickup' | 'delivery';
  status: string;
  estimatedTime: string | null;
  actualTime: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
  photos: DriverPhoto[];
}

export interface DriverPhoto {
  id: number;
  driverAssignmentId: number;
  photoUrl: string;
  photoType: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface OrderProcessing {
  id: number;
  orderId: number;
  staffId: number;
  processingStatus: string;
  totalPieces: number | null;
  totalWeight: number | null;
  processingNotes: string | null;
  qualityScore: number | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  staff?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface IssueReport {
  id: number;
  orderProcessingId: number;
  staffId: number;
  issueType: string;
  description: string;
  severity: string;
  status: string;
  resolution: string | null;
  photoUrl: string | null;
  reportedAt: string;
  resolvedAt: string | null;
  staff?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface TimelineEvent {
  id: string | number;
  type:
    | 'order_created'
    | 'status_change'
    | 'driver_assignment'
    | 'processing_update'
    | 'issue_reported'
    | 'photo_uploaded';
  status: string;
  timestamp: string;
  description: string;
  icon: string;
  previousStatus?: string;
  createdBy?: string;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
  photos?: DriverPhoto[];
  issueReport?: IssueReport;
  processing?: OrderProcessing;
}

export interface OrderHistoryState {
  // Data
  history: OrderHistoryEntry[];
  driverAssignments: DriverAssignment[];
  orderProcessing: OrderProcessing[];
  issueReports: IssueReport[];
  timeline: TimelineEvent[];

  // UI State
  loading: boolean;
  error: string | null;

  // Form States
  addHistoryForm: FormState;
  uploadPhotoForm: FormState;

  // Actions
  fetchOrderHistory: (orderId: number) => Promise<void>;
  addHistoryEntry: (
    orderId: number,
    data: {
      action: string;
      description: string;
      metadata?: Record<string, unknown>;
    }
  ) => Promise<void>;
  uploadDriverPhoto: (
    assignmentId: number,
    data: {
      photoUrl: string;
      photoType: string;
      description?: string;
    }
  ) => Promise<void>;
  clearHistory: () => void;
}

const initialState = {
  history: [],
  driverAssignments: [],
  orderProcessing: [],
  issueReports: [],
  timeline: [],
  loading: false,
  error: null,
  addHistoryForm: { loading: false, error: null, success: false },
  uploadPhotoForm: { loading: false, error: null, success: false },
};

export const useOrderHistoryStore = create<OrderHistoryState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchOrderHistory: async (orderId: number) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/admin/order-history/${orderId}`);
          if (response.ok) {
            const data = await response.json();

            // Transform the data into timeline events
            const timeline = createTimelineFromData(data);

            set({
              history: data.history || [],
              driverAssignments: data.driverAssignments || [],
              orderProcessing: data.orderProcessing || [],
              issueReports: data.issueReports || [],
              timeline,
              loading: false,
            });
          } else {
            const errorData = await response.json();
            set({
              error: errorData.error || 'Failed to fetch order history',
              loading: false,
            });
          }
        } catch (error) {
          logger.error('Error fetching order history:', error);
          set({
            error: 'An error occurred while fetching order history',
            loading: false,
          });
        }
      },

      addHistoryEntry: async (
        orderId: number,
        data: {
          action: string;
          description: string;
          metadata?: Record<string, unknown>;
        }
      ) => {
        set(state => ({
          addHistoryForm: {
            ...state.addHistoryForm,
            loading: true,
            error: null,
            success: false,
          },
        }));

        try {
          const response = await fetch(`/api/admin/order-history/${orderId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            const newEntry = await response.json();
            set(state => ({
              history: [newEntry, ...state.history],
              addHistoryForm: { loading: false, error: null, success: true },
            }));

            // Refresh the timeline
            const currentTimeline = get().timeline;
            const newTimeline = createTimelineFromData({
              history: [newEntry, ...get().history],
              driverAssignments: get().driverAssignments,
              orderProcessing: get().orderProcessing,
              issueReports: get().issueReports,
            });
            set({ timeline: newTimeline });
          } else {
            const errorData = await response.json();
            set(state => ({
              addHistoryForm: {
                loading: false,
                error: errorData.error || 'Failed to add history entry',
                success: false,
              },
            }));
          }
        } catch (error) {
          logger.error('Error adding history entry:', error);
          set(state => ({
            addHistoryForm: {
              loading: false,
              error: 'An error occurred while adding history entry',
              success: false,
            },
          }));
        }
      },

      uploadDriverPhoto: async (
        assignmentId: number,
        data: {
          photoUrl: string;
          photoType: string;
          description?: string;
        }
      ) => {
        set(state => ({
          uploadPhotoForm: {
            ...state.uploadPhotoForm,
            loading: true,
            error: null,
            success: false,
          },
        }));

        try {
          const response = await fetch('/api/admin/driver/photo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assignmentId,
              ...data,
            }),
          });

          if (response.ok) {
            const result = await response.json();

            // Update driver assignments with new photo
            set(state => ({
              driverAssignments: state.driverAssignments.map(assignment =>
                assignment.id === assignmentId
                  ? {
                      ...assignment,
                      photos: [...assignment.photos, result.photo],
                    }
                  : assignment
              ),
              uploadPhotoForm: { loading: false, error: null, success: true },
            }));

            // Refresh the timeline
            const newTimeline = createTimelineFromData({
              history: get().history,
              driverAssignments: get().driverAssignments.map(assignment =>
                assignment.id === assignmentId
                  ? {
                      ...assignment,
                      photos: [...assignment.photos, result.photo],
                    }
                  : assignment
              ),
              orderProcessing: get().orderProcessing,
              issueReports: get().issueReports,
            });
            set({ timeline: newTimeline });
          } else {
            const errorData = await response.json();
            set(state => ({
              uploadPhotoForm: {
                loading: false,
                error: errorData.error || 'Failed to upload photo',
                success: false,
              },
            }));
          }
        } catch (error) {
          logger.error('Error uploading photo:', error);
          set(state => ({
            uploadPhotoForm: {
              loading: false,
              error: 'An error occurred while uploading photo',
              success: false,
            },
          }));
        }
      },

      clearHistory: () => {
        set(initialState);
      },
    }),
    {
      name: 'order-history-store',
    }
  )
);

// Helper function to create timeline from data
function createTimelineFromData(data: {
  history: OrderHistoryEntry[];
  driverAssignments: DriverAssignment[];
  orderProcessing: OrderProcessing[];
  issueReports: IssueReport[];
}): TimelineEvent[] {
  const timeline: TimelineEvent[] = [];

  // Add order history entries
  data.history.forEach(entry => {
    timeline.push({
      id: entry.id,
      type: 'status_change',
      status: entry.action,
      timestamp: entry.createdAt,
      description: entry.description,
      icon: getTimelineIcon(entry.action),
      createdBy: entry.staff
        ? `${entry.staff.firstName} ${entry.staff.lastName}`
        : undefined,
    });
  });

  // Add driver assignments
  data.driverAssignments.forEach(assignment => {
    timeline.push({
      id: `driver-${assignment.id}`,
      type: 'driver_assignment',
      status: `Driver ${assignment.status}`,
      timestamp: assignment.createdAt,
      description: assignment.driver
        ? `Driver ${assignment.driver.firstName} ${assignment.driver.lastName} assigned for ${assignment.assignmentType}`
        : `Driver assigned for ${assignment.assignmentType}`,
      driver: assignment.driver,
      photos: assignment.photos,
      icon: '🚚',
    });
  });

  // Add order processing updates
  data.orderProcessing.forEach(processing => {
    timeline.push({
      id: `processing-${processing.id}`,
      type: 'processing_update',
      status: processing.processingStatus,
      timestamp: processing.createdAt,
      description: `Processing status: ${processing.processingStatus}`,
      processing,
      icon: '⚙️',
      createdBy: processing.staff
        ? `${processing.staff.firstName} ${processing.staff.lastName}`
        : undefined,
    });
  });

  // Add issue reports
  data.issueReports.forEach(issue => {
    timeline.push({
      id: `issue-${issue.id}`,
      type: 'issue_reported',
      status: `Issue: ${issue.issueType}`,
      timestamp: issue.reportedAt,
      description: issue.description,
      issueReport: issue,
      icon: '⚠️',
      createdBy: issue.staff
        ? `${issue.staff.firstName} ${issue.staff.lastName}`
        : undefined,
    });
  });

  // Sort by timestamp (newest first)
  return timeline.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Helper function to get timeline icon
function getTimelineIcon(action: string): string {
  switch (action.toLowerCase()) {
    case 'status_change':
      return '🔄';
    case 'payment_update':
      return '💳';
    case 'driver_assignment':
      return '🚚';
    case 'processing_update':
      return '⚙️';
    case 'issue_reported':
      return '⚠️';
    case 'note_added':
      return '📝';
    default:
      return '📋';
  }
}
