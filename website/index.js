// ========== STICKY HEADER ===========
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

// ========== MOBILE MENU ===========
function initMobileMenu() {
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const headerNav = document.querySelector(".header-nav");

  if (mobileBtn && headerNav) {
    // ensure aria-expanded present
    mobileBtn.setAttribute("aria-expanded", "false");

    mobileBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const opened = headerNav.classList.toggle("open");
      // keep backward-compatible class name
      headerNav.classList.toggle("mobile-active", opened);
      mobileBtn.setAttribute("aria-expanded", opened ? "true" : "false");
      // lock body scroll while open
      document.body.style.overflow = opened ? "hidden" : "";

      const icon = mobileBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars", !opened);
        icon.classList.toggle("fa-times", opened);
      }
    });
  }
}

// ========== CATEGORY TABS ===========
function initCategoryTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      tabBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const tab = this.getAttribute("data-tab");
      console.log("Selected tab:", tab);
      // Here you can filter bikes by tab category if needed
    });
  });
}

// ========== FILTER SEARCH ===========
function initFilterSearch() {
  const searchBtn = document.querySelector(".search-filters-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const make = document.getElementById("makeFilter").value;
      const model = document.getElementById("modelFilter").value;
      const budget = document.getElementById("budgetFilter").value;
      const state = document.getElementById("stateFilter").value;

      // Build query params
      const params = new URLSearchParams();
      if (make) params.append("make", make);
      if (model) params.append("model", model);
      if (budget) params.append("budget", budget);
      if (state) params.append("state", state);

      window.location.href = `https://www.okmotors.in/inventory.html?${params.toString()}`;
    });
  }
}

// ========== INIT ON LOAD ===========
document.addEventListener("DOMContentLoaded", function () {
  initStickyHeader();
  initMobileMenu();
  initCategoryTabs();
  initFilterSearch();
  initNavDropdownToggles();
});

// Ensure mobile dropdown toggles don't navigate away — toggle submenu in-place
function initNavDropdownToggles() {
  const headerNav = document.querySelector(".header-nav");
  if (!headerNav) return;

  headerNav.addEventListener("click", function (e) {
    const a = e.target.closest && e.target.closest("a");
    if (!a) return;

    // on mobile, intercept dropdown toggles and normal links
    if (window.innerWidth <= 1024) {
      const parent = a.closest && a.closest(".nav-dropdown");

      // if it's a dropdown toggle or the primary nav-link, toggle the submenu
      if (parent && (a.classList.contains("dropdown-toggle") || a.classList.contains("nav-link"))) {
        e.preventDefault();
        parent.classList.toggle("open");
        return;
      }

      // otherwise, it's a normal link — close the mobile nav so navigation proceeds
      const mobileBtn = document.getElementById("mobileMenuBtn");
      headerNav.classList.remove("open");
      headerNav.classList.remove("mobile-active");
      if (mobileBtn) mobileBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });
}

function translatePage(language) {
  if (language === "hi") document.body.classList.add("hindi-font");
  else document.body.classList.remove("hindi-font");

  const elements = document.querySelectorAll("[data-translate]");
  elements.forEach((element) => {
    const key = element.getAttribute("data-translate");
    if (translations[language] && translations[language][key]) {
      element.textContent = translations[language][key];
    }
  });

  const popup = document.getElementById("languagePopup");
  if (popup) popup.style.display = "none";
}

function initLanguage() {
  const popup = document.getElementById("languagePopup");
  if (popup) popup.style.display = "flex";

  document.querySelectorAll(".language-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const lang = this.getAttribute("data-lang");
      translatePage(lang);
    });
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

window.API_BASE = (function () {
  try {
    const host = window.location.hostname;
    if (host === "localhost")
      return `${window.location.protocol}//${host}:2500`;
  } catch (e) {}
  return "https://ok-motor-51l3.vercel.app";
})();

// Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", "G-ETL311CBE6");

// Stats animation
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

const translations = {
  en: {
    "Bike Builders | Premium Pre-Owned Motorcycles in India":
      "Bike Builders | Premium Pre-Owned Motorcycles in India",
    Home: "Home",
    Updates: "Updates",
    "Book Bike": "Book Bike",
    "Buy Bike": "Buy Bike",
    "Sell Your Bike": "Sell Your Bike",
    "About Us": "About Us",
    Contact: "Contact",
    "Get the Quote": "Get the Quote",
    "Choose your preferred language": "Choose your preferred language",
    "Ride Into Freedom with the Bike You've Always Wanted":
      "Ride Into Freedom with the Bike You've Always Wanted",
    "Get Your": "Get Your",
    "Dream Bike": "Dream Bike",
    Bike: "Bike",
    "Refurbished Bikes": "Refurbished Bikes",
    "Sell Bike": "Sell Bike",
    "Bike Service": "Bike Service",
    "Price Calculator": "Price Calculator",
    "Bikes Sold": "Bikes Sold",
    "Bikes Available": "Bikes Available",
    "Happy Customers": "Happy Customers",
    "Years Experience": "Years Experience",
    "Our Services": "Our Services",
    "Find your perfect pre-owned bike from our certified collection.":
      "Find your perfect pre-owned bike from our certified collection.",
    Explore: "Explore",
    "Get the best price for your bike with our free valuation.":
      "Get the best price for your bike with our free valuation.",
    "Get Valuation": "Get Valuation",
    "Professional and Best servicing, maintenance by certified technicians.":
      "Professional and Best servicing, maintenance by certified technicians.",
    "Book Service": "Book Service",
    "Estimate your bike's value instantly based on model, year and condition.":
      "Estimate your bike's value instantly based on model, year and condition.",
    "Calculate Now": "Calculate Now",
    "Choose Your Style": "Choose Your Style",
    Scooter: "Scooter",
    "Practical and fuel-efficient for city commuting.":
      "Practical and fuel-efficient for city commuting.",
    "View Scooters": "View Scooters",
    Commuter: "Commuter",
    "Reliable daily riders with great mileage.":
      "Reliable daily riders with great mileage.",
    "View Commuters": "View Commuters",
    Sport: "Sport",
    "High-performance machines.": "High-performance machines.",
    "View Sports Bikes": "View Sports Bikes",
    Tourer: "Tourer",
    "Comfortable long-distance companions.":
      "Comfortable long-distance companions.",
    "View Tourers": "View Tourers",
    "Featured Bikes": "Featured Bikes",
    "View All": "View All",
    "1st Owner": "1st Owner",
    Petrol: "Petrol",
    "6 months old": "6 months old",
    "2 months old": "2 months old",
    "View Details": "View Details",
    "EMI: ₹8,999/month": "EMI: ₹8,999/month",
    "Other Brands": "Other Brands",
    "Ather Energy": "Ather Energy",
    Bajaj: "Bajaj",
    BMW: "BMW",
    "Harley-Davidson": "Harley-Davidson",
    Hero: "Hero",
    Honda: "Honda",
    Jawa: "Jawa",
    Kawasaki: "Kawasaki",
    KTM: "KTM",
    "Mahindra Two Wheelers": "Mahindra Two Wheelers",
    "Royal Enfield": "Royal Enfield",
    Suzuki: "Suzuki",
    "TVS Motor": "TVS Motor",
    Yamaha: "Yamaha",
    "HOW TO BUY YOUR DREAM BIKE": "HOW TO BUY YOUR DREAM BIKE",
    "OUR HAPPY CUSTOMERS": "OUR HAPPY CUSTOMERS",
    "At Bike Builders, we make buying your perfect bike simple and transparent. Our certified pre-owned bikes come with a comprehensive inspection report and warranty for complete peace of mind.":
      "At Bike Builders, we make buying your perfect bike simple and transparent. Our certified pre-owned bikes come with a comprehensive inspection report and warranty for complete peace of mind.",
    "BROWSE INVENTORY": "BROWSE INVENTORY",
    "BOOK TEST RIDE": "BOOK TEST RIDE",
    "GET TO KNOW YOUR RIDE": "GET TO KNOW YOUR RIDE",
    "PAY & BOOK ONLINE OR VISIT SHOWROOM":
      "PAY & BOOK ONLINE OR VISIT SHOWROOM",
    "COMPLETE PURCHASE": "COMPLETE PURCHASE",
    "HOW TO SELL YOUR USED BIKE": "HOW TO SELL YOUR USED BIKE",
    "At Bike Builders, we provide the quickest and most hassle-free bike selling service. Getting a great deal on your bike can be tricky, which is why we value your bike based on its condition and current market value.":
      "At Bike Builders, we provide the quickest and most hassle-free bike selling service. Getting a great deal on your bike can be tricky, which is why we value your bike based on its condition and current market value.",
    "INSTANT VALUATION": "INSTANT VALUATION",
    "BOOK INSPECTION": "BOOK INSPECTION",
    "SELL YOUR BIKE": "SELL YOUR BIKE",
    "What Our Riders Say": "What Our Riders Say",
    "Mumbai, Maharashtra": "Mumbai, Maharashtra",
    "Bangalore, Karnataka": "Bangalore, Karnataka",
    "Delhi, NCR": "Delhi, NCR",
    "Purchased: 3 months ago": "Purchased: 3 months ago",
    "Verified Owner": "Verified Owner",
    "Purchased: 6 months ago": "Purchased: 6 months ago",
    "Sold: 1 month ago": "Sold: 1 month ago",
    "Verified Seller": "Verified Seller",
    "The buying process was completely transparent. I got a certified KTM Duke 390 at 15% below market price. The 150-point inspection report gave me complete confidence in my purchase.":
      "The buying process was completely transparent. I got a certified KTM Duke 390 at 15% below market price. The 150-point inspection report gave me complete confidence in my purchase.",
    "Excellent customer service and the bike quality is outstanding. The warranty coverage gave me peace of mind. Worth every rupee I spent!":
      "Excellent customer service and the bike quality is outstanding. The warranty coverage gave me peace of mind. Worth every rupee I spent!",
    "I sold my old bike through them and got ₹15,000 more than other dealers offered. The process was smooth and payment was instant. Highly recommended!":
      "I sold my old bike through them and got ₹15,000 more than other dealers offered. The process was smooth and payment was instant. Highly recommended!",
    "India's most trusted marketplace for premium pre-owned bikes since 2018.":
      "India's most trusted marketplace for premium pre-owned bikes since 2018.",
    "Quick Links": "Quick Links",
    "Contact Us": "Contact Us",
    "All rights reserved.": "All rights reserved.",
    "Designed By Pixelate Nest": "Designed By Pixelate Nest",
  },
  hi: {
    "Bike Builders | Premium Pre-Owned Motorcycles in India":
      "बाइक बिल्डर्स | भारत में प्रीमियम सेकेंड हैंड बाइक्स",
    Home: "होम",
    Updates: "अपडेट्स",
    "Buy Bike": "बाइक खरीदें",
    "Sell Your Bike": "बाइक बेचें",
    "About Us": "हमारे बारे में",
    "Book Bike": "बाइक बुक करें",
    Contact: "संपर्क करें",
    "Get the Quote": "कीमत पता करें",
    "Choose your preferred language": "अपनी पसंदीदा भाषा चुनें",

    "Get Your": "अपनी पसंद ",
    "Dream Bike": "की बाइक पाएं",
    "Ride Into Freedom with the Bike You've Always Wanted":
      "आपकी पसंद की बाइक के साथ आज़ादी की सवारी करें",
    Bike: "बाइक",
    "Refurbished Bikes": "पुनर्निर्मित बाइक्स",
    "Sell Bike": "बाइक बेचें",
    "Bike Service": "बाइक सर्विस",
    "Price Calculator": "कीमत कैलकुलेटर",
    "Bikes Sold": "बाइक बिक चुकी",
    "Bikes Available": "बाइक उपलब्ध",
    "Happy Customers": "खुश ग्राहक",
    "Years Experience": "सालों का अनुभव",

    "Our Services": "हमारी सेवाएं",
    "Find your perfect pre-owned bike from our certified collection.":
      "हमारे प्रमाणित संग्रह से अपनी पसंद की बाइक खोजें",
    Explore: "देखें",
    "Get the best price for your bike with our free valuation.":
      "हमारे मुफ्त मूल्यांकन के साथ अपनी बाइक का सबसे अच्छा दाम पाएं",
    "Get Valuation": "मूल्यांकन करें",
    "Professional and Best servicing, maintenance by certified technicians.":
      "प्रमाणित तकनीशियनों द्वारा पेशेवर और सर्वश्रेष्ठ सर्विसिंग, रखरखाव",
    "Book Service": "सर्विस बुक करें",
    "Estimate your bike's value instantly based on model, year and condition.":
      "मॉडल, साल और हालत के आधार पर अपनी बाइक की कीमत का अनुमान लगाएं",
    "Calculate Now": "अभी गणना करें",

    "Choose Your Style": "अपनी पसंद चुनें",
    Scooter: "स्कूटर",
    "Practical and fuel-efficient for city commuting.":
      "शहर में चलाने के लिए व्यावहारिक और कम ईंधन खपत",
    "View Scooters": "स्कूटर देखें",
    Commuter: "कम्यूटर",
    "Reliable daily riders with great mileage.":
      "रोजमर्रा की सवारी के लिए विश्वसनीय, बेहतर माइलेज",
    "View Commuters": "कम्यूटर देखें",
    Sport: "स्पोर्ट",
    "High-performance machines.":
      "एड्रेनालाईन के शौकीनों के लिए हाई-परफॉरमेंस बाइक",
    "View Sports Bikes": "स्पोर्ट्स बाइक देखें",
    Tourer: "टूरर",
    "Comfortable long-distance companions.": "लंबी दूरी के लिए आरामदायक साथी",
    "View Tourers": "टूरर देखें",

    "Featured Bikes": "फीचर्ड बाइक्स",
    "View All": "सभी देखें",
    "1st Owner": "पहला मालिक",
    Petrol: "पेट्रोल",
    "6 months old": "6 महीने पुरानी",
    "2 months old": "2 महीने पुरानी",
    "View Details": "विवरण देखें",
    "EMI: ₹8,999/month": "ईएमआई: ₹8,999/महीना",

    "Other Brands": "अन्य ब्रांड्स",
    "Ather Energy": "आदर एनर्जी",
    Bajaj: "बजाज",
    BMW: "बीएमडब्ल्यू",
    "Harley-Davidson": "हार्ले-डेविडसन",
    Hero: "हीरो",
    Honda: "होंडा",
    Jawa: "जावा",
    Kawasaki: "कावासाकी",
    KTM: "केटीएम",
    "Mahindra Two Wheelers": "महिंद्रा टू व्हीलर्स",
    "Royal Enfield": "रॉयल एनफील्ड",
    Suzuki: "सुजुकी",
    "TVS Motor": "टीवीएस मोटर",
    Yamaha: "यामाहा",
    "OUR HAPPY CUSTOMERS": "हमारे खुश ग्राहक",
    "HOW TO BUY YOUR DREAM BIKE": "अपनी पसंद की बाइक कैसे खरीदें",
    "At Bike Builders, we make buying your perfect bike simple and transparent. Our certified pre-owned bikes come with a comprehensive inspection report and warranty for complete peace of mind.":
      "बाइक बिल्डर्स में, हम बाइक खरीदने को आसान और पारदर्शी बनाते हैं। हमारी प्रमाणित बाइक्स के साथ पूरी जांच रिपोर्ट और वारंटी मिलती है",
    "BROWSE INVENTORY": "बाइक देखें",
    "BOOK TEST RIDE": "टेस्ट राइड बुक करें",
    "GET TO KNOW YOUR RIDE": "अपनी बाइक को जानें",
    "PAY & BOOK ONLINE OR VISIT SHOWROOM": "ऑनलाइन भुगतान करें या शोरूम आएं",
    "COMPLETE PURCHASE": "खरीदारी पूरी करें",

    "HOW TO SELL YOUR USED BIKE": "अपनी पुरानी बाइक कैसे बेचें",
    "At Bike Builders, we provide the quickest and most hassle-free bike selling service. Getting a great deal on your bike can be tricky, which is why we value your bike based on its condition and current market value.":
      "बाइक बिल्डर्स में, हम सबसे तेज और आसान बाइक बेचने की सेवा देते हैं। हम आपकी बाइक की हालत और बाजार भाव के आधार पर सही कीमत देते हैं",
    "INSTANT VALUATION": "तुरंत मूल्यांकन",
    "BOOK INSPECTION": "जांच बुक करें",
    "SELL YOUR BIKE": "अपनी बाइक बेचें",

    "What Our Riders Say": "हमारे ग्राहक क्या कहते हैं",
    "Mumbai, Maharashtra": "मुंबई, महाराष्ट्र",
    "Bangalore, Karnataka": "बैंगलोर, कर्नाटक",
    "Delhi, NCR": "दिल्ली, एनसीआर",
    "Purchased: 3 months ago": "खरीदी: 3 महीने पहले",
    "Verified Owner": "प्रमाणित मालिक",
    "Purchased: 6 months ago": "खरीदी: 6 महीने पहले",
    "Sold: 1 month ago": "बेची: 1 महीने पहले",
    "Verified Seller": "प्रमाणित विक्रेता",
    "The buying process was completely transparent. I got a certified KTM Duke 390 at 15% below market price. The 150-point inspection report gave me complete confidence in my purchase.":
      "खरीद प्रक्रिया पूरी तरह पारदर्शी थी। मुझे KTM Duke 390 बाजार भाव से 15% कम में मिली। 150-पॉइंट जांच रिपोर्ट ने पूरा विश्वास दिलाया",
    "Excellent customer service and the bike quality is outstanding. The warranty coverage gave me peace of mind. Worth every rupee I spent!":
      "ग्राहक सेवा बेहतरीन और बाइक की क्वालिटी शानदार। वारंटी ने मन को शांति दी। हर पैसे के लायक!",
    "I sold my old bike through them and got ₹15,000 more than other dealers offered. The process was smooth and payment was instant. Highly recommended!":
      "मैंने अपनी पुरानी बाइक इनके जरिए बेची और ₹15,000 ज्यादा पाए। प्रक्रिया आसान थी और भुगतान तुरंत मिला। जरूर सलाह देंगे!",

    "India's most trusted marketplace for premium pre-owned bikes since 2018.":
      "2018 से प्रीमियम सेकेंड हैंड बाइक्स का सबसे भरोसेमंद प्लेटफॉर्म",
    "Quick Links": "जल्दी लिंक्स",
    "Contact Us": "संपर्क करें",
    "All rights reserved.": "सभी अधिकार सुरक्षित",
    "Designed By Pixelate Nest": "पिक्सेलेट नेस्ट द्वारा डिज़ाइन",
  },
};

function updateMobileMenuTranslations() {
  document.querySelectorAll(".language-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const lang = this.getAttribute("data-lang");
      translatePage(lang);
    });
  });
  const updateMobileMenu = () => {
    const mobileMenu = document.querySelector(".mobile-menu");
    if (!mobileMenu) return;
    const links = mobileMenu.querySelectorAll("a");
    if (links[0]) links[0].setAttribute("data-translate", "Home");
    if (links[1]) links[1].setAttribute("data-translate", "Buy Bike");
    if (links[2]) links[2].setAttribute("data-translate", "Sell Your Bike");
    if (links[3]) links[3].setAttribute("data-translate", "About Us");
    if (links[4]) links[4].setAttribute("data-translate", "Updates");
    if (links[5]) links[5].setAttribute("data-translate", "Contact");
    const button = mobileMenu.querySelector(".login-btn button");
    if (button) button.setAttribute("data-translate", "Get the Quote");
  };
  updateMobileMenu();
  setTimeout(updateMobileMenu, 500);
}

// Featured bikes slider
function initFeaturedBikeSlider() {
  const bikeSlider = document.querySelector(".bike-slider");
  const prevBtn = document.querySelector(".slider-nav.prev");
  const nextBtn = document.querySelector(".slider-nav.next");
  fetchFeaturedBikes();
  if (prevBtn && bikeSlider)
    prevBtn.addEventListener("click", () =>
      bikeSlider.scrollBy({ left: -300, behavior: "smooth" })
    );
  if (nextBtn && bikeSlider)
    nextBtn.addEventListener("click", () =>
      bikeSlider.scrollBy({ left: 300, behavior: "smooth" })
    );
  if (bikeSlider && prevBtn && nextBtn)
    bikeSlider.addEventListener("scroll", () => {
      prevBtn.disabled = bikeSlider.scrollLeft <= 10;
      nextBtn.disabled =
        bikeSlider.scrollLeft >=
        bikeSlider.scrollWidth - bikeSlider.clientWidth - 10;
    });
}

function fetchFeaturedBikes() {
  const API_BASE = window.API_BASE || "https://ok-motor-51l3.vercel.app";
  function normalizeImageUrl(url) {
    if (!url) return url;
    if (
      /^https?:\/\//i.test(url) ||
      url.startsWith("data:") ||
      url.startsWith("//")
    )
      return url;
    if (url.startsWith("/")) return API_BASE + url;
    return API_BASE + "/" + url;
  }

  fetch(API_BASE + "/api/config")
    .then((r) => r.json())
    .then((cfg) => {
      const USE_CLOUDINARY = !!(cfg && cfg.success && cfg.cloudinary);
      return fetch(API_BASE + "/api/featured-bikes").then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json().then((data) => ({ data, USE_CLOUDINARY }));
      });
    })
    .catch(() =>
      fetch(API_BASE + "/api/featured-bikes")
        .then((r) => r.json())
        .then((data) => ({ data, USE_CLOUDINARY: false }))
    )
    .then(({ data, USE_CLOUDINARY }) => {
      if (data.success && data.data) {
        const bikes = data.data.map((b) => {
          const copy = Object.assign({}, b);
          try {
            if (Array.isArray(copy.imageUrl)) {
              copy.imageUrl = copy.imageUrl
                .map((u) => normalizeImageUrl(u))
                .filter(
                  (u) => u && (!USE_CLOUDINARY || /^https?:\/\//i.test(u))
                );
            } else if (
              typeof copy.imageUrl === "string" &&
              copy.imageUrl.trim() !== ""
            ) {
              const nu = normalizeImageUrl(copy.imageUrl);
              copy.imageUrl =
                !USE_CLOUDINARY || /^https?:\/\//i.test(nu) ? [nu] : [];
            } else copy.imageUrl = [];
          } catch (e) {
            copy.imageUrl = copy.imageUrl || [];
          }
          return copy;
        });
        displayFeaturedBikes(bikes);
      } else showFeaturedBikesError();
    })
    .catch((error) => {
      console.error("Error fetching featured bikes:", error);
      showFeaturedBikesError();
    });
}

function displayFeaturedBikes(bikes) {
  const bikeSlider = document.querySelector(".bike-slider");
  bikeSlider.innerHTML = "";

  if (!bikes || bikes.length === 0) {
    bikeSlider.innerHTML = `
      <div class="no-bikes" style="width: 100%; text-align: center; padding: 40px;">
        <i class="fas fa-motorcycle" style="font-size: 3rem; color: #ccc;"></i>
        <p style="margin-top: 15px; color: #666;">No featured bikes available at the moment</p>
      </div>
    `;
    return;
  }

  bikes.forEach((bike) => {
    const bikeCard = document.createElement("div");
    bikeCard.className = "bike-card";

    let statusClass = "status-available";
    let statusText = "Available";
    let isDisabled = false;

    if (bike.status === "Sold Out") {
      statusClass = "status-sold";
      statusText = "Sold Out";
      isDisabled = true;
    } else if (bike.status === "Coming Soon") {
      statusClass = "status-coming-soon";
      statusText = "Coming Soon";
      isDisabled = true;
    }

    // Handle image URLs - ensure it's always an array
    const images = Array.isArray(bike.imageUrl)
      ? bike.imageUrl.filter((url) => url && url.trim() !== "")
      : [];

    const firstImage =
      images.length > 0
        ? images[0]
        : "https://via.placeholder.com/300?text=No+Image";

    bikeCard.innerHTML = `
      <div class="image-container">
        <img src="${firstImage}" 
            alt="${bike.brand} ${bike.model}" 
            loading="lazy">
        <div class="status-badge ${statusClass}">${statusText}</div>
      </div>
      <div class="card-content">
        <h3>${bike.brand} ${bike.model}</h3>
        <span class="model">${bike.modelYear || bike.year || "N/A"} Model</span>
        <div class="details">
          <div class="detail-item">
            <i class="fas fa-tachometer-alt"></i>
            <span>${(bike.kmDriven || 0).toLocaleString()} km</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-user"></i>
            <span>${formatOwnership(bike.ownership || "1")}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-gas-pump"></i>
            <span>${bike.fuelType || "Petrol"}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-calendar-alt"></i>
            <span>${bike.year || bike.modelYear || "N/A"}</span>
          </div>
        </div>
        <div class="price-container">
          <div class="price">₹${(bike.price || 0).toLocaleString()}</div>
          <div class="emi">Down: ₹${(
            bike.downPayment || 0
          ).toLocaleString()} | EMI: ₹${Math.round(
      ((bike.price || 0) - (bike.downPayment || 0)) / 36
    ).toLocaleString()}/month</div>
          <button class="view-details-btn" ${isDisabled ? "disabled" : ""}>
            ${isDisabled ? bike.status : "View Details"}
          </button>
        </div>
      </div>
    `;

    bikeSlider.appendChild(bikeCard);

    if (!isDisabled) {
      bikeCard
        .querySelector(".view-details-btn")
        .addEventListener("click", () => {
          window.location.href = `inventory.html#${bike._id || ""}`;
        });
    }
  });
}

function showFeaturedBikesError() {
  const bikeSlider = document.querySelector(".bike-slider");
  bikeSlider.innerHTML = `
      <div class="error-message" style="width: 100%; text-align: center; padding: 40px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: red;"></i>
        <p style="margin-top: 15px; color: #666;">Failed to load featured bikes. Please try again later.</p>
        <button onclick="fetchFeaturedBikes()" style="margin-top: 10px; padding: 8px 15px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Retry
        </button>
      </div>
    `;
}

function formatOwnership(owner) {
  if (owner === "1") return "1st Owner";
  if (owner === "2") return "2nd Owner";
  if (owner === "3") return "3+ Owner";
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

// Mobile Carousel for Choose Your Style
function initStyleCarousel() {
  const stylesContainer = document.querySelector(".styles-container");
  const styleCards = document.querySelectorAll(".style-card-link");

  // Only initialize carousel on mobile
  if (window.innerWidth > 768 || styleCards.length === 0) return;

  // Create mobile carousel structure
  const mobileContainer = document.createElement("div");
  mobileContainer.className = "styles-container-mobile";

  // Move existing cards to mobile container
  styleCards.forEach((card) => {
    mobileContainer.appendChild(card);
  });

  // Replace original container with mobile version
  stylesContainer.innerHTML = "";
  stylesContainer.appendChild(mobileContainer);

  // Create navigation elements
  const carouselNav = document.createElement("div");
  carouselNav.className = "carousel-nav";

  // Previous arrow
  const prevArrow = document.createElement("button");
  prevArrow.className = "carousel-arrow prev";
  prevArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevArrow.setAttribute("aria-label", "Previous style");

  // Next arrow
  const nextArrow = document.createElement("button");
  nextArrow.className = "carousel-arrow next";
  nextArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextArrow.setAttribute("aria-label", "Next style");

  // Dots container
  const dotsContainer = document.createElement("div");
  dotsContainer.className = "carousel-dots";

  // Create dots
  for (let i = 0; i < styleCards.length; i++) {
    const dot = document.createElement("div");
    dot.className = `carousel-dot ${i === 0 ? "active" : ""}`;
    dot.dataset.index = i;
    dotsContainer.appendChild(dot);
  }

  // Assemble navigation
  carouselNav.appendChild(prevArrow);
  carouselNav.appendChild(dotsContainer);
  carouselNav.appendChild(nextArrow);

  // Add navigation to container
  stylesContainer.appendChild(carouselNav);

  // Carousel state
  let currentIndex = 0;
  const totalSlides = styleCards.length;

  // Update carousel position
  function updateCarousel() {
    mobileContainer.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Update dots
    document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });

    // Update arrow states
    prevArrow.disabled = currentIndex === 0;
    nextArrow.disabled = currentIndex === totalSlides - 1;
  }

  // Next slide
  function nextSlide() {
    if (currentIndex < totalSlides - 1) {
      currentIndex++;
      updateCarousel();
    }
  }

  // Previous slide
  function prevSlide() {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  }

  // Go to specific slide
  function goToSlide(index) {
    currentIndex = index;
    updateCarousel();
  }

  // Event listeners
  nextArrow.addEventListener("click", nextSlide);
  prevArrow.addEventListener("click", prevSlide);

  // Dot click events
  document.querySelectorAll(".carousel-dot").forEach((dot) => {
    dot.addEventListener("click", function () {
      goToSlide(parseInt(this.dataset.index));
    });
  });

  // Swipe support for touch devices
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

  // Initialize
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
  initFeaturedBikeSlider();
  initStatsObserver();
  initModals();
  initDarkMode();
  attachStyleCarouselResizeHandler();
}

document.addEventListener("DOMContentLoaded", init);
