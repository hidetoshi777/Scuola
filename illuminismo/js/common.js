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

  const tabBtns = Array.from(document.querySelectorAll("[data-tab-target]"));
  const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));

  if (tabBtns.length && tabPanels.length) {
    const valid = new Set(tabPanels.map((p) => p.getAttribute("data-tab-panel")));

    const activateTab = (name, updateHash) => {
      const target = valid.has(name) ? name : tabPanels[0].getAttribute("data-tab-panel");
      tabPanels.forEach((panel) => {
        panel.hidden = panel.getAttribute("data-tab-panel") !== target;
      });
      tabBtns.forEach((btn) => {
        const active = btn.getAttribute("data-tab-target") === target;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });
      if (target !== "video") {
        document.querySelectorAll("video").forEach((v) => {
          if (!v.paused) v.pause();
        });
      }
      if (updateHash && history.replaceState) {
        history.replaceState(null, "", "#" + target);
      }
    };

    tabBtns.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        activateTab(btn.getAttribute("data-tab-target"), true);
      });
      btn.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          const dir = event.key === "ArrowRight" ? 1 : -1;
          const next = tabBtns[(idx + dir + tabBtns.length) % tabBtns.length];
          next.focus();
          activateTab(next.getAttribute("data-tab-target"), true);
        }
      });
    });

    const initialHash = location.hash.replace("#", "");
    activateTab(valid.has(initialHash) ? initialHash : "video", false);

    window.addEventListener("hashchange", () => {
      const h = location.hash.replace("#", "");
      if (valid.has(h)) activateTab(h, false);
    });
  }

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
