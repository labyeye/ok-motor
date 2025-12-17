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
                m.toLowerCase().includes(keyword)
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
                  keyword.includes(k.toLowerCase())
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

function initNavDropdownToggles() {
  const headerNav = document.querySelector(".header-nav");
  if (!headerNav) return;

  headerNav.addEventListener("click", function (e) {
    const a = e.target.closest && e.target.closest("a");
    if (!a) return;

    if (window.innerWidth <= 1024) {
      const parent = a.closest && a.closest(".nav-dropdown");

      if (
        parent &&
        (a.classList.contains("dropdown-toggle") ||
          a.classList.contains("nav-link"))
      ) {
        e.preventDefault();
        parent.classList.toggle("open");
        return;
      }

      const mobileBtn = document.getElementById("mobileMenuBtn");
      headerNav.classList.remove("open");
      headerNav.classList.remove("mobile-active");
      if (mobileBtn) mobileBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });
}

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
    const cards = document.querySelectorAll('.service-card[data-bg]');
    cards.forEach(card => {
      const src = card.getAttribute('data-bg');
      if (!src) return;
      // Apply background
      card.style.backgroundImage = `url('${src}')`;
      card.classList.add('bg-cover');
      // If developer wants no overlay, they can add class `no-overlay`
      // Lazy-load background by creating an Image object
      const img = new Image();
      img.src = src;
      img.onload = () => {
        // fade-in effect
        card.style.transition = 'background-image 200ms ease, opacity 220ms ease';
        card.style.opacity = '1';
      };
    });
  } catch (e) {
    console.error('service card bg init error', e);
  }
}

window.API_BASE = (function () {
  try {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1")
      return `${window.location.protocol}//${host}:3500`;
  } catch (e) {}
  return "http://localhost:3500";
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
    { threshold: 0.5 }
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
        carSlider.scrollBy({ left: -300, behavior: "smooth" })
      );
    if (carNextBtn)
      carNextBtn.addEventListener("click", () =>
        carSlider.scrollBy({ left: 300, behavior: "smooth" })
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
        bikeSlider.scrollBy({ left: -300, behavior: "smooth" })
      );
    if (bikeNextBtn)
      bikeNextBtn.addEventListener("click", () =>
        bikeSlider.scrollBy({ left: 300, behavior: "smooth" })
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
  // Load from JSON data files instead of API
  const dataFile = vehicleType === "Bike" ? "./data/bikes-data.json" : "./data/cars-data.json";
  
  fetch(dataFile)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load ${dataFile}`);
      return response.json();
    })
    .then((data) => {
      // Handle both direct array and {brands: [...]} object formats
      const brands = Array.isArray(data) ? data : (data.brands || []);
      
      if (!Array.isArray(brands) || brands.length === 0) {
        showFeaturedError(sliderEl, vehicleType, () =>
          fetchFeaturedVehicles(vehicleType, sliderEl)
        );
        return;
      }

      // Convert JSON brand data to vehicle objects, take up to 8
      const vehicles = [];
      for (let i = 0; i < Math.min(brands.length, 8); i++) {
        const brand = brands[i];
        const brandName = brand.name || brand.make;
        if (brand.models && brand.models.length > 0) {
          const model = brand.models[0];
          vehicles.push({
            _id: `${vehicleType.toLowerCase()}-${brandName}-${model}`,
            brand: brandName,
            model: model,
            vehicleType: vehicleType,
            modelYear: new Date().getFullYear() - 2,
            fuelType: "Petrol",
            price: vehicleType === "Bike" 
              ? Math.floor(Math.random() * 2000000) + 50000 
              : Math.floor(Math.random() * 3000000) + 500000,
            kmDriven: Math.floor(Math.random() * 80000) + 5000,
            ownership: "1st",
            images: [
              `https://via.placeholder.com/400x300/cccccc/666666?text=${brandName}+${model}`,
            ],
            downPayment: 0,
            status: "Available",
          });
        }
      }

      if (vehicles.length > 0) {
        displayFeaturedVehicles(vehicles, sliderEl, vehicleType);
      } else {
        showFeaturedError(sliderEl, vehicleType, () =>
          fetchFeaturedVehicles(vehicleType, sliderEl)
        );
      }
    })
    .catch((error) => {
      console.error(`Error fetching ${vehicleType}:`, error);
      showFeaturedError(sliderEl, vehicleType, () =>
        fetchFeaturedVehicles(vehicleType, sliderEl)
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

    let statusClass = "status-available";
    let statusText = "Available";
    let isDisabled = false;

    if (vehicle.status === "Sold Out" || vehicle.status === "sold") {
      statusClass = "status-sold";
      statusText = "Sold Out";
      isDisabled = true;
    } else if (vehicle.status === "Coming Soon") {
      statusClass = "status-coming-soon";
      statusText = "Coming Soon";
      isDisabled = true;
    }

    const images = vehicle.images || [];
    const firstImage =
      images[0] || "https://via.placeholder.com/300?text=No+Image";
    const photoCount = images.length;

    const vehicleName = escapeHtml(
      `${vehicle.brand || ""} ${vehicle.model || ""}`
    ).trim();
    const carBody = escapeHtml(vehicle.vehicleType || vehicleType || "Vehicle");
    const modelYear = escapeHtml(vehicle.modelYear || vehicle.year || "N/A");
    const kmDriven = (vehicle.kmDriven || 0).toLocaleString();
    const ownership = formatOwnership(
      vehicle.ownership || vehicle.owner || "1"
    );
    const fuelType = escapeHtml(vehicle.fuelType || "Petrol");
    const price = (vehicle.price || 0).toLocaleString();
    const downPayment = vehicle.downPayment || 0;
    const emiAmount = Math.round(
      ((vehicle.price || 0) - downPayment) / 36
    ).toLocaleString();

    card.innerHTML = `
      <div class="image-container">
        <img src="${firstImage}" 
             alt="${vehicleName}" 
             loading="lazy">
        <div class="status-badge ${statusClass}">${statusText}</div>
        <div class="photo-count">
          <i class="fas fa-camera"></i> ${photoCount}
        </div>
      </div>
      <div class="card-content">
        <div class="car-body">${carBody}</div>
        <h3>${vehicleName}</h3>
        <span class="model">${modelYear} Model</span>
        <div class="details">
          <div class="detail-item">
            <i class="fas fa-tachometer-alt"></i>
            <span>${kmDriven} km</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-user"></i>
            <span>${ownership}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-gas-pump"></i>
            <span>${fuelType}</span>
          </div>
        </div>
        <div class="price-container">
          <div class="price">₹${price}</div>
          <div class="emi">EMI: ₹${emiAmount}/month</div>
          <div class="button-group">
            <button class="view-btn" ${isDisabled ? "disabled" : ""}>
              ${isDisabled ? statusText : "View Details"}
            </button>
            <button class="contact-btn" ${
              isDisabled ? "disabled" : ""
            }>Contact</button>
          </div>
        </div>
        <div class="action-icons">
          <button class="icon-btn favorite-btn" aria-label="Add to favorites" ${
            isDisabled ? "disabled" : ""
          }>
            <i class="far fa-heart"></i>
          </button>
          <button class="icon-btn share-btn" aria-label="Share" ${
            isDisabled ? "disabled" : ""
          }>
            <i class="fas fa-share-alt"></i>
          </button>
        </div>
      </div>
    `;

    sliderEl.appendChild(card);

    if (!isDisabled) {
      const viewBtn = card.querySelector(".view-btn");
      const contactBtn = card.querySelector(".contact-btn");
      const favoriteBtn = card.querySelector(".favorite-btn");
      const shareBtn = card.querySelector(".share-btn");

      if (viewBtn) {
        viewBtn.addEventListener("click", () => {
          window.location.href = `vehicledetail.html?id=${vehicle._id || ""}`;
        });
      }

      if (contactBtn) {
        contactBtn.addEventListener("click", () => {
          window.location.href = `contact.html?vehicle=${encodeURIComponent(
            vehicleName
          )}`;
        });
      }

      if (favoriteBtn) {
        favoriteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          favoriteBtn.classList.toggle("active");
          const icon = favoriteBtn.querySelector("i");
          if (icon) {
            icon.classList.toggle("far");
            icon.classList.toggle("fas");
          }
        });
      }

      if (shareBtn) {
        shareBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (navigator.share) {
            navigator
              .share({
                title: vehicleName,
                text: `Check out this ${vehicleName} for ₹${price}`,
                url: window.location.href,
              })
              .catch((err) => console.log("Error sharing:", err));
          } else {
            const url = window.location.href;
            navigator.clipboard
              .writeText(url)
              .then(() => {
                alert("Link copied to clipboard!");
              })
              .catch((err) => console.log("Error copying:", err));
          }
        });
      }
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
              style="padding: 10px 20px; background: var(--primary-color, #1C7947); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
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
  const whatsappModal = document.getElementById("whatsappModal");
  const callModal = document.getElementById("callModal");
  if (!whatsappModal || !callModal) return;

  const whatsappTrigger = document.getElementById("whatsappTrigger");
  const callTrigger = document.getElementById("callTrigger");
  const closeButtons = document.getElementsByClassName("close");

  if (whatsappTrigger)
    whatsappTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      whatsappModal.style.display = "block";
    });
  if (callTrigger)
    callTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      callModal.style.display = "block";
    });

  Array.from(closeButtons).forEach((button) =>
    button.addEventListener("click", () => {
      if (whatsappModal) whatsappModal.style.display = "none";
      if (callModal) callModal.style.display = "none";
    })
  );

  window.addEventListener("click", (event) => {
    if (event.target === whatsappModal) whatsappModal.style.display = "none";
    if (event.target === callModal) callModal.style.display = "none";
  });

  const whatsappOptions = whatsappModal.querySelectorAll(".number-option");
  whatsappOptions.forEach((option) =>
    option.addEventListener("click", function () {
      const number = this.getAttribute("data-number");
      if (number) window.open(`https://wa.me/${number}`, "_blank");
      whatsappModal.style.display = "none";
    })
  );

  const callOptions = callModal.querySelectorAll(".number-option");
  callOptions.forEach((option) =>
    option.addEventListener("click", function () {
      const number = this.getAttribute("data-number");
      if (number) window.location.href = `tel:${number}`;
      callModal.style.display = "none";
    })
  );
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
  initLanguage();
  initHeroSlider();
  initMobileMenu();
  updateMobileMenuTranslations();
  initLazyLoading();
  initPreconnect();
  initFeaturedSliders();
  initStatsObserver();
  initModals();
  initDarkMode();
  attachStyleCarouselResizeHandler();
}

document.addEventListener("DOMContentLoaded", init);
