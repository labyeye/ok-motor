// ========================================
// OK MOTORS - VALUATION SYSTEM
// ========================================

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

// ========================================
// VALUATION BRANDS AND MODELS DATA
// ========================================
let vehicleModelsData = {
  bike: null,
  car: null,
};

// Load models data from JSON files
async function loadModelsData() {
  try {
    const [bikesResponse, carsResponse] = await Promise.all([
      fetch("./data/bikes-models.json"),
      fetch("./data/cars-models.json"),
    ]);

    vehicleModelsData.bike = await bikesResponse.json();
    vehicleModelsData.car = await carsResponse.json();

    console.log("Models data loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading models data:", error);
    return false;
  }
}

const valuationBrands = {
  bike: [
    "KTM",
    "Royal Enfield",
    "Yamaha",
    "Honda",
    "Bajaj",
    "Suzuki",
    "TVS",
    "Hero",
    "Kawasaki",
    "Harley-Davidson",
    "Triumph",
  ],
  car: [
    "Maruti",
    "Hyundai",
    "Tata",
    "Mahindra",
    "Toyota",
    "Honda",
    "Ford",
    "Volkswagen",
    "Renault",
    "Nissan",
    "Kia",
    "Skoda",
    "MG",
  ],
};

// ========================================
// VALUATION CALCULATION ENGINE
// ========================================
/**
 * Calculate vehicle valuation based on multiple factors
 * @param {Object} formData - Form data containing vehicle details
 * @param {string} vehicleType - 'bike' or 'car'
 * @returns {number} Estimated valuation in INR
 */
function calculateValuation(formData, vehicleType) {
  const make = formData.make;
  const year = parseInt(formData.year) || new Date().getFullYear();
  const kms = parseInt(formData.kms) || 0;
  const owners = parseInt(formData.owners) || 1;
  const condition = formData.condition;

  // ========================================
  // 1. BASE PRICE BY BRAND
  // ========================================
  let basePrice;
  if (vehicleType === "bike") {
    const bikePrices = {
      KTM: 180000,
      "Royal Enfield": 120000,
      Yamaha: 90000,
      Honda: 80000,
      Bajaj: 60000,
      Suzuki: 85000,
      TVS: 55000,
      Hero: 50000,
      Kawasaki: 200000,
      "Harley-Davidson": 800000,
      Triumph: 250000,
    };
    basePrice = bikePrices[make] || 70000;
  } else {
    const carPrices = {
      Maruti: 300000,
      Hyundai: 320000,
      Tata: 250000,
      Mahindra: 350000,
      Toyota: 400000,
      Honda: 380000,
      Ford: 280000,
      Volkswagen: 350000,
      Renault: 260000,
      Nissan: 270000,
      Kia: 340000,
      Skoda: 360000,
      MG: 330000,
    };
    basePrice = carPrices[make] || 300000;
  }

  // ========================================
  // 2. AGE DEPRECIATION
  // Bikes: 12% per year | Cars: 10% per year
  // ========================================
  const age = Math.max(0, new Date().getFullYear() - year);
  const depreciationRate = vehicleType === "bike" ? 0.12 : 0.1;
  let price = basePrice * Math.max(0.2, 1 - age * depreciationRate);

  // ========================================
  // 3. KILOMETERS DEPRECIATION
  // Bikes: 50k threshold | Cars: 100k threshold
  // ========================================
  const kmThreshold = vehicleType === "bike" ? 50000 : 100000;
  const kmFactor = Math.max(0.6, 1 - (kms / kmThreshold) * 0.25);
  price = price * kmFactor;

  // ========================================
  // 4. OWNER COUNT FACTOR
  // 1st: 100% | 2nd: 90% | 3rd: 80% | 4+: 70%
  // ========================================
  const ownerFactors = {
    1: 1.0,
    2: 0.9,
    3: 0.8,
    4: 0.7,
  };
  price = price * (ownerFactors[owners] || 0.7);

  // ========================================
  // 5. CONDITION FACTOR
  // Excellent: +8% | Good: 0% | Fair: -12% | Poor: -30%
  // ========================================
  const conditionFactors = {
    excellent: 1.08,
    good: 1.0,
    fair: 0.88,
    poor: 0.7,
  };
  price = price * (conditionFactors[condition] || 1.0);

  // Round to nearest thousand
  return Math.round(price / 1000) * 1000;
}

// ========================================
// UI FUNCTIONS
// ========================================

/**
 * Populate make/brand dropdown based on vehicle type
 */
function populateMakeDropdown(vehicleType) {
  const makeFilter = document.getElementById("makeFilter");
  if (!makeFilter) return;

  makeFilter.innerHTML = '<option value="">Select Brand</option>';

  const brands = valuationBrands[vehicleType] || [];
  brands.forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    makeFilter.appendChild(option);
  });
}

/**
 * Populate model dropdown based on selected make
 */
function populateModelDropdown(selectedMake, vehicleType) {
  const modelFilter = document.getElementById("modelFilter");
  if (!modelFilter) return;

  // Clear existing options
  modelFilter.innerHTML = '<option value="">Select Model</option>';

  if (!selectedMake) {
    return;
  }

  const data = vehicleModelsData[vehicleType];
  if (!data || !data.brands) {
    return;
  }

  const brand = data.brands.find((b) => b.make === selectedMake);
  if (brand && brand.models) {
    brand.models.forEach((model) => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      modelFilter.appendChild(option);
    });
  }
}

/**
 * Update filters when switching between bike/car tabs
 */
function updateFilters(vehicleType) {
  populateMakeDropdown(vehicleType);
  // Reset model dropdown
  const modelFilter = document.getElementById("modelFilter");
  if (modelFilter) {
    modelFilter.innerHTML = '<option value="">Select Model</option>';
  }
}

/**
 * Initialize category tabs (Bike/Car switcher)
 */
function initCategoryTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const makeFilter = document.getElementById("makeFilter");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      tabBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const tab = this.getAttribute("data-tab");
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
  // Initialize with default active tab
  const activeTab = document.querySelector(".tab-btn.active");
  if (activeTab) {
    const initialTab = activeTab.getAttribute("data-tab");
    updateFilters(initialTab);
  }
}

/**
 * Initialize valuation form submission
 */
function initValuationForm() {
  const form = document.getElementById("valuationForm");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Get active tab to determine vehicle type
      const activeTab = document.querySelector(".tab-btn.active");
      const vehicleType = activeTab
        ? activeTab.getAttribute("data-tab")
        : "bike";

      // Get form data
      const formData = new FormData(form);
      const data = {
        make: formData.get("make"),
        model: formData.get("model"),
        year: formData.get("year"),
        kms: formData.get("kms"),
        owners: formData.get("owners"),
        condition: formData.get("condition"),
      };

      // Validate required fields
      if (!data.make || !data.model || !data.year || !data.kms) {
        alert("Please fill in all required fields");
        return;
      }

      // Calculate valuation
      const estimatedValue = calculateValuation(data, vehicleType);

      // Store data in sessionStorage for the valuation page
      sessionStorage.setItem(
        "valuationData",
        JSON.stringify({
          ...data,
          vehicleType: vehicleType,
          estimatedValue: estimatedValue,
        })
      );

      // Redirect to respective valuation page
      const targetPage =
        vehicleType === "bike"
          ? "used-bike-valuation.html"
          : "used-car-valuation.html";

      window.location.href = targetPage;
    });
  }
}

// ========================================
// VALUATION PAGE - DISPLAY RESULT
// ========================================

/**
 * Display valuation result on the valuation page
 * This should be called on used-bike-valuation.html and used-car-valuation.html
 */
function displayValuationResult() {
  // Check if we're on a valuation page
  const isValuationPage = window.location.pathname.includes("valuation.html");
  if (!isValuationPage) return;

  const valuationData = sessionStorage.getItem("valuationData");
  if (!valuationData) return;

  const data = JSON.parse(valuationData);

  // Auto-fill the form if it exists
  const form = document.querySelector("#bikeValForm, #carValForm");
  if (form) {
    const makeSelect = form.querySelector("#make");
    const modelInput = form.querySelector("#model");
    const yearInput = form.querySelector("#year");
    const kmsInput = form.querySelector("#kms");
    const conditionSelect = form.querySelector("#condition");

    if (makeSelect) makeSelect.value = data.make || "";
    if (modelInput) modelInput.value = data.model || "";
    if (yearInput) yearInput.value = data.year || "";
    if (kmsInput) kmsInput.value = data.kms || "";
    if (conditionSelect) conditionSelect.value = data.condition || "";
  }

  // Display the result
  const resultEl = document.getElementById("valuationResult");
  if (resultEl && data.estimatedValue) {
    resultEl.style.display = "block";
    resultEl.innerHTML = `
      <strong>Estimated Valuation:</strong> ₹ ${data.estimatedValue.toLocaleString(
        "en-IN"
      )}
      <span style="display:block;color:#666;margin-top:6px;font-size:13px">
        Based on: ${data.make} ${data.model} (${data.year}) • ${parseInt(
      data.kms
    ).toLocaleString("en-IN")} km • 
        ${data.owners}${
      data.owners == 1
        ? "st"
        : data.owners == 2
        ? "nd"
        : data.owners == 3
        ? "rd"
        : "th"
    } Owner • 
        ${
          data.condition.charAt(0).toUpperCase() + data.condition.slice(1)
        } Condition
      </span>
    `;

    // Clear storage after display
    sessionStorage.removeItem("valuationData");
  }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
  // Load models data first
  await loadModelsData();

  initStickyHeader();
  initMobileMenu();
  initCategoryTabs();
  initValuationForm();
  displayValuationResult();
});
