/* Final game patch: 5 fixed boats, wish 10s, 3 fireworks with logo, tuk on red line, image+audio robustness */
(function(){
  const cvs = document.getElementById('scene');
  const ctx = cvs.getContext('2d',{alpha:true});
  const header = document.querySelector('header');

  function size(){
    const h = header ? header.offsetHeight : 0;
    cvs.width = innerWidth;
    cvs.height = Math.max(1, innerHeight - h);
    document.documentElement.style.setProperty('--hdr', h + 'px');
  }
  addEventListener('resize', ()=>requestAnimationFrame(size));
  addEventListener('orientationchange', size);
  size();

  const V='?v=4';
  function makeImg(src){
    const i=new Image();
    i.onload=()=>i._ok=true;
    i.onerror=()=>console.warn('image not found:',src);
    i.src=src+V; return i;
  }

  // assets
  const tukImg = makeImg('images/tuktuk.png');
  const logoImg = makeImg('images/logo.png');
  const krImgs = ['kt1.png','kt2.png','kt3.png','kt4.png','kt5.png'].map(n=>makeImg('images/'+n));

  // audio
  const bgmEl = document.getElementById('bgm');
  bgmEl?.addEventListener('error', e=>console.warn('audio error', e));

  // helpers
  const waterY = () => Math.round(cvs.height*0.80);
  const roadY = () => waterY()+2; // red line
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const rnd = (a,b)=>Math.random()*(b-a)+a;

  // storage/stat
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

  // ===== 5 กระทง: ใช้ 5 เลน ป้องกันชนกัน =====
  const LANES = 5;
  function laneY(i){ // 0..4
    const base = waterY()+38;               // ยกขึ้นเหนือเส้นน้ำเล็กน้อย
    const step = 12;                        // ระยะห่างเลน
    return base + i*step;
  }

  class Krathong{
    constructor(img, lane){
      this.img=img; this.size=60;
      this.lane = lane;
      this.x = rnd(-200,-120);              // ซ้ายออกมา
      this.vx = rnd(22, 28);                // ความเร็วเท่ากันใกล้ ๆ กัน
      this.t=0; this.phase=rnd(0,Math.PI*2); this.amp=2; this.freq=1.0;
      this.text=''; this.textT=0;          // อายุคำอธิษฐาน
    }
    setWish(s){ this.text=(s||'').trim(); this.textT=10; }
    get y(){ return laneY(this.lane) + Math.sin(this.t*this.freq+this.phase)*this.amp; }
    update(dt){
      this.t+=dt;
      this.x+=this.vx*dt;
      if(this.x>cvs.width+160) this.x=-160; // วน
    }
    draw(g){
      const wy=waterY(), rx=this.size*.55, ry=6;
      const grd=g.createRadialGradient(this.x,wy,1,this.x,wy,rx);
      grd.addColorStop(0,'rgba(0,0,0,.22)'); grd.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grd; g.beginPath(); g.ellipse(this.x,wy,rx,ry,0,0,Math.PI*2); g.fill();

      if(this.img && this.img._ok){ g.drawImage(this.img, this.x-this.size/2, this.y-this.size/2, this.size, this.size); }
      else { g.fillStyle='#27ae60'; g.beginPath(); g.arc(this.x,this.y,this.size/2,0,Math.PI*2); g.fill(); }

      if(this.text && this.textT>0){
        this.textT -= 1/60;
        const msg = clip(this.text, (innerWidth<=420)?18:22);
        g.save();
        g.font=(innerWidth<=420? "600 14px":"600 16px")+" system-ui,'TH Sarabun New',Prompt,sans-serif";
        g.textAlign="center"; g.textBaseline="middle";
        const padX=12, h=28, w=Math.min(340, Math.max(80, g.measureText(msg).width + padX*2));
        const cx=this.x, cy=this.y - this.size*0.9;
        g.globalAlpha=.92; g.fillStyle="#0e1726"; roundRect(g,cx-w/2,cy-h/2,w,h,14); g.fill();
        g.globalAlpha=1; g.strokeStyle="rgba(255,255,255,.28)"; g.lineWidth=1; roundRect(g,cx-w/2,cy-h/2,w,h,14); g.stroke();
        g.fillStyle="#e9f0ff"; g.fillText(msg,cx,cy);
        g.restore();
      }
    }
  }
  function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
  function clip(s,m){ s=String(s||""); return s.length>m? s.slice(0,m-1)+'…' : s; }

  // สร้าง 5 ใบ (เลน 0..4 ตายตัว)
  const boats = krImgs.map((im,i)=> new Krathong(im, i));
  let nextIdx=0;

  // ปล่อย: ผูกคำอธิษฐานให้ใบถัดไป
  const wishEl=document.getElementById('wish');
  const toast=document.getElementById('toast');
  function showToast(){ toast?.classList.add('show'); setTimeout(()=>toast?.classList.remove('show'),700); }
  document.getElementById('launch')?.addEventListener('click', ()=>{
    const t=(wishEl?.value||'').trim();
    if(t){ boats[nextIdx].setWish(t); nextIdx=(nextIdx+1)%boats.length; }
    if(wishEl) wishEl.value='';
    bump(); pushWish(t); showToast();
    try{ if(bgmEl?.paused) bgmEl.play(); }catch{}
  });

  // ===== พลุ 3 จุด ใช้โลโก้ เสมอ =====
  class Firework{
    constructor(x){ this.x=x; this.y=waterY(); this.vy=-240; this.state='rise'; this.parts=[]; }
    update(dt){
      if(this.state==='rise'){ this.y+=this.vy*dt; this.vy+=110*dt; if(this.vy>=-10){ this.state='explode'; this.explode(); } }
      else { for(const p of this.parts){ p.vx*=.99; p.vy+=70*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.a*=.985; } this.parts=this.parts.filter(p=>p.a>0.06); }
    }
    explode(){
      const N=12; // น้อย
      for(let i=0;i<N;i++){ const a=i/N*Math.PI*2, sp=100+rnd(0,50); this.parts.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a:1}); }
    }
    draw(g){
      if(this.state==='rise'){ g.strokeStyle='rgba(255,220,120,.9)'; g.beginPath(); g.moveTo(this.x,this.y+16); g.lineTo(this.x,this.y); g.stroke(); }
      for(const p of this.parts){ const R=56*p.a; g.save(); g.globalAlpha=p.a;
        if(logoImg && logoImg._ok) g.drawImage(logoImg,p.x-R,p.y-R,R*2,R*2);
        else { g.fillStyle='#fff'; g.beginPath(); g.arc(p.x,p.y,R,0,Math.PI*2); g.fill(); }
        g.restore();
      }
    }
  }
  const fireworks=[];
  function spawnTriple(){ const w=cvs.width; [w*.22,w*.50,w*.78].forEach(x=>fireworks.push(new Firework(x))); }
  setTimeout(spawnTriple, 2500); setInterval(spawnTriple, 12000);

  // ===== Tuk on red line =====
  const tuk={x:-220,w:140,h:90,speed:35};
  function drawRoadLine(){
    const y=roadY(); ctx.strokeStyle='#ff4444'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cvs.width,y); ctx.stroke();
  }
  function drawTuk(dt){
    tuk.x+=tuk.speed*dt; if(tuk.x>cvs.width+220) tuk.x=-220;
    const y=roadY()-tuk.h;
    if(tukImg && tukImg._ok) ctx.drawImage(tukImg,tuk.x,y,tuk.w,tuk.h);
  }

  // น้ำ
  let waveT=0,last=performance.now();
  function drawWater(){
    const y=waterY(); ctx.fillStyle='rgba(10,32,63,.96)'; ctx.fillRect(0,y,cvs.width,cvs.height-y);
    ctx.lineWidth=1.6; ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,.2)';
    for(let i=0;i<10;i++){ ctx.beginPath();
      for(let x=0;x<cvs.width;x+=20){ const yy=y+Math.sin((x/40)+waveT*1.2+i)*6+i*16; if(x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy); }
      ctx.stroke();
    }
  }

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

  // CSV export
  document.getElementById('exportStat')?.addEventListener('click', ()=>{
    let log=[]; try{ log=JSON.parse(localStorage.getItem('loy.wishes.log')||"[]"); }catch{}
    const rows=[["seq","timestamp","ISO","wish"]];
    for(const x of log){ const iso=new Date(x.t||Date.now()).toISOString(); rows.push([x.n,x.t,iso,(x.w||"").replace(/\"/g,'\"\"')]); }
    const csv=rows.map(r=>r.map(v=>`"${String(v)}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="loykrathong_stat.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
})();
