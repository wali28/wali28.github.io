// Tokyo Dystopian Campfire · scroll-reactive 3D backdrop
window.__sceneErr = null;

// ─── Safari/WebKit workaround: gl.getShaderPrecisionFormat sometimes returns null ───
// Intercept canvas.getContext so every WebGL context we hand out has a patched method.
(function wrapGetContext(){
  const fallback = { rangeMin: 127, rangeMax: 127, precision: 23 };
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, attrs){
    const ctx = origGetContext.call(this, type, attrs);
    if (ctx && (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl')) {
      const origFn = ctx.getShaderPrecisionFormat && ctx.getShaderPrecisionFormat.bind(ctx);
      if (origFn) {
        // Patch the instance directly (works even when prototype is frozen in Safari)
        Object.defineProperty(ctx, 'getShaderPrecisionFormat', {
          value: function(...args){ return origFn(...args) || fallback; },
          writable: true, configurable: true,
        });
      }
    }
    return ctx;
  };
})();

try {
const three_mod = await import('three');
const THREE = three_mod;

const canvas = document.getElementById('sceneCanvas');
if (!canvas) throw new Error('#sceneCanvas not found');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
} catch (e) {
  throw new Error('WebGL init failed: ' + e.message);
}
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1a0c1e, 0.022);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 600);
camera.position.set(0, 2.4, 14);
camera.lookAt(0, 3, 0);

// ───── sky backdrop (painted canvas) ─────
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 1024; skyCanvas.height = 1024;
const sc = skyCanvas.getContext('2d');
const skyG = sc.createLinearGradient(0, 0, 0, 1024);
skyG.addColorStop(0, '#0a0614');
skyG.addColorStop(0.3, '#1a0c24');
skyG.addColorStop(0.55, '#3a1530');
skyG.addColorStop(0.8, '#6a2a38');
skyG.addColorStop(1, '#2a1020');
sc.fillStyle = skyG;
sc.fillRect(0, 0, 1024, 1024);
// distant neon haze glow
for (let i = 0; i < 6; i++) {
  const rg = sc.createRadialGradient(
    Math.random()*1024, 500+Math.random()*400, 0,
    Math.random()*1024, 500+Math.random()*400, 120+Math.random()*180
  );
  const hue = ['#ff2e88','#00d9ff','#ff7744','#a050ff'][i%4];
  rg.addColorStop(0, hue + '40');
  rg.addColorStop(1, hue + '00');
  sc.fillStyle = rg; sc.fillRect(0, 0, 1024, 1024);
}
// stars
sc.fillStyle = '#fff';
for (let i = 0; i < 120; i++) {
  const s = Math.random() * 1.4 + 0.3;
  sc.globalAlpha = 0.2 + Math.random() * 0.5;
  sc.fillRect(Math.random()*1024, Math.random()*480, s, s);
}
sc.globalAlpha = 1;
const skyTex = new THREE.CanvasTexture(skyCanvas);
skyTex.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTex;

// ───── distant mountain/cityscape (farthest layer) ─────
const farCityCanvas = document.createElement('canvas');
farCityCanvas.width = 2048; farCityCanvas.height = 720;
const fc = farCityCanvas.getContext('2d');
fc.fillStyle = 'rgba(0,0,0,0)';
fc.fillRect(0, 0, 2048, 720);
// far skyline silhouette
fc.fillStyle = '#0a0612';
fc.beginPath();
fc.moveTo(0, 720);
for (let x = 0; x <= 2048; x += 20) {
  const h = 180 + Math.sin(x*0.008)*80 + Math.sin(x*0.03)*40 + (Math.random()*30);
  fc.lineTo(x, 720 - h);
}
fc.lineTo(2048, 720); fc.closePath(); fc.fill();
// tiny far lights
for (let i = 0; i < 500; i++) {
  const x = Math.random() * 2048;
  const yBase = 720 - (180 + Math.sin(x*0.008)*80 + Math.sin(x*0.03)*40);
  const y = yBase + Math.random() * 180;
  const col = ['#ffdc88','#ff2e88','#88eeff'][Math.floor(Math.random()*3)];
  fc.fillStyle = col; fc.globalAlpha = 0.3 + Math.random()*0.5;
  fc.fillRect(x, y, 1.5, 1.5);
}
fc.globalAlpha = 1;
const farTex = new THREE.CanvasTexture(farCityCanvas);
farTex.colorSpace = THREE.SRGBColorSpace;
const farCityMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 50),
  new THREE.MeshBasicMaterial({ map: farTex, transparent: true })
);
farCityMesh.position.set(0, 8, -75);
scene.add(farCityMesh);

// ───── mid city: real 3D low-poly buildings with emissive neon ─────
const cityGroup = new THREE.Group();
scene.add(cityGroup);

const bldMat = new THREE.MeshStandardMaterial({ color: 0x0e0812, roughness: 0.85, metalness: 0.2 });

// procedural grid of buildings, mid-range
const neonColors = [0xff2e88, 0x00d9ff, 0xff7744, 0xa050ff, 0xffdc88];
function neonTex(color, style='sign'){
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 512);
  // add glowing neon rectangles / "signs" on side
  const num = 3 + Math.floor(Math.random()*5);
  for (let i = 0; i < num; i++) {
    const y = 60 + i * 120 + Math.random() * 40;
    const w = 40 + Math.random() * 160;
    const h = 10 + Math.random() * 32;
    const col = '#' + neonColors[Math.floor(Math.random()*neonColors.length)].toString(16).padStart(6, '0');
    g.shadowColor = col; g.shadowBlur = 20;
    g.fillStyle = col;
    g.fillRect((256 - w) / 2, y, w, h);
  }
  g.shadowBlur = 0;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

for (let i = 0; i < 30; i++) {
  const w = 2 + Math.random() * 4;
  const h = 10 + Math.random() * 20;
  const d = 2 + Math.random() * 4;
  const geo = new THREE.BoxGeometry(w, h, d);
  const faceMat = new THREE.MeshBasicMaterial({ map: neonTex(), transparent: false });
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x0a0510, roughness: 0.9, metalness: 0.1, emissive: 0x1a0818, emissiveIntensity: 0.4 });
  const mats = [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat];
  const b = new THREE.Mesh(geo, mats);
  const angle = (i / 30) * Math.PI * 2;
  const radius = 22 + Math.random() * 20;
  b.position.set(Math.cos(angle) * radius, h/2 - 1.2, -Math.abs(Math.sin(angle) * radius) - 5);
  b.rotation.y = Math.random() * Math.PI * 2;
  cityGroup.add(b);
}

// a couple of particularly tall iconic towers
for (let i = 0; i < 3; i++) {
  const h = 34 + Math.random() * 16;
  const t = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, h, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x120818, emissive: 0x200820, emissiveIntensity: 0.3, roughness: 0.85 })
  );
  t.position.set(-10 + i * 10 + (Math.random()-0.5)*4, h/2 - 1.2, -30 - Math.random()*15);
  cityGroup.add(t);
  // top beacon
  const beacon = new THREE.PointLight([0xff2e88,0x00d9ff,0xffdc88][i], 1.8, 30, 2);
  beacon.position.set(t.position.x, h - 1, t.position.z);
  scene.add(beacon);
}

// ───── near hill / cliff ground ─────
const hillGeom = new THREE.PlaneGeometry(140, 140, 64, 64);
const pos = hillGeom.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getY(i); // before rotation
  // hill falls away from center toward -z
  const hillH = -Math.max(0, -z * 0.05) + Math.sin(x*0.2)*0.15 + Math.cos(z*0.15)*0.2;
  pos.setZ(i, hillH);
}
hillGeom.computeVertexNormals();
const hill = new THREE.Mesh(
  hillGeom,
  new THREE.MeshStandardMaterial({ color: 0x1a0f14, roughness: 0.95, metalness: 0.05 })
);
hill.rotation.x = -Math.PI/2;
hill.position.y = -1.3;
scene.add(hill);

// grass blades silhouettes (small tall quads)
const grassGeom = new THREE.PlaneGeometry(0.04, 0.35);
const grassMat = new THREE.MeshBasicMaterial({ color: 0x0a0a12, side: THREE.DoubleSide });
const grassInst = new THREE.InstancedMesh(grassGeom, grassMat, 300);
for (let i = 0; i < 300; i++) {
  const m = new THREE.Matrix4();
  const x = (Math.random()-0.5) * 30;
  const z = 3 + Math.random() * 12;
  m.makeRotationY(Math.random() * Math.PI);
  m.setPosition(x, -1.1, z);
  grassInst.setMatrixAt(i, m);
}
scene.add(grassInst);

// ───── tent (foreground, right side) ─────
const tentMat = new THREE.MeshStandardMaterial({ color: 0x3a2820, roughness: 0.7, metalness: 0.1, emissive: 0xff6030, emissiveIntensity: 0.04 });
const tentBody = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.6, 4), tentMat);
tentBody.position.set(3.2, -0.5, 4.5);
tentBody.rotation.y = Math.PI/4;
scene.add(tentBody);
// tent dark opening
const tentOpen = new THREE.Mesh(
  new THREE.PlaneGeometry(0.6, 0.8),
  new THREE.MeshBasicMaterial({ color: 0x0a0306 })
);
tentOpen.position.set(3.0, -0.8, 5.3);
tentOpen.lookAt(camera.position);
scene.add(tentOpen);

// ───── campfire ─────
const campGroup = new THREE.Group();
campGroup.position.set(0, -1, 5.5);
scene.add(campGroup);

// stone ring (logs at bottom)
const logMat = new THREE.MeshStandardMaterial({ color: 0x1f1108, roughness: 0.95 });
for (let i = 0; i < 6; i++){
  const ang = (i / 6) * Math.PI * 2;
  const stone = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.14, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x222227, roughness: 0.95 })
  );
  stone.position.set(Math.cos(ang) * 0.5, 0.07, Math.sin(ang) * 0.5);
  campGroup.add(stone);
}
// crossed logs
for (let i = 0; i < 3; i++) {
  const l = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8),
    logMat
  );
  l.rotation.x = Math.PI/2;
  l.rotation.z = (i / 3) * Math.PI;
  l.position.y = 0.12;
  campGroup.add(l);
}

// fire particles (flames)
const flameCount = 80;
const flameGeom = new THREE.BufferGeometry();
const flamePos = new Float32Array(flameCount * 3);
const flameData = [];
for (let i = 0; i < flameCount; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.25;
  flamePos[i*3]   = Math.cos(a) * r;
  flamePos[i*3+1] = Math.random() * 0.3;
  flamePos[i*3+2] = Math.sin(a) * r;
  flameData.push({ speed: 0.4 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2, startY: flamePos[i*3+1], baseR: r, baseA: a });
}
flameGeom.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
// flame texture: radial gradient
const fTex = document.createElement('canvas');
fTex.width = 128; fTex.height = 128;
const fCtx = fTex.getContext('2d');
const fG = fCtx.createRadialGradient(64, 64, 0, 64, 64, 60);
fG.addColorStop(0, 'rgba(255,240,200,1)');
fG.addColorStop(0.25, 'rgba(255,160,60,0.9)');
fG.addColorStop(0.6, 'rgba(255,80,20,0.35)');
fG.addColorStop(1, 'rgba(120,20,5,0)');
fCtx.fillStyle = fG; fCtx.fillRect(0, 0, 128, 128);
const flameMat = new THREE.PointsMaterial({
  map: new THREE.CanvasTexture(fTex), size: 0.7, transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, sizeAttenuation: true,
});
const flames = new THREE.Points(flameGeom, flameMat);
campGroup.add(flames);

// ember sparks flying up
const emberCount = 40;
const emberGeom = new THREE.BufferGeometry();
const emberPos = new Float32Array(emberCount * 3);
const emberData = [];
for (let i = 0; i < emberCount; i++) {
  emberPos[i*3]   = (Math.random()-0.5) * 0.3;
  emberPos[i*3+1] = Math.random() * 2;
  emberPos[i*3+2] = (Math.random()-0.5) * 0.3;
  emberData.push({ speed: 0.3 + Math.random()*0.7, phase: Math.random() * Math.PI * 2, life: Math.random() });
}
emberGeom.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
const emberMat = new THREE.PointsMaterial({ color: 0xffc870, size: 0.06, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
const embers = new THREE.Points(emberGeom, emberMat);
campGroup.add(embers);

// campfire light (warm orange)
const fireLight = new THREE.PointLight(0xff7030, 4.5, 16, 1.8);
fireLight.position.set(0, 1.1, 5.5);
scene.add(fireLight);
// secondary warm glow (close to tent)
const tentGlow = new THREE.PointLight(0xff6030, 1.2, 6, 2.4);
tentGlow.position.set(3.2, -0.2, 4.5);
scene.add(tentGlow);

// moonlight
const moon = new THREE.DirectionalLight(0x6a8cc8, 0.45);
moon.position.set(-6, 20, -4);
scene.add(moon);
scene.add(new THREE.AmbientLight(0x14101a, 0.2));

// ───── atmospheric rain ─────
const rainCount = 400;
const rainGeom = new THREE.BufferGeometry();
const rainPos = new Float32Array(rainCount * 3);
const rainVel = [];
for (let i = 0; i < rainCount; i++) {
  rainPos[i*3]   = (Math.random()-0.5) * 60;
  rainPos[i*3+1] = Math.random() * 30;
  rainPos[i*3+2] = (Math.random()-0.5) * 30;
  rainVel.push(20 + Math.random() * 15);
}
rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.PointsMaterial({ color: 0x8aa0c0, size: 0.03, transparent: true, opacity: 0.35, depthWrite: false });
const rain = new THREE.Points(rainGeom, rainMat);
scene.add(rain);

// ───── mouse parallax ─────
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('mousemove', e => {
  mouse.tx = (e.clientX / innerWidth - 0.5);
  mouse.ty = (e.clientY / innerHeight - 0.5);
});

// ───── scroll fades scene opacity ─────
const sceneEl = document.getElementById('scene');
const dashBg = document.getElementById('dashBg');
addEventListener('scroll', () => {
  const y = scrollY;
  const vh = innerHeight;
  // fully opaque for first vh (hero), fade to 0.3 across next 0.5vh, stays at 0.3
  const t = Math.min(1, Math.max(0, (y - vh * 0.5) / (vh * 0.7)));
  const opacity = 1 - t * 0.7;
  sceneEl.style.opacity = opacity;
  dashBg.classList.toggle('show', y > vh * 0.5);
});

// ───── render loop ─────
const clock = new THREE.Clock();
function loop(){
  const t = clock.getElapsedTime();
  const dt = clock.getDelta();

  // mouse smoothing + parallax
  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;
  camera.position.x = mouse.x * 2;
  camera.position.y = 2.4 + mouse.y * -0.8;
  camera.lookAt(0, 2.6 + mouse.y * -0.4, 0);

  // fire flicker (campfire light intensity + position jitter)
  fireLight.intensity = 4 + Math.sin(t * 14) * 0.5 + Math.sin(t * 29) * 0.4 + Math.random() * 0.3;
  fireLight.position.x = Math.sin(t * 3.2) * 0.08;
  fireLight.position.z = 5.5 + Math.cos(t * 3.8) * 0.05;
  tentGlow.intensity = 1 + Math.sin(t * 9) * 0.15;

  // flame particle motion
  const fp = flames.geometry.attributes.position.array;
  for (let i = 0; i < flameCount; i++) {
    const d = flameData[i];
    const lt = (t * d.speed + d.phase) % 1.5;
    const r = d.baseR * (1 - lt / 1.5);
    fp[i*3]   = Math.cos(d.baseA + Math.sin(t * 2 + d.phase) * 0.3) * r + Math.sin(t * 3 + d.phase) * 0.08;
    fp[i*3+1] = lt * 1.1;
    fp[i*3+2] = Math.sin(d.baseA + Math.sin(t * 2 + d.phase) * 0.3) * r;
  }
  flames.geometry.attributes.position.needsUpdate = true;

  // embers rising + resetting
  const ep = embers.geometry.attributes.position.array;
  for (let i = 0; i < emberCount; i++) {
    const d = emberData[i];
    d.life += dt * d.speed * 0.3;
    if (d.life > 1) { d.life = 0; ep[i*3] = (Math.random()-0.5) * 0.3; ep[i*3+2] = (Math.random()-0.5) * 0.3; }
    ep[i*3+1] = d.life * 3;
    ep[i*3]   += Math.sin(t * 2 + d.phase) * dt * 0.3;
  }
  embers.geometry.attributes.position.needsUpdate = true;
  embers.material.opacity = 0.75;

  // rain falling
  const rp = rain.geometry.attributes.position.array;
  for (let i = 0; i < rainCount; i++) {
    rp[i*3+1] -= rainVel[i] * dt;
    if (rp[i*3+1] < -2) { rp[i*3+1] = 25; rp[i*3] = (Math.random()-0.5) * 60; rp[i*3+2] = (Math.random()-0.5) * 30; }
  }
  rain.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

console.log('[scene] Tokyo campfire initialised ✓');
} catch (err) {
  console.error('[scene] FAILED:', err);
  window.__sceneErr = err;
  // Show a diagnostic banner so it's not silent
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(239,68,68,0.12);color:#f7b5b5;border:1px solid rgba(239,68,68,0.35);padding:10px 16px;border-radius:10px;font-family:monospace;font-size:11px;z-index:9999;max-width:520px;text-align:center';
  banner.textContent = 'Scene failed: ' + (err.message || err);
  document.body.appendChild(banner);
}
