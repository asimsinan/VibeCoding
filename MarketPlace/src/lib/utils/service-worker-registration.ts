// Service Worker Registration Utility
// Handles service worker registration and updates

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[SW] New service worker available');
                  
                  // Notify user about update
                  if (confirm('New version available! Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed, reloading page');
        window.location.reload();
      });
    });
  }
}

export function unregisterServiceWorker(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[SW] Service Worker unregistered');
      })
      .catch((error) => {
        console.error('[SW] Service Worker unregistration failed:', error);
      });
  }
}

export function checkServiceWorkerUpdate(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.update();
        console.log('[SW] Checking for service worker update');
      })
      .catch((error) => {
        console.error('[SW] Service Worker update check failed:', error);
      });
  }
}

export function sendMessageToServiceWorker(message: any): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

export function requestPushNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Not in browser environment'));
  }

  if (!('Notification' in window)) {
    return Promise.reject(new Error('Notifications not supported'));
  }

  return Notification.requestPermission();
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('[SW] Push notifications not supported');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('[SW] Push notification permission denied');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      ),
    });

    console.log('[SW] Push notification subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('[SW] Push notification subscription failed:', error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const result = await subscription.unsubscribe();
      console.log('[SW] Push notification unsubscribed:', result);
      return result;
    }

    return false;
  } catch (error) {
    console.error('[SW] Push notification unsubscription failed:', error);
    return false;
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
