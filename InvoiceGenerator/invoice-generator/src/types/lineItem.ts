/**
 * LineItem type definitions for the Invoice Generator
 */

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CalculationResult {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface LineItemsManagerProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  onCalculate: (items: LineItem[]) => CalculationResult;
}
