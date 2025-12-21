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
  // Updated to reflect realistic 2024-2025 market prices
  // ========================================
  let basePrice;
  if (vehicleType === "bike") {
    const bikePrices = {
      KTM: 220000,
      "Royal Enfield": 160000,
      Yamaha: 110000,
      Honda: 95000,
      Bajaj: 75000,
      Suzuki: 100000,
      TVS: 70000,
      Hero: 65000,
      Kawasaki: 350000,
      "Harley-Davidson": 1200000,
      Triumph: 400000,
    };
    basePrice = bikePrices[make] || 85000;
  } else {
    const carPrices = {
      Maruti: 450000,
      Hyundai: 500000,
      Tata: 380000,
      Mahindra: 520000,
      Toyota: 650000,
      Honda: 580000,
      Ford: 420000,
      Volkswagen: 550000,
      Renault: 400000,
      Nissan: 410000,
      Kia: 550000,
      Skoda: 560000,
      MG: 520000,
    };
    basePrice = carPrices[make] || 450000;
  }

  // ========================================
  // 2. AGE DEPRECIATION
  // Bikes: 10% per year | Cars: 8% per year
  // More conservative depreciation aligned with market
  // ========================================
  const age = Math.max(0, new Date().getFullYear() - year);
  const depreciationRate = vehicleType === "bike" ? 0.10 : 0.08;
  let price = basePrice * Math.max(0.25, 1 - age * depreciationRate);

  // ========================================
  // 3. KILOMETERS DEPRECIATION
  // Bikes: 40k threshold | Cars: 80k threshold
  // Reduced impact for low-km vehicles
  // ========================================
  const kmThreshold = vehicleType === "bike" ? 40000 : 80000;
  const kmFactor = Math.max(0.70, 1 - (kms / kmThreshold) * 0.20);
  // ========================================
  // 4. OWNER COUNT FACTOR
  // 1st: 100% | 2nd: 93% | 3rd: 85% | 4+: 75%
  // Reduced penalty for multiple owners
  // ========================================
  const ownerFactors = {
    1: 1.0,
    2: 0.93,
    3: 0.85,
    4: 0.75,
  };
  price = price * (ownerFactors[owners] || 0.75);

  // ========================================
  // 5. CONDITION FACTOR
  // Excellent: +5% | Good: 0% | Fair: -8% | Poor: -20%
  // More realistic condition impact
  // ========================================
  const conditionFactors = {
    excellent: 1.05,
    good: 1.0,
    fair: 0.92,
    poor: 0.80,
  };
  price = price * (conditionFactors[condition] || 1.0);
  
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
