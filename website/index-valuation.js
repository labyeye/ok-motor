// Scope valuation features to avoid leaking globals that may collide
(function () {
  const API_BASE =
    window.location.hostname === "localhost" ||
    window.location.hostname === "https://ok-motor-51l3.vercel.app";

  const vehicleModelsData = {
    bike: null,
    car: null,
  };

  const valuationBrands = {
    bike: [],
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

  const BRAND_PRICING = {
    Hero: { base: 420, multiplier: 1.0 },
    Bajaj: { base: 450, multiplier: 1.05 },
    TVS: { base: 430, multiplier: 1.02 },
    Honda: { base: 480, multiplier: 1.08 },
    Suzuki: { base: 460, multiplier: 1.06 },
    Yamaha: { base: 520, multiplier: 1.15 },
    KTM: { base: 850, multiplier: 1.35 },
    "Royal Enfield": { base: 680, multiplier: 1.25 },
    Kawasaki: { base: 1200, multiplier: 1.8 },
    "Harley-Davidson": { base: 2800, multiplier: 3.5 },
    Triumph: { base: 2200, multiplier: 2.8 },
    Ducati: { base: 2500, multiplier: 3.2 },
    BMW: { base: 2300, multiplier: 3.0 },
  };

  const CONDITION_FACTORS = {
    excellent: 1.05,
    good: 1.0,
    fair: 0.95,
    poor: 0.85,
  };

  async function fetchBikeMakes() {
    try {
      const response = await fetch(`https://ok-motor-51l3.vercel.app/api/bikes/makes`);
      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      return [
        "Kawasaki",
        "Yamaha",
        "Honda",
        "Suzuki",
        "KTM",
        "Royal Enfield",
        "Bajaj",
        "TVS",
        "Hero",
        "Harley-Davidson",
        "Triumph",
      ];
    } catch (error) {
      console.error("Error fetching bike makes:", error);
      return [
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
      ];
    }
  }

  async function fetchBikeModels(make) {
    try {
      const response = await fetch(
        `https://ok-motor-51l3.vercel.app/api/bikes/models?make=${encodeURIComponent(
          make
        )}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching bike models:", error);
      return [];
    }
  }

  async function fetchBikeDetails(make, model, year) {
    try {
      let url = `https://ok-motor-51l3.vercel.app/api/bikes?make=${encodeURIComponent(
        make
      )}`;
      if (model) url += `&model=${encodeURIComponent(model)}`;
      if (year) url += `&year=${year}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        return result.data[0];
      }

      return null;
    } catch (error) {
      console.error("Error fetching bike details:", error);
      return null;
    }
  }

  async function loadModelsData() {
    try {
      const carsResponse = await fetch("./data/cars-models.json");
      vehicleModelsData.car = await carsResponse.json();

      console.log("Models data loaded successfully");
      return true;
    } catch (error) {
      console.error("Error loading models data:", error);
      return false;
    }
  }

  function calculateBikeBasePrice(apiData, make) {
    const displacementMatch = apiData.displacement
      ? apiData.displacement.match(/(\d+\.?\d*)/)
      : null;
    const cc = displacementMatch ? parseFloat(displacementMatch[0]) : 0;

    const pricing = BRAND_PRICING[make] || { base: 430, multiplier: 1.0 };
    let basePrice = cc * pricing.base * pricing.multiplier;

    if (basePrice < 40000) basePrice = 40000;

    console.log(
      `Base Price: ${make} | CC: ${cc} | Price: ₹${basePrice.toFixed(0)}`
    );

    return basePrice;
  }

  function calculateCarBasePrice(vehicleType, make, model, year) {
    const data = vehicleModelsData[vehicleType];
    if (!data || !data.brands) return 100000;

    const brand = data.brands.find((b) => b.make === make);
    if (!brand || !brand.models) return 100000;

    const modelData = brand.models.find((m) => m.name === model);
    if (!modelData) return 100000;

    if (modelData.yearPrices && modelData.yearPrices[year]) {
      return modelData.yearPrices[year];
    }

    if (modelData.price) {
      return modelData.price;
    }

    if (modelData.yearPrices) {
      const availableYears = Object.keys(modelData.yearPrices)
        .map((y) => parseInt(y))
        .sort((a, b) => b - a);
      const nearestYear = availableYears.reduce((prev, curr) =>
        Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
      );
      return modelData.yearPrices[nearestYear];
    }

    return 100000;
  }

  function calculateAgeDepreciation(vehicleType, age) {
    let depreciation = 0;

    if (vehicleType === "bike") {
      if (age === 0) {
        depreciation = 0;
      } else if (age <= 5) {
        depreciation = age * 0.12;
      } else if (age <= 10) {
        depreciation = 0.6 + (age - 5) * 0.06;
      } else {
        depreciation = 0.6 + 0.3 + (age - 10) * 0.04;
      }
    } else {
      if (age <= 5) {
        depreciation = age * 0.12;
      } else {
        depreciation = 0.6 + (age - 5) * 0.05;
      }
    }

    return Math.min(0.65, depreciation);
  }

  function calculateKmDepreciation(vehicleType, kms) {
    if (vehicleType === "bike") {
      if (kms <= 15000) return 0;
      if (kms <= 30000) return 0.03;
      if (kms <= 50000) return 0.06;
      return 0.1;
    } else {
      if (kms <= 30000) return 0;
      if (kms <= 60000) return 0.03;
      if (kms <= 100000) return 0.06;
      return 0.1;
    }
  }

  async function calculateValuation(formData, vehicleType, apiData = null) {
    const make = formData.make;
    const model = formData.model;
    const year = parseInt(formData.year) || new Date().getFullYear();
    const kms = parseInt(formData.kms) || 0;
    const owners = parseInt(formData.owners) || 1;
    const condition = formData.condition || "good";

    let basePrice = 100000;

    if (vehicleType === "bike" && apiData) {
      basePrice = calculateBikeBasePrice(apiData, make);
    } else if (vehicleType === "car") {
      basePrice = calculateCarBasePrice(vehicleType, make, model, year);
    }

    const age = Math.max(0, new Date().getFullYear() - year);
    const ageDepreciation = calculateAgeDepreciation(vehicleType, age);
    let price = basePrice * (1 - ageDepreciation);

    const kmDepreciation = calculateKmDepreciation(vehicleType, kms);
    price = price * (1 - kmDepreciation);

    const ownerDepreciation = Math.min((owners - 1) * 0.03, 0.1);
    price = price * (1 - ownerDepreciation);

    price = price * (CONDITION_FACTORS[condition] || 1.0);

    return Math.round(price / 100) * 100;
  }

  async function valuationPopulateMakeDropdown(vehicleType) {
    const makeFilter = document.getElementById("makeFilter");
    if (!makeFilter) return;

    makeFilter.innerHTML = '<option value="">Select Brand</option>';

    let brands = valuationBrands[vehicleType] || [];

    if (vehicleType === "bike") {
      brands = await fetchBikeMakes();
      valuationBrands.bike = brands;
    }

    brands.forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand;
      option.textContent = brand;
      makeFilter.appendChild(option);
    });
  }

  async function valuationPopulateModelDropdown(selectedMake, vehicleType) {
    const modelFilter = document.getElementById("modelFilter");
    const yearFilter = document.getElementById("yearFilter");

    if (!modelFilter) return;

    modelFilter.innerHTML = '<option value="">Select Model</option>';

    if (!selectedMake) {
      // If no make selected, populate year dropdown with all years
      valuationPopulateYearDropdown();
      return;
    }

    let models = [];

    if (vehicleType === "bike") {
      models = await fetchBikeModels(selectedMake);
    } else {
      const data = vehicleModelsData[vehicleType];
      if (data && data.brands) {
        const brand = data.brands.find((b) => b.make === selectedMake);
        if (brand && brand.models) {
          models = brand.models.map((modelData) =>
            typeof modelData === "string" ? modelData : modelData.name
          );
        }
      }
    }

    models.forEach((modelName) => {
      const option = document.createElement("option");
      option.value = modelName;
      option.textContent = modelName;
      modelFilter.appendChild(option);
    });
    
    // Repopulate year dropdown after models are loaded
    valuationPopulateYearDropdown();
  }

  function valuationPopulateYearDropdown() {
    const yearFilter = document.getElementById("yearFilter");
    if (!yearFilter) return;

    yearFilter.innerHTML = '<option value="">Select Year</option>';

    // Always show all years from current year back to 1990
    // This allows selection of registration year (which may differ from manufacturing year)
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1990; year--) {
      years.push(year);
    }

    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });
  }

  function valuationUpdateFilters(vehicleType) {
    valuationPopulateMakeDropdown(vehicleType);
    const modelFilter = document.getElementById("modelFilter");

    if (modelFilter) {
      modelFilter.innerHTML = '<option value="">Select Model</option>';
    }
    
    // Populate year dropdown with all years immediately
    valuationPopulateYearDropdown();
  }

  function valuationInitCategoryTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const makeFilter = document.getElementById("makeFilter");
    const modelFilter = document.getElementById("modelFilter");

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        tabBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        const tab = this.getAttribute("data-tab");
        valuationUpdateFilters(tab);
      });
    });

    if (makeFilter) {
      makeFilter.addEventListener("change", function () {
        const activeTab = document.querySelector(".tab-btn.active");
        const vehicleType = activeTab
          ? activeTab.getAttribute("data-tab")
          : "bike";
        valuationPopulateModelDropdown(this.value, vehicleType);
      });
    }

    if (modelFilter) {
      modelFilter.addEventListener("change", function () {
        // Year dropdown is now always populated, no need to reload
      });
    }

    const activeTab = document.querySelector(".tab-btn.active");
    if (activeTab) {
      const initialTab = activeTab.getAttribute("data-tab");
      valuationUpdateFilters(initialTab);
    }
  }

  function valuationInitValuationForm() {
    const form = document.getElementById("valuationForm");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const activeTab = document.querySelector(".tab-btn.active");
        const vehicleType = activeTab
          ? activeTab.getAttribute("data-tab")
          : "bike";

        const formData = new FormData(form);
        const data = {
          make: formData.get("make"),
          model: formData.get("model"),
          year: formData.get("year"),
          kms: formData.get("kms"),
          owners: 1,
          condition: "good",
        };

        if (!data.make || !data.model || !data.year || !data.kms) {
          alert("Please fill in all required fields");
          return;
        }

        let apiData = null;
        if (vehicleType === "bike") {
          apiData = await fetchBikeDetails(data.make, data.model, data.year);
        }

        const estimatedValue = await calculateValuation(
          data,
          vehicleType,
          apiData
        );

        sessionStorage.setItem(
          "valuationData",
          JSON.stringify({
            ...data,
            vehicleType: vehicleType,
            estimatedValue: estimatedValue,
          })
        );

        const targetPage =
          vehicleType === "bike"
            ? "used-bike-valuation.html"
            : "used-car-valuation.html";

        window.location.href = targetPage;
      });
    }
  }

  function displayValuationResult() {
    const isValuationPage = window.location.pathname.includes("valuation.html");
    if (!isValuationPage) return;

    const valuationData = sessionStorage.getItem("valuationData");
    if (!valuationData) return;

    const data = JSON.parse(valuationData);

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

      sessionStorage.removeItem("valuationData");
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await loadModelsData();

    // Use namespaced valuation initializers to avoid collisions
    valuationInitCategoryTabs();
    valuationInitValuationForm();
    displayValuationResult();
  });

  // Expose only what's needed globally
  window.calculateValuation = calculateValuation;
  window.VALUATION_API_BASE = API_BASE;
})();
