(function () {
  const data = window.MazziniData;
  if (!data || !data.battles || data.battles.length < 2) return;

  const els = {
    intro: document.getElementById("battle-intro"),
    between: document.getElementById("battle-between"),
    end: document.getElementById("battle-end"),
    stageWrap: document.getElementById("battle-stage-wrap"),
    stage: document.getElementById("battle-stage"),
    enemyImg: document.getElementById("enemy-sprite"),
    heroImg: document.getElementById("hero-sprite"),
    enemyName: document.getElementById("enemy-name"),
    enemyHpBar: document.getElementById("enemy-hp-bar"),
    enemyHpText: document.getElementById("enemy-hp-text"),
    heroHpBar: document.getElementById("hero-hp-bar"),
    heroHpText: document.getElementById("hero-hp-text"),
    log: document.getElementById("battle-log"),
    menu: document.getElementById("battle-menu"),
    quiz: document.getElementById("battle-quiz"),
    quizTitle: document.getElementById("quiz-title"),
    quizOpts: document.getElementById("quiz-opts"),
    hint: document.getElementById("battle-hint"),
    startBtn: document.getElementById("battle-start"),
    nextBtn: document.getElementById("battle-next"),
    scoreLine: document.getElementById("score-line"),
    btnAttack: document.getElementById("cmd-attacca"),
    btnIdea: document.getElementById("cmd-idea"),
    btnDefend: document.getElementById("cmd-difendi"),
    btnStudy: document.getElementById("cmd-studia"),
  };

  const HERO_MAX = 100;
  const ATK_DMG = 22;
  const IDEA_DMG = 36;

  const state = {
    battleIndex: 0,
    heroHp: HERO_MAX,
    enemyHp: 0,
    defending: false,
    busy: false,
    correct: 0,
    asked: 0,
    usedEasy: {},
    usedIdea: {},
  };

  function currentBattle() {
    return data.battles[state.battleIndex];
  }

  function setLog(text) {
    if (els.log) els.log.innerHTML = `<p>${text}</p>`;
  }

  function showOnly(panel) {
    [els.intro, els.between, els.end, els.stageWrap].forEach((el) => {
      if (!el) return;
      const on = el === panel;
      el.hidden = !on;
      if (el === els.stageWrap) el.classList.toggle("is-active", on);
    });
  }

  function setMenuEnabled(on) {
    [els.btnAttack, els.btnIdea, els.btnDefend, els.btnStudy].forEach((btn) => {
      if (btn) btn.disabled = !on || state.busy;
    });
  }

  function syncHp() {
    const b = currentBattle();
    const heroPct = Math.max(0, state.heroHp / HERO_MAX);
    const enemyPct = Math.max(0, state.enemyHp / b.hpMax);
    if (els.heroHpBar) {
      els.heroHpBar.style.transform = `scaleX(${heroPct})`;
      els.heroHpBar.parentElement.classList.toggle("is-low", heroPct <= 0.35);
    }
    if (els.enemyHpBar) {
      els.enemyHpBar.style.transform = `scaleX(${enemyPct})`;
      els.enemyHpBar.parentElement.classList.toggle("is-low", enemyPct <= 0.35);
    }
    if (els.heroHpText) els.heroHpText.textContent = `${Math.max(0, state.heroHp)} / ${HERO_MAX}`;
    if (els.enemyHpText) els.enemyHpText.textContent = `${Math.max(0, state.enemyHp)} / ${b.hpMax}`;
  }

  function flash(actor, cls) {
    const el = actor === "hero" ? els.heroImg?.closest(".battle-actor") : els.enemyImg?.closest(".battle-actor");
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), 360);
  }

  function pickQuestion(pool, usedKey) {
    const used = state[usedKey];
    let available = pool.map((_, i) => i).filter((i) => !used[i]);
    if (!available.length) {
      Object.keys(used).forEach((k) => delete used[k]);
      available = pool.map((_, i) => i);
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    used[idx] = true;
    return pool[idx];
  }

  function closeQuiz() {
    if (els.quiz) els.quiz.classList.remove("is-open");
    if (els.quizOpts) els.quizOpts.innerHTML = "";
  }

  function openQuiz(mode) {
    const b = currentBattle();
    const hard = mode === "idea";
    const q = pickQuestion(hard ? b.domandeIdee : b.domandeFacili, hard ? "usedIdea" : "usedEasy");
    state.busy = true;
    setMenuEnabled(false);
    if (els.hint) els.hint.classList.remove("is-open");
    if (els.quizTitle) {
      els.quizTitle.textContent = hard ? `Idea — ${q.q}` : `Attacca — ${q.q}`;
    }
    if (els.quizOpts) {
      els.quizOpts.innerHTML = "";
      const opts = window.mescola ? window.mescola(q.opzioni) : q.opzioni;
      opts.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = opt.t;
        btn.addEventListener("click", () => resolveAttack(opt.ok, hard ? IDEA_DMG : ATK_DMG, q.spiegazione));
        els.quizOpts.appendChild(btn);
      });
    }
    if (els.quiz) els.quiz.classList.add("is-open");
  }

  function resolveAttack(ok, dmg, spiegazione) {
    closeQuiz();
    state.asked += 1;
    const b = currentBattle();
    if (ok) {
      state.correct += 1;
      state.enemyHp = Math.max(0, state.enemyHp - dmg);
      flash("hero", "is-attack");
      flash("enemy", "is-hit");
      syncHp();
      setLog(`Colpito! ${spiegazione} (−${dmg} PF a ${b.nome})`);
      if (window.AudioUi) window.AudioUi.beep("ok");
      window.setTimeout(() => {
        if (state.enemyHp <= 0) onVictory();
        else enemyTurn();
      }, 700);
    } else {
      setLog(`Mancato… ${spiegazione}`);
      if (window.AudioUi) window.AudioUi.beep("err");
      window.setTimeout(() => enemyTurn(), 650);
    }
  }

  function enemyTurn() {
    const b = currentBattle();
    const atk = b.attacchi[Math.floor(Math.random() * b.attacchi.length)];
    let dmg = atk.danno;
    if (state.defending) {
      dmg = Math.max(4, Math.round(dmg * 0.45));
      state.defending = false;
    }
    state.heroHp = Math.max(0, state.heroHp - dmg);
    flash("enemy", "is-attack");
    flash("hero", "is-hit");
    syncHp();
    setLog(`${b.nome} usa ${atk.nome}! ${atk.testo} (−${dmg} PF)`);
    if (window.AudioUi) window.AudioUi.beep("hit");
    window.setTimeout(() => {
      if (state.heroHp <= 0) onDefeat();
      else {
        state.busy = false;
        setMenuEnabled(true);
        setLog(`Tocca a te. Contro ${b.nome}: Attacca, Idea, Difendi o Studia.`);
      }
    }, 750);
  }

  function onVictory() {
    state.busy = true;
    setMenuEnabled(false);
    closeQuiz();
    if (state.battleIndex === 0) {
      setLog("Metternich cade sotto le idee della Giovane Italia!");
      if (window.AudioUi) window.AudioUi.beep("win");
      window.setTimeout(() => {
        showOnly(els.between);
      }, 900);
    } else {
      setLog("Radetzky è respinto: la tenacia mazziniana tiene duro!");
      if (window.AudioUi) window.AudioUi.beep("win");
      window.setTimeout(() => finishCampaign(), 900);
    }
  }

  function onDefeat() {
    state.busy = true;
    setMenuEnabled(false);
    setLog("Sconfitta… ma Mazzini non si arrende. Ricarica e riprova.");
    if (els.end && els.scoreLine) {
      els.scoreLine.textContent = `Risposte corrette: ${state.correct} / ${state.asked}`;
      const title = els.end.querySelector("h2");
      if (title) title.textContent = "Ritirata tattica";
      const lead = els.end.querySelector("[data-end-lead]");
      if (lead) {
        lead.textContent =
          "I PF sono finiti. Rivedi lo studio o il fumetto, poi riparti da Metternich.";
      }
      showOnly(els.end);
    }
  }

  function finishCampaign() {
    if (els.scoreLine) {
      els.scoreLine.textContent = `Risposte corrette: ${state.correct} / ${state.asked}`;
    }
    const title = els.end?.querySelector("h2");
    if (title) title.textContent = "Vittoria · Dio e il Popolo";
    const lead = els.end?.querySelector("[data-end-lead]");
    if (lead) {
      lead.textContent =
        "Hai affrontato Metternich (Restaurazione) e Radetzky (Lombardo-Veneto). Ogni attacco era una verifica sul Risorgimento.";
    }
    showOnly(els.end);
  }

  function startBattle(index) {
    state.battleIndex = index;
    state.heroHp = HERO_MAX;
    state.enemyHp = currentBattle().hpMax;
    state.defending = false;
    state.busy = false;
    state.usedEasy = {};
    state.usedIdea = {};
    closeQuiz();
    if (els.hint) els.hint.classList.remove("is-open");

    const b = currentBattle();
    if (els.stage) els.stage.style.backgroundImage = `url("${b.bg}")`;
    if (els.enemyImg) {
      els.enemyImg.src = b.sprite;
      els.enemyImg.alt = b.nome;
    }
    if (els.enemyName) els.enemyName.textContent = b.nome;
    syncHp();
    showOnly(els.stageWrap);
    setMenuEnabled(true);
    setLog(`Battaglia ${index + 1}/2: ${b.nome} — ${b.ruolo}. Scegli un comando.`);
  }

  function cmdDefend() {
    if (state.busy) return;
    state.busy = true;
    setMenuEnabled(false);
    state.defending = true;
    setLog("Difendi: ti prepari. Il prossimo colpo nemico farà meno danni.");
    if (window.AudioUi) window.AudioUi.beep("page");
    window.setTimeout(() => enemyTurn(), 600);
  }

  function cmdStudy() {
    if (state.busy) return;
    state.busy = true;
    setMenuEnabled(false);
    const b = currentBattle();
    if (els.hint) {
      els.hint.textContent = b.hint;
      els.hint.classList.add("is-open");
    }
    setLog("Studia: rileggi il punto chiave… poi il nemico agisce.");
    if (window.AudioUi) window.AudioUi.beep("page");
    window.setTimeout(() => enemyTurn(), 1100);
  }

  if (els.startBtn) {
    els.startBtn.addEventListener("click", () => {
      state.correct = 0;
      state.asked = 0;
      startBattle(0);
    });
  }

  if (els.nextBtn) {
    els.nextBtn.addEventListener("click", () => startBattle(1));
  }

  if (els.btnAttack) els.btnAttack.addEventListener("click", () => openQuiz("attacca"));
  if (els.btnIdea) els.btnIdea.addEventListener("click", () => openQuiz("idea"));
  if (els.btnDefend) els.btnDefend.addEventListener("click", cmdDefend);
  if (els.btnStudy) els.btnStudy.addEventListener("click", cmdStudy);

  const retry = document.getElementById("battle-retry");
  if (retry) {
    retry.addEventListener("click", () => {
      state.correct = 0;
      state.asked = 0;
      showOnly(els.intro);
      els.intro.hidden = false;
    });
  }

  showOnly(els.intro);
})();
