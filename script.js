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
            version: '1.0.3',
            platform: 'windows',
            time: new Date().toISOString()
          })
        );
      } catch (_) { /* storage unavailable */ }
    });
  }

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
