import React, { useCallback } from 'react';
import { ClientFormProps } from '../../types/client';
import './ClientForm.css';

/**
 * ClientForm Component
 * 
 * A form component for entering and editing client details with real-time validation.
 * Features:
 * - Real-time validation with error display
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Keyboard navigation support
 * - Mobile-responsive design
 */
export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onChange,
  errors,
  onValidate
}) => {
  const handleInputChange = useCallback((field: keyof typeof client, value: string) => {
    onChange({
      ...client,
      [field]: value
    });
  }, [client, onChange]);

  const handleBlur = useCallback((field: string, value: string) => {
    onValidate(field, value);
  }, [onValidate]);

  const getFieldError = (field: keyof typeof errors) => {
    return errors[field] || '';
  };

  const hasError = (field: keyof typeof errors) => {
    return !!errors[field];
  };

  return (
    <div className="client-form" data-testid="client-form">
      <h2 className="client-form__title">Client Information</h2>
      
      <div className="client-form__fields">
        {/* Client Name Field */}
        <div className="client-form__field">
          <label 
            htmlFor="client-name" 
            className="client-form__label"
          >
            Client Name *
          </label>
          <input
            id="client-name"
            type="text"
            value={client.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onBlur={(e) => handleBlur('name', e.target.value)}
            onFocus={() => {}}
            className={`client-form__input ${hasError('name') ? 'client-form__input--error' : ''}`}
            required
            aria-invalid={hasError('name')}
            aria-describedby={hasError('name') ? 'client-name-error' : undefined}
            placeholder="Enter client name"
          />
          {hasError('name') && (
            <div 
              id="client-name-error" 
              className="client-form__error"
              role="alert"
              aria-live="polite"
            >
              {getFieldError('name')}
            </div>
          )}
        </div>

        {/* Address Field */}
        <div className="client-form__field">
          <label 
            htmlFor="client-address" 
            className="client-form__label"
          >
            Address *
          </label>
          <textarea
            id="client-address"
            value={client.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            onBlur={(e) => handleBlur('address', e.target.value)}
            onFocus={() => {}}
            className={`client-form__textarea ${hasError('address') ? 'client-form__textarea--error' : ''}`}
            required
            aria-invalid={hasError('address')}
            aria-describedby={hasError('address') ? 'client-address-error' : undefined}
            placeholder="Enter client address"
            rows={3}
          />
          {hasError('address') && (
            <div 
              id="client-address-error" 
              className="client-form__error"
              role="alert"
              aria-live="polite"
            >
              {getFieldError('address')}
            </div>
          )}
        </div>

        {/* Email Field */}
        <div className="client-form__field">
          <label 
            htmlFor="client-email" 
            className="client-form__label"
          >
            Email *
          </label>
          <input
            id="client-email"
            type="email"
            value={client.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={(e) => handleBlur('email', e.target.value)}
            onFocus={() => {}}
            className={`client-form__input ${hasError('email') ? 'client-form__input--error' : ''}`}
            required
            aria-invalid={hasError('email')}
            aria-describedby={hasError('email') ? 'client-email-error' : undefined}
            placeholder="Enter client email"
          />
          {hasError('email') && (
            <div 
              id="client-email-error" 
              className="client-form__error"
              role="alert"
              aria-live="polite"
            >
              {getFieldError('email')}
            </div>
          )}
        </div>

        {/* Phone Field */}
        <div className="client-form__field">
          <label 
            htmlFor="client-phone" 
            className="client-form__label"
          >
            Phone
          </label>
          <input
            id="client-phone"
            type="tel"
            value={client.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            onBlur={(e) => handleBlur('phone', e.target.value)}
            onFocus={() => {}}
            className={`client-form__input ${hasError('phone') ? 'client-form__input--error' : ''}`}
            aria-invalid={hasError('phone')}
            aria-describedby={hasError('phone') ? 'client-phone-error' : undefined}
            placeholder="Enter client phone number"
          />
          {hasError('phone') && (
            <div 
              id="client-phone-error" 
              className="client-form__error"
              role="alert"
              aria-live="polite"
            >
              {getFieldError('phone')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
