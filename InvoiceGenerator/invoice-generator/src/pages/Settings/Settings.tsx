import React, { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { InvoiceNumberingSettings } from '../../components/InvoiceNumberingSettings/InvoiceNumberingSettings';
import { dueDateTrackingService } from '../../lib/due-date-tracking';
import { useToast } from '../../hooks/useToast';
import './Settings.css';

export const Settings: React.FC = () => {
  const [showNumberingSettings, setShowNumberingSettings] = useState(false);
  const [dueDateConfig, setDueDateConfig] = useState(dueDateTrackingService.getConfig());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { showSuccess } = useToast();

  const handleDueDateConfigChange = (field: keyof typeof dueDateConfig, value: any) => {
    const newConfig = { ...dueDateConfig, [field]: value };
    setDueDateConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    dueDateTrackingService.updateConfig(dueDateConfig);
    setHasUnsavedChanges(false);
    showSuccess('Settings saved!', 'All settings have been saved successfully');
  };

  const handleResetSettings = () => {
    const defaultConfig = dueDateTrackingService.getConfig();
    setDueDateConfig(defaultConfig);
    setHasUnsavedChanges(false);
    showSuccess('Settings reset!', 'Settings have been reset to defaults');
  };

  return (
    <div className="settings">
      <div className="settings__header">
        <h1>Settings</h1>
        <p>Configure your invoice generator preferences</p>
      </div>

      <div className="settings__content">
        <div className="settings__section">
          <h2>API Configuration</h2>
          <div className="setting-item">
            <label>API Base URL</label>
            <input 
              type="text" 
              value={import.meta.env.VITE_API_URL || 'http://localhost:3000'} 
              readOnly 
              className="setting-input"
            />
          </div>
        </div>

        <div className="settings__section">
          <h2>Invoice Numbering</h2>
          <p className="settings__description">
            Configure how invoice numbers are generated and formatted.
          </p>
          <button
            onClick={() => setShowNumberingSettings(true)}
            className="btn btn--primary"
          >
            Configure Numbering
          </button>
        </div>

        <div className="settings__section">
          <h2>Due Date Tracking</h2>
          <div className="setting-item">
            <label>Default Due Days</label>
            <input 
              type="number" 
              min="1"
              max="365"
              value={dueDateConfig.defaultDays}
              onChange={(e) => handleDueDateConfigChange('defaultDays', parseInt(e.target.value) || 30)}
              className="setting-input"
            />
          </div>
          <div className="setting-item">
            <label>Reminder Days</label>
            <input 
              type="number" 
              min="0"
              max="30"
              value={dueDateConfig.reminderDays}
              onChange={(e) => handleDueDateConfigChange('reminderDays', parseInt(e.target.value) || 7)}
              className="setting-input"
            />
          </div>
          <div className="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={dueDateConfig.autoUpdateStatus}
                onChange={(e) => handleDueDateConfigChange('autoUpdateStatus', e.target.checked)}
              />
              Automatically update invoice status based on due dates
            </label>
          </div>
        </div>

        <div className="settings__section">
          <h2>Export Settings</h2>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Include company logo in PDFs
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Auto-save drafts
            </label>
          </div>
        </div>

        <div className="settings__actions">
          <button
            onClick={handleResetSettings}
            className="btn btn--secondary"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={!hasUnsavedChanges}
            className="btn btn--primary"
          >
            {hasUnsavedChanges ? '💾 Save Changes' : '✅ Saved'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showNumberingSettings}
        onClose={() => setShowNumberingSettings(false)}
        title="Invoice Numbering Settings"
        size="large"
      >
        <InvoiceNumberingSettings
          onClose={() => setShowNumberingSettings(false)}
        />
      </Modal>
    </div>
  );
};
