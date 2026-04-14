function initStickyHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

function initMobileMenu() {
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const headerNav = document.querySelector(".header-nav");

  if (mobileBtn && headerNav) {
    mobileBtn.setAttribute("aria-expanded", "false");

    mobileBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const opened = headerNav.classList.toggle("open");
      headerNav.classList.toggle("mobile-active", opened);
      mobileBtn.setAttribute("aria-expanded", opened ? "true" : "false");
      document.body.style.overflow = opened ? "hidden" : "";

      const icon = mobileBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars", !opened);
        icon.classList.toggle("fa-times", opened);
      }
    });
  }
}

function initNavDropdownToggles() {
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const nav = document.querySelector(".header-nav");
  if (!nav) return;

  const setAria = (open) => {
    if (mobileBtn)
      mobileBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  nav.addEventListener("click", (ev) => {
    const anchor = ev.target.closest && ev.target.closest("a");
    if (!anchor) return;
    const parent = anchor.closest && anchor.closest(".nav-dropdown");
    const isMobile = window.innerWidth <= 1024;

    // Toggle dropdowns on mobile without leaving the page
    if (
      parent &&
      isMobile &&
      (anchor.classList.contains("dropdown-toggle") ||
        anchor.classList.contains("nav-link"))
    ) {
      ev.preventDefault();
      parent.classList.toggle("open");
      return;
    }

    // Close menu after navigation on mobile
    if (isMobile) {
      nav.classList.remove("open", "mobile-active");
      document.body.style.overflow = "";
      setAria(false);
    }
  });

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open", "mobile-active");
      document.body.style.overflow = "";
      setAria(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024 && nav.classList.contains("open")) {
      nav.classList.remove("open", "mobile-active");
      document.body.style.overflow = "";
      setAria(false);
    }
  });
}

// Store vehicle data globally
let vehicleData = {
  bikes: null,
  cars: null,
};

// Load vehicle data from JSON files
async function loadVehicleData() {
  try {
    const [bikesResponse, carsResponse] = await Promise.all([
      fetch("./data/bikes-data.json"),
      fetch("./data/cars-data.json"),
    ]);

    vehicleData.bikes = await bikesResponse.json();
    vehicleData.cars = await carsResponse.json();

    console.log("Vehicle data loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading vehicle data:", error);
    return false;
  }
}

// Populate make dropdown based on vehicle type
function populateMakeDropdown(vehicleType) {
  const makeFilter = document.getElementById("makeFilter");
  if (!makeFilter) return;

  // Clear existing options except the first one
  makeFilter.innerHTML = '<option value="">Select Make</option>';

  const data = vehicleType === "bike" ? vehicleData.bikes : vehicleData.cars;
  if (!data || !data.brands) return;

  data.brands.forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand.make;
    option.textContent = brand.make;
    option.setAttribute("data-type", vehicleType);
    makeFilter.appendChild(option);
  });
}

// Populate body dropdown based on vehicle type
function populateBodyDropdown(vehicleType) {
  const bodyFilter = document.getElementById("bodyFilter");
  if (!bodyFilter) return;

  // Clear existing options except the first one
  bodyFilter.innerHTML = '<option value="">Any Body</option>';

  const data = vehicleType === "bike" ? vehicleData.bikes : vehicleData.cars;
  if (!data || !data.brands) return;

  // Collect unique body types
  const bodyTypes = new Set();
  data.brands.forEach((brand) => {
    if (brand.bodyTypes) {
      brand.bodyTypes.forEach((type) => bodyTypes.add(type));
    }
  });

  // Add options
  Array.from(bodyTypes)
    .sort()
    .forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      option.setAttribute("data-type", vehicleType);
      bodyFilter.appendChild(option);
    });
}

// Populate model dropdown based on selected make
function populateModelDropdown(make, vehicleType) {
  const modelFilter = document.getElementById("modelFilter");
  if (!modelFilter) return;

  // Clear existing options
  modelFilter.innerHTML = '<option value="">Select Model</option>';

  if (!make) return;

  const data = vehicleType === "bike" ? vehicleData.bikes : vehicleData.cars;
  if (!data || !data.brands) return;

  const brand = data.brands.find((b) => b.make === make);
  if (!brand || !brand.models) return;

  brand.models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    modelFilter.appendChild(option);
  });
}

function initCategoryTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const makeFilter = document.getElementById("makeFilter");
  const modelFilter = document.getElementById("modelFilter");

  function updateFilters(vehicleType) {
    populateMakeDropdown(vehicleType);
    populateBodyDropdown(vehicleType);
    if (modelFilter) {
      modelFilter.innerHTML = '<option value="">Select Model</option>';
    }
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      tabBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const tab = this.getAttribute("data-tab");
      console.log("Selected tab:", tab);

      // Update dropdowns based on selected tab
      updateFilters(tab);
    });
  });

  // Listen for make selection to populate models
  if (makeFilter) {
    makeFilter.addEventListener("change", function () {
      const activeTab = document.querySelector(".tab-btn.active");
      const vehicleType = activeTab
        ? activeTab.getAttribute("data-tab")
        : "bike";
      populateModelDropdown(this.value, vehicleType);
    });
  }

  // Initialize filters for the default active tab
  const activeTab = document.querySelector(".tab-btn.active");
  if (activeTab) {
    const initialTab = activeTab.getAttribute("data-tab");
    updateFilters(initialTab);
  }
}

function initFilterSearch() {
  const searchBtn = document.getElementById("searchCountBtn");
  const makeFilter = document.getElementById("makeFilter");
  const modelFilter = document.getElementById("modelFilter");
  const bodyFilter = document.getElementById("bodyFilter");
  const keywordFilter = document.getElementById("keywordFilter");

  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Get active tab to determine vehicle type
      const activeTab = document.querySelector(".tab-btn.active");
      const vehicleType = activeTab
        ? activeTab.getAttribute("data-tab")
        : "bike";

      const make = makeFilter ? makeFilter.value : "";
      const model = modelFilter ? modelFilter.value : "";
      const body = bodyFilter ? bodyFilter.value : "";
      const keyword = keywordFilter
        ? keywordFilter.value.trim().toLowerCase()
        : "";

      const params = new URLSearchParams();

      // Add vehicle type
      if (vehicleType) {
        params.append("type", vehicleType);
      }

      // Add filters based on direct selection
      if (make) params.append("brand", make);
      if (model) params.append("model", model);
      if (body) params.append("body", body);

      // Handle keyword search - check if it matches any make, model, or keyword
      if (keyword) {
        const data =
          vehicleType === "bike" ? vehicleData.bikes : vehicleData.cars;

        if (data && data.brands) {
          let matchFound = false;

          // Search through brands
          for (const brand of data.brands) {
            // Check if keyword matches make
            if (brand.make.toLowerCase().includes(keyword)) {
              if (!make) params.set("brand", brand.make);
              matchFound = true;
              break;
            }

            // Check if keyword matches any model
            if (brand.models) {
              const matchingModel = brand.models.find((m) =>
                m.toLowerCase().includes(keyword),
              );
              if (matchingModel) {
                if (!make) params.set("brand", brand.make);
                if (!model) params.set("model", matchingModel);
                matchFound = true;
                break;
              }
            }

            // Check if keyword matches any brand keywords
            if (brand.keywords) {
              const keywordMatch = brand.keywords.some(
                (k) =>
                  k.toLowerCase().includes(keyword) ||
                  keyword.includes(k.toLowerCase()),
              );
              if (keywordMatch) {
                if (!make) params.set("brand", brand.make);
                matchFound = true;
                break;
              }
            }
          }
        }

        // Always add the keyword to general search
        params.append("q", keyword);
      }

      // Redirect to inventory page with filters
      window.location.href = `inventory.html?${params.toString()}`;
    });
  }

  // Allow Enter key to trigger search in keyword field
  if (keywordFilter) {
    keywordFilter.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (searchBtn) searchBtn.click();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  // Load vehicle data first
  await loadVehicleData();

  initStickyHeader();
  initMobileMenu();
  initCategoryTabs();
  initFilterSearch();
  initServiceCardBackgrounds();
  initNavDropdownToggles();
});

function initHeroSlider() {
  const heroSlider = document.createElement("div");
  heroSlider.className = "hero-slider";
  const slides = [
    "https://images.overdrive.in/wp-content/odgallery/2018/06/42636_2018%20Ducati%20Panigale%20V4-2018-022.JPG",
    "https://images.unsplash.com/photo-1662788019531-89849ebb754a?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y29udGluZW50YWwlMjBndCUyMDY1MHxlbnwwfHwwfHx8MA%3D%3D",
    "https://wallpapercg.com/media/ts_orig/18582.webp",
    "https://images.pexels.com/photos/17227166/pexels-photo-17227166.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200",
    "https://c4.wallpaperflare.com/wallpaper/780/625/239/motorcycles-other-wallpaper-preview.jpg",
  ];

  slides.forEach((slide, index) => {
    const slideDiv = document.createElement("div");
    slideDiv.className = `hero-slide ${index === 0 ? "active" : ""}`;
    slideDiv.style.backgroundImage = `url(${slide})`;
    heroSlider.appendChild(slideDiv);
  });

  const backgroundImageDiv = document.querySelector(".background-image");
  if (backgroundImageDiv && backgroundImageDiv.parentNode)
    backgroundImageDiv.parentNode.replaceChild(heroSlider, backgroundImageDiv);

  const dotsContainer = document.createElement("div");
  dotsContainer.className = "slider-dots";
  slides.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.className = `slider-dot ${index === 0 ? "active" : ""}`;
    dot.dataset.index = index;
    dotsContainer.appendChild(dot);
  });

  const heroSection = document.querySelector(".hero-section");
  if (heroSection) heroSection.appendChild(dotsContainer);

  const slidesElements = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".slider-dot");
  let currentSlide = 0;

  function showSlide(index) {
    slidesElements.forEach((slide) => slide.classList.remove("active"));
    dots.forEach((dot) => dot.classList.remove("active"));
    if (slidesElements[index]) slidesElements[index].classList.add("active");
    if (dots[index]) dots[index].classList.add("active");
    currentSlide = index;
  }

  function nextSlide() {
    const nextIndex = (currentSlide + 1) % slides.length;
    showSlide(nextIndex);
  }

  let slideInterval = setInterval(nextSlide, 2000);
  heroSlider.addEventListener("mouseenter", () => clearInterval(slideInterval));
  heroSlider.addEventListener("mouseleave", () => {
    slideInterval = setInterval(nextSlide, 5000);
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      clearInterval(slideInterval);
      showSlide(parseInt(dot.dataset.index, 10));
      slideInterval = setInterval(nextSlide, 5000);
    });
  });
}

function initLazyLoading() {
  if ("IntersectionObserver" in window) {
    const lazyImages = Array.from(document.querySelectorAll("img.lazy"));
    const lazyImageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
    lazyImages.forEach((img) => lazyImageObserver.observe(img));
  }
}

function initPreconnect() {
  const preconnectUrls = [
    "https://cdnjs.cloudflare.com",
    "https://randomuser.me",
    "https://imgd.aeplcdn.com",
  ];
  preconnectUrls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = url;
    document.head.appendChild(link);
  });
}

// Initialize backgrounds for cards that have data-bg attribute
function initServiceCardBackgrounds() {
  try {
    const cards = document.querySelectorAll(".service-card[data-bg]");
    cards.forEach((card) => {
      const src = card.getAttribute("data-bg");
      if (!src) return;
      // Apply background
      card.style.backgroundImage = `url('${src}')`;
      card.classList.add("bg-cover");
      // If developer wants no overlay, they can add class `no-overlay`
      // Lazy-load background by creating an Image object
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        // fade-in effect
        card.style.transition =
          "background-image 200ms ease, opacity 220ms ease";
        card.style.opacity = "1";
      };
    });
  } catch (e) {
    console.error("service card bg init error", e);
  }
}

window.API_BASE = (function () {
  try {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1")
      return `${window.location.protocol}//${host}:3500`;
  } catch (e) {}
  return "http://ok-motor-backend.vercel.app";
})();

window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", "G-ETL311CBE6");

function animateStatsCounter() {
  const counters = document.querySelectorAll(".stat-number");
  counters.forEach((counter) => {
    const target = parseInt(counter.getAttribute("data-count"), 10) || 0;
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        counter.textContent = target + "+";
        clearInterval(timer);
      } else counter.textContent = Math.floor(current);
    }, 30);
  });
}

function initStatsObserver() {
  const target = document.querySelector(".stats-section");
  if (!target) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStatsCounter();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );
  observer.observe(target);
}

function initFeaturedSliders() {
  const carSlider = document.querySelector(".car-slider");
  const bikeSlider = document.querySelector(".bike-slider");

  if (carSlider) {
    const carPrevBtn =
      carSlider.parentElement.querySelector(".slider-nav.prev");
    const carNextBtn =
      carSlider.parentElement.querySelector(".slider-nav.next");

    if (carPrevBtn)
      carPrevBtn.addEventListener("click", () =>
        carSlider.scrollBy({ left: -300, behavior: "smooth" }),
      );
    if (carNextBtn)
      carNextBtn.addEventListener("click", () =>
        carSlider.scrollBy({ left: 300, behavior: "smooth" }),
      );

    fetchFeaturedVehicles("Car", carSlider);
  }

  if (bikeSlider) {
    const bikePrevBtn =
      bikeSlider.parentElement.querySelector(".slider-nav.prev");
    const bikeNextBtn =
      bikeSlider.parentElement.querySelector(".slider-nav.next");

    if (bikePrevBtn)
      bikePrevBtn.addEventListener("click", () =>
        bikeSlider.scrollBy({ left: -300, behavior: "smooth" }),
      );
    if (bikeNextBtn)
      bikeNextBtn.addEventListener("click", () =>
        bikeSlider.scrollBy({ left: 300, behavior: "smooth" }),
      );

    fetchFeaturedVehicles("Bike", bikeSlider);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function fetchFeaturedVehicles(vehicleType, sliderEl) {
  // Load from backend API instead of JSON files
  const API_BASE = "http://ok-motor-backend.vercel.app";

  fetch(
    `${API_BASE}/api/vehicles/public/listings?limit=8&vehicleType=${vehicleType}`,
  )
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load vehicles`);
      return response.json();
    })
    .then((data) => {
      const vehicles = data.vehicles || [];

      if (vehicles.length === 0) {
        sliderEl.innerHTML =
          '<div style="text-align:center; padding:40px; color:#666; font-size:18px;">Coming Soon</div>';
        return;
      }

      // Map vehicles to the expected format
      const formattedVehicles = vehicles.map((v) => ({
        _id: v._id,
        brand: v.vehicleName || "",
        model: v.vehicleModel || "",
        vehicleType: v.vehicleType,
        modelYear:
          v.manufacturingYear || v.modelYear || new Date().getFullYear(),
        year: v.manufacturingYear || v.modelYear,
        fuelType: v.fuelType || "Petrol",
        price: v.sellingPrice || v.expectedPrice || v.price || 0,
        kmDriven: v.kilometersRun || v.kmDriven || 0,
        ownership: v.ownershipNumber || v.ownership || "1st",
        owner: v.ownershipNumber || v.ownership || "1st",
        images:
          v.images && v.images.length > 0
            ? v.images.map((img) =>
                typeof img === "string" ? img : img.url || "",
              )
            : ["https://via.placeholder.com/400x300?text=No+Image"],
        primaryImage: v.primaryImage,
        downPayment: v.downPayment || 0,
        status: v.availabilityStatus || "Available",
      }));
      displayFeaturedVehicles(formattedVehicles, sliderEl, vehicleType);
    })
    .catch((error) => {
      console.error(`Error fetching ${vehicleType}:`, error);
      showFeaturedError(sliderEl, vehicleType, () =>
        fetchFeaturedVehicles(vehicleType, sliderEl),
      );
    });
}

function displayFeaturedVehicles(items, sliderEl, vehicleType) {
  sliderEl.innerHTML = "";

  if (!items || items.length === 0) {
    showFeaturedError(sliderEl, vehicleType, null);
    return;
  }

  items.forEach((vehicle) => {
    const card = document.createElement("div");
    card.className = "bike-card";

    // Choose image
    const imageUrl =
      (vehicle.primaryImage && vehicle.primaryImage.url) ||
      (vehicle.images && vehicle.images.length && vehicle.images[0]) ||
      "https://via.placeholder.com/400x300/cccccc/666666?text=No+Image";

    // Photo count
    const photos = vehicle.images ? vehicle.images.length : 0;

    const statusBadge =
      vehicle.status || vehicle.availabilityStatus || "Available";
    const statusClass = statusBadge.toLowerCase().includes("sold")
      ? "status-sold"
      : "status-available";

    const vehicleName =
      (vehicle.brand || vehicle.vehicleName || "") +
      " " +
      (vehicle.model || vehicle.modelName || "");

    card.innerHTML = `
      <div class="image-container">
        <span class="status-badge ${statusClass}">${statusBadge}</span>
        ${photos > 0 ? `<span class="photo-count">📷 ${photos}</span>` : ""}
        <img src="${imageUrl}" alt="${vehicleName.trim()}" />
      </div>
      <div class="card-content">
        <h3 class="vehicle-title">${vehicle.brand || ""} ${
          vehicle.model || ""
        }</h3>
        <div class="vehicle-meta">
          <span class="year">${vehicle.modelYear || vehicle.year || "-"}</span>
        </div>
        <div class="details">
          <div class="detail-item">
            <i class="fas fa-tachometer-alt" style="color: white;"></i>
            <span>${
              vehicle.kmDriven ? vehicle.kmDriven.toLocaleString() + " km" : "-"
            }</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-user" style="color: white;"></i>
            <span>${
              vehicle.ownership || vehicle.owner || "1st Owner"
            } Owner</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-gas-pump" style="color: white;"></i>
            <span>${vehicle.fuelType || "Petrol"}</span>
          </div>
          <div class="detail-item" style="color: white;">
            <i class="fas fa-calendar-alt" style="color: white;"></i>
            <span>${
              vehicle.modelYear
                ? new Date().getFullYear() - vehicle.modelYear + " years"
                : "-"
            }</span>
          </div>
        </div>
        <div class="price-container">
          <div class="price">₹${(vehicle.price || 0).toLocaleString()}</div>
          <div class="emi">${
            vehicle.downPayment
              ? "Down: ₹" + vehicle.downPayment.toLocaleString()
              : ""
          } ${
            vehicle.downPayment
              ? "| EMI: ₹" +
                Math.round(
                  ((vehicle.price || 0) - vehicle.downPayment) / 36,
                ).toLocaleString() +
                "/month"
              : ""
          }</div>
          <div class="button-group">
            <button class="contact-btn" data-id="${
              vehicle._id
            }">BOOK NOW</button>
            <button class="view-details-btn" data-id="${
              vehicle._id
            }">VIEW DETAILS</button>
          </div>
        </div>
      </div>
    `;

    sliderEl.appendChild(card);

    // Add event listeners
    const contactBtn = card.querySelector(".contact-btn");
    const detailsBtn = card.querySelector(".view-details-btn");

    if (contactBtn) {
      contactBtn.addEventListener("click", () => {
        window.location.href = `book.html?vehicleId=${vehicle._id}`;
      });
    }

    if (detailsBtn) {
      detailsBtn.addEventListener("click", () => {
        window.location.href = `vehicledetail.html?id=${vehicle._id}`;
      });
    }
  });
}

function showFeaturedError(sliderEl, vehicleType, retryFn) {
  const card = document.createElement("div");
  card.className = "bike-card";
  card.style.minWidth = "300px";

  card.innerHTML = `
    <div class="image-container">
      <img src="https://via.placeholder.com/300?text=Coming+Soon" 
           alt="Coming Soon" 
           loading="lazy"
           style="opacity: 0.5;">
      <div class="status-badge status-coming-soon">Coming Soon</div>
      <div class="photo-count">
        <i class="fas fa-camera"></i> 0
      </div>
    </div>
    <div class="card-content">
      <div class="car-body">${vehicleType}</div>
      <h3>Coming Soon</h3>
      <span class="model">Stay Tuned</span>
      <div class="details">
        <div class="detail-item">
          <i class="fas fa-tachometer-alt"></i>
          <span>-</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-user"></i>
          <span>-</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-gas-pump"></i>
          <span>-</span>
        </div>
      </div>
      <div class="price-container">
        <div class="price">-</div>
        <div class="emi">-</div>
        <div class="button-group">
          <button class="view-btn" disabled>Coming Soon</button>
          <button class="contact-btn" disabled>Contact</button>
        </div>
      </div>
      <div class="action-icons">
        <button class="icon-btn favorite-btn" aria-label="Add to favorites" disabled>
          <i class="far fa-heart"></i>
        </button>
        <button class="icon-btn share-btn" aria-label="Share" disabled>
          <i class="fas fa-share-alt"></i>
        </button>
      </div>
    </div>
  `;

  sliderEl.innerHTML = "";
  sliderEl.appendChild(card);

  if (retryFn) {
    const retryContainer = document.createElement("div");
    retryContainer.style.cssText =
      "width: 100%; text-align: center; margin-top: 20px;";
    retryContainer.innerHTML = `
      <button onclick="location.reload()" 
              style="padding: 10px 20px; background: var(--primary-color, #303E27); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
        Retry
      </button>
    `;
    sliderEl.parentElement.appendChild(retryContainer);
  }
}

function formatOwnership(owner) {
  if (owner === "1") return "1st Owner";
  if (owner === "2") return "2nd Owner";
  if (owner === "3" || owner === "3+") return "3+ Owner";
  return owner;
}

function initModals() {
  // All modals have been removed - direct links are used instead
  return;
}

function initDarkMode() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const mobileDarkModeToggle = document.getElementById("mobileDarkModeToggle");

  function checkDarkModePreference() {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.body.classList.add("dark-mode");
      if (darkModeToggle) darkModeToggle.checked = true;
      if (mobileDarkModeToggle) mobileDarkModeToggle.checked = true;
    }
  }

  checkDarkModePreference();

  if (darkModeToggle)
    darkModeToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
      } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
      }
      if (mobileDarkModeToggle) mobileDarkModeToggle.checked = this.checked;
    });

  if (mobileDarkModeToggle)
    mobileDarkModeToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
      } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
      }
      if (darkModeToggle) darkModeToggle.checked = this.checked;
    });

  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  if (mql && mql.addEventListener) {
    mql.addEventListener("change", (e) => {
      const newColorScheme = e.matches ? "dark" : "light";
      if (!localStorage.getItem("theme")) {
        if (newColorScheme === "dark") {
          document.body.classList.add("dark-mode");
          if (darkModeToggle) darkModeToggle.checked = true;
          if (mobileDarkModeToggle) mobileDarkModeToggle.checked = true;
        } else {
          document.body.classList.remove("dark-mode");
          if (darkModeToggle) darkModeToggle.checked = false;
          if (mobileDarkModeToggle) mobileDarkModeToggle.checked = false;
        }
      }
    });
  }
}

function initStyleCarousel() {
  const stylesContainer = document.querySelector(".styles-container");
  const styleCards = document.querySelectorAll(".style-card-link");

  if (window.innerWidth > 768 || styleCards.length === 0) return;

  const mobileContainer = document.createElement("div");
  mobileContainer.className = "styles-container-mobile";

  styleCards.forEach((card) => {
    mobileContainer.appendChild(card);
  });

  stylesContainer.innerHTML = "";
  stylesContainer.appendChild(mobileContainer);
  const prevArrow = document.createElement("button");
  prevArrow.className = "carousel-arrow prev";
  prevArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevArrow.setAttribute("aria-label", "Previous style");

  const nextArrow = document.createElement("button");
  nextArrow.className = "carousel-arrow next";
  nextArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextArrow.setAttribute("aria-label", "Next style");

  const dotsContainer = document.createElement("div");
  dotsContainer.className = "carousel-dots";

  for (let i = 0; i < styleCards.length; i++) {
    const dot = document.createElement("div");
    dot.className = `carousel-dot ${i === 0 ? "active" : ""}`;
    dot.dataset.index = i;
    dotsContainer.appendChild(dot);
  }

  carouselNav.appendChild(prevArrow);
  carouselNav.appendChild(dotsContainer);
  carouselNav.appendChild(nextArrow);

  stylesContainer.appendChild(carouselNav);

  let currentIndex = 0;
  const totalSlides = styleCards.length;

  function updateCarousel() {
    mobileContainer.style.transform = `translateX(-${currentIndex * 100}%)`;

    document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });

    prevArrow.disabled = currentIndex === 0;
    nextArrow.disabled = currentIndex === totalSlides - 1;
  }

  function nextSlide() {
    if (currentIndex < totalSlides - 1) {
      currentIndex++;
      updateCarousel();
    }
  }

  function prevSlide() {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  }

  function goToSlide(index) {
    currentIndex = index;
    updateCarousel();
  }

  nextArrow.addEventListener("click", nextSlide);
  prevArrow.addEventListener("click", prevSlide);

  document.querySelectorAll(".carousel-dot").forEach((dot) => {
    dot.addEventListener("click", function () {
      goToSlide(parseInt(this.dataset.index));
    });
  });

  let startX = 0;
  let currentX = 0;

  mobileContainer.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  mobileContainer.addEventListener("touchmove", (e) => {
    currentX = e.touches[0].clientX;
  });

  mobileContainer.addEventListener("touchend", () => {
    const diff = startX - currentX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < totalSlides - 1) {
        nextSlide();
      } else if (diff < 0 && currentIndex > 0) {
        prevSlide();
      }
    }
  });

  updateCarousel();
}

function attachStyleCarouselResizeHandler() {
  initStyleCarousel();
  window.addEventListener("resize", function () {
    const stylesContainer = document.querySelector(".styles-container");
    if (
      stylesContainer &&
      stylesContainer.querySelector(".styles-container-mobile")
    ) {
      if (window.innerWidth > 768) location.reload();
    } else if (window.innerWidth <= 768) initStyleCarousel();
  });
}

function init() {
  // initLanguage(); // Removed - function doesn't exist
  initHeroSlider();
  initMobileMenu();
  // updateMobileMenuTranslations(); // Removed - function doesn't exist
  initLazyLoading();
  initPreconnect();
  initFeaturedSliders();
  initStatsObserver();
  initModals();
  initDarkMode();
  attachStyleCarouselResizeHandler();
  initPriceRangeFilter();
  initSmartSearch();
  initFilterPersistence();
  initFinanceCalculator();
  initVehicleComparison();
  initEnhancedForms();
}

document.addEventListener("DOMContentLoaded", init);

/* ===========================
   Phase 2: Price Range Filter
   =========================== */
function initPriceRangeFilter() {
  const minPriceInput = document.getElementById("minPrice");
  const maxPriceInput = document.getElementById("maxPrice");
  const minPriceSlider = document.getElementById("minPriceSlider");
  const maxPriceSlider = document.getElementById("maxPriceSlider");
  const quickBtns = document.querySelectorAll(".price-quick-btn");

  if (!minPriceInput || !maxPriceInput || !minPriceSlider || !maxPriceSlider)
    return;

  // Sync inputs with sliders
  minPriceInput.addEventListener("input", (e) => {
    const value = parseInt(e.target.value) || 0;
    minPriceSlider.value = value;
    updatePriceRange();
  });

  maxPriceInput.addEventListener("input", (e) => {
    const value = parseInt(e.target.value) || 1000000;
    maxPriceSlider.value = value;
    updatePriceRange();
  });

  minPriceSlider.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    minPriceInput.value = value;
    if (value > parseInt(maxPriceSlider.value)) {
      maxPriceSlider.value = value;
      maxPriceInput.value = value;
    }
    updatePriceRange();
  });

  maxPriceSlider.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    maxPriceInput.value = value;
    if (value < parseInt(minPriceSlider.value)) {
      minPriceSlider.value = value;
      minPriceInput.value = value;
    }
    updatePriceRange();
  });

  // Quick filter buttons
  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      quickBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const min = btn.dataset.min;
      const max = btn.dataset.max;

      minPriceInput.value = min;
      maxPriceInput.value = max;
      minPriceSlider.value = min;
      maxPriceSlider.value = max;

      updatePriceRange();
      updateActiveFilters();
    });
  });

  function updatePriceRange() {
    updateActiveFilters();
  }
}

/* ===========================
   Phase 2: Smart Search Features
   =========================== */
function initSmartSearch() {
  const keywordInput = document.getElementById("keywordFilter");
  const recentSearchesDiv = document.getElementById("recentSearches");
  const recentSearchesList = document.getElementById("recentSearchesList");
  const clearSearchesBtn = document.getElementById("clearSearches");
  const popularTags = document.querySelectorAll(".popular-search-tag");

  if (!keywordInput) return;

  // Load recent searches from localStorage
  let recentSearches = JSON.parse(
    localStorage.getItem("recentSearches") || "[]",
  );

  // Show recent searches on focus
  keywordInput.addEventListener("focus", () => {
    if (recentSearches.length > 0) {
      displayRecentSearches();
      recentSearchesDiv.style.display = "block";
    }
  });

  // Hide on blur (with delay for click events)
  keywordInput.addEventListener("blur", () => {
    setTimeout(() => {
      recentSearchesDiv.style.display = "none";
    }, 200);
  });

  // Save search on Enter
  keywordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && keywordInput.value.trim()) {
      saveRecentSearch(keywordInput.value.trim());
    }
  });

  // Clear recent searches
  if (clearSearchesBtn) {
    clearSearchesBtn.addEventListener("click", () => {
      recentSearches = [];
      localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
      recentSearchesDiv.style.display = "none";
    });
  }

  // Popular search tags
  popularTags.forEach((tag) => {
    tag.addEventListener("click", () => {
      const keyword = tag.dataset.keyword;
      keywordInput.value = keyword;
      saveRecentSearch(keyword);
      updateActiveFilters();
    });
  });

  function saveRecentSearch(search) {
    // Remove if already exists
    recentSearches = recentSearches.filter((s) => s !== search);
    // Add to beginning
    recentSearches.unshift(search);
    // Keep only last 5
    recentSearches = recentSearches.slice(0, 5);
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  }

  function displayRecentSearches() {
    recentSearchesList.innerHTML = recentSearches
      .map(
        (search) => `
      <div class="recent-search-item" onclick="document.getElementById('keywordFilter').value='${search}'; updateActiveFilters();">
        <i class="fas fa-history"></i>
        <span>${search}</span>
      </div>
    `,
      )
      .join("");
  }
}

/* ===========================
   Phase 2: Active Filters & Persistence
   =========================== */
function initFilterPersistence() {
  const filterElements = {
    type: document.querySelector(".tab-btn.active"),
    make: document.getElementById("makeFilter"),
    model: document.getElementById("modelFilter"),
    body: document.getElementById("bodyFilter"),
    keyword: document.getElementById("keywordFilter"),
    minPrice: document.getElementById("minPrice"),
    maxPrice: document.getElementById("maxPrice"),
  };

  // Load saved filters on page load
  loadSavedFilters();

  // Save filters on change
  Object.values(filterElements).forEach((el) => {
    if (el) {
      el.addEventListener("change", () => {
        saveFilters();
        updateActiveFilters();
      });
      el.addEventListener("input", () => {
        saveFilters();
        updateActiveFilters();
      });
    }
  });

  // Tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      saveFilters();
      updateActiveFilters();
    });
  });

  function saveFilters() {
    const filters = {
      type: document.querySelector(".tab-btn.active")?.dataset.tab || "bike",
      make: filterElements.make?.value || "",
      model: filterElements.model?.value || "",
      body: filterElements.body?.value || "",
      keyword: filterElements.keyword?.value || "",
      minPrice: filterElements.minPrice?.value || "0",
      maxPrice: filterElements.maxPrice?.value || "1000000",
    };
    localStorage.setItem("vehicleFilters", JSON.stringify(filters));
  }

  function loadSavedFilters() {
    try {
      const savedFilters = JSON.parse(
        localStorage.getItem("vehicleFilters") || "{}",
      );

      if (savedFilters.make && filterElements.make) {
        filterElements.make.value = savedFilters.make;
      }
      if (savedFilters.model && filterElements.model) {
        filterElements.model.value = savedFilters.model;
      }
      if (savedFilters.body && filterElements.body) {
        filterElements.body.value = savedFilters.body;
      }
      if (savedFilters.keyword && filterElements.keyword) {
        filterElements.keyword.value = savedFilters.keyword;
      }
      if (savedFilters.minPrice && filterElements.minPrice) {
        filterElements.minPrice.value = savedFilters.minPrice;
        document.getElementById("minPriceSlider").value = savedFilters.minPrice;
      }
      if (savedFilters.maxPrice && filterElements.maxPrice) {
        filterElements.maxPrice.value = savedFilters.maxPrice;
        document.getElementById("maxPriceSlider").value = savedFilters.maxPrice;
      }

      updateActiveFilters();
    } catch (e) {
      console.error("Error loading saved filters:", e);
    }
  }
}

function updateActiveFilters() {
  const activeFiltersDiv = document.getElementById("activeFilters");
  const filterPillsDiv = document.getElementById("filterPills");

  if (!activeFiltersDiv || !filterPillsDiv) return;

  const filters = [];

  // Check each filter
  const make = document.getElementById("makeFilter")?.value;
  const model = document.getElementById("modelFilter")?.value;
  const body = document.getElementById("bodyFilter")?.value;
  const keyword = document.getElementById("keywordFilter")?.value;
  const minPrice = document.getElementById("minPrice")?.value;
  const maxPrice = document.getElementById("maxPrice")?.value;

  if (make) filters.push({ label: `Make: ${make}`, value: "make" });
  if (model) filters.push({ label: `Model: ${model}`, value: "model" });
  if (body) filters.push({ label: `Body: ${body}`, value: "body" });
  if (keyword) filters.push({ label: `Search: ${keyword}`, value: "keyword" });
  if (minPrice && parseInt(minPrice) > 0) {
    filters.push({
      label: `Min: ₹${formatPrice(minPrice)}`,
      value: "minPrice",
    });
  }
  if (maxPrice && parseInt(maxPrice) < 1000000) {
    filters.push({
      label: `Max: ₹${formatPrice(maxPrice)}`,
      value: "maxPrice",
    });
  }

  if (filters.length > 0) {
    filterPillsDiv.innerHTML = filters
      .map(
        (f) => `
      <div class="filter-pill">
        <span>${f.label}</span>
        <button class="filter-pill-remove" onclick="removeFilter('${f.value}')">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `,
      )
      .join("");
    activeFiltersDiv.style.display = "flex";
  } else {
    activeFiltersDiv.style.display = "none";
  }
}

function removeFilter(filterType) {
  switch (filterType) {
    case "make":
      document.getElementById("makeFilter").value = "";
      break;
    case "model":
      document.getElementById("modelFilter").value = "";
      break;
    case "body":
      document.getElementById("bodyFilter").value = "";
      break;
    case "keyword":
      document.getElementById("keywordFilter").value = "";
      break;
    case "minPrice":
      document.getElementById("minPrice").value = "0";
      document.getElementById("minPriceSlider").value = "0";
      break;
    case "maxPrice":
      document.getElementById("maxPrice").value = "1000000";
      document.getElementById("maxPriceSlider").value = "1000000";
      break;
  }
  updateActiveFilters();
  saveFilters();
}

function formatPrice(price) {
  const num = parseInt(price);
  if (num >= 100000) {
    return (num / 100000).toFixed(1) + "L";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + "K";
  }
  return num.toString();
}

// Clear all filters button
document.addEventListener("DOMContentLoaded", () => {
  const clearAllBtn = document.getElementById("clearAllFilters");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      document.getElementById("makeFilter").value = "";
      document.getElementById("modelFilter").value = "";
      document.getElementById("bodyFilter").value = "";
      document.getElementById("keywordFilter").value = "";
      document.getElementById("minPrice").value = "0";
      document.getElementById("maxPrice").value = "1000000";
      document.getElementById("minPriceSlider").value = "0";
      document.getElementById("maxPriceSlider").value = "1000000";
      document
        .querySelectorAll(".price-quick-btn")
        .forEach((btn) => btn.classList.remove("active"));
      updateActiveFilters();
      localStorage.removeItem("vehicleFilters");
    });
  }
});

/* ===========================
   Phase 3: Finance Calculator
   =========================== */
function initFinanceCalculator() {
  const loanAmount = document.getElementById("loanAmount");
  const loanAmountSlider = document.getElementById("loanAmountSlider");
  const downPayment = document.getElementById("downPayment");
  const downPaymentSlider = document.getElementById("downPaymentSlider");
  const interestRate = document.getElementById("interestRate");
  const interestRateSlider = document.getElementById("interestRateSlider");
  const tenureBtns = document.querySelectorAll(".tenure-btn");

  if (!loanAmount || !downPayment || !interestRate) return;

  let selectedTenure = 12;

  // Sync inputs with sliders
  loanAmount.addEventListener("input", (e) => {
    loanAmountSlider.value = e.target.value;
    calculateEMI();
  });

  loanAmountSlider.addEventListener("input", (e) => {
    loanAmount.value = e.target.value;
    calculateEMI();
  });

  downPayment.addEventListener("input", (e) => {
    downPaymentSlider.value = e.target.value;
    calculateEMI();
  });

  downPaymentSlider.addEventListener("input", (e) => {
    downPayment.value = e.target.value;
    calculateEMI();
  });

  interestRate.addEventListener("input", (e) => {
    interestRateSlider.value = e.target.value;
    calculateEMI();
  });

  interestRateSlider.addEventListener("input", (e) => {
    interestRate.value = e.target.value;
    calculateEMI();
  });

  // Tenure buttons
  tenureBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tenureBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedTenure = parseInt(btn.dataset.months);
      calculateEMI();
    });
  });

  function calculateEMI() {
    const principal =
      parseFloat(loanAmount.value) - parseFloat(downPayment.value);
    const rate = parseFloat(interestRate.value) / 100 / 12;
    const months = selectedTenure;

    if (principal <= 0 || rate <= 0 || months <= 0) return;

    // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
    const emi =
      (principal * rate * Math.pow(1 + rate, months)) /
      (Math.pow(1 + rate, months) - 1);
    const totalAmount = emi * months;
    const totalInterest = totalAmount - principal;

    document.getElementById("emiAmount").textContent =
      "₹" + Math.round(emi).toLocaleString("en-IN");
    document.getElementById("principalAmount").textContent =
      "₹" + Math.round(principal).toLocaleString("en-IN");
    document.getElementById("totalInterest").textContent =
      "₹" + Math.round(totalInterest).toLocaleString("en-IN");
    document.getElementById("totalAmount").textContent =
      "₹" + Math.round(totalAmount).toLocaleString("en-IN");
  }

  calculateEMI();
}

function openFinanceModal() {
  const modal = document.getElementById("financeModal");
  if (modal) {
    modal.style.display = "block";
  }
}

/* ===========================
   Phase 3: Vehicle Comparison Tool
   =========================== */
function initVehicleComparison() {
  let comparisonList = [];
  const comparisonBar = document.getElementById("comparisonBar");
  const comparisonItems = document.getElementById("comparisonItems");
  const compareCount = document.getElementById("compareCount");
  const compareBtn = document.getElementById("compareVehiclesBtn");

  if (!comparisonBar) return;

  // Add comparison checkboxes to vehicle cards (if they exist)
  document.querySelectorAll(".vehicle-card, .bike-card").forEach((card) => {
    if (!card.querySelector(".compare-checkbox")) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "compare-checkbox";
      checkbox.style.position = "absolute";
      checkbox.style.top = "10px";
      checkbox.style.right = "10px";
      checkbox.style.width = "20px";
      checkbox.style.height = "20px";
      checkbox.style.cursor = "pointer";

      checkbox.addEventListener("change", (e) => {
        const vehicleName = card.querySelector("h3")?.textContent || "Vehicle";
        const vehiclePrice = card.querySelector(".price")?.textContent || "N/A";

        if (e.target.checked) {
          if (comparisonList.length < 3) {
            comparisonList.push({
              name: vehicleName,
              price: vehiclePrice,
              element: card,
            });
            updateComparisonBar();
          } else {
            e.target.checked = false;
            alert("You can compare up to 3 vehicles only");
          }
        } else {
          comparisonList = comparisonList.filter((v) => v.name !== vehicleName);
          updateComparisonBar();
        }
      });

      card.style.position = "relative";
      card.appendChild(checkbox);
    }
  });

  function updateComparisonBar() {
    if (comparisonList.length > 0) {
      comparisonBar.classList.add("show");
      comparisonItems.innerHTML = comparisonList
        .map(
          (v) => `
        <div class="comparison-item">
          <span>${v.name}</span>
          <button class="comparison-item-remove" onclick="removeFromComparison('${v.name}')">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `,
        )
        .join("");
      compareCount.textContent = comparisonList.length;
    } else {
      comparisonBar.classList.remove("show");
    }
  }

  window.removeFromComparison = function (name) {
    comparisonList = comparisonList.filter((v) => v.name !== name);
    const checkbox = document.querySelector(
      `.vehicle-card .compare-checkbox, .bike-card .compare-checkbox`,
    );
    if (checkbox) checkbox.checked = false;
    updateComparisonBar();
  };

  if (compareBtn) {
    compareBtn.addEventListener("click", () => {
      if (comparisonList.length < 2) {
        alert("Please select at least 2 vehicles to compare");
        return;
      }
      showComparisonModal();
    });
  }

  function showComparisonModal() {
    const modal = document.getElementById("comparisonModal");
    const grid = document.getElementById("comparisonGrid");

    if (modal && grid) {
      grid.innerHTML = comparisonList
        .map(
          (v) => `
        <div class="comparison-vehicle-card">
          <h3>${v.name}</h3>
          <div class="comparison-spec-row">
            <span class="comparison-spec-label">Price</span>
            <span class="comparison-spec-value">${v.price}</span>
          </div>
          <div class="comparison-spec-row">
            <span class="comparison-spec-label">Status</span>
            <span class="comparison-spec-value">Available</span>
          </div>
        </div>
      `,
        )
        .join("");
      modal.style.display = "block";
    }
  }
}

/* ===========================
   Phase 3: Enhanced Forms
   =========================== */
function initEnhancedForms() {
  // Finance Form
  const financeForm = document.getElementById("financeForm");
  if (financeForm) {
    financeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(financeForm);
      const data = Object.fromEntries(formData);

      // Here you would send to your API
      console.log("Finance Application:", data);

      document.getElementById("financeSuccess").style.display = "flex";
      setTimeout(() => {
        document.getElementById("financeModal").style.display = "none";
        financeForm.reset();
        document.getElementById("financeSuccess").style.display = "none";
      }, 3000);
    });
  }

  // Test Drive Form
  const testDriveForm = document.getElementById("testDriveForm");
  if (testDriveForm) {
    // Set minimum date to today
    const dateInput = document.getElementById("testDriveDate");
    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.setAttribute("min", today);
    }

    testDriveForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(testDriveForm);
      const data = Object.fromEntries(formData);

      // Here you would send to your API
      console.log("Test Drive Booking:", data);

      document.getElementById("testDriveSuccess").style.display = "flex";
      setTimeout(() => {
        document.getElementById("testDriveModal").style.display = "none";
        testDriveForm.reset();
        document.getElementById("testDriveSuccess").style.display = "none";
      }, 3000);
    });
  }

  // Add modal close functionality
  document.querySelectorAll(".modal .close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", function () {
      this.closest(".modal").style.display = "none";
    });
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });
}

// Global function to open test drive modal
window.openTestDriveModal = function () {
  const modal = document.getElementById("testDriveModal");
  if (modal) {
    modal.style.display = "block";
  }
};

// Scroll animation for service cards
function initScrollAnimations() {
  const serviceCards = document.querySelectorAll(
    ".services-grid .service-card",
  );

  if (serviceCards.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-on-scroll");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  serviceCards.forEach((card) => {
    observer.observe(card);
  });
}

// Initialize scroll animations when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScrollAnimations);
} else {
  initScrollAnimations();
}

// Top banner announcement is handled by shared top-banner.js across pages
