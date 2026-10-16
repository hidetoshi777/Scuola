/**
 * Tre manifesti del professionale AM (Manutenzione e assistenza tecnica):
 * uno nell'atrio, due sul muro in fondo all'aula. Il pulsante «Ingrandisci» li apre a tutto schermo.
 *
 * Ore: monte ore nazionale dei nuovi istituti professionali (32 ore a settimana, 33 settimane).
 * Biennio: area generale 18 + area di indirizzo 14. Triennio: 14 + 18.
 */

const FONT = '"Segoe UI", Roboto, Arial, sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function font(ctx, px, weight) {
  ctx.font = `${weight} ${px}px ${FONT}`;
}

function paint(draw) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1620;
  const ctx = canvas.getContext('2d');
  draw(ctx, canvas.width, canvas.height);
  return canvas;
}

function drawIscriviti(ctx, w, h) {
  ctx.fillStyle = '#0c1424';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 28, h);

  ctx.fillStyle = '#94a3b8';
  font(ctx, 34, 700);
  ctx.textAlign = 'left';
  ctx.fillText('IIS GALILEO FERRARIS', 72, 110);
  ctx.fillStyle = '#e2e8f0';
  font(ctx, 40, 700);
  ctx.fillText('PLESSO MEUCCI  ·  ACIREALE', 72, 168);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(72, 210);
  ctx.lineTo(w - 72, 210);
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  font(ctx, 132, 800);
  ctx.fillText('ISCRIVITI', 72, 390);
  ctx.fillStyle = '#f8fafc';
  font(ctx, 52, 700);
  ctx.fillText('al professionale', 76, 470);

  font(ctx, 64, 800);
  ctx.fillText('Manutenzione', 72, 600);
  ctx.fillText('e assistenza', 72, 678);
  ctx.fillText('tecnica', 72, 756);

  const chips = ['Elettricità', 'Meccanica', 'Impianti'];
  let x = 72;
  chips.forEach((label) => {
    font(ctx, 32, 700);
    const tw = ctx.measureText(label).width;
    roundRect(ctx, x, 820, tw + 48, 64, 12);
    ctx.fillStyle = '#172033';
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.fillText(label, x + 24, 862);
    x += tw + 68;
  });

  ctx.fillStyle = '#111c33';
  ctx.fillRect(28, 980, w - 28, h - 980);
  ctx.fillStyle = '#f8fafc';
  font(ctx, 48, 800);
  ctx.fillText('5 anni  ·  diploma', 72, 1070);
  font(ctx, 36, 600);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Si lavora in laboratorio:', 72, 1160);
  ctx.fillText('corrente, macchine, impianti.', 72, 1216);
  ctx.fillStyle = '#fbbf24';
  font(ctx, 40, 800);
  ctx.fillText('Via Galvani 5', 72, 1340);
  ctx.fillStyle = '#e2e8f0';
  font(ctx, 32, 600);
  ctx.fillText('Iscrizione online  ·  095 6136030', 72, 1400);
  ctx.fillStyle = '#64748b';
  font(ctx, 22, 500);
  ctx.fillText('Realizzato dal Prof. Rossano Bella', 72, 1540);
}

function drawLaboratorio(ctx, w, h) {
  ctx.fillStyle = '#10241f';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#5eead4';
  font(ctx, 32, 700);
  ctx.textAlign = 'left';
  ctx.fillText('CORSO AM  ·  PLESSO MEUCCI', 64, 100);
  ctx.fillStyle = '#f8fafc';
  font(ctx, 92, 800);
  ctx.fillText('IN OFFICINA', 64, 230);
  font(ctx, 44, 600);
  ctx.fillStyle = '#99f6e4';
  ctx.fillText('Si impara sulle cose vere.', 64, 300);

  const rows = [
    ['ELETTRICITÀ', 'Impianti, quadri, sicurezza'],
    ['ELETTRONICA', 'Circuiti e componenti'],
    ['MECCANICA', 'Macchine e officina'],
    ['IMPIANTI', 'Montaggio e collaudo']
  ];
  rows.forEach((row, i) => {
    const y = 380 + i * 250;
    ctx.fillStyle = i % 2 === 0 ? '#134e4a' : '#1c1917';
    roundRect(ctx, 48, y, w - 96, 220, 18);
    ctx.fill();
    ctx.fillStyle = i % 2 === 0 ? '#fef3c7' : '#fde68a';
    ctx.fillRect(48, y, 16, 220);
    ctx.fillStyle = '#f8fafc';
    font(ctx, 64, 800);
    ctx.fillText(row[0], 96, y + 100);
    ctx.fillStyle = '#99f6e4';
    font(ctx, 32, 600);
    ctx.fillText(row[1], 96, y + 160);
  });

  ctx.fillStyle = '#5eead4';
  font(ctx, 28, 700);
  ctx.fillText('Manutenzione e assistenza tecnica', 64, 1460);
  ctx.fillStyle = '#64748b';
  font(ctx, 22, 500);
  ctx.fillText('Realizzato dal Prof. Rossano Bella', 64, 1548);
}

function drawOrario(ctx, w, h) {
  ctx.fillStyle = '#f6f1e7';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, w, 18);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#78716c';
  font(ctx, 30, 700);
  ctx.fillText('PLESSO MEUCCI  ·  CORSO AM', 64, 90);
  ctx.fillStyle = '#1c1917';
  font(ctx, 42, 700);
  ctx.fillText('Ore del corso', 64, 155);

  ctx.fillStyle = '#b45309';
  font(ctx, 188, 800);
  ctx.fillText('32', 64, 400);
  ctx.fillStyle = '#1c1917';
  font(ctx, 46, 800);
  ctx.fillText('ore a settimana', 390, 300);
  ctx.fillStyle = '#44403c';
  font(ctx, 34, 600);
  ctx.fillText('per 5 anni', 390, 356);
  ctx.fillText('1.056 ore l’anno', 390, 408);

  const blocks = [
    {
      title: '1° e 2° anno',
      rows: [
        ['Italiano', '4'],
        ['Inglese', '3'],
        ['Storia, geografia e diritto', '4'],
        ['Matematica', '4'],
        ['Scienze motorie', '2'],
        ['Religione o alternativa', '1'],
        ['Laboratorio e tecniche', '14']
      ]
    },
    {
      title: '3°, 4° e 5° anno',
      rows: [
        ['Italiano', '4'],
        ['Inglese', '2'],
        ['Storia', '2'],
        ['Matematica', '3'],
        ['Scienze motorie', '2'],
        ['Religione o alternativa', '1'],
        ['Officina e laboratorio', '18']
      ]
    }
  ];

  let y = 470;
  blocks.forEach((block) => {
    ctx.fillStyle = '#1c1917';
    roundRect(ctx, 48, y, w - 96, 56, 8);
    ctx.fill();
    ctx.fillStyle = '#faf7f2';
    font(ctx, 30, 800);
    ctx.fillText(block.title, 72, y + 38);
    y += 56;
    block.rows.forEach((row, i) => {
      const rh = 62;
      ctx.fillStyle = i % 2 === 0 ? '#efe8da' : '#f6f1e7';
      ctx.fillRect(48, y, w - 96, rh);
      ctx.fillStyle = '#1c1917';
      font(ctx, 30, 600);
      ctx.textAlign = 'left';
      ctx.fillText(row[0], 72, y + 40);
      font(ctx, 32, 800);
      ctx.textAlign = 'right';
      ctx.fillText(row[1], w - 72, y + 41);
      y += rh;
    });
    y += 28;
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = '#57534e';
  font(ctx, 22, 500);
  ctx.fillText('Quadro nazionale dell’indirizzo. In laboratorio: elettricità,', 64, 1520);
  ctx.fillText('elettronica, meccanica e impianti.  ·  Prof. Rossano Bella', 64, 1556);
}

function hang(THREE, scene, spec, canvas, maxAnisotropy) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  const group = new THREE.Group();
  group.position.set(spec.x, spec.y, spec.z);
  group.rotation.y = spec.rotY;
  group.name = `Poster_${spec.id}`;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(spec.w + 0.045, spec.h + 0.045, 0.02),
    new THREE.MeshStandardMaterial({ color: spec.frame, roughness: 0.72 })
  );
  frame.position.z = -0.012;
  frame.castShadow = true;

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.w, spec.h),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  face.position.z = 0.004;
  face.userData.posterId = spec.id;
  face.name = `PosterFace_${spec.id}`;

  group.add(frame, face);
  scene.add(group);
  return { ...spec, group, face, canvas, url: '' };
}

function buildOverlay(posters, api) {
  const root = document.createElement('div');
  root.className = 'poster-view';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="poster-view-sheet" role="dialog" aria-modal="true" aria-labelledby="poster-view-title">
      <div class="poster-view-bar">
        <h2 id="poster-view-title"></h2>
        <button type="button" class="poster-view-close">Chiudi</button>
      </div>
      <div class="poster-view-stage">
        <img alt="" />
      </div>
      <div class="poster-view-nav">
        <button type="button" data-dir="-1">Manifesto prima</button>
        <button type="button" data-dir="1">Manifesto dopo</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const title = root.querySelector('#poster-view-title');
  const img = root.querySelector('img');
  const closeBtn = root.querySelector('.poster-view-close');

  closeBtn.addEventListener('click', () => api.close());
  root.addEventListener('click', (e) => {
    if (e.target === root) api.close();
  });
  root.querySelectorAll('[data-dir]').forEach((btn) => {
    btn.addEventListener('click', () => api.step(Number(btn.dataset.dir)));
  });

  return {
    root,
    show(poster) {
      if (!poster.url) poster.url = poster.canvas.toDataURL('image/jpeg', 0.92);
      title.textContent = poster.title;
      img.src = poster.url;
      img.alt = poster.title;
      root.classList.add('open');
      root.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
    },
    hide() {
      root.classList.remove('open');
      root.setAttribute('aria-hidden', 'true');
    }
  };
}

export function createEnrollmentPosters({ THREE, scene, maxAnisotropy = 8 }) {
  // Coordinate già in three (Y su). Muro fondo aula: faccia interna z ≈ 1.10.
  // Parete atrio verso la 3 AM: faccia x ≈ −3.90, accanto alla porta.
  const specs = [
    {
      id: 'laboratorio',
      title: 'In officina',
      place: 'aula',
      x: -6.15,
      y: 1.5,
      z: 1.072,
      rotY: Math.PI,
      w: 0.74,
      h: 1.05,
      frame: 0x14532d,
      draw: drawLaboratorio
    },
    {
      id: 'orario',
      title: 'Ore del corso',
      place: 'aula',
      x: -8.55,
      y: 1.5,
      z: 1.072,
      rotY: Math.PI,
      w: 0.74,
      h: 1.05,
      frame: 0x44403c,
      draw: drawOrario
    },
    {
      id: 'iscriviti',
      title: 'Iscrizioni',
      place: 'atrio',
      x: -3.868,
      y: 1.5,
      z: -2.22,
      rotY: Math.PI / 2,
      w: 0.68,
      h: 1.02,
      frame: 0x1c1917,
      draw: drawIscriviti
    }
  ];

  const posters = specs.map((spec) => hang(THREE, scene, spec, paint(spec.draw), maxAnisotropy));
  const byId = Object.fromEntries(posters.map((p) => [p.id, p]));
  let openId = null;
  const api = {
    close() {
      openId = null;
      overlay.hide();
    },
    step(dir) {
      if (!openId) return;
      const i = posters.findIndex((p) => p.id === openId);
      const next = posters[(i + dir + posters.length) % posters.length];
      api.open(next.id);
    },
    open(id) {
      const poster = byId[id];
      if (!poster) return;
      openId = id;
      overlay.show(poster);
    }
  };
  const overlay = buildOverlay(posters, api);

  function facing(p, camPos) {
    // Il muro è sottile: dalla parte sbagliata il manifesto è a un metro, ma non va aperto.
    if (p.place === 'aula') return camPos.z < p.z - 0.2;
    return camPos.x > p.x + 0.15;
  }

  function nearest(camPos) {
    let best = null;
    let bestDist = 1.75;
    posters.forEach((p) => {
      if (!p.group.visible) return;
      if (!facing(p, camPos)) return;
      const dist = camPos.distanceTo(p.group.position);
      if (dist >= bestDist) return;
      best = { id: p.id, title: p.title, dist };
      bestDist = dist;
    });
    return best;
  }

  return {
    nearest,
    open: api.open,
    close: api.close,
    step: api.step,
    isOpen: () => openId !== null,
    pickables: () => posters.map((p) => p.face),
    setClassroomWall(visible) {
      posters.forEach((p) => {
        if (p.place === 'aula') p.group.visible = visible;
      });
    }
  };
}
