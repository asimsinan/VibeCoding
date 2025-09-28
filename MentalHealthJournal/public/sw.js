// Service Worker for Mental Health Journal App
// Provides offline functionality and caching

const CACHE_NAME = 'mood-tracker-v1'
const STATIC_CACHE_NAME = 'mood-tracker-static-v1'
const DYNAMIC_CACHE_NAME = 'mood-tracker-dynamic-v1'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/mood',
  '/mood/history',
  '/trends',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Static files cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static files', error)
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
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // Handle page requests
    event.respondWith(handlePageRequest(request))
  } else if (request.destination === 'script' || request.destination === 'style') {
    // Handle static assets
    event.respondWith(handleStaticAsset(request))
  } else if (url.pathname.startsWith('/api/')) {
    // Handle API requests
    event.respondWith(handleApiRequest(request))
  } else {
    // Handle other requests
    event.respondWith(handleOtherRequest(request))
  }
})

// Handle page requests with offline fallback
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    // If it's a 404, don't try cache - just return the 404
    if (networkResponse.status === 404) {
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url)
    
    // Try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // For non-existent routes, return a 404 response instead of offline page
    if (request.destination === 'document') {
      return new Response(
        get404Page(),
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }
    
    throw error
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Try network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset', request.url)
    throw error
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Service Worker: Network failed for API, trying cache', request.url)
    
    // Try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'OFFLINE',
          message: 'You are currently offline. Please check your connection and try again.'
        },
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Offline page HTML
function getOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Mental Health Journal App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f9fafb;
          color: #111827;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
          padding: 40px 20px;
        }
        .icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background-color: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        h1 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        p {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 24px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
        }
        .button:hover {
          background-color: #2563eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">
          <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h1>You're Offline</h1>
        <p>It looks like you're not connected to the internet. Don't worry, your mood data is safe and will sync when you're back online.</p>
        <a href="/" class="button">Try Again</a>
      </div>
    </body>
    </html>
  `
}

// 404 page HTML
function get404Page() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Page Not Found - Mental Health Journal App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f9fafb;
          color: #111827;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
          padding: 40px 20px;
        }
        .icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background-color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        h1 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        p {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 24px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
        }
        .button:hover {
          background-color: #2563eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">
          <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist. It might have been moved or deleted.</p>
        <a href="/" class="button">Go Home</a>
      </div>
    </body>
    </html>
  `
}

// Background sync for mood entries
self.addEventListener('sync', (event) => {
  if (event.tag === 'mood-sync') {
    console.log('Service Worker: Background sync triggered')
    event.waitUntil(syncMoodEntries())
  }
})

// Sync mood entries when back online
async function syncMoodEntries() {
  try {
    // Get pending mood entries from IndexedDB
    const pendingEntries = await getPendingMoodEntries()
    
    for (const entry of pendingEntries) {
      try {
        const response = await fetch('/api/v1/mood-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(entry)
        })
        
        if (response.ok) {
          // Mark as synced
          await markMoodEntryAsSynced(entry.id)
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync mood entry', entry.id, error)
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed', error)
  }
}

// Helper functions for IndexedDB operations
async function getPendingMoodEntries() {
  // This would interact with IndexedDB to get unsynced entries
  // Implementation depends on your IndexedDB setup
  return []
}

async function markMoodEntryAsSynced(entryId) {
  // This would update the entry in IndexedDB to mark it as synced
  // Implementation depends on your IndexedDB setup
  console.log('Service Worker: Marking entry as synced', entryId)
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: [
        {
          action: 'log-mood',
          title: 'Log Mood',
          icon: '/icons/shortcut-mood.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'log-mood') {
    event.waitUntil(
      clients.openWindow('/mood')
    )
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

console.log('Service Worker: Loaded')
