/**
 * Minigioco al banco di lavoro: rifare la spina della TV.
 *
 *   1. Causa   → perché è saltato il fusibile? (fase e neutro si toccavano)
 *   2. Fili    → tocca un filo, poi il suo morsetto: marrone L, blu N, giallo-verde ⏚
 *   3. Viti    → stringi le tre viti e il fermacavo
 *   4. Prova   → tester fra gli spinotti L e N, cavo staccato dalla TV: OL
 *
 * Il gioco 3D riceve onDone alla fine.
 */

const STEP_LABEL = {
  causa: 'Passo 1 di 4 · La causa',
  fili: 'Passo 2 di 4 · I fili',
  viti: 'Passo 3 di 4 · Viti e fermacavo',
  prova: 'Passo 4 di 4 · La prova',
  fatto: 'Spina rifatta!'
};

const CAUSA = {
  domanda: 'Nella spina vecchia il marrone e il blu sono bruciati e si toccano. Perché è saltato il fusibile?',
  opzioni: [
    {
      testo: 'Fase e neutro si toccavano: cortocircuito.',
      correct: true,
      feedback: 'Esatto: nel cortocircuito passa troppa corrente e il fusibile salta per proteggere l’impianto.'
    },
    {
      testo: 'Mancava il filo di terra.',
      feedback:
        'No: la terra protegge le persone se un guasto mette in tensione la carcassa. Qui invece si toccavano fase e neutro: cortocircuito.'
    },
    {
      testo: 'Il fusibile era troppo grande.',
      feedback: 'No: un fusibile troppo grande non salta, anzi è pericoloso. Qui i fili si toccavano: cortocircuito.'
    }
  ]
};

const FILI = [
  { id: 'marrone', label: 'Marrone', ruolo: 'fase', morsetto: 'L' },
  { id: 'blu', label: 'Blu', ruolo: 'neutro', morsetto: 'N' },
  { id: 'gv', label: 'Giallo-verde', ruolo: 'terra', morsetto: 'PE' }
];

const MORSETTI = [
  { id: 'L', label: 'L', sotto: 'fase' },
  { id: 'PE', label: '⏚', sotto: 'terra' },
  { id: 'N', label: 'N', sotto: 'neutro' }
];

const ERRORE_FILO = {
  marrone: 'Il marrone è la fase: va sul morsetto L.',
  blu: 'Il blu è il neutro: va sul morsetto N.',
  gv: 'Il giallo-verde è sempre la terra: in questa spina va al morsetto centrale ⏚.'
};

const PROVA = {
  domanda:
    'Spina rifatta e cavo staccato dalla TV. Metti i puntali sugli spinotti L e N, in prova di continuità. Che cosa deve segnare il tester?',
  opzioni: [
    {
      testo: 'OL: fase e neutro non si toccano più.',
      correct: true,
      feedback: 'Giusto: niente più cortocircuito. Ora si può ridare corrente.'
    },
    {
      testo: 'Quasi 0 Ω e suona.',
      feedback: 'No: vorrebbe dire che fase e neutro si toccano ancora. Il fusibile salterebbe di nuovo.'
    },
    {
      testo: '230 V.',
      feedback: 'No: la spina non è nella presa e il tester è in continuità. Qui si controlla solo che i fili non si tocchino.'
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

export function createPlugMinigame(root) {
  root.innerHTML = '';
  const stepEl = el('div', 'tg-step');
  const istr = el('p', 'tg-istr');

  // Spina vista da dentro: tre morsetti in fila, fermacavo, cavo con tre fili
  const plug = el('div', 'sp-plug');
  const terminals = el('div', 'sp-terminals');
  const termBtns = MORSETTI.map((m) => {
    const b = el('button', 'sp-term');
    b.type = 'button';
    b.dataset.id = m.id;
    const screw = el('i', 'sp-screw');
    b.append(screw, el('strong', '', m.label), el('small', '', m.sotto));
    terminals.append(b);
    return b;
  });
  const clamp = el('button', 'sp-clamp', 'fermacavo');
  clamp.type = 'button';
  const burn = el('div', 'sp-burn', 'fili bruciati');
  plug.append(terminals, burn, clamp);

  const wires = el('div', 'sp-wires');
  const wireBtns = shuffled(FILI).map((f) => {
    const b = el('button', 'sp-wire sp-' + f.id);
    b.type = 'button';
    b.dataset.id = f.id;
    b.append(el('i', 'sp-swatch'), el('span', '', f.label));
    wires.append(b);
    return b;
  });

  const quiz = el('div', 'tg-quiz');
  const feedback = el('div', 'tg-feedback');
  feedback.setAttribute('aria-live', 'polite');
  const actions = el('div', 'tg-actions');
  const btnMain = el('button', 'primary');
  btnMain.type = 'button';
  const btnClose = el('button', '', 'Chiudi');
  btnClose.type = 'button';
  actions.append(btnMain, btnClose);

  root.append(stepEl, istr, plug, wires, quiz, feedback, actions);

  let h = null;
  let step = 'causa';
  let selected = null;           // filo scelto, in attesa del morsetto
  const placed = {};             // morsetto → filo
  const tight = new Set();       // viti strette + 'clamp'

  function setFeedback(text, kind = '') {
    feedback.textContent = text || '';
    feedback.className = 'tg-feedback' + (kind ? ' ' + kind : '');
  }

  function renderQuiz(q, onRight) {
    istr.textContent = q.domanda;
    shuffled(q.opzioni).forEach((o) => {
      const b = el('button', 'tg-opt', o.testo);
      b.type = 'button';
      b.addEventListener('click', () => {
        if (o.correct) {
          setFeedback(o.feedback, 'ok');
          onRight();
        } else {
          b.disabled = true;
          setFeedback(o.feedback, 'ko');
        }
      });
      quiz.append(b);
    });
  }

  function render() {
    stepEl.textContent = STEP_LABEL[step];
    quiz.innerHTML = '';
    btnMain.hidden = true;
    plug.classList.toggle('burnt', step === 'causa');
    burn.hidden = step !== 'causa';
    wires.hidden = step !== 'fili';

    termBtns.forEach((b) => {
      const id = b.dataset.id;
      const filo = placed[id];
      b.className = 'sp-term' + (filo ? ' has-' + filo : '') + (tight.has(id) ? ' tight' : '');
      b.disabled = !(step === 'fili' && !filo) && !(step === 'viti' && !tight.has(id));
    });
    clamp.className = 'sp-clamp' + (tight.has('clamp') ? ' tight' : '');
    clamp.disabled = !(step === 'viti' && !tight.has('clamp'));
    wireBtns.forEach((b) => {
      const usato = Object.values(placed).includes(b.dataset.id);
      b.hidden = usato;
      b.classList.toggle('sel', selected === b.dataset.id);
    });

    if (step === 'causa') {
      renderQuiz(CAUSA, () => { step = 'fili'; render(); });
    } else if (step === 'fili') {
      istr.textContent = selected
        ? 'Ora tocca il morsetto giusto per questo filo.'
        : 'Spina nuova: tocca un filo, poi il morsetto dove va collegato.';
    } else if (step === 'viti') {
      istr.textContent = 'Stringi le tre viti dei morsetti e il fermacavo.';
    } else if (step === 'prova') {
      renderQuiz(PROVA, () => { step = 'fatto'; render(); });
    } else if (step === 'fatto') {
      istr.textContent = 'Spina rifatta: marrone su L, blu su N, giallo-verde sulla terra, tutto stretto.';
      btnMain.hidden = false;
      btnMain.textContent = 'Fatto: torna dal Prof';
    }
    focusPlayable();
  }

  function focusPlayable() {
    const list = [...root.querySelectorAll('button')].filter((b) => !b.disabled && !b.hidden && b.offsetParent);
    if (!list.length || list.includes(document.activeElement)) return;
    const filo = step === 'fili' && !selected ? list.find((b) => b.classList.contains('sp-wire')) : null;
    (filo || list[0]).focus();
  }

  wireBtns.forEach((b) => {
    b.addEventListener('click', () => {
      selected = b.dataset.id;
      setFeedback('');
      render();
      // con tastiera e pad il fuoco passa al primo morsetto libero
      const libero = termBtns.find((t) => !t.disabled);
      if (libero && document.activeElement === b) libero.focus();
    });
  });

  termBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      if (step === 'fili') {
        if (!selected) {
          setFeedback('Prima scegli un filo, poi il suo morsetto.', 'ko');
          return;
        }
        const filo = FILI.find((f) => f.id === selected);
        if (filo.morsetto !== id) {
          setFeedback(ERRORE_FILO[filo.id], 'ko');
          selected = null;
          render();
          return;
        }
        placed[id] = filo.id;
        selected = null;
        setFeedback(`${filo.label} sulla ${filo.ruolo}: giusto.`, 'ok');
        if (Object.keys(placed).length === FILI.length) step = 'viti';
        render();
      } else if (step === 'viti') {
        tight.add(id);
        setFeedback('Vite stretta: il filo non si sfila.', 'ok');
        if (tight.size === 4) step = 'prova';
        render();
      }
    });
  });

  clamp.addEventListener('click', () => {
    if (step !== 'viti') return;
    tight.add('clamp');
    setFeedback('Il fermacavo stringe la guaina: se tiri il cavo, i fili non si staccano dai morsetti.', 'ok');
    if (tight.size === 4) step = 'prova';
    render();
  });

  btnMain.addEventListener('click', () => {
    if (step === 'fatto' && h && h.onDone) h.onDone();
  });
  btnClose.addEventListener('click', () => h && h.onClose && h.onClose());

  return {
    /** handlers: { done, onDone, onClose } */
    open(handlers) {
      h = handlers;
      selected = null;
      setFeedback('');
      if (handlers.done) {
        step = 'fatto';
      } else if (step === 'fatto') {
        // nuova partita: si riparte da capo
        step = 'causa';
        Object.keys(placed).forEach((k) => delete placed[k]);
        tight.clear();
      }
      render();
    },
    reset() {
      step = 'causa';
      selected = null;
      Object.keys(placed).forEach((k) => delete placed[k]);
      tight.clear();
    },
    close() {
      h = null;
    }
  };
}
