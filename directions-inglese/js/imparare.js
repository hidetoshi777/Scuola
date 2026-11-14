(function () {
  const griglia = document.getElementById("griglia-posti");
  if (griglia) {
    const ids = ["pharmacy", "church", "hospital", "bank", "school", "park", "cinema", "postoffice", "supermarket",
      "restaurant", "cafe", "hotel", "station", "lights"];
    griglia.innerHTML = ids.map((id) => {
      const p = window.POSTO(id);
      return `<button type="button" class="carta-posto" data-voce="w_${id}" aria-label="${p.en}, ${p.it}">${window.icona(id)}<b>${p.en}</b><i>${p.it}</i></button>`;
    }).join("");
  }

  /* Scene «dov'è»: "a,b*,c|d,e,f" = fila sopra | fila sotto, * = il posto da trovare. */
  document.querySelectorAll("[data-scena]").forEach((el) => {
    const spec = el.dataset.scena;
    if (spec === "angolo") {
      el.innerHTML = `<svg viewBox="0 0 240 120" aria-hidden="true">
        <rect x="0" y="0" width="240" height="120" fill="var(--prato)"/>
        <rect x="0" y="70" width="240" height="30" fill="var(--asfalto)"/><rect x="150" y="0" width="30" height="120" fill="var(--asfalto)"/>
        <rect x="102" y="18" width="44" height="48" rx="8" fill="#f2c23033" stroke="#f2c230" stroke-width="2" stroke-dasharray="5 3"/>
        <use href="#ic-bakery" x="104" y="20" width="40" height="40"/>
        <text x="126" y="14" text-anchor="middle" font-size="11" font-weight="800" fill="var(--ink-mappa)">it</text>
      </svg>`;
      return;
    }
    const [su, giu] = spec.split("|").map((r) => r.split(","));
    const fila = (r) => `<div class="fila">${r.map((x) => {
      const meta = x.endsWith("*");
      const id = x.replace("*", "");
      if (!id) return '<div class="lotto"></div>';
      return `<div class="lotto${meta ? " meta" : ""}">${window.icona(id)}<small>${meta ? "it" : "the " + window.POSTO(id).en}</small></div>`;
    }).join("")}</div>`;
    el.innerHTML = fila(su) + '<div class="via"></div>' + fila(giu);
  });
})();
