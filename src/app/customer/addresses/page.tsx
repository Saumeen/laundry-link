import { CustomerLayout } from '@/customer/components/CustomerLayout';

export default function CustomerAddressesPage() {
  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
          <p className="mt-2 text-gray-600">
            Manage your pickup and delivery addresses
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Address Management</h3>
            <p className="text-gray-600 mb-6">Manage your addresses for pickup and delivery</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Add New Address
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
} 