(function () {
  const data = window.ManzoniData;
  const board = document.getElementById("memory-board");
  const hudMoves = document.getElementById("hud-moves");
  const hudPairs = document.getElementById("hud-pairs");
  const hudTotal = document.getElementById("hud-total");
  const feedback = document.getElementById("memory-feedback");
  const endBox = document.getElementById("memory-end");
  const endText = document.getElementById("memory-end-text");
  if (!data || !board || !data.memory) return;

  let cards = [];
  let flipped = [];
  let lock = false;
  let moves = 0;
  let pairs = 0;
  const totalPairs = data.memory.length;

  hudTotal.textContent = String(totalPairs);

  function buildDeck() {
    const deck = [];
    data.memory.forEach((pair) => {
      deck.push({ pairId: pair.id, text: pair.a, side: "a" });
      deck.push({ pairId: pair.id, text: pair.b, side: "b" });
    });
    const shuffle = window.mescola || ((lista) => {
      const copia = [...lista];
      for (let i = copia.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
      }
      return copia;
    });
    return shuffle(deck);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    board.innerHTML = "";
    cards = buildDeck();
    flipped = [];
    lock = false;
    moves = 0;
    pairs = 0;
    endBox.hidden = true;
    feedback.textContent = "Scegli due carte.";
    syncHud();

    cards.forEach((card, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-card";
      btn.dataset.index = String(index);
      btn.setAttribute("aria-label", "Carta coperta");
      btn.innerHTML = `
        <span class="memory-inner">
          <span class="memory-face memory-back" aria-hidden="true">M</span>
          <span class="memory-face memory-front">${escapeHtml(card.text)}</span>
        </span>
      `;
      btn.addEventListener("click", () => onFlip(index, btn));
      board.appendChild(btn);
    });
  }

  function syncHud() {
    hudMoves.textContent = String(moves);
    hudPairs.textContent = String(pairs);
  }

  function onFlip(index, btn) {
    if (lock || btn.classList.contains("is-flipped") || btn.classList.contains("is-matched")) {
      return;
    }
    btn.classList.add("is-flipped");
    btn.setAttribute("aria-label", cards[index].text);
    flipped.push({ index, btn });
    if (window.AudioUi) window.AudioUi.beep("page");

    if (flipped.length < 2) return;

    moves += 1;
    syncHud();
    lock = true;
    const [first, second] = flipped;
    const match = cards[first.index].pairId === cards[second.index].pairId;

    if (match) {
      first.btn.classList.add("is-matched");
      second.btn.classList.add("is-matched");
      first.btn.disabled = true;
      second.btn.disabled = true;
      pairs += 1;
      syncHud();
      feedback.textContent = "Coppia giusta.";
      if (window.AudioUi) window.AudioUi.beep("ok");
      if (window.Progressi) window.Progressi.registra("memory", true);
      flipped = [];
      lock = false;
      if (pairs >= totalPairs) finish();
    } else {
      feedback.textContent = "Non combacia: riprova.";
      if (window.AudioUi) window.AudioUi.beep("bad");
      if (window.Progressi) window.Progressi.registra("memory", false);
      window.setTimeout(() => {
        first.btn.classList.remove("is-flipped");
        second.btn.classList.remove("is-flipped");
        first.btn.setAttribute("aria-label", "Carta coperta");
        second.btn.setAttribute("aria-label", "Carta coperta");
        flipped = [];
        lock = false;
      }, 750);
    }
  }

  function finish() {
    endBox.hidden = false;
    endText.textContent = `Hai completato tutte le ${totalPairs} coppie in ${moves} mosse.`;
    feedback.textContent = "Bravo: il manoscritto è ricostruito.";
    if (window.AudioUi) window.AudioUi.beep("win");
  }

  document.getElementById("btn-restart").addEventListener("click", render);
  document.getElementById("btn-again").addEventListener("click", render);
  render();
})();
