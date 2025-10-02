// Privacy Page
// Privacy policy page

import React from 'react';
import { Card } from '../../components/ui/Card/Card';

export default function PrivacyPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="max-w-4xl mx-auto">
        <Card title="Information We Collect" className="mb-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
              <p className="text-gray-600">
                We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
              <p className="text-gray-600">
                We collect information about how you use our platform, including your browsing activity and interactions with our services.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Device Information</h3>
              <p className="text-gray-600">
                We collect information about the device you use to access our platform, including your IP address and browser type.
              </p>
            </div>
          </div>
        </Card>

        <Card title="How We Use Your Information" className="mb-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Provision</h3>
              <p className="text-gray-600">
                We use your information to provide, maintain, and improve our services.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Communication</h3>
              <p className="text-gray-600">
                We use your information to communicate with you about your account, orders, and our services.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
              <p className="text-gray-600">
                We use your information to protect against fraud and ensure the security of our platform.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Information Sharing" className="mb-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Providers</h3>
              <p className="text-gray-600">
                We may share your information with third-party service providers who help us operate our platform.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Requirements</h3>
              <p className="text-gray-600">
                We may disclose your information if required by law or to protect our rights and the rights of others.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Transfers</h3>
              <p className="text-gray-600">
                We may share your information in connection with a merger, acquisition, or sale of assets.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Your Rights">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access and Update</h3>
              <p className="text-gray-600">
                You can access and update your personal information through your account settings.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Portability</h3>
              <p className="text-gray-600">
                You can request a copy of your personal information in a structured, machine-readable format.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deletion</h3>
              <p className="text-gray-600">
                You can request that we delete your personal information, subject to certain exceptions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
