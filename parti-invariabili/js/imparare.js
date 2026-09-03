document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll("[data-tab]");
  const panels = document.querySelectorAll("[data-panel]");
  if (!tabs.length) {
    return;
  }

  function selectTab(id) {
    tabs.forEach((t) => {
      const active = t.dataset.tab === id;
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== id;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  });

  const hash = location.hash.replace("#", "");
  if (hash && document.getElementById(hash)) {
    selectTab(hash);
  }
});
