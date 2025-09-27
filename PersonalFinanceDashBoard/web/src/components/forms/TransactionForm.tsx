import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { setupApiClient } from '@/lib/api/apiClient';
import { Transaction, Category, ensureNumber, formatDate } from '@/lib/finance-tracker/models';
import { ApiClient } from '@/lib/api/apiClient'; // Import ApiClient type
import { getApiBaseUrl } from '@/lib/config';
import { getCurrentUserId } from '@/lib/constants';

// Define transaction creation type to ensure type safety
type TransactionCreation = Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface TransactionFormProps {
  apiClient?: ApiClient; // Optional apiClient prop for testing
}

const TransactionForm: React.FC<TransactionFormProps> = ({ apiClient: injectedApiClient }) => {
  const queryClient = useQueryClient();
  const currentApiClient = injectedApiClient || setupApiClient(getApiBaseUrl(), 'your-auth-token');

  // State with explicit types and initial values
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  // Fetch categories for the dropdown
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        console.log('Fetching categories with base URL:', getApiBaseUrl());
        console.log('Current User ID:', getCurrentUserId());
        
        const response = await currentApiClient.get<Category[]>('/categories', {
          params: { userId: getCurrentUserId() }
        });
        
        console.log('Categories API Response:', response);
        
        // Ensure response is an array and has valid categories
        const validCategories = Array.isArray(response.data) 
          ? response.data.filter(category => 
              category && 
              typeof category === 'object' &&
              typeof category.name === 'string' && 
              (category.type === 'income' || category.type === 'expense')
            ) 
          : [];
        
        console.log('Valid Categories:', validCategories);
        return validCategories;
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        throw error;
      }
    },
    // Use error option instead of onError
    retry: 1,
    refetchOnWindowFocus: false,
    throwOnError: (error: Error) => {
      console.error('Categories Query Error:', error.message);
      return false;
    }
  });

  // Memoize filtered categories to improve performance
  const filteredCategories = useMemo(() => {
    // Ensure categoriesData is an array before filtering
    return (categoriesData || []).filter((cat: Category) => cat.type === type);
  }, [categoriesData, type]);

  // Transaction creation mutation with improved type safety
  const createTransactionMutation = useMutation<
    Transaction,  // Return type
    Error,        // Error type
    TransactionCreation // Mutation input type
  >({
    mutationFn: async (newTransaction) => {
      const response = await currentApiClient.post<Transaction>('/transactions', { 
        ...newTransaction, 
        amount: ensureNumber(newTransaction.amount), // Ensure amount is a number
        userId: getCurrentUserId(),
        category_id: newTransaction.category_id, // Use category_id
        categoryId: undefined // Remove categoryId to prevent conflicts
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['spending-by-category'] });
      
      // Reset form state
      setMessage('Transaction created successfully!');
      setIsError(false);
      setDescription('');
      setAmount(0);
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId(''); // Reset category selection
    },
    onError: (error: Error) => {
      setMessage(error.message || 'Failed to create transaction.');
      setIsError(true);
    },
  });

  // Form submission handler with comprehensive validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    const processedAmount = ensureNumber(amount);

    // Validation checks
    if (!description || description.trim() === '') {
      setMessage('Description is required.');
      setIsError(true);
      return;
    }

    if (processedAmount <= 0) {
      setMessage('Amount must be a positive number.');
      setIsError(true);
      return;
    }

    if (!categoryId) {
      setMessage('Please select a category.');
      setIsError(true);
      return;
    }

    // Proceed with transaction creation
    createTransactionMutation.mutate({
      description,
      amount: processedAmount,
      type,
      date,
      category_id: categoryId,
    });
  };

  // Render loading state for categories
  if (categoriesLoading) {
    return (
      <div className="text-center py-4 text-gray-500">
        Loading categories...
      </div>
    );
  }

  // Render category fetch error
  if (categoriesError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Failed to load categories. Please try again.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md ${
          isError 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {isError ? (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter transaction description"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(ensureNumber(e.target.value))}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as 'expense' | 'income');
                setCategoryId(''); // Reset category when type changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a category</option>
            {filteredCategories.map((category: Category) => (
              <option 
                key={category.id || crypto.randomUUID()} 
                value={category.id || ''}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Formatted date: {formatDate(date)}
          </p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={createTransactionMutation.status === 'pending'}
          className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            createTransactionMutation.status === 'pending'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {createTransactionMutation.status === 'pending' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Transaction
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
