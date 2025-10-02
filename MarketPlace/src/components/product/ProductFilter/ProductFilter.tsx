'use client';

// ProductFilter component
// Product filter component for filtering products

import React, { useState } from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';

interface ProductFilterProps {
  onFilter: (filters: {
    query: string;
    category: string;
    minPrice: number;
    maxPrice: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) => void;
  loading?: boolean;
  className?: string;
}

export const ProductFilter: React.FC<ProductFilterProps> = ({
  onFilter,
  loading = false,
  className = '',
}) => {
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
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

  const sortOptions = [
    { value: 'createdAt', label: 'Date Listed' },
    { value: 'price', label: 'Price' },
    { value: 'title', label: 'Title' },
    { value: 'category', label: 'Category' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({
      query: filters.query,
      category: filters.category,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : 0,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFilters({
      query: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    onFilter({
      query: '',
      category: '',
      minPrice: 0,
      maxPrice: Infinity,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Search"
          type="text"
          placeholder="Search products..."
          value={filters.query}
          onChange={(value) => handleChange('query', value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.category}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort Order
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <Input
          label="Min Price"
          type="number"
          placeholder="Min price"
          value={filters.minPrice}
          onChange={(value) => handleChange('minPrice', value)}
        />

        <Input
          label="Max Price"
          type="number"
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={(value) => handleChange('maxPrice', value)}
        />
      </div>

      <div className="flex space-x-4">
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
        >
          {loading ? 'Filtering...' : 'Apply Filters'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
    </form>
  );
};
