import Image from 'next/image';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-600 sm:text-4xl brand-name">
            Laundry Link
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            NORMAL SERVICE (24HRS)
          </p>
          <p className="mt-1 max-w-2xl mx-auto text-lg text-gray-500 sm:mt-2 mb-8">
            الخدمة العادية (٢٤ ساعة)
          </p>
          <h2 className="text-3xl font-extrabold text-blue-600 sm:text-4xl mb-8 brand-name">
            PRICE LIST
          </h2>
          <p className="text-2xl text-blue-600 mb-12">
            قائمة الأسعار
          </p>
        </div>

        {/* Full price list image for mobile */}
        <div className="md:hidden mb-8">
          <Image 
            src="/images/pricing/price_list.jpg" 
            alt="Laundry Link Price List" 
            width={800} 
            height={1200}
            className="rounded-lg shadow-lg mx-auto"
          />
        </div>

        {/* Detailed price tables for desktop */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-8 mb-12">
            {/* IRON / PRESS */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-800 text-white text-center py-3 text-xl font-semibold">
                IRON / PRESS
              </div>
              <div className="p-6">
                <table className="min-w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">SHIRT / TSHIRT</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.300</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">THAWB</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.400</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">GHUTRA / SHMAGH</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.300</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">PANTS</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.300</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-left text-blue-800 font-medium">ABAYA</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.700</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* WASH AND IRON */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-800 text-white text-center py-3 text-xl font-semibold">
                WASH AND IRON
              </div>
              <div className="p-6">
                <table className="min-w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">SHIRT / TSHIRT</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.600</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">THAWB</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.800</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">GHUTRA / SHMAGH</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.500</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">PANTS</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.600</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">ABAYA</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.500</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-left text-blue-800 font-medium">SHORTS</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            {/* BEDDINGS */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-800 text-white text-center py-3 text-xl font-semibold">
                BEDDINGS
              </div>
              <div className="p-6">
                <table className="min-w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">BLANKET(S)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.500</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">BLANKET (D)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 2.300</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">BLANKET (K)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 2.900</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">BED SHEET(S)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.350</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">BED SHEET(B)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.750</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">PILLOW CASE</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.500</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">DUVET (S)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.750</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">DUVET (D)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 2.550</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">DUVET (K)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 3.500</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">DUVET CASE (S)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.500</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">DUVET CASE (K/D)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 2.500</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">PILLOW (S)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">PILLOW(B)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 2.000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">CARPET PER M2</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.300</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-left text-blue-800 font-medium">CURTAINS PER M2</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.950</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* DRY CLEAN */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-800 text-white text-center py-3 text-xl font-semibold">
                DRY CLEAN
              </div>
              <div className="p-6">
                <table className="min-w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">SHIRT / TSHIRT</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.900</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">THAWB</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.300</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">GHUTRA / SHMAGH</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.750</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">PANTS</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.900</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">ABAYA</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 2.000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">SHORTS</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.800</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">JACKET NORMAL</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 1.500</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">WINTER JACKET</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 3.000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">JACKET LEATHER</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 4.500</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">DRESS</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 2.000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">DELICATE DRESS</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 5.000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">TOWELS (S)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.300</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">TOWELS (M)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.500</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">TOWELS (L)</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.900</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">SKIRT</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.800</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-left text-blue-800 font-medium">GALABIYAH</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 2.000</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-left text-blue-800 font-medium">SCARF/ HIJAB</td>
                      <td className="py-3 text-right text-blue-800 font-medium">BD 0.900</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* WASH AND FOLD */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md mx-auto">
            <div className="bg-blue-800 text-white text-center py-3 text-xl font-semibold">
              WASH AND FOLD
            </div>
            <div className="p-6">
              <table className="min-w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 text-left text-blue-800 font-medium">MIX WASH /KG</td>
                    <td className="py-3 text-right text-blue-800 font-medium">BD 1.000</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-left text-blue-800 font-medium">SEPARATE WASH /KG</td>
                    <td className="py-3 text-right text-blue-800 font-medium">BD 1.500</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-2xl text-blue-800 font-bold">TEL: +973 33440841</p>
          <div className="mt-6">
            <Link 
              href="/schedule" 
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Schedule a Pickup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
