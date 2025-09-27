// Define core types for financial tracking

export interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id?: string;
  amount: number;  // Ensure amount is always a number
  type: 'income' | 'expense';
  date: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  user_id?: string;
  formattedDate?: string;  // Optional formatted date
}

export interface SpendingData {
  category: string;
  totalAmount: number;
}

// Helper function to ensure amount is a number
export function ensureNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Helper function to format date in Day-Month-Year format
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid
    }

    // Format to DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Date formatting error:', { dateString, error });
    return dateString;
  }
}
