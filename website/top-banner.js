(function () {
  function ensureBanner() {
    var banner = document.getElementById("topBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "topBanner";
      banner.setAttribute("role", "banner");
      banner.className = "top-banner";
      document.body.insertBefore(banner, document.body.firstChild);
    }
    return banner;
  }

  function renderMessage(banner, message) {
    // Build marquee content, repeated 3 times
    var wrap = document.createElement("div");
    wrap.className = "marquee-wrap";
    var content = document.createElement("div");
    content.className = "marquee-content";

    function segment() {
      var span = document.createElement("span");
      span.textContent = message;
      return span;
    }

    content.appendChild(segment());
    var sep1 = document.createElement("span");
    sep1.textContent = " \u2022 ";
    content.appendChild(sep1);
    content.appendChild(segment());
    var sep2 = document.createElement("span");
    sep2.textContent = " \u2022 ";
    content.appendChild(sep2);
    content.appendChild(segment());
    var sep2 = document.createElement("span");
    sep2.textContent = " \u2022 ";
    content.appendChild(sep2);
    content.appendChild(segment());
    var sep2 = document.createElement("span");
    sep2.textContent = " \u2022 ";
    content.appendChild(sep2);
    content.appendChild(segment());

    wrap.appendChild(content);
    banner.innerHTML = "";
    banner.appendChild(wrap);
  }

  function fetchAndRender() {
    var banner = ensureBanner();
    var API = "https://ok-motor-51l3.vercel.app/api/announcements/current";

    console.log("Fetching announcement from:", API);

    fetch(API, { cache: "no-store" })
      .then(function (r) {
        console.log("Response status:", r.status);
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        console.log("Response data:", j);
        var ann = j && j.data ? j.data : null;
        if (!ann || !ann.message) {
          console.warn(
            "No current announcement available. Check if announcement is active and dates are valid."
          );
          return;
        }
        console.log("Rendering announcement:", ann.message);
        renderMessage(banner, ann.message, ann.link);
      })
      .catch(function (e) {
        console.error("Announcement fetch failed:", e);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fetchAndRender);
  } else {
    fetchAndRender();
  }
})();
