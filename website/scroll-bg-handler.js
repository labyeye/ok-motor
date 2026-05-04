(function () {
  "use strict";

  const SCROLL_THRESHOLD = 100;
  const THROTTLE_DELAY = 16;

  let header = null;
  let body = null;
  let lastScrollPos = 0;
  let ticking = false;

  function init() {
    header = document.querySelector(".site-header");
    body = document.body;

    if (!header || !body) {
      console.warn(
        "Header or body element not found. Scroll behavior not initialized.",
      );
      return;
    }

    checkScrollPosition();

    window.addEventListener("scroll", onScroll, { passive: true });

    window.addEventListener("resize", checkScrollPosition, { passive: true });
  }

  function onScroll() {
    lastScrollPos = window.pageYOffset || document.documentElement.scrollTop;

    if (!ticking) {
      window.requestAnimationFrame(function () {
        checkScrollPosition();
        ticking = false;
      });
      ticking = true;
    }
  }

  function checkScrollPosition() {
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollPos > SCROLL_THRESHOLD) {
      if (!body.classList.contains("scrolled")) {
        body.classList.add("scrolled");
      }
      if (!header.classList.contains("scrolled")) {
        header.classList.add("scrolled");
      }
    } else {
      if (body.classList.contains("scrolled")) {
        body.classList.remove("scrolled");
      }
      if (header.classList.contains("scrolled")) {
        header.classList.remove("scrolled");
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
