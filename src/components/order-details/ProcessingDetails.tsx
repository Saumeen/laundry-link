interface ProcessingDetails {
  washType?: string;
  dryType?: string;
  specialInstructions?: string;
  fabricType?: string;
  stainTreatment?: string;
}

interface ProcessingDetailsProps {
  processingDetails?: ProcessingDetails;
}

export function ProcessingDetails({ processingDetails }: ProcessingDetailsProps) {
  if (!processingDetails) return null;
  
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
      <h3 className='text-xl font-bold text-gray-900 mb-6'>Processing Details</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {processingDetails.washType && (
          <div className='flex justify-between items-center p-3 bg-blue-50 rounded-lg'>
            <span className='text-sm font-medium text-blue-700'>Wash Type:</span>
            <span className='text-sm font-semibold text-blue-900'>{processingDetails.washType}</span>
          </div>
        )}
        {processingDetails.dryType && (
          <div className='flex justify-between items-center p-3 bg-green-50 rounded-lg'>
            <span className='text-sm font-medium text-green-700'>Dry Type:</span>
            <span className='text-sm font-semibold text-green-900'>{processingDetails.dryType}</span>
          </div>
        )}
        {processingDetails.fabricType && (
          <div className='flex justify-between items-center p-3 bg-purple-50 rounded-lg'>
            <span className='text-sm font-medium text-purple-700'>Fabric Type:</span>
            <span className='text-sm font-semibold text-purple-900'>{processingDetails.fabricType}</span>
          </div>
        )}
        {processingDetails.stainTreatment && (
          <div className='flex justify-between items-center p-3 bg-orange-50 rounded-lg'>
            <span className='text-sm font-medium text-orange-700'>Stain Treatment:</span>
            <span className='text-sm font-semibold text-orange-900'>{processingDetails.stainTreatment}</span>
          </div>
        )}
      </div>
    </div>
  );
} 