(function () {
  const data = window.BAROCCO;
  if (!data) return;

  const board = document.getElementById("mappa-board");
  const live = document.getElementById("mappa-live");
  if (!board) return;

  data.pins.forEach((pin) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pin-btn";
    btn.style.left = pin.left;
    btn.style.top = pin.top;
    btn.dataset.id = pin.id;
    btn.setAttribute("aria-label", pin.label);
    btn.addEventListener("click", () => seleziona(pin.id, true));
    board.appendChild(btn);
  });

  function seleziona(id, scroll) {
    document.querySelectorAll(".pin-btn").forEach((btn) => {
      if (btn.dataset.id === id) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });

    const autori = data.autori.filter((a) => a.pin === id);
    document.querySelectorAll(".autore").forEach((card) => {
      const on = autori.some((a) => a.id === card.dataset.id);
      card.classList.toggle("is-on", on);
    });

    if (live) {
      live.textContent = autori.map((a) => a.nome + " · " + a.citta).join(" · ");
    }

    if (scroll && autori[0]) {
      const el = document.getElementById("autore-" + autori[0].id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  document.querySelectorAll(".autore").forEach((card) => {
    card.addEventListener("click", () => {
      const autore = data.autori.find((a) => a.id === card.dataset.id);
      if (autore) seleziona(autore.pin, false);
    });
  });
})();
