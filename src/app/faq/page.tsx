import React from 'react';

export default function FAQPage() {
  const faqs = [
    {
      question: 'How does the payment process work?',
      answer:
        "After your laundry is picked up and sorted, we'll send you an invoice with a payment link. You can pay securely online using your preferred payment method.",
    },
    {
      question: 'Which areas do you service?',
      answer:
        'We service all areas in Bahrain except Durra Albahrain, Zallaq, Areen, Jaw, and Askar.',
    },
    {
      question: 'How is pricing calculated?',
      answer:
        'For wash and fold services, pricing is calculated by weight (KG) with a 3 KG minimum. All other services are priced per item. You can view our complete price list on our pricing page.',
    },
    {
      question: 'What are your working hours?',
      answer:
        "We're open Saturday to Thursday from 09:00 to 00:00, and Friday from 10:00 to 22:00.",
    },
    {
      question: 'How long does it take to process my order?',
      answer:
        "Our standard service has a 24-hour turnaround time. We'll pick up your laundry and deliver it back to you within 24 hours.",
    },
    {
      question: 'Do you offer same-day service?',
      answer:
        'Yes, we offer same-day service for orders placed before 10:00 AM, subject to availability.',
    },
    {
      question: 'How do I track my order?',
      answer:
        "Once you place an order, you'll receive a tracking ID. You can use this ID on our tracking page or log in to your account to see real-time updates on your order status.",
    },
    {
      question: "What if I'm not home during pickup or delivery?",
      answer:
        "If you're not home during the scheduled pickup or delivery time, our driver will contact you. You can reschedule or provide instructions for safe pickup/delivery.",
    },
    {
      question: 'How do I schedule a pickup?',
      answer:
        "You can schedule a pickup through our website by clicking on the 'Schedule Pickup' button on the homepage, or by calling our customer service at +973 33440841.",
    },
    {
      question: 'What types of payment do you accept?',
      answer:
        'We accept credit/debit cards, mobile payment apps, and bank transfers.',
    },
  ];

  return (
    <div className='bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-extrabold text-gray-900 sm:text-4xl'>
            Frequently Asked Questions
          </h2>
          <p className='mt-4 text-lg text-gray-500'>
            Find answers to common questions about Laundry Link services
          </p>
        </div>

        <div className='mt-12'>
          <dl className='space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12'>
            {faqs.map(faq => (
              <div
                key={faq.question}
                className='bg-white p-6 rounded-lg shadow-md'
              >
                <dt className='text-lg leading-6 font-medium text-gray-900'>
                  {faq.question}
                </dt>
                <dd className='mt-2 text-base text-gray-500'>{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className='mt-12 bg-white shadow overflow-hidden rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg leading-6 font-medium text-gray-900'>
              Still have questions?
            </h3>
            <div className='mt-2 max-w-xl text-sm text-gray-500'>
              <p>
                If you couldn&apos;t find the answer to your question, please
                contact our customer support team.
              </p>
            </div>
            <div className='mt-5 flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-6 w-6 text-gray-400'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                  />
                </svg>
              </div>
              <div className='ml-3 text-sm text-gray-500'>
                <p>Phone: +973 33440841</p>
              </div>
            </div>
            <div className='mt-2 flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-6 w-6 text-gray-400'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <div className='ml-3 text-sm text-gray-500'>
                <p>Email: info@ovobh.com</p>
              </div>
            </div>
            <div className='mt-2 flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-6 w-6 text-gray-400'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
              </div>
              <div className='ml-3 text-sm text-gray-500'>
                <p>
                  Address: Juffair 341, Road 4101, Building 20, Shop 33, Bahrain
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
