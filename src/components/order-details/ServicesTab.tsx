import { ServiceItem } from './ServiceItem';

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

interface ServicesTabProps {
  orderDetails: OrderDetails;
}

export function ServicesTab({ orderDetails }: ServicesTabProps) {
  return (
    <div className='space-y-6'>
      <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
        <h3 className='text-xl font-bold text-gray-900 mb-6'>Selected Services</h3>
        
        {/* Original services */}
        <div className='mb-8'>
          <h4 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
            <span className='mr-2'>🧺</span>
            Services Requested
          </h4>
          <div className='space-y-4'>
            {orderDetails.items?.map((item, index) => (
              <ServiceItem key={item?.id || index} item={item} />
            ))}
            {(!orderDetails.items || orderDetails.items.length === 0) && (
              <div className='text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
                <div className='text-4xl mb-4'>🧺</div>
                <p className='font-medium text-lg'>No services selected</p>
                <p className='text-sm mt-2'>No services have been selected for this order</p>
              </div>
            )}
          </div>
        </div>

        {/* Verified items */}
        {orderDetails.invoiceItems && orderDetails.invoiceItems.length > 0 && (
          <div className='border-t-2 border-gray-200 pt-8'>
            <h4 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
              <span className='mr-2'>✅</span>
              Items Found & Sorted
              <span className='ml-3 px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-bold'>
                VERIFIED
              </span>
            </h4>
            <div className='space-y-4'>
              {orderDetails.invoiceItems.map((item, index) => (
                <ServiceItem key={item?.id || index} item={item} isVerified={true} />
              ))}
            </div>
            <div className='mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl'>
              <div className='flex items-start space-x-3'>
                <span className='text-xl'>⚠️</span>
                <div>
                  <p className='text-sm font-semibold text-yellow-800 mb-1'>Important Notice</p>
                  <p className='text-sm text-yellow-700'>
                    Please verify that all your items are listed above. Contact us immediately if you notice any missing or incorrect items.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No verified items yet */}
        {(!orderDetails.invoiceItems || orderDetails.invoiceItems.length === 0) && (
          <div className='border-t-2 border-gray-200 pt-8'>
            <div className='text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
              <div className='text-4xl mb-4'>⏳</div>
              <p className='font-medium text-lg'>Items being sorted</p>
              <p className='text-sm mt-2 max-w-md mx-auto'>
                Our team is currently sorting and counting your items. You'll see the detailed list here once processing begins.
              </p>
            </div>
          </div>
        )}

        <div className='mt-8 pt-6 border-t-2 border-gray-200'>
          <div className='flex justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl'>
            <span className='text-xl font-bold text-gray-900'>Total Amount</span>
            <span className='text-2xl font-bold text-blue-600'>
              {orderDetails.invoiceTotal?.toFixed(3) || '0.000'} BD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 