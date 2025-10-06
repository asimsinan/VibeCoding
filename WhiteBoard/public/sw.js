/**
 * Service Worker
 * 
 * Platform-specific service worker for offline functionality,
 * caching, and background sync for the collaborative whiteboard.
 * 
 * @fileoverview Service worker with offline support and caching
 * @version 1.0.0
 */

const CACHE_NAME = 'whiteboard-v1.0.0'
const OFFLINE_CACHE_NAME = 'whiteboard-offline-v1.0.0'

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/whiteboard',
  '/auth/login',
  '/auth/register',
  '/manifest.json',
  '/offline.html'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/v1/whiteboards',
  '/api/v1/health',
  '/api/v1/version'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Installation complete')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activation complete')
        return self.clients.claim()
      })
      .catch((error) => {
        console.error('Service Worker: Activation failed', error)
      })
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.startsWith('/images/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg')) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // Handle page requests
  event.respondWith(handlePageRequest(request))
})

/**
 * Handle API requests with network-first strategy
 */
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error)
    
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are offline. Please check your connection.',
        code: 'OFFLINE_ERROR'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Static asset fetch failed', error)
    
    // Return a fallback response
    return new Response('Asset not available offline', {
      status: 404,
      statusText: 'Not Found'
    })
  }
}

/**
 * Handle page requests with network-first strategy
 */
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error)
    
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline.html')
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Return a basic offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Collaborative Whiteboard</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
            .retry { margin-top: 20px; }
            button { padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1 class="offline">You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <div class="retry">
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'whiteboard-sync') {
    event.waitUntil(syncWhiteboardData())
  }
})

/**
 * Sync whiteboard data when back online
 */
async function syncWhiteboardData() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions()
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        // Remove from pending actions
        await removePendingAction(action.id)
      } catch (error) {
        console.error('Service Worker: Failed to sync action', action, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

/**
 * Get pending actions from IndexedDB
 */
async function getPendingActions() {
  // This would integrate with IndexedDB to get pending actions
  // For now, return empty array
  return []
}

/**
 * Remove pending action from IndexedDB
 */
async function removePendingAction(actionId) {
  // This would integrate with IndexedDB to remove the action
  // For now, just log
  console.log('Service Worker: Removing pending action', actionId)
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New whiteboard activity',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Whiteboard',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Collaborative Whiteboard', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/whiteboard')
    )
  }
})

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_WHITEBOARD') {
    event.waitUntil(cacheWhiteboardData(event.data.whiteboardId))
  }
})

/**
 * Cache whiteboard data for offline access
 */
async function cacheWhiteboardData(whiteboardId) {
  try {
    const response = await fetch(`/api/v1/whiteboards/${whiteboardId}`)
    if (response.ok) {
      const cache = await caches.open(OFFLINE_CACHE_NAME)
      await cache.put(`/api/v1/whiteboards/${whiteboardId}`, response.clone())
      console.log('Service Worker: Cached whiteboard data', whiteboardId)
    }
  } catch (error) {
    console.error('Service Worker: Failed to cache whiteboard data', error)
  }
}
