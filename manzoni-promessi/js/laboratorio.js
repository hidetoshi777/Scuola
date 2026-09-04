(function () {
  const data = window.ManzoniData;
  if (!data) return;

  const tabOrdine = document.getElementById("tab-ordine");
  const tabAbbina = document.getElementById("tab-abbina");
  const panelOrdine = document.getElementById("panel-ordine");
  const panelAbbina = document.getElementById("panel-abbina");
  const lista = document.getElementById("ordine-lista");
  const ordineFeedback = document.getElementById("ordine-feedback");
  const matchGrid = document.getElementById("match-grid");
  const matchFeedback = document.getElementById("match-feedback");

  let ordine = [];

  function switchTab(which) {
    const isOrdine = which === "ordine";
    tabOrdine.setAttribute("aria-selected", String(isOrdine));
    tabAbbina.setAttribute("aria-selected", String(!isOrdine));
    panelOrdine.hidden = !isOrdine;
    panelAbbina.hidden = isOrdine;
  }

  tabOrdine.addEventListener("click", () => switchTab("ordine"));
  tabAbbina.addEventListener("click", () => switchTab("abbina"));

  function renderOrdine() {
    lista.innerHTML = "";
    ordine.forEach((ev, i) => {
      const li = document.createElement("li");
      li.className = "ordine-item";
      li.dataset.id = ev.id;
      li.innerHTML = `
        <span class="idx">${i + 1}</span>
        <span>${ev.testo}</span>
        <span class="movers">
          <button type="button" aria-label="Sposta su">▲</button>
          <button type="button" aria-label="Sposta giù">▼</button>
        </span>
      `;
      const [up, down] = li.querySelectorAll("button");
      up.addEventListener("click", () => move(i, -1));
      down.addEventListener("click", () => move(i, 1));
      lista.appendChild(li);
    });
  }

  function move(index, delta) {
    const next = index + delta;
    if (next < 0 || next >= ordine.length) return;
    [ordine[index], ordine[next]] = [ordine[next], ordine[index]];
    renderOrdine();
    ordineFeedback.hidden = true;
    if (window.AudioUi) window.AudioUi.beep("page");
  }

  function shuffleOrdine() {
    ordine = window.mescola(data.eventi);
    // Evita di partire già in ordine corretto.
    const corretto = data.eventi.every((e, i) => ordine[i].id === e.id);
    if (corretto) ordine = window.mescola(data.eventi);
    renderOrdine();
    ordineFeedback.hidden = true;
  }

  document.getElementById("ordine-shuffle").addEventListener("click", shuffleOrdine);
  document.getElementById("ordine-check").addEventListener("click", () => {
    let ok = 0;
    ordine.forEach((e, i) => {
      if (e.id === data.eventi[i].id) ok += 1;
    });
    const pieno = ok === data.eventi.length;
    ordineFeedback.hidden = false;
    ordineFeedback.className = `feedback ${pieno ? "ok" : "bad"}`;
    if (pieno) {
      ordineFeedback.textContent = "Perfetto: il filo della trama è ricostruito.";
      if (window.AudioUi) window.AudioUi.beep("win");
      if (window.Progressi) window.Progressi.registra("ordine", true);
    } else {
      ordineFeedback.textContent = `Ci sono ${data.eventi.length - ok} pezzi fuori posto. Ricorda: minaccia → fuga → rapimento → conversione → peste → matrimonio.`;
      if (window.AudioUi) window.AudioUi.beep("bad");
      if (window.Progressi) window.Progressi.registra("ordine", false);
    }
  });

  function renderMatch() {
    const labels = data.etichetteAbbinamento;
    const options = Object.keys(labels)
      .map((k) => `<option value="${k}">${labels[k]}</option>`)
      .join("");
    matchGrid.innerHTML = "";
    window.mescola(data.abbinamenti).forEach((item) => {
      const row = document.createElement("div");
      row.className = "match-row";
      row.dataset.id = item.id;
      row.dataset.risposta = item.risposta;
      row.innerHTML = `
        <p>${item.testo}</p>
        <label>
          <span class="visually-hidden">Concetto per: ${item.testo}</span>
          <select>
            <option value="">— scegli —</option>
            ${options}
          </select>
        </label>
      `;
      matchGrid.appendChild(row);
    });
    matchFeedback.hidden = true;
  }

  document.getElementById("match-check").addEventListener("click", () => {
    const rows = [...matchGrid.querySelectorAll(".match-row")];
    let giusti = 0;
    const errori = [];
    rows.forEach((row) => {
      const sel = row.querySelector("select");
      const ok = sel.value === row.dataset.risposta;
      if (ok) {
        giusti += 1;
      } else {
        const item = data.abbinamenti.find((a) => a.id === row.dataset.id);
        if (item) errori.push(item);
      }
      if (window.Progressi) window.Progressi.registra("abbina", ok);
    });
    matchFeedback.hidden = false;
    const pieno = giusti === rows.length;
    matchFeedback.className = `feedback ${pieno ? "ok" : "bad"}`;
    if (pieno) {
      matchFeedback.textContent = "Tutti gli abbinamenti sono corretti.";
      if (window.AudioUi) window.AudioUi.beep("win");
    } else {
      const tip = errori
        .slice(0, 2)
        .map((e) => `${e.testo} → ${data.etichetteAbbinamento[e.risposta]} (${e.spiegazione})`)
        .join(" ");
      matchFeedback.textContent = `Corretti: ${giusti}/${rows.length}. ${tip}`;
      if (window.AudioUi) window.AudioUi.beep("bad");
    }
  });

  shuffleOrdine();
  renderMatch();
})();
