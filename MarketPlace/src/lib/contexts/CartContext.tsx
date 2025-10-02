'use client';

// Cart Context
// Context for managing shopping cart state across the application

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  seller: {
    id: string;
    username: string;
  };
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  addToCart: (product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    seller: { id: string; username: string };
  }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('marketplace_cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        } catch (error) {
          console.error('Failed to parse saved cart:', error);
          // Clear invalid cart data
          localStorage.removeItem('marketplace_cart');
        }
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Save cart to localStorage whenever items change (but not during initial load)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem('marketplace_cart', JSON.stringify(items));
    }
  }, [items, isLoading]);

  const addToCart = useCallback((product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    seller: { id: string; username: string };
  }) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`, // Unique cart item ID
          productId: product.id,
          title: product.title,
          price: product.price,
          image: product.images[0] || '',
          quantity: 1,
          seller: product.seller,
        };
        return [...prevItems, newItem];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.productId === productId);
  }, [items]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
