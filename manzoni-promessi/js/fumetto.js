(function () {
  const captions = [
    "Tavola 1 — Lecco: Renzo e Lucia vogliono sposarsi, ma i Bravi di Don Rodrigo bloccano Don Abbondio. Inizia la fuga.",
    "Tavola 2 — Renzo a Milano; Lucia rapita. L’Innominato si converte e la libera: entra in scena la Provvidenza.",
    "Tavola 3 — La peste bilancia tutto: Don Rodrigo muore, Renzo ritrova Lucia, finalmente il matrimonio.",
    "Tavola 4 — Dietro la trama: Manzoni, la lingua fiorentina, l’espediente del manoscritto, la rottura delle unità.",
  ];

  const pages = Array.from(document.querySelectorAll(".fumetto-page"));
  const statusNum = document.getElementById("fumetto-num");
  const caption = document.getElementById("fumetto-caption");
  const prevBtn = document.getElementById("fumetto-prev");
  const nextBtn = document.getElementById("fumetto-next");
  const dotsWrap = document.getElementById("fumetto-dots");
  const viewport = document.getElementById("fumetto-viewport");
  if (!pages.length || !viewport) return;

  let index = 0;
  let busy = false;
  const total = pages.length;
  const reduceMotion =
    document.body.classList.contains("reduced-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  pages.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "fumetto-dot";
    dot.setAttribute("aria-label", `Vai alla tavola ${i + 1}`);
    dot.addEventListener("click", () => go(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.querySelectorAll(".fumetto-dot"));

  function clearFlipClasses(page) {
    page.classList.remove(
      "is-flip-out-next",
      "is-flip-in-next",
      "is-flip-out-prev",
      "is-flip-in-prev"
    );
  }

  function syncChrome() {
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    if (statusNum) statusNum.textContent = String(index + 1);
    if (caption) caption.textContent = captions[index] || "";
    prevBtn.disabled = index === 0 || busy;
    nextBtn.disabled = index === total - 1 || busy;
  }

  function settle(next) {
    pages.forEach((page, i) => {
      clearFlipClasses(page);
      const active = i === next;
      page.classList.toggle("is-active", active);
      page.setAttribute("aria-hidden", active ? "false" : "true");
    });
    index = next;
    busy = false;
    syncChrome();
  }

  function go(next, forcedDir) {
    const target = Math.max(0, Math.min(total - 1, next));
    if (target === index || busy) return;

    const dir = forcedDir != null ? forcedDir : target > index ? 1 : -1;
    if (window.AudioUi) window.AudioUi.beep(target === total - 1 ? "win" : "page");

    if (reduceMotion) {
      settle(target);
      return;
    }

    busy = true;
    syncChrome();
    const outgoing = pages[index];
    const incoming = pages[target];

    clearFlipClasses(outgoing);
    clearFlipClasses(incoming);
    incoming.classList.add("is-active");
    incoming.setAttribute("aria-hidden", "false");

    const outClass = dir === 1 ? "is-flip-out-next" : "is-flip-out-prev";
    const inClass = dir === 1 ? "is-flip-in-next" : "is-flip-in-prev";
    outgoing.classList.add(outClass);
    incoming.classList.add(inClass);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      outgoing.removeEventListener("animationend", finish);
      settle(target);
    };
    outgoing.addEventListener("animationend", finish);
    window.setTimeout(finish, 650);
  }

  prevBtn.addEventListener("click", () => go(index - 1, -1));
  nextBtn.addEventListener("click", () => go(index + 1, 1));

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown") go(index + 1, 1);
    else if (event.key === "ArrowLeft" || event.key === "PageUp") go(index - 1, -1);
  });

  let startX = 0;
  let startY = 0;
  viewport.addEventListener(
    "touchstart",
    (event) => {
      const t = event.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
    },
    { passive: true }
  );
  viewport.addEventListener(
    "touchend",
    (event) => {
      const t = event.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) go(index + 1, 1);
      else go(index - 1, -1);
    },
    { passive: true }
  );

  viewport.addEventListener("click", (event) => {
    if (busy) return;
    const rect = viewport.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (x > rect.width * 0.66) go(index + 1, 1);
    else if (x < rect.width * 0.33) go(index - 1, -1);
  });

  settle(0);
})();
