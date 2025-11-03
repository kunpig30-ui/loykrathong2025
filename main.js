if (window.__loyInit) { console.warn('loykrathong already initialized'); }
else {
  window.__loyInit = true;
  (function () {
// --- guard: กัน init ซ้ำแม้สคริปต์ถูกโหลดซ้ำ/แคช ---
if (window.__loyInit) {
  console.warn('loykrathong already initialized');
  // หยุดตรงนี้เลย ถ้ารันมาแล้ว
} else {
  window.__loyInit = true;
  (function () {
    // ===== จากบรรทัดนี้ลงไปคือโค้ดเดิมทั้งหมดของคุณ =====
// --- guard: อย่าให้ init ซ้ำ แม้ถูกโหลดซ้ำ ---
if (window.__loyInit) { console.warn('loykrathong already initialized'); }
else {
  window.__loyInit = true;
  (function () {

    /* ทั้งหมดของ main.js เดิมวางไว้ในวงเล็บนี้ */
    /* ... โค้ดเดิมของคุณทั้งหมด ... */

  })();
}
// main.js — single source of truth (ห่อทั้งหมดใน IIFE ป้องกันชนชื่อ)
(() => {
  const VERSION_QS = '?v=13';
  const WATER_PCT  = 0.80;     // ระดับน้ำ (ยก/ลดได้)
  const DIP_PX     = 60;       // ขนาดจุ่มของกระทง
  const MAX_BOATS  = 24;

  // DOM
  const hdr   = document.getElementById('hdr');
  const cvs   = document.getElementById('scene');
  const ctx   = cvs.getContext('2d');
  const wishEl= document.getElementById('wish');
  const toast = document.getElementById('toast');
  const bgm   = document.getElementById('bgm');
  const splash= document.getElementById('splash');
  const loadInfo = document.getElementById('loadInfo');

  // Helpers
  const rnd = (a,b)=>Math.random()*(b-a)+a;
  function loadImage(src){
    return new Promise(res=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>res(null); im.src=src+VERSION_QS; });
  }
  function setHdrVar(){ document.documentElement.style.setProperty('--hdr', hdr.offsetHeight + 'px'); }
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

  // Assets
  const KR_SRC = ["images/kt1.png","images/kt2.png","images/kt3.png","images/kt4.png","images/kt5.png"];
  let KIMGS=[], logoImg=null, ready=0, total=KR_SRC.length+1;
  function mark(){ ready++; if(loadInfo) loadInfo.textContent = `โหลดแล้ว ${ready}/${total}`; }
  (async()=>{
    logoImg = await loadImage("images/logo.png"); mark();
    for (const s of KR_SRC){ KIMGS.push(await loadImage(s)); mark(); }
  })();

  // Audio controls
  function playBgm(){ try{ const p=bgm.play(); if(p&&p.catch) p.catch(()=>{});}catch{} }
  document.getElementById('playBtn').onclick = playBgm;
  document.getElementById('stopBtn').onclick = ()=>{ try{ bgm.pause(); }catch{} };
  document.getElementById('startBtn').onclick = ()=>{
    splash.classList.add('hide'); playBgm(); setTimeout(()=>splash.remove?.(),350);
  };

  // Stats / storage (ใช้ let ครั้งเดียวใน scope นี้ → ไม่ชนซ้ำ)
  const LS_COUNT="loy.count", LS_WQ="loy.wishes.queue", LS_SEQ="loy.seq", LS_LOG="loy.wishes.log";
  let total=+(localStorage.getItem(LS_COUNT)||0);
  let seq  =+(localStorage.getItem(LS_SEQ)||0);
  document.getElementById('statCount').textContent=total;

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
  function renderWish(){
    const ul=document.getElementById('wishList'); let q=[];
    try{ q=JSON.parse(localStorage.getItem(LS_WQ)||"[]"); }catch{}
    ul.innerHTML=q.slice(-7).map(x=>`<li><span class="num">คนที่ ${x.n}</span>🕯️ ${escapeHtml(x.w)}</li>`).join("");
  }
  function bump(){ total++; localStorage.setItem(LS_COUNT,total); document.getElementById('statCount').textContent=total; }
  function pushWish(text){
    let q=[]; try{ q=JSON.parse(localStorage.getItem(LS_WQ)||"[]"); }catch{}
    seq++; localStorage.setItem(LS_SEQ,seq);
    const item={n:seq,w:text||"",t:Date.now()}; q.push(item); localStorage.setItem(LS_WQ,JSON.stringify(q));
    let log=[]; try{ log=JSON.parse(localStorage.getItem(LS_LOG)||"[]"); }catch{}
    log.push(item); localStorage.setItem(LS_LOG,JSON.stringify(log));
    renderWish();
  }
  renderWish();

  document.getElementById('csvBtn').onclick = ()=>{
    let log=[]; try{ log=JSON.parse(localStorage.getItem(LS_LOG)||"[]"); }catch{}
    const rows=[["seq","timestamp","ISO","wish"]];
    for(const x of log){ const iso=new Date(x.t||Date.now()).toISOString(); rows.push([x.n,x.t,iso,(x.w||"").replace(/"/g,'""')]); }
    const csv=rows.map(r=>r.map(v=>`"${String(v)}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="loykrathong_report.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  document.getElementById('resetBtn').onclick=()=>{
    if(confirm("ยืนยันเริ่มนับใหม่และลบคำอธิษฐานทั้งหมด?")){
      [LS_COUNT,LS_WQ,LS_SEQ,LS_LOG].forEach(k=>localStorage.removeItem(k));
      total=0; seq=0; document.getElementById('statCount').textContent=0;
      boats.length=0; renderWish();
    }
  };

  // Toast + launch
  function showToast(){ toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),650); }
  function haptic(){ if('vibrate' in navigator) try{ navigator.vibrate(12);}catch{} }

  document.getElementById('launch').onclick = ()=>{
    const t = wishEl.value.trim(); wishEl.value="";
    launch(t); bump(); pushWish(t); showToast(); haptic();
  };
  wishEl.addEventListener('keydown', e=>{ if(e.key==="Enter"){ document.getElementById('launch').click(); } });

  // Water level
  function waterY(){ return cvs.clientHeight * WATER_PCT; }

  // Krathong
  class Krathong{
    constructor(img, text){
      this.img=img; this.text=text||""; this.size=92; this.x=-140;
      this.vx = 30 + Math.random()*14;
      this.phase=Math.random()*Math.PI*2; this.amp=2.2; this.freq=.9+Math.random()*.5; this.t=0;
      this.y = this.computeY(0);
    }
    computeY(t){ const bob=Math.sin(t*this.freq+this.phase)*this.amp; return waterY()-this.size*.5 + DIP_PX + bob; }
    update(dt){ this.x+=this.vx*dt; if(this.x>cvs.clientWidth+160) this.x=-160; this.t+=dt; this.y=this.computeY(this.t); }
    draw(g){
      const wy=waterY(), rx=this.size*.55;
      const grd=g.createRadialGradient(this.x,wy,1,this.x,wy,rx);
      grd.addColorStop(0,'rgba(0,0,0,.22)'); grd.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=grd;
      g.beginPath(); g.ellipse(this.x,wy,rx,6,0,0,Math.PI*2); g.fill();
      if(this.img && this.img.complete && this.img.naturalWidth){
        g.drawImage(this.img,this.x-this.size/2,this.y-this.size/2,this.size,this.size);
      }else{
        g.fillStyle='#27ae60'; g.beginPath(); g.arc(this.x,this.y,this.size/2,0,Math.PI*2); g.fill();
      }
      if(this.text){
        const msg = this.text.length>22 ? (this.text.slice(0,21)+'…') : this.text;
        g.font="600 15px system-ui,'TH Sarabun New',Prompt,sans-serif";
        g.textAlign="center"; g.textBaseline="middle";
        const pad=12, w=Math.min(320, g.measureText(msg).width + pad*2), h=26;
        const cx=this.x, cy=this.y - this.size*.75;
        g.save();
        g.globalAlpha=.85; g.fillStyle="#0e1726"; roundRect(g,cx-w/2,cy-h/2,w,h,14); g.fill();
        g.globalAlpha=1; g.strokeStyle="rgba(255,255,255,.25)"; g.lineWidth=1; roundRect(g,cx-w/2,cy-h/2,w,h,14); g.stroke();
        g.fillStyle="#e9f0ff"; g.fillText(msg,cx,cy); g.restore();
      }
    }
  }
  function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }

  const boats=[]; let nextIdx=0;
  function launch(text){
    const imgs=KIMGS.filter(Boolean); let im=null;
    if(imgs.length){ im=imgs[nextIdx % imgs.length]; nextIdx=(nextIdx+1)%imgs.length; }
    boats.push(new Krathong(im,text));
    if(boats.length>MAX_BOATS) boats.splice(0, boats.length-MAX_BOATS);
  }

  // Fireworks
  class Firework{
    constructor(x){ this.x=x; this.y=waterY(); this.vy=-280; this.state='rise'; this.parts=[]; }
    update(dt){
      if(this.state==='rise'){ this.y+=this.vy*dt; this.vy+=140*dt; if(this.vy>=-10) this.explode(); }
      else{ for(const p of this.parts){ p.vx*=0.99; p.vy+=70*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.a*=0.985; } this.parts=this.parts.filter(p=>p.a>0.06); }
    }
    explode(){ this.state='explode'; for(let i=0;i<36;i++){ const a=i/36*Math.PI*2, sp=110+Math.random()*90; this.parts.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a:1}); } }
    draw(g){
      if(this.state==='rise'){ g.strokeStyle='rgba(255,220,120,.9)'; g.beginPath(); g.moveTo(this.x,this.y+16); g.lineTo(this.x,this.y); g.stroke(); }
      for(const p of this.parts){
        const R=64*p.a; g.save(); g.globalAlpha=p.a;
        if(logoImg && logoImg.naturalWidth) g.drawImage(logoImg,p.x-R,p.y-R,R*2,R*2); else { g.fillStyle='#fff'; g.beginPath(); g.arc(p.x,p.y,R,0,Math.PI*2); g.fill(); }
        g.restore();
      }
    }
  }
  const fireworks=[]; function spawnTriple(){ const w=cvs.clientWidth; [w*.25,w*.5,w*.75].forEach(x=>fireworks.push(new Firework(x))); }
  spawnTriple(); setInterval(spawnTriple, 10000);

  // Water + loop
  let waveT=0, last=performance.now();
  function drawWater(){
    const w=cvs.clientWidth, h=cvs.clientHeight, y=waterY();
    ctx.fillStyle='rgba(10,32,63,0.96)'; ctx.fillRect(0,y,w,h-y);
    ctx.lineWidth=1.6; ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,0.20)';
    for(let i=0;i<10;i++){
      ctx.beginPath();
      for(let x=0;x<w;x+=20){
        const yy=y + Math.sin((x/40)+waveT*1.2+i)*6 + i*16;
        if(x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
      }
      ctx.stroke();
    }
  }
  function loop(ts){
    const dt=Math.min(.033,(ts-last)/1000); last=ts; waveT+=dt;
    ctx.clearRect(0,0,cvs.clientWidth,cvs.clientHeight);
    drawWater();
    for(const fw of fireworks){ fw.update(dt); fw.draw(ctx); }
    const ordered = boats.slice().sort((a,b)=>a.y-b.y);
    for(const b of ordered){ b.update(dt); b.draw(ctx); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  })();
}
