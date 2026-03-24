(function () {
  function createStickyBar() {
    if (document.getElementById("mobileStickyBar")) return;
    var bar = document.createElement("div");
    bar.className = "mobile-sticky-cta";
    bar.id = "mobileStickyBar";
    bar.innerHTML = [
      '<a href="tel:+917280012222" class="sticky-cta-btn call-btn" aria-label="Call Ok Motors">',
      '  <i class="fas fa-phone" aria-hidden="true"></i>',
      "  <span>Call Now</span>",
      "</a>",
      '<a href="https://wa.me/917280012222" target="_blank" rel="noopener noreferrer" class="sticky-cta-btn whatsapp-btn" aria-label="Chat on WhatsApp">',
      '  <i class="fab fa-whatsapp" aria-hidden="true"></i>',
      "  <span>WhatsApp</span>",
      "</a>",
      '<button class="sticky-cta-btn inventory-btn" type="button" aria-label="View all vehicles">',
      '  <i class="fas fa-car" aria-hidden="true"></i>',
      "  <span>View All</span>",
      "</button>",
    ].join("");
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".inventory-btn");
      if (btn) {
        window.location.href = "https://www.okmotors.in/inventory.html";
      }
    });

    document.body.appendChild(bar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createStickyBar);
  } else {
    createStickyBar();
  }
})();
