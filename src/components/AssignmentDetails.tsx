"use client";

import { useState } from "react";
import { MapPin, Phone, User, Clock, Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import PhotoCapture from "./PhotoCapture";

interface AssignmentDetailsProps {
  assignment: {
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
  };
  onClose: () => void;
  onUpdateStatus: (assignmentId: number, status: string, photoUrl?: string) => void;
  updating: boolean;
}

export default function AssignmentDetails({ 
  assignment, 
  onClose, 
  onUpdateStatus, 
  updating 
}: AssignmentDetailsProps) {
  const [notes, setNotes] = useState("");
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "rescheduled": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned": return <Clock className="w-4 h-4" />;
      case "in_progress": return <AlertCircle className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getNextStatus = (currentStatus: string, assignmentType: string) => {
    if (assignmentType === "pickup") {
      switch (currentStatus) {
        case "assigned": return "in_progress";
        case "in_progress": return "completed";
        default: return currentStatus;
      }
    } else {
      switch (currentStatus) {
        case "assigned": return "in_progress";
        case "in_progress": return "completed";
        default: return currentStatus;
      }
    }
  };

  const getStatusButtonText = (currentStatus: string, assignmentType: string) => {
    if (assignmentType === "pickup") {
      switch (currentStatus) {
        case "assigned": return "Start Pickup";
        case "in_progress": return "Mark Picked Up";
        default: return "Update Status";
      }
    } else {
      switch (currentStatus) {
        case "assigned": return "Start Delivery";
        case "in_progress": return "Mark Delivered";
        default: return "Update Status";
      }
    }
  };

  const handlePhotoCapture = (photoDataUrl: string) => {
    setPhotoData(photoDataUrl);
    setShowPhotoCapture(false);
  };

  const handleUpdateStatus = () => {
    const nextStatus = getNextStatus(assignment.status, assignment.assignmentType);
    onUpdateStatus(assignment.id, nextStatus, photoData || undefined);
  };

  const handleReschedule = () => {
    onUpdateStatus(assignment.id, "rescheduled");
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold">
              {assignment.assignmentType === "pickup" ? "Pickup" : "Delivery"} Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order #:</span> {assignment.order.orderNumber}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {assignment.assignmentType}
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                    {getStatusIcon(assignment.status)}
                    <span className="ml-1">{assignment.status.replace("_", " ")}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{assignment.order.customerFirstName} {assignment.order.customerLastName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${assignment.order.customerPhone}`} className="text-blue-600 hover:underline">
                    {assignment.order.customerPhone}
                  </a>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p>{assignment.order.customerAddress}</p>
                    {assignment.order.address && (
                      <div className="text-sm text-gray-600 mt-1">
                        {assignment.order.address.building && <span>Building: {assignment.order.address.building}</span>}
                        {assignment.order.address.floor && <span className="ml-2">Floor: {assignment.order.address.floor}</span>}
                        {assignment.order.address.apartment && <span className="ml-2">Apt: {assignment.order.address.apartment}</span>}
                        {assignment.order.address.landmark && <span className="ml-2">Landmark: {assignment.order.address.landmark}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timing Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Timing</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    <span className="font-medium">Estimated:</span> {
                      new Date(assignment.estimatedTime || assignment.order.pickupTime).toLocaleString()
                    }
                  </span>
                </div>
                {assignment.actualTime && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>
                      <span className="font-medium">Actual:</span> {
                        new Date(assignment.actualTime).toLocaleString()
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            {assignment.order.specialInstructions && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
                <p className="text-gray-600">{assignment.order.specialInstructions}</p>
              </div>
            )}

            {/* Photos */}
            {assignment.photos.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Photos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {assignment.photos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <img
                        src={photo.photoUrl}
                        alt={photo.photoType}
                        className="w-full h-32 object-cover rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">{photo.photoType}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(photo.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {assignment.status !== "completed" && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes (optional)"
                  className="w-full p-3 border rounded-lg mb-4 resize-none"
                  rows={3}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowPhotoCapture(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </button>
                  
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {getStatusButtonText(assignment.status, assignment.assignmentType)}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReschedule}
                    disabled={updating}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    Reschedule
                  </button>

                  <button
                    onClick={onClose}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PhotoCapture
        isOpen={showPhotoCapture}
        onCapture={handlePhotoCapture}
        onCancel={() => setShowPhotoCapture(false)}
      />
    </>
  );
} 