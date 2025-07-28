import { OrderStatus } from '@prisma/client';
import { ServiceItem } from './ServiceItem';

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

const isInvoiceReady = (status: OrderStatus): boolean => {
  switch (status) {
    case OrderStatus.PROCESSING_COMPLETED:
    case OrderStatus.QUALITY_CHECK:
    case OrderStatus.READY_FOR_DELIVERY:
    case OrderStatus.DELIVERY_ASSIGNED:
    case OrderStatus.DELIVERY_IN_PROGRESS:
    case OrderStatus.DELIVERED:
      return true;
    default:
      return false;
  }
};

interface InvoiceTabProps {
  orderDetails: OrderDetails;
  onDownload: () => void;
  onPrint: () => void;
  invoiceLoading: boolean;
}

export function InvoiceTab({
  orderDetails,
  onDownload,
  onPrint,
  invoiceLoading,
}: InvoiceTabProps) {
  const isReady = isInvoiceReady(orderDetails.status);

  return (
    <div className='space-y-6'>
      <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-bold text-gray-900'>Invoice Details</h3>
          {isReady && (
            <div className='flex space-x-3'>
              <button
                onClick={onPrint}
                className='px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm'
              >
                🖨️ Print
              </button>
              <button
                onClick={onDownload}
                disabled={invoiceLoading}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {invoiceLoading ? '⏳ Generating...' : '📥 Download PDF'}
              </button>
            </div>
          )}
        </div>

        {isReady ? (
          <>
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6'>
              <div className='grid grid-cols-3 gap-6 text-center'>
                <div className='bg-white rounded-lg p-4 shadow-sm'>
                  <div className='text-sm text-gray-600 font-medium'>
                    Invoice Total
                  </div>
                  <div className='font-bold text-2xl text-green-600'>
                    {orderDetails.invoiceTotal?.toFixed(3) || '0.000'} BD
                  </div>
                </div>
                <div className='bg-white rounded-lg p-4 shadow-sm'>
                  <div className='text-sm text-gray-600 font-medium'>
                    Services
                  </div>
                  <div className='font-bold text-2xl text-blue-600'>
                    {orderDetails.items?.length || 0}
                  </div>
                </div>
                <div className='bg-white rounded-lg p-4 shadow-sm'>
                  <div className='text-sm text-gray-600 font-medium'>Items</div>
                  <div className='font-bold text-2xl text-purple-600'>
                    {orderDetails.invoiceItems?.length || 0}
                  </div>
                </div>
              </div>
            </div>

            {orderDetails.invoiceItems &&
            orderDetails.invoiceItems.length > 0 ? (
              <div className='space-y-4'>
                {orderDetails.invoiceItems.map((item, index) => (
                  <ServiceItem
                    key={item?.id || index}
                    item={item}
                    isVerified={true}
                  />
                ))}
                <div className='mt-6 pt-4 border-t-2 border-gray-200'>
                  <div className='flex justify-between items-center bg-gradient-to-r from-gray-50 to-green-50 p-4 rounded-xl'>
                    <span className='text-xl font-bold text-gray-900'>
                      Total
                    </span>
                    <span className='text-2xl font-bold text-green-600'>
                      {orderDetails.invoiceTotal?.toFixed(3) || '0.000'} BD
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center py-16 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
                <div className='text-4xl mb-4'>📄</div>
                <p className='font-medium text-lg'>Invoice not yet generated</p>
                <p className='text-sm mt-2'>
                  Admin will generate the invoice once your order is processed
                </p>
              </div>
            )}
          </>
        ) : (
          <div className='text-center py-16 text-gray-500'>
            <div className='text-6xl mb-6'>📋</div>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>
              Invoice Not Ready Yet
            </h3>
            <p className='mb-8 text-lg'>
              Your invoice will be available once your order is ready for
              delivery.
            </p>
            <div className='bg-blue-50 border-2 border-blue-200 rounded-xl p-6 max-w-md mx-auto'>
              <p className='text-sm font-bold text-blue-800 mb-2'>
                Current Status: {orderDetails.status.replace(/_/g, ' ')}
              </p>
              <p className='text-sm text-blue-700'>
                You can view your items in the Services tab to verify everything
                is correct.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
