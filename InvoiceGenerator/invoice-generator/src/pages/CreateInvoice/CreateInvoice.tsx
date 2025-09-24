import { useState, useCallback, useEffect } from 'react';
import { ClientForm } from '../../components/ClientForm';
import { LineItemsManager } from '../../components/LineItemsManager';
import { InvoicePreview } from '../../components/InvoicePreview';
import { PDFDownloadButton } from '../../components/PDFDownloadButton';
import { PrintButton } from '../../components/PrintButton/PrintButton';
import { InvoiceTemplates, InvoiceTemplate } from '../../components/InvoiceTemplates/InvoiceTemplates';
import { Modal } from '../../components/Modal/Modal';
import { ApiService } from '../../services/api';
import { Client, ValidationErrors } from '../../types/client';
import { LineItem, CalculationResult } from '../../types/lineItem';
import { Invoice, InvoiceRequest } from '../../types/invoice';
import { useToast } from '../../hooks/useToast';
import { invoiceNumberingService } from '../../lib/invoice-numbering';
import { dueDateTrackingService } from '../../lib/due-date-tracking';
import './CreateInvoice.css';

export const CreateInvoice: React.FC = () => {
  const [client, setClient] = useState<Client>({
    name: '',
    address: '',
    email: '',
    phone: ''
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [clientErrors, setClientErrors] = useState<ValidationErrors>({} as ValidationErrors);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [showTemplates, setShowTemplates] = useState<boolean>(false);
  const { showSuccess, showError } = useToast();

  const handleClientChange = useCallback((newClient: Client) => {
    setClient(newClient);
  }, []);

  const handleClientValidate = useCallback((field: string, value: string) => {
    const newErrors: ValidationErrors = { ...clientErrors };
    
    if (field === 'name') {
      if (!value.trim()) {
        newErrors.name = 'Client name is required';
      } else if (value.length > 100) {
        newErrors.name = 'Client name must be 100 characters or less';
      } else {
        delete (newErrors as any).name;
      }
    } else if (field === 'email') {
      if (!value.trim()) {
        newErrors.email = 'Client email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.email = 'Invalid email format';
      } else {
        delete (newErrors as any).email;
      }
    } else if (field === 'address') {
      if (!value.trim()) {
        newErrors.address = 'Client address is required';
      } else if (value.length > 200) {
        newErrors.address = 'Client address must be 200 characters or less';
      } else {
        delete (newErrors as any).address;
      }
    } else if (field === 'phone') {
      if (value && value.length > 20) {
        newErrors.phone = 'Client phone must be 20 characters or less';
      } else {
        delete (newErrors as any).phone;
      }
    }
    
    setClientErrors(newErrors);
  }, [clientErrors]);

  const handleLineItemsChange = useCallback((newItems: LineItem[]) => {
    setLineItems(newItems);
  }, []);

  const handleLineItemsCalculate = useCallback((items: LineItem[]): CalculationResult => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  }, [taxRate]);

  const handleTemplateSelect = useCallback((template: InvoiceTemplate) => {
    setClient({
      name: template.client.name || '',
      email: template.client.email || '',
      address: template.client.address || '',
      phone: template.client.phone || '',
    });
    
    setLineItems(template.items.map((item, index) => ({
      id: `item-${index}`,
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      lineTotal: (item.quantity || 1) * (item.unitPrice || 0),
    })));
    
    setTaxRate(template.taxRate || 0);
    setErrorMessage('');
    showSuccess('Template applied successfully!');
  }, [showSuccess]);

  // Check API connection on component mount
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('disconnected');
        }
      } catch (error) {
        setApiStatus('disconnected');
      }
    };

    checkApiConnection();
  }, []);

  // Save invoice to API
  const handleSaveInvoice = useCallback(async () => {
    if (!client.name || !client.email || !client.address || lineItems.length === 0) {
      setErrorMessage('Please fill in all required fields and add at least one line item');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const invoiceRequest: InvoiceRequest = {
        client,
        items: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.unitPrice  // Map unitPrice to price for API
        })),
        taxRate
      };

             const savedInvoice = await ApiService.createInvoice(invoiceRequest);
             setSavedInvoice(savedInvoice);
             setErrorMessage('');
             showSuccess('Invoice saved successfully!', `Saved as ${savedInvoice.invoiceNumber}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save invoice';
      setErrorMessage(`Save failed: ${errorMsg}`);
      showError('Failed to save invoice', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [client, lineItems, taxRate]);

  // Download PDF using API
  const handleDownloadPDF = useCallback(async (invoice: Invoice) => {
    try {
      setErrorMessage('');
      
      if (savedInvoice) {
        // Use API to generate PDF
        await ApiService.downloadPDF(savedInvoice.id);
      } else {
        // Fallback to local PDF generation
        const { generateAndDownloadPDF } = await import('../../lib/index');
        await generateAndDownloadPDF(invoice);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(`Failed to generate PDF: ${errorMsg}`);
      showError('PDF Download Failed', errorMsg);
    }
  }, [savedInvoice, showError]);

  // Create invoice object for preview and PDF generation
  const invoice: Invoice = {
    id: `INV-${Date.now()}`,
    invoiceNumber: invoiceNumberingService.getNextNumber(),
    client,
    items: lineItems,
    subtotal: lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    taxAmount: lineItems.reduce((sum, item) => sum + item.lineTotal, 0) * (taxRate / 100),
    total: lineItems.reduce((sum, item) => sum + item.lineTotal, 0) * (1 + taxRate / 100),
    taxRate,
    date: new Date().toISOString().split('T')[0],
    dueDate: dueDateTrackingService.calculateDueDate(new Date().toISOString().split('T')[0]),
    status: 'draft'
  };

  return (
    <div className="create-invoice">
      <div className="create-invoice__header">
        <h1>Create Invoice</h1>
        <p>Fill out the form below to create a new invoice</p>
        {savedInvoice && (
          <div className="saved-indicator">
            <div className="saved-indicator__icon">✅</div>
            <div className="saved-indicator__content">
              <div className="saved-indicator__title">Invoice Saved Successfully!</div>
              <div className="saved-indicator__details">
                <span className="saved-indicator__number">#{savedInvoice.invoiceNumber}</span>
                <span className="saved-indicator__separator">•</span>
                <span className="saved-indicator__client">{savedInvoice.client.name}</span>
                <span className="saved-indicator__separator">•</span>
                <span className="saved-indicator__amount">${savedInvoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="create-invoice__main">
        <div className="invoice-form">
          <ClientForm
            client={client}
            onChange={handleClientChange}
            errors={clientErrors}
            onValidate={handleClientValidate}
          />

          <LineItemsManager
            items={lineItems}
            onChange={handleLineItemsChange}
            onCalculate={handleLineItemsCalculate}
          />

          <section className="tax-section">
            <div className="form-group">
              <label htmlFor="tax-rate">Tax Rate (%)</label>
              <input
                id="tax-rate"
                data-testid="tax-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                aria-label="Tax rate percentage"
              />
            </div>
          </section>

                 <section className="actions-section">
                   {errorMessage && (
                     <div data-testid="error-message" className="error-message" role="alert">
                       {errorMessage}
                     </div>
                   )}
                   
                   <div className="action-buttons">
                     <button
                       type="button"
                       onClick={() => setShowTemplates(true)}
                       className="btn btn--secondary"
                     >
                       📋 Use Template
                     </button>
                     
                     <button
                       type="button"
                       onClick={handleSaveInvoice}
                       disabled={isLoading || apiStatus !== 'connected'}
                       className="save-button"
                       data-testid="save-invoice-button"
                     >
                       {isLoading ? 'Saving...' : '💾 Save Invoice'}
                     </button>
                     
                     <PDFDownloadButton
                       invoice={savedInvoice || invoice}
                       onDownload={handleDownloadPDF}
                     />
                     
                     <PrintButton
                       invoice={savedInvoice || invoice}
                       className="print-button"
                     />
                   </div>
                 </section>
        </div>

        <InvoicePreview invoice={invoice} />
      </main>

      <Modal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        title="Invoice Templates"
        size="large"
      >
        <InvoiceTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      </Modal>
    </div>
  );
};