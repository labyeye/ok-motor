// ========================================
// SCROLL-BASED BACKGROUND & NAVBAR COLOR CHANGE
// Reusable across all pages
// ========================================

(function() {
  'use strict';

  // Configuration
  const SCROLL_THRESHOLD = 100; // pixels from top to trigger change
  const THROTTLE_DELAY = 16; // ~60fps for smooth performance

  // Cache DOM elements
  let header = null;
  let body = null;
  let lastScrollPos = 0;
  let ticking = false;

  /**
   * Initialize scroll listener
   */
  function init() {
    // Get elements
    header = document.querySelector('.site-header');
    body = document.body;

    if (!header || !body) {
      console.warn('Header or body element not found. Scroll behavior not initialized.');
      return;
    }

    // Check initial scroll position (in case page loads scrolled)
    checkScrollPosition();

    // Add optimized scroll listener with requestAnimationFrame
    window.addEventListener('scroll', onScroll, { passive: true });

    // Also check on resize (orientation change on mobile)
    window.addEventListener('resize', checkScrollPosition, { passive: true });
  }

  /**
   * Scroll event handler with throttling
   */
  function onScroll() {
    lastScrollPos = window.pageYOffset || document.documentElement.scrollTop;

    if (!ticking) {
      window.requestAnimationFrame(function() {
        checkScrollPosition();
        ticking = false;
      });
      ticking = true;
    }
  }

  /**
   * Check scroll position and toggle classes
   */
  function checkScrollPosition() {
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollPos > SCROLL_THRESHOLD) {
      // Scrolled down - apply white background
      if (!body.classList.contains('scrolled')) {
        body.classList.add('scrolled');
      }
      if (!header.classList.contains('scrolled')) {
        header.classList.add('scrolled');
      }
    } else {
      // At top - remove white background
      if (body.classList.contains('scrolled')) {
        body.classList.remove('scrolled');
      }
      if (header.classList.contains('scrolled')) {
        header.classList.remove('scrolled');
      }
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
