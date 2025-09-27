import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { setupApiClient } from '@/lib/api/apiClient';
import { getApiBaseUrl } from '@/lib/config';
import { getCurrentUserId } from '@/lib/constants';
import { Category } from '@/lib/finance-tracker/models';

// Custom Error Modal Component
const ErrorModal: React.FC<{
  message: string;
  onClose: () => void;
  details?: string;
}> = ({ message, onClose, details }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 relative">
        <div className="absolute top-4 right-4">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-red-100 text-red-600 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Category Deletion Failed</h2>
          </div>
        </div>
        
        <div className="text-gray-600">
          <p className="mb-2">{message}</p>
          {details && (
            <div className="bg-gray-100 p-3 rounded-md text-sm">
              <p className="font-medium text-gray-700">Details:</p>
              <p className="text-gray-600">{details}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const apiClient = setupApiClient(getApiBaseUrl(), 'your-auth-token');

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{message: string, details?: string} | null>(null);
  const [newCategory, setNewCategory] = useState<{name: string, type: 'expense' | 'income'}>({ 
    name: '', 
    type: 'expense' 
  });

  const { data: categories, isLoading, isError, error } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<Category[]>('/categories', {
        params: { userId: getCurrentUserId() }
      });
      
      // Ensure response is an array and has valid categories
      return Array.isArray(response.data) 
        ? response.data.filter(category => 
            category && 
            typeof category.name === 'string' && 
            (category.type === 'income' || category.type === 'expense')
          ) 
        : [];
    },
  });

  const addCategoryMutation = useMutation<Category, Error, {name: string, type: 'expense' | 'income'}>({
    mutationFn: async (categoryData) => {
      const response = await apiClient.post('/categories', {
        ...categoryData,
        userId: getCurrentUserId()
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddingCategory(false);
      setNewCategory({ name: '', type: 'expense' });
    }
  });

  const deleteCategoryMutation = useMutation<void, Error, string>({
    mutationFn: async (categoryId) => {
      // Use axios delete method explicitly
      await apiClient.delete(`/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      console.error('Category deletion error:', error);
      // Set detailed error message
      setErrorMessage({
        message: 'Failed to delete category',
        details: error.message || 'An unexpected error occurred'
      });
    }
  });

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      addCategoryMutation.mutate(newCategory);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500">Loading categories...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading categories</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error?.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {errorMessage && (
        <ErrorModal 
          message={errorMessage.message}
          details={errorMessage.details}
          onClose={() => setErrorMessage(null)}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <button 
            onClick={() => setIsAddingCategory(!isAddingCategory)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            {isAddingCategory ? 'Cancel' : 'Add Category'}
          </button>
        </div>

        {isAddingCategory && (
          <div className="mb-6 bg-white shadow-md rounded px-8 pt-6 pb-8">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="categoryName">
                Category Name
              </label>
              <input
                id="categoryName"
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter category name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="categoryType">
                Category Type
              </label>
              <select
                id="categoryType"
                value={newCategory.type}
                onChange={(e) => setNewCategory({...newCategory, type: e.target.value as 'expense' | 'income'})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={handleAddCategory}
                disabled={addCategoryMutation.status === 'pending'}
                className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  addCategoryMutation.status === 'pending' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {addCategoryMutation.status === 'pending' ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories && categories.length > 0 ? (
            categories.map((category) => (
              category.id && (
                <div 
                  key={category.id} 
                  className="bg-white shadow-md rounded-lg p-6 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                    <p className={`text-sm font-medium ${
                      category.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteCategoryMutation.mutate(category.id || '')}
                    disabled={deleteCategoryMutation.status === 'pending'}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first category.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoriesPage;