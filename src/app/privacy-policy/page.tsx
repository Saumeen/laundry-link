import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white text-center">
              Privacy Policy
            </h1>
            <p className="text-blue-100 text-center mt-2">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Laundry Link is a laundry service application that connects customers with professional laundry services in Bahrain. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our application and services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="text-gray-700 mb-3">We collect the following information to provide our laundry services:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Account Information:</strong> Full name, email address, phone number, and password</li>
                <li><strong>Address Information:</strong> Delivery and pickup addresses, including GPS coordinates when using location services</li>
                <li><strong>Order Information:</strong> Service preferences, special instructions, pickup and delivery schedules</li>
                <li><strong>Payment Information:</strong> Payment method preferences and transaction history</li>
                <li><strong>Device Information:</strong> Basic device information for app functionality</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Process and fulfill your laundry orders</li>
                <li>Coordinate pickup and delivery services</li>
                <li>Send order confirmations and status updates</li>
                <li>Provide customer support and resolve issues</li>
                <li>Manage your account and payment transactions</li>
                <li>Improve our services and user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Store and Protect Your Information</h2>
              <p className="text-gray-700 mb-3">We take the security of your information seriously:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your information is stored securely using industry-standard encryption</li>
                <li>All data transmission is encrypted using secure protocols</li>
                <li>Access to your data is restricted to authorized personnel only</li>
                <li>We regularly review and update our security practices</li>
                <li>We retain your information only as long as necessary for service provision</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing Policy</h2>
              <p className="text-gray-700 mb-4">
                <strong>We do not sell, rent, or trade your personal information to third parties.</strong>
              </p>
              <p className="text-gray-700 mb-3">We may share your information only in the following limited circumstances:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>With trusted service providers who assist us in payment processing and email delivery</li>
                <li>When required by law, court order, or government regulation</li>
                <li>With our delivery partners to fulfill your orders (limited to necessary information only)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Data Deletion</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Access your personal information stored in our system</li>
                <li>Update or correct your account information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt out of marketing communications</li>
              </ul>
              <p className="text-gray-700 mb-3">To request data deletion, please:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Contact us using the email address below</li>
                <li>Provide your account email address for verification</li>
                <li>Specify which data you want deleted</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800">
                  <strong>Note:</strong> Deleting your account will permanently remove your order history and wallet balance. Please ensure you have no pending orders or wallet funds before requesting deletion.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For privacy-related inquiries, data deletion requests, or questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> laundrylink2@gmail.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +973 33440841</p>
              </div>
              <p className="text-gray-700 mt-4">
                We will respond to your inquiry within 30 days of receipt.
              </p>
            </section>

            <div className="border-t pt-8 mt-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Laundry Link</h3>
                <p className="text-gray-600">Professional Laundry Services in Bahrain</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
