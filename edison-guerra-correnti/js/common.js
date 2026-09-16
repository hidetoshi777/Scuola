(function () {
  const KEY = "tema-edison-guerra-correnti";
  const root = document.documentElement;
  const stored = localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") {
    root.dataset.theme = stored;
  } else {
    root.dataset.theme = "dark";
  }

  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    const syncLabel = () => {
      const light = root.dataset.theme === "light";
      toggle.setAttribute("aria-pressed", String(light));
      toggle.textContent = light ? "Scuro" : "Chiaro";
      toggle.setAttribute("aria-label", light ? "Passa al tema scuro" : "Passa al tema chiaro");
    };
    syncLabel();
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem(KEY, root.dataset.theme);
      syncLabel();
    });
  }

  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".ed-nav a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === here || (here === "" && href === "index.html")) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("reduced-motion");
  }

  if (!window.ScuolaAccess) {
    const s = document.createElement("script");
    s.src = "../js/access-track.js?v=2";
    s.defer = true;
    document.head.appendChild(s);
  }
})();
