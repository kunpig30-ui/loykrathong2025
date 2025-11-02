/* v7.3 — stable: background shift, water, road line, krathong flow, tuk on red line, logo fireworks */

// --- Responsive tune (mobile friendly) ---
let BG_SHIFT_PX  = -34;   // จะถูกปรับอัตโนมัติจากฟังก์ชัน layoutByAspect()
let WATER_FACTOR = 0.76;  // ยิ่งน้อย น้ำยิ่งสูงขึ้น (ภาพไม่จม)
let ROAD_DY      = 14;    // ระยะเส้นแดงจากผิวน้ำ

const LANES       = 5;
const LANE_STEP   = 16;
const BUBBLE_PADY = 0.90;
const KR_SIZE     = 60;

// ใช้กับ <img id="bgLayer"> ถ้ามี
const bgEl = document.getElementById('bgLayer');
function applyBgShift() {
  document.documentElement.style.setProperty('--bg-shift', `${BG_SHIFT_PX}px`);
  if (bgEl) bgEl.style.transform = `translateY(${BG_SHIFT_PX}px)`;
}

// คำนวณค่าตามอัตราส่วนจอ (ยืดหยุ่นกับมือถือ)
function layoutByAspect() {
  const vh = (window.visualViewport?.height || innerHeight);
  const ar = vh / Math.max(1, innerWidth);  // aspect ratio (สูง/กว้าง)
  if (ar > 2.0) {         // จอสูงมาก (มือถือหน้าจอยาว)
    BG_SHIFT_PX  = -72;
    WATER_FACTOR = 0.74;
    ROAD_DY      = 12;
  } else if (ar > 1.6) {  // มือถือทั่วไป
    BG_SHIFT_PX  = -54;
    WATER_FACTOR = 0.75;
    ROAD_DY      = 13;
  } else if (ar > 1.3) {  // แท็บเล็ตแนวตั้ง / มือถือกว้าง
    BG_SHIFT_PX  = -40;
    WATER_FACTOR = 0.76;
    ROAD_DY      = 14;
  } else {                // จอกว้าง
    BG_SHIFT_PX  = -26;
    WATER_FACTOR = 0.78;
    ROAD_DY      = 15;
  }
  applyBgShift();
}
layoutByAspect();


/* ---------- ELEMENTS ---------- */
const cvs    = document.getElementById('scene');
const ctx    = cvs.getContext('2d');
const header = document.querySelector('header');

const wishEl = document.getElementById('wish');
const toast  = document.getElementById('toast');
const bgm    = document.getElementById('bgm');

/* ยกภาพพื้นหลังขึ้นเพื่อลดแถบดำด้านบน */
const bgEl = document.getElementById('bgLayer');
if (bgEl) bgEl.style.transform = `translateY(${BG_SHIFT_PX}px)`;
/* ---------- SIZE ---------- */
function size(){
  const h = header ? header.offsetHeight : 0;
  cvs.width  = innerWidth;
  cvs.height = Math.max(1, (window.visualViewport?.height || innerHeight) - h);
  document.documentElement.style.setProperty('--hdr', h + 'px');

  // NEW: ปรับค่าพื้นหลัง/น้ำ/เส้นแดงให้เข้ากับจอปัจจุบัน
  layoutByAspect();
}
addEventListener('resize', ()=>requestAnimationFrame(size));
addEventListener('orientationchange', size);
size();

/* ---------- HELPERS ---------- */
const rnd = (a,b)=> Math.random()*(b-a)+a;
function makeImg(path){
  const i = new Image();
  i.crossOrigin = 'anonymous';
  i.decoding    = 'async';
  i.onload      = ()=> i._ok = true;
  i.onerror     = ()=> console.warn('image not found:', path);
  i.src         = path + VER_SUFFIX;
  return i;
}
function showToast(){ if(!toast) return; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),700); }

/* ผิวน้ำ/ถนน/เลน */
const waterY = () => Math.round(cvs.height * WATER_FACTOR);
const roadY  = () => waterY() + ROAD_DY;

function laneY(i){
  // ยกให้ต่ำลงเล็กน้อย เพื่อไม่ชนขอบน้ำด้านบน
  return waterY() + 22 + i * LANE_STEP;
}

/* ---------- ASSETS ---------- */
const tukImg  = makeImg('images/tuktuk.png');
const logoImg = makeImg('images/logo.png');
const krImgs  = ['kt1.png','kt2.png','kt3.png','kt4.png','kt5.png'].map(n=> makeImg('images/'+n));

bgm?.addEventListener('error', e=>console.warn('audio error', e));

/* ---------- STATS (localStorage) ---------- */
const LS_COUNT="loy.count", LS_WQ="loy.wishes.queue", LS_SEQ="loy.seq", LS_LOG="loy.wishes.log";
let total = +(localStorage.getItem(LS_COUNT)||0);
let seq   = +(localStorage.getItem(LS_SEQ)||0);
const statEl = document.getElementById('statCount');
if (statEl) statEl.textContent = total;

function bump(){ total++; localStorage.setItem(LS_COUNT, total); if (statEl) statEl.textContent = total; }
function pushWish(t){
  let q=[]; try{ q = JSON.parse(localStorage.getItem(LS_WQ)||'[]'); }catch{}
  seq++; localStorage.setItem(LS_SEQ, seq);
  const item = { n:seq, w:(t||''), t:Date.now() };
  q.push(item); localStorage.setItem(LS_WQ, JSON.stringify(q));
  let log=[]; try{ log = JSON.parse(localStorage.getItem(LS_LOG)||'[]'); }catch{}
  log.push(item); localStorage.setItem(LS_LOG, JSON.stringify(log));
  renderWish();
}
function renderWish(){
  let q=[]; try{ q = JSON.parse(localStorage.getItem(LS_WQ)||'[]'); }catch{}
  const ul = document.getElementById('wishList'); if(!ul) return;
  ul.innerHTML = q.slice(-6).map(x=>`<li><span class="num">คนที่ ${x.n}</span>🕯️ ${x.w}</li>`).join('');
}
renderWish();

/* ---------- KRATHONG ---------- */
class Krathong{
  constructor(img,lane,offset){
    this.img=img; this.lane=lane; this.size=KR_SIZE;
    this.x  = -220 - offset;           // เริ่มเหลื่อมกันไม่เกาะกลุ่ม
    this.vx = rnd(22,28);
    this.phase=rnd(0,Math.PI*2); this.amp=2; this.freq=1.0; this.t=0;
    this.text='';
  }
  setWish(s){ this.text=(s||'').trim(); }
  get y(){ return laneY(this.lane)+Math.sin(this.t*this.freq+this.phase)*this.amp; }
  update(dt){
  this.t += dt;
  this.x += this.vx * dt;

  if (this.x > cvs.width + 160){
    this.x   = -160 - Math.random()*120;
    this.text = '';                    // ← เคลียร์คำอธิษฐานเก่าเมื่อเริ่มรอบใหม่
  }
}
  draw(g){
    const wy = waterY(), rx=this.size*.55, ry=6;
    // เงาที่ผิวน้ำ
    const grd=g.createRadialGradient(this.x,wy,1,this.x,wy,rx);
    grd.addColorStop(0,'rgba(0,0,0,.22)'); grd.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grd; g.beginPath(); g.ellipse(this.x,wy,rx,ry,0,0,Math.PI*2); g.fill();
    // ตัวกระทง
    if (this.img && this.img._ok){
      g.drawImage(this.img, this.x-this.size/2, this.y-this.size/2, this.size, this.size);
    } else {
      g.fillStyle='#27ae60'; g.beginPath(); g.arc(this.x,this.y,this.size/2,0,Math.PI*2); g.fill();
    }
    // ฟองคำอธิษฐาน (ติดตามจนสุดขวา)
    if (this.text){
      const msg=this.text;
      g.save();
      g.font=(innerWidth<=420? "600 14px":"600 16px")+" system-ui,'TH Sarabun New',Prompt,sans-serif";
      g.textAlign="center"; g.textBaseline="middle";
      const padX=12, h=28, w=Math.min(340, Math.max(80, g.measureText(msg).width+padX*2));
      const cx=this.x, cy=this.y - this.size*BUBBLE_PADY;
      g.globalAlpha=.92; g.fillStyle="#0e1726";
      roundRect(g, cx-w/2, cy-h/2, w, h, 14); g.fill();
      g.globalAlpha=1; g.strokeStyle="rgba(255,255,255,.28)"; g.lineWidth=1;
      roundRect(g, cx-w/2, cy-h/2, w, h, 14); g.stroke();
      g.fillStyle="#e9f0ff"; g.fillText(msg, cx, cy);
      g.restore();
    }
  }
}
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }

/* 5 ใบ คนละเลน + offset ไม่ชนกัน */
const boats = krImgs.map((im,i)=> new Krathong(im, i % LANES, i*120));
let nextIdx = 0;   // ตัวชี้ round-robin

/* เลือกใบ “ซ้ายสุด” เพื่อให้ปล่อยซ้าย→ขวา */
function takeNextBoat(){
  // เลือกใบที่พร้อมจะออกจากซ้าย (ยังอยู่นอกจอทางซ้าย)
  const ready = boats.filter(b => b.x < -120);
  if (ready.length){
    // ซ้ายสุดของกลุ่ม ready
    return ready.reduce((a,b)=> (a.x < b.x ? a : b));
  }
  // ถ้าไม่มีใบพร้อม ให้ใช้รอบแบบลูป
  const b = boats[nextIdx];
  nextIdx = (nextIdx + 1) % boats.length;
  return b;
}

/* ---------- LAUNCH BUTTON ---------- */
function onLaunchClick(){
  const t = (wishEl?.value || '').trim();
  if (t){ const b = pickNextBoat(); b.setWish(t); }
  if (wishEl) wishEl.value = '';
  bump(); pushWish(t); showToast();
  try{
    if (bgm && bgm.paused){ bgm.currentTime=0; bgm.play().catch(()=>{}); }
  }catch{}
}
const launchBtn = document.getElementById('launch')?.addEventListener('click', async ()=>{
  try{
    const btn = document.getElementById('launch');
    if (!btn || btn.disabled) return;
    btn.disabled = true;

    const t = (wishEl?.value || '').trim();
    if (t) {
      const b = takeNextBoat();   // ← ใช้ตัวเลือกใหม่
      b.setWish(t);
    }
    if (wishEl) wishEl.value = '';

    bump(); pushWish(t); showToast();
    if (bgm && bgm.paused){ bgm.currentTime=0; await bgm.play().catch(()=>{}); }
  } finally {
    setTimeout(()=>{ const b=document.getElementById('launch'); if(b) b.disabled=false; }, 500);
  }
});

/* ---------- FIREWORKS (3 จุด, โลโก้) ---------- */
class Firework{
  constructor(x){ this.x=x; this.y=waterY(); this.vy=-240; this.state='rise'; this.parts=[]; }
  update(dt){
    if (this.state==='rise'){
      this.y += this.vy*dt; this.vy += 110*dt;
      if (this.vy >= -10){ this.state='explode'; this.explode(); }
    } else {
      for (const p of this.parts){ p.vx*=.99; p.vy+=70*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.a*=.985; }
      this.parts = this.parts.filter(p=>p.a>0.06);
    }
  }
  explode(){
    for (let i=0;i<20;i++){
      const a=i/20*Math.PI*2, sp=100+rnd(0,60);
      this.parts.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a:1});
    }
  }
  draw(g){
    if (this.state==='rise'){ g.strokeStyle='rgba(255,220,120,.9)'; g.beginPath(); g.moveTo(this.x,this.y+16); g.lineTo(this.x,this.y); g.stroke(); }
    for (const p of this.parts){
      const R=56*p.a; g.save(); g.globalAlpha=p.a;
      if (logoImg && logoImg._ok) g.drawImage(logoImg, p.x-R, p.y-R, R*2, R*2);
      else { g.fillStyle='#fff'; g.beginPath(); g.arc(p.x,p.y,R,0,Math.PI*2); g.fill(); }
      g.restore();
    }
  }
}
const fireworks=[];
function spawnTriple(){ const w=cvs.width; [w*0.22,w*0.50,w*0.78].forEach(x=>fireworks.push(new Firework(x))); }
setTimeout(spawnTriple, 2500); setInterval(spawnTriple, 12000);

/* ---------- ROAD & TUK ---------- */
const tuk = { x:-220, w:140, h:90, speed:35 };
function drawRoadLine(){
  const y = roadY();
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cvs.width, y); ctx.stroke();
}
function drawTuk(dt){
  tuk.x += tuk.speed * dt;
  if (tuk.x > cvs.width + 220) tuk.x = -220;

  // วางให้ล้อติดบนเส้นแดงนิด ๆ
  const y = roadY() - tuk.h + 6;    // ← ไม่มี Math.max(waterY()+6, y) อีกแล้ว!
  if (tukImg && tukImg._ok) ctx.drawImage(tukImg, tuk.x, y, tuk.w, tuk.h);
}

/* ---------- WATER (คลื่น) ---------- */
let waveT=0, last=performance.now();
function drawWater(){
  const y=waterY();
  ctx.fillStyle='rgba(10,32,63,.96)'; ctx.fillRect(0,y,cvs.width,cvs.height-y);
  ctx.lineWidth=1.6; ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,.2)';
  for(let i=0;i<10;i++){
    ctx.beginPath();
    for(let x=0;x<cvs.width;x+=20){
      const yy=y + Math.sin((x/40)+waveT*1.2+i)*6 + i*16;
      if(x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
    }
    ctx.stroke();
  }
}

/* ---------- LOOP ---------- */
function loop(ts){
  const dt=Math.min(.033,(ts-last)/1000); last=ts; waveT+=dt;
  ctx.clearRect(0,0,cvs.width,cvs.height);
  drawWater(); drawRoadLine();
  fireworks.forEach(f=>{ f.update(dt); f.draw(ctx); });
  drawTuk(dt);
  boats.forEach(b=>b.update(dt));
  boats.forEach(b=>b.draw(ctx));
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- CSV EXPORT ---------- */
document.getElementById('exportStat')?.addEventListener('click', ()=>{
  let log=[]; try{ log=JSON.parse(localStorage.getItem('loy.wishes.log')||'[]'); }catch{}
  const rows=[["seq","timestamp","ISO","wish"]];
  for(const x of log){ const iso=new Date(x.t||Date.now()).toISOString(); rows.push([x.n,x.t,iso,(x.w||"").replace(/\"/g,'\"\"')]); }
  const csv=rows.map(r=>r.map(v=>`"${String(v)}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="loykrathong_stat.csv"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
