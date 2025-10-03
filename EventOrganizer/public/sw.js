#!/usr/bin/env node
/**
 * Professional Service Worker Implementation
 * 
 * Implements comprehensive PWA features including:
 * - Offline capabilities
 * - Background sync
 * - Push notifications
 * - Cache strategies
 * - Update management
 * - Performance optimization
 */

const CACHE_NAME = 'virtual-event-organizer-v1'
const STATIC_CACHE_NAME = 'static-assets-v1'
const DYNAMIC_CACHE_NAME = 'dynamic-assets-v1'
const API_CACHE_NAME = 'api-cache-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/offline.html',
  '/_next/static/css/',
  '/_next/static/js/',
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/v1/events',
  '/api/v1/sessions',
  '/api/v1/notifications',
]

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME
            ) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients
      self.clients.claim(),
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticRequest(request))
  } else if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(handleImageRequest(request))
  } else if (url.pathname.startsWith('/fonts/')) {
    event.respondWith(handleFontRequest(request))
  } else {
    event.respondWith(handlePageRequest(request))
  }
})

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for API request')
    
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Offline - API not available',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', request.url)
    return new Response('Static asset not available offline', { status: 404 })
  }
}

// Handle image requests with stale-while-revalidate strategy
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request)
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, response)
          })
        }
      })
      .catch(() => {
        // Ignore background fetch errors
      })
    
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to fetch image:', request.url)
    return new Response('Image not available offline', { status: 404 })
  }
}

// Handle font requests with cache-first strategy
async function handleFontRequest(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to fetch font:', request.url)
    return new Response('Font not available offline', { status: 404 })
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for page request')
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    return new Response('Page not available offline', { status: 404 })
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag)
  
  switch (event.tag) {
    case 'background-sync':
      event.waitUntil(doBackgroundSync())
      break
    case 'event-registration':
      event.waitUntil(syncEventRegistrations())
      break
    case 'notification-send':
      event.waitUntil(syncNotifications())
      break
    default:
      console.log('Service Worker: Unknown sync tag:', event.tag)
  }
})

// Background sync implementation
async function doBackgroundSync() {
  try {
    console.log('Service Worker: Performing background sync')
    
    // Sync offline event registrations
    await syncEventRegistrations()
    
    // Sync offline notifications
    await syncNotifications()
    
    // Sync offline data
    await syncOfflineData()
    
    console.log('Service Worker: Background sync completed')
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error)
  }
}

// Sync offline event registrations
async function syncEventRegistrations() {
  try {
    const offlineRegistrations = await getOfflineData('event-registrations')
    
    for (const registration of offlineRegistrations) {
      try {
        const response = await fetch('/api/v1/events/' + registration.eventId + '/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registration.data),
        })
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineData('event-registrations', registration.id)
          console.log('Service Worker: Synced event registration:', registration.id)
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync event registration:', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync event registrations:', error)
  }
}

// Sync offline notifications
async function syncNotifications() {
  try {
    const offlineNotifications = await getOfflineData('notifications')
    
    for (const notification of offlineNotifications) {
      try {
        const response = await fetch('/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notification.data),
        })
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineData('notifications', notification.id)
          console.log('Service Worker: Synced notification:', notification.id)
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync notification:', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync notifications:', error)
  }
}

// Sync offline data
async function syncOfflineData() {
  try {
    const offlineData = await getOfflineData('general')
    
    for (const data of offlineData) {
      try {
        const response = await fetch(data.url, {
          method: data.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data.body),
        })
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineData('general', data.id)
          console.log('Service Worker: Synced offline data:', data.id)
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync offline data:', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync offline data:', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  let notificationData = {
    title: 'Virtual Event Organizer',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/open-icon.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png',
      },
    ],
  }
  
  if (event.data) {
    try {
      const pushData = event.data.json()
      notificationData = { ...notificationData, ...pushData }
    } catch (error) {
      console.error('Service Worker: Failed to parse push data:', error)
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.notification.tag)
  
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data)
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(event.data.urls))
      break
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(event.data.cacheName))
      break
    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize().then((size) => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size })
      }))
      break
    default:
      console.log('Service Worker: Unknown message type:', event.data.type)
  }
})

// Cache specific URLs
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    await cache.addAll(urls)
    console.log('Service Worker: Cached URLs:', urls)
  } catch (error) {
    console.error('Service Worker: Failed to cache URLs:', error)
  }
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName)
    console.log('Service Worker: Cleared cache:', cacheName)
  } catch (error) {
    console.error('Service Worker: Failed to clear cache:', error)
  }
}

// Get cache size
async function getCacheSize() {
  try {
    const cacheNames = await caches.keys()
    let totalSize = 0
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      totalSize += keys.length
    }
    
    return totalSize
  } catch (error) {
    console.error('Service Worker: Failed to get cache size:', error)
    return 0
  }
}

// Offline data management
async function getOfflineData(type) {
  try {
    const cache = await caches.open('offline-data')
    const response = await cache.match(`/offline-data/${type}`)
    
    if (response) {
      return await response.json()
    }
    
    return []
  } catch (error) {
    console.error('Service Worker: Failed to get offline data:', error)
    return []
  }
}

async function removeOfflineData(type, id) {
  try {
    const cache = await caches.open('offline-data')
    const data = await getOfflineData(type)
    const filteredData = data.filter(item => item.id !== id)
    
    await cache.put(`/offline-data/${type}`, new Response(JSON.stringify(filteredData)))
  } catch (error) {
    console.error('Service Worker: Failed to remove offline data:', error)
  }
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
  const startTime = Date.now()
  
  event.respondWith(
    handleRequest(event.request).then((response) => {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Log slow requests
      if (duration > 1000) {
        console.warn('Service Worker: Slow request detected:', {
          url: event.request.url,
          duration: duration + 'ms',
        })
      }
      
      return response
    })
  )
})

// Handle request with performance monitoring
async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    return handleAPIRequest(request)
  } else if (url.pathname.startsWith('/_next/static/')) {
    return handleStaticRequest(request)
  } else if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/icons/')) {
    return handleImageRequest(request)
  } else if (url.pathname.startsWith('/fonts/')) {
    return handleFontRequest(request)
  } else {
    return handlePageRequest(request)
  }
}

console.log('Service Worker: Loaded successfully')
