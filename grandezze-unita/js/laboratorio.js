(function () {
  const valore = document.getElementById("conv-valore");
  const unita = document.getElementById("conv-unita");
  const out = document.getElementById("conv-out");
  const tabs = Array.from(document.querySelectorAll("[data-conv]"));
  let modo = "lunghezza";

  const lunghezze = [
    { id: "km", label: "km", inM: 1000 },
    { id: "m", label: "m", inM: 1 },
    { id: "cm", label: "cm", inM: 0.01 },
    { id: "mm", label: "mm", inM: 0.001 },
  ];

  function fmt(n) {
    if (!Number.isFinite(n)) return "—";
    const abs = Math.abs(n);
    if (abs === 0) return "0";
    if (abs >= 100) return String(Math.round(n * 100) / 100);
    return String(Math.round(n * 1000) / 1000);
  }

  function fillUnita() {
    unita.innerHTML = "";
    if (modo === "lunghezza") {
      lunghezze.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.label;
        if (u.id === "cm") opt.selected = true;
        unita.appendChild(opt);
      });
    } else {
      [
        ["ms", "m/s"],
        ["kmh", "km/h"],
      ].forEach(([id, label], i) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = label;
        if (i === 0) opt.selected = true;
        unita.appendChild(opt);
      });
    }
    if (modo === "lunghezza") valore.value = "80";
    else valore.value = "10";
    renderConv();
  }

  function renderConv() {
    const n = Number(String(valore.value).replace(",", "."));
    if (!Number.isFinite(n)) {
      out.textContent = "Scrivi un numero.";
      return;
    }
    if (modo === "lunghezza") {
      const src = lunghezze.find((u) => u.id === unita.value) || lunghezze[1];
      const metri = n * src.inM;
      out.innerHTML = lunghezze
        .map((u) => `<span class="mono">${fmt(metri / u.inM)} ${u.label}</span>`)
        .join("<br>");
      return;
    }
    if (unita.value === "ms") {
      out.innerHTML =
        `<span class="mono">${fmt(n)} m/s</span><br>` +
        `<span class="mono">${fmt(n * 3.6)} km/h</span>`;
    } else {
      out.innerHTML =
        `<span class="mono">${fmt(n)} km/h</span><br>` +
        `<span class="mono">${fmt(n / 3.6)} m/s</span>`;
    }
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      modo = btn.dataset.conv;
      tabs.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("btn-primary", on);
        b.setAttribute("aria-pressed", String(on));
      });
      fillUnita();
    });
  });

  valore.addEventListener("input", renderConv);
  unita.addEventListener("change", renderConv);
  fillUnita();

  const velS = document.getElementById("vel-s");
  const velT = document.getElementById("vel-t");
  const velOut = document.getElementById("vel-out");

  function renderVel() {
    const s = Number(String(velS.value).replace(",", "."));
    const t = Number(String(velT.value).replace(",", "."));
    if (!Number.isFinite(s) || !Number.isFinite(t)) {
      velOut.textContent = "Scrivi spazio e tempo.";
      return;
    }
    if (t <= 0) {
      velOut.textContent = "Il tempo deve essere più di zero.";
      return;
    }
    if (s < 0) {
      velOut.textContent = "Lo spazio non può essere negativo.";
      return;
    }
    const v = s / t;
    velOut.innerHTML =
      `<span class="mono">v = ${fmt(s)} / ${fmt(t)} = ${fmt(v)} m/s</span><br>` +
      `<span class="mono">${fmt(v * 3.6)} km/h</span>`;
  }

  velS.addEventListener("input", renderVel);
  velT.addEventListener("input", renderVel);
  renderVel();

  const bank = [
    { q: "Lunghezza del tubo", ok: "m", opts: ["m", "kg", "s"] },
    { q: "Massa del pezzo", ok: "kg", opts: ["m", "kg", "s"] },
    { q: "Durata di un giro", ok: "s", opts: ["m", "kg", "s"] },
    { q: "Area della lamiera", ok: "m²", opts: ["m", "m²", "m/s"] },
    { q: "Volume del serbatoio", ok: "m³", opts: ["m²", "m³", "kg"] },
    { q: "Velocità dello scooter", ok: "m/s", opts: ["m", "s", "m/s"] },
  ];

  const matchQ = document.getElementById("match-q");
  const matchOpts = document.getElementById("match-opts");
  const matchMsg = document.getElementById("match-msg");
  const matchNext = document.getElementById("match-next");
  let current = null;
  let locked = false;

  function nuovaMatch() {
    locked = false;
    matchMsg.textContent = "";
    matchMsg.className = "feedback";
    const lista = window.mescola ? window.mescola(bank) : bank.slice();
    current = lista[0];
    if (current === nuovaMatch.last && lista[1]) current = lista[1];
    nuovaMatch.last = current;
    matchQ.textContent = "Unità per: " + current.q;
    matchOpts.innerHTML = "";
    const opts = window.mescola ? window.mescola(current.opts) : current.opts;
    opts.forEach((label) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = label;
      b.addEventListener("click", () => {
        if (locked) return;
        locked = true;
        const ok = label === current.ok;
        matchMsg.textContent = ok ? "Giusto." : "No. Quella è " + current.ok + ".";
        matchMsg.className = "feedback " + (ok ? "is-ok" : "is-ko");
      });
      matchOpts.appendChild(b);
    });
  }

  if (matchNext) matchNext.addEventListener("click", nuovaMatch);
  nuovaMatch();
})();
