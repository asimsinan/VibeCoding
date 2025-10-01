/**
 * Product Images Service
 * 
 * Maps product IDs to high-quality product images from reliable sources.
 * Uses a combination of placeholder services and direct image URLs.
 */

export interface ProductImageInfo {
  url: string;
  alt: string;
  fallback?: string;
}

// High-quality product images from reliable sources
export const PRODUCT_IMAGES: Record<number, ProductImageInfo> = {
  // Electronics
  1: {
    url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop&crop=center',
    alt: 'iPhone 15 Pro',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=iPhone+15+Pro'
  },
  2: {
    url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop&crop=center',
    alt: 'Samsung Galaxy S24 Ultra',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Galaxy+S24+Ultra'
  },
  3: {
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop&crop=center',
    alt: 'MacBook Pro 16-inch',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=MacBook+Pro'
  },
  4: {
    url: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400&h=400&fit=crop&crop=center',
    alt: 'Dell XPS 13',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Dell+XPS+13'
  },
  5: {
    url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop&crop=center',
    alt: 'Sony WH-1000XM4 Headphones',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Sony+Headphones'
  },
  6: {
    url: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop&crop=center',
    alt: 'Apple AirPods Pro',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=AirPods+Pro'
  },
  7: {
    url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=400&fit=crop&crop=center',
    alt: 'Nintendo Switch',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Nintendo+Switch'
  },
  8: {
    url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&crop=center',
    alt: 'iPad Pro 12.9-inch',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=iPad+Pro'
  },

  // Books
  9: {
    url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=center',
    alt: 'JavaScript The Good Parts book',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=JavaScript+Book'
  },
  10: {
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop&crop=center',
    alt: 'Clean Code book',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Clean+Code+Book'
  },
  11: {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
    alt: 'React Patterns book',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=React+Patterns+Book'
  },

  // Clothing & Sports
  12: {
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&crop=center',
    alt: 'Adidas Ultraboost 22 running shoes',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Adidas+Ultraboost'
  },
  13: {
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center',
    alt: 'Nike Air Max 270 shoes',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Nike+Air+Max'
  },
  14: {
    url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&crop=center',
    alt: 'Zara Denim Jacket',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Zara+Denim+Jacket'
  },
  19: {
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop&crop=center',
    alt: 'Nike Basketball',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Nike+Basketball'
  },
  20: {
    url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center',
    alt: 'Adidas Soccer Ball',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Adidas+Soccer+Ball'
  },
  21: {
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center',
    alt: 'Nike T-Shirt',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Nike+T-Shirt'
  },

  // Home & Furniture
  15: {
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center',
    alt: 'IKEA HEMNES Desk',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=IKEA+HEMNES+Desk'
  },
  16: {
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center',
    alt: 'IKEA MARKUS Office Chair',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=IKEA+MARKUS+Chair'
  },
  17: {
    url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=centerh=400https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=centerfit=crophttps://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=centercrop=center',
    alt: 'IKEA FADO Table Lamp',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=IKEA+FADO+Lamp'
  },
  18: {
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center',
    alt: 'IKEA MALM Bed Frame',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=IKEA+MALM+Bed'
  },

  // Beauty
  22: {
    url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&crop=center',
    alt: 'Sephora Makeup Kit',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=Sephora+Makeup'
  },
  23: {
    url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&crop=center',
    alt: 'MAC Lipstick',
    fallback: 'https://via.placeholder.com/400x400/f3f4f6/6b7280?text=MAC+Lipstick'
  }
};

/**
 * Get product image information by product ID
 */
export function getProductImage(productId: number): ProductImageInfo {
  return PRODUCT_IMAGES[productId] || {
    // eslint-disable-next-line no-script-url
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+',
    alt: 'No Image Available'
  };
}

/**
 * Get product image URL with fallback handling
 */
export function getProductImageUrl(productId: number): string {
  const imageInfo = getProductImage(productId);
  return imageInfo.url;
}

/**
 * Get product image alt text
 */
export function getProductImageAlt(productId: number): string {
  const imageInfo = getProductImage(productId);
  return imageInfo.alt;
}