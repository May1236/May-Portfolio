/* May — "One Line" interactions */
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('may-theme', next); } catch (e) {}
    });
  }

  /* ---------- Nav scroll + mobile ---------- */
  var nav = document.querySelector('.nav');
  function onScrollNav() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 30); }
  onScrollNav();

  var burger = document.querySelector('.burger');
  var links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('open'); links.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .divider-line, .cap-card').forEach(function (el) { io.observe(el); });

  /* ---------- Hand-drawn line setup ---------- */
  function setLen(path) {
    try {
      var len = path.getTotalLength();
      path.style.setProperty('--len', len);
      path.style.strokeDasharray = len;
      return len;
    } catch (e) { return 0; }
  }
  // uline + divider draw via CSS .in transition
  document.querySelectorAll('.uline svg path, .divider-line path').forEach(setLen);

  // hero signature draws itself on load
  var sig = document.getElementById('sigPath');
  if (sig) {
    var L = setLen(sig);
    sig.style.strokeDashoffset = L;
    if (reduced) { sig.style.strokeDashoffset = 0; }
    else {
      requestAnimationFrame(function () {
        sig.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(.22,.61,.36,1)';
        sig.style.strokeDashoffset = 0;
      });
    }
  }

  // vertical thread draws with scroll progress
  var thread = document.getElementById('threadPath');
  var threadLen = thread ? setLen(thread) : 0;
  function onScroll() {
    onScrollNav();
    if (thread) {
      var h = document.body.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      thread.style.strokeDashoffset = threadLen * (1 - p);
    }
  }
  if (thread && reduced) thread.style.strokeDashoffset = 0;
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Custom cursor (fine pointer only) ---------- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduced) {
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      document.body.classList.add('cursor-on');
      var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
      var cursorFrame = 0;
      function renderCursor() {
        rx += (mx - rx) * 0.32;
        ry += (my - ry) * 0.32;
        dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
        ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
        if (Math.abs(mx - rx) > 0.15 || Math.abs(my - ry) > 0.15) {
          cursorFrame = requestAnimationFrame(renderCursor);
        } else {
          cursorFrame = 0;
        }
      }
      window.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.opacity = ring.style.opacity = 1;
        if (!cursorFrame) cursorFrame = requestAnimationFrame(renderCursor);
      }, { passive: true });
      document.querySelectorAll('a, button, [data-zoom], .work-row').forEach(function (el) {
        el.addEventListener('mouseenter', function () { ring.classList.add('hot'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('hot'); });
      });
      document.addEventListener('mouseleave', function () { dot.style.opacity = ring.style.opacity = 0; });
    }
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduced) {
    document.querySelectorAll('[data-magnet]').forEach(function (el) {
      var rect, magnetFrame = 0, magnetX = 0, magnetY = 0;
      el.addEventListener('mouseenter', function () { rect = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        magnetX = e.clientX - (rect.left + rect.width / 2);
        magnetY = e.clientY - (rect.top + rect.height / 2);
        if (!magnetFrame) magnetFrame = requestAnimationFrame(function () {
          el.style.transform = 'translate3d(' + magnetX * 0.18 + 'px,' + magnetY * 0.22 + 'px,0)';
          magnetFrame = 0;
        });
      });
      el.addEventListener('mouseleave', function () {
        rect = null;
        if (magnetFrame) cancelAnimationFrame(magnetFrame);
        magnetFrame = 0;
        el.style.transform = '';
      });
    });
  }

  /* ---------- Work hover preview (follows cursor) ---------- */
  var preview = document.querySelector('.work-preview');
  if (preview && fine) {
    var pImg = preview.querySelector('img');
    var rows = Array.prototype.slice.call(document.querySelectorAll('.work-row'));
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var active = false, previewFrame = 0;

    // Decode the six small preview files before the first hover.
    rows.forEach(function (row) {
      var src = row.getAttribute('data-img');
      if (!src) return;
      var img = new Image();
      img.decoding = 'async';
      img.src = src;
      if (img.decode) img.decode().catch(function () {});
    });

    function renderPreview() {
      preview.style.setProperty('--preview-x', tx + 'px');
      preview.style.setProperty('--preview-y', ty + 'px');
      previewFrame = 0;
    }
    function requestPreviewFrame() {
      if (!previewFrame) previewFrame = requestAnimationFrame(renderPreview);
    }

    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var src = row.getAttribute('data-img'); if (!src) return;
        if (pImg.getAttribute('src') !== src) pImg.setAttribute('src', src);
        active = true;
        preview.style.setProperty('--preview-x', tx + 'px');
        preview.style.setProperty('--preview-y', ty + 'px');
        preview.classList.add('show');
      });
      row.addEventListener('mouseleave', function () {
        active = false;
        preview.classList.remove('show');
      });
    });
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (active) requestPreviewFrame();
    }, { passive: true });
  }

  /* ---------- Gentle hero glow parallax ---------- */
  if (fine && !reduced) {
    var glows = document.querySelectorAll('.hero-glow');
    var glowX = 0, glowY = 0, glowFrame = 0;
    function renderGlows() {
      glows.forEach(function (g, i) {
        var k = (i + 1) * 14;
        g.style.transform = 'translate3d(' + glowX * k + 'px,' + glowY * k + 'px,0)';
      });
      glowFrame = 0;
    }
    window.addEventListener('mousemove', function (e) {
      glowX = e.clientX / window.innerWidth - 0.5;
      glowY = e.clientY / window.innerHeight - 0.5;
      if (!glowFrame) glowFrame = requestAnimationFrame(renderGlows);
    }, { passive: true });
  }

  /* ---------- Click video for full sound ---------- */
  var vids = Array.prototype.slice.call(document.querySelectorAll('.media-card video, .full-img video'));
  if ('IntersectionObserver' in window) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          var playPromise = video.play();
          if (playPromise && playPromise.catch) playPromise.catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '240px 0px', threshold: 0.01 });
    vids.forEach(function (video) {
      if (video.muted && video.hasAttribute('loop')) videoObserver.observe(video);
    });
  } else {
    vids.forEach(function (video) {
      if (!video.muted || !video.hasAttribute('loop')) return;
      var playPromise = video.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
    });
  }
  vids.forEach(function (v) {
    // add a "tap for sound" hint to autoplaying muted previews
    if (v.closest('.media-card') && v.hasAttribute('muted')) {
      var hint = document.createElement('span');
      hint.className = 'sound-hint';
      hint.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg> Tap for sound';
      v.closest('.media-card').appendChild(hint);
    }
    // First click turns on sound + native controls, then hands full
    // control to the browser (so the user can mute/unmute freely).
    function activate() {
      if (!v.muted) { v.removeEventListener('click', activate); return; }
      vids.forEach(function (o) { if (o !== v) o.muted = true; }); // avoid overlapping audio
      v.muted = false;
      v.setAttribute('controls', '');
      var card = v.closest('.media-card');
      if (card) { var h = card.querySelector('.sound-hint'); if (h) h.style.display = 'none'; }
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      v.removeEventListener('click', activate);
    }
    v.addEventListener('click', activate);
  });

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    document.querySelectorAll('[data-zoom]').forEach(function (el) {
      el.addEventListener('click', function () {
        var img = el.tagName === 'IMG' ? el : el.querySelector('img');
        if (!img) return;
        lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt || '';
        lb.classList.add('open'); document.body.style.overflow = 'hidden';
      });
    });
    var close = function () { lb.classList.remove('open'); document.body.style.overflow = ''; };
    lb.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- BlurText headline (word-by-word blur-in) ---------- */
  document.querySelectorAll('.blurtext[data-text]').forEach(function (el) {
    var parts = el.getAttribute('data-text').split('|');
    el.textContent = '';
    parts.forEach(function (w, i) {
      var raw = w.trim(); if (!raw) return;
      var span = document.createElement('span');
      span.className = 'bw';
      if (raw.charAt(0) === '@') { span.classList.add('am'); raw = raw.slice(1); }
      span.innerHTML = raw;
      span.style.animationDelay = (0.35 + i * 0.12) + 's';
      el.appendChild(span);
    });
    if (reduced) { el.querySelectorAll('.bw').forEach(function (s) { s.style.opacity = 1; s.style.filter = 'none'; s.style.transform = 'none'; }); }
    else { requestAnimationFrame(function () { el.querySelectorAll('.bw').forEach(function (s) { s.classList.add('in'); }); }); }
  });

  /* ---------- Hero video fade-in (graceful if it can't load) ---------- */
  var hv = document.querySelector('.hero-video');
  if (hv) {
    var showVid = function () { hv.classList.add('ready'); };
    if (hv.readyState >= 2) showVid();
    hv.addEventListener('loadeddata', showVid);
    hv.addEventListener('canplay', function () { var p = hv.play(); if (p && p.catch) p.catch(function () {}); });
    hv.addEventListener('error', function () { hv.style.display = 'none'; });
  }

  /* ---------- Active nav link + year ---------- */
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
