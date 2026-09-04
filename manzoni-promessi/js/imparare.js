(function () {
  const TOTAL = 16;
  const img = document.getElementById("canva-slide");
  const counter = document.getElementById("canva-counter");
  const prevBtn = document.getElementById("canva-prev");
  const nextBtn = document.getElementById("canva-next");
  const thumbs = document.querySelector(".canva-thumbs");
  if (!img || !counter || !prevBtn || !nextBtn || !thumbs) return;

  let current = 1;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function srcFor(n) {
    return `img/canva/slide-${pad(n)}.jpg`;
  }

  function renderThumbs() {
    thumbs.innerHTML = "";
    for (let n = 1; n <= TOTAL; n += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "listitem");
      btn.setAttribute("aria-label", `Vai alla slide ${n}`);
      const thumb = document.createElement("img");
      thumb.src = srcFor(n);
      thumb.alt = "";
      thumb.width = 160;
      thumb.height = 90;
      thumb.loading = "lazy";
      btn.appendChild(thumb);
      btn.addEventListener("click", () => go(n));
      thumbs.appendChild(btn);
    }
  }

  function syncThumbs() {
    thumbs.querySelectorAll("button").forEach((btn, i) => {
      btn.setAttribute("aria-current", i + 1 === current ? "true" : "false");
    });
  }

  function go(n) {
    current = Math.min(TOTAL, Math.max(1, n));
    img.src = srcFor(current);
    img.alt = `Slide ${current} di ${TOTAL}: Alessandro Manzoni`;
    counter.textContent = `${current} / ${TOTAL}`;
    syncThumbs();
    if (window.AudioUi) window.AudioUi.beep("page");
  }

  prevBtn.addEventListener("click", () => go(current - 1));
  nextBtn.addEventListener("click", () => go(current + 1));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(current - 1);
    if (e.key === "ArrowRight") go(current + 1);
  });

  renderThumbs();
  go(1);
})();
