(function () {
  const storia = window.STORIA_NAZISMO;
  if (!storia) {
    return;
  }

  const stage = document.getElementById("vn-stage");
  if (!stage) {
    return;
  }

  const els = {
    capitolo: document.getElementById("vn-capitolo"),
    scena: document.getElementById("vn-scena"),
    avatar: document.getElementById("vn-avatar"),
    nome: document.getElementById("vn-nome"),
    ruolo: document.getElementById("vn-ruolo"),
    testo: document.getElementById("vn-testo"),
    scelte: document.getElementById("vn-scelte"),
    progress: document.getElementById("vn-progress"),
    riparti: document.getElementById("vn-riparti"),
    fine: document.getElementById("vn-fine"),
    fineTesto: document.getElementById("vn-fine-testo"),
  };

  const KEY = "nazismo-fumetto-nodo";
  let nodoId = localStorage.getItem(KEY) || storia.inizio;
  const visitati = new Set();

  const totaleNodi = Object.keys(storia.nodi).length;

  function personaggio(id) {
    return storia.personaggi[id] || storia.personaggi.narratore;
  }

  function salva(id) {
    try {
      localStorage.setItem(KEY, id);
    } catch (err) {
      /* private mode */
    }
  }

  function aggiornaProgresso() {
    if (!els.progress) {
      return;
    }
    const pct = Math.min(100, Math.round((visitati.size / Math.max(totaleNodi * 0.55, 1)) * 100));
    els.progress.style.width = `${pct}%`;
    els.progress.parentElement?.setAttribute("aria-valuenow", String(pct));
  }

  function mostraFine(nodo) {
    if (els.fine && typeof els.fine.showModal === "function") {
      if (els.fineTesto) {
        els.fineTesto.textContent = nodo.riepilogo || "Storia completata.";
      }
      els.fine.showModal();
    }
  }

  function render(id) {
    if (id === "__fine__") {
      const corrente = storia.nodi[nodoId];
      if (corrente) {
        mostraFine(corrente);
      }
      return;
    }

    const nodo = storia.nodi[id];
    if (!nodo) {
      nodoId = storia.inizio;
      salva(nodoId);
      render(nodoId);
      return;
    }

    nodoId = id;
    salva(id);
    visitati.add(id);
    aggiornaProgresso();
    if (window.AudioUi) {
      window.AudioUi.beep("page");
    }

    const p = personaggio(nodo.speaker);
    stage.dataset.scena = nodo.scena || "aula";
    stage.dataset.speaker = p.classe;

    if (els.capitolo) {
      els.capitolo.textContent = nodo.capitolo || "";
    }
    if (els.scena) {
      els.scena.textContent = scenaLabel(nodo.scena);
    }
    if (els.avatar) {
      const nextSrc = `img/personaggi/${p.classe}.png`;
      const swap = () => {
        els.avatar.className = `vn-avatar ${p.classe}`;
        els.avatar.src = nextSrc;
        els.avatar.alt = `Ritratto di ${p.nome}`;
        els.avatar.classList.remove("is-swapping");
        void els.avatar.offsetWidth;
        els.avatar.classList.add("is-swapping");
      };
      if (els.avatar.getAttribute("src") !== nextSrc) {
        els.avatar.classList.add("is-fading");
        window.setTimeout(swap, 120);
      } else {
        swap();
      }
    }
    if (els.nome) {
      els.nome.textContent = p.nome;
    }
    if (els.ruolo) {
      els.ruolo.textContent = p.ruolo;
    }
    if (els.testo) {
      els.testo.classList.remove("is-typing");
      void els.testo.offsetWidth;
      els.testo.textContent = nodo.testo;
      els.testo.classList.add("is-typing");
    }

    if (els.scelte) {
      els.scelte.replaceChildren();
      (nodo.scelte || []).forEach((scelta, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "vn-choice";
        btn.textContent = scelta.testo;
        btn.style.setProperty("--i", String(index));
        btn.addEventListener("click", () => {
          if (window.AudioUi) {
            window.AudioUi.beep("choice");
          }
          render(scelta.vai);
        });
        els.scelte.appendChild(btn);
      });
      const primo = els.scelte.querySelector("button");
      if (primo) {
        primo.focus();
      }
    }

    if (nodo.epilogo) {
      stage.dataset.epilogo = "true";
    } else {
      delete stage.dataset.epilogo;
    }
  }

  function scenaLabel(scena) {
    const map = {
      aula: "Aula di storia",
      weimar: "Germania · Weimar",
      potere: "Berlino · 1933",
      libro: "Ideologia",
      strada: "Vita sotto il regime",
      radio: "Propaganda e radio",
      shoah: "Memoria della Shoah",
      guerra: "Europa in guerra",
      memoria: "Oggi",
      appunti: "Appunti e memoria",
    };
    return map[scena] || "Scena";
  }

  if (els.riparti) {
    els.riparti.addEventListener("click", () => {
      visitati.clear();
      try {
        localStorage.removeItem(KEY);
      } catch (err) {
        /* ignore */
      }
      render(storia.inizio);
      if (els.fine?.open) {
        els.fine.close();
      }
    });
  }

  const restartBtns = document.querySelectorAll("[data-vn-restart]");
  restartBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      visitati.clear();
      try {
        localStorage.removeItem(KEY);
      } catch (err) {
        /* ignore */
      }
      if (els.fine?.open) {
        els.fine.close();
      }
      render(storia.inizio);
    });
  });

  render(nodoId);
})();
