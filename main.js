/* v7 — fine tune: no-collision, wish sticks to end, higher lanes, raised anchors,
   tuk above road line, responsive to background image */
(function () {
  const cvs = document.getElementById('scene');
  const ctx = cvs.getContext('2d');
  const header = document.querySelector('header');
  const bgEl = document.getElementById('bgLayer');
  const IS_MOBILE = matchMedia('(max-width:640px)').matches;

  // ======== TUNE ME (จูนเร็ว) ========
const BG_DY   = -4;   // ยกพื้นหลังขึ้นเล็กน้อย
const ROAD_DY = +18;  // ดันเส้นถนนลง
const LANE_STEP = 14;
const LANE_SURFACE_LIFT = 10;  // ผิวน้ำใกล้พื้นจริง
const LANE_MAX_BELOW_ROAD = 16; // กันกระทงลอยสูงเกิน
// ===================================

  function size() {
    const h = header ? header.offsetHeight : 0;
    cvs.width  = innerWidth;
    cvs.height = Math.max(1, (window.visualViewport?.height || innerHeight) - h);
    document.documentElement.style.setProperty('--hdr', h + 'px');
  }
  addEventListener('resize', () => requestAnimationFrame(size));
  addEventListener('orientationchange', size);
  size();

  const V='?v=7';
  const makeImg = p => { const i=new Image(); i.crossOrigin='anonymous'; i.decoding='async';
    i.onload=()=>i._ok=true; i.onerror=()=>console.warn('image not found:', p); i.src=p+V; return i; };

  // assets
  const tukImg  = makeImg('images/tuktuk.png');
  const logoImg = makeImg('images/logo.png');
  const krImgs  = ['kt1.png','kt2.png','kt3.png','kt4.png','kt5.png'].map(n=>makeImg('images/'+n));

  // audio
  const bgm = document.getElementById('bgm');
  bgm?.addEventListener('error', e=>console.warn('audio error', e));

  // anchors from background
  function mobileAnchors(){
    const ar = innerHeight / Math.max(1, innerWidth);
    if (ar >= 1.95) return { waterPct: 82, roadPct: 96, kr: 64 };
    if (ar >= 1.35) return { waterPct: 80, roadPct: 95, kr: 64 };
    return               { waterPct: 78, roadPct: 94, kr: 65 };
  }
  function anchoredYFromBg(pct){
    if(!bgEl) return Math.round(cvs.height*(pct/100)) + BG_DY;
    const br=bgEl.getBoundingClientRect(), cr=cvs.getBoundingClientRect();
    return Math.max(0, Math.min(Math.round((br.top-cr.top)+(br.height*(pct/100)) + BG_DY), cvs.height));
  }
  function waterY(){ return IS_MOBILE ? anchoredYFromBg(mobileAnchors().waterPct) : Math.round(cvs.height*0.80)+BG_DY; }
  function roadY (){ return (IS_MOBILE ? anchoredYFromBg(mobileAnchors().roadPct) : anchoredYFromBg(95)) + ROAD_DY; }
  function krSize(){ return IS_MOBILE ? mobileAnchors().kr : 60; }

  // storage / stat
  const LS_COUNT="loy.count", LS_WQ="loy.wishes.queue", LS_SEQ="loy.seq", LS_LOG="loy.wishes.log";
  let total=+(localStorage.getItem(LS_COUNT)||0), seq=+(localStorage.getItem(LS_SEQ)||0);
  const statEl=document.getElementById('statCount'); if(statEl) statEl.textContent=total;
  function bump(){ total++; localStorage.setItem(LS_COUNT,total); statEl&&(statEl.textContent=total); }
  function pushWish(t){
    let a=[]; try{ a=JSON.parse(localStorage.getItem(LS_WQ)||"[]"); }catch{}
    seq++; localStorage.setItem(LS_SEQ,seq);
    const item={n:seq,w:(t||""),t:Date.now()};
    a.push(item); localStorage.setItem(LS_WQ, JSON.stringify(a));
    let log=[]; try{ log=JSON.parse(localStorage.getItem(LS_LOG)||"[]"); }catch{}
    log.push(item); localStorage.setItem(LS_LOG, JSON.stringify(log));
    renderWish();
  }
  function renderWish(){
    let a=[]; try{ a=JSON.parse(localStorage.getItem(LS_WQ)||"[]"); }catch{}
    const ul=document.getElementById('wishList'); if(!ul) return;
    ul.innerHTML = a.slice(-6).map(x=>`<li><span class="num">คนที่ ${x.n}</span>🕯️ ${x.w}</li>`).join("");
  }
  renderWish();

  // lanes (no collision)
  function laneY(i){
    const base = waterY() - krSize()*0.5 + LANE_SURFACE_LIFT;
    // ไม่ให้สูงจนทับเส้นถนน
    const maxY = roadY() - LANE_MAX_BELOW_ROAD;
    return Math.min(base + i*LANE_STEP, maxY);
  }
  const rnd = (a,b)=>Math.random()*(b-a)+a;

  class Krathong{
    constructor(img,lane,offset){
      this.img=img; this.lane=lane;
      this.x = -220 - offset;                // กระจายตอนเริ่ม
      this.vx = rnd(22,28) + lane*0.6;       // ความเร็วต่างกันเล็กน้อยต่อเลน
      this.phase=rnd(0,Math.PI*2); this.amp=2; this.freq=1.0; this.t=0;
      this.text='';
    }
    setWish(s){ this.text=(s||'').trim(); }
    get y(){ return laneY(this.lane) + Math.sin(this.t*this.freq+this.phase)*this.amp; }
    update(dt){
      this.t+=dt; this.x+=this.vx*dt;
      // เมื่อวนกลับซ้าย ให้สุ่มหน่วงเพิ่มเพื่อไม่เกาะกลุ่ม
      if(this.x>cvs.width+160){ this.x = -160 - rnd(60,180); }
    }
    draw(g){
      const wy=waterY();
      // เงา
      const rx=krSize()*.55, ry=6;
      const grd=g.createRadialGradient(this.x,wy,1,this.x,wy,rx);
      grd.addColorStop(0,'rgba(0,0,0,.22)'); grd.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grd; g.beginPath(); g.ellipse(this.x,wy,rx,ry,0,0,Math.PI*2); g.fill();
      // ตัวกระทง
      if(this.img && this.img._ok) g.drawImage(this.img, this.x-krSize()/2, this.y-krSize()/2, krSize(), krSize());
      else{ g.fillStyle='#27ae60'; g.beginPath(); g.arc(this.x,this.y,krSize()/2,0,Math.PI*2); g.fill(); }
      // คำอธิษฐาน — ไม่หมดเวลา อยู่ไปจนพ้นจอขวา
      if(this.text){
        const msg = clip(this.text,(innerWidth<=420)?18:22);
        g.save();
        g.font = (innerWidth<=420?'600 14px':'600 16px')+" system-ui,'TH Sarabun New',Prompt,sans-serif";
        g.textAlign='center'; g.textBaseline='middle';
        const padX=12, h=28, w=Math.min(340, Math.max(80, g.measureText(msg).width + padX*2));
        const cx=this.x, cy=this.y - krSize()*0.9;
        g.globalAlpha=.92; g.fillStyle='#0e1726'; roundRect(g,cx-w/2,cy-h/2,w,h,14); g.fill();
        g.globalAlpha=1; g.strokeStyle='rgba(255,255,255,.28)'; g.lineWidth=1; roundRect(g,cx-w/2,cy-h/2,w,h,14); g.stroke();
        g.fillStyle='#e9f0ff'; g.fillText(msg,cx,cy);
        g.restore();
      }
    }
  }

  // 5 ใบ + offset กันซ้อนตั้งแต่เริ่ม
  const boats = krImgs.map((im,i)=> new Krathong(im, i, 90 + i*120));
  let nextIdx=0;

  // launch
  const wishEl=document.getElementById('wish');
  const toast =document.getElementById('toast');
  function showToast(){ toast?.classList.add('show'); setTimeout(()=>toast?.classList.remove('show'),700); }
 document.getElementById('launch')?.addEventListener('click', async ()=>{
  try {
    // ป้องกัน double-click ค้าง
    const btn = document.getElementById('launch');
    if (!btn || btn.disabled) return;
    btn.disabled = true;

    const t = (wishEl?.value || '').trim();
    if (t) {
      boats[nextIdx].setWish(t);
      nextIdx = (nextIdx + 1) % boats.length;
    }
    if (wishEl) wishEl.value = '';

    bump();
    pushWish(t);
    showToast();

    // ปรับ audio ให้ไม่โหลดซ้ำ
    if (bgm && bgm.paused) {
      bgm.currentTime = 0;
      await bgm.play().catch(err => console.warn('BGM play fail', err));
    }

    // เปิด animation loop ต่อได้ปกติ
    requestAnimationFrame(loop);
  } catch (e) {
    console.error('Launch error', e);
  } finally {
    setTimeout(()=>btn.disabled=false, 600); // ป้องกัน spam
  }
});

  // fireworks (3 จุด โลโก้)
  class Firework{
    constructor(x){ this.x=x; this.y=waterY(); this.vy=-240; this.state='rise'; this.parts=[]; }
    update(dt){
      if(this.state==='rise'){ this.y+=this.vy*dt; this.vy+=110*dt; if(this.vy>=-10){ this.state='explode'; this.explode(); } }
      else { for(const p of this.parts){ p.vx*=.99; p.vy+=70*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.a*=.985; } this.parts=this.parts.filter(p=>p.a>0.06); }
    }
    explode(){ const N=12; for(let i=0;i<N;i++){ const a=i/N*Math.PI*2, sp=100+rnd(0,50); this.parts.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a:1}); } }
    draw(g){
      if(this.state==='rise'){ g.strokeStyle='rgba(255,220,120,.9)'; g.beginPath(); g.moveTo(this.x,this.y+16); g.lineTo(this.x,this.y); g.stroke(); }
      for(const p of this.parts){ const R=56*p.a; g.save(); g.globalAlpha=p.a;
        if(logoImg && logoImg._ok) g.drawImage(logoImg,p.x-R,p.y-R,R*2,R*2);
        else{ g.fillStyle='#fff'; g.beginPath(); g.arc(p.x,p.y,R,0,Math.PI*2); g.fill(); }
        g.restore();
      }
    }
  }
  const fireworks=[]; function spawnTriple(){ const w=cvs.width; [w*.22,w*.50,w*.78].forEach(x=>fireworks.push(new Firework(x))); }
  setTimeout(spawnTriple,2500); setInterval(spawnTriple,12000);

  // road & tuk (tuk อยู่เหนือเส้น ไม่ตกน้ำ)
  const tuk={x:-220,w:140,h:90,speed:35};
  function drawRoadLine(){
    const y=roadY(); ctx.strokeStyle='#ff4444'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cvs.width,y); ctx.stroke();
  }
  function drawTuk(dt){
    tuk.x += tuk.speed*dt; if(tuk.x>cvs.width+220) tuk.x=-220;
    let y = roadY() - tuk.h - 1;                       // วางเหนือเส้นแดง
    y = Math.max(waterY()+6, Math.min(y, cvs.height - tuk.h)); // กันตกน้ำ
    if(tukImg && tukImg._ok) ctx.drawImage(tukImg, tuk.x, y, tuk.w, tuk.h);
  }

  // water
  let waveT=0,last=performance.now();
  function drawWater(){
    const y=waterY();
    ctx.fillStyle='rgba(10,32,63,.96)'; ctx.fillRect(0,y,cvs.width,cvs.height-y);
    ctx.lineWidth=1.6; ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,.2)';
    for(let i=0;i<10;i++){
      ctx.beginPath();
      for(let x=0;x<cvs.width;x+=20){
        const yy=y+Math.sin((x/40)+waveT*1.2+i)*6+i*16;
        if(x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
      }
      ctx.stroke();
    }
  }

  // loop
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

  // CSV
  document.getElementById('exportStat')?.addEventListener('click', ()=>{
    let log=[]; try{ log=JSON.parse(localStorage.getItem('loy.wishes.log')||"[]"); }catch{}
    const rows=[["seq","timestamp","ISO","wish"]];
    for(const x of log){ const iso=new Date(x.t||Date.now()).toISOString(); rows.push([x.n,x.t,iso,(x.w||"").replace(/"/g,'""')]); }
    const csv=rows.map(r=>r.map(v=>`"${String(v)}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}), url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="loykrathong_stat.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
})();
