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
  processingDetails?: any;
}

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
};

interface OrderInformationProps {
  orderDetails: OrderDetails;
}

export function OrderInformation({ orderDetails }: OrderInformationProps) {
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
      <h3 className='text-xl font-bold text-gray-900 mb-6'>Order Information</h3>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Order Number:</span>
            <span className='text-sm font-bold text-gray-900'>#{orderDetails.orderNumber}</span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Order Date:</span>
            <span className='text-sm font-semibold text-gray-900'>
              {orderDetails.createdAt ? formatDate(orderDetails.createdAt) : 'N/A'}
            </span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Customer Phone:</span>
            <span className='text-sm font-semibold text-gray-900'>{orderDetails.customerPhone || 'N/A'}</span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Pickup Date:</span>
            <span className='text-sm font-semibold text-gray-900'>
              {orderDetails.pickupStartTime
                ? new Date(orderDetails.pickupStartTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>
        </div>
        <div className='space-y-4'>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Last Updated:</span>
            <span className='text-sm font-semibold text-gray-900'>
              {orderDetails.updatedAt ? formatDate(orderDetails.updatedAt) : 'N/A'}
            </span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Pickup Time:</span>
            <span className='text-sm font-semibold text-gray-900'>{orderDetails.pickupTimeSlot || 'N/A'}</span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Delivery Date:</span>
            <span className='text-sm font-semibold text-gray-900'>
              {orderDetails.deliveryStartTime
                ? new Date(orderDetails.deliveryStartTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Delivery Time:</span>
            <span className='text-sm font-semibold text-gray-900'>{orderDetails.deliveryTimeSlot || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 