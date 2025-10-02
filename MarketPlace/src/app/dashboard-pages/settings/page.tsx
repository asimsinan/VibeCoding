// Settings Dashboard Page
// Settings management page for dashboard

import React from 'react';
import { Card } from '../../../components/ui/Card/Card';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="General Settings">
          <p className="text-gray-500">General settings will be displayed here.</p>
        </Card>
        <Card title="Notification Settings">
          <p className="text-gray-500">Notification settings will be displayed here.</p>
        </Card>
        <Card title="Privacy Settings">
          <p className="text-gray-500">Privacy settings will be displayed here.</p>
        </Card>
        <Card title="Security Settings">
          <p className="text-gray-500">Security settings will be displayed here.</p>
        </Card>
      </div>
    </div>
  );
}
