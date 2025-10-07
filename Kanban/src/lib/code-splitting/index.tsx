/**
 * Code splitting utilities
 * Provides tools for implementing dynamic imports and lazy loading
 */

import React, { ComponentType, LazyExoticComponent, lazy, Suspense } from 'react';

export interface LazyComponentOptions {
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

export interface PreloadOptions {
  priority?: 'high' | 'low';
  timeout?: number;
}

/**
 * Create a lazy component with error boundary and retry logic
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> {
  const {
    fallback = <div>Loading...</div>,
    onError,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const LazyComponent = lazy(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const module = await importFn();
        return module;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryCount) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    // If all retries failed, call onError and throw
    if (onError && lastError) {
      onError(lastError);
    }
    
    throw lastError || new Error('Failed to load component');
  });

  return LazyComponent;
}

/**
 * Create a lazy component with Suspense wrapper
 */
export function createLazyComponentWithSuspense<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> {
  const LazyComponent = createLazyComponent(importFn, options);
  
  // Wrap with Suspense
  const WrappedComponent = (props: any) => (
    <Suspense fallback={options.fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return WrappedComponent as LazyExoticComponent<T>;
}

/**
 * Preload a module for faster loading later
 */
export function preloadModule<T>(
  importFn: () => Promise<T>,
  options: PreloadOptions = {}
): Promise<T> {
  const { priority = 'low', timeout = 5000 } = options;
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Module preload timeout'));
    }, timeout);

    importFn()
      .then((module) => {
        clearTimeout(timeoutId);
        resolve(module);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Preload multiple modules in parallel
 */
export function preloadModules<T>(
  importFns: Array<() => Promise<T>>,
  options: PreloadOptions = {}
): Promise<T[]> {
  return Promise.all(importFns.map(fn => preloadModule(fn, options)));
}

/**
 * Create a route-based code splitting utility
 */
export class RouteCodeSplitter {
  private preloadedRoutes = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();

  /**
   * Create a lazy route component
   */
  public createLazyRoute<T extends ComponentType<any>>(
    routeName: string,
    importFn: () => Promise<{ default: T }>,
    options: LazyComponentOptions = {}
  ): LazyExoticComponent<T> {
    return createLazyComponent(importFn, {
      ...options,
      onError: (error) => {
        console.error(`Failed to load route ${routeName}:`, error);
        options.onError?.(error);
      },
    });
  }

  /**
   * Preload a route
   */
  public async preloadRoute(
    routeName: string,
    importFn: () => Promise<any>,
    options: PreloadOptions = {}
  ): Promise<void> {
    if (this.preloadedRoutes.has(routeName)) {
      return;
    }

    if (this.preloadPromises.has(routeName)) {
      await this.preloadPromises.get(routeName);
      return;
    }

    const promise = preloadModule(importFn, options)
      .then((module) => {
        this.preloadedRoutes.add(routeName);
        this.preloadPromises.delete(routeName);
        return module;
      })
      .catch((error) => {
        this.preloadPromises.delete(routeName);
        throw error;
      });

    this.preloadPromises.set(routeName, promise);
    await promise;
  }

  /**
   * Preload multiple routes
   */
  public async preloadRoutes(
    routes: Array<{ name: string; importFn: () => Promise<any> }>,
    options: PreloadOptions = {}
  ): Promise<void> {
    await Promise.all(
      routes.map(route => this.preloadRoute(route.name, route.importFn, options))
    );
  }

  /**
   * Check if a route is preloaded
   */
  public isRoutePreloaded(routeName: string): boolean {
    return this.preloadedRoutes.has(routeName);
  }

  /**
   * Get preloaded routes
   */
  public getPreloadedRoutes(): string[] {
    return Array.from(this.preloadedRoutes);
  }
}

/**
 * Create a feature-based code splitting utility
 */
export class FeatureCodeSplitter {
  private loadedFeatures = new Set<string>();
  private loadingFeatures = new Set<string>();

  /**
   * Load a feature dynamically
   */
  public async loadFeature<T>(
    featureName: string,
    importFn: () => Promise<T>,
    options: { onError?: (error: Error) => void } = {}
  ): Promise<T> {
    if (this.loadedFeatures.has(featureName)) {
      return importFn();
    }

    if (this.loadingFeatures.has(featureName)) {
      // Wait for the feature to finish loading
      while (this.loadingFeatures.has(featureName)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return importFn();
    }

    this.loadingFeatures.add(featureName);

    try {
      const module = await importFn();
      this.loadedFeatures.add(featureName);
      return module;
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    } finally {
      this.loadingFeatures.delete(featureName);
    }
  }

  /**
   * Check if a feature is loaded
   */
  public isFeatureLoaded(featureName: string): boolean {
    return this.loadedFeatures.has(featureName);
  }

  /**
   * Check if a feature is loading
   */
  public isFeatureLoading(featureName: string): boolean {
    return this.loadingFeatures.has(featureName);
  }

  /**
   * Get loaded features
   */
  public getLoadedFeatures(): string[] {
    return Array.from(this.loadedFeatures);
  }
}

/**
 * Create a component-based code splitting utility
 */
export class ComponentCodeSplitter {
  private componentCache = new Map<string, LazyExoticComponent<any>>();

  /**
   * Get or create a lazy component
   */
  public getLazyComponent<T extends ComponentType<any>>(
    componentName: string,
    importFn: () => Promise<{ default: T }>,
    options: LazyComponentOptions = {}
  ): LazyExoticComponent<T> {
    if (this.componentCache.has(componentName)) {
      return this.componentCache.get(componentName)!;
    }

    const LazyComponent = createLazyComponent(importFn, options);
    this.componentCache.set(componentName, LazyComponent);
    return LazyComponent;
  }

  /**
   * Preload a component
   */
  public async preloadComponent(
    componentName: string,
    importFn: () => Promise<any>,
    options: PreloadOptions = {}
  ): Promise<void> {
    if (this.componentCache.has(componentName)) {
      return;
    }

    await preloadModule(importFn, options);
  }

  /**
   * Get cached component
   */
  public getCachedComponent(componentName: string): LazyExoticComponent<any> | undefined {
    return this.componentCache.get(componentName);
  }

  /**
   * Clear component cache
   */
  public clearCache(): void {
    this.componentCache.clear();
  }
}

// Singleton instances
export const routeCodeSplitter = new RouteCodeSplitter();
export const featureCodeSplitter = new FeatureCodeSplitter();
export const componentCodeSplitter = new ComponentCodeSplitter();

/**
 * Utility function to create a loading component
 */
export function createLoadingComponent(message: string = 'Loading...'): React.ComponentType {
  return () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">{message}</span>
    </div>
  );
}

/**
 * Utility function to create an error boundary component
 */
export function createErrorBoundaryComponent(
  onError?: (error: Error, errorInfo: any) => void
): React.ComponentType<{ children: React.ReactNode }> {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
      onError?.(error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="flex items-center justify-center p-4 text-red-600">
            <div>
              <h2 className="text-lg font-semibold">Something went wrong</h2>
              <p className="text-sm">Failed to load component</p>
            </div>
          </div>
        );
      }

      return this.props.children;
    }
  };
}
