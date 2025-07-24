import { OrderStatus } from '@prisma/client';

// Professional status configuration with proper OrderStatus values
const STATUS_CONFIG = {
  [OrderStatus.ORDER_PLACED]: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-100',
    icon: '📋',
    description: 'Your order has been successfully placed and is awaiting confirmation',
    step: 1,
  },
  [OrderStatus.CONFIRMED]: {
    color: 'bg-green-50 text-green-700 border-green-200',
    bgColor: 'bg-green-100',
    icon: '✅',
    description: 'Your order has been confirmed and is being prepared for pickup',
    step: 2,
  },
  [OrderStatus.PICKUP_ASSIGNED]: {
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    bgColor: 'bg-purple-100',
    icon: '🚚',
    description: 'A driver has been assigned to pick up your items',
    step: 3,
  },
  [OrderStatus.PICKUP_IN_PROGRESS]: {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    bgColor: 'bg-orange-100',
    icon: '🔄',
    description: 'Driver is on the way to pick up your items',
    step: 4,
  },
  [OrderStatus.PICKUP_COMPLETED]: {
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    bgColor: 'bg-teal-100',
    icon: '📦',
    description: 'Your items have been successfully picked up',
    step: 5,
  },
  [OrderStatus.PICKUP_FAILED]: {
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-100',
    icon: '❌',
    description: 'Pickup was unsuccessful. We will contact you to reschedule',
    step: 0,
  },
  [OrderStatus.DROPPED_OFF]: {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bgColor: 'bg-indigo-100',
    icon: '🏢',
    description: 'Your items have been dropped off at our facility',
    step: 6,
  },
  [OrderStatus.RECEIVED_AT_FACILITY]: {
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    bgColor: 'bg-cyan-100',
    icon: '🏭',
    description: 'Your items have been received and are being sorted',
    step: 7,
  },
  [OrderStatus.PROCESSING_STARTED]: {
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    bgColor: 'bg-yellow-100',
    icon: '⚙️',
    description: 'Your items are being cleaned and processed',
    step: 8,
  },
  [OrderStatus.PROCESSING_COMPLETED]: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-100',
    icon: '✨',
    description: 'Processing is complete and items are ready for quality check',
    step: 9,
  },
  [OrderStatus.QUALITY_CHECK]: {
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    bgColor: 'bg-violet-100',
    icon: '🔍',
    description: 'Your items are undergoing quality inspection',
    step: 10,
  },
  [OrderStatus.READY_FOR_DELIVERY]: {
    color: 'bg-green-50 text-green-700 border-green-200',
    bgColor: 'bg-green-100',
    icon: '📦',
    description: 'Your items are ready for delivery',
    step: 11,
  },
  [OrderStatus.DELIVERY_ASSIGNED]: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-100',
    icon: '🚚',
    description: 'A driver has been assigned for delivery',
    step: 12,
  },
  [OrderStatus.DELIVERY_IN_PROGRESS]: {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    bgColor: 'bg-orange-100',
    icon: '🛵',
    description: 'Driver is on the way to deliver your items',
    step: 13,
  },
  [OrderStatus.DELIVERED]: {
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    bgColor: 'bg-gray-100',
    icon: '🎉',
    description: 'Your order has been successfully delivered',
    step: 14,
  },
  [OrderStatus.DELIVERY_FAILED]: {
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-100',
    icon: '❌',
    description: 'Delivery was unsuccessful. We will contact you to reschedule',
    step: 0,
  },
  [OrderStatus.CANCELLED]: {
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-100',
    icon: '🚫',
    description: 'This order has been cancelled',
    step: 0,
  },
  [OrderStatus.REFUNDED]: {
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-100',
    icon: '💰',
    description: 'This order has been refunded',
    step: 0,
  },
} as const;

interface OrderDetails {
  id: number;
  orderNumber: string;
  status: OrderStatus;
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

const getStatusConfig = (status: OrderStatus) => {
  return (
    STATUS_CONFIG[status] || {
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      bgColor: 'bg-gray-100',
      icon: '❓',
      description: 'Status unknown',
      step: 0,
    }
  );
};

interface StatusCardProps {
  orderDetails: OrderDetails;
}

export function StatusCard({ orderDetails }: StatusCardProps) {
  const statusConfig = getStatusConfig(orderDetails.status);
  
  return (
    <div className='bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 shadow-lg'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'>
        <div className='flex items-center space-x-3 sm:space-x-4'>
          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center ${statusConfig.bgColor} shadow-md flex-shrink-0`}>
            <span className='text-lg sm:text-2xl'>{statusConfig.icon}</span>
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='text-lg sm:text-xl font-bold text-gray-900 mb-2'>Order Status</h3>
            <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
              <span className={`inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full border-2 ${statusConfig.color} shadow-sm`}>
                {statusConfig.icon} {orderDetails.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className='text-xs sm:text-sm text-gray-600 mt-2 max-w-md'>{statusConfig.description}</p>
          </div>
        </div>
        <div className='sm:text-right'>
          <div className='bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200'>
            <p className='text-xl sm:text-3xl font-bold text-gray-900'>
              {orderDetails.invoiceTotal?.toFixed(3) || '0.000'} BD
            </p>
            <p className='text-xs sm:text-sm text-gray-600 font-medium'>Total Amount</p>
          </div>
        </div>
      </div>
    </div>
  );
} 