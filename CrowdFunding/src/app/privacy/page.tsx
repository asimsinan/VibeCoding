export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 mb-6">
              We collect information you provide directly to us, such as when you create an account, create a campaign, or make a donation.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 mb-6">
              We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Information Sharing</h2>
            <p className="text-gray-600 mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Data Security</h2>
            <p className="text-gray-600 mb-6">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Cookies</h2>
            <p className="text-gray-600 mb-6">
              We use cookies and similar technologies to enhance your experience on our platform and to analyze how our services are used.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-6">
              You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Changes to This Policy</h2>
            <p className="text-gray-600 mb-6">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
