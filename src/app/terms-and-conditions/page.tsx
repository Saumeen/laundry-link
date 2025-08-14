import React from 'react';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white text-center">
              Terms and Conditions
            </h1>
            <p className="text-blue-100 text-center mt-2">
              Laundry Link, officially registered as TOP LINK LAUNDRY W.L.L
            </p>
            <p className="text-blue-100 text-center mt-1">
              Effective as of 1st August 2025
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. The Contract</h2>
              <p className="text-gray-700 mb-3">
                These Terms apply to any Order we accept from you via our website (laundrylink.net), mobile app, SMS, or any other platform. By placing an Order, you agree to these Terms. If you do not accept them, please do not place an Order.
              </p>
              <p className="text-gray-700 mb-3">
                These Terms may change occasionally. We will notify you of changes by email. The current version of the Terms will apply to each Order.
              </p>
              <p className="text-gray-700 mb-3">
                Minimum order value is 4.00 BHD. Orders below this amount will still be charged at 4.00 BHD.
              </p>
              <p className="text-gray-700">
                To contact us about an order, see Section 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definitions</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>App:</strong> Laundry Link's website and mobile application</li>
                <li><strong>Event Outside Our Control:</strong> Anything we cannot reasonably control (see Section 12)</li>
                <li><strong>Item:</strong> Any garment or article collected in connection with an Order</li>
                <li><strong>Order:</strong> Your request for our Services</li>
                <li><strong>Services:</strong> Laundry and dry-cleaning services picked up and delivered to you</li>
                <li><strong>Service Providers:</strong> Third parties we engage to help provide our Services</li>
                <li><strong>We/Us/Our:</strong> Laundry Link, officially registered as TOP LINK LAUNDRY W.L.L</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Placing an Order</h2>
              <p className="text-gray-700 mb-3">
                Check all details before submitting. You are responsible for errors. A contract is only formed when we confirm your Order by email.
              </p>
              <p className="text-gray-700 mb-3">
                We will assign you an order number. Refer to it in all communication.
              </p>
              <p className="text-gray-700">
                If we cannot fulfill your Order, we will notify you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Changes to Your Order</h2>
              <p className="text-gray-700 mb-3">
                You can modify an Order before the scheduled collection time by contacting +973 33440841 By whatsapp message.
              </p>
              <p className="text-gray-700">
                We may also offer to modify an Order with your approval.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cancelling or Rescheduling</h2>
              <p className="text-gray-700 mb-3">You may cancel an Order:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Before the scheduled collection time</li>
                <li>After collection, if an Event Outside Our Control occurs</li>
              </ul>
              <p className="text-gray-700 mb-3">
                Once we have collected your Items, cancellation rights no longer apply.
              </p>
              <p className="text-gray-700">
                Rescheduling within 2 hours of the time slot or outside office hours (9am–9pm, weekdays) may incur fees.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Our Right to Cancel</h2>
              <p className="text-gray-700 mb-3">We may cancel an Order if:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>An Event Outside Our Control occurs</li>
                <li>Items are not available for collection</li>
                <li>Items are damaged, unidentifiable, or unserviceable</li>
              </ul>
              <p className="text-gray-700">
                We will notify you and return any collected Items.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Collection & Redelivery</h2>
              <p className="text-gray-700 mb-3">
                We aim to collect and deliver on time but cannot guarantee this. Missed deliveries may incur a 2.00 BHD redelivery fee.
              </p>
              <p className="text-gray-700 mb-3">
                If an item is unclaimed for 30+ days, we may dispose of it or donate it to charity.
              </p>
              <p className="text-gray-700 mb-3">
                You may authorize third-party pickup/delivery, or request drop-off without acknowledgment at your own risk.
              </p>
              <p className="text-gray-700">
                You must provide us with reasonable access for pickup/delivery.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Standards</h2>
              <p className="text-gray-700 mb-3">
                We provide Services with reasonable skill and care. We are not liable for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Incorrect address info</li>
                <li>Items with:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Missing labels</li>
                    <li>Pre-existing damage</li>
                    <li>Special cleaning needs not specified</li>
                    <li>Hazardous contents</li>
                  </ul>
                </li>
              </ul>
              <p className="text-gray-700">
                We may accept Items at your risk with your consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Wash & Fold</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>All garments should be checked for objects before pickup</li>
                <li>We wash at 30°C and tumble dry on medium heat</li>
                <li>Items are weighed; minimum is 6kg</li>
                <li>No ironing included</li>
                <li>Color separation is done, but we are not liable for bleeding</li>
                <li>Items are tagged per load, not individually</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Complaints</h2>
              <p className="text-gray-700">
                Report complaints to +97333440841 within 24 hours of redelivery. We will re-clean valid issues at no charge. Requests after 24 hours are handled case by case.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Price & Payment</h2>
              <p className="text-gray-700 mb-3">
                Prices are listed on our website and app. Prices include VAT unless stated otherwise.
              </p>
              <p className="text-gray-700 mb-3">
                We reserve the right to charge a service fee, shown at checkout.
              </p>
              <p className="text-gray-700">
                Payment is taken after your Order is received and processed. If payment fails, interest may apply (3% above Bahrain's base rate).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Our Liability</h2>
              <p className="text-gray-700 mb-3">
                Our maximum liability per Item is 5.00 BHD, with valid proof of purchase, and capped at 10x the cleaning fee.
              </p>
              <p className="text-gray-700 mb-3">We are not liable for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Missing labels</li>
                <li>Pre-treated garments</li>
                <li>Accessories left on clothing</li>
                <li>Incorrect washing instructions</li>
                <li>Normal wear and tear</li>
                <li>Bleeding, shrinking, or fading</li>
              </ul>
              <p className="text-gray-700">
                We recommend insurance for high-value Items.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Email (Support): support@laundrylink.net</li>
                <li>Website: www.laundrylink.net</li>
                <li>Whatsapp +973 33440841</li>
              </ul>
              <p className="text-gray-700">
                All notices will be in writing, via email or app notification.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Use of Personal Data</h2>
              <p className="text-gray-700 mb-3">We use your personal data to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Provide our Services</li>
                <li>Process payments</li>
                <li>Communicate promotions (unless opted out)</li>
              </ul>
              <p className="text-gray-700">
                We do not sell your data. See our Privacy Policy for details.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Vouchers and Promotions</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>One voucher per transaction</li>
                <li>Minimum Order with voucher is 4.00 BHD</li>
                <li>Vouchers are non-transferable, non-refundable, and subject to expiry</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Legal Terms</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>We may transfer rights to another party</li>
                <li>Each clause stands independently</li>
                <li>Bahraini law governs these Terms</li>
              </ul>
            </section>

            <div className="border-t pt-8 mt-8">
              <div className="text-center">
                <p className="text-gray-700 font-semibold">
                  By using Laundry Link, you agree to these Terms and Conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
