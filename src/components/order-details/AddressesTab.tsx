interface Address {
  id: number;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  contactNumber?: string;
  googleAddress?: string;
  locationType?: string;
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
  address?: Address;
  pickupAddress?: Address;
  deliveryAddress?: Address;
  invoiceItems?: any[];
  items?: any[];
  processingDetails?: any;
}

const formatAddress = (address: Address): string => {
  if (!address) return 'Not specified';
  
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

// Component: Address Card
const AddressCard = ({ title, address, icon }: { title: string; address: Address; icon: string }) => {
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow'>
      <div className='flex items-center mb-4'>
        <span className='text-2xl mr-3'>{icon}</span>
        <h3 className='text-lg font-bold text-gray-900'>{title}</h3>
      </div>
      <div className='space-y-3'>
        <div className='p-3 bg-gray-50 rounded-lg'>
          <p className='font-semibold text-gray-900'>{address.label}</p>
        </div>
        <div className='p-3 bg-blue-50 rounded-lg'>
          <p className='text-gray-700'>{formatAddress(address)}</p>
        </div>
        {address.contactNumber && (
          <div className='p-3 bg-green-50 rounded-lg'>
            <p className='text-gray-700 font-medium'>📞 {address.contactNumber}</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface AddressesTabProps {
  orderDetails: OrderDetails;
}

export function AddressesTab({ orderDetails }: AddressesTabProps) {
  return (
    <div className='space-y-6'>
      {(orderDetails.pickupAddress || orderDetails.deliveryAddress) && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {orderDetails.pickupAddress && (
            <AddressCard title='Pickup Address' address={orderDetails.pickupAddress} icon='📤' />
          )}
          {orderDetails.deliveryAddress && (
            <AddressCard title='Delivery Address' address={orderDetails.deliveryAddress} icon='📥' />
          )}
        </div>
      )}

      {orderDetails.customerAddress && (
        <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>🏠</span>
            <h3 className='text-lg font-bold text-gray-900'>Customer Address</h3>
          </div>
          <div className='space-y-3'>
            <div className='p-4 bg-gray-50 rounded-lg'>
              <p className='text-gray-700'>{orderDetails.customerAddress}</p>
            </div>
            {orderDetails.customerPhone && (
              <div className='p-4 bg-blue-50 rounded-lg'>
                <p className='text-gray-700 font-medium'>📞 {orderDetails.customerPhone}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 