/* GABOrg · service worker
 * Página e arquivo.js: sempre da rede primeiro (atualizações chegam na hora); a cópia guardada só entra sem internet.
 * Bibliotecas (ícones, fontes, mapa): guardadas e reaproveitadas. Chamadas ao Apps Script nunca são guardadas. */
const VERSAO = 'gaborg-1.54.1', CDN = 'gaborg-cdn-1', MAPA = 'gaborg-mapa-1';
const CASCA = ['./', './index.html', './arquivo.js', './manifest.webmanifest', './gaborg-192.png', './gaborg-512.png', './gaborg-maskable.png', './gaborg-apple.png'];
const EH_CDN = /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;
const EH_MAPA = /(^|\.)(tile\.openstreetmap\.org|arcgisonline\.com|servicodados\.ibge\.gov\.br|upload\.wikimedia\.org)$/;
const NUNCA = /(^|\.)(script\.google\.com|script\.googleusercontent\.com|googleapis\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(CASCA.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![VERSAO, CDN, MAPA].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'pular') self.skipWaiting(); });

async function redePrimeiro(req){
  const c = await caches.open(VERSAO);
  try {
    const r = await fetch(req);
    if (r && r.ok) c.put(req.mode === 'navigate' ? './index.html' : req.url.split('?')[0], r.clone()).catch(() => {});
    return r;
  } catch (err) {
    const g = (req.mode === 'navigate' ? await c.match('./index.html') : null) || await c.match(req.url.split('?')[0]) || await c.match(req, { ignoreSearch: true });
    if (g) return g;
    throw err;
  }
}
async function guardadoPrimeiro(req, nome, limite){
  const c = await caches.open(nome), g = await c.match(req);
  const busca = fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { c.put(req, r.clone()).then(() => limite && aparar(c, limite)).catch(() => {}); }
    return r;
  }).catch(() => g);
  return g || busca;
}
async function aparar(c, limite){ const ks = await c.keys(); if (ks.length > limite) await Promise.all(ks.slice(0, ks.length - limite).map(k => c.delete(k))); }

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (NUNCA.test(u.hostname) && !EH_CDN.test(u.hostname)) return;
  if (u.origin === location.origin) { e.respondWith(redePrimeiro(req)); return; }
  if (EH_CDN.test(u.hostname)) { e.respondWith(guardadoPrimeiro(req, CDN, 300)); return; }
  if (EH_MAPA.test(u.hostname)) { e.respondWith(guardadoPrimeiro(req, MAPA, 1500)); }
});
