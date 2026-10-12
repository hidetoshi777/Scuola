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
  let target = 0, visual = 0, time = 0, last = 0, accumulator = 0, tool = 'stamp';
  const trapTypes = ['stamp','dragon','trap','storm','spring'];
  const trapLabels = {stamp:'NESSUNA CHIAMATA',dragon:'FIATO SUL COLLO',trap:'LA PRECARIETÀ',storm:'TEMPESTA GPS',spring:'SEDE LONTANA'};
  const flashes = Object.fromEntries(trapTypes.map(kind=>[kind,0]));
  let people = [], flights = [], confetti = [], pile = [], returning = [], lastToast = -10;
  let personSerial = 0;
  const backdrop = new Image(); backdrop.src = 'scenario.webp';
  const canvas = $('world'), ctx = canvas.getContext('2d');
  let W = 1000, H = 760;
  const colors = ['#d9f482','#ef9aad','#94c9ed','#c6a5ec','#eeb879','#89d3bf'];
  const hairColors=['#543e31','#b48a53','#38362f','#b1b0a3','#92583a'];
  const skinColors=['#f4c99a','#e6ad79','#bd875f','#f8d9b5'];
  const quips = {stamp:['Il prossimo anno? Nessuna chiamata.','Il telefono tace. La graduatoria no.','Quest’anno lavori. Il prossimo? Boh.'],dragon:['Il fiato sul collo… stavolta è un drago.','Graduatoria rovente. Supplenza fumante.','Niente chiamata. Solo una fiammata.'],trap:['Contratto scaduto. Si ricomincia.','Un altro giugno, un’altra incertezza.','Un altro anno a tempo determinato.'],storm:['Un fulmine a ciel sereno sulla graduatoria.','Previsioni per settembre: molto instabili.','La convocazione? È caduta la linea.'],spring:['120 km di andata. E poi il ritorno.','La prossima sede? Dall’altra parte.','Più chilometri che certezze.']};
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
    preview = false; animation = null; viewDay = todayDay(); people = []; flights = []; confetti = []; pile = []; returning = [];
    trapTypes.forEach(kind=>flashes[kind]=0);
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
    $('calendar-note').textContent = preview ? 'Stai giocando con una data futura. “Torna a oggi” ripristina il countdown reale.' : `Dal ${shortDate(start)} al ${shortDate(end)}: ${fmt(config.initial)} precari cartoon, distribuiti sui giorni di calendario.`;
    if (target < visual) { visual = target; flights = []; rebuildPile(); }
    if (paused && target > visual) { visual = target; flights = []; rebuildPile(); }
  }
  function returnToToday() {
    preview=false; animation=null; viewDay=todayDay();
    target=visual=totals(viewDay).collected; flights=[]; confetti=[];
    trapTypes.forEach(kind=>flashes[kind]=0);
    rebuildPile(); update();
  }
  function resize() {
    const oldW = W;
    W = window.innerWidth <= 600 ? 620 : 1000; H = W === 620 ? 900 : 760;
    if(oldW!==W){people=seedPeople(people.length+returning.length);returning=[];}
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W*dpr; canvas.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    rebuildPile();
  }
  function geometry() {
    const levels=[H*.265,H*.425,H*.585];
    return {left:W*.085,right:W*.91,levels,jar:{x:W*.615,y:H*.69,w:W*.31,h:H*.24},
      traps:{stamp:{x:W*.43,y:levels[0],level:0},dragon:{x:W*.69,y:levels[0],level:0},trap:{x:W*.60,y:levels[1],level:1},storm:{x:W*.29,y:levels[1],level:1},spring:{x:W*.34,y:levels[2],level:2}}};
  }
  function person() {
    return {x:geometry().left+12,y:geometry().levels[0],level:0,dir:1,speed:42+Math.random()*4,color:colors[Math.floor(Math.random()*colors.length)],hair:hairColors[Math.floor(Math.random()*hairColors.length)],skin:skinColors[Math.floor(Math.random()*skinColors.length)],phase:Math.random()*7,variant:Math.floor(Math.random()*3),woman:personSerial++%5<2,falling:false,vy:0,blocked:false};
  }
  function seedPeople(count) {
    const g=geometry(),perFloor=Math.ceil(count/3);
    return Array.from({length:count},(_,i)=>{const p=person();p.level=i%3;p.dir=p.level===1?-1:1;p.x=g.left+50+Math.floor(i/3)*(g.right-g.left-90)/Math.max(1,perFloor);p.y=g.levels[p.level];return p;});
  }
  function rebuildPile() {
    const j = geometry().jar, ratio = visual/config.initial;
    const columns=Math.max(5,Math.floor((j.w-34)/16));
    pile = Array.from({length:Math.ceil(ratio*columns*10)},(_,i)=>({x:j.x+22+(i%columns)*16+Math.sin(i*8)*3,y:j.y+j.h-14-Math.floor(i/columns)*j.h*.075,color:colors[i%colors.length],hair:hairColors[i%hairColors.length],skin:skinColors[i%skinColors.length],variant:i%3,woman:i%5<2,rotation:Math.sin(i*7)*.8}));
  }
  function launch(p, count = 1) {
    const g = geometry(), j = g.jar;
    const x=p.x,y=p.y-16;
    const hit=tool==='dragon'?.34:tool==='storm'?.4:0;
    flights.push({x,y,sx:x,sy:y,ex:j.x+22+Math.random()*(j.w-44),ey:j.y+j.h-18-(visual/config.initial)*j.h*.65,age:0,duration:hit?1.65:tool==='spring'?1.55:1.25,hit,color:p.color,hair:p.hair,skin:p.skin,variant:p.variant,woman:p.woman,count,tool,dir:p.dir});
    flashes[tool]=tool==='dragon'?1.15:tool==='storm'?.9:.65;
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
      toast('Trappola pronta: aspettiamo che arrivi il prossimo precario!');
    } else toast('Sono tutti nel barattolo. Suona la campanella!');
  }
  function setPause(value) { paused=value; $('pause').textContent=value?'Riprendi':'Pausa'; $('pause').setAttribute('aria-pressed',String(value)); }
  function tick(dt) {
    time += dt; trapTypes.forEach(kind=>flashes[kind]=Math.max(0,flashes[kind]-dt));
    if (animation) {
      animation.age = (performance.now() - animation.started) / 1000;
      viewDay = animation.from + Math.floor((end-animation.from)*Math.min(1,animation.age/12)); preview=true; update();
      if (animation.age>=12) {animation=null;viewDay=end;update();visual=target;flights=[];people=[];returning=[];rebuildPile();toast('DRIIIN! Zero davanti. Tutti nel barattolone.');}
    }
    const remaining = config.initial-target, desired = remaining ? Math.min(27,remaining) : target>visual ? 12 : 0;
    accumulator+=dt;
    const entranceFree=!people.some(p=>p.level===0&&p.x<geometry().left+58);
    returning.forEach(r=>r.age+=dt);
    if(remaining&&returning.length&&returning[0].age>=1.8&&entranceFree){
      const p=returning.shift().person;Object.assign(p,{x:geometry().left+12,y:geometry().levels[0],level:0,dir:1,falling:false,vy:0,blocked:false});people.push(p);accumulator=0;
    }else if (people.length+returning.length<desired && accumulator>1.3 && entranceFree) {people.push(person());accumulator=0;}
    if(!remaining&&target===visual)returning=[];
    if (people.length>desired && target===visual) people.splice(0,people.length-desired);
    const g=geometry();
    const gap=W===620?42:40;
    for (const p of people) {
      if(p.falling){
        const next=p.level+1,occupied=people.some(q=>q!==p&&q.level===next&&!q.falling&&Math.abs(q.x-p.x)<gap);
        p.vy+=430*dt;p.y+=p.vy*dt;
        if(p.y>=g.levels[next]-56&&occupied){p.y=g.levels[next]-56;p.vy=0;}
        else if(p.y>=g.levels[next]){p.level=next;p.y=g.levels[next];p.dir=next===1?-1:1;p.falling=false;p.vy=0;}
        continue;
      }
      const front=people.filter(q=>q!==p&&q.level===p.level&&(!q.falling||q.y-p.y<56)&&(q.x-p.x)*p.dir>=0).reduce((min,q)=>Math.min(min,(q.x-p.x)*p.dir),Infinity);
      let step=Math.min(p.speed*dt,Math.max(0,front-gap));
      if(p.level===0)step=Math.min(step,Math.max(0,g.right-p.x));
      if(p.level===1)step=Math.min(step,Math.max(0,p.x-g.left));
      if(p.level===2)step=Math.min(step,Math.max(0,W*.865-p.x));
      p.blocked=step<.05;p.x+=p.dir*step;if(!p.blocked)p.phase+=dt*10;
      if((p.level===0&&p.x>=g.right)||(p.level===1&&p.x<=g.left)){
        const shaftFree=!people.some(q=>q!==p&&q.falling&&q.level===p.level&&Math.abs(q.x-p.x)<gap);
        if(shaftFree){p.falling=true;p.vy=0;}
      }
    }
    // Finishing a lap is cosmetic: the same teacher queues for the next school year.
    for(let i=people.length-1;i>=0;i--){const p=people[i];if(remaining&&p.level===2&&!p.falling&&p.x>=W*.865-.1){returning.push({person:p,age:0});people.splice(i,1);}}
    const reserved=flights.reduce((s,f)=>s+f.count,0), missing=target-visual-reserved;
    if(animation)selectTool(trapTypes[Math.floor(animation.age/2)%trapTypes.length]);
    const machine=g.traps[tool];
    const victim=people.find(p=>!p.falling&&p.level===machine.level&&Math.abs(p.x-machine.x)<19);
    if(missing>0&&flights.length<12&&victim){
      const batch=Math.max(1,Math.ceil(missing/12));
      launch(victim,Math.min(batch,missing));people.splice(people.indexOf(victim),1);
    }
    for (let i=flights.length-1;i>=0;i--) {
      const f=flights[i]; f.age+=dt;
      const t=Math.min(1,Math.max(0,(f.age-f.hit)/(f.duration-f.hit)));
      const lift=f.tool==='spring'?H*.29:f.tool==='storm'?H*.23:f.tool==='dragon'?H*.15:f.tool==='stamp'?H*.09:0;
      f.x=f.sx+(f.ex-f.sx)*t+(f.tool==='storm'&&f.age<f.hit?Math.sin(f.age*65)*6:0);f.y=f.sy+(f.ey-f.sy)*t-Math.sin(t*Math.PI)*lift;
      if (t===1) {
        visual=Math.min(target,visual+f.count);flights.splice(i,1);rebuildPile();
        for(let k=0;k<5;k++)confetti.push({x:f.x,y:f.y,vx:(Math.random()-.5)*100,vy:-40-Math.random()*70,life:.8,color:f.tool==='dragon'?'#ffc05b':f.tool==='storm'?'#a7eaff':f.color});
      }
    }
    for(let i=confetti.length-1;i>=0;i--){const p=confetti[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;if(p.life<=0)confetti.splice(i,1);}
  }
  function rect(x,y,w,h,color) {ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  function text(s,x,y,size=12,color='#9cacc1',align='left') {ctx.fillStyle=color;ctx.font=`700 ${size}px ui-monospace, monospace`;ctx.textAlign=align;ctx.fillText(s,x,y);ctx.textAlign='left';}
  function sprite(p,scale=1,rotation=0) {
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(rotation);ctx.scale(scale*(p.dir||1),scale);
    const stride=p.blocked?0:Math.sin(p.phase||0)*4;
    ctx.lineCap='round';ctx.lineJoin='round';
    // Ordinary teachers: natural hair, different complexions and empty hands.
    ctx.strokeStyle='#142e36';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(-4,-10);ctx.lineTo(-4-stride,-2);ctx.moveTo(3,-10);ctx.lineTo(3+stride,-2);ctx.stroke();
    round(-10-stride,-4,10,5,2,'#18323a','#09232c');round(stride,-4,11,5,2,'#18323a','#09232c');
    round(-8,-24,16,15,5,!p.woman&&p.variant===1?'#f4f0dd':p.color,'#14303c');
    if(p.woman){
      // Cardigans with trousers or a skirt, in the same palette as the other teachers.
      if(p.variant===1){ctx.fillStyle=p.color;ctx.strokeStyle='#14303c';ctx.beginPath();ctx.moveTo(-6,-14);ctx.lineTo(-10,-7);ctx.quadraticCurveTo(0,-4,10,-7);ctx.lineTo(6,-14);ctx.closePath();ctx.fill();ctx.stroke();}
      round(-3,-23,5,9,2,'#f2eed7');ctx.strokeStyle='#ffffff65';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-4,-21);ctx.lineTo(-1,-16);ctx.moveTo(4,-21);ctx.lineTo(1,-16);ctx.stroke();
    }else{
      round(-3,-24,5,12,2,'#f2eed7');ctx.fillStyle='#df6b58';ctx.beginPath();ctx.moveTo(0,-21);ctx.lineTo(-2,-13);ctx.lineTo(2,-14);ctx.fill();
    }
    ctx.strokeStyle=p.skin||'#f4c99a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-7,-20);ctx.lineTo(-10-stride*.3,-12);ctx.moveTo(7,-20);ctx.lineTo(10+stride*.3,-12);ctx.stroke();
    if(p.woman||p.variant===2){ctx.fillStyle=p.hair||'#543e31';ctx.beginPath();ctx.ellipse(-2,-33,11,p.woman&&p.variant===0?14:12,0,0,Math.PI*2);ctx.fill();}
    if(p.woman&&p.variant===1){ctx.fillStyle=p.hair;ctx.beginPath();ctx.ellipse(-10,-32,4,9,-.2,0,Math.PI*2);ctx.fill();round(-12,-37,4,3,1,p.color);}
    if(p.woman&&p.variant===2){ctx.fillStyle=p.hair;ctx.beginPath();ctx.ellipse(-7,-43,5,5,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=p.skin||'#f4c99a';ctx.strokeStyle='#754d37';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-33,9,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(8,-31,4,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=p.hair||'#543e31';ctx.beginPath();
    if(!p.woman&&p.variant===1){ctx.ellipse(-6,-35,4,8,.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(-1,-42,8,3,-.1,0,Math.PI*2);ctx.fill();}
    else{ctx.moveTo(-9,-31);ctx.bezierCurveTo(-15,-48,8,-51,10,-37);ctx.bezierCurveTo(5,-40,1,-36,-5,-37);ctx.lineTo(-7,-31);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffffff25';ctx.beginPath();ctx.moveTo(-7,-41);ctx.quadraticCurveTo(-1,-46,5,-42);ctx.stroke();}
    ctx.fillStyle='#223747';ctx.beginPath();ctx.arc(4,-34,1.6,0,7);ctx.fill();
    if(p.variant===1){ctx.strokeStyle='#496376';ctx.lineWidth=1.4;ctx.strokeRect(0,-37,7,5);}
    ctx.strokeStyle='#925a42';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(2,-27);ctx.lineTo(6,-27);ctx.stroke();
    ctx.restore();
  }
  function round(x,y,w,h,r,fill,stroke) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}
  }
  function platform(x,y,width,index) {
    ctx.save();ctx.shadowColor='#0008';ctx.shadowBlur=16;ctx.shadowOffsetY=9;
    const stone=ctx.createLinearGradient(0,y,0,y+40);stone.addColorStop(0,'#b6a37d');stone.addColorStop(.18,'#685b48');stone.addColorStop(1,'#293b3a');
    ctx.fillStyle=stone;ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+width+8,y);ctx.lineTo(x+width,y+24);
    for(let k=width;k>0;k-=24)ctx.lineTo(x+k,y+31+Math.sin(k*2+index)*6);ctx.lineTo(x,y+25);ctx.closePath();ctx.fill();ctx.restore();
    const grass=ctx.createLinearGradient(0,y-7,0,y+3);grass.addColorStop(0,'#b1d986');grass.addColorStop(1,'#61804a');
    round(x-8,y-5,width+16,8,3,grass);
    for(let k=0;k<width;k+=31){ctx.strokeStyle='#b5c894';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+k,y-4);ctx.lineTo(x+k+2,y-10);ctx.lineTo(x+k+6,y-5);ctx.stroke();round(x+k+4,y+10,20,10,3,index%2?'#61756b':'#797665','#3a4e48');}
    for(let k=30;k<width;k+=120){ctx.strokeStyle='#395a47';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+k,y+24);ctx.quadraticCurveTo(x+k-10,y+40,x+k+4,y+48);ctx.stroke();ctx.fillStyle='#769757';ctx.beginPath();ctx.ellipse(x+k,y+39,5,3,-.5,0,7);ctx.fill();}
  }
  function dragon(m) {
    ctx.save();ctx.translate(m.x,m.y);const size=W===620?.78:1;ctx.scale(size,size);
    const breath=Math.sin(time*2.5)*1.5;
    const green=ctx.createLinearGradient(30,-80,95,0);green.addColorStop(0,'#b4d977');green.addColorStop(.45,'#719658');green.addColorStop(1,'#345b43');
    // Curled tail and a folded, veined wing sit behind the little dragon.
    ctx.strokeStyle='#314b3a';ctx.lineWidth=20;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(88,-20);ctx.bezierCurveTo(104,-3,131,-2,139,-23);ctx.stroke();
    ctx.strokeStyle='#789b58';ctx.lineWidth=14;ctx.stroke();
    ctx.fillStyle='#d4b379';ctx.beginPath();ctx.moveTo(128,-15);ctx.lineTo(139,-35);ctx.lineTo(146,-16);ctx.closePath();ctx.fill();
    ctx.fillStyle='#527b51';ctx.strokeStyle='#233d33';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(70,-35);ctx.quadraticCurveTo(70,-70,94,-84-breath);ctx.lineTo(112,-41);ctx.quadraticCurveTo(90,-53,86,-31);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#c7aa77';ctx.beginPath();ctx.moveTo(77,-42);ctx.lineTo(93,-73-breath);ctx.lineTo(103,-47);ctx.lineTo(90,-51);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#7b8153';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(93,-73-breath);ctx.lineTo(90,-51);ctx.lineTo(77,-42);ctx.stroke();
    ctx.fillStyle=green;ctx.strokeStyle='#263f32';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(73,-28,24,29+breath,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e5cf96';ctx.beginPath();ctx.ellipse(63,-23,12,20+breath,-.15,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#b19968';ctx.lineWidth=1;for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(54,-32+k*8);ctx.quadraticCurveTo(62,-29+k*8,72,-32+k*8);ctx.stroke();}
    ctx.strokeStyle='#385b41';ctx.lineWidth=24;ctx.beginPath();ctx.moveTo(58,-30);ctx.quadraticCurveTo(52,-56,33,-50);ctx.stroke();
    ctx.strokeStyle='#87ab65';ctx.lineWidth=18;ctx.stroke();
    ctx.fillStyle='#dfc394';ctx.strokeStyle='#6d7450';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(34,-63);ctx.lineTo(39,-81);ctx.lineTo(47,-62);ctx.moveTo(48,-60);ctx.lineTo(58,-71);ctx.lineTo(57,-52);ctx.fill();ctx.stroke();
    ctx.fillStyle=green;ctx.strokeStyle='#2a4737';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(47,-63);ctx.quadraticCurveTo(25,-72,20,-55);ctx.lineTo(9,-53);ctx.quadraticCurveTo(0,-49,6,-40);ctx.quadraticCurveTo(26,-33,43,-43);ctx.quadraticCurveTo(56,-49,47,-63);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#e9e5bf';ctx.beginPath();ctx.ellipse(30,-56,6,7,-.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#20362d';ctx.beginPath();ctx.ellipse(28,-56,2,4,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#395f40';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(22,-63);ctx.quadraticCurveTo(29,-67,36,-61);ctx.stroke();
    ctx.fillStyle='#294337';ctx.beginPath();ctx.ellipse(10,-49,2,1.7,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#314536';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(6,-41);ctx.quadraticCurveTo(19,-38,28,-42);ctx.stroke();
    ctx.fillStyle='#fff0cc';ctx.beginPath();ctx.moveTo(14,-41);ctx.lineTo(17,-36);ctx.lineTo(20,-41);ctx.fill();
    ctx.strokeStyle='#61864e';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(59,-35);ctx.quadraticCurveTo(50,-30,46,-20);ctx.stroke();
    round(41,-23,12,8,4,'#92ad66','#355b40');round(54,-8,23,10,5,'#719755','#2c4a37');round(80,-7,22,9,5,'#668a50','#2c4a37');
    ctx.strokeStyle='#ebd9b0';ctx.lineWidth=2;[58,64,70,84,90,96].forEach(x=>{ctx.beginPath();ctx.moveTo(x,-3);ctx.lineTo(x+2,0);ctx.stroke();});
    if(flashes.dragon>0){
      const flicker=Math.sin(time*37)*5;
      ctx.globalAlpha=Math.min(1,flashes.dragon/.18);ctx.shadowColor='#ff9039';ctx.shadowBlur=24;
      ctx.fillStyle='#f26c32';ctx.beginPath();ctx.moveTo(9,-42);ctx.bezierCurveTo(-10,-53,-36,-52,-75-flicker,-65);ctx.lineTo(-53,-45);ctx.lineTo(-91-flicker,-38);ctx.lineTo(-51,-32);ctx.lineTo(-68,-13);ctx.bezierCurveTo(-31,-21,-10,-37,9,-39);ctx.closePath();ctx.fill();
      ctx.shadowBlur=8;ctx.fillStyle='#ffca58';ctx.beginPath();ctx.moveTo(8,-42);ctx.lineTo(-58-flicker,-53);ctx.lineTo(-36,-40);ctx.lineTo(-67,-34);ctx.lineTo(-31,-31);ctx.lineTo(-42,-22);ctx.lineTo(8,-39);ctx.fill();
      ctx.fillStyle='#fff4b4';ctx.beginPath();ctx.moveTo(8,-42);ctx.lineTo(-35-flicker,-44);ctx.lineTo(-20,-37);ctx.lineTo(-39,-33);ctx.lineTo(8,-39);ctx.fill();
      ctx.shadowBlur=0;for(let k=0;k<5;k++){ctx.beginPath();ctx.arc(-30-k*10,-36+Math.sin(time*20+k)*19,1.5,0,Math.PI*2);ctx.fill();}
    }else{
      ctx.globalAlpha=.25;ctx.strokeStyle='#d3dbbb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,-53);ctx.quadraticCurveTo(-5,-60-breath,1,-67-breath);ctx.stroke();
    }
    ctx.restore();
  }
  function storm(m) {
    ctx.save();ctx.translate(m.x,m.y);const bob=Math.sin(time*2)*2,cy=-80+bob;
    const cloud=ctx.createLinearGradient(0,cy-20,0,cy+20);cloud.addColorStop(0,'#93b1c4');cloud.addColorStop(.55,'#537790');cloud.addColorStop(1,'#2e4a64');
    ctx.fillStyle=cloud;ctx.strokeStyle='#acc5cc';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(-40,cy+13);ctx.bezierCurveTo(-64,cy+7,-52,cy-17,-31,cy-14);ctx.bezierCurveTo(-30,cy-40,1,cy-41,10,cy-20);ctx.bezierCurveTo(29,cy-37,50,cy-21,46,cy-7);ctx.bezierCurveTo(68,cy+6,48,cy+20,34,cy+17);ctx.lineTo(-40,cy+13);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#c7deea77';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-24,cy-20);ctx.quadraticCurveTo(-10,cy-32,1,cy-18);ctx.stroke();
    ctx.strokeStyle='#94bede70';ctx.lineWidth=2;for(let k=0;k<5;k++){const ry=cy+24+(time*26+k*8)%23;ctx.beginPath();ctx.moveTo(-33+k*16,ry);ctx.lineTo(-36+k*16,ry+6);ctx.stroke();}
    // A small permanent bolt makes the trap readable even while it is waiting.
    ctx.fillStyle='#efd37c';ctx.beginPath();ctx.moveTo(4,cy+13);ctx.lineTo(-8,cy+36);ctx.lineTo(1,cy+34);ctx.lineTo(-5,cy+48);ctx.lineTo(16,cy+24);ctx.lineTo(6,cy+26);ctx.closePath();ctx.fill();
    if(flashes.storm>0){
      ctx.shadowColor='#9de9ff';ctx.shadowBlur=18;ctx.strokeStyle='#a0e6ff';ctx.lineWidth=7;ctx.lineJoin='round';
      ctx.beginPath();ctx.moveTo(3,cy+15);ctx.lineTo(-10,-51);ctx.lineTo(7,-47);ctx.lineTo(-7,-25);ctx.lineTo(5,-29);ctx.lineTo(0,-5);ctx.stroke();
      ctx.shadowBlur=0;ctx.strokeStyle='#f5fcdf';ctx.lineWidth=2.5;ctx.stroke();
      ctx.strokeStyle='#b4edff';ctx.lineWidth=2;for(let k=0;k<6;k++){const a=k*Math.PI/3+time;ctx.beginPath();ctx.moveTo(Math.cos(a)*14,-23+Math.sin(a)*16);ctx.lineTo(Math.cos(a)*25,-23+Math.sin(a)*28);ctx.stroke();}
    }
    ctx.restore();
  }
  function flightSprite(f) {
    ctx.save();
    if(f.tool==='dragon'){
      ctx.shadowColor='#ffac43';ctx.shadowBlur=f.age<f.hit?16:3;
      ctx.fillStyle='#bfc9c26b';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(f.x-10-k*7,f.y-31-k*7,3+k,0,Math.PI*2);ctx.fill();}
    }
    if(f.tool==='storm'){ctx.shadowColor='#b1efff';ctx.shadowBlur=f.age<f.hit?18:4;}
    sprite(f,f.tool==='stamp'&&f.age<.25?.55:1,f.age<f.hit?0:f.age*6);
    if(f.tool==='storm'&&f.age<f.hit){ctx.shadowBlur=0;ctx.strokeStyle='#e6fcff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x-15,f.y-31);ctx.lineTo(f.x-22,f.y-23);ctx.lineTo(f.x-16,f.y-22);ctx.lineTo(f.x-23,f.y-13);ctx.moveTo(f.x+15,f.y-35);ctx.lineTo(f.x+23,f.y-28);ctx.lineTo(f.x+17,f.y-26);ctx.lineTo(f.x+23,f.y-17);ctx.stroke();}
    ctx.restore();if(f.count>1)text('×'+f.count,f.x+18,f.y-22,12,'#e4f6aa');
  }
  function machine(kind,m) {
    const active=tool===kind,flash=Math.sin(Math.min(1,flashes[kind]/.65)*Math.PI),x=m.x,y=m.y;
    ctx.save();
    if(active){ctx.shadowColor='#d9f482';ctx.shadowBlur=12;ctx.fillStyle='#d9f482';ctx.beginPath();ctx.arc(x,y-(kind==='storm'?122:105),4,0,7);ctx.fill();ctx.shadowBlur=0;}
    if(kind==='dragon')dragon(m);
    else if(kind==='storm')storm(m);
    else if(kind==='stamp'){
      const metal=ctx.createLinearGradient(x-32,0,x+32,0);metal.addColorStop(0,'#7a493c');metal.addColorStop(.5,'#cc9371');metal.addColorStop(1,'#583a38');
      round(x-42,y-92,10,89,3,'#565747','#bca77f');round(x+32,y-92,10,89,3,'#565747','#bca77f');round(x-46,y-99,92,13,4,'#957b50','#d9ba76');
      round(x-6,y-89,12,50+flash*20,2,'#92a7a1','#d6ded0');round(x-33,y-56+flash*30,66,23,5,metal,'#e6b492');
      round(x-35,y-34+flash*30,70,6,2,'#2c443e');text('NO',x,y-39+flash*30,13,'#f8e7b7','center');
      if(flash>.5)text('PUF!',x+48,y-30,20,'#f4d6a3','center');
    }else if(kind==='trap'){
      ctx.fillStyle='#081619';ctx.beginPath();ctx.ellipse(x,y+2,36,11,0,0,7);ctx.fill();
      ctx.strokeStyle='#cba66c';ctx.lineWidth=4;ctx.stroke();
      ctx.save();ctx.translate(x-35,y-2);ctx.rotate(-flash*1.1);round(0,0,35,8,2,'#a88857','#dabd7b');ctx.restore();
      ctx.save();ctx.translate(x+35,y-2);ctx.rotate(flash*1.1);round(-35,0,35,8,2,'#a88857','#dabd7b');ctx.restore();
      round(x+39,y-43,9,36,3,'#4d6d5d');round(x+34,y-52,19,11,4,'#d57d57','#f1bd78');
    }else{
      round(x-31,y-8,62,14,5,'#ad6948','#e7b176');
      const top=y-25-flash*35;
      ctx.strokeStyle='#d8e6df';ctx.lineWidth=4;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x-20,y-9);
      for(let i=0;i<7;i++)ctx.lineTo(x+(i%2?20:-20),y-9+(top-(y-9))*i/6);ctx.stroke();
      round(x-27,top-5,54,8,4,'#e0b45d','#f4d681');
      text('+120 km',x+52,y-35,12,'#d9f482','center');
    }
    text(trapLabels[kind],x,y+52,W===620?11:13,active?'#e9f2b3':'#c4d8ca','center');ctx.restore();
  }
  function jar(j) {
    const x=j.x,y=j.y,w=j.w,h=j.h;
    ctx.save();ctx.shadowColor='#0008';ctx.shadowBlur=22;ctx.shadowOffsetY=9;
    round(x-22,y+h-4,w+44,17,6,'#826948','#c6a171');ctx.restore();
    // Curved shoulders, an open neck, tinted glass and a visible thickness at the base.
    const outline=()=>{ctx.beginPath();ctx.moveTo(x+w*.23,y-6);ctx.lineTo(x+w*.23,y+13);ctx.bezierCurveTo(x+w*.03,y+21,x,y+34,x,y+53);ctx.lineTo(x,y+h-20);ctx.quadraticCurveTo(x,y+h,x+20,y+h);ctx.lineTo(x+w-20,y+h);ctx.quadraticCurveTo(x+w,y+h,x+w,y+h-20);ctx.lineTo(x+w,y+53);ctx.bezierCurveTo(x+w,y+34,x+w*.97,y+21,x+w*.77,y+13);ctx.lineTo(x+w*.77,y-6);ctx.closePath();};
    const glass=ctx.createLinearGradient(x,0,x+w,0);glass.addColorStop(0,'#b7e5d84d');glass.addColorStop(.12,'#d9f9e32a');glass.addColorStop(.4,'#b4dbd30c');glass.addColorStop(.85,'#79c9b627');glass.addColorStop(1,'#d9f5d855');
    outline();ctx.fillStyle=glass;ctx.fill();ctx.strokeStyle='#c2e6d2';ctx.lineWidth=3;ctx.stroke();
    ctx.save();outline();ctx.clip();
    const fill=(visual/config.initial)*(h-34);const liquid=ctx.createLinearGradient(0,y+h-fill,0,y+h);liquid.addColorStop(0,'#d6e99024');liquid.addColorStop(1,'#b1d09365');ctx.fillStyle=liquid;ctx.fillRect(x+4,y+h-fill,w-8,fill);
    pile.forEach(p=>sprite({...p,phase:0,blocked:true},.45,p.rotation));ctx.restore();
    ctx.strokeStyle='#e3fff06b';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+18,y+63);ctx.lineTo(x+18,y+h-30);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w-10,y+65);ctx.lineTo(x+w-10,y+h-23);ctx.stroke();
    ctx.fillStyle='#25453d';ctx.strokeStyle='#def4d5';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x+w/2,y-5,w*.29,7,0,0,7);ctx.fill();ctx.stroke();
    for(let i=0;i<3;i++){ctx.strokeStyle='#cae0b589';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x+w/2,y+i*5,w*.278,6,0,0,Math.PI);ctx.stroke();}
    ctx.save();ctx.translate(x+w/2,y+h*.58);ctx.rotate(-.035);
    const label=ctx.createLinearGradient(0,-35,0,35);label.addColorStop(0,'#f4e7bd');label.addColorStop(1,'#dcca99');round(-w*.37,-34,w*.74,67,5,label,'#a28d63');
    text('PRECARI',0,-15,W===620?15:19,'#354e42','center');text('IN CONSERVA',0,1,W===620?10:12,'#687752','center');text(fmt(target)+' / '+fmt(config.initial),0,20,13,'#3d5746','center');ctx.restore();
    ctx.save();ctx.translate(x-22,y+h-12);ctx.rotate(-.3);round(-28,-10,55,13,6,'#a58650','#d9bc78');for(let i=-20;i<25;i+=7)rect(i,-7,2,7,'#6f643e');ctx.restore();
  }
  function draw() {
    const g=geometry(),j=g.jar;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#132a35';ctx.fillRect(0,0,W,H);
    if(backdrop.complete&&backdrop.naturalWidth){const s=Math.max(W/backdrop.width,H/backdrop.height);ctx.drawImage(backdrop,(W-backdrop.width*s)/2,0,backdrop.width*s,backdrop.height*s);}
    const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#0d263448');shade.addColorStop(.5,'#102b3977');shade.addColorStop(1,'#071d2dd9');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
    // Foreground islands, descending shafts and separate machinery on each floor.
    platform(g.left-16,g.levels[0],g.right-g.left+16,0);
    platform(g.left,g.levels[1],g.right-g.left+22,1);
    platform(g.left-18,g.levels[2],W*.90-g.left+18,2);
    const ey=g.levels[0];round(g.left-36,ey-70,57,70,8,'#314f43','#97b07b');round(g.left-27,ey-58,39,58,5,'#0c242c','#8d976b');round(g.left-32,ey-87,49,18,4,'#bc9e69','#edd39b');text('GPS',g.left-7,ey-74,12,'#263f34','center');
    [g.right+2,g.left-2].forEach((x,i)=>{ctx.strokeStyle='#a2b894';ctx.lineWidth=2;ctx.setLineDash([4,7]);ctx.beginPath();ctx.moveTo(x,g.levels[i]+35);ctx.lineTo(x,g.levels[i+1]-35);ctx.stroke();ctx.setLineDash([]);text('↓',x,g.levels[i+1]-20,23,'#c9dca9','center');});
    Object.entries(g.traps).forEach(([kind,m])=>machine(kind,m));
    const dx=W*.865,dy=g.levels[2];round(dx-20,dy-63,47,63,7,'#3c685b','#b7c58e');round(dx-12,dy-54,30,54,5,'#14323a','#80a191');
    round(dx-36,dy-81,77,17,4,'#e8d7a4','#8d9269');text('ANNO DOPO',dx+3,dy-69,9,'#3d5847','center');text('↑',dx+2,dy-22,25,'#d9f482','center');
    ctx.strokeStyle='#d9e3a44a';ctx.lineWidth=3;ctx.setLineDash([4,8]);ctx.beginPath();ctx.moveTo(dx+35,dy-20);ctx.quadraticCurveTo(W*.963,dy-20,W*.963,H*.15);ctx.lineTo(g.left+12,H*.15);ctx.lineTo(g.left+12,g.levels[0]-75);ctx.stroke();ctx.setLineDash([]);
    returning.filter(r=>r.age<1.8).forEach(r=>{const t=r.age/1.8;let x,y;if(t<.6){x=W*.963;y=dy-20+(H*.15-(dy-20))*t/.6;}else{x=W*.963+(g.left+12-W*.963)*(t-.6)/.4;y=H*.15;}ctx.save();ctx.globalAlpha=.75;round(x-15,y-35,30,43,12,'#b2d5b623','#b6d59670');sprite({...r.person,x,y,dir:-1},.6);ctx.restore();});
    people.forEach(p=>sprite(p,W===620?1.15:1));
    jar(j);
    flights.forEach(flightSprite);confetti.forEach(p=>{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,7);ctx.fill();});
    const rem=config.initial-target;
    text('LA TUA FILA',W*.085,H*.735,12,'#d9e6b2');text(fmt(rem),W*.085,H*.807,W===620?52:62,'#d9f482');
    text(rem?'Un giorno alla volta.':'FINE DELLA FILA!',W*.085,H*.845,W===620?14:16,rem?'#bad0bf':'#efc890');
    text('PLesso MEUCCI'.toUpperCase(),W*.085,H*.885,11,'#8fafa3');
    if(!rem){text('DRIIIN!',W*.28,H*.135,32,'#d9f482','center');text('BUONE VACANZE',W*.73,H*.13,18,'#eed69d','center');}
    if(paused){rect(W/2-70,H*.29,140,42,'#0e172be8');text('PAUSA',W/2,H*.29+28,21,'#d9f482','center');}
  }
  function frame(now) {
    const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(!paused&&!document.hidden)tick(dt);draw();requestAnimationFrame(frame);
  }
  $('future').addEventListener('input',()=>{preview=true;animation=null;viewDay=start+Number($('future').value);update();visual=target;flights=[];rebuildPile();});
  $('today').addEventListener('click',()=>{returnToToday();toast('Rieccoci a oggi. La fila segue il calendario.');});
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
  // Browsers restore form values after setup and can also cache a whole preview.
  window.addEventListener('pageshow',e=>{last=0;returnToToday();if(e.persisted){people=seedPeople(Math.min(18,config.initial-target));returning=[];}});
  document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden&&!preview){viewDay=todayDay();update();}});
  setInterval(()=>{if(!preview&&viewDay!==todayDay()){viewDay=todayDay();update();}},30000);
  setup();resize();selectTool(tool);
  people=seedPeople(Math.min(18,config.initial-target));
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)setPause(true);
  requestAnimationFrame(frame);
})();
