/* ============================================================
   PIXELTOLS — SHARED JAVASCRIPT
   Loaded on every page. Handles:
   - Header nav toggle + dropdowns
   - Theme preference (system / light / dark)
   - Cookie consent banner
   - Toast notifications
   - Error dialog
   ============================================================ */

(function () {
  "use strict";

  // ---- Toast notifications ----
  const toastHost = document.getElementById("toast-host");
  let toastId = 0;

  function showToast(message, type) {
    if (!toastHost) return;
    const t = document.createElement("div");
    t.className = "toast " + (type || "info");
    t.setAttribute("role", "alert");
    t.setAttribute("aria-live", "assertive");
    const icons = { success: "✓", error: "✕", info: "ℹ" };
    t.innerHTML = `<span>${icons[type] || icons.info}</span> ${escapeHtml(message)}`;
    t.dataset.id = ++toastId;
    toastHost.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transition = "opacity 200ms ease";
      setTimeout(() => t.remove(), 220);
    }, 4000);
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ---- Header toggle (mobile) ----
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  function toggleNav(open) {
    if (!navToggle || !navLinks) return;
    const isOpen = navToggle.classList.toggle("active");
    navLinks.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    navToggle.setAttribute("aria-expanded", isOpen);
  }

  if (navToggle) {
    navToggle.addEventListener("click", () => toggleNav(true));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") toggleNav(false);
    });
  }

  // Close nav when a link is clicked
  document.querySelectorAll(".nav-links a[href]").forEach((a) => {
    a.addEventListener("click", () => {
      if (navLinks.classList.contains("open")) toggleNav(false);
    });
  });

  // ---- Dropdown open/close ----
  document.querySelectorAll(".dropdown").forEach((drop) => {
    const btn = drop.querySelector(".dropdown-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      drop.classList.toggle("open");
      btn.setAttribute("aria-expanded", drop.classList.contains("open"));
    });
    document.addEventListener("click", (e) => {
      if (!drop.contains(e.target)) drop.classList.remove("open");
    });
    drop.addEventListener("keydown", (e) => {
      if (e.key === "Escape") drop.classList.remove("open");
    });
  });

  // ---- Cookie consent ----
  const banner = document.getElementById("cookie-consent");
  const consentBtn = document.getElementById("consent-accept");
  const rejectBtn = document.getElementById("consent-reject");
  const manageBtn = document.getElementById("consent-manage");
  const consentDismissed = "pt-consent-dismissed";

  function loadConsent() {
    const c = localStorage.getItem(consentDismissed);
    if (c) {
      banner.classList.add("hidden");
      return;
    }
    // If no prior choice, honor "Do Not Track"
    if (navigator.doNotTrack === "1" || navigator.msDoNotTrack === "1") {
      localStorage.setItem(consentDismissed, "reject");
      banner.classList.add("hidden");
    }
  }

  function saveConsent(mode) {
    localStorage.setItem(consentDismissed, mode);
    banner.classList.add("hidden");
  }

  if (consentBtn) consentBtn.addEventListener("click", () => saveConsent("accept"));
  if (rejectBtn) rejectBtn.addEventListener("click", () => saveConsent("reject"));
  if (manageBtn) manageBtn.addEventListener("click", () => {
    banner.classList.add("hidden");
    // Focus the manage panel if present
    const panel = document.getElementById("cookie-manage-panel");
    if (panel) panel.classList.toggle("hidden");
  });

  loadConsent();

  // ---- Error dialog ----
  function showError(msg) {
    const overlay = document.getElementById("error-overlay");
    const box = document.getElementById("error-box");
    if (!overlay || !box) return;
    box.innerHTML = `<p id="error-msg"></p><button id="error-close" class="btn btn-sm btn-outline">Close</button>`;
    const el = document.getElementById("error-msg");
    el.textContent = msg;
    const close = document.getElementById("error-close");
    close.addEventListener("click", () => {
      overlay.classList.add("hidden");
      document.body.style.overflow = "";
    });
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    el.focus();
  }

  // ---- Utility: download helpers ----
  function downloadBlob(blob, filename, mime) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ---- Scroll-to-top button ----
  const scrollTop = document.getElementById("scroll-top");
  if (scrollTop) {
    window.addEventListener("scroll", () => {
      scrollTop.classList.toggle("visible", window.scrollY > 600);
    });
    scrollTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Expose for module pages
  window.__pt = { showToast, showError, downloadBlob };
})();
