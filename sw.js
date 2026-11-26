/*
 * Offline mode for the CV website.
 * Strategy: network first, cache as fallback. Updates on GitHub always show up
 * immediately when online; without internet the last seen version still works.
 * Only this site's own files are cached – nothing from anywhere else.
 */
const CACHE = 'bk-cv-2026-11-27b';
const CORE = [
    './', './index.html', './404.html', './css/style.css', './js/main.js', './manifest.webmanifest',
    './img/portrait-720.webp', './img/portrait-400.webp', './img/avatar-240.webp',
    './fonts/geist-latin-wght-normal.woff2', './fonts/geist-mono-latin-400-normal.woff2',
    './fonts/geist-mono-latin-500-normal.woff2', './fonts/instrument-serif-latin-400-italic.woff2',
    './lebenslauf.txt', './cv.txt'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
    e.respondWith(
        fetch(req).then((res) => {
            if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
            return res;
        }).catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error())))
    );
});
