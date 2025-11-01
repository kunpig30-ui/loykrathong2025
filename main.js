/* ===== Simple canvas play + use existing <audio id="bgm"> ===== */
(function () {
  // --- base canvas ---
  const cvs = document.querySelector('#scene') || (() => {
    const c = document.createElement('canvas'); document.body.appendChild(c); return c;
  })();
  const ctx = cvs.getContext('2d');
  function resize() {
    cvs.width = innerWidth;
    const header = document.querySelector('header');
    const top = header ? header.offsetHeight : 0;
    cvs.height = Math.max(1, innerHeight - top);
  }
  addEventListener('resize', resize);
  resize();

  // --- images ---
  const bg = new Image(); bg.src = 'images/bg5.png';
  const tuk = new Image(); tuk.src = 'images/tuktuk.png';
  const krImgs = ['kt1.png','kt2.png','kt3.png','kt4.png','kt5.png'].map(n => {
    const i = new Image(); i.src = 'images/' + n; return i;
  });

  // --- audio: ใช้ <audio id="bgm"> ถ้ามี, ไม่สร้างซ้ำ ---
  const bgmEl = document.getElementById('bgm') || (() => {
    const a = new Audio('audio/song.mp3'); a.loop = true; a.preload = 'auto'; a.setAttribute('playsinline','');
    document.body.appendChild(a); return a;
  })();

  // --- bottom bar: ไม่ใช้งาน + ซ่อน ---
  const mobileBar = document.getElementById('mobileBar');
  if (mobileBar) mobileBar.style.display = 'none'; // ตัดเมนูด้านล่าง
  // อย่าผูก event กับปุ่มล่าง
  const tapLaunch = document.getElementById('tapLaunch');
  const tapMusicMb = document.getElementById('tapMusicMb');
  if (tapLaunch) tapLaunch.onclick = null;
  if (tapMusicMb) tapMusicMb.onclick = null;

  // --- model ---
  const waterY = () => Math.floor(cvs.height * 0.82);
  function rnd(a, b) { return Math.random() * (b - a) + a; }

  class Krathong {
    constructor(img) {
      this.img = img;
      this.x = rnd(-100, cvs.width);
      this.y = waterY() + rnd(8, 38);
      this.vx = rnd(18, 32);
      this.t = 0;
    }
    update(dt) {
      this.t += dt;
      this.x += this.vx * dt;
      if (this.x > cvs.width + 120) this.x = -120;
    }
    draw(g) {
      const w = 44, h = 44;
      // shadow
      g.fillStyle = 'rgba(0,0,0,.22)';
      g.beginPath(); g.ellipse(this.x, waterY(), 26, 6, 0, 0, Math.PI*2); g.fill();
      // body
      if (this.img && this.img.complete && this.img.naturalWidth) {
        g.drawImage(this.img, this.x - w/2, this.y - h/2, w, h);
      } else {
        g.fillStyle = '#27ae60'; g.beginPath(); g.arc(this.x, this.y, 22, 0, Math.PI*2); g.fill();
      }
    }
  }

  const boats = [];
  function launch() {
    const li = krImgs.filter(i => i && i.complete);
    const im = li.length ? li[Math.floor(rnd(0, li.length))] : null;
    boats.push(new Krathong(im));
    if (boats.length > 20) boats.shift();
  }

  // ปุ่มบนหัว (ยังคงใช้ได้)
  const btnLaunchTop = document.getElementById('launch');
  if (btnLaunchTop) btnLaunchTop.onclick = () => { launch(); try{navigator.vibrate?.(12);}catch{} };

  const btnMusic = document.getElementById('tapMusic');
  function toggleMusic(){ if (bgmEl.paused) { bgmEl.play().catch(()=>{}); } else bgmEl.pause(); }
  if (btnMusic) btnMusic.onclick = toggleMusic;

  // auto launch บ้าง ๆ
  setInterval(launch, 2500);

  // tuk state
  const tukState = { x: -220, w: 140, h: 90, speed: 35 };

  // loop
  let last = performance.now(), waveT = 0;
  function drawWater(g) {
    const y = waterY();
    g.fillStyle = 'rgba(10,32,63,.96)'; g.fillRect(0, y, cvs.width, cvs.height - y);
    g.lineWidth = 1.6; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.2)';
    for (let i = 0; i < 10; i++) {
      g.beginPath();
      for (let x = 0; x < cvs.width; x += 20) {
        const yy = y + Math.sin((x/40) + waveT*1.2 + i) * 6 + i*16;
        if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
      g.stroke();
    }
  }
  function loop(ts) {
    const dt = Math.min(.033, (ts - last)/1000); last = ts; waveT += dt;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    drawWater(ctx);

    // tuk
    tukState.x += tukState.speed * dt;
    if (tukState.x > cvs.width + 220) tukState.x = -220;
    const roadY = Math.min(cvs.height - tukState.h, waterY() + 6);
    if (tuk.complete && tuk.naturalWidth) ctx.drawImage(tuk, tukState.x, roadY, tukState.w, tukState.h);

    // krathongs
    boats.forEach(b => b.update(dt));
    boats.forEach(b => b.draw(ctx));

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
