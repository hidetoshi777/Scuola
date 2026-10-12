/* Short synthesized cartoon sounds; audio starts only after a user gesture. */
(() => {
  'use strict';
  const button=document.getElementById('sound'),KEY='meucci-gps-sound-v1';
  let enabled=false,unavailable=false,context=null,master=null,noiseBuffer=null;
  const lastPlayed=new Map();
  try{enabled=localStorage.getItem(KEY)==='1';}catch(_){/* Optional preference. */}
  function update(){
    button.textContent=unavailable?'Suoni non disponibili':`♫ Suoni: ${enabled?'accesi':'spenti'}`;
    button.setAttribute('aria-pressed',String(enabled));button.disabled=unavailable;
    button.title=enabled?'Tocca per spegnere i suoni':'Tocca per accendere i suoni';
  }
  async function arm(){
    if(!enabled||unavailable)return;
    try{
      if(!context){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)throw new Error('Audio unavailable');
        context=new Audio();master=context.createGain();master.gain.value=.22;
        const compressor=context.createDynamicsCompressor();compressor.threshold.value=-20;compressor.ratio.value=4;
        master.connect(compressor);compressor.connect(context.destination);
        noiseBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.8),context.sampleRate);
        const samples=noiseBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      }
      await context.resume();master.gain.setTargetAtTime(enabled?.22:0,context.currentTime,.025);
    }catch(_){enabled=false;unavailable=true;update();}
  }
  function tone(frequency,end,duration,volume,type='sine',delay=0){
    const now=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(end,now+duration);
    gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain);gain.connect(master);osc.start(now);osc.stop(now+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function noise(duration,volume,cutoff,delay=0){
    const now=context.currentTime+delay,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=noiseBuffer;filter.type='lowpass';filter.frequency.value=cutoff;
    gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(volume,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    source.connect(filter);filter.connect(gain);gain.connect(master);source.start(now);source.stop(now+duration+.02);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  function play(kind){
    if(!enabled||!context||context.state!=='running')return;
    const now=context.currentTime,cooldown=kind==='jar'?.12:kind==='lift'?1:kind==='bell'?2:.18;
    if(now-(lastPlayed.get(kind)??-10)<cooldown)return;lastPlayed.set(kind,now);
    if(kind==='dragon'){noise(.55,.6,850);tone(95,45,.5,.2,'sawtooth');}
    else if(kind==='storm'){noise(.45,.5,1500);tone(90,28,.65,.4,'triangle');noise(.1,.25,4200);}
    else if(kind==='spring'){tone(170,680,.16,.5,'triangle');tone(680,110,.24,.35,'triangle',.14);}
    else if(kind==='stamp'){noise(.09,.35,1200);tone(150,65,.15,.5,'triangle');}
    else if(kind==='trap'){tone(230,85,.22,.35,'triangle');noise(.12,.2,650);}
    else if(kind==='jar'){tone(430,160,.12,.38);tone(1550,1420,.18,.2,'sine',.025);}
    else if(kind==='lift'){noise(.22,.09,350);tone(58,85,.25,.12);}
    else if(kind==='bell'){[784,659,523].forEach((n,i)=>tone(n,n*.99,.38,.35,'sine',i*.16));}
  }
  button.addEventListener('click',async()=>{
    enabled=!enabled;update();
    if(enabled){await arm();play('jar');}else if(context)master.gain.setTargetAtTime(0,context.currentTime,.025);
    try{localStorage.setItem(KEY,enabled?'1':'0');}catch(_){/* Keep the in-session choice. */}
    update();
  });
  document.addEventListener('visibilitychange',()=>{
    if(context&&document.hidden)context.suspend().catch(()=>{});
    else if(context&&enabled)arm();
  });
  window.GpsAudio={arm,play,get enabled(){return enabled;}};update();
})();
