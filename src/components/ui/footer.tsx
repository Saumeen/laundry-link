'use client';

import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className='bg-gray-800 text-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          <div className='md:col-span-1'>
            <div className='flex items-center'>
              
              <span className='text-xl font-bold'>Laundry Link</span>
            </div>
            <p className='mt-4 text-sm text-gray-300'>
              Your trusted laundry service in Bahrain. We provide quality
              laundry and dry cleaning with free pickup and delivery.
            </p>
            <Logo width={120} height={120} className='m-auto' src='/laundry-link-logo.png' />
          </div>

          <div>
            <h3 className='text-sm font-semibold text-gray-300 tracking-wider uppercase'>
              Services
            </h3>
            <ul className='mt-4 space-y-2'>
              <li>
                <Link
                  href='/services'
                  className='text-base text-gray-300 hover:text-white'
                >
                  Wash & Fold
                </Link>
              </li>
              <li>
                <Link
                  href='/services'
                  className='text-base text-gray-300 hover:text-white'
                >
                  Dry Cleaning
                </Link>
              </li>
              <li>
                <Link
                  href='/services'
                  className='text-base text-gray-300 hover:text-white'
                >
                  Ironing
                </Link>
              </li>
              <li>
                <Link
                  href='/services'
                  className='text-base text-gray-300 hover:text-white'
                >
                  Express Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-gray-300 tracking-wider uppercase'>
              Company
            </h3>
            <ul className='mt-4 space-y-2'>
              <li>
                <Link
                  href='/about'
                  className='text-base text-gray-300 hover:text-white'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href='/services'
                  className='text-base text-gray-300 hover:text-white'
                >
                  Our Services
                </Link>
              </li>
              <li>
                <Link
                  href='/schedule'
                  className='text-base text-gray-300 hover:text-white'
                >
                  Schedule Pickup
                </Link>
              </li>
              <li>
                <Link
                  href='/tracking'
                  className='text-base text-gray-300 hover:text-white'
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-gray-300 tracking-wider uppercase'>
              Contact
            </h3>
            <ul className='mt-4 space-y-2'>
              <li className='flex items-start'>
                <svg
                  className='h-6 w-6 text-gray-400 mr-2'
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
                <span className='text-gray-300'>
                  Juffair 341, Road 4101, Building 20, Shop 33, Bahrain
                </span>
              </li>
              <li className='flex items-start'>
                <svg
                  className='h-6 w-6 text-gray-400 mr-2'
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
                <span className='text-gray-300'>+973 33440841</span>
              </li>
              <li className='flex items-start'>
                <svg
                  className='h-6 w-6 text-gray-400 mr-2'
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
                <span className='text-gray-300'>info@ovobh.com</span>
              </li>
              <li className='flex items-start'>
                <svg
                  className='h-6 w-6 text-gray-400 mr-2'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <div className='text-gray-300'>
                  <p>Saturday - Thursday: 09:00 - 00:00</p>
                  <p>Friday: 10:00 - 22:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-8 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between'>
          <div className='flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6'>
            <p className='text-base text-gray-400'>
              &copy; {new Date().getFullYear()} Laundry Link. All rights reserved.
              Subsidiary of OVO W.L.L
            </p>
            <Link
              href='/privacy-policy'
              className='text-base text-gray-400 hover:text-gray-300'
            >
              Privacy Policy
            </Link>
            <Link
              href='/terms-and-conditions'
              className='text-base text-gray-400 hover:text-gray-300'
            >
              Terms & Conditions
            </Link>
          </div>
          <div className='flex space-x-6 mt-4 md:mt-0'>
            <a href='#' className='text-gray-400 hover:text-gray-300'>
              <span className='sr-only'>Facebook</span>
              <svg
                className='h-6 w-6'
                fill='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  d='M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z'
                  clipRule='evenodd'
                />
              </svg>
            </a>
            <a href='#' className='text-gray-400 hover:text-gray-300'>
              <span className='sr-only'>Instagram</span>
              <svg
                className='h-6 w-6'
                fill='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  d='M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z'
                  clipRule='evenodd'
                />
              </svg>
            </a>
            <a href='#' className='text-gray-400 hover:text-gray-300'>
              <span className='sr-only'>WhatsApp</span>
              <svg
                className='h-6 w-6'
                fill='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
