interface OrderItem {
  id: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface ServiceItemProps {
  item: OrderItem;
  isVerified?: boolean;
}

export function ServiceItem({ item, isVerified = false }: ServiceItemProps) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
      isVerified 
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className='flex-1'>
        <div className='flex items-center space-x-2'>
          <p className='font-semibold text-gray-900'>{item.serviceName}</p>
          {isVerified && (
            <span className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium'>
              Verified
            </span>
          )}
        </div>
        {item.notes && (
          <p className='text-sm text-gray-600 mt-1 italic'>"{item.notes}"</p>
        )}
      </div>
    </div>
  );
} 