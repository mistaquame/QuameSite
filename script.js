/* ============================================
   QuameVoice Landing Page — Interactions
   ============================================ */

(function () {
  'use strict';

  // ── NAVBAR SCROLL BEHAVIOR ──

  const navbar = document.querySelector('.navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > lastScroll && currentScroll > 80) {
      navbar.style.transform = 'translateY(-100%)';
    } else {
      navbar.style.transform = 'translateY(0)';
    }
    lastScroll = currentScroll;
  }, { passive: true });

  // ── SMOOTH SCROLL FOR NAV LINKS ──

  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ── DOWNLOAD TRACKING ──

  const dlBtn = document.getElementById('dl-win');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      // Simple analytics ping — no external dependencies
      try {
        localStorage.setItem(
          'qv_download',
          JSON.stringify({
            version: '1.0.4',
            platform: 'windows',
            time: new Date().toISOString()
          })
        );
      } catch (_) { /* storage unavailable */ }
    });
  }

  // ── DOWNLOAD COUNTER (GitHub API) ──

  (function fetchDownloadCount() {
    const el = document.getElementById('dl-count');
    if (!el) return;

    // Check cache (1 hour TTL)
    const cached = (() => {
      try {
        const raw = localStorage.getItem('qv_dl_count');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < 3600000) return parsed.count;
        return null;
      } catch { return null; }
    })();

    if (cached !== null) {
      el.textContent = formatNumber(cached);
      return;
    }

    fetch('https://api.github.com/repos/mistaquame/QuameSite/releases/latest')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (!data.assets) return;
        // Find installer asset
        const asset = data.assets.find(a =>
          a.name.endsWith('.exe') && a.name.includes('Setup')
        );
        if (!asset || asset.download_count === undefined) return;
        const count = asset.download_count;
        el.textContent = formatNumber(count);
        try {
          localStorage.setItem('qv_dl_count', JSON.stringify({
            count,
            timestamp: Date.now()
          }));
        } catch { /* storage unavailable */ }
      })
      .catch(() => {
        // Leave '—' or fallback to something
        el.textContent = 'N/A';
      });

    function formatNumber(n) {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    }
  })();

  // ── VIDEO PLAYBACK FALLBACK ──

  const videos = document.querySelectorAll('video.promo-video');
  if (videos.length > 0) {
    videos.forEach(video => {
      // If video fails to load, show the poster image
      video.addEventListener('error', () => {
        const parent = video.closest('.preview-glass');
        if (parent) {
          const img = document.createElement('img');
          img.src = 'assets/promo-thumbnail.jpg';
          img.alt = 'QuameVoice demo';
          img.style.borderRadius = 'calc(var(--radius) - 4px)';
          img.style.width = '100%';
          video.replaceWith(img);
        }
      });
    });
  }

  // ── INTERSECTION OBSERVER: FADE IN CARDS ──

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll(
      '.feature-card, .download-card, .how-step, .download-info-card'
    ).forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(el);
    });
  }

})();
