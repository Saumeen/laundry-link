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

export function ProcessingDetails({
  processingDetails,
}: ProcessingDetailsProps) {
  if (!processingDetails) return null;

  const hasAnyDetails =
    processingDetails.washType ||
    processingDetails.dryType ||
    processingDetails.fabricType ||
    processingDetails.stainTreatment ||
    processingDetails.specialInstructions;

  if (!hasAnyDetails) return null;

  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
          <svg
            className='w-4 h-4 text-blue-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
            />
          </svg>
        </div>
        <h3 className='text-xl font-bold text-gray-900'>Processing Details</h3>
      </div>

      <div className='space-y-4'>
        {processingDetails.washType && (
          <div className='flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200'>
            <div className='w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-blue-700 mb-1'>
                Wash Type
              </p>
              <p className='text-base font-semibold text-blue-900'>
                {processingDetails.washType}
              </p>
            </div>
          </div>
        )}

        {processingDetails.dryType && (
          <div className='flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200'>
            <div className='w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                />
              </svg>
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-green-700 mb-1'>
                Dry Type
              </p>
              <p className='text-base font-semibold text-green-900'>
                {processingDetails.dryType}
              </p>
            </div>
          </div>
        )}

        {processingDetails.fabricType && (
          <div className='flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200'>
            <div className='w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z'
                />
              </svg>
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-purple-700 mb-1'>
                Fabric Type
              </p>
              <p className='text-base font-semibold text-purple-900'>
                {processingDetails.fabricType}
              </p>
            </div>
          </div>
        )}

        {processingDetails.stainTreatment && (
          <div className='flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200'>
            <div className='w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-orange-700 mb-1'>
                Stain Treatment
              </p>
              <p className='text-base font-semibold text-orange-900'>
                {processingDetails.stainTreatment}
              </p>
            </div>
          </div>
        )}

        {processingDetails.specialInstructions && (
          <div className='flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200'>
            <div className='w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-700 mb-1'>
                Special Instructions
              </p>
              <p className='text-base text-gray-900 leading-relaxed'>
                {processingDetails.specialInstructions}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
