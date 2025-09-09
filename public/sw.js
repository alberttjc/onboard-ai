/**
 * Service Worker for Enhanced Caching and Performance
 * Provides aggressive caching for static assets and API responses
 */

const CACHE_VERSION = 'v1.2.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/chunks/framework.js',
  '/_next/static/chunks/genai.js',
  '/_next/static/chunks/audio.js',
  '/_next/static/chunks/ui.js'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  '/api/',
  'https://generativelanguage.googleapis.com/'
];

// Cache-first resources (serve from cache, update in background)
const CACHE_FIRST = [
  '/_next/static/',
  '/static/',
  '.js',
  '.css',
  '.woff2',
  '.woff',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📋 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;
  
  // Network-first strategy for API and real-time data
  if (NETWORK_FIRST.some(pattern => url.pathname.startsWith(pattern))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Cache-first strategy for static assets
  if (CACHE_FIRST.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Stale-while-revalidate for pages
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// Network-first strategy with fallback
async function networkFirstStrategy(request) {
  try {
    console.log('🌐 Network-first:', request.url);
    
    // Set timeout for network requests
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), 5000)
    );
    
    const response = await Promise.race([networkPromise, timeoutPromise]);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('🔄 Network failed, trying cache:', error.message);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or error response
    return new Response('Offline - please check your connection', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache-first strategy with background update
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('📦 Cache hit:', request.url);
    
    // Background update for static assets
    fetch(request)
      .then(response => {
        if (response.ok) {
          const cache = caches.open(STATIC_CACHE);
          cache.then(c => c.put(request, response));
        }
      })
      .catch(() => {}); // Ignore background update failures
    
    return cachedResponse;
  }
  
  console.log('🌐 Cache miss, fetching:', request.url);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch:', request.url, error);
    return new Response('Asset not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Background fetch to update cache
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse); // Fallback to cached version on error
  
  // Return cached version immediately if available
  if (cachedResponse) {
    console.log('📦 Serving from cache, updating in background:', request.url);
    return cachedResponse;
  }
  
  // Wait for network if no cached version
  console.log('🌐 No cache, waiting for network:', request.url);
  return fetchPromise;
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CLEAR_CACHE':
      clearAllCaches()
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize()
        .then((size) => {
          event.ports[0].postMessage({ success: true, size });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'PREFETCH_RESOURCES':
      prefetchResources(payload.urls)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
  }
});

// Utility functions
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return Math.round(totalSize / 1024 / 1024 * 100) / 100; // MB
}

async function prefetchResources(urls) {
  const cache = await caches.open(STATIC_CACHE);
  
  return Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('🔄 Prefetched:', url);
        }
      } catch (error) {
        console.warn('⚠️ Failed to prefetch:', url, error);
      }
    })
  );
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
  // Skip monitoring for certain requests to reduce overhead
  const url = new URL(event.request.url);
  if (url.pathname.includes('/_next/static/') || 
      url.pathname.includes('/favicon.ico')) {
    return;
  }
  
  const startTime = performance.now();
  
  event.respondWith(
    handleRequest(event.request)
      .then(response => {
        const duration = performance.now() - startTime;
        
        // Log slow requests for optimization
        if (duration > 1000) {
          console.warn(`🐌 Slow request detected: ${event.request.url} took ${duration.toFixed(2)}ms`);
        }
        
        return response;
      })
  );
});

async function handleRequest(request) {
  // Your existing fetch handling logic here
  return fetch(request);
}

console.log('🚀 Service Worker loaded and ready for performance optimization!');
