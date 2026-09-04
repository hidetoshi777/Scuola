document.addEventListener("DOMContentLoaded", () => {
  const frase = document.getElementById("frase-demo");
  const info = document.getElementById("info-parola");
  const legenda = document.getElementById("legenda");
  if (!window.Grammatica) {
    return;
  }

  // Legenda: ogni categoria ha un colore E un glifo, così resta
  // riconoscibile anche da chi i colori non li distingue.
  if (legenda) {
    Grammatica.categorie.forEach((cat) => {
      const li = document.createElement("li");
      li.className = `legend-item tipo-${cat.id}`;
      li.textContent = cat.nome;
      legenda.append(li);
    });
  }

  if (!frase) {
    return;
  }

  Grammatica.fraseDemo.forEach((pezzo) => {
    if (!pezzo.tipo) {
      frase.append(pezzo.testo);
      return;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `word-chip tipo-${pezzo.tipo}`;
    btn.textContent = pezzo.testo;
    btn.dataset.tipo = pezzo.tipo;
    btn.addEventListener("click", () => {
      frase.querySelectorAll(".word-chip").forEach((chip) => chip.classList.remove("is-active"));
      btn.classList.add("is-active");
      const cat = Grammatica.categoria(pezzo.tipo);
      if (cat && info) {
        info.replaceChildren();
        const nome = document.createElement("strong");
        nome.textContent = `${cat.glifo} ${cat.nome}`;
        info.append(nome, ` — ${cat.breve} ${cat.trucco}`);
      }
    });
    frase.append(btn);
  });
});
