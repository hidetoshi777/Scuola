/* Calendar totals are derived from dates, never from animation or browser visits. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const DAY = 86400000, KEY = 'meucci-gps-calendar-v1';
  const defaults = { initial: 1100, start: '2026-10-12', end: '2027-06-09' };
  const fmt = n => new Intl.NumberFormat('it-IT').format(n);
  const ordinal = s => Date.parse(s + 'T00:00:00Z') / DAY;
  const iso = day => new Date(day * DAY).toISOString().slice(0, 10);
  const shortDate = day => new Intl.DateTimeFormat('it-IT', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(day * DAY));
  function todayDay() {
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const p = Object.fromEntries(parts.map(v => [v.type,v.value]));
    return ordinal(`${p.year}-${p.month}-${p.day}`);
  }
  function valid(c) {
    return c && Number.isInteger(c.initial) && c.initial >= 1 && c.initial <= 20000 &&
      /^\d{4}-\d{2}-\d{2}$/.test(c.start) && /^\d{4}-\d{2}-\d{2}$/.test(c.end) &&
      Number.isFinite(ordinal(c.start)) && Number.isFinite(ordinal(c.end)) && ordinal(c.end) > ordinal(c.start) && ordinal(c.end)-ordinal(c.start) <= 3660;
  }
  let config = {...defaults};
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (valid(saved)) config = saved; } catch (_) { /* Private mode can disable storage. */ }
  let start, end, span, viewDay, preview = false, paused = false, animation = null;
  let target = 0, visual = 0, time = 0, last = 0, accumulator = 0, tool = 'stamp', toolFlash = 0;
  let people = [], flights = [], confetti = [], pile = [], lastToast = -10;
  const canvas = $('world'), ctx = canvas.getContext('2d');
  let W = 1000, H = 660;
  const colors = ['#d9f482','#ef9aad','#94c9ed','#c6a5ec','#eeb879','#89d3bf'];
  const quips = {stamp:['TIMBRATO!','Manca solo il modulo del modulo.','Pratica archiviata. Nel vetro.'],trap:['Scorrimento… verticale!','Convocazione al piano di sotto.','Il posto fisso? In fondo al barattolo.'],spring:['Trasferimento d’ufficio!','Titoli di studio: volo libero.','Supplenza con rimbalzo.']};
  function totals(day) {
    const elapsed = Math.max(0, Math.min(span, day - start));
    const collected = Math.floor(config.initial * elapsed / span);
    return {collected, remaining:config.initial-collected, days:Math.max(0,end-day)};
  }
  function toast(message) { $('toast').textContent = message; lastToast = time; }
  function setup() {
    start = ordinal(config.start); end = ordinal(config.end); span = end-start;
    $('initial').value = config.initial; $('start').value = config.start; $('end').value = config.end;
    document.querySelector('h1 span').textContent = config.initial;
    $('future').max = span; $('start-label').textContent = shortDate(start); $('end-label').textContent = shortDate(end);
    preview = false; animation = null; viewDay = todayDay(); people = []; flights = []; confetti = []; pile = [];
    target = visual = totals(viewDay).collected;
    rebuildPile(); update();
  }
  function update() {
    const t = totals(viewDay), prev = totals(viewDay-1);
    target = t.collected;
    $('remaining').textContent = fmt(t.remaining); $('collected').textContent = fmt(t.collected); $('days').textContent = fmt(t.days);
    $('mode').textContent = preview ? '◷ ANTEPRIMA DEL FUTURO' : '● CALENDARIO REALE';
    $('mode').style.color = preview ? '#ef9aad' : '#d9f482';
    $('date-label').textContent = shortDate(viewDay); $('date-label').dateTime = iso(viewDay);
    $('future').value = Math.max(0,Math.min(span,viewDay-start));
    $('preview-label').textContent = preview ? shortDate(viewDay) : 'oppure prova una trappola';
    $('quota').textContent = t.remaining === 0 ? 'Fila esaurita. Buone vacanze, Prof!' : `In questa giornata: ${fmt(t.collected-prev.collected)} nel barattolo`;
    $('calendar-note').textContent = preview ? 'Stai giocando con una data futura. “Torna a oggi” ripristina il countdown reale.' : `Dal ${shortDate(start)} al ${shortDate(end)}: ${fmt(config.initial)} precari pixel, distribuiti sui giorni di calendario.`;
    if (target < visual) { visual = target; flights = []; rebuildPile(); }
    if (paused && target > visual) { visual = target; flights = []; rebuildPile(); }
  }
  function resize() {
    W = window.innerWidth <= 600 ? 620 : 1000; H = W === 620 ? 760 : 660;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W*dpr; canvas.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    rebuildPile();
  }
  function geometry() {
    return {left:W*.075,right:W*.915,levels:[H*.23,H*.37,H*.51],jar:{x:W*.54,y:H*.64,w:W*.37,h:H*.285},machineX:W*.68};
  }
  function person() {
    return {x:W*.095,y:geometry().levels[0],level:0,dir:1,speed:29+Math.random()*12,color:colors[Math.floor(Math.random()*colors.length)],phase:Math.random()*7,variant:Math.floor(Math.random()*3)};
  }
  function rebuildPile() {
    const j = geometry().jar, ratio = visual/config.initial;
    pile = Array.from({length:Math.min(260, Math.ceil(ratio*260))},(_,i)=>({x:j.x+18+((i*41.33)%Math.max(1,j.w-36)),y:j.y+j.h-15-Math.floor(i/22)*j.h*.056,color:colors[i%colors.length],rotation:Math.sin(i*7)*1.5}));
  }
  function launch(p, count = 1) {
    const g = geometry(), j = g.jar;
    const x = g.machineX + (tool === 'trap' ? -84 : tool === 'spring' ? 75 : 0);
    flights.push({x,y:g.levels[2]-12,sx:x,sy:g.levels[2]-12,ex:j.x+22+Math.random()*(j.w-44),ey:j.y+j.h-22-(visual/config.initial)*j.h*.66,age:0,duration:tool==='spring'?1.35:.95,color:p.color,variant:p.variant,count,tool});
    toolFlash = .65;
    if (time-lastToast>2) toast(quips[tool][Math.floor(Math.random()*3)]);
  }
  function selectTool(next) {
    tool = next;
    document.querySelectorAll('[data-tool]').forEach(b=>{b.classList.toggle('active',b.dataset.tool===tool);b.setAttribute('aria-pressed',String(b.dataset.tool===tool));});
  }
  function fire(next) {
    selectTool(next); animation = null;
    if (paused) setPause(false);
    if (!preview) { preview = true; viewDay = Math.max(start, Math.min(end, todayDay())); }
    if (viewDay < end) {
      viewDay = Math.min(end,viewDay+1); update();
      const p = people.length ? people.splice(people.length-1,1)[0] : person();
      launch({...p,x:geometry().machineX,y:geometry().levels[2]},0);
      toast('Un giorno avanti, solo per gioco. Il countdown reale ti aspetta.');
    } else toast('Sono tutti nel barattolo. Suona la campanella!');
  }
  function setPause(value) { paused=value; $('pause').textContent=value?'Riprendi':'Pausa'; $('pause').setAttribute('aria-pressed',String(value)); }
  function tick(dt) {
    time += dt; toolFlash=Math.max(0,toolFlash-dt);
    if (animation) {
      animation.age = (performance.now() - animation.started) / 1000;
      viewDay = animation.from + Math.floor((end-animation.from)*Math.min(1,animation.age/12)); preview=true; update();
      if (animation.age>=12) {animation=null;viewDay=end;update();toast('DRIIIN! Zero davanti. Tutti nel barattolone.');}
    }
    const remaining = config.initial-target, desired = Math.min(52,remaining);
    accumulator+=dt;
    if (people.length<desired && accumulator>.12) {people.push(person());accumulator=0;}
    if (people.length>desired) people.splice(0,people.length-desired);
    const g=geometry();
    for (const p of people) {
      p.phase+=dt*9;p.x+=p.dir*p.speed*dt;
      if (p.level===0&&p.x>=g.right) {p.level=1;p.dir=-1;}
      if (p.level===1&&p.x<=g.left) {p.level=2;p.dir=1;}
      p.y=g.levels[p.level];
      if (p.level===2&&p.x>W*.87) {p.x=g.left;p.level=0;p.y=g.levels[0];p.dir=1;}
    }
    const reserved=flights.reduce((s,f)=>s+f.count,0), missing=target-visual-reserved;
    if (missing>0 && flights.length<18 && Math.random()<dt*12) {
      const batch=Math.max(1,Math.ceil(missing/30));
      launch({x:g.machineX+(Math.random()-.5)*30,y:g.levels[2],color:colors[Math.floor(Math.random()*6)],variant:0},Math.min(batch,missing));
    }
    for (let i=flights.length-1;i>=0;i--) {
      const f=flights[i]; f.age+=dt;
      const t=Math.min(1,f.age/f.duration);
      f.x=f.sx+(f.ex-f.sx)*t;f.y=f.sy+(f.ey-f.sy)*t-Math.sin(t*Math.PI)*(f.tool==='spring'?H*.25:H*.09);
      if (t===1) {
        visual=Math.min(target,visual+f.count);flights.splice(i,1);rebuildPile();
        for(let k=0;k<5;k++)confetti.push({x:f.x,y:f.y,vx:(Math.random()-.5)*100,vy:-40-Math.random()*70,life:.8,color:f.color});
      }
    }
    for(let i=confetti.length-1;i>=0;i--){const p=confetti[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;if(p.life<=0)confetti.splice(i,1);}
  }
  function rect(x,y,w,h,color) {ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  function text(s,x,y,size=12,color='#9cacc1',align='left') {ctx.fillStyle=color;ctx.font=`700 ${size}px ui-monospace, monospace`;ctx.textAlign=align;ctx.fillText(s,x,y);ctx.textAlign='left';}
  function sprite(p,scale=1,rotation=0) {
    ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));ctx.rotate(rotation);ctx.scale(scale,scale);
    const stride=Math.sin(p.phase||0)>0?2:-2;
    rect(-6,-27,12,6,p.color);rect(-8,-23,3,5,p.color);rect(-5,-21,11,9,'#f4d1a0');rect(3,-19,2,2,'#1a2233');
    rect(-5,-12,10,10,p.color);rect(-8,-11,3,8,'#f4d1a0');rect(5,-10,3,7,'#f4d1a0');
    rect(-6,-2,4,4+stride,'#dde4ed');rect(2,-2,4,4-stride,'#dde4ed');rect(-7,3+stride,5,3,'#182030');rect(2,3-stride,6,3,'#182030');
    if(p.variant===1)rect(-6,-18,13,2,'#667480');
    if(p.variant===2){rect(6,-6,8,10,'#b77b50');rect(8,-8,4,2,'#b77b50');}
    ctx.restore();
  }
  function draw() {
    const g=geometry(),j=g.jar;
    ctx.clearRect(0,0,W,H);
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#17243c');sky.addColorStop(1,'#253047');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    for(let i=0;i<16;i++){rect((i*113)%W,80+(i*37)%(H*.45),W*.07,27,'#23324a');rect((i*113)%W+4,84+(i*37)%(H*.45),W*.07-8,3,'#2a3c55');}
    // School entrance and the winding, three-floor queue.
    rect(g.left-12,g.levels[0]-69,65,69,'#0d182b');rect(g.left-6,g.levels[0]-63,53,63,'#354658');
    rect(g.left+1,g.levels[0]-57,39,57,'#121d2d');text('GPS',g.left+21,g.levels[0]-39,12,'#d9f482','center');
    for (let i=0;i<3;i++) {
      const y=g.levels[i]+8;
      rect(g.left-20,y,g.right-g.left+40,12,'#78838b');rect(g.left-20,y+12,g.right-g.left+40,12,'#3d4958');
      for(let x=g.left;x<g.right;x+=37)rect(x,y+2,18,3,'#aab1ad');
      text(i===0?'→ NOMINA IN ARRIVO':i===1?'← ATTENDERE PREGO':'→ MANCAVA UN ALLEGATO',i===1?W*.2:W*.37,y+40,W===620?10:12,'#6f849f');
    }
    [g.right,g.left].forEach((x,i)=>{for(let y=g.levels[i]+22;y<g.levels[i+1];y+=12){rect(x-8,y,16,3,'#52647a');}rect(x-10,g.levels[i]+18,3,H*.13,'#61718a');rect(x+8,g.levels[i]+18,3,H*.13,'#61718a');});
    // Cartoon equipment sits above the final conveyor.
    const mx=g.machineX,my=g.levels[2];
    rect(mx-8,my-91,16,49,'#5c6a7c');rect(mx-31,my-49+(tool==='stamp'?toolFlash*35:0),62,15,'#ef9aad');
    text('TIMBRO',mx,my-100,10,'#ef9aad','center');
    rect(mx-108,my+8,47,8,tool==='trap'&&toolFlash?'#101726':'#d9f482');text('BOTOLA',mx-84,my-43,9,'#d9f482','center');
    ctx.strokeStyle='#94c9ed';ctx.lineWidth=3;ctx.beginPath();for(let a=0;a<9;a++)ctx.lineTo(mx+60+(a%2)*25,my-a*3);ctx.stroke();text('MOLLA',mx+75,my-43,9,'#94c9ed','center');
    people.forEach(p=>sprite(p,W===620?.9:1));
    // The jar fill follows the count, while only a sample of sprites is drawn.
    ctx.save();ctx.beginPath();ctx.roundRect(j.x,j.y,j.w,j.h,22);ctx.clip();
    rect(j.x,j.y,j.w,j.h,'#9ebcb611');
    const fill=(visual/config.initial)*(j.h-26);
    rect(j.x+4,j.y+j.h-fill,j.w-8,fill,'#d9f48222');
    pile.forEach(p=>sprite({...p,phase:0},.68,p.rotation));
    ctx.restore();
    ctx.strokeStyle='#bddcd5';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(j.x,j.y,j.w,j.h,22);ctx.stroke();
    rect(j.x+14,j.y-9,j.w-28,14,'#8bada7');rect(j.x+24,j.y+14,5,j.h-36,'#bddcd536');
    rect(j.x+j.w*.15,j.y+j.h*.36,j.w*.7,51,'#e8dfbc');
    text('PRECARI IN CONSERVA',j.x+j.w/2,j.y+j.h*.36+20,W===620?10:12,'#28393c','center');
    text(fmt(target)+' / '+fmt(config.initial),j.x+j.w/2,j.y+j.h*.36+39,13,'#28393c','center');
    flights.forEach(f=>{sprite(f,f.tool==='stamp'&&f.age<.25?.55:1,f.age*7);if(f.count>1)text('×'+f.count,f.x+13,f.y-16,11,'#d9f482');});confetti.forEach(p=>rect(p.x,p.y,4,4,p.color));
    const rem=config.initial-target;
    text('LA TUA FILA',W*.075,H*.69,11,'#d9f482');text(fmt(rem),W*.075,H*.755,W===620?40:55,'#d9f482');
    text(rem?'Un giorno alla volta.':'FINE DELLA FILA!',W*.075,H*.81,W===620?11:14,rem?'#9cacc1':'#ef9aad');
    text('PLesso MEUCCI'.toUpperCase(),W*.075,H*.87,10,'#697d98');
    if(!rem){text('DRIIIN!',W*.28,H*.13,32,'#d9f482','center');text('BUONE VACANZE',W*.7,H*.14,18,'#ef9aad','center');}
    if(paused){rect(W/2-70,H*.29,140,42,'#0e172be8');text('PAUSA',W/2,H*.29+28,21,'#d9f482','center');}
  }
  function frame(now) {
    const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(!paused&&!document.hidden)tick(dt);draw();requestAnimationFrame(frame);
  }
  $('future').addEventListener('input',()=>{preview=true;animation=null;viewDay=start+Number($('future').value);update();});
  $('today').addEventListener('click',()=>{preview=false;animation=null;viewDay=todayDay();target=visual=totals(viewDay).collected;flights=[];rebuildPile();update();toast('Rieccoci a oggi. La fila segue il calendario.');});
  $('finale').addEventListener('click',()=>{preview=true;setPause(false);viewDay=start;visual=0;flights=[];rebuildPile();update();animation={from:start,age:0,started:performance.now()};toast('Tutto l’anno in 12 secondi. Tenetevi il fascicolo!');});
  $('pause').addEventListener('click',()=>setPause(!paused));
  document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>fire(b.dataset.tool)));
  $('settings').addEventListener('submit',e=>{
    e.preventDefault();const next={initial:Number($('initial').value),start:$('start').value,end:$('end').value};
    if(!valid(next)){ $('settings-message').textContent='La fine deve seguire l’inizio (massimo 10 anni). Posizione: da 1 a 20.000.';return; }
    config=next;setup();
    try{localStorage.setItem(KEY,JSON.stringify(config));$('settings-message').textContent='Salvato su questo dispositivo.';}catch(_){$('settings-message').textContent='Applicato. Il browser non consente il salvataggio.';}
  });
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden&&!preview){viewDay=todayDay();update();}});
  setInterval(()=>{if(!preview&&viewDay!==todayDay()){viewDay=todayDay();update();}},30000);
  setup();resize();selectTool(tool);
  people=Array.from({length:Math.min(42,config.initial-target)},(_,i)=>{const p=person();p.level=i%3;p.dir=p.level===1?-1:1;p.x=geometry().left+(i*61)%(geometry().right-geometry().left);p.y=geometry().levels[p.level];return p;});
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)setPause(true);
  requestAnimationFrame(frame);
})();
