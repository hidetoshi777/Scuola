document.addEventListener("DOMContentLoaded", () => {
  const frase = document.getElementById("frase-demo");
  const info = document.getElementById("info-parola");
  if (!frase || !window.Grammatica) {
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
      const cat = Grammatica.categorie.find((c) => c.id === pezzo.tipo);
      if (cat && info) {
        info.innerHTML = `<strong>${cat.nome}</strong> — ${cat.breve}`;
      }
    });
    frase.append(btn);
  });
});
