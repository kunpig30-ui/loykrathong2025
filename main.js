/* ===== Splash ===== */
(function() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const bg = new Image();
  bg.src = "images/bg5.png";

  const tuk = new Image();
  tuk.src = "images/tuktuk.png";

  const krathongs = ["kt1.png","kt2.png","kt3.png","kt4.png","kt5.png"].map(k=>{
    const i = new Image(); i.src = "images/"+k; return i;
  });

  const fireworks = [];
  const waterY = canvas.height - 80;
  let launched = 0;

  function random(min, max) { return Math.random() * (max - min) + min; }

  function drawBackground() {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 50, 0.4)";
    ctx.fillRect(0, waterY, canvas.width, canvas.height - waterY);
  }

  class Krathong {
    constructor(img) {
      this.img = img;
      this.x = random(0, canvas.width);
      this.y = waterY + random(10, 50);
      this.speed = random(0.2, 0.6);
    }
    update() {
      this.y -= this.speed * 0.3;
      this.x += Math.sin(Date.now() / 500) * 0.05;
    }
    draw() {
      ctx.drawImage(this.img, this.x, this.y, 40, 40);
    }
  }

  const krathongList = [];

  function launchKrathong() {
    krathongList.push(new Krathong(krathongs[Math.floor(Math.random()*krathongs.length)]));
    launched++;
  }

  function drawFireworks() {
    fireworks.forEach(fw => {
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = fw.color;
      ctx.fill();
      fw.y -= fw.speed;
      fw.alpha -= 0.01;
    });
  }

  function createFirework() {
    for (let i = 0; i < 50; i++) {
      fireworks.push({
        x: random(0, canvas.width),
        y: random(0, canvas.height / 2),
        color: `hsl(${random(0, 360)},100%,60%)`,
        speed: random(1, 3),
        alpha: 1
      });
    }
  }

  const audio = new Audio("audio/song.mp3");
  audio.loop = true;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    krathongList.forEach(k => { k.update(); k.draw(); });
    drawFireworks();
    requestAnimationFrame(animate);
  }

  // แทนโค้ดเก่าที่ new Audio(...)
const audio = document.getElementById('bgm');
// เรียกเล่น/หยุดด้วย audio.play() / audio.pause()
  
  document.addEventListener("click", () => {
    launchKrathong();
    createFirework();
  });

  animate();
})();
