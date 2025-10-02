// Terms Page
// Terms of service page

import React from 'react';
import { Card } from '../../components/ui/Card/Card';

export default function TermsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      
      <div className="max-w-4xl mx-auto">
        <Card title="Acceptance of Terms" className="mb-8">
          <p className="text-gray-600">
            By accessing and using our platform, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </Card>

        <Card title="Use License" className="mb-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Permitted Use</h3>
              <p className="text-gray-600">
                You may use our platform for lawful purposes only. You agree not to use the platform in any way that could damage, disable, or impair the platform.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Prohibited Activities</h3>
              <p className="text-gray-600">
                You may not use our platform to engage in any illegal activities, violate any laws, or infringe on the rights of others.
              </p>
            </div>
          </div>
        </Card>

        <Card title="User Accounts" className="mb-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Creation</h3>
              <p className="text-gray-600">
                You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Responsibility</h3>
              <p className="text-gray-600">
                You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Product Listings" className="mb-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Listing Accuracy</h3>
              <p className="text-gray-600">
                You must provide accurate and complete information about your products. Misleading or false information is prohibited.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Prohibited Items</h3>
              <p className="text-gray-600">
                You may not list items that are illegal, dangerous, or violate our community guidelines.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Payments and Refunds" className="mb-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Processing</h3>
              <p className="text-gray-600">
                All payments are processed securely through our payment partners. We do not store your payment information.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Refund Policy</h3>
              <p className="text-gray-600">
                Refunds are handled on a case-by-case basis. Please contact the seller directly to discuss refund options.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Limitation of Liability">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Disclaimer</h3>
              <p className="text-gray-600">
                Our platform is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the accuracy or completeness of any information on our platform.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Limitation</h3>
              <p className="text-gray-600">
                In no event shall we be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our platform.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
