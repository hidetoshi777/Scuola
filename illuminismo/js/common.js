(function () {
  const KEY = "tema-illuminismo";
  const root = document.documentElement;
  const stored = localStorage.getItem(KEY);
  root.dataset.theme = stored === "light" || stored === "dark" ? stored : "dark";

  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    const syncLabel = () => {
      const light = root.dataset.theme === "light";
      toggle.setAttribute("aria-pressed", String(light));
      toggle.textContent = light ? "Tema scuro" : "Tema chiaro";
      toggle.setAttribute(
        "aria-label",
        light ? "Passa al tema scuro" : "Passa al tema chiaro"
      );
    };
    syncLabel();
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem(KEY, root.dataset.theme);
      syncLabel();
    });
  }

  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav] a[href]").forEach((link) => {
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
    s.src = "../js/access-track.js?v=7";
    s.defer = true;
    document.head.appendChild(s);
  }
})();
