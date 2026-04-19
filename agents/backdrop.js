// Canvas2D backdrop — terminal grid + scanning + data blips. No WebGL.
(function(){
  const canvas = document.getElementById('bdCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function fit(){
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit();
  addEventListener('resize', fit);

  // data blips — rare flickers on the grid
  const cell = 32;
  const blips = [];
  function spawnBlip(){
    const x = Math.floor(Math.random() * (innerWidth / cell)) * cell;
    const y = Math.floor(Math.random() * (innerHeight / cell)) * cell;
    blips.push({ x, y, life: 1, hue: Math.random() < 0.15 ? 'lime' : (Math.random() < 0.3 ? 'info' : 'dim') });
  }

  // scanning line
  let scanY = 0;
  const scanSpeed = 0.8;

  // mouse
  let mx = -200, my = -200;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  let lastSpawn = 0;
  let t = 0;

  function draw(dt){
    t += dt;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // base grid (static dots at intersections)
    ctx.save();
    ctx.fillStyle = 'rgba(180,255,58,0.035)';
    for (let x = 0; x < innerWidth; x += cell) {
      for (let y = 0; y < innerHeight; y += cell) {
        ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      }
    }
    ctx.restore();

    // faint grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(31,37,48,0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x < innerWidth; x += cell * 4) {
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, innerHeight); ctx.stroke();
    }
    for (let y = 0; y < innerHeight; y += cell * 4) {
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(innerWidth, y + 0.5); ctx.stroke();
    }
    ctx.restore();

    // scanning horizontal line (slow, low opacity)
    scanY += scanSpeed;
    if (scanY > innerHeight + 20) scanY = -20;
    ctx.save();
    const grd = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
    grd.addColorStop(0, 'rgba(180,255,58,0)');
    grd.addColorStop(0.5, 'rgba(180,255,58,0.05)');
    grd.addColorStop(1, 'rgba(180,255,58,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, scanY - 40, innerWidth, 80);
    ctx.restore();

    // mouse halo (very subtle)
    if (mx > 0) {
      const rg = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
      rg.addColorStop(0, 'rgba(180,255,58,0.08)');
      rg.addColorStop(1, 'rgba(180,255,58,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(mx - 200, my - 200, 400, 400);
    }

    // data blips
    lastSpawn += dt;
    if (lastSpawn > 280 && blips.length < 24) {
      spawnBlip(); lastSpawn = 0;
    }
    for (let i = blips.length - 1; i >= 0; i--) {
      const b = blips[i];
      b.life -= dt / 1800;
      if (b.life <= 0) { blips.splice(i, 1); continue; }
      const alpha = Math.max(0, b.life);
      let col;
      if (b.hue === 'lime') col = `rgba(180,255,58,${alpha * 0.85})`;
      else if (b.hue === 'info') col = `rgba(0,184,255,${alpha * 0.7})`;
      else col = `rgba(160,168,180,${alpha * 0.35})`;
      ctx.fillStyle = col;
      const sz = 3 + (1 - b.life) * 3;
      ctx.fillRect(b.x - sz/2, b.y - sz/2, sz, sz);
      // crosshair for lime blips
      if (b.hue === 'lime' && b.life > 0.4) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        const len = 6 + (1 - b.life) * 8;
        ctx.beginPath();
        ctx.moveTo(b.x - len, b.y); ctx.lineTo(b.x - 2, b.y);
        ctx.moveTo(b.x + 2, b.y); ctx.lineTo(b.x + len, b.y);
        ctx.moveTo(b.x, b.y - len); ctx.lineTo(b.x, b.y - 2);
        ctx.moveTo(b.x, b.y + 2); ctx.lineTo(b.x, b.y + len);
        ctx.stroke();
      }
    }
  }

  let last = performance.now();
  function loop(now){
    const dt = Math.min(64, now - last);
    last = now;
    draw(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
