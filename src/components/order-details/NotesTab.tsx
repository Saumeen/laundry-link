interface ProcessingDetails {
  washType?: string;
  dryType?: string;
  specialInstructions?: string;
  fabricType?: string;
  stainTreatment?: string;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  status: any;
  invoiceTotal?: number;
  pickupStartTime: string;
  pickupEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  pickupTimeSlot?: string;
  deliveryTimeSlot?: string;
  createdAt: string;
  updatedAt: string;
  customerNotes?: string;
  customerPhone?: string;
  customerAddress?: string;
  specialInstructions?: string;
  address?: any;
  pickupAddress?: any;
  deliveryAddress?: any;
  invoiceItems?: any[];
  items?: any[];
  processingDetails?: ProcessingDetails;
}

interface NotesTabProps {
  orderDetails: OrderDetails;
}

export function NotesTab({ orderDetails }: NotesTabProps) {
  return (
    <div className='space-y-6'>
      {orderDetails.customerNotes && (
        <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>💬</span>
            <h3 className='text-lg font-bold text-gray-900'>Customer Notes</h3>
          </div>
          <div className='p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400'>
            <p className='text-gray-700 italic'>"{orderDetails.customerNotes}"</p>
          </div>
        </div>
      )}

      {orderDetails.processingDetails?.specialInstructions && (
        <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>⚠️</span>
            <h3 className='text-lg font-bold text-gray-900'>Special Instructions</h3>
          </div>
          <div className='p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400'>
            <p className='text-gray-700 font-medium'>{orderDetails.processingDetails.specialInstructions}</p>
          </div>
        </div>
      )}

      {!orderDetails.customerNotes && !orderDetails.processingDetails?.specialInstructions && (
        <div className='text-center py-16 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
          <div className='text-4xl mb-4'>📝</div>
          <p className='font-medium text-lg'>No notes or special instructions</p>
          <p className='text-sm mt-2'>No additional notes have been added to this order</p>
        </div>
      )}
    </div>
  );
} 