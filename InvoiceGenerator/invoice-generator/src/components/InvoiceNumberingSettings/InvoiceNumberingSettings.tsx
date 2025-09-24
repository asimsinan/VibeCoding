import React, { useState, useEffect } from 'react';
import { invoiceNumberingService, InvoiceNumberingConfig } from '../../lib/invoice-numbering';
import { ApiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './InvoiceNumberingSettings.css';

interface InvoiceNumberingSettingsProps {
  onClose: () => void;
}

export const InvoiceNumberingSettings: React.FC<InvoiceNumberingSettingsProps> = ({
  onClose,
}) => {
  const [config, setConfig] = useState<InvoiceNumberingConfig>({
    prefix: 'INV',
    startNumber: 1,
    padding: 4,
    includeYear: true,
    includeMonth: false,
    separator: '-',
  });
  const [preview, setPreview] = useState<string>('');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Load config from API first
      const apiConfig = await ApiService.getNumberingConfig();
      setConfig(apiConfig);
      setPreview(invoiceNumberingService.getNextNumber());
      
      // Sync local config with API config
      invoiceNumberingService.updateConfig(apiConfig);
    } catch (error) {
      console.warn('Failed to load config from API, using local config:', error);
      // Fallback to local config
      const currentConfig = invoiceNumberingService.getConfig();
      setConfig(currentConfig);
      setPreview(invoiceNumberingService.getNextNumber());
    }
  };

  const handleConfigChange = (field: keyof InvoiceNumberingConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    
    // Update preview
    invoiceNumberingService.updateConfig(newConfig);
    setPreview(invoiceNumberingService.getNextNumber());
  };

  const handleSave = async () => {
    try {
      // Update both local and API config
      invoiceNumberingService.updateConfig(config);
      await ApiService.updateNumberingConfig(config);
      showSuccess('Settings saved successfully!', 'Invoice numbering configuration updated');
      onClose();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save settings';
      showError('Failed to save settings', errorMsg);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the numbering? This will reset the counter to the start number.')) {
      try {
        // Reset both local and API numbering
        invoiceNumberingService.resetNumbering();
        await ApiService.resetNumbering();
        setPreview(invoiceNumberingService.getNextNumber());
        showSuccess('Numbering reset successfully!', 'Counter has been reset to start number');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to reset numbering';
        showError('Failed to reset numbering', errorMsg);
      }
    }
  };

  const stats = invoiceNumberingService.getStats();

  return (
    <div className="invoice-numbering-settings">
      <div className="invoice-numbering-settings__header">
        <h2>Invoice Numbering Settings</h2>
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      </div>

      <div className="invoice-numbering-settings__content">
        <div className="settings-section">
          <h3>Configuration</h3>
          
          <div className="form-group">
            <label htmlFor="prefix">Prefix</label>
            <input
              id="prefix"
              type="text"
              value={config.prefix}
              onChange={(e) => handleConfigChange('prefix', e.target.value)}
              placeholder="e.g., INV, BILL, QUOTE"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="startNumber">Start Number</label>
            <input
              id="startNumber"
              type="number"
              min="1"
              value={config.startNumber}
              onChange={(e) => handleConfigChange('startNumber', parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="padding">Number Padding</label>
            <select
              id="padding"
              value={config.padding}
              onChange={(e) => handleConfigChange('padding', parseInt(e.target.value))}
            >
              <option value={3}>3 digits (001)</option>
              <option value={4}>4 digits (0001)</option>
              <option value={5}>5 digits (00001)</option>
              <option value={6}>6 digits (000001)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="separator">Separator</label>
            <select
              id="separator"
              value={config.separator}
              onChange={(e) => handleConfigChange('separator', e.target.value)}
            >
              <option value="-">Dash (-)</option>
              <option value="_">Underscore (_)</option>
              <option value=".">Dot (.)</option>
              <option value="">None</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.includeYear}
                onChange={(e) => handleConfigChange('includeYear', e.target.checked)}
              />
              Include Year
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.includeMonth}
                onChange={(e) => handleConfigChange('includeMonth', e.target.checked)}
              />
              Include Month
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Preview</h3>
          <div className="preview-box">
            <div className="preview-label">Next invoice number:</div>
            <div className="preview-value">{preview}</div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Generated:</span>
              <span className="stat-value">{stats.totalGenerated}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Last Generated:</span>
              <span className="stat-value">{stats.lastGenerated || 'None'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Next Number:</span>
              <span className="stat-value">{stats.nextNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="invoice-numbering-settings__actions">
        <button onClick={handleReset} className="btn btn--secondary">
          Reset Counter
        </button>
        <button onClick={handleSave} className="btn btn--primary">
          Save Settings
        </button>
      </div>
    </div>
  );
};
