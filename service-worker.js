// // Service worker for AniCart
// const CACHE_NAME = 'anicart-cache-v1';
// const ASSETS_TO_CACHE = [
//   '/',
//   '/index.html',
//   '/index.css',
//   '/index.js',
//   '/asset/hero.webp',
//   '/asset/anicartfulllogo.webp',
//   '/asset/favicon_io/favicon.ico',
//   'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap'
// ];

// // Install event - cache assets
// self.addEventListener('install', event => {
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then(cache => {
//         console.log('Opened cache');
//         return cache.addAll(ASSETS_TO_CACHE);
//       })
//       .catch(error => {
//         console.error('Pre-caching failed:', error);
//       })
//   );
  
//   // Activate the service worker immediately
//   self.skipWaiting();
// });

// // Activate event - clean up old caches
// self.addEventListener('activate', event => {
//   event.waitUntil(
//     caches.keys().then(cacheNames => {
//       return Promise.all(
//         cacheNames.map(cacheName => {
//           if (cacheName !== CACHE_NAME) {
//             console.log('Deleting old cache:', cacheName);
//             return caches.delete(cacheName);
//           }
//         })
//       );
//     })
//   );
  
//   // Take control of all clients immediately
//   event.waitUntil(self.clients.claim());
// });

// // Fetch event - respond with cached resources or fetch
// self.addEventListener('fetch', event => {
//   // Skip cross-origin requests
//   if (!event.request.url.startsWith(self.location.origin) && 
//       !event.request.url.includes('fonts.googleapis.com')) {
//     return;
//   }
  
//   // Skip Firebase API requests
//   if (event.request.url.includes('firebaseio.com') || 
//       event.request.url.includes('gstatic.com')) {
//     return;
//   }

//   event.respondWith(
//     caches.match(event.request)
//       .then(response => {
//         // Return cached response if found
//         if (response) {
//           return response;
//         }
        
//         // Clone the request
//         const fetchRequest = event.request.clone();
        
//         // Make network request
//         return fetch(fetchRequest)
//           .then(response => {
//             // Check if valid response
//             if (!response || response.status !== 200 || response.type !== 'basic') {
//               return response;
//             }
            
//             // Clone the response
//             const responseToCache = response.clone();
            
//             // Open cache and store response
//             caches.open(CACHE_NAME)
//               .then(cache => {
//                 cache.put(event.request, responseToCache);
//               });
              
//             return response;
//           })
//           .catch(error => {
//             console.error('Fetch failed:', error);
//             // Optionally return a custom offline fallback here
//           });
//       })
//   );
// });

// // Handle sync events for offline data
// self.addEventListener('sync', event => {
//   if (event.tag === 'sync-anime-data') {
//     event.waitUntil(syncData());
//   }
// });

// // Function to sync data when back online
// function syncData() {
//   // This would be implemented to push locally saved data to Firebase
//   // when the connection is restored
//   return self.clients.matchAll()
//     .then(clients => {
//       if (clients && clients.length) {
//         // Post message to client to trigger sync
//         clients[0].postMessage({
//           type: 'SYNC_REQUIRED'
//         });
//       }
//     });
// } 