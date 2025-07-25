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

interface OrderTimelineProps {
  orderDetails: OrderDetails;
}

export function OrderTimeline({ orderDetails }: OrderTimelineProps) {
  const currentStep = getStatusConfig(orderDetails.status).step;
  const totalSteps = 14;
  
  // Simplified timeline steps - showing only key milestones
  const timelineSteps = [
    { step: 1, title: 'Order Placed', icon: '📋' },
    { step: 3, title: 'Pickup Assigned', icon: '🚚' },
    { step: 5, title: 'Picked Up', icon: '📦' },
    { step: 8, title: 'Processing', icon: '⚙️' },
    { step: 10, title: 'Quality Check', icon: '🔍' },
    { step: 12, title: 'Delivery Assigned', icon: '🚚' },
    { step: 14, title: 'Delivered', icon: '🎉' },
  ];

  return (
    <div className='bg-white border border-gray-200 rounded-xl p-4 shadow-sm'>
      <h3 className='text-lg font-bold text-gray-900 mb-4'>Order Progress</h3>
      
      {/* Progress Bar */}
      <div className='mb-4'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-sm font-medium text-gray-700'>Progress</span>
          <span className='text-sm text-gray-500'>{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div 
            className='h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500'
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Compact Timeline */}
      <div className='space-y-3'>
        {timelineSteps.map((step, index) => {
          const isCompleted = step.step <= currentStep;
          const isCurrent = step.step === currentStep;
          
          return (
            <div key={step.step} className='flex items-center space-x-3'>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                  : isCurrent
                  ? 'bg-blue-500 border-blue-500 text-white shadow-sm animate-pulse'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? (
                  <span className='text-sm'>✓</span>
                ) : (
                  <span className='text-xs'>{step.icon}</span>
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <h4 className={`text-sm font-medium ${
                  isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {step.title}
                </h4>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Status Highlight */}
      <div className='mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
        <div className='flex items-center space-x-2'>
          <span className='text-blue-600 text-lg'>
            {getStatusConfig(orderDetails.status).icon}
          </span>
          <div>
            <p className='text-sm font-medium text-blue-900'>
              Current Status: {orderDetails.status.replace(/_/g, ' ')}
            </p>
            <p className='text-xs text-blue-700'>
              {getStatusConfig(orderDetails.status).description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 