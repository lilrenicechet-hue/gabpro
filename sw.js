// =====================================================================
// GABDoc · service worker (sw.js)
// Coloque este arquivo na mesma pasta do index.html no GitHub.
// Faz o aplicativo instalado abrir mesmo com internet instável.
// Os dados NUNCA ficam em cache: as chamadas ao Apps Script vão sempre direto à rede.
// =====================================================================
const VERSAO = 'gabdoc-v1.6.0';
const ESSENCIAIS = ['./', './index.html'];
const CDNS = ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  // Se algum arquivo faltar, instala mesmo assim (não trava o aplicativo)
  e.waitUntil(caches.open(VERSAO)
    .then(c => Promise.all(ESSENCIAIS.map(u => c.add(u).catch(() => null))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                                   // POST da API: sempre rede
  const url = new URL(req.url);
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return; // dados: sempre rede
  const mesmoSite = url.origin === self.location.origin;
  if (!mesmoSite && !CDNS.includes(url.hostname)) return;

  if (mesmoSite && req.mode === 'navigate') {
    // Página: rede primeiro (pega atualizações); sem internet, usa a cópia guardada
    e.respondWith(
      fetch(req)
        .then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // Bibliotecas (Tailwind, ícones, gráficos, fontes): cache primeiro, atualiza em segundo plano
  e.respondWith(caches.match(req).then(guardado => {
    const rede = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); }
      return r;
    }).catch(() => guardado);
    return guardado || rede;
  }));
});
