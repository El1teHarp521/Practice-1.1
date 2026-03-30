const CACHE_NAME = 'task-manager-v5';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
});

self.addEventListener('push', (event) => {
    let data = { title: 'Напоминание', body: 'Посмотрите список задач' };
    if (event.data) data = event.data.json();
    const options = {
        body: data.body,
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        data: { reminderId: data.reminderId },
        requireInteraction: true,
        actions: data.reminderId ? [{ action: 'snooze', title: '⏳ Отложить на 5 минут' }] : []
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
    const n = event.notification;
    if (event.action === 'snooze') {
        event.waitUntil(fetch(`http://localhost:3001/snooze?reminderId=${n.data.reminderId}`, { method: 'POST' }).then(() => n.close()));
    } else {
        n.close();
    }
});