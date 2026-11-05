/* TALK VIEW 웹앱 — 오프라인 실행용 서비스 워커.
   이 사이트 자기 파일만 저장(캐시)한다. 대화 파일은 여기를 거치지 않는다(분석은 페이지 메모리에서만). */
const CACHE = "talkview-20261105154905";
const FILES = ["./", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "index.html", "js/advice.js", "js/analyze.js", "js/anon.js", "js/app.js", "js/bigzip.js", "js/charts.js", "js/couple.js", "js/extra.js", "js/parse.js", "js/routine.js", "js/rules.js", "js/sample.js", "js/story.js", "js/summary.js", "js/util.js", "manifest.webmanifest", "vendor/jszip.min.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // 다른 곳으로 가는 요청은 다루지 않음
  // 네트워크 우선(새 버전 반영), 안 되면 저장해 둔 파일
  e.respondWith(fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
});
