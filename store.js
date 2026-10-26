// The demo store's own behaviour: cart count, toasts, size and quantity, gallery, mobile menu, and the
// "see it without Diwali mode" switch. TrooFestive itself is the loader script on each page.
(function () {
  var off = /[?&]troofestive=off\b/.test(location.search);
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  // Diwali mode on/off switch, and keep the choice on links between the two pages
  var sw = document.getElementById('mode-switch');
  if (sw) {
    sw.textContent = off ? 'Turn Diwali mode back on →' : 'See this store without Diwali mode →';
    sw.href = off ? location.pathname : location.pathname + '?troofestive=off';
  }
  if (off) [].forEach.call(document.querySelectorAll('a[href$=".html"], a[href="./"]'), function (a) {
    if (a.id !== 'mode-switch') a.href = a.getAttribute('href') + '?troofestive=off';
  });

  // cart
  var count = +(store.get('saanjh-cart') || 0);
  var badge = document.querySelector('.cart-count');
  function showCount() { if (badge) { badge.textContent = count; badge.hidden = !count; } }
  showCount();
  var toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  var t;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(t); t = setTimeout(function () { toast.classList.remove('show'); }, 2600); }
  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      var qty = +((document.getElementById('qty') || {}).textContent || 1);
      count += add.hasAttribute('data-qty') ? qty : 1; store.set('saanjh-cart', count); showCount();
      say('Added to cart: ' + add.getAttribute('data-add'));
    }
    if (e.target.closest('[data-buy]')) { e.preventDefault(); say('This is a demo store, so checkout is switched off.'); }
  });

  // mobile menu
  var mb = document.querySelector('.menu-btn'), nav = document.querySelector('.nav');
  if (mb && nav) mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });

  // product page: size, quantity, gallery
  var price = document.getElementById('price');
  [].forEach.call(document.querySelectorAll('.pill'), function (p, i, all) {
    p.addEventListener('click', function () {
      [].forEach.call(all, function (q) { q.setAttribute('aria-pressed', q === p); });
      if (price) price.innerHTML = p.getAttribute('data-price');
    });
  });
  var q = document.getElementById('qty');
  [].forEach.call(document.querySelectorAll('[data-step]'), function (b) {
    b.addEventListener('click', function () { q.textContent = Math.max(1, Math.min(9, +q.textContent + +b.getAttribute('data-step'))); });
  });
  var main = document.getElementById('main-img');
  [].forEach.call(document.querySelectorAll('.thumbs button'), function (b, i, all) {
    b.addEventListener('click', function () {
      [].forEach.call(all, function (x) { x.setAttribute('aria-current', x === b); });
      main.src = b.querySelector('img').src;
    });
  });
})();
