(function () {
  const base = "https://backend.okmotors.in";
  const API = `${base}/api/announcements/current`;

  async function fetchCurrent() {
    try {
      const r = await fetch(API, { cache: "no-store" });
      if (!r.ok) return null;
      const j = await r.json();
      return j.data || null;
    } catch (e) {
      console.error("Announcement fetch failed", e);
      return null;
    }
  }

  async function applyToTopBanner() {
    const banner = document.getElementById("topBanner");
    const left = banner?.querySelector(".top-banner-left");
    if (!banner || !left) return;

    const ann = await fetchCurrent();
    if (!ann || !ann.message) return;

    left.textContent = ann.message;
    if (ann.link) {
      const link = document.createElement("a");
      link.href = ann.link;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "Learn more";
      link.style.marginLeft = "8px";
      left.appendChild(link);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyToTopBanner);
  } else {
    applyToTopBanner();
  }
})();
