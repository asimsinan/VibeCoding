export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-6">
              By accessing and using Dilenci, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Use License</h2>
            <p className="text-gray-600 mb-6">
              Permission is granted to temporarily use Dilenci for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Campaign Guidelines</h2>
            <p className="text-gray-600 mb-6">
              All campaigns must comply with applicable laws and regulations. Users are responsible for ensuring their campaigns are legitimate and lawful.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. User Responsibilities</h2>
            <p className="text-gray-600 mb-6">
              Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-600 mb-6">
              In no event shall Dilenci or its suppliers be liable for any damages arising out of the use or inability to use the materials on Dilenci.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Modifications</h2>
            <p className="text-gray-600 mb-6">
              Dilenci may revise these terms of service at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms.
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
