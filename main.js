// Singleton guard ป้องกันโหลดซ้ำ
if (!window.__loyInit) { window.__loyInit = true; (function(){
/* ===== Core tune ===== */
const WATER_PCT = 0.80;     // ระดับผิวน้ำ (สัดส่วนสูงจอ)
const ROAD_DY   = 0;        // เส้นแดง = ขอบน้ำ (0 = ตรงกันพอดี)
const LANE_STEP = 16;
const KR_SIZE   = 60;
const MAX_BOATS = 20;

/* ===== Elements ===== */
const cvs   = document.getElementById('scene');
const ctx   = cvs.getContext('2d');
const wishEl= document.getElementById('wish');
const statEl= document.getElementById('statCount');
const bgm   = document.getElementById('bgm');
const splash= document.getElementById('splash');
const loadInfo=document.getElementById('loadInfo');

/* ===== Helpers / Assets ===== */
const rnd=(a,b)=>Math.random()*(b-a)+a;
function loadImage(src){ return new Promise(res=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>res(null); im.src=src; });}

let kimgs=[], logoImg=null;
(async()=>{
  logoImg = await loadImage('images/logo.png'); mark();
  const srcs = ['kt1.png','kt2.png','kt3.png','kt4.png','kt5.png'].map(n=>'images/'+n);
  for(const s of srcs){ kimgs.push(await loadImage(s)); mark(); }
})();
let ready=0,total=6; function mark(){ ready++; if(loadInfo) loadInfo.textContent=`โหลดแล้ว ${ready}/${total}`; }

/* ===== Layout ===== */
function setHdrVar(){ const h=document.getElementById('hdr').offsetHeight; document.documentElement.style.setProperty('--hdr', h+'px'); }
function sizeCanvas(){
  setHdrVar();
  const rect = document.getElementById('stage').getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio||1, 2);
  cvs.style.width  = rect.width + 'px';
  cvs.style.height = rect.height + 'px';
  const needW = Math.round(rect.width * dpr);
  const needH = Math.round(rect.height * dpr);
  if (cvs.width !== needW || cvs.height !== needH){
    cvs.width = needW; cvs.height = needH;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
}
addEventListener('resize', sizeCanvas);
addEventListener('orientationchange', sizeCanvas);
if (window.visualViewport) visualViewport.addEventListener('resize', sizeCanvas);
setTimeout(sizeCanvas, 0);

/* ===== Stats (localStorage) ===== */
const LS_COUNT='loy.count', LS_WQ='loy.wishes.queue', LS_SEQ='loy.seq', LS_LOG='loy.wishes.log';
let total=+(localStorage.getItem(LS_COUNT)||0), seq=+(localStorage.getItem(LS_SEQ)||0);
statEl.textContent = total;
function bump(){ total++; localStorage.setItem(LS_COUNT,total); statEl.textContent=total; }
function renderWish(){
  let a=[]; try{ a=JSON.parse(localStorage.getItem(LS_WQ)||"[]"); }catch{}
  const ul=document.getElementById('wishList');
  ul.innerHTML=a.slice(-7).map(x=>`<li><span class="num">คนที่ ${x.n}</span>🕯️ ${escapeHtml(x.w)}</li>`).join('');
}
function pushWish(t){
  let q=[]; try{ q=JSON.parse(localStorage.getItem(LS_WQ)||"[]"); }catch{}
  seq++; localStorage.setItem(LS_SEQ,seq);
  const item={n:seq,w:(t||''),t:Date.now()};
  q.push(item); localStorage.setItem(LS_WQ,JSON.stringify(q));
  let log=[]; try{ log=JSON.parse(localStorage.getItem(LS_LOG)||"[]"); }catch{}
  log.push(item); localStorage.setItem(LS_LOG,JSON.stringify(log));
  renderWish();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
renderWish();

/* ===== Anchors ===== */
function waterY(){ return cvs.clientHeight * WATER_PCT; }
function roadY (){ return waterY() + ROAD_DY; }

/* ===== Krathong ===== */
class Krathong{
  constructor(img, lane, offset){
    this.img=img; this.lane=lane; this.size=KR_SIZE;
    this.x=-220-offset; this.vx=rnd(22,28);
    this.phase=rnd(0,Math.PI*2); this.amp=2; this.freq=1.0; this.t=0;
    this.text='';
  }
  setWish(s){ this.text=(s||'').trim(); }
  get y(){ return waterY() + 22 + this.lane*LANE_STEP + Math.sin(this.t*this.freq+this.phase)*this.amp; }
  update(dt){
    this.t+=dt; this.x+=this.vx*dt;
    if(this.x>cvs.clientWidth+160) this.x=-160-rnd(0,120);
  }
  draw(g){
    const wy=waterY(), rx=this.size*.55;
    const grd=g.createRadialGradient(this.x,wy,1,this.x,wy,rx);
    grd.addColorStop(0,'rgba(0,0,0,.22)'); grd.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grd; g.beginPath(); g.ellipse(this.x,wy,rx,6,0,0,Math.PI*2); g.fill();
    if(this.img && this.img.naturalWidth) g.drawImage(this.img,this.x-this.size/2,this.y-this.size/2,this.size,this.size);
    if(this.text){
      const msg=this.text.length>22?(this.text.slice(0,21)+'…'):this.text;
      g.save(); g.font="600 15px system-ui,'TH Sarabun New',Prompt,sans-serif";
      g.textAlign="center"; g.textBaseline="middle";
      const pad=12, w=Math.min(320, g.measureText(msg).width+pad*2), h=26;
      const cx=this.x, cy=this.y - this.size*.75;
      roundRect(g,cx-w/2,cy-h/2,w,h,14); g.globalAlpha=.88; g.fillStyle="#0e1726"; g.fill();
      g.globalAlpha=1; g.strokeStyle="rgba(255,255,255,.25)"; g.lineWidth=1; roundRect(g,cx-w/2,cy-h/2,w,h,14); g.stroke();
      g.fillStyle="#e9f0ff"; g.fillText(msg,cx,cy); g.restore();
    }
  }
}
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }

/* เรือเริ่มต้น 5 ใบ คนละเลน */
const krImgs = kimgs; // ใช้หลังโหลดเสร็จ
const boats = [];
for(let i=0;i<5;i++) boats.push(new Krathong(null,i,i*120)); // ภาพจะมาใส่เมื่อโหลดเสร็จ
// หลังรูปโหลดเสร็จ ค่อยอัปเดตรูปให้แต่ละใบ
const imgSetTimer = setInterval(()=>{
  if (kimgs.filter(Boolean).length){ for(let i=0;i<boats.length;i++){ boats[i].img = kimgs[i % kimgs.length]; } clearInterval(imgSetTimer); }
}, 300);

/* เลือกใบ “ซ้ายสุด” เพื่อผูกข้อความ */
function leftMostBoat(){ let b=boats[0], m=boats[0].x; for(const k of boats){ if(k.x<m){ m=k.x; b=k; } } return b; }

/* ===== Fireworks (โลโก้) ===== */
class Firework{
  constructor(x){ this.x=x; this.y=waterY(); this.vy=-240; this.state='rise'; this.parts=[]; }
  update(dt){
    if(this.state==='rise'){ this.y+=this.vy*dt; this.vy+=110*dt; if(this.vy>=-10){ this.state='explode'; this.explode(); } }
    else { for(const p of this.parts){ p.vx*=.99; p.vy+=70*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.a*=.985; }
           this.parts=this.parts.filter(p=>p.a>0.06); }
  }
  explode(){ for(let i=0;i<24;i++){ const a=i/24*Math.PI*2, sp=100+rnd(0,60); this.parts.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a:1}); } }
  draw(g){
    if(this.state==='rise'){ g.strokeStyle='rgba(255,220,120,.9)'; g.beginPath(); g.moveTo(this.x,this.y+16); g.lineTo(this.x,this.y); g.stroke(); }
    for(const p of this.parts){
      const R=56*p.a; g.save(); g.globalAlpha=p.a;
      if(logoImg && logoImg.naturalWidth) g.drawImage(logoImg,p.x-R,p.y-R,R*2,R*2);
      else { g.fillStyle='#fff'; g.beginPath(); g.arc(p.x,p.y,R,0,Math.PI*2); g.fill(); }
      g.restore();
    }
  }
}
const fireworks=[]; function spawnTriple(){ const w=cvs.clientWidth; [w*.22,w*.5,w*.78].forEach(x=>fireworks.push(new Firework(x))); }
setTimeout(spawnTriple,2500); setInterval(spawnTriple,12000);

/* ===== Tuk & Road (เส้นแดง = ขอบน้ำ) ===== */
const tukImg = new Image(); tukImg.src='images/tuktuk.png';
const tuk={x:-220,w:140,h:90,speed:35};
function drawRoadLine(){ const y=roadY(); ctx.strokeStyle='#ff4444'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cvs.clientWidth,y); ctx.stroke(); }
function drawTuk(dt){
  tuk.x+=tuk.speed*dt; if(tuk.x>cvs.clientWidth+220) tuk.x=-220;
  const y = Math.min( roadY()-tuk.h-2, cvs.clientHeight - tuk.h - 2 );
  if(tukImg.complete) ctx.drawImage(tukImg,tuk.x,y,tuk.w,tuk.h);
}

/* ===== Water (ชนพื้นหลัง) ===== */
let waveT=0,last=performance.now();
function drawWater(){
  const w=cvs.clientWidth, h=cvs.clientHeight, y=waterY();
  ctx.fillStyle='rgba(10,32,63,.96)'; ctx.fillRect(0,y,w,h-y);
  ctx.lineWidth=1.6; ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,.20)';
  for(let i=0;i<10;i++){
    ctx.beginPath();
    for(let x=0;x<w;x+=20){
      const yy=y + Math.sin((x/40)+waveT*1.2+i)*6 + i*16;
      if(x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
    }
    ctx.stroke();
  }
}

/* ===== Loop ===== */
function loop(ts){
  const dt=Math.min(.033,(ts-last)/1000); last=ts; waveT+=dt;
  ctx.clearRect(0,0,cvs.clientWidth,cvs.clientHeight);
  drawWater(); drawRoadLine();
  fireworks.forEach(f=>{ f.update(dt); f.draw(ctx); });
  drawTuk(dt);
  boats.forEach(b=>b.update(dt));
  boats.forEach(b=>b.draw(ctx));
  requestAnimationFrame(loop);
}

/* ===== Controls ===== */
function launchNow(text){
  // เติมเรือจนถึง MAX_BOATS
  if (boats.length < MAX_BOATS){
    const lane = boats.length % 5;
    const im = kimgs.filter(Boolean)[lane % Math.max(1,kimgs.length)] || null;
    const b = new Krathong(im, lane, 0);
    b.x = -180 - Math.random()*140; boats.push(b);
  }
  if (text) leftMostBoat().setWish(text);
  bump(); pushWish(text||"");
}
document.getElementById('launch').onclick = ()=>{ const t=(wishEl.value||'').trim(); wishEl.value=""; launchNow(t); };
wishEl.addEventListener('keydown', e=>{ if(e.key==="Enter"){ document.getElementById('launch').click(); }});

document.getElementById('toggleBgm').onclick = async ()=>{
  try{ if (bgm.paused){ await bgm.play(); } else { bgm.pause(); } }catch{}
};
document.getElementById('exportStat').onclick = ()=>{
  let log=[]; try{ log=JSON.parse(localStorage.getItem(LS_LOG)||"[]"); }catch{}
  const rows=[["seq","timestamp","ISO","wish"]];
  for(const x of log){ const iso=new Date(x.t||Date.now()).toISOString();
    rows.push([x.n,x.t,iso,(x.w||"").replace(/"/g,'""')]); }
  const csv=rows.map(r=>r.map(v=>`"${String(v)}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="loykrathong_stat.csv";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
};
document.getElementById('resetStat').onclick=()=>{
  if(confirm("ยืนยันเริ่มนับใหม่และลบคำอธิษฐานทั้งหมด?")){
    [LS_COUNT,LS_WQ,LS_SEQ,LS_LOG].forEach(k=>localStorage.removeItem(k));
    total=0; seq=0; statEl.textContent=0; boats.length=0; renderWish();
  }
};

/* ===== Splash: เริ่มฉากหลังแตะ ===== */
document.getElementById('startBtn').onclick = async ()=>{
  splash.classList.add('hide');
  try{ await bgm.play(); }catch{}
  setTimeout(()=>splash.remove?.(), 350);
  requestAnimationFrame(loop);
};

})(); } // end singleton
