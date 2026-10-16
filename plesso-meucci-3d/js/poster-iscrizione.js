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

function makeTexture(THREE, spec, maxAnisotropy) {
  if (spec.image) {
    const tex = new THREE.TextureLoader().load(spec.image);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    return { tex, canvas: null, url: spec.image };
  }
  const canvas = paint(spec.draw);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return { tex, canvas, url: '' };
}

function hang(THREE, scene, spec, maxAnisotropy) {
  const { tex, canvas, url } = makeTexture(THREE, spec, maxAnisotropy);
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
  return { ...spec, group, face, canvas, url };
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
      w: 0.78,
      h: 1.04,
      frame: 0x111111,
      image: 'img/manifesto-officina.jpg'
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
      w: 0.72,
      h: 0.96,
      frame: 0x111111,
      image: 'img/manifesto-iscriviti.jpg'
    }
  ];

  const posters = specs.map((spec) => hang(THREE, scene, spec, maxAnisotropy));
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
      const stage = overlay.root.querySelector('.poster-view-stage');
      if (stage) stage.scrollTop = 0;
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
    },
    scroll(dir, dt) {
      if (!dir) return;
      const stage = overlay.root.querySelector('.poster-view-stage');
      if (!stage) return;
      stage.scrollTop -= dir * 780 * dt;
    }
  };
}
