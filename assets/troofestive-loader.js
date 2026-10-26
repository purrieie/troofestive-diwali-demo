/* TrooFestive loader (always loaded, kept tiny). Reads the config the app embed printed, decides whether the festive
   mode should run on this page, and only then fetches the decor engine, after the page has loaded and the browser is idle.
   Add ?troofestive=off to any URL to see the store without it (handy for speed comparisons). */
(function () {
  'use strict';
  if (window.__trooFestive) return;
  window.__trooFestive = 1;
  var el = document.getElementById('troofestive-config');
  if (!el || /[?&]troofestive=off\b/.test(location.search)) return;
  var d;
  try { d = JSON.parse(el.textContent); } catch (e) { return; }
  var c = d.cfg || {};
  if (c.enabled === false) return;

  // schedule, in the shopper's local date
  var t = new Date(), today = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  if (c.startDate && today < c.startDate) return;
  if (c.endDate && today > c.endDate) return;

  // page type straight from Liquid's template name
  var map = { index: 'home', product: 'product', collection: 'collection', search: 'collection', 'list-collections': 'collection', cart: 'cart' };
  var pt = map[d.page] || 'other';
  var pages = c.pages || {};
  if (pages[pt] === false) return;
  // optionally only some collections, some products (or the products in some collections) and some pages
  function has(list, h) { return !!(list && h) && list.some(function (x) { return (x && x.handle) === h || x === h; }); }
  function some(list) { return !!(list && list.length); }
  if (pt === 'collection' && d.page === 'collection' && some(pages.collections) && !has(pages.collections, d.handle)) return;
  if (pt === 'product' && (some(pages.products) || some(pages.productsIn)) && !has(pages.products, d.handle) &&
    !(d.inCollections || []).some(function (h) { return has(pages.productsIn, h); })) return;
  if (pt === 'other' && some(pages.paths)) {
    var path = location.pathname.replace(/\/$/, '');
    if (!pages.paths.some(function (p) { p = String(p).replace(/\/$/, ''); return p && (p.charAt(0) === '/' ? path.slice(-p.length) === p : p === d.handle); })) return;
  }

  function copy(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

  // images: ours (Diwali), with the brand's own creatives in place of any they uploaded. A custom theme uses only the
  // brand's. Shopify's CDN resizes them to what each effect draws.
  var B = c.assets || {}, look0 = c.look || {}, A = copy(look0.theme === 'custom' ? {} : d.assets, {});
  function sized(u, w) { return /cdn\.shopify\.com|\/cdn\/shop\//.test(u) ? u + (u.indexOf('?') > -1 ? '&' : '?') + 'width=' + w : u; }
  function list(v, w) { return (v || []).filter(Boolean).map(function (u) { return sized(u, w); }); }
  if (some(B.hanging)) A.kandil = list(B.hanging, 320);
  if (some(B.titles)) A.diya = list(B.titles, 120);
  if (B.envelopeClosed) A.lifafaClosed = sized(B.envelopeClosed, 480);
  if (B.envelopeOpen) A.lifafa = sized(B.envelopeOpen, 480);
  if (B.cursor) A.cursorDiya = A.cursorPhuljhadi = sized(B.cursor, 48);

  function run() {
    var E = window.TrooDiwali || window.TrooFestive; // the Diwali engine, or the Halloween one when the theme is Halloween
    if (!E) return;
    var look = c.look || {}, features = copy(look.features || {}, { string: look.strings !== 'off' });
    E.start(copy(look, { features: features, assets: A, sliced: true, pageType: pt }));
    var m = c.moments;
    if (m === null || (m || {}).off === true || !d.moments) return;
    var mm = copy(m || {}, { assets: A, theme: look.theme || 'diwali' });
    if (window.Shopify && window.Shopify.designMode) mm.loader = false; // theme editor: no page-change chakri
    if (mm.shagunEndsAt && today > mm.shagunEndsAt) mm.shagun = false; // never show a code that has expired
    // moments (cursor, celebration, envelope, loader) are a second file, fetched at the next idle moment
    whenIdle(function () { load(d.moments, function () { if (E.moments) E.moments.start(mm); }); });
  }

  function load(src, done) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = done;
    document.head.appendChild(s);
  }
  function boot() { load(d.engine, run); }

  function whenIdle(f) { (window.requestIdleCallback || function (g) { setTimeout(g, 200); })(f, { timeout: 3000 }); }

  // never compete with the store's own first paint: wait for first-contentful-paint (5 s fallback, e.g. background tabs)
  function afterPaint() {
    var done = 0, o, P = window.PerformanceObserver;
    function go() { if (done) return; done = 1; try { o && o.disconnect(); } catch (e) {} whenIdle(boot); }
    if (!P || !P.supportedEntryTypes || P.supportedEntryTypes.indexOf('paint') < 0) return go();
    try { o = new PerformanceObserver(function (l) { if (l.getEntriesByName('first-contentful-paint').length) go(); }); o.observe({ type: 'paint', buffered: true }); } catch (e) { return go(); }
    setTimeout(go, 5000);
  }
  if (document.readyState === 'complete') afterPaint();
  else addEventListener('load', afterPaint, { once: true });
})();
