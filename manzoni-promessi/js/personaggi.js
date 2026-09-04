(function () {
  const data = window.ManzoniData;
  const stage = document.getElementById("rete-stage");
  const svg = document.getElementById("rete-links");
  const dossier = document.getElementById("dossier");
  if (!data || !stage || !svg || !dossier) return;

  const links = [
    ["dio", "renzo"],
    ["dio", "lucia"],
    ["dio", "innominato"],
    ["dio", "rodrigo"],
    ["dio", "cristoforo"],
    ["renzo", "lucia"],
    ["rodrigo", "innominato"],
    ["abbondio", "renzo"],
    ["cristoforo", "renzo"],
    ["federigo", "abbondio"],
  ];

  const byId = Object.fromEntries(data.personaggi.map((p) => [p.id, p]));
  let selected = null;

  function drawLinks() {
    const rect = stage.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    svg.innerHTML = "";
    links.forEach(([a, b]) => {
      const pa = byId[a];
      const pb = byId[b];
      if (!pa || !pb) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", `${(pa.x / 100) * rect.width}`);
      line.setAttribute("y1", `${(pa.y / 100) * rect.height}`);
      line.setAttribute("x2", `${(pb.x / 100) * rect.width}`);
      line.setAttribute("y2", `${(pb.y / 100) * rect.height}`);
      svg.appendChild(line);
    });
  }

  function showDossier(p) {
    selected = p.id;
    stage.querySelectorAll(".nodo").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.id === p.id ? "true" : "false");
    });
    const punti = p.punti.map((t) => `<li>${t}</li>`).join("");
    dossier.innerHTML = `
      <p class="campo-tag">${p.ruolo}</p>
      <h2>${p.nome}</h2>
      <p>${p.sintesi}</p>
      <ul class="studio-list">${punti}</ul>
    `;
    if (window.AudioUi) window.AudioUi.beep("ok");
  }

  data.personaggi.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nodo";
    btn.dataset.id = p.id;
    btn.dataset.campo = p.campo;
    btn.style.left = `${p.x}%`;
    btn.style.top = `${p.y}%`;
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = p.nome.replace(/^L’/, "L'");
    btn.addEventListener("click", () => showDossier(p));
    stage.appendChild(btn);
  });

  drawLinks();
  window.addEventListener("resize", drawLinks);

  // Apri Lucia di default su desktop; su mobile lascia vuoto per non forzare scroll.
  if (window.matchMedia("(min-width: 860px)").matches) {
    showDossier(byId.lucia);
  }
})();
