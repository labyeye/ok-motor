/* Shared testimonials script used by multiple pages.
   - Fetches reviews from backend and renders a responsive carousel
   - Wires the review modal (open/close, star rating, submission)
   - Safe-guards: only runs once (window.__testimonialsLoaded)
*/
(function () {
  if (window.__testimonialsLoaded) return;
  window.__testimonialsLoaded = true;

  function computeApiBase() {
    try {
      const host = window.location.hostname;
      if (host === "localhost") {
        return `${window.location.protocol}//${host}:2500`;
      }
    } catch (e) {}
    return "https://ok-motor-51l3.vercel.app";
  }

  const API_BASE = computeApiBase();

  function randomAvatar(name) {
    const seed = name ? name.replace(/\s/g, "") : "user";
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      seed,
    )}`;
  }

  function createTestimonialEl(r) {
    const div = document.createElement("div");
    div.className = "testimonial";
    div.setAttribute("itemscope", "");
    div.setAttribute("itemtype", "https://schema.org/Review");
    div.innerHTML = `
      <div class="quote-icon"><i class="fa fa-quote-left" style="color:red;"></i></div>
      <div class="testimonial-header">
        <img src="${randomAvatar(r.name)}" alt="${r.name || ""}
          " class="user-avatar" width="60" height="60" loading="lazy" />
        <div class="user-info">
          <h4 class="user-name" itemprop="author">${escapeHtml(
            r.name || "Anonymous",
          )}</h4>
          <div class="rating">${'<i class="fas fa-star"></i>'.repeat(
            r.rating || 5,
          )}${'<i class="far fa-star"></i>'.repeat(
            Math.max(0, 5 - (r.rating || 5)),
          )}</div>
        </div>
      </div>
      <div class="quote">${escapeHtml(r.message || r.text || "")}</div>
      <div class="testimonial-footer"><span class="testimonial-date">${new Date(
        r.date || r.createdAt || Date.now(),
      ).toLocaleDateString()}</span></div>
    `;
    return div;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderTestimonialsSlider(container, reviews) {
    if (!container) return;
    if (!reviews || reviews.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;color:#888;padding:30px;">No reviews yet. Be the first to share your experience!</div>';
      return;
    }

    // Determine slide size
    const slideSize = window.innerWidth >= 900 ? 3 : 1;
    const slides = [];
    for (let i = 0; i < reviews.length; i += slideSize) {
      slides.push(reviews.slice(i, i + slideSize));
    }

    container.innerHTML = "";
    const slider = document.createElement("div");
    slider.className = "testimonial-slider";

    slides.forEach((group) => {
      const slide = document.createElement("div");
      slide.className = "testimonial-slide";
      slide.style.display = "flex";
      slide.style.gap = "16px";
      slide.style.justifyContent = "center";
      group.forEach((r) => {
        slide.appendChild(createTestimonialEl(r));
      });
      slider.appendChild(slide);
    });

    const controls = document.createElement("div");
    controls.className = "testimonial-controls";
    controls.innerHTML = `<button class="testimonial-prev" aria-label="Previous reviews">&#10094;</button><button class="testimonial-next" aria-label="Next reviews">&#10095;</button>`;

    const nav = document.createElement("div");
    nav.className = "testimonial-nav";

    slides.forEach((_, idx) => {
      const dot = document.createElement("div");
      dot.className = "testimonial-dot" + (idx === 0 ? " active" : "");
      dot.dataset.idx = idx;
      nav.appendChild(dot);
    });

    container.appendChild(slider);
    container.appendChild(controls);
    container.appendChild(nav);

    const slidesEls = Array.from(slider.children);
    let current = 0;
    function showSlide(n) {
      current = (n + slidesEls.length) % slidesEls.length;
      slidesEls.forEach(
        (el, i) => (el.style.display = i === current ? "flex" : "none"),
      );
      Array.from(nav.children).forEach((d, i) =>
        d.classList.toggle("active", i === current),
      );
    }

    showSlide(0);
    controls
      .querySelector(".testimonial-prev")
      .addEventListener("click", () => showSlide(current - 1));
    controls
      .querySelector(".testimonial-next")
      .addEventListener("click", () => showSlide(current + 1));
    Array.from(nav.children).forEach((d, i) =>
      d.addEventListener("click", () => showSlide(i)),
    );

    // rebuild on resize (debounced)
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(
        () => renderTestimonialsSlider(container, reviews),
        250,
      );
    });
  }

  function fetchAndRender() {
    const container =
      document.getElementById("dynamic-testimonials") ||
      document.getElementById("testimonialsContainer") ||
      document.querySelector(".testimonials-container");
    if (!container) return;

    fetch(API_BASE + "/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        const reviews =
          data && data.success && Array.isArray(data.reviews)
            ? data.reviews
            : Array.isArray(data)
              ? data
              : [];
        renderTestimonialsSlider(container, reviews);
      })
      .catch(() => renderTestimonialsSlider(container, []));
  }

  function wireReviewModal() {
    const reviewModal = document.getElementById("reviewModal");
    const reviewForm = document.getElementById("reviewForm");
    if (!reviewModal || !reviewForm) return;

    const openButtons = document.querySelectorAll(".open-review-modal");
    openButtons.forEach((b) =>
      b.addEventListener("click", () => (reviewModal.style.display = "block")),
    );

    const closeBtn = reviewModal.querySelector(".close");
    if (closeBtn)
      closeBtn.addEventListener(
        "click",
        () => (reviewModal.style.display = "none"),
      );
    window.addEventListener("click", (e) => {
      if (e.target === reviewModal) reviewModal.style.display = "none";
    });

    // star rating
    const stars = reviewModal.querySelectorAll(".star");
    const ratingInput = document.getElementById("reviewRating");
    if (stars && ratingInput) {
      stars.forEach((s, idx) =>
        s.addEventListener("click", function () {
          const v = Number(this.getAttribute("data-value")) || idx + 1;
          ratingInput.value = v;
          stars.forEach((st, i) => st.classList.toggle("selected", i < v));
        }),
      );
    }

    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = (document.getElementById("reviewName") || {}).value || "";
      const message =
        (document.getElementById("reviewMessage") || {}).value || "";
      const rating = Number(
        (document.getElementById("reviewRating") || {}).value || 0,
      );
      if (!name || !message || !rating) {
        alert("Please fill all fields and select a rating.");
        return;
      }

      fetch(API_BASE + "/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, rating }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res && res.success) {
            // close + reset
            reviewModal.style.display = "none";
            reviewForm.reset();
            if (ratingInput) ratingInput.value = 0;
            const starsEls = reviewModal.querySelectorAll(".star");
            starsEls.forEach((s) => s.classList.remove("selected"));
            fetchAndRender();
          } else {
            alert("Failed to submit review.");
          }
        })
        .catch(() => alert("Failed to submit review."));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetchAndRender();
    wireReviewModal();
    // add small 'Leave a Review' button if testimonials section exists
    const testimonialsSection = document.querySelector(".testimonials-section");
    if (testimonialsSection && !document.querySelector(".review-btn")) {
      const openBtn = document.createElement("button");
      openBtn.className = "review-btn open-review-modal";
      testimonialsSection.appendChild(openBtn);
      openBtn.addEventListener("click", () => {
        const reviewModal = document.getElementById("reviewModal");
        if (reviewModal) reviewModal.style.display = "block";
      });
    }
  });
})();
