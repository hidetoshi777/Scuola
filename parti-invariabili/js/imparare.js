document.addEventListener("DOMContentLoaded", () => {
  const tabs = [...document.querySelectorAll("[data-tab]")];
  const panels = [...document.querySelectorAll("[data-panel]")];

  // I sottotipi vengono generati dai dati, così lezione ed esercizi
  // restano allineati: si aggiorna data.js e cambiano entrambi.
  if (window.Grammatica) {
    Grammatica.categorie.forEach((cat) => {
      const ospite = document.querySelector(`[data-sottotipi="${cat.id}"]`);
      if (!ospite) {
        return;
      }
      const griglia = document.createElement("div");
      griglia.className = "sub-grid";
      cat.sottotipi.forEach((sub) => {
        const box = document.createElement("div");
        box.className = `sub-item tipo-${cat.id}`;
        const titolo = document.createElement("h4");
        titolo.textContent = sub.nome;
        const testo = document.createElement("p");
        testo.textContent = sub.breve;
        const esempi = document.createElement("div");
        esempi.className = "sub-esempi";
        sub.esempi.forEach((e) => {
          const tag = document.createElement("span");
          tag.textContent = e;
          esempi.append(tag);
        });
        box.append(titolo, testo, esempi);
        griglia.append(box);
      });
      ospite.replaceChildren(griglia);
    });
  }

  if (!tabs.length) {
    return;
  }

  function selectTab(id, sposta) {
    tabs.forEach((t) => {
      const attivo = t.dataset.tab === id;
      t.setAttribute("aria-selected", String(attivo));
      t.tabIndex = attivo ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== id;
    });
    if (sposta) {
      tabs.find((t) => t.dataset.tab === id)?.focus();
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  });

  // Frecce sinistra/destra fra le linguette, come previsto dal pattern ARIA.
  tabs.forEach((tab, i) => {
    tab.addEventListener("keydown", (ev) => {
      let target = null;
      if (ev.key === "ArrowRight") {
        target = tabs[(i + 1) % tabs.length];
      } else if (ev.key === "ArrowLeft") {
        target = tabs[(i - 1 + tabs.length) % tabs.length];
      } else if (ev.key === "Home") {
        target = tabs[0];
      } else if (ev.key === "End") {
        target = tabs[tabs.length - 1];
      }
      if (target) {
        ev.preventDefault();
        selectTab(target.dataset.tab, true);
      }
    });
  });

  const hash = location.hash.replace("#", "");
  if (hash && tabs.some((t) => t.dataset.tab === hash)) {
    selectTab(hash);
  }
});
