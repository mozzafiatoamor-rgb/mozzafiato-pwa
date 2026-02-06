// Service Worker para Mozzafiato PWA
const CACHE_NAME = 'mozzafiato-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/produccion.html',
  '/ventas.html',
  '/inventario.html',
  '/stock-bajo.html',
  '/reportes.html',
  '/productos.html',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, la guardamos en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, usamos el cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no está en cache, mostramos página offline
          return caches.match('/index.html');
        });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncDataWithServer());
  }
});

async function syncDataWithServer() {
  // Aquí sincronizaremos con Google Sheets
  console.log('Sincronizando datos pendientes...');
  
  // Obtener datos pendientes del IndexedDB
  const pendingData = await getPendingData();
  
  if (pendingData && pendingData.length > 0) {
    try {
      // Enviar a Google Sheets
      // await sendToGoogleSheets(pendingData);
      console.log('Datos sincronizados correctamente');
    } catch (error) {
      console.error('Error al sincronizar:', error);
    }
  }
}

async function getPendingData() {
  // Esta función se conectará con IndexedDB
  // Por ahora retorna un array vacío
  return [];
}

// Notificaciones push (opcional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Mozzafiato';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});