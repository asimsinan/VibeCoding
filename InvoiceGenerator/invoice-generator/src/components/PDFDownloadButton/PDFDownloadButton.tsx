import React, { useState, useCallback } from 'react';
import { PDFDownloadButtonProps } from '../../types/invoice';
import { generateAndDownloadPDF } from '../../lib/index';
import './PDFDownloadButton.css';

/**
 * PDFDownloadButton Component
 * 
 * A button component for downloading invoices as PDF files.
 * Features:
 * - Download trigger with loading states
 * - Success/error feedback
 * - Accessibility compliance
 * - Custom styling support
 */
export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  invoice,
  onDownload,
  disabled = false,
  className = '',
  style = {}
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadState, setDownloadState] = useState<{
    success: boolean;
    error: string | null;
  }>({
    success: false,
    error: null
  });

  const handleDownload = useCallback(async () => {
    if (disabled || isDownloading || !invoice || !onDownload) return;

    setIsDownloading(true);
    setDownloadState({ success: false, error: null });

    try {
      if (onDownload) {
        await onDownload(invoice);
      } else {
        // Fallback to default PDF generation
        await generateAndDownloadPDF(invoice);
      }
      
      setDownloadState({ success: true, error: null });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setDownloadState(prev => ({ ...prev, success: false }));
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setDownloadState({ success: false, error: errorMessage });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setDownloadState(prev => ({ ...prev, error: null }));
      }, 5000);
    } finally {
      setIsDownloading(false);
    }
  }, [disabled, isDownloading, invoice, onDownload]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDownload();
    }
  }, [handleDownload]);

  const getButtonText = () => {
    if (isDownloading) return 'Generating PDF...';
    return 'Download PDF';
  };

  const getButtonClasses = () => {
    const baseClasses = ['pdf-download-button'];
    
    if (className) {
      baseClasses.push(className);
    }
    
    if (disabled) {
      baseClasses.push('pdf-download-button--disabled');
    }
    
    if (isDownloading) {
      baseClasses.push('pdf-download-button--loading');
    }
    
    if (downloadState.success) {
      baseClasses.push('pdf-download-button--success');
    }
    
    if (downloadState.error) {
      baseClasses.push('pdf-download-button--error');
    }
    
    return baseClasses.join(' ');
  };

  const getAriaLabel = () => {
    if (isDownloading) return 'Generating PDF, please wait';
    if (downloadState.success) return 'PDF downloaded successfully';
    if (downloadState.error) return 'PDF download failed';
    return 'Download PDF invoice';
  };

  return (
    <div className="pdf-download-button__container">
      <button
        type="button"
        onClick={handleDownload}
        onKeyDown={handleKeyDown}
        disabled={disabled || isDownloading || !invoice || !onDownload}
        className={getButtonClasses()}
        style={style}
        aria-label={getAriaLabel()}
        aria-busy={isDownloading}
        aria-describedby={downloadState.error ? 'pdf-download-error' : undefined}
      >
        {isDownloading && (
          <span 
            className="pdf-download-button__spinner"
            data-testid="loading-spinner"
            aria-hidden="true"
          />
        )}
        <span className="pdf-download-button__text">
          {getButtonText()}
        </span>
      </button>

      {/* Success Message */}
      {downloadState.success && (
        <div 
          className="pdf-download-button__message pdf-download-button__message--success"
          role="status"
          aria-live="polite"
        >
          PDF downloaded successfully!
        </div>
      )}

      {/* Error Message */}
      {downloadState.error && (
        <div 
          id="pdf-download-error"
          className="pdf-download-button__message pdf-download-button__message--error"
          role="alert"
          aria-live="assertive"
        >
          {downloadState.error.includes('Network') 
            ? 'Network error. Please check your connection.'
            : 'Failed to download PDF. Please try again.'
          }
        </div>
      )}
    </div>
  );
};

export default PDFDownloadButton;
