'use client';

// SearchForm component
// Search form component for product search

import React, { useState } from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';

interface SearchFormProps {
  onSearch: (query: string, category?: string, minPrice?: number, maxPrice?: number) => void;
  loading?: boolean;
  className?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  loading = false,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });

  const categories = [
    'All Categories',
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Books',
    'Sports',
    'Other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(
      formData.query,
      formData.category || undefined,
      formData.minPrice ? parseFloat(formData.minPrice) : undefined,
      formData.maxPrice ? parseFloat(formData.maxPrice) : undefined
    );
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label="Search"
          type="text"
          placeholder="Search products..."
          value={formData.query}
          onChange={(value) => handleChange('query', value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category === 'All Categories' ? '' : category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Min Price"
          type="number"
          placeholder="Min price"
          value={formData.minPrice}
          onChange={(value) => handleChange('minPrice', value)}
        />

        <Input
          label="Max Price"
          type="number"
          placeholder="Max price"
          value={formData.maxPrice}
          onChange={(value) => handleChange('maxPrice', value)}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        className="w-full md:w-auto"
      >
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
};
