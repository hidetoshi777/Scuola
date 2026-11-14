(function () {
  const box = document.getElementById("vetrina");
  if (!box) return;
  const ids = ["pharmacy", "church", "bank", "hospital", "supermarket", "school", "station", "lights"];
  box.innerHTML = ids.map((id) => {
    const p = window.POSTO(id);
    return `<button type="button" data-voce="w_${id}" aria-label="${p.en}, ${p.it}">${window.icona(id)}<b>${p.en}</b><i>${p.it}</i></button>`;
  }).join("");
})();
