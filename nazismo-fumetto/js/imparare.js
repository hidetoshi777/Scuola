(function () {
  const TOTAL = 11;
  const alts = [
    "Titolo: Il Nazismo 1933–1945",
    "Le ragioni dell’ascesa: crisi economica",
    "Weimar debole e vergogna dei reduci",
    "Presa del potere e differenze con Mussolini",
    "Mein Kampf: razza, spazio vitale, antibolscevismo",
    "Shoah: da Norimberga alla Soluzione finale",
    "Campi di concentramento e di sterminio",
    "Similitudini Fascismo / Nazismo",
    "Rapporti Mussolini–Hitler",
    "Perché seguire Hitler: paura e tentazione",
    "Conclusione del Prof. Rossano Bella",
  ];

  const img = document.getElementById("canva-slide");
  const counter = document.getElementById("canva-counter");
  const prevBtn = document.getElementById("canva-prev");
  const nextBtn = document.getElementById("canva-next");
  const fullBtn = document.getElementById("canva-fullscreen");
  const thumbs = document.querySelector(".canva-thumbs");
  const viewer = document.querySelector("[data-canva-viewer]");

  if (!img || !counter || !prevBtn || !nextBtn || !thumbs) {
    return;
  }

  let index = 1;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function srcFor(n) {
    return `img/canva/slide-${pad(n)}.jpg`;
  }

  function show(n) {
    index = Math.min(TOTAL, Math.max(1, n));
    img.src = srcFor(index);
    img.alt = `Slide ${index} di ${TOTAL}: ${alts[index - 1]}`;
    counter.textContent = `${index} / ${TOTAL}`;
    prevBtn.disabled = index === 1;
    nextBtn.disabled = index === TOTAL;
    thumbs.querySelectorAll("button").forEach((btn) => {
      const i = Number(btn.dataset.slide);
      btn.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function isFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function syncFullscreenLabel() {
    if (!fullBtn) return;
    const on = isFullscreen() && (document.fullscreenElement === viewer || document.webkitFullscreenElement === viewer);
    fullBtn.setAttribute("aria-pressed", String(on));
    fullBtn.textContent = on ? "Esci" : "Schermo intero";
  }

  async function toggleFullscreen() {
    if (!viewer) return;
    try {
      if (isFullscreen() && (document.fullscreenElement === viewer || document.webkitFullscreenElement === viewer)) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else if (viewer.requestFullscreen) {
        await viewer.requestFullscreen();
      } else if (viewer.webkitRequestFullscreen) {
        viewer.webkitRequestFullscreen();
      }
    } catch (err) {
      /* ignore */
    }
    syncFullscreenLabel();
  }

  for (let i = 1; i <= TOTAL; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.slide = String(i);
    btn.setAttribute("aria-label", `Vai alla slide ${i}`);
    btn.setAttribute("role", "listitem");
    const thumb = document.createElement("img");
    thumb.src = srcFor(i);
    thumb.alt = "";
    thumb.width = 320;
    thumb.height = 180;
    thumb.loading = i === 1 ? "eager" : "lazy";
    btn.appendChild(thumb);
    btn.addEventListener("click", () => show(i));
    thumbs.appendChild(btn);
  }

  prevBtn.addEventListener("click", () => show(index - 1));
  nextBtn.addEventListener("click", () => show(index + 1));
  if (fullBtn) fullBtn.addEventListener("click", toggleFullscreen);

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
    else if ((event.key === "f" || event.key === "F") && !/input|textarea|select/i.test(event.target.tagName)) {
      toggleFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", syncFullscreenLabel);
  document.addEventListener("webkitfullscreenchange", syncFullscreenLabel);

  show(1);
  syncFullscreenLabel();
})();
