/* ===== Main game (responsive, ใช้ภาพจาก /images, ใช้ audio#bgm) ===== */
(function () {
  // canvas + header offset
  const cvs = document.getElementById('scene');
  const ctx = cvs.getContext('2d');
  const header = document.querySelector('header');
  function size() {
    const h = header ? header.offsetHeight : 0;
    cvs.width = innerWidth;
    cvs.height = Math.max(1, innerHeight - h);
    document.documentElement.style.setProperty('--hdr', h + 'px');
  }
  addEventListener('resize', () => requestAnimationFrame(size));
  addEventListener('orientationchange', size);
  size();

  // cache-buster กันแคชเก่า
  const V = '?v=2025-11-01';

  // assets
  function img(src){ const i=new Image(); i.src=src+V; return i; }
  const tuk = img('images/tuktuk.png');
  const krImgs = ['kt1.png','kt2.png','kt3.png','kt4.png','kt5.png'].map(n=>img('images/'+n));

  // audio: ใช้ element ที่มีอยู่
  const bgmEl = document.getElementById('bgm');

  // storage: counter + wish list
  const LS_COUNT="loy.count", LS_WQ="loy.wishes.queue", LS_SEQ="loy.seq", LS_LOG="loy.wishes.log";
  let total=+(localStorage.getItem(LS_COUNT)||0), seq=+(localStorage.getItem(LS_SEQ)||0);
  const statEl=document.getElementById('statCount'); if(statEl) statEl.textContent=total;
  function bump(){ total++; localStorage.setItem(LS_COUNT,total); statEl && (statEl.textContent=total); }
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
    const v=a.slice(-6);
    const ul=document.getElementById('wishList');
    if (!ul) return;
    ul.innerHTML = v.map(x=>`<li><span class="num">คนที่ ${x.n}</span>🕯️ ${x.w}</li>`).join("");
  }
  renderWish();

  // controls
  const wishEl=document.getElementById('wish');
  const toast=document.getElementById('toast');
  function showToast(){ toast?.classList.add('show'); setTimeout(()=>toast?.classList.remove('show'),700); }
  function haptic(){ navigator.vibrate?.(12); }
  document.getElementById('launch')?.addEventListener('click', ()=>{
    const t=(wishEl?.value||'').trim();
    launch(t); if(wishEl) wishEl.value=''; showToast(); haptic();
  });

  // model
  const waterY = () => Math.round(cvs.height*0.80);
  function rnd(a,b){ return Math.random()*(b-a)+a; }

  class Krathong {
    constructor(img,t){
      this.img=img; this.text=t||'';
      this.size=60; this.x=rnd(-120, cvs.width); this.vx=rnd(22,34);
      this.phase=rnd(0,Math.PI*2); this.amp=2.2; this.freq=.9+rnd(0,.5); this.t=0;
      this.y=this.computeY(0);
    }
    computeY(t){ return waterY()-this.size*.5 + 60 + Math.sin(t*this.freq+this.phase)*this.amp; }
    update(dt){ this.x+=this.vx*dt; if(this.x>cvs.width+160) this.x=-160; this.t+=dt; this.y=this.computeY(this.t); }
    draw(g){
      // shadow
      const wy=waterY(); const rx=this.size*.55, ry=6;
      const grd=g.createRadialGradient(this.x,wy,1,this.x,wy,rx);
      grd.addColorStop(0,'rgba(0,0,0,.22)'); grd.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=grd;
      g.beginPath(); g.ellipse(this.x,wy,rx,ry,0,0,Math.PI*2); g.fill();
      // body
      if(this.img && this.img.complete && this.img.naturalWidth){
        g.drawImage(this.img, this.x-this.size/2, this.y-this.size/2, this.size, this.size);
      }else{ g.fillStyle='#27ae60'; g.beginPath(); g.arc(this.x,this.y,this.size/2,0,Math.PI*2); g.fill(); }
    }
  }

  const boats=[]; function launch(text=''){
    const imgs=krImgs.filter(i=>i && i.complete);
    const im=imgs.length ? imgs[Math.floor(rnd(0, imgs.length))] : null;
    boats.push(new Krathong(im, text)); if(boats.length>24) boats.splice(0,boats.length-24);
    bump(); pushWish(text);
  }

  // TukTuk
  const tukState={x:-220,w:140,h:90,speed:35};
  function drawTuk(dt){
    tukState.x+=tukState.speed*dt; if(tukState.x>cvs.width+220) tukState.x=-220;
    const y=Math.max(waterY()+6, Math.min(Math.round(cvs.height*0.95)-tukState.h, cvs.height-tukState.h));
    if(tuk.complete && tuk.naturalWidth) ctx.drawImage(tuk, tukState.x, y, tukState.w, tukState.h);
  }

  // fireworks (logo วาด)
  const logo = img('images/logo.png');
  class Firework{
    constructor(x){ this.x=x; this.y=waterY(); this.vy=-280; this.state='rise'; this.parts=[]; }
    update(dt){
      if(this.state==='rise'){ this.y+=this.vy*dt; this.vy+=140*dt; if(this.vy>=-10) this.state='explode'; }
      else { for(const p of this.parts){ p.vx*=.99; p.vy+=70*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.a*=.985; } this.parts=this.parts.filter(p=>p.a>0.06); }
      if(this.state==='explode' && !this.parts.length){
        for(let i=0;i<36;i++){ const a=i/36*Math.PI*2, sp=110+rnd(0,90); this.parts.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a:1}); }
      }
    }
    draw(g){
      if(this.state==='rise'){ g.strokeStyle='rgba(255,220,120,.9)'; g.beginPath(); g.moveTo(this.x,this.y+16); g.lineTo(this.x,this.y); g.stroke(); }
      for(const p of this.parts){ const R=64*p.a; g.save(); g.globalAlpha=p.a;
        if(logo.complete && logo.naturalWidth) g.drawImage(logo,p.x-R,p.y-R,R*2,R*2);
        else { g.fillStyle='#fff'; g.beginPath(); g.arc(p.x,p.y,R,0,Math.PI*2); g.fill(); }
        g.restore();
      }
    }
  }
  const fireworks=[]; function spawnTriple(){ const w=cvs.width; [w*.25,w*.5,w*.75].forEach(x=>fireworks.push(new Firework(x))); }
  spawnTriple(); setInterval(spawnTriple,10000);

  // water
  let waveT=0, last=performance.now();
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

  function loop(ts){
    const dt=Math.min(.033,(ts-last)/1000); last=ts; waveT+=dt;
    ctx.clearRect(0,0,cvs.width,cvs.height);
    drawWater();
    fireworks.forEach(f=>{f.update(dt); f.draw(ctx);});
    drawTuk(dt);
    boats.forEach(b=>b.update(dt));
    boats.forEach(b=>b.draw(ctx));
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Export CSV
  document.getElementById('exportStat')?.addEventListener('click', ()=>{
    let log=[]; try{ log=JSON.parse(localStorage.getItem(LS_LOG)||"[]"); }catch{}
    const rows=[["seq","timestamp","ISO","wish"]];
    for(const x of log){ const iso=new Date(x.t||Date.now()).toISOString(); rows.push([x.n,x.t,iso,(x.w||"").replace(/"/g,'""')]); }
    const csv=rows.map(r=>r.map(v=>`"${String(v)}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="loykrathong_stat.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

})();
