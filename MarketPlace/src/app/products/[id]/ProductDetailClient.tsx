'use client';

import React, { useState } from 'react';
import { ProductDetail } from '../../../components/product/ProductDetail/ProductDetail';
import { ContactSellerModal } from '../../../components/product/ContactSellerModal/ContactSellerModal';
import { useCart } from '../../../lib/contexts/CartContext';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  seller: {
    id: string;
    username: string;
    email: string;
  };
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addToCart } = useCart();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      images: product.images,
      seller: product.seller
    });
  };

  const handleContactSeller = () => {
    setIsContactModalOpen(true);
  };

  return (
    <div className="p-6">
      <ProductDetail
        product={product}
        onAddToCart={handleAddToCart}
        onContactSeller={handleContactSeller}
      />
      
      <ContactSellerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        seller={product.seller}
        product={product}
      />
    </div>
  );
}