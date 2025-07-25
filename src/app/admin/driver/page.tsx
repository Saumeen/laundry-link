"use client";

<<<<<<< Updated upstream
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import PageTransition from "@/components/ui/PageTransition";
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { Camera, MapPin, Phone, User, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

// Google Maps configuration
const libraries: ("places")[] = ["places"];

// Default center for Bahrain
const defaultCenter = {
  lat: 26.0667,
  lng: 50.5577
};

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
=======
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverAuth } from '@/admin/hooks/useAdminAuth';
import { useDriverStore } from '@/admin/stores/driverStore';
import { StatsCard } from '@/admin/components/StatsCard';
import { QuickActionButton } from '@/admin/components/QuickActionButton';
import { DriverAssignments } from '@/admin/components/driver/DriverAssignments';
import { DriverStats } from '@/admin/components/driver/DriverStats';
>>>>>>> Stashed changes

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
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>("");
  const [cameraError, setCameraError] = useState<string>("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);

  // Google Maps state
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Get location coordinates for an assignment
  const getAssignmentLocation = useCallback((assignment: DriverAssignment) => {
    if (assignment.order.address?.latitude && assignment.order.address?.longitude) {
      return {
        lat: assignment.order.address.latitude,
        lng: assignment.order.address.longitude
      };
    }
    return defaultCenter;
  }, []);

  // Generate Google Maps link for an assignment
  const getGoogleMapsLink = useCallback((assignment: DriverAssignment) => {
    if (assignment.order.address?.latitude && assignment.order.address?.longitude) {
      return `https://www.google.com/maps?q=${assignment.order.address.latitude},${assignment.order.address.longitude}`;
    }
    // Fallback to address search if no coordinates
    const address = assignment.order.address?.addressLine1 || assignment.order.customerAddress || '';
    return `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!adminUser || adminUser.role !== "DRIVER") {
      router.push("/admin/login");
      return;
    }

    fetchAssignments();
    fetchStats();
  }, [adminUser, authLoading, router]);

  // Cleanup camera resources on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/driver/assignments");
      if (response.ok) {
        const data = await response.json();
        // Handle both formats: { assignments: [...] } and [...]
        if (data && typeof data === 'object') {
          if ('assignments' in data && Array.isArray(data.assignments)) {
            setAssignments(data.assignments);
          } else if (Array.isArray(data)) {
            setAssignments(data);
          } else {
            setAssignments([]);
          }
        } else {
          setAssignments([]);
        }
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
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
      // Handle error silently
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const savePhoto = useCallback(async (assignmentId: number, photoUrl: string, photoType: string) => {
    try {
      setUpdating(assignmentId);
      
      const response = await fetch("/api/admin/driver/photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          photoUrl,
          photoType,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        await fetchAssignments();
        setPhotoData(null);
        setPhotoType("");
        setNotes("");
        setShowPhotoModal(false);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setUpdating(null);
    }
  }, [fetchAssignments, notes]);

  const updateAssignmentStatus = useCallback(async (assignmentId: number, status: string, photoUrl?: string) => {
    try {
      setUpdating(assignmentId);
      setError(null);
      
      // Map assignment status to driver action
      let action: string;
      switch (status) {
        case 'STARTED':
          action = 'start_pickup';
          break;
        case 'COMPLETED':
          action = 'complete_pickup';
          break;
        case 'FAILED':
          action = 'fail_pickup';
          break;
        case 'DROPPED_OFF':
          action = 'drop_off';
          break;
        case 'DELIVERY_STARTED':
          action = 'start_delivery';
          break;
        case 'DELIVERY_COMPLETED':
          action = 'complete_delivery';
          break;
        case 'DELIVERY_FAILED':
          action = 'fail_delivery';
          break;
        default:
          action = 'start_pickup'; // fallback
      }

      // Get the order ID from the assignment
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        setError('Assignment not found');
        return;
      }

      const response = await fetch("/api/admin/driver/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: assignment.order.id,
          action: action as any,
          photoUrl,
          notes: notes || undefined,
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
      } else {
        const errorData = await response.json() as { error?: string };
        setError(errorData.error || 'Failed to update assignment');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setUpdating(null);
    }
  }, [fetchAssignments, fetchStats, notes, photoType, assignments]);

  const openCamera = useCallback(async () => {
    try {
      setCameraError("");
      
      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error("No cameras found on this device");
      }
      
      // Find rear camera (environment) or use first available
      let preferredCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      if (!preferredCamera) {
        preferredCamera = videoDevices[0]; // Fallback to first camera
      }
      
      setCurrentCameraId(preferredCamera.deviceId);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          deviceId: { exact: preferredCamera.deviceId },
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
      // Handle camera access error
      setCameraError("Unable to access camera. Please check camera permissions.");
      
      // Fallback to basic camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
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
        
        await new Promise((resolve) => {
          video.addEventListener("canplay", resolve, { once: true });
        });
        
        setCameraError("");
      } catch (fallbackError) {
        console.error("Fallback camera access failed:", fallbackError);
        setCameraError("Camera access failed. Please check permissions and try again.");
      }
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (availableCameras.length < 2) {
      setCameraError("Only one camera available");
      return;
    }
    
    try {
      setCameraError("");
      
      // Stop current stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      // Find next camera
      const currentIndex = availableCameras.findIndex(cam => cam.deviceId === currentCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextIndex];
      
      setCurrentCameraId(nextCamera.deviceId);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          deviceId: { exact: nextCamera.deviceId },
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
      console.error("Error switching camera:", error);
      setCameraError("Failed to switch camera");
    }
  }, [availableCameras, currentCameraId, cameraStream]);

  const getCurrentCameraLabel = useCallback(() => {
    if (!currentCameraId || availableCameras.length === 0) return "Camera";
    
    const currentCamera = availableCameras.find(cam => cam.deviceId === currentCameraId);
    if (!currentCamera) return "Camera";
    
    const label = currentCamera.label.toLowerCase();
    if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
      return "Rear Camera";
    } else if (label.includes('front') || label.includes('user')) {
      return "Front Camera";
    } else {
      return currentCamera.label || "Camera";
    }
  }, [currentCameraId, availableCameras]);

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
    setCameraError("");
    setCurrentCameraId("");
  }, [cameraStream]);



  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "ASSIGNED": return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      case "RESCHEDULED": return "bg-purple-100 text-purple-800";
      case "FAILED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "ASSIGNED": return <Clock className="w-4 h-4" />;
      case "IN_PROGRESS": return <AlertCircle className="w-4 h-4" />;
      case "COMPLETED": return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED": return <XCircle className="w-4 h-4" />;
      case "RESCHEDULED": return <Clock className="w-4 h-4" />;
      case "FAILED": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  }, []);

  const getNextStatus = useCallback((currentStatus: string, assignmentType: string) => {
    if (assignmentType === "pickup") {
      switch (currentStatus) {
        case "ASSIGNED": return "IN_PROGRESS";
        case "IN_PROGRESS": return "COMPLETED";
        default: return currentStatus;
      }
    } else {
      // Delivery status flow
      switch (currentStatus) {
        case "ASSIGNED": return "IN_PROGRESS";
        case "IN_PROGRESS": return "COMPLETED";
        case "COMPLETED": return "COMPLETED"; // Final state
        case "RESCHEDULED": return "ASSIGNED"; // Reset to assigned after reschedule
        default: return currentStatus;
      }
    }
  }, []);

  const getStatusButtonText = useCallback((currentStatus: string, assignmentType: string) => {
    if (assignmentType === "pickup") {
      switch (currentStatus) {
        case "ASSIGNED": return "Start Pickup";
        case "IN_PROGRESS": return "Mark Picked Up";
        default: return "Update Status";
      }
    } else {
      // Delivery status button text
      switch (currentStatus) {
        case "ASSIGNED": return "Start Delivery";
        case "IN_PROGRESS": return "Mark Delivered";
        case "COMPLETED": return "Delivered";
        case "RESCHEDULED": return "Start Delivery";
        default: return "Update Status";
      }
    }
  }, []);

  // Helper function to check if assignment is for today
  const isTodayAssignment = useCallback((assignment: DriverAssignment) => {
    if (!assignment.estimatedTime) return false;
    const today = new Date();
    const assignmentDate = new Date(assignment.estimatedTime);
    return today.toDateString() === assignmentDate.toDateString();
  }, []);

  // Filter assignments
  const todaysAssignments = useMemo(() => 
    assignments.filter(assignment => isTodayAssignment(assignment)), 
    [assignments, isTodayAssignment]
  );
  
  const otherAssignments = useMemo(() => 
    assignments.filter(assignment => !isTodayAssignment(assignment)), 
    [assignments, isTodayAssignment]
  );

  // Pagination calculations
  const totalPages = Math.ceil(otherAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssignments = otherAssignments.slice(startIndex, endIndex);

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Driver Dashboard</h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Welcome, {adminUser.firstName} {adminUser.lastName}
                </span>
                <span className="text-xs sm:text-sm text-gray-600 sm:hidden">
                  {adminUser.firstName}
                </span>
                <button
                  onClick={() => router.push("/admin/login")}
                  className="bg-red-600 text-white px-2 sm:px-4 py-2 rounded-md hover:bg-red-700 text-xs sm:text-sm"
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 sm:ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Today&apos;s Assignments</dt>
                        <dd className="text-base sm:text-lg font-medium text-gray-900">{stats?.totalAssignments || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-3 sm:ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Today's Tasks</dt>
                        <dd className="text-base sm:text-lg font-medium text-gray-900">{todaysAssignments.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <Clock className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-3 sm:ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Pending</dt>
                        <dd className="text-base sm:text-lg font-medium text-gray-900">{stats?.pendingAssignments || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 sm:ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                        <dd className="text-base sm:text-lg font-medium text-gray-900">{stats?.completionRate.toFixed(1) || 0}%</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => setError(null)}
                        className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Assignments */}
            {todaysAssignments.length > 0 && (
              <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Assignments</h2>
                <div className="space-y-3 sm:space-y-4">
                  {todaysAssignments.map((assignment) => (
                    <div key={assignment.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-blue-900 mb-2">
                            {assignment.assignmentType === "pickup" ? "Pickup" : "Delivery"} - {assignment.order.orderNumber}
                          </h3>
                          <div className="space-y-1 mb-3">
                            <p className="text-sm sm:text-base text-blue-700">
                              <span className="font-medium">Customer:</span> {assignment.order.customerFirstName} {assignment.order.customerLastName}
                            </p>
                            <p className="text-sm sm:text-base text-blue-700 truncate">
                              <span className="font-medium">Address:</span> {assignment.order.customerAddress}
                            </p>
                            <p className="text-xs sm:text-sm text-blue-600">
                              <span className="font-medium">Time:</span> {new Date(assignment.estimatedTime || assignment.order.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                          
                          {/* Compact Map for Current Assignment */}
                          {isLoaded && !loadError && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-700">Location</span>
                                </div>
                                <a
                                  href={getGoogleMapsLink(assignment)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open</span>
                                </a>
                              </div>
                              <div className="relative w-full h-32 border border-blue-200 rounded-lg overflow-hidden">
                                <GoogleMap
                                  mapContainerClassName="w-full h-full"
                                  center={getAssignmentLocation(assignment)}
                                  zoom={assignment.order.address?.latitude && assignment.order.address?.longitude ? 15 : 12}
                                  options={{
                                    zoomControl: false,
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: false,
                                  }}
                                >
                                  {assignment.order.address?.latitude && assignment.order.address?.longitude && (
                                    <Marker position={getAssignmentLocation(assignment)} />
                                  )}
                                </GoogleMap>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:flex-col lg:space-y-2 lg:space-x-0">
                          <button 
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setPhotoType(`${assignment.assignmentType}_${getNextStatus(assignment.status, assignment.assignmentType)}_photo`);
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
                            disabled={updating === assignment.id}
                          >
                            {updating === assignment.id ? "Updating..." : getStatusButtonText(assignment.status, assignment.assignmentType)}
                          </button>

                          <button 
                            onClick={() => setSelectedAssignment(assignment)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Assignments Message */}
            {assignments.length === 0 && !loading && (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Available</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any assignments at the moment. New assignments will appear here when they are assigned to you.
                </p>
                <button
                  onClick={() => {
                    fetchAssignments();
                    fetchStats();
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            )}

            {/* No Today's Assignments Message */}
            {assignments.length > 0 && todaysAssignments.length === 0 && !loading && (
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Today's Assignments</h2>
                    <p className="text-sm text-gray-600">No assignments scheduled for today</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      You have {otherAssignments.length} assignment{otherAssignments.length !== 1 ? 's' : ''} scheduled for other days.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Other Assignments */}
            {otherAssignments.length > 0 && (
              <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Other Assignments</h2>
                <div className="space-y-3 sm:space-y-4">
                  {otherAssignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {assignment.assignmentType === "pickup" ? "Pickup" : "Delivery"} - {assignment.order.orderNumber}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)} w-fit`}>
                              {getStatusIcon(assignment.status)}
                              <span className="ml-1 hidden sm:inline">{assignment.status.replace("_", " ")}</span>
                              <span className="ml-1 sm:hidden">{assignment.status.replace("_", " ").substring(0, 3)}</span>
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600 truncate">
                              <span className="font-medium">Customer:</span> {assignment.order.customerFirstName} {assignment.order.customerLastName}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              <span className="font-medium">Address:</span> {assignment.order.customerAddress}
                            </p>
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Time:</span> {new Date(assignment.estimatedTime || assignment.order.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          {assignment.status !== "COMPLETED" ? (
                            <button
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setPhotoType(`${assignment.assignmentType}_${getNextStatus(assignment.status, assignment.assignmentType)}_photo`);
                              }}
                              className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors w-full sm:w-auto"
                              disabled={updating === assignment.id}
                            >
                              {updating === assignment.id ? "..." : "Update"}
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedAssignment(assignment)}
                              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors w-full sm:w-auto"
                            >
                              View
                            </button>
                          )}
                          <button
                            onClick={() => window.open(getGoogleMapsLink(assignment), '_blank')}
                            className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors flex items-center justify-center space-x-1 w-full sm:w-auto"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Map</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination Controls for Other Assignments */}
            {otherAssignments.length > itemsPerPage && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Page Numbers - Simplified for mobile */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage <= 2) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
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
        </main>
      </div>

<<<<<<< Updated upstream
        {/* Assignment Details Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      {selectedAssignment.assignmentType === "pickup" ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold">
                        {selectedAssignment.assignmentType === "pickup" ? "Pickup" : "Delivery"} Assignment
                      </h2>
                      <p className="text-blue-100 text-sm sm:text-base">Order #{selectedAssignment.order.orderNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="w-6 h-6 sm:w-8 sm:h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Status Badge */}
                <div className="mt-3 sm:mt-4">
                  <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(selectedAssignment.status)}`}>
                    {getStatusIcon(selectedAssignment.status)}
                    <span className="ml-1 sm:ml-2 capitalize">{selectedAssignment.status.replace("_", " ")}</span>
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                    
                    {/* Location Map */}
                    {isLoaded && !loadError && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {selectedAssignment.assignmentType === 'pickup' ? 'Pickup' : 'Delivery'} Location
                              <span className="text-xs text-gray-500 ml-1">
                                {selectedAssignment.order.address?.latitude && selectedAssignment.order.address?.longitude ? '(Exact coordinates)' : '(Address search)'}
                              </span>
                            </span>
                          </div>
                          <a
                            href={getGoogleMapsLink(selectedAssignment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open in Maps</span>
                          </a>
                        </div>
                        
                        <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden">
                          <GoogleMap
                            mapContainerClassName="w-full h-full"
                            center={getAssignmentLocation(selectedAssignment)}
                            zoom={selectedAssignment.order.address?.latitude && selectedAssignment.order.address?.longitude ? 16 : 12}
                            options={{
                              zoomControl: true,
                              streetViewControl: false,
                              mapTypeControl: false,
                              fullscreenControl: false,
                            }}
                          >
                            {selectedAssignment.order.address?.latitude && selectedAssignment.order.address?.longitude && (
                              <Marker position={getAssignmentLocation(selectedAssignment)} />
                            )}
                          </GoogleMap>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          {selectedAssignment.order.address?.addressLine1 || selectedAssignment.order.customerAddress || 'Address not available'}
                        </div>
                      </div>
                    )}
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
                  {selectedAssignment.status !== "COMPLETED" && (
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
                      <p className="text-blue-100 text-sm">Take a photo for this assignment (status will not change)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPhotoModal(false);
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
              <div className="p-6">
                {!photoData ? (
                  <div className="space-y-4">
                    {/* Camera Error Display */}
                    {cameraError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700">{cameraError}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Camera Controls */}
                    {!videoElement ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Camera className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-600 mb-4">
                          Click the button below to open camera and capture a photo
                        </p>
                        <button
                          onClick={openCamera}
                          className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                        >
                          <Camera className="w-5 h-5 inline mr-2" />
                          Open Camera
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Camera Preview */}
                        <div className="relative">
                          <div className="w-full h-64 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                            <video
                              ref={el => {
                                if (el && videoElement && !el.srcObject) {
                                  el.srcObject = videoElement.srcObject;
                                  el.play();
                                }
                              }}
                              className="w-full h-64 object-cover"
                              autoPlay
                              playsInline
                              muted
                            />
                          </div>
                          
                          {/* Camera Info Overlay */}
                          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            {getCurrentCameraLabel()}
                          </div>
                          
                          {/* Camera Switch Button */}
                          {availableCameras.length > 1 && (
                            <button
                              onClick={switchCamera}
                              className="absolute top-2 right-2 bg-white bg-opacity-80 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition-colors"
                              title="Switch Camera"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        {/* Camera Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={closeCamera}
                            className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-sm font-medium"
                          >
                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Close Camera
                          </button>
                          <button
                            onClick={capturePhoto}
                            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                          >
                            <Camera className="w-4 h-4 inline mr-2" />
                            Capture Photo
                          </button>
                        </div>
                        
                        {/* Camera Info */}
                        {availableCameras.length > 0 && (
                          <div className="text-center text-xs text-gray-500">
                            {availableCameras.length} camera{availableCameras.length > 1 ? 's' : ''} available
                            {availableCameras.length > 1 && (
                              <span className="ml-2">
                                • Tap the switch button to change camera
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Helpful Note */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-700">
                              After saving the photo, use the "Update Status" button in the assignment details to change the assignment status.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
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
                        onClick={() => {
                          setPhotoData(null);
                          closeCamera();
                        }}
                        className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-sm font-medium"
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retake
                      </button>
                      <button
                        onClick={() => {
                          if (selectedAssignment && photoData) {
                            savePhoto(
                              selectedAssignment.id,
                              photoData,
                              photoType || `${selectedAssignment.assignmentType}_photo`
                            );
                          }
                        }}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                        disabled={updating === selectedAssignment?.id || !photoData}
                      >
                        {updating === selectedAssignment?.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Save Photo Only
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
    </PageTransition>
=======
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Quick Stats */}
        <div className='mb-8'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>
            Today&apos;s Overview (Bahrain Time)
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <StatsCard
              title='Total Assignments'
              value={stats?.totalAssignments || 0}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              }
              bgColor='bg-blue-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='Completed'
              value={stats?.completedAssignments || 0}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              }
              bgColor='bg-green-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='Pending'
              value={stats?.pendingAssignments || 0}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              }
              bgColor='bg-yellow-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='Completion Rate'
              value={`${stats?.completionRate.toFixed(1) || 0}%`}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                  />
                </svg>
              }
              bgColor='bg-purple-500'
              isLoading={statsLoading}
            />
          </div>
        </div>

        {/* Today's Assignments */}
        <div className='bg-white shadow rounded-lg mb-8'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-medium text-gray-900'>
                Today's Assignments (Bahrain Time)
              </h3>
              <button
                onClick={() => router.push('/admin/driver/map')}
                className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3'
                  />
                </svg>
                <span>View Map</span>
              </button>
            </div>
          </div>
          <div className='p-6'>
            <DriverAssignments />
          </div>
        </div>

      </div>
    </div>
>>>>>>> Stashed changes
  );
}