/* GABPro — service worker (opcional). Coloque este arquivo na MESMA pasta do GABPro.html no site.
   Guarda uma cópia do sistema e das bibliotecas para abrir mais rápido e mesmo com internet instável.
   Os dados (Apps Script / planilha) nunca são guardados aqui: sempre vêm da nuvem. */
const CACHE = 'gabpro-4.5.0';
const ESSENCIAIS = ['./', './GABPro.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ESSENCIAIS.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('gabpro-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Dados do sistema: sempre direto da nuvem
  if (/script\.google(usercontent)?\.com$/.test(url.hostname) || url.hostname.endsWith('googleusercontent.com')) return;
  // Página do sistema: tenta a versão mais nova; sem internet, usa a cópia
  if (req.mode === 'navigate' || (url.origin === self.location.origin && /\.html?$/.test(url.pathname))) {
    e.respondWith(fetch(req).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); return r; }).catch(() => caches.match(req).then((r) => r || caches.match('./GABPro.html'))));
    return;
  }
  // Bibliotecas e fontes (CDN): usa a cópia e atualiza em segundo plano
  if (/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.tailwindcss\.com/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((cached) => {
      const rede = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => cached);
      return cached || rede;
    })));
  }
});
