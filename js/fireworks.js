// Fuegos artificiales en canvas: cohetes que suben con estela y revientan en esferas de chispas con gravedad.
window.Fireworks = (function () {
  let canvas, ctx, raf = null;
  const rockets = [];
  const sparks = [];
  const PALETTES = [
    ["#ffd166", "#ff7f50", "#fff3c4"],            // mamey y oro
    ["#27c4b4", "#7ef0e0", "#ffffff"],            // turquesa
    ["#ff5c8a", "#ffb3c6", "#ffe3ec"],            // rosa carnaval
    ["#f2b84b", "#ffffff", "#27c4b4"],            // bandera-ish
    ["#9b5de5", "#f15bb5", "#fee440"]             // santiago
  ];
  const rand = (a, b) => a + Math.random() * (b - a);

  function init() {
    canvas = document.getElementById("fireworks");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }
  function resize() {
    canvas.width = Math.floor(window.innerWidth * Math.min(devicePixelRatio, 2));
    canvas.height = Math.floor(window.innerHeight * Math.min(devicePixelRatio, 2));
  }

  function launch(x, targetY, palette) {
    rockets.push({ x, y: canvas.height + 10, vx: rand(-0.6, 0.6), vy: -rand(11, 14) * (canvas.height / 900), targetY, palette, trail: [] });
  }

  function burst(x, y, palette) {
    const n = 90 + Math.floor(Math.random() * 60);
    const speed = rand(4, 7) * (canvas.height / 900);
    const shape = Math.random() < 0.3 ? "ring" : "sphere";
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
      const sp = shape === "ring" ? speed : speed * rand(0.3, 1);
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.8, 1.5), age: 0, color: palette[i % palette.length], size: rand(1.5, 3) });
    }
    // Núcleo blanco.
    for (let i = 0; i < 12; i++) sparks.push({ x, y, vx: rand(-1, 1), vy: rand(-1, 1), life: 0.35, age: 0, color: "#ffffff", size: 4 });
  }

  function frame(dt) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";
    const g = 9.8 * (canvas.height / 900) * 0.045;

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx; r.y += r.vy; r.vy += g * 0.5;
      r.trail.push([r.x, r.y]); if (r.trail.length > 8) r.trail.shift();
      ctx.strokeStyle = "rgba(255, 230, 180, 0.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); r.trail.forEach(([tx, ty], k) => (k ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty))); ctx.stroke();
      if (r.vy >= -1 || r.y <= r.targetY) { burst(r.x, r.y, r.palette); rockets.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age += dt;
      if (s.age >= s.life) { sparks.splice(i, 1); continue; }
      s.vy += g; s.vx *= 0.985; s.vy *= 0.985;
      s.x += s.vx; s.y += s.vy;
      const k = 1 - s.age / s.life;
      ctx.globalAlpha = k;
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size * (0.6 + k * 0.6), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  let last = 0;
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    frame(dt);
    if (rockets.length || sparks.length) raf = requestAnimationFrame(loop);
    else { raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.classList.remove("on"); }
  }

  // Un pequeño show: `count` cohetes escalonados.
  function show(count) {
    if (!canvas) return;
    canvas.classList.add("on");
    const n = count || 5;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
        launch(rand(canvas.width * 0.2, canvas.width * 0.8), rand(canvas.height * 0.15, canvas.height * 0.45), palette);
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
      }, i * rand(120, 260));
    }
  }

  return { init, show };
})();
