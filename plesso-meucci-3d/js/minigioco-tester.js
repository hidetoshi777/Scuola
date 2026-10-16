/**
 * Minigioco al banco di lavoro: la prova del fusibile col tester.
 *
 *   1. Funzione  → gira la manopola su Ω 🔊 (prova di continuità)
 *   2. Puntali   → tocca i due cappucci di metallo del fusibile
 *   3. Lettura   → il tester segna OL: che cosa vuol dire?
 *   4. Cambio    → monta il fusibile nuovo
 *   5. Prova     → di nuovo i puntali: il tester suona, circuito chiuso
 *
 * Il gioco 3D riceve onMeasure dopo il passo 3 e onReplace dopo il passo 5.
 */

const STEPS = ['dial', 'probes', 'quiz', 'mount', 'verify', 'done'];

const STEP_LABEL = {
  dial: 'Passo 1 di 5 · La funzione',
  probes: 'Passo 2 di 5 · I puntali',
  quiz: 'Passo 3 di 5 · La lettura',
  mount: 'Passo 4 di 5 · Il cambio',
  verify: 'Passo 5 di 5 · La prova',
  done: 'Riparato!'
};

const DIAL = [
  {
    id: 'off',
    label: 'OFF',
    hint: 'spento',
    feedback: 'Così il tester è spento: non misura niente. Gira la manopola su una funzione.'
  },
  {
    id: 'volt',
    label: 'V~',
    hint: 'tensione',
    feedback:
      'Con V~ misuri la tensione: serve per controllare che la corrente sia davvero staccata. ' +
      'Per sapere se il fusibile è interrotto serve la prova di continuità: Ω 🔊.'
  },
  {
    id: 'amp',
    label: 'A',
    hint: 'corrente',
    feedback:
      'Con A misuri la corrente, con il circuito acceso. ' +
      'Il fusibile si prova a corrente staccata, con la continuità: Ω 🔊.'
  },
  {
    id: 'ohm',
    label: 'Ω 🔊',
    hint: 'continuità',
    feedback: 'Giusto! Ω 🔊 è la prova di continuità: se il circuito è chiuso, il tester suona.',
    correct: true
  }
];

const QUIZ = {
  domanda: 'Il tester segna OL e non suona. Che cosa vuol dire?',
  opzioni: [
    {
      testo: 'Il fusibile è interrotto: il filo dentro si è bruciato.',
      correct: true,
      feedback: 'Esatto. OL vuol dire circuito aperto: la corrente non passa. Il fusibile va cambiato.'
    },
    {
      testo: 'Il fusibile è buono: la corrente passa.',
      feedback: 'No: se la corrente passasse, il tester suonerebbe e segnerebbe un numero vicino a 0.'
    },
    {
      testo: 'Il tester è rotto.',
      feedback: 'Il tester funziona: OL vuol dire che fra i due puntali il circuito è aperto.'
    }
  ]
};

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let audioCtx = null;
function beep(ms = 420) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 2700;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.01);
    g.gain.setValueAtTime(0.08, t + ms / 1000 - 0.02);
    g.gain.linearRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.02);
  } catch (_) {
    /* niente audio: pazienza */
  }
}

export function createTesterMinigame(root) {
  root.innerHTML = '';
  const stepEl = el('div', 'tg-step');
  const istr = el('p', 'tg-istr');

  // Tester
  const tester = el('div', 'tg-tester');
  const lcd = el('div', 'tg-lcd');
  const lcdText = el('span', '', '');
  lcd.append(lcdText);
  const dial = el('div', 'tg-dial');
  const dialBtns = DIAL.map((d) => {
    const b = el('button', 'tg-dial-btn');
    b.type = 'button';
    b.dataset.id = d.id;
    b.append(el('strong', '', d.label), el('small', '', d.hint));
    dial.append(b);
    return b;
  });
  const jacks = el('div', 'tg-jacks');
  jacks.append(el('i', 'tg-jack red'), el('i', 'tg-jack black'));
  tester.append(lcd, dial, jacks);

  // Fusibile
  const fuse = el('div', 'tg-fuse');
  const capL = el('button', 'tg-cap');
  capL.type = 'button';
  capL.setAttribute('aria-label', 'Cappuccio di metallo a sinistra');
  const glass = el('button', 'tg-glass');
  glass.type = 'button';
  glass.setAttribute('aria-label', 'Vetro del fusibile');
  glass.append(el('i', 'tg-wire a'), el('i', 'tg-wire b'));
  const capR = el('button', 'tg-cap');
  capR.type = 'button';
  capR.setAttribute('aria-label', 'Cappuccio di metallo a destra');
  fuse.append(capL, glass, capR);
  const fuseLabel = el('div', 'tg-fuse-label', 'Fusibile della TV');

  const bench = el('div', 'tg-bench');
  const fuseWrap = el('div', 'tg-fuse-wrap');
  fuseWrap.append(fuse, fuseLabel);
  bench.append(tester, fuseWrap);

  const quiz = el('div', 'tg-quiz');
  const feedback = el('div', 'tg-feedback');
  feedback.setAttribute('aria-live', 'polite');
  const actions = el('div', 'tg-actions');
  const btnMain = el('button', 'primary');
  btnMain.type = 'button';
  const btnClose = el('button', '', 'Chiudi');
  btnClose.type = 'button';
  actions.append(btnMain, btnClose);

  root.append(stepEl, istr, bench, quiz, feedback, actions);

  let h = null; // handler del gioco
  let step = 'dial';
  let touched = [];

  function setFeedback(text, kind = '') {
    feedback.textContent = text || '';
    feedback.className = 'tg-feedback' + (kind ? ' ' + kind : '');
  }

  function setLcd(text, lit) {
    lcdText.textContent = text;
    lcd.classList.toggle('lit', !!lit);
  }

  function render() {
    stepEl.textContent = STEP_LABEL[step];
    const dialActive = step === 'dial';
    dialBtns.forEach((b) => {
      b.disabled = !dialActive;
      b.classList.toggle('sel', !dialActive && b.dataset.id === 'ohm');
    });
    const probing = step === 'probes' || step === 'verify';
    [capL, capR, glass].forEach((b) => { b.disabled = !probing; });
    capL.classList.toggle('red', touched[0] === capL);
    capL.classList.toggle('black', touched[1] === capL);
    capR.classList.toggle('red', touched[0] === capR);
    capR.classList.toggle('black', touched[1] === capR);
    const newFuse = step === 'verify' || step === 'done';
    fuse.classList.toggle('blown', !newFuse);
    fuseLabel.textContent = newFuse ? 'Fusibile nuovo' : 'Fusibile della TV';
    jacks.classList.toggle('on', !dialActive);

    quiz.innerHTML = '';
    btnMain.hidden = true;
    btnMain.disabled = false;

    if (step === 'dial') {
      istr.textContent = 'La corrente è staccata. Su che funzione giri la manopola per provare il fusibile?';
      setLcd('', false);
    } else if (step === 'probes') {
      istr.textContent = 'Appoggia i due puntali sui cappucci di metallo del fusibile.';
      setLcd('OL', true);
    } else if (step === 'quiz') {
      istr.textContent = QUIZ.domanda;
      setLcd('OL', true);
      shuffled(QUIZ.opzioni).forEach((o) => {
        const b = el('button', 'tg-opt', o.testo);
        b.type = 'button';
        b.addEventListener('click', () => {
          if (o.correct) {
            setFeedback(o.feedback, 'ok');
            step = 'mount';
            h && h.onMeasure && h.onMeasure();
            render();
          } else {
            b.disabled = true;
            setFeedback(o.feedback, 'ko');
          }
        });
        quiz.append(b);
      });
    } else if (step === 'mount') {
      istr.textContent = 'Il fusibile è bruciato. Toglilo e monta quello nuovo.';
      setLcd('OL', true);
      btnMain.hidden = false;
      btnMain.textContent = h && h.hasFuse ? 'Monta il fusibile nuovo' : 'Ti manca il fusibile di ricambio';
      btnMain.disabled = !(h && h.hasFuse);
    } else if (step === 'verify') {
      istr.textContent = 'Prova il fusibile nuovo: appoggia di nuovo i puntali sui cappucci.';
      setLcd('OL', true);
    } else if (step === 'done') {
      istr.textContent = 'Il tester suona e segna quasi 0: il circuito è chiuso!';
      setLcd('0.2 Ω', true);
      btnMain.hidden = false;
      btnMain.textContent = 'Fatto: torna dal Prof';
    }
    focusPlayable();
  }

  function focusPlayable() {
    const list = [...root.querySelectorAll('button')].filter((b) => !b.disabled && !b.hidden && b.offsetParent);
    if (list.length && !list.includes(document.activeElement)) list[0].focus();
  }

  dialBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const d = DIAL.find((x) => x.id === b.dataset.id);
      setLcd(d.id === 'off' ? '' : d.id === 'volt' ? '0.0 V' : d.id === 'amp' ? '0.00 A' : 'OL', d.id !== 'off');
      if (d.correct) {
        setFeedback(d.feedback, 'ok');
        step = 'probes';
        render();
      } else {
        setFeedback(d.feedback, 'ko');
      }
    });
  });

  function touchCap(cap) {
    if (touched.includes(cap)) return;
    touched.push(cap);
    if (touched.length < 2) {
      setFeedback('Bene, un puntale è appoggiato. Ora l’altro capo.', '');
      render();
      return;
    }
    if (step === 'probes') {
      setFeedback('Il tester segna OL e non suona…', '');
      step = 'quiz';
    } else {
      beep();
      setFeedback('Biiip! Il tester suona.', 'ok');
      step = 'done';
    }
    touched = [];
    render();
  }
  capL.addEventListener('click', () => touchCap(capL));
  capR.addEventListener('click', () => touchCap(capR));
  glass.addEventListener('click', () => {
    setFeedback('Quello è il vetro: i puntali vanno sui cappucci di metallo alle due estremità.', 'ko');
  });

  btnMain.addEventListener('click', () => {
    if (step === 'mount' && h && h.hasFuse) {
      step = 'verify';
      touched = [];
      setFeedback('Fusibile nuovo montato.', '');
      render();
    } else if (step === 'done') {
      h && h.onReplace && h.onReplace();
    }
  });
  btnClose.addEventListener('click', () => h && h.onClose && h.onClose());

  return {
    /** handlers: { hasTester, hasFuse, measured, replaced, onMeasure, onReplace, onClose } */
    open(handlers) {
      h = handlers;
      touched = [];
      setFeedback('');
      if (!handlers.hasTester) {
        step = 'dial';
        render();
        istr.textContent = 'Serve il tester: lo trovi sul banco vicino alle finestre.';
        dialBtns.forEach((b) => { b.disabled = true; });
        return;
      }
      step = handlers.replaced ? 'done' : handlers.measured ? 'mount' : 'dial';
      render();
    },
    close() {
      h = null;
    }
  };
}
