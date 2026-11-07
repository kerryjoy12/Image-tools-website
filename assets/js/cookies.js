/* ============================================================
   COOKIE CONSENT — Banner + Consent Management UI
   Separate file so the page scripts stay small.
   ============================================================ */
(function () {
  "use strict";
  const banner = document.getElementById("cookie-consent");
  const accept = document.getElementById("consent-accept");
  const reject = document.getElementById("consent-reject");
  const manage = document.getElementById("consent-manage");
  const panel = document.getElementById("cookie-manage-panel");
  const dismissKey = "pt-consent-dismissed";
  let deferredAds = [];

  function hideBanner() {
    banner.classList.add("hidden");
    document.querySelectorAll(".ad-slot").forEach((el) => {
      el.style.display = "none";
      el.dataset.originalDisplay = el.style.display;
    });
  }

  function showBanner() {
    banner.classList.remove("hidden");
    const saved = localStorage.getItem(dismissKey);
    if (saved === "accept") {
      loadAdSlots();
      banner.classList.add("hidden");
    } else if (saved === "reject") {
      blockAdSlots();
      banner.classList.add("hidden");
    } else {
      loadAdSlots();
    }
  }

  function blockAdSlots() {
    document.querySelectorAll(".ad-slot").forEach((el) => {
      el.style.display = "none";
      el.dataset.originalDisplay = el.style.display;
    });
  }

  function loadAdSlots() {
    document.querySelectorAll(".ad-slot").forEach((el) => {
      el.style.display = el.dataset.originalDisplay || "block";
    });
  }

  // Register a script that should only run after consent
  window.__ptRegisterAd = function (fn) {
    deferredAds.push(fn);
  };

  accept.addEventListener("click", () => {
    localStorage.setItem(dismissKey, "accept");
    loadAdSlots();
    deferredAds.forEach((fn) => fn());
    deferredAds = [];
    banner.classList.add("hidden");
  });

  reject.addEventListener("click", () => {
    localStorage.setItem(dismissKey, "reject");
    blockAdSlots();
    deferredAds.forEach((fn) => fn());
    deferredAds = [];
    banner.classList.add("hidden");
  });

  manage.addEventListener("click", () => {
    if (panel) panel.classList.toggle("hidden");
    banner.classList.add("hidden");
  });

  // Check localStorage first
  const saved = localStorage.getItem(dismissKey);
  if (saved === "accept" || saved === "reject") {
    hideBanner();
  } else {
    showBanner();
  }
})();
