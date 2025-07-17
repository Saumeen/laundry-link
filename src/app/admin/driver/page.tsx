"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import PageTransition from "@/components/ui/PageTransition";
import { Camera, MapPin, Phone, User, Clock, CheckCircle, XCircle, AlertCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DriverAssignment {
  id: number;
  assignmentType: 'pickup' | 'delivery';
  status: string;
  estimatedTime: string | null;
  actualTime: string | null;
  notes: string | null;
  order: {
    id: number;
    orderNumber: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone: string;
    customerAddress: string;
    pickupTime: string;
    deliveryTime: string;
    specialInstructions: string | null;
    customer: {
      id: number;
      firstName: string;
      lastName: string;
      phone: string;
    };
    address: {
      id: number;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      area: string | null;
      building: string | null;
      floor: string | null;
      apartment: string | null;
      landmark: string | null;
      latitude: number | null;
      longitude: number | null;
    } | null;
  };
  photos: Array<{
    id: number;
    photoUrl: string;
    photoType: string;
    description: string | null;
    createdAt: string;
  }>;
}

interface DriverStats {
  period: string;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  pendingAssignments: number;
  cancelledAssignments: number;
  earnings: number;
  pickupAssignments: number;
  deliveryAssignments: number;
  completionRate: number;
  recentAssignments: Array<{
    id: number;
    status: string;
    assignmentType: string;
    order: {
      orderNumber: string;
      customerFirstName: string;
      customerLastName: string;
    };
  }>;
}

export default function DriverDashboard() {
  const router = useRouter();
  const { adminUser, loading: authLoading } = useAdminAuth();
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<DriverAssignment | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (authLoading) return;

    if (!adminUser || adminUser.role !== "DRIVER") {
      router.push("/admin/login");
      return;
    }

    fetchAssignments();
    fetchStats();
  }, [adminUser, authLoading, router]);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/driver/assignments");
      if (response.ok) {
        const data = await response.json() as { assignments: DriverAssignment[] };
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await fetch("/api/admin/driver/stats?period=today");
      if (response.ok) {
        const data = await response.json() as { stats: DriverStats };
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const updateAssignmentStatus = useCallback(async (assignmentId: number, status: string, photoUrl?: string) => {
    try {
      setUpdating(assignmentId);
      
      // Handle reschedule status
      let finalStatus = status;
      if (photoType?.includes('rescheduled')) {
        finalStatus = 'rescheduled';
      }
      
      const response = await fetch("/api/admin/driver/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          status: finalStatus,
          notes,
          photoUrl,
          photoType: photoType || `${status}_photo`,
        }),
      });

      if (response.ok) {
        await fetchAssignments();
        await fetchStats(); // Refresh stats after update
        setSelectedAssignment(null);
        setShowPhotoModal(false);
        setPhotoData(null);
        setPhotoType("");
        setNotes("");
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
    } finally {
      setUpdating(null);
    }
  }, [fetchAssignments, fetchStats, notes, photoType]);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setCameraStream(stream);
      
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      setVideoElement(video);
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.addEventListener("canplay", resolve, { once: true });
      });
      
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check camera permissions.");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoElement) return;
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context?.drawImage(videoElement, 0, 0);
    
    const photoDataUrl = canvas.toDataURL("image/jpeg");
    setPhotoData(photoDataUrl);
    
    // Stop camera stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setVideoElement(null);
    }
  }, [videoElement, cameraStream]);

  const closeCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setVideoElement(null);
    }
    setPhotoData(null);
  }, [cameraStream]);

  const handleReschedule = useCallback(async () => {
    if (!selectedAssignment || !rescheduleDate || !rescheduleTime) {
      alert("Please select both date and time for rescheduling.");
      return;
    }

    try {
      setUpdating(selectedAssignment.id);
      
      const response = await fetch("/api/admin/driver/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          status: "rescheduled",
          notes: `Rescheduled to ${rescheduleDate} at ${rescheduleTime}. ${notes}`,
          photoUrl: photoData,
          photoType: `${selectedAssignment.assignmentType}_rescheduled_photo`,
        }),
      });

      if (response.ok) {
        await fetchAssignments();
        await fetchStats();
        setShowRescheduleModal(false);
        setSelectedAssignment(null);
        setPhotoData(null);
        setPhotoType("");
        setNotes("");
        setRescheduleDate("");
        setRescheduleTime("");
        closeCamera();
      }
    } catch (error) {
      console.error("Error rescheduling assignment:", error);
    } finally {
      setUpdating(null);
    }
  }, [selectedAssignment, rescheduleDate, rescheduleTime, notes, photoData, photoType, fetchAssignments, fetchStats, closeCamera]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "assigned": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "out_for_delivery": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "rescheduled": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "assigned": return <Clock className="w-4 h-4" />;
      case "in_progress": return <AlertCircle className="w-4 h-4" />;
      case "out_for_delivery": return <AlertCircle className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      case "rescheduled": return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  }, []);

  const getNextStatus = useCallback((currentStatus: string, assignmentType: string) => {
    if (assignmentType === "pickup") {
      switch (currentStatus) {
        case "assigned": return "in_progress";
        case "in_progress": return "completed";
        default: return currentStatus;
      }
    } else {
      // Delivery status flow
      switch (currentStatus) {
        case "assigned": return "out_for_delivery";
        case "out_for_delivery": return "delivered";
        case "delivered": return "delivered"; // Final state
        case "rescheduled": return "assigned"; // Reset to assigned after reschedule
        default: return currentStatus;
      }
    }
  }, []);

  const getStatusButtonText = useCallback((currentStatus: string, assignmentType: string) => {
    if (assignmentType === "pickup") {
      switch (currentStatus) {
        case "assigned": return "Start Pickup";
        case "in_progress": return "Mark Picked Up";
        default: return "Update Status";
      }
    } else {
      // Delivery status button text
      switch (currentStatus) {
        case "assigned": return "Start Delivery";
        case "out_for_delivery": return "Mark Delivered";
        case "delivered": return "Delivered";
        case "rescheduled": return "Start Delivery";
        default: return "Update Status";
      }
    }
  }, []);

  // Get today's assignments for display purposes
  const todayAssignments = useMemo(() => 
    assignments.filter(a => 
      new Date(a.estimatedTime || a.order.pickupTime).toDateString() === new Date().toDateString()
    ), [assignments]
  );

  // Pagination logic
  const totalPages = Math.ceil(assignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssignments = assignments.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (authLoading || loading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!adminUser || adminUser.role !== "DRIVER") {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {adminUser.firstName} {adminUser.lastName}
                </span>
                <button
                  onClick={() => router.push("/admin/login")}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Today's Assignments</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.totalAssignments || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.completedAssignments || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.pendingAssignments || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.completionRate.toFixed(1) || 0}%</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Assignment */}
            {stats && (stats.inProgressAssignments > 0 || stats.pendingAssignments > 0) && (
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Current Assignment</h2>
                {todayAssignments
                  .filter(a => a.status === "assigned" || a.status === "in_progress")
                  .slice(0, 1)
                  .map((assignment) => (
                    <div key={assignment.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-blue-900">
                            {assignment.assignmentType === "pickup" ? "Pickup" : "Delivery"} - {assignment.order.orderNumber}
                          </h3>
                          <p className="text-blue-700">
                            Customer: {assignment.order.customerFirstName} {assignment.order.customerLastName}
                          </p>
                          <p className="text-blue-700">
                            Address: {assignment.order.customerAddress}
                          </p>
                          <p className="text-sm text-blue-600 mt-2">
                            {assignment.assignmentType === "pickup" ? "Pickup" : "Delivery"} time: {
                              new Date(assignment.estimatedTime || assignment.order.pickupTime).toLocaleTimeString()
                            }
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setPhotoType(`${assignment.assignmentType}_${getNextStatus(assignment.status, assignment.assignmentType)}_photo`);
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            disabled={updating === assignment.id}
                          >
                            {updating === assignment.id ? "Updating..." : getStatusButtonText(assignment.status, assignment.assignmentType)}
                          </button>
                          {assignment.assignmentType === "delivery" && assignment.status !== "delivered" && (
                            <button 
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setShowRescheduleModal(true);
                              }}
                              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                              disabled={updating === assignment.id}
                            >
                              Reschedule
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedAssignment(assignment)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Today's Assignments */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Assignments</h2>
              <div className="space-y-4">
                {todayAssignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No assignments for today</p>
                ) : (
                  todayAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {assignment.assignmentType === "pickup" ? "Pickup" : "Delivery"} - {assignment.order.orderNumber}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                            {getStatusIcon(assignment.status)}
                            <span className="ml-1">{assignment.status.replace("_", " ")}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Customer: {assignment.order.customerFirstName} {assignment.order.customerLastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Address: {assignment.order.customerAddress}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(assignment.estimatedTime || assignment.order.pickupTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {assignment.status !== "completed" && assignment.status !== "delivered" && (
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setPhotoType(`${assignment.assignmentType}_${getNextStatus(assignment.status, assignment.assignmentType)}_photo`);
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            disabled={updating === assignment.id}
                          >
                            {updating === assignment.id ? "..." : "Update"}
                          </button>
                        )}
                        {assignment.assignmentType === "delivery" && assignment.status !== "delivered" && (
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowRescheduleModal(true);
                            }}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                            disabled={updating === assignment.id}
                          >
                            Reschedule
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* All Assignments */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">All Assignments</h2>
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, assignments.length)} of {assignments.length} assignments
                </div>
              </div>
              
              <div className="space-y-4">
                {assignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No assignments found</p>
                ) : (
                  currentAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {assignment.assignmentType === "pickup" ? "Pickup" : "Delivery"} - {assignment.order.orderNumber}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                            {getStatusIcon(assignment.status)}
                            <span className="ml-1">{assignment.status.replace("_", " ")}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Customer: {assignment.order.customerFirstName} {assignment.order.customerLastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Address: {assignment.order.customerAddress}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(assignment.estimatedTime || assignment.order.pickupTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {assignment.status !== "completed" && assignment.status !== "delivered" && (
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setPhotoType(`${assignment.assignmentType}_${getNextStatus(assignment.status, assignment.assignmentType)}_photo`);
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            disabled={updating === assignment.id}
                          >
                            {updating === assignment.id ? "..." : "Update"}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {assignments.length > itemsPerPage && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Assignment Details Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      {selectedAssignment.assignmentType === "pickup" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedAssignment.assignmentType === "pickup" ? "Pickup" : "Delivery"} Assignment
                      </h2>
                      <p className="text-blue-100">Order #{selectedAssignment.order.orderNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Status Badge */}
                <div className="mt-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAssignment.status)}`}>
                    {getStatusIcon(selectedAssignment.status)}
                    <span className="ml-2 capitalize">{selectedAssignment.status.replace("_", " ")}</span>
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
                <div className="p-6 space-y-6">
                  {/* Customer Information Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{selectedAssignment.order.customerFirstName} {selectedAssignment.order.customerLastName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{selectedAssignment.order.customerPhone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <MapPin className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{selectedAssignment.order.customerAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timing Information Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Timing Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Estimated Time</p>
                        <p className="font-medium">
                          {new Date(selectedAssignment.estimatedTime || selectedAssignment.order.pickupTime).toLocaleString()}
                        </p>
                      </div>
                      {selectedAssignment.actualTime && (
                        <div>
                          <p className="text-sm text-gray-500">Actual Time</p>
                          <p className="font-medium text-green-600">
                            {new Date(selectedAssignment.actualTime).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {selectedAssignment.order.specialInstructions && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Special Instructions</h3>
                      </div>
                      <p className="text-gray-700">{selectedAssignment.order.specialInstructions}</p>
                    </div>
                  )}

                  {/* Photos Section */}
                  {selectedAssignment.photos.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Camera className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Assignment Photos</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedAssignment.photos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.photoUrl}
                              alt={photo.photoType}
                              className="w-full h-32 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                                {photo.photoType.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              {new Date(photo.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Section */}
                  {selectedAssignment.status !== "completed" && selectedAssignment.status !== "delivered" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">Update Assignment</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this assignment..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => setShowPhotoModal(true)}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Take Photo</span>
                          </button>
                          
                          <button
                            onClick={() => updateAssignmentStatus(
                              selectedAssignment.id,
                              getNextStatus(selectedAssignment.status, selectedAssignment.assignmentType)
                            )}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                            disabled={updating === selectedAssignment.id}
                          >
                            {updating === selectedAssignment.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>{getStatusButtonText(selectedAssignment.status, selectedAssignment.assignmentType)}</span>
                              </>
                            )}
                          </button>
                          
                          {selectedAssignment.assignmentType === "delivery" && (
                            <button
                              onClick={() => setShowRescheduleModal(true)}
                              className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors shadow-sm"
                              disabled={updating === selectedAssignment.id}
                            >
                              <Calendar className="w-4 h-4" />
                              <span>Reschedule</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Capture Photo</h2>
                      <p className="text-blue-100 text-sm">Take a photo for this assignment</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPhotoModal(false)}
                    className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {!photoData ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-600 mb-4">
                        Click the button below to capture a photo for this assignment
                      </p>
                      <button
                        onClick={capturePhoto}
                        className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                      >
                        <Camera className="w-5 h-5 inline mr-2" />
                        Capture Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={photoData}
                        alt="Captured"
                        className="w-full h-64 object-cover rounded-lg shadow-sm border"
                      />
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ✓ Captured
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setPhotoData(null)}
                        className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-sm font-medium"
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retake
                      </button>
                      <button
                        onClick={() => {
                          if (selectedAssignment) {
                            updateAssignmentStatus(
                              selectedAssignment.id,
                              getNextStatus(selectedAssignment.status, selectedAssignment.assignmentType),
                              photoData
                            );
                          }
                        }}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                        disabled={updating === selectedAssignment?.id}
                      >
                        {updating === selectedAssignment?.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Save Photo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Reschedule Assignment</h2>
                      <p className="text-yellow-100 text-sm">Set a new date and time for this assignment</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setPhotoData(null);
                      setRescheduleDate("");
                      setRescheduleTime("");
                      setNotes("");
                      closeCamera();
                    }}
                    className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
                <div className="p-6 space-y-6">
                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        New Date
                      </label>
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={e => setRescheduleDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        New Time
                      </label>
                      <input
                        type="time"
                        value={rescheduleTime}
                        onChange={e => setRescheduleTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add any additional notes about the reschedule..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Photo Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Camera className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Photo (Required)</h3>
                    </div>
                    
                    {!photoData ? (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Camera className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-600 mb-4">
                          A photo is required when rescheduling an assignment
                        </p>
                        <button
                          onClick={openCamera}
                          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                        >
                          <Camera className="w-5 h-5 inline mr-2" />
                          Open Camera
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={photoData}
                            alt="Captured"
                            className="w-full h-48 object-cover rounded-lg shadow-sm border"
                          />
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            ✓ Photo Captured
                          </div>
                        </div>
                        <button
                          onClick={closeCamera}
                          className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-sm font-medium"
                        >
                          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Retake Photo
                        </button>
                      </div>
                    )}

                    {/* Live Video Preview */}
                    {videoElement && !photoData && (
                      <div className="mt-4">
                        <div className="w-full h-48 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                          <video
                            ref={el => {
                              if (el && videoElement && !el.srcObject) {
                                el.srcObject = videoElement.srcObject;
                                el.play();
                              }
                            }}
                            className="w-full h-48 object-cover"
                            autoPlay
                            playsInline
                            muted
                          />
                        </div>
                        <button
                          onClick={capturePhoto}
                          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium mt-3"
                        >
                          <Camera className="w-5 h-5 inline mr-2" />
                          Capture Photo
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleReschedule}
                    className="w-full bg-yellow-600 text-white py-4 rounded-lg hover:bg-yellow-700 transition-colors shadow-sm font-medium"
                    disabled={updating === selectedAssignment.id || !rescheduleDate || !rescheduleTime || !photoData}
                  >
                    {updating === selectedAssignment.id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                        Rescheduling...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5 inline mr-2" />
                        Submit Reschedule
                      </>
                    )}
                  </button>

                  {/* Validation Messages */}
                  {(!rescheduleDate || !rescheduleTime || !photoData) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-700">
                          Please fill in all required fields: Date, Time, and Photo
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}