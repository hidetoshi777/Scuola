(function () {
  const data = window.KierkegaardData;
  const pool = document.getElementById("chip-pool");
  const grid = document.getElementById("tri-grid");
  const feedback = document.getElementById("lab-feedback");
  const checkBtn = document.getElementById("lab-check");
  const resetBtn = document.getElementById("lab-reset");
  if (!data || !pool || !grid) return;

  let selectedId = null;
  const placement = {};

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clearSelection() {
    selectedId = null;
    pool.querySelectorAll(".chip").forEach((el) => el.classList.remove("is-selected"));
    grid.querySelectorAll(".tri-bin").forEach((el) => el.classList.remove("is-target"));
  }

  function renderBins() {
    grid.innerHTML = "";
    data.bins.forEach((bin) => {
      const box = document.createElement("div");
      box.className = "tri-bin";
      box.dataset.bin = bin.id;
      box.innerHTML = `<h3>${escapeHtml(bin.label)}</h3><div class="tri-slots" data-slots="${bin.id}"></div>`;
      box.addEventListener("click", () => placeIn(bin.id));
      grid.appendChild(box);
    });
  }

  function renderPool() {
    pool.innerHTML = "";
    const items = window.mescola ? window.mescola(data.stadi) : data.stadi;
    items.forEach((g) => {
      if (placement[g.id]) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.dataset.id = g.id;
      btn.textContent = g.text;
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        selectChip(g.id, btn);
      });
      pool.appendChild(btn);
    });
  }

  function renderPlaced() {
    grid.querySelectorAll("[data-slots]").forEach((slot) => {
      slot.innerHTML = "";
    });
    Object.entries(placement).forEach(([id, binId]) => {
      const g = data.stadi.find((x) => x.id === id);
      if (!g) return;
      const slot = grid.querySelector(`[data-slots="${binId}"]`);
      if (!slot) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip is-placed";
      btn.dataset.id = id;
      btn.textContent = g.text;
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        delete placement[id];
        feedback.hidden = true;
        renderAll();
      });
      slot.appendChild(btn);
    });
  }

  function selectChip(id, btn) {
    selectedId = id;
    pool.querySelectorAll(".chip").forEach((el) => el.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    grid.querySelectorAll(".tri-bin").forEach((el) => el.classList.add("is-target"));
  }

  function placeIn(binId) {
    if (!selectedId) return;
    placement[selectedId] = binId;
    clearSelection();
    feedback.hidden = true;
    renderAll();
    if (window.AudioUi) window.AudioUi.beep("page");
  }

  function renderAll() {
    renderPool();
    renderPlaced();
  }

  function check() {
    const total = data.stadi.length;
    const placed = Object.keys(placement).length;
    if (placed < total) {
      feedback.hidden = false;
      feedback.className = "feedback is-bad";
      feedback.textContent = `Ne mancano ${total - placed}. Metti tutte le schede negli stadi.`;
      return;
    }

    let giusti = 0;
    grid.querySelectorAll(".chip.is-placed").forEach((chip) => {
      chip.classList.remove("is-right", "is-wrong");
      const g = data.stadi.find((x) => x.id === chip.dataset.id);
      const ok = g && placement[g.id] === g.bin;
      chip.classList.add(ok ? "is-right" : "is-wrong");
      if (ok) giusti += 1;
    });

    feedback.hidden = false;
    feedback.className = giusti === total ? "feedback is-ok" : "feedback is-bad";
    if (giusti === total) {
      feedback.textContent = "Perfetto: gli stadi sono a posto. Ora prova Aut-aut.";
      if (window.AudioUi) window.AudioUi.beep("win");
    } else {
      const errori = data.stadi.filter((g) => placement[g.id] !== g.bin);
      const primo = errori[0];
      feedback.textContent = `Giusti ${giusti}/${total}. Esempio: «${primo.text}» → ${primo.hint}`;
      if (window.AudioUi) window.AudioUi.beep("err");
    }
  }

  function reset() {
    Object.keys(placement).forEach((k) => delete placement[k]);
    clearSelection();
    feedback.hidden = true;
    renderBins();
    renderAll();
  }

  checkBtn.addEventListener("click", check);
  resetBtn.addEventListener("click", reset);
  reset();
})();
