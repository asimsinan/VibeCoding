// Product Detail Page
// Individual product detail page

import React from 'react';
// import { ProductDetail } from '../../../components/product/ProductDetail/ProductDetail';
// import { ContactSellerModal } from '../../../components/product/ContactSellerModal/ContactSellerModal';
import { prisma } from '../../../lib/prisma';
import { ProductDetailClient } from './ProductDetailClient';

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
            <a
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return <ProductDetailClient product={product} />;
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Product</h1>
          <p className="text-gray-600 mb-4">There was an error loading the product details.</p>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }
}
