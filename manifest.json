/* ===== Splash ===== */
(function(){
  const splash = document.getElementById('splash');
  const startBtn = document.getElementById('startBtn');
  const bgm = document.getElementById('bgm');
  function safePlay(){ try{ const p=bgm.play(); if(p&&p.catch) p.catch(()=>{});}catch{} }
  function hide(){ if(!splash) return; splash.classList.add('hide'); setTimeout(()=>{ try{splash.remove();}catch{} },600); }
  function begin(){ hide(); safePlay(); }
  startBtn?.addEventListener('click', begin, {once:true});
  splash?.addEventListener('pointerdown', begin, {once:true});
  setTimeout(begin, 2500);
})();

/* ===== MAIN GAME ===== */
const IS_MOBILE = matchMedia('(max-width:640px)').matches;
const DIP_PX=60, WAVES=10, WAVE_AMP=6, WAVE_GAP=16, TUK_DEF={w:140,h:90,speed:35};

const headerEl = document.querySelector('header');
const bgEl = document.getElementById('bgLayer');
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

function getVh(){ const v=visualViewport; return v ? v.height : innerHeight; }
function syncHeaderAndSize(){
  const h = headerEl.offsetHeight;
  document.documentElement.style.setProperty('--hdr', h + 'px');
  canvas.width  = innerWidth;
  canvas.height = Math.max(1, Math.floor(getVh() - h));
}
addEventListener('resize', ()=>requestAnimationFrame(syncHeaderAndSize));
addEventListener('orientationchange', syncHeaderAndSize);
syncHeaderAndSize();

function mobileAnchors(){
  const ar = innerHeight / Math.max(1, innerWidth);
  if (ar >= 1.95) return { waterPct: 82, roadPct: 96, tuk:{w:132,h:84,speed:36}, krSize:64 };
  if (ar >= 1.35) return { waterPct: 80, roadPct: 95, tuk:{w:138,h:88,speed:35}, krSize:64 };
  return               { waterPct: 78, roadPct: 94, tuk:{w:146,h:90,speed:34}, krSize:65 };
}
function anchoredYFromBg(pct){
  const cr=canvas.getBoundingClientRect();
  const br=bgEl?.getBoundingClientRect?.();
  if (br && br.height>0) return Math.max(0, Math.min(Math.round((br.top - cr.top) + (br.height * (pct/100))), canvas.height));
  return Math.round(canvas.height * (pct/100));
}
function waterY(){ return IS_MOBILE ? anchoredYFromBg(mobileAnchors().waterPct) : Math.round(canvas.height*0.80); }
function roadYFromBackground(){ return IS_MOBILE ? anchoredYFromBg(mobileAnchors().roadPct) : anchoredYFromBg(95); }

/* assets */
function loadImage(src){ return new Promise(r=>{ const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=src; }); }
const KR_SRCS=["images/kt1.png","images/kt2.png","images/kt3.png","images/kt4.png","images/kt5.png"];
const TUK_SRC="images/tuktuk.png", LOGO_SRC="images/logo.png";
let tukImg=null, logoImg=null, krImgs=[];
(async()=>{
  tukImg=await loadImage(TUK_SRC); logoImg=await loadImage(LOGO_SRC);
  for(const s of KR_SRCS) krImgs.push(await loadImage(s));
  const li=document.getElementById('loadInfo'); if(li) li.textContent='โหลดเสร็จแล้ว';
})();

/* audio */
const bgm = document.getElementById('bgm');
function safePlay(){ try{ const p=bgm.play(); if(p&&p.catch) p.catch(()=>{});}catch{} }
function toggleMusic(){ if(bgm.paused) safePlay(); else bgm.pause(); }
document.getElementById('tapMusic').onclick = toggleMusic;
document.getElementById('tapMusicMb').onclick = toggleMusic;

/* storage + wish list */
const LS_COUNT="loy.count", LS_WISHES="loy.wishes.queue", LS_SEQ="loy.seq", LS_LOG="loy.wishes.log";
let total=+(localStorage.getItem(LS_COUNT)||0), seq=+(localStorage.getItem(LS_SEQ)||0);
const statEl=document.getElementById('statCount'); if(statEl) statEl.textContent=total;
function bump(){ total++; localStorage.setItem(LS_COUNT,total); if(statEl) statEl.textContent=total; }
function pushWish(t){
  let a=[]; try{ a=JSON.parse(localStorage.getItem(LS_WISHES)||"[]"); }catch{}
  seq++; localStorage.setItem(LS_SEQ,seq);
  const item={n:seq,w:(t||""),t:Date.now()};
  a.push(item); localStorage.setItem(LS_WISHES, JSON.stringify(a));
  let log=[]; try{ log=JSON.parse(localStorage.getItem(LS_LOG)||"[]"); }catch{}
  log.push(item); localStorage.setItem(LS_LOG, JSON.stringify(log));
  renderWish();
}
function renderWish(){
  let a=[]; try{ a=JSON.parse(localStorage.getItem(LS_WISHES)||"[]"); }catch{}
  const v=a.slice(-6);
  const ul=document.getElementById('wishList');
  if (!ul) return;
  ul.innerHTML = v.map(x=>`<li><span class="num">คนที่ ${x.n}</span>🕯️ ${x.w}</li>`).join("");
}
renderWish();

/* controls */
const wishEl=document.getElementById('wish'), toast=document.getElementById('toast');
function showToast(){ toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),700); }
function haptic(){ if('vibrate' in navigator) try{ navigator.vibrate(12); }catch{} }
document.getElementById('launch').onclick = () => { const t=(wishEl.value||"").trim(); launch(t); wishEl.value=""; showToast(); haptic(); };
document.getElementById('tapLaunch').onclick = ()=>{ launch(""); showToast(); haptic(); };
canvas.addEventListener('click', ()=>{ launch(""); showToast(); haptic(); });
canvas.addEventListener('touchstart', ()=>{ launch(""); showToast(); haptic(); }, {passive:true});

/* Krathong */
class Krathong{
  constructor(img,t){
    this.img=img; this.text=t||"";
    this.size = IS_MOBILE ? mobileAnchors().krSize : 60;
    this.x=-120; this.vx=30+Math.random()*14;
    this.phase=Math.random()*Math.PI*2; this.amp=2.2; this.freq=.9+Math.random()*.5; this.t=0;
    this.y=this.computeY(0);
  }
  computeY(t){ return waterY()-this.size*.5 + DIP_PX + Math.sin(t*this.freq+this.phase)*this.amp; }
  update(dt){ this.x+=this.vx*dt; if(this.x>canvas.width+160) this.x=-160; this.t+=dt; this.y=this.computeY(this.t); }
  draw(g){
    const wy=waterY();
    const rx=this.size*.55, ry=6, grd=g.createRadialGradient(this.x,wy,1,this.x,wy,rx);
    grd.addColorStop(0,'rgba(0,0,0,.22)'); grd.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=grd;
    g.beginPath(); g.ellipse(this.x,wy,rx,ry,0,0,Math.PI*2); g.fill();
    if(this.img && this.img.complete && this.img.naturalWidth){
      g.drawImage(this.img,this.x-this.size/2,this.y-this.size/2,this.size,this.size);
    }else{ g.fillStyle='#27ae60'; g.beginPath(); g.arc(this.x,this.y,this.size/2,0,Math.PI*2); g.fill(); }
    if(this.text && this.text.trim()){
      const msg = clip(this.text.trim(), IS_MOBILE?18:22);
      g.save();
      g.font=`600 ${IS_MOBILE?13:16}px system-ui, -apple-system, 'TH Sarabun New', Prompt, sans-serif`;
      g.textAlign="center"; g.textBaseline="middle";
      const padX=10, h=(IS_MOBILE?13:16)*2.1, w=Math.min(320, Math.max(70, g.measureText(msg).width + padX*2));
      const cx=this.x, cy=this.y - this.size*0.9;
      g.globalAlpha=.92; g.fillStyle="#0e1726"; roundRect(g,cx-w/2,cy-h/2,w,h,14); g.fill();
      g.globalAlpha=1; g.strokeStyle="rgba(255,255,255,.28)"; g.lineWidth=1; roundRect(g,cx-w/2,cy-h/2,w,h,14); g.stroke();
      g.fillStyle="#e9f0ff"; g.fillText(msg,cx,cy);
      g.restore();
    }
  }
}
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function clip(s,max){ s=String(s||""); return s.length>max ? (s.slice(0,max-1)+'…') : s; }

const boats=[]; let nextKrIdx=0;
function launch(text){
  const imgs = krImgs.filter(Boolean);
  const im = imgs.length ? imgs[nextKrIdx % imgs.length] : null;
  nextKrIdx = (nextKrIdx + 1) % Math.max(1, imgs.length);
  boats.push(new Krathong(im, text||""));
  bump(); pushWish(text||"");
  if(boats.length>24) boats.splice(0, boats.length-24);
}

/* fireworks */
class Firework{
  constructor(x){ this.x=x; this.y=waterY(); this.vy=-280; this.state='rise'; this.parts=[]; }
  update(dt){
    if(this.state==='rise'){ this.y+=this.vy*dt; this.vy+=140*dt; if(this.vy>=-10) this.explode(); }
    else { for(const p of this.parts){ p.vx*=.99; p.vy+=70*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.a*=.985; } this.parts=this.parts.filter(p=>p.a>0.06); }
  }
  explode(){ this.state='explode'; for(let i=0;i<36;i++){ const a=i/36*Math.PI*2, sp=110+Math.random()*90; this.parts.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a:1}); } }
  draw(g){
    if(this.state==='rise'){ g.strokeStyle='rgba(255,220,120,.9)'; g.beginPath(); g.moveTo(this.x,this.y+16); g.lineTo(this.x,this.y); g.stroke(); }
    for(const p of this.parts){
      const R=64*p.a; g.save(); g.globalAlpha=p.a;
      if(logoImg && logoImg.complete && logoImg.naturalWidth){ g.drawImage(logoImg,p.x-R,p.y-R,R*2,R*2); }
      else { g.fillStyle='#fff'; g.beginPath(); g.arc(p.x,p.y,R,0,Math.PI*2); g.fill(); }
      g.restore();
    }
  }
}
const fireworks=[]; function spawnTriple(){ const w=canvas.width; [w*.25,w*.5,w*.75].forEach(x=>fireworks.push(new Firework(x))); }
spawnTriple(); setInterval(spawnTriple,10000);

/* tuk-tuk */
const tuk={x:-220,w:TUK_DEF.w,h:TUK_DEF.h,speed:TUK_DEF.speed};
if(IS_MOBILE){ const a=mobileAnchors(); Object.assign(tuk,a.tuk); }
function drawTuk(dt){
  tuk.x += tuk.speed*dt;
  if(tuk.x > canvas.width + 220) tuk.x = -220;
  let y = roadYFromBackground() - tuk.h;
  y = Math.max(waterY() + 6, Math.min(y, canvas.height - tuk.h));
  if(tukImg && tukImg.complete && tukImg.naturalWidth){ ctx.drawImage(tukImg, tuk.x, y, tuk.w, tuk.h); }
}

/* loop */
let last=performance.now(), waveT=0;
function drawWater(){
  const w=canvas.width,h=canvas.height,y=waterY();
  ctx.fillStyle='rgba(10,32,63,.96)'; ctx.fillRect(0,y,w,h-y);
  ctx.lineWidth=1.6; ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,.2)';
  for(let i=0;i<WAVES;i++){
    ctx.beginPath();
    for(let x=0;x<w;x+=20){
      const yy=y+Math.sin((x/40)+waveT*1.2+i)*WAVE_AMP+i*WAVE_GAP;
      if(x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
    }
    ctx.stroke();
  }
}
function loop(ts){
  const dt=Math.min(.033,(ts-last)/1000); last=ts; waveT+=dt;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawWater();
  for(const fw of fireworks){ fw.update(dt); fw.draw(ctx); }
  drawTuk(dt);
  const ordered=boats.slice().sort((a,b)=>a.y-b.y);
  for(const b of ordered){ b.update(dt); b.draw(ctx); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* export CSV */
document.getElementById('exportStat').onclick=()=>{
  let log=[]; try{ log=JSON.parse(localStorage.getItem("loy.wishes.log")||"[]"); }catch{}
  const rows=[["seq","timestamp","ISO","wish"]];
  for(const x of log){ const iso=new Date(x.t||Date.now()).toISOString(); rows.push([x.n, x.t, iso, (x.w||"").replace(/"/g,'""')]); }
  const csv=rows.map(r=>r.map(v=>`"${String(v)}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="loykrathong_stat.csv";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
};

/* PWA register */
if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}
