/**
 * Client type definitions for the Invoice Generator
 */

export interface Client {
  name: string;
  address: string;
  email: string;
  phone?: string;
}

export interface ValidationErrors {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface ClientFormProps {
  client: Client;
  onChange: (client: Client) => void;
  errors: ValidationErrors;
  onValidate: (field: string, value: string) => void;
}
