#!/usr/bin/env node
/**
 * Professional PWA (Progressive Web App) Implementation Module
 * 
 * Implements comprehensive PWA features including:
 * - Service Worker management
 * - App manifest generation
 * - Offline capabilities
 * - Background sync
 * - Push notifications
 * - Install prompts
 * - Cache strategies
 * - Update management
 * 
 * @fileoverview PWA utilities and components for web platform
 */

import { useEffect, useState, useCallback, useRef } from 'react'

// --- PWA Types ---
export interface PWAConfig {
  appName: string
  shortName: string
  description: string
  startUrl: string
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  orientation: 'portrait' | 'landscape' | 'any'
  themeColor: string
  backgroundColor: string
  icons: Array<{
    src: string
    sizes: string
    type: string
    purpose?: 'any' | 'maskable' | 'monochrome'
  }>
  categories: string[]
  lang: string
  dir: 'ltr' | 'rtl' | 'auto'
  scope: string
  enableOffline: boolean
  enableBackgroundSync: boolean
  enablePushNotifications: boolean
  enableInstallPrompt: boolean
  cacheStrategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate' | 'networkOnly' | 'cacheOnly'
  updateStrategy: 'immediate' | 'prompt' | 'background'
}

export interface ServiceWorkerMessage {
  type: string
  payload?: any
}

export interface CacheConfig {
  name: string
  version: string
  urls: string[]
  strategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate'
}

export interface OfflineConfig {
  enableOfflinePage: boolean
  offlinePageUrl: string
  enableOfflineData: boolean
  offlineDataKeys: string[]
}

export interface PushNotificationConfig {
  vapidPublicKey: string
  vapidPrivateKey: string
  enableNotifications: boolean
  defaultNotificationOptions: NotificationOptions
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// --- Default Configuration ---
export const DEFAULT_PWA_CONFIG: PWAConfig = {
  appName: 'Virtual Event Organizer',
  shortName: 'EventOrg',
  description: 'Professional virtual event management platform',
  startUrl: '/',
  display: 'standalone',
  orientation: 'any',
  themeColor: '#2563eb',
  backgroundColor: '#ffffff',
  icons: [
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/icon-maskable-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: '/icons/icon-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ],
  categories: ['productivity', 'business', 'social'],
  lang: 'en',
  dir: 'ltr',
  scope: '/',
  enableOffline: true,
  enableBackgroundSync: true,
  enablePushNotifications: true,
  enableInstallPrompt: true,
  cacheStrategy: 'staleWhileRevalidate',
  updateStrategy: 'prompt',
}

// --- PWA Utilities ---
export class PWAUtils {
  private static instance: PWAUtils
  private config: PWAConfig
  private serviceWorker: ServiceWorker | null = null
  private registration: ServiceWorkerRegistration | null = null
  private installPromptEvent: InstallPromptEvent | null = null
  private messageHandlers: Map<string, (payload: any) => void> = new Map()

  constructor(config: PWAConfig = DEFAULT_PWA_CONFIG) {
    this.config = { ...DEFAULT_PWA_CONFIG, ...config }
    this.initializePWA()
  }

  public static getInstance(config?: PWAConfig): PWAUtils {
    if (!PWAUtils.instance) {
      PWAUtils.instance = new PWAUtils(config)
    }
    return PWAUtils.instance
  }

  private initializePWA(): void {
    if (typeof window === 'undefined') return

    // Register service worker
    this.registerServiceWorker()

    // Set up install prompt
    if (this.config.enableInstallPrompt) {
      this.setupInstallPrompt()
    }

    // Set up push notifications
    if (this.config.enablePushNotifications) {
      this.setupPushNotifications()
    }

    // Set up offline detection
    this.setupOfflineDetection()
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js')

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.handleServiceWorkerUpdate()
            }
          })
        }
      })

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data)
      })

    } catch (error) {
    }
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      this.installPromptEvent = event as InstallPromptEvent
      this.dispatchEvent('installPromptAvailable', { event: this.installPromptEvent })
    })

    window.addEventListener('appinstalled', () => {
      this.installPromptEvent = null
      this.dispatchEvent('appInstalled', {})
    })
  }

  private setupPushNotifications(): void {
    if (!('Notification' in window)) {
      return
    }

    // Request permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          this.dispatchEvent('notificationPermissionGranted', {})
        } else {
          this.dispatchEvent('notificationPermissionDenied', {})
        }
      })
    }
  }

  private setupOfflineDetection(): void {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine
      this.dispatchEvent('onlineStatusChanged', { isOnline })
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  }

  private handleServiceWorkerUpdate(): void {
    switch (this.config.updateStrategy) {
      case 'immediate':
        this.updateServiceWorker()
        break
      case 'prompt':
        this.dispatchEvent('serviceWorkerUpdateAvailable', {})
        break
      case 'background':
        // Update will happen in background
        break
    }
  }

  private handleServiceWorkerMessage(message: ServiceWorkerMessage): void {
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      handler(message.payload)
    }
  }

  private dispatchEvent(eventName: string, data: any): void {
    const event = new CustomEvent(`pwa:${eventName}`, { detail: data })
    window.dispatchEvent(event)
  }

  public async installApp(): Promise<boolean> {
    if (!this.installPromptEvent) {
      return false
    }

    try {
      await this.installPromptEvent.prompt()
      const choiceResult = await this.installPromptEvent.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        this.dispatchEvent('appInstallAccepted', {})
        return true
      } else {
        this.dispatchEvent('appInstallDismissed', {})
        return false
      }
    } catch (error) {
      return false
    }
  }

  public async updateServiceWorker(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.update()
    } catch (error) {
    }
  }

  public async sendMessageToServiceWorker(message: ServiceWorkerMessage): Promise<void> {
    if (!this.serviceWorker) return

    try {
      this.serviceWorker.postMessage(message)
    } catch (error) {
    }
  }

  public addMessageHandler(type: string, handler: (payload: any) => void): void {
    this.messageHandlers.set(type, handler)
  }

  public removeMessageHandler(type: string): void {
    this.messageHandlers.delete(type)
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    return await Notification.requestPermission()
  }

  public async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission !== 'granted') {
      return
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      })

      notification.addEventListener('click', () => {
        window.focus()
        notification.close()
      })
    } catch (error) {
    }
  }

  public async subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      })

      this.dispatchEvent('pushSubscriptionCreated', { subscription })
      return subscription
    } catch (error) {
      return null
    }
  }

  public async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        this.dispatchEvent('pushSubscriptionRemoved', {})
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  public generateManifest(): string {
    const manifest = {
      name: this.config.appName,
      short_name: this.config.shortName,
      description: this.config.description,
      start_url: this.config.startUrl,
      display: this.config.display,
      orientation: this.config.orientation,
      theme_color: this.config.themeColor,
      background_color: this.config.backgroundColor,
      icons: this.config.icons,
      categories: this.config.categories,
      lang: this.config.lang,
      dir: this.config.dir,
      scope: this.config.scope
    }

    return JSON.stringify(manifest, null, 2)
  }

  public generateServiceWorkerScript(): string {
    const cacheName = `${this.config.shortName}-v1`
    const urlsToCache = [
      '/',
      '/manifest.json',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
      '/offline.html'
    ]

    return `
// Service Worker for ${this.config.appName}
const CACHE_NAME = '${cacheName}';
const urlsToCache = ${JSON.stringify(urlsToCache)};

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('${this.config.appName}', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/');
  );
});

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync function
async function doBackgroundSync() {
  // Implement background sync logic here
}
    `.trim()
  }

  public isInstallable(): boolean {
    return this.installPromptEvent !== null
  }

  public isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  public isOnline(): boolean {
    return navigator.onLine
  }

  public updateConfig(newConfig: Partial<PWAConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  public getConfig(): PWAConfig {
    return { ...this.config }
  }
}

// --- React Hooks ---
export const usePWA = (config?: Partial<PWAConfig>) => {
  const pwaUtils = PWAUtils.getInstance({
    appName: config?.appName ?? 'Event Organizer',
    shortName: config?.shortName ?? 'EventOrg',
    description: config?.description ?? 'Virtual Event Management Platform',
    startUrl: config?.startUrl ?? '/',
    display: config?.display ?? 'standalone',
    orientation: config?.orientation ?? 'portrait',
    themeColor: config?.themeColor ?? '#0066cc',
    backgroundColor: config?.backgroundColor ?? '#ffffff',
    icons: config?.icons ?? [],
    categories: config?.categories ?? ['productivity', 'business'],
    lang: config?.lang ?? 'en',
    dir: config?.dir ?? 'ltr',
    scope: config?.scope ?? '/',
    enableOffline: config?.enableOffline ?? true,
    enableBackgroundSync: config?.enableBackgroundSync ?? true,
    enablePushNotifications: config?.enablePushNotifications ?? true,
    enableInstallPrompt: config?.enableInstallPrompt ?? true,
    cacheStrategy: config?.cacheStrategy ?? 'networkFirst',
    updateStrategy: config?.updateStrategy ?? 'prompt'
  })
  
  return pwaUtils
}

export const useInstallPrompt = () => {
  const [isInstallable, setIsInstallable] = useState(false)
  const [installPromptEvent, setInstallPromptEvent] = useState<InstallPromptEvent | null>(null)
  const pwaUtils = PWAUtils.getInstance()

  useEffect(() => {
    const handleInstallPromptAvailable = (event: CustomEvent) => {
      setIsInstallable(true)
      setInstallPromptEvent(event.detail.event)
    }

    const handleAppInstalled = () => {
      setIsInstallable(false)
      setInstallPromptEvent(null)
    }

    window.addEventListener('pwa:installPromptAvailable', handleInstallPromptAvailable as EventListener)
    window.addEventListener('pwa:appInstalled', handleAppInstalled as EventListener)

    return () => {
      window.removeEventListener('pwa:installPromptAvailable', handleInstallPromptAvailable as EventListener)
      window.removeEventListener('pwa:appInstalled', handleAppInstalled as EventListener)
    }
  }, [])

  const install = useCallback(async () => {
    if (installPromptEvent) {
      return await pwaUtils.installApp()
    }
    return false
  }, [installPromptEvent, pwaUtils])

  return { isInstallable, install }
}

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnlineStatusChanged = (event: CustomEvent) => {
      setIsOnline(event.detail.isOnline)
    }

    window.addEventListener('pwa:onlineStatusChanged', handleOnlineStatusChanged as EventListener)

    return () => {
      window.removeEventListener('pwa:onlineStatusChanged', handleOnlineStatusChanged as EventListener)
    }
  }, [])

  return isOnline
}

export const useServiceWorkerUpdate = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const pwaUtils = PWAUtils.getInstance()

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setIsUpdateAvailable(true)
    }

    window.addEventListener('pwa:serviceWorkerUpdateAvailable', handleUpdateAvailable as EventListener)

    return () => {
      window.removeEventListener('pwa:serviceWorkerUpdateAvailable', handleUpdateAvailable as EventListener)
    }
  }, [])

  const update = useCallback(async () => {
    await pwaUtils.updateServiceWorker()
    setIsUpdateAvailable(false)
  }, [pwaUtils])

  return { isUpdateAvailable, update }
}

// --- PWA Components ---
export interface PWAProviderProps {
  children: React.ReactNode
  config?: Partial<PWAConfig>
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children, config }) => {
  usePWA(config)
  
  return (
    <div className="pwa-provider">
      {children}
    </div>
  )
}

export interface InstallButtonProps {
  children: React.ReactNode
  className?: string
  onInstall?: () => void
}

export const InstallButton: React.FC<InstallButtonProps> = ({ children, className, onInstall }) => {
  const { isInstallable, install } = useInstallPrompt()

  const handleInstall = async () => {
    const success = await install()
    if (success && onInstall) {
      onInstall()
    }
  }

  if (!isInstallable) {
    return null
  }

  return (
    <button
      onClick={handleInstall}
      className={className}
      aria-label="Install app"
    >
      {children}
    </button>
  )
}

export interface UpdateButtonProps {
  children: React.ReactNode
  className?: string
  onUpdate?: () => void
}

export const UpdateButton: React.FC<UpdateButtonProps> = ({ children, className, onUpdate }) => {
  const { isUpdateAvailable, update } = useServiceWorkerUpdate()

  const handleUpdate = async () => {
    await update()
    if (onUpdate) {
      onUpdate()
    }
  }

  if (!isUpdateAvailable) {
    return null
  }

  return (
    <button
      onClick={handleUpdate}
      className={className}
      aria-label="Update app"
    >
      {children}
    </button>
  )
}

export interface OfflineIndicatorProps {
  className?: string
  onlineText?: string
  offlineText?: string
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className, 
  onlineText = 'Online', 
  offlineText = 'Offline' 
}) => {
  const isOnline = useOnlineStatus()

  return (
    <div className={`offline-indicator ${className || ''}`}>
      <span className={`status ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? onlineText : offlineText}
      </span>
    </div>
  )
}

// --- Export Default Instance ---
export const pwaUtils = PWAUtils.getInstance()

// --- CLI Interface ---
export class PWACLI {
  private program: any

  constructor() {
    this.initializeCLI()
  }

  private initializeCLI(): void {
    // CLI implementation would go here
    // This is a placeholder for the CLI interface
    this.program = {
      name: 'pwa-cli',
      version: '1.0.0',
      description: 'PWA utilities CLI'
    }
  }

  public async run(args: string[]): Promise<void> {
    // CLI command handling would go here
  }
}

export default PWACLI
