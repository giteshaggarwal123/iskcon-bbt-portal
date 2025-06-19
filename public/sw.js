
// Enhanced service worker for push notifications
const CACHE_NAME = 'iskcon-bureau-v1';

self.addEventListener('install', function(event) {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('Push message received:', event);
  
  let notificationData = {
    title: 'ISKCON Bureau Portal',
    body: 'You have a new notification',
    icon: '/lovable-uploads/7ccf6269-31c1-46b9-bc5c-60b58a22c03e.png',
    badge: '/lovable-uploads/7ccf6269-31c1-46b9-bc5c-60b58a22c03e.png',
    tag: 'iskcon-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/lovable-uploads/7ccf6269-31c1-46b9-bc5c-60b58a22c03e.png'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      console.log('Error parsing push data:', e);
      // Use text data if JSON parsing fails
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data || {}
    }
  );

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle notification click
  const data = event.notification.data;
  let url = '/';
  
  if (data && data.module) {
    url = `/${data.module}${data.id ? `/${data.id}` : ''}`;
  }

  // Handle action clicks
  if (event.action === 'view' && data && data.module) {
    url = `/${data.module}${data.id ? `/${data.id}` : ''}`;
  }

  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(function(clientList) {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to the desired URL
          client.postMessage({
            type: 'NAVIGATE',
            url: url
          });
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(self.location.origin + url);
      }
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', function(event) {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Basic caching for offline functionality
self.addEventListener('fetch', function(event) {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip caching for API calls
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase') ||
      event.request.url.includes('chrome-extension:')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(function() {
        // Return a fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});
