// My Products Dashboard Page
// Products management page for sellers

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Card/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string; // API returns price as string
  images: string[];
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setDataLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_tokens');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const authData = JSON.parse(token);
        const authHeader = `Bearer ${authData.accessToken}`;

        const response = await fetch('/api/products?sellerId=' + user.id, {
          headers: { Authorization: authHeader }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setDataLoading(false);
      }
    };

    fetchProducts();
  }, [isAuthenticated, user]);

  const handleAddProduct = () => {
    router.push('/dashboard-pages/add-product');
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/dashboard-pages/edit-product/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_tokens');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const authData = JSON.parse(token);
      const authHeader = `Bearer ${authData.accessToken}`;

      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Remove product from local state
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Products</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-main py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Products</h1>
            <p className="text-gray-600">Manage your product listings</p>
          </div>
          <Button variant="primary" onClick={handleAddProduct}>
            Add New Product
          </Button>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <div className="space-y-4">
                  {/* Product Image */}
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{product.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900">${parseFloat(product.price).toFixed(2)}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product.id)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 text-red-600 hover:text-red-800"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Yet</h3>
              <p className="text-gray-600 mb-6">You haven't listed any products yet. Create your first product to start selling!</p>
              <Button 
                variant="primary"
                onClick={handleAddProduct}
              >
                Add Your First Product
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
