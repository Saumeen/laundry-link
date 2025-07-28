'use client';

import AddressSelector from '@/components/AddressSelector';
import { Address } from '@/types/schedule';

interface AddressSelectionProps {
  selectedAddressId: string;
  onAddressSelect: (addressId: string) => void;
  onAddressCreate: (newAddress: Address) => void;
}

export default function AddressSelection({
  selectedAddressId,
  onAddressSelect,
  onAddressCreate,
}: AddressSelectionProps) {
  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold text-gray-900'>
        Choose Pickup Address
      </h2>
      <p className='text-gray-600'>
        Select where you'd like us to pick up your laundry
      </p>

      <AddressSelector
        selectedAddressId={selectedAddressId}
        onAddressSelect={onAddressSelect}
        onAddressCreate={onAddressCreate}
        showCreateNew={true}
        label='Select Pickup Address'
        required={true}
        className='mt-4'
      />
    </div>
  );
}
