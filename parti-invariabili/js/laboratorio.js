document.addEventListener("DOMContentLoaded", () => {
  const mazzo = document.getElementById("mazzo");
  const buckets = document.getElementById("buckets");
  const feedback = document.getElementById("lab-feedback");
  const punteggioEl = document.getElementById("lab-punteggio");
  const totaleEl = document.getElementById("lab-totale");
  const ricomincia = document.getElementById("lab-reset");
  if (!mazzo || !buckets || !window.Grammatica) {
    return;
  }

  const parole = [...Grammatica.paroleLab].sort(() => Math.random() - 0.5);
  let index = 0;
  let punteggio = 0;
  totaleEl.textContent = String(parole.length);

  Grammatica.categorie.forEach((cat) => {
    const zone = document.createElement("div");
    zone.className = "bucket";
    zone.dataset.tipo = cat.id;
    zone.innerHTML = `<h3>${cat.nome}</h3><div class="bucket-drop" aria-label="Zona ${cat.nome}"></div>`;
    zone.querySelector(".bucket-drop").addEventListener("click", () => classify(cat.id));
    buckets.append(zone);
  });

  ricomincia?.addEventListener("click", () => location.reload());
  showNext();

  function showNext() {
    mazzo.replaceChildren();
    if (index >= parole.length) {
      mazzo.innerHTML = `<p class="lab-done">Hai classificato tutte le parole! Punteggio: <strong>${punteggio}/${parole.length}</strong>.</p>`;
      feedback.textContent = punteggio === parole.length ? "Perfetto! Tutte corrette." : "Rileggi la lezione e riprova.";
      return;
    }
    const item = parole[index];
    const card = document.createElement("button");
    card.type = "button";
    card.className = "word-card";
    card.textContent = item.parola;
    card.id = "parola-corrente";
    card.addEventListener("keydown", (event) => {
      const key = event.key;
      if (key >= "1" && key <= "4") {
        const cat = Grammatica.categorie[Number(key) - 1];
        if (cat) {
          classify(cat.id);
        }
      }
    });
    mazzo.append(card);
    punteggioEl.textContent = String(punteggio);
    feedback.textContent = `Parola ${index + 1} di ${parole.length}. Clicca la categoria giusta (tasti 1–4).`;
    card.focus();
  }

  function classify(tipo) {
    const item = parole[index];
    const ok = item.tipo === tipo;
    const zone = buckets.querySelector(`[data-tipo="${tipo}"] .bucket-drop`);
    if (zone) {
      const tag = document.createElement("span");
      tag.className = `placed tipo-${item.tipo} ${ok ? "is-ok" : "is-bad"}`;
      tag.textContent = item.parola;
      zone.append(tag);
    }
    if (ok) {
      punteggio += 1;
      AudioUi.beep("ok");
      feedback.textContent = `Corretto! «${item.parola}» è ${Grammatica.nomeCategoria(item.tipo).toLowerCase()}.`;
    } else {
      AudioUi.beep("bad");
      feedback.textContent = `Non proprio: «${item.parola}» è ${Grammatica.nomeCategoria(item.tipo).toLowerCase()}, non ${Grammatica.nomeCategoria(tipo).toLowerCase()}.`;
    }
    index += 1;
    punteggioEl.textContent = String(punteggio);
    showNext();
  }
});
