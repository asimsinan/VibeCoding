// Image Optimization Utilities
// Utilities for optimizing images for web performance

export interface ImageConfig {
  src: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  sizes: string;
  width?: number;
  height?: number;
}

// Generate responsive image srcSet
export function generateSrcSet(src: string, widths: number[]): string {
  return widths
    .map(width => `${getOptimizedImageUrl(src, { width })} ${width}w`)
    .join(', ');
}

// Generate sizes attribute for responsive images
export function generateSizes(breakpoints: Array<{ maxWidth?: string; size: string }>): string {
  return breakpoints
    .map(bp => bp.maxWidth ? `(max-width: ${bp.maxWidth}) ${bp.size}` : bp.size)
    .join(', ');
}

// Get optimized image URL
export function getOptimizedImageUrl(src: string, config: Partial<ImageConfig> = {}): string {
  const {
    width,
    height,
    quality = 75,
    format = 'webp',
  } = config;

  // For Next.js Image Optimization API
  const params = new URLSearchParams();
  
  if (width) {params.append('w', width.toString());}
  if (height) {params.append('h', height.toString());}
  params.append('q', quality.toString());
  params.append('fm', format);

  return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
}

// Create responsive image configuration
export function createResponsiveImage(src: string, options: {
  widths?: number[];
  breakpoints?: Array<{ maxWidth?: string; size: string }>;
  aspectRatio?: number;
}): ResponsiveImage {
  const {
    widths = [640, 750, 828, 1080, 1200, 1920],
    breakpoints = [
      { maxWidth: '640px', size: '100vw' },
      { maxWidth: '1024px', size: '50vw' },
      { size: '33vw' },
    ],
    aspectRatio,
  } = options;

  const srcSet = generateSrcSet(src, widths);
  const sizes = generateSizes(breakpoints);

  const config: ResponsiveImage = {
    src,
    srcSet,
    sizes,
  };

  if (aspectRatio) {
    const baseWidth = widths[widths.length - 1];
    config.width = baseWidth;
    config.height = Math.round(baseWidth / aspectRatio);
  }

  return config;
}

// Product image configuration
export function createProductImage(src: string): ResponsiveImage {
  return createResponsiveImage(src, {
    widths: [256, 384, 640, 750],
    breakpoints: [
      { maxWidth: '640px', size: '100vw' },
      { maxWidth: '768px', size: '50vw' },
      { maxWidth: '1024px', size: '33vw' },
      { size: '25vw' },
    ],
    aspectRatio: 1, // Square aspect ratio for products
  });
}

// Hero/banner image configuration
export function createHeroImage(src: string): ResponsiveImage {
  return createResponsiveImage(src, {
    widths: [640, 750, 828, 1080, 1200, 1920, 2048],
    breakpoints: [
      { size: '100vw' },
    ],
    aspectRatio: 16 / 9,
  });
}

// Thumbnail image configuration
export function createThumbnailImage(src: string): ResponsiveImage {
  return createResponsiveImage(src, {
    widths: [64, 96, 128],
    breakpoints: [
      { size: '64px' },
    ],
    aspectRatio: 1,
  });
}

// Avatar image configuration
export function createAvatarImage(src: string): ResponsiveImage {
  return createResponsiveImage(src, {
    widths: [40, 48, 64, 96],
    breakpoints: [
      { maxWidth: '640px', size: '40px' },
      { size: '48px' },
    ],
    aspectRatio: 1,
  });
}

// Get blur data URL for placeholder
export function getBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = typeof window !== 'undefined' && document.createElement('canvas');
  
  if (!canvas) {
    // Return a base64 encoded 1x1 transparent pixel
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  // Create a simple gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

// Preload critical images
export function preloadImage(src: string, priority: boolean = false): void {
  if (typeof window === 'undefined') {
    return;
  }

  const link = document.createElement('link');
  link.rel = priority ? 'preload' : 'prefetch';
  link.as = 'image';
  link.href = src;
  
  document.head.appendChild(link);
}

// Check if image format is supported
export function isImageFormatSupported(format: 'webp' | 'avif'): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  if (format === 'webp') {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  if (format === 'avif') {
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  return false;
}

// Get best supported image format
export function getBestImageFormat(): 'avif' | 'webp' | 'jpeg' {
  if (isImageFormatSupported('avif')) {
    return 'avif';
  }
  
  if (isImageFormatSupported('webp')) {
    return 'webp';
  }
  
  return 'jpeg';
}

// Calculate responsive image dimensions
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Scale down to maxWidth if needed
  if (width > maxWidth) {
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  }

  // Scale down to maxHeight if needed
  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }

  return { width, height };
}

// Lazy load image with Intersection Observer
export function lazyLoadImage(img: HTMLImageElement, src: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
    });

    observer.observe(img);
  } else {
    // Fallback for browsers without Intersection Observer
    img.src = src;
  }
}
