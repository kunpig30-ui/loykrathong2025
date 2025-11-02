/* v9 – responsive bg, waves, road/tuk, krathong queue (<=20), sticky wishes, logo fireworks */

(() => {
  // ---------- DOM ----------
  const cvs = document.getElementById('scene');
  const ctx = cvs.getContext('2d');
  const header = document.querySelector('header');
  const bg = document.getElementById('bgLayer');
  const ROAD_OFFSET   = 2;    // เส้นแดงสูงกว่า/ต่ำกว่าผิวน้ำกี่พิกเซล (+ลง, -ขึ้น)
  const elWish = document.getElementById('wish');
  const elLaunch = document.getElementById('launch');
  const elStat = document.getElementById('statCount');
  const elFeed = document.getElementById('feed');
  const toast = document.getElementById('toast');

  const bgm = document.getElementById('bgm');
  document.getElementById('music').onclick = async () => {
    try{
      if (bgm.paused){ await bgm.play(); } else { bgm.pause(); }
    }catch{}
  };

  // ---------- CONFIG ----------
  const MAX_BOATS = 20;         // สูงสุดบนจอ
  const LANES = 5;              // เลนไม่ชนกัน
  const LANE_STEP = 16;         // ระยะห่างเลน
  const ROAD_DY = 10;           // เส้นแดงใกล้ผิวน้ำ
  const KR_SIZE = 60;           // ขนาดกระทง
  const WATER_FACTOR = 0.76;    // ระดับผิวน้ำ (เทียบความสูงฉาก)

  // ---------- helpers ----------
  const rnd = (a,b)=>Math.random()*(b-a)+a;
  const clip = (s,m)=>String(s||"").length>m ? s.slice(0,m-1)+'…' : s;

  // ---------- resize/layout ----------
  function size(){
   function size(){
  const h = header?.offsetHeight || 0;
  cvs.width  = innerWidth;
  cvs.height = Math.max(1, (visualViewport?.height || innerHeight) - h);
  document.documentElement.style.setProperty('--hdr', h + 'px');
}

    // ดันพื้นหลังขึ้นอีกเล็กน้อยบนจอสูงๆ
    const ar = cvs.height / Math.max(1,cvs.width);
    const shift = (ar>1.7) ? -38 : (ar>1.4? -34 : -28);
    document.documentElement.style.setProperty('--bg-shift', shift+'px');
  }
  addEventListener('resize', ()=>requestAnimationFrame(size));
  addEventListener('orientationchange', size);
  size();

const waterY = () => Math.round(cvs.height * WATER_FACTOR);
const roadY  = () => waterY() + ROAD_OFFSET;                 // เส้นแดงชิดผิวน้ำ
function laneY(i){ return waterY() + 14 + i * LANE_STEP; }   // กระทงต่ำลงเล็กน้อย ไม่ติดจอ


  // ---------- assets ----------
function img(path){ const i=new Image(); i.decoding='async'; i.onload=()=>i._ok=true; i.src=path+'?v=9'; return i; }
const tukImg  = makeImg('images/tuktuk.png');
const logoImg = makeImg('images/logo.png');
const krImgs  = ['kt1.png','kt2.png','kt3.png','kt4.png','kt5.png'].map(n=> makeImg('images/'+n));

bgm?.addEventListener('error', e=>console.warn('audio error', e));


  // ---------- state / store ----------
  const LS_COUNT="loy.count", LS_LOG="loy.wishes.log";
  let total = +(localStorage.getItem(LS_COUNT) || 0);
  elStat.textContent = total;
  function bump(){ total++; localStorage.setItem(LS_COUNT,total); elStat.textContent = total; }
  function logWish(item){
    let log=[]; try{ log=JSON.parse(localStorage.getItem(LS_LOG)||"[]"); }catch{}
    log.push(item); localStorage.setItem(LS_LOG, JSON.stringify(log));
    // feed
    const li = document.createElement('li');
    li.textContent = `• คนที่ ${item.n} 🕯️ ${item.w}`;
    elFeed.appendChild(li);
    while(elFeed.children.length>8) elFeed.firstChild.remove();
  }

  // ---------- Krathong ----------
  class Krathong {
    constructor(img, lane) {
      this.img = img; this.lane = lane; this.size=KR_SIZE;
      this.x = -160 - rnd(0,120);
      this.vx = rnd(22,28);
      this.phase = rnd(0,Math.PI*2);
      this.t = 0;
      this.text = '';
    }
    setWish(s){ this.text = String(s||'').trim(); }
    get y(){ return laneY(this.lane) + Math.sin(this.t*1.0 + this.phase)*2; }
    update(dt){
      this.t += dt;
      this.x += this.vx * dt;
    }
    get dead(){ return this.x > cvs.width + 160; }
    draw(g){
      const wy = waterY();
      // shadow
      const rx=this.size*.55, ry=6;
      const grd=g.createRadialGradient(this.x,wy,1,this.x,wy,rx);
      grd.addColorStop(0,'rgba(0,0,0,.22)'); grd.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grd; g.beginPath(); g.ellipse(this.x,wy,rx,ry,0,0,Math.PI*2); g.fill();

      // body
      if(this.img && this.img._ok){
        g.drawImage(this.img, this.x-this.size/2, this.y-this.size/2, this.size, this.size);
      }else{
        g.fillStyle='#27ae60'; g.beginPath(); g.arc(this.x,this.y,this.size/2,0,Math.PI*2); g.fill();
      }

      // wish bubble (ติดไปจนสุดขวา)
      if(this.text){
        const msg = clip(this.text, innerWidth<=420?18:22);
        g.save();
        g.font = (innerWidth<=420? "600 14px":"600 16px")+" system-ui,'TH Sarabun New',Prompt,sans-serif";
        g.textAlign="center"; g.textBaseline="middle";
        const padX=12, h=28, w=Math.min(340, Math.max(80, g.measureText(msg).width + padX*2));
        const cx=this.x, cy=this.y - this.size*0.9;
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

  // active boats
  const boats = [];

  function addBoatWithWish(text){
    // จำกัดไม่เกิน MAX
    if (boats.length >= MAX_BOATS) {
      // ลบลำที่อยู่ขวาสุด (ใกล้หมด) เพื่อรับลำใหม่
      boats.sort((a,b)=>a.x-b.x);
      boats.pop();
    }
    const lane = krSeq % LANES;
    const img = krImgs[krSeq % krImgs.length];
    krSeq++;
    const b = new Krathong(img, lane);
    b.setWish(text);
    boats.push(b);
  }

  // ---------- Fireworks ----------
  class Firework{
    constructor(x){ this.x=x; this.y=waterY(); this.vy=-240; this.state='rise'; this.parts=[]; }
    update(dt){
      if(this.state==='rise'){ this.y+=this.vy*dt; this.vy+=110*dt; if(this.vy>=-10){ this.state='explode'; this.explode(); } }
      else { for(const p of this.parts){ p.vx*=.99; p.vy+=70*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.a*=.985; }
             this.parts=this.parts.filter(p=>p.a>0.06); }
    }
    explode(){ const N=16;
      for(let i=0;i<N;i++){ const a=i/N*Math.PI*2, sp=110+rnd(0,60);
        this.parts.push({x:this.x,y:this.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a:1});
      }
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
  setTimeout(spawnTriple,2500); setInterval(spawnTriple,12000);

  // ---------- Tuk + road ----------
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

  // ---------- Water / waves ----------
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

  // ---------- Loop ----------
  function loop(ts){
    const dt = Math.min(.033, (ts-last)/1000); last = ts; waveT += dt;

    ctx.clearRect(0,0,cvs.width,cvs.height);
    drawWater(); drawRoad();
    fireworks.forEach(f => { f.update(dt); f.draw(ctx); });
    drawTuk(dt);

    // boats
    for (let i=boats.length-1; i>=0; i--){
      boats[i].update(dt);
      boats[i].draw(ctx);
      if (boats[i].dead) boats.splice(i,1);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- Controls ----------
  function showToast(){ toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 800); }
  elLaunch?.addEventListener('click', async ()=>{
    const t = (elWish?.value || '').trim();
    if (!t) return;
    addBoatWithWish(t);
    if (elWish) elWish.value = '';
    bump(); logWish({ n: total, w: t, t: Date.now() });
    showToast();
    try{ if (bgm && bgm.paused) await bgm.play(); }catch{}
  });

  document.getElementById('exportStat')?.addEventListener('click', ()=>{
    let log=[]; try{ log=JSON.parse(localStorage.getItem(LS_LOG)||"[]"); }catch{}
    const rows=[["seq","timestamp","ISO","wish"]];
    for(const x of log){ const iso=new Date(x.t||Date.now()).toISOString(); rows.push([x.n,x.t,iso,(x.w||"").replace(/\"/g,'\"\"')]); }
    const csv=rows.map(r=>r.map(v=>`"${String(v)}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}), url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="loykrathong_stat.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
})();
