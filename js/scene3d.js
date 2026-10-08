// Escena 3D de fondo con Three.js: fondo ilustrado con parallax, portal de vapor dorado (shader),
// Neblina del Norte volumétrica, partículas, Tito y el Guardián como sprites iluminados,
// y fichas de dominó 3D que brillan o se hacen añicos.
// Si WebGL no está disponible, el juego sigue funcionando con los fondos CSS.

window.Scene3D = (function () {
  const ASSETS = window.ASSETS || { images: {}, sprites: {} };
  let renderer, scene, camera, clock;
  let bgMesh, bgMat, fogMesh, fogMat, portal, portalMat, particles, dust;
  let tito, titoMat, guardian, guardianMat;
  let shards = [];
  let dominoes = [];
  const textures = {};
  const loader = typeof THREE !== "undefined" ? new THREE.TextureLoader() : null;
  const state = { warmth: 1, targetWarmth: 1, portalOpen: 0, targetPortal: 0, mouse: { x: 0, y: 0 }, shake: 0, titoBounce: 0, titoShiver: 0 };
  let ready = false;

  // ---------- Shaders ----------
  const FOG_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
  const NOISE = `
    vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
    vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
    vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
      vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
      vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
      vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
      vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
      vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
      vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
      m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
      vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
      return 130.0*dot(m,g);
    }
    float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*snoise(p); p*=2.1; a*=0.5; } return v; }
  `;
  // Neblina: ruido fractal animado, más densa cuanto menos "warmth".
  const FOG_FS = `
    uniform float uTime; uniform float uDensity; varying vec2 vUv; ${NOISE}
    void main(){
      vec2 p = vUv * vec2(3.0, 1.8);
      float n = fbm(p + vec2(uTime*0.03, uTime*0.01)) * 0.5 + 0.5;
      float n2 = fbm(p*1.7 - vec2(uTime*0.02, 0.0)) * 0.5 + 0.5;
      float fog = smoothstep(0.35, 0.9, n*0.6 + n2*0.4);
      // Entra por los bordes (sobre todo arriba a la izquierda, "el Norte").
      float edge = smoothstep(0.2, 1.0, length((vUv - vec2(0.75, 0.35)) * vec2(1.0, 1.4)));
      float a = fog * (0.25 + 0.75*edge) * uDensity;
      vec3 col = mix(vec3(0.72,0.75,0.79), vec3(0.45,0.48,0.52), n2);
      gl_FragColor = vec4(col, clamp(a, 0.0, 0.92));
    }`;
  // Portal: anillo de vapor dorado girando con un centro que se abre.
  const PORTAL_FS = `
    uniform float uTime; uniform float uOpen; varying vec2 vUv; ${NOISE}
    void main(){
      vec2 c = vUv - 0.5; float r = length(c)*2.0; float ang = atan(c.y, c.x);
      float swirl = fbm(vec2(ang*2.0 + uTime*0.6, r*4.0 - uTime*1.2));
      float ring = smoothstep(0.55, 0.9, r + swirl*0.15) * (1.0 - smoothstep(0.95, 1.0, r + swirl*0.1));
      float core = (1.0 - smoothstep(0.0, 0.7, r)) * uOpen;
      float steam = fbm(c*5.0 + vec2(0.0, -uTime*0.8)) * 0.5 + 0.5;
      vec3 gold = vec3(1.0, 0.76, 0.32); vec3 hot = vec3(1.0, 0.95, 0.8); vec3 sea = vec3(0.12, 0.7, 0.66);
      vec3 col = mix(gold, hot, ring*steam) * ring * 1.3 + mix(sea, gold, steam) * core * 0.6;
      float a = clamp(ring*(0.5+0.3*steam) + core*0.45, 0.0, 1.0) * uOpen * 0.8;
      gl_FragColor = vec4(col, a);
    }`;

  // Textura cacheada; `cb` se llama cuando la imagen está realmente cargada (también si ya lo estaba).
  function tex(url, cb) {
    let entry = textures[url];
    if (!entry) {
      entry = textures[url] = { loaded: false, cbs: [] };
      entry.texture = loader.load(url, () => {
        entry.loaded = true;
        entry.texture.colorSpace = THREE.SRGBColorSpace;
        entry.cbs.splice(0).forEach((fn) => fn(entry.texture));
      });
      entry.texture.minFilter = THREE.LinearFilter;
    }
    if (cb) { if (entry.loaded) cb(entry.texture); else entry.cbs.push(cb); }
    return entry.texture;
  }

  function init(canvas) {
    if (typeof THREE === "undefined") return false;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch (e) {
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    clock = new THREE.Clock();

    // Fondo ilustrado (plano grande) con color de respaldo.
    bgMat = new THREE.MeshBasicMaterial({ color: 0x1a2340 });
    bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bgMat);
    bgMesh.position.z = -6;
    scene.add(bgMesh);

    // Neblina.
    fogMat = new THREE.ShaderMaterial({ vertexShader: FOG_VS, fragmentShader: FOG_FS, transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uDensity: { value: 0.3 } } });
    fogMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fogMat);
    fogMesh.position.z = -2;
    scene.add(fogMesh);

    // Portal.
    portalMat = new THREE.ShaderMaterial({ vertexShader: FOG_VS, fragmentShader: PORTAL_FS, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uOpen: { value: 0 } } });
    portal = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), portalMat);
    portal.position.set(0, 0.6, -3);
    scene.add(portal);

    // Partículas cálidas (luciérnagas / chispas de café).
    particles = makeParticles(260, 0xffc766, 0.09);
    scene.add(particles);
    // Polvo frío de asfalto.
    dust = makeParticles(160, 0x8a9099, 0.05);
    dust.material.opacity = 0;
    scene.add(dust);

    // Tito y el Guardián como sprites.
    titoMat = new THREE.SpriteMaterial({ transparent: true, opacity: 0, depthWrite: false });
    tito = new THREE.Sprite(titoMat);
    tito.position.set(-3.2, -1.6, 0);
    scene.add(tito);
    guardianMat = new THREE.SpriteMaterial({ transparent: true, opacity: 0, depthWrite: false });
    guardian = new THREE.Sprite(guardianMat);
    guardian.position.set(3.4, -1.3, -0.5);
    scene.add(guardian);

    // Luz para los dominós 3D.
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffe2b0, 0.9);
    key.position.set(3, 5, 6);
    scene.add(key);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", (e) => {
      state.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      state.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", (e) => {
        if (e.gamma == null) return;
        state.mouse.x = Math.max(-1, Math.min(1, e.gamma / 30));
        state.mouse.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      });
    }
    resize();
    ready = true;
    requestAnimationFrame(loop);
    return true;
  }

  function makeParticles(n, color, size) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const speed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      speed[i] = 0.2 + Math.random() * 0.6;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.userData.speed = speed;
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    return new THREE.Points(geo, mat);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // El plano de fondo cubre la vista a z=-6 (distancia 16) con margen para el parallax.
    const dist = camera.position.z - bgMesh.position.z;
    const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist * 1.15;
    const vw = vh * camera.aspect;
    const t = bgMat.map;
    if (t && t.image && t.image.width) {
      // Cubrir (cover) manteniendo la proporción de la imagen.
      const ia = t.image.width / t.image.height;
      if (vw / vh > ia) bgMesh.scale.set(vw, vw / ia, 1); else bgMesh.scale.set(vh * ia, vh, 1);
    } else {
      bgMesh.scale.set(vw, vh, 1);
    }
    const fd = camera.position.z - fogMesh.position.z;
    const fh = 2 * Math.tan((camera.fov * Math.PI) / 360) * fd * 1.1;
    fogMesh.scale.set(fh * camera.aspect, fh, 1);
  }

  // Posición de los personajes según el tamaño de la ventana: en móvil, más arriba para que
  // el panel del reto no los tape; en escritorio, flanqueando el panel central.
  function layout() {
    const w = window.innerWidth, h = window.innerHeight;
    const aspect = w / h;
    const mobile = w < 640;
    const halfW = Math.tan((camera.fov * Math.PI) / 360) * 10 * aspect; // semiancho visible a z=0
    if (mobile) {
      return { titoH: 2.6, titoX: -halfW * 0.5, titoY: -0.2, guardH: 2.8, guardX: halfW * 0.5, guardY: -0.1 };
    }
    return { titoH: 3.8, titoX: -Math.min(halfW * 0.72, 5.2), titoY: -1.9, guardH: 4.0, guardX: Math.min(halfW * 0.72, 5.2), guardY: -1.7 };
  }

  // Carga una textura en el sprite respetando su proporción (no son cuadradas) y lo funde hacia dentro.
  function setSpriteImage(sprite, mat, url, height) {
    if (!url) { mat.opacity = 0; sprite.userData.fadeIn = false; return; }
    sprite.userData.height = height;
    sprite.userData.pending = url;
    tex(url, (t) => {
      if (sprite.userData.pending !== url) return; // ya se pidió otra imagen
      const img = t.image;
      if (img && img.width) sprite.scale.set(height * (img.width / img.height), height, 1);
      mat.map = t;
      mat.needsUpdate = true;
      mat.opacity = Math.min(mat.opacity, 0.001);
      sprite.userData.fadeIn = true;
    });
  }

  // ---------- API ----------
  function setBackground(key, fallbackColor) {
    if (!ready) return;
    const url = ASSETS.images[key];
    bgMat.color.set(fallbackColor || 0x1a2340);
    if (!url) { bgMat.map = null; bgMat.needsUpdate = true; resize(); return; }
    bgMesh.userData.pendingBg = url;
    tex(url, (t) => {
      if (bgMesh.userData.pendingBg !== url) return;
      bgMat.map = t;
      bgMat.color.set(0xffffff);
      bgMat.needsUpdate = true;
      resize();
      bgMesh.userData.flash = 1; // fundido suave al cambiar
    });
  }

  function setTitoPose(pose) {
    if (!ready) return;
    setSpriteImage(tito, titoMat, ASSETS.sprites[`tito_${pose}`] || ASSETS.sprites.tito_idle, layout().titoH);
  }

  function setGuardian(key) {
    if (!ready) return;
    setSpriteImage(guardian, guardianMat, key ? ASSETS.sprites[`guardian_${key}`] : null, layout().guardH);
  }

  function setWarmth(w) { state.targetWarmth = w; }
  function openPortal(open) { state.targetPortal = open ? 1 : 0; }

  // Dominó 3D: ficha de nácar que gira y brilla (acierto) o se hace añicos (fallo).
  function makeDomino() {
    const g = new THREE.BoxGeometry(0.9, 1.8, 0.22);
    const m = new THREE.MeshPhysicalMaterial({ color: 0xfff6ea, metalness: 0.15, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0xffe3a3, emissiveIntensity: 0.15, iridescence: 0.9, iridescenceIOR: 1.4 });
    const mesh = new THREE.Mesh(g, m);
    // Puntos.
    const pip = new THREE.MeshBasicMaterial({ color: 0x1b1410 });
    const pg = new THREE.CircleGeometry(0.07, 12);
    [[-0.25, 0.65], [0.25, 0.65], [-0.25, 0.3], [0.25, 0.3], [0, 0.95], [0, 0.0], [-0.25, -0.3], [0.25, -0.3], [-0.25, -0.65], [0.25, -0.65]].forEach(([x, y]) => {
      const p = new THREE.Mesh(pg, pip); p.position.set(x, y, 0.112); mesh.add(p);
    });
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.03), pip);
    bar.position.set(0, 0, 0.112);
    mesh.add(bar);
    return mesh;
  }

  function dominoGlow() {
    if (!ready) return;
    const d = makeDomino();
    d.position.set(0, -0.5, 2);
    d.userData = { kind: "glow", t: 0 };
    scene.add(d);
    dominoes.push(d);
  }

  function dominoShatter() {
    if (!ready) return;
    state.shake = 1;
    for (let i = 0; i < 18; i++) {
      const s = Math.random() * 0.25 + 0.08;
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, s * (0.6 + Math.random()), 0.12),
        new THREE.MeshStandardMaterial({ color: 0x8d9298, roughness: 0.9, metalness: 0.1 }));
      m.position.set((Math.random() - 0.5) * 0.8, -0.5 + (Math.random() - 0.5) * 1.6, 2);
      m.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 2), r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), life: 1.6 };
      scene.add(m);
      shards.push(m);
    }
    dust.material.opacity = 0.9;
  }

  function titoCelebrate() { state.titoBounce = 1; setTitoPose("happy"); }
  function titoFreeze() { state.titoShiver = 1; setTitoPose("cold"); }

  // ---------- Bucle ----------
  function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    state.warmth += (state.targetWarmth - state.warmth) * dt * 1.5;
    state.portalOpen += (state.targetPortal - state.portalOpen) * dt * 2.2;
    fogMat.uniforms.uTime.value = t;
    fogMat.uniforms.uDensity.value = 0.25 + (1 - state.warmth) * 0.75;
    portalMat.uniforms.uTime.value = t;
    portalMat.uniforms.uOpen.value = state.portalOpen;
    portal.rotation.z = t * 0.15;
    portal.scale.setScalar(0.9 + state.portalOpen * 0.4 + Math.sin(t * 1.3) * 0.03);

    // Fondo: desaturación según warmth (mezclando hacia gris) y parallax.
    const grey = 1 - state.warmth;
    if (bgMat.map) bgMat.color.setRGB(1 - grey * 0.45, 1 - grey * 0.42, 1 - grey * 0.35);
    bgMesh.position.x += ((-state.mouse.x * 0.35) - bgMesh.position.x) * dt * 3;
    bgMesh.position.y += ((state.mouse.y * 0.2) - bgMesh.position.y) * dt * 3;
    if (bgMesh.userData.flash > 0) { bgMesh.userData.flash -= dt * 1.5; bgMat.color.multiplyScalar(1 + bgMesh.userData.flash * 0.8); }

    // Cámara: parallax y sacudida al fallar.
    const shake = state.shake > 0 ? (Math.random() - 0.5) * 0.25 * state.shake : 0;
    camera.position.x += ((state.mouse.x * 0.3 + shake) - camera.position.x) * dt * 4;
    camera.position.y += ((-state.mouse.y * 0.15 + shake * 0.6) - camera.position.y) * dt * 4;
    camera.lookAt(0, 0, -3);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 1.6);

    // Partículas: suben flotando; su brillo depende de warmth.
    animateParticles(particles, dt, 1, 0.4 + state.warmth * 0.5);
    animateParticles(dust, dt, -0.7, dust.material.opacity);
    if (dust.material.opacity > 0) dust.material.opacity = Math.max(0, dust.material.opacity - dt * 0.35);

    // Tito: respiración, salto de alegría o tiritona.
    if (tito.userData.fadeIn) { titoMat.opacity = Math.min(1, titoMat.opacity + dt * 2); if (titoMat.opacity >= 1) tito.userData.fadeIn = false; }
    if (guardian.userData.fadeIn) { guardianMat.opacity = Math.min(1, guardianMat.opacity + dt * 1.5); if (guardianMat.opacity >= 1) guardian.userData.fadeIn = false; }
    const L = layout();
    let ty = L.titoY + Math.sin(t * 1.6) * 0.05;
    let tx = L.titoX;
    if (state.titoBounce > 0) { ty += Math.abs(Math.sin(state.titoBounce * Math.PI * 3)) * 0.9 * state.titoBounce; state.titoBounce = Math.max(0, state.titoBounce - dt * 0.7); }
    if (state.titoShiver > 0) { tx += (Math.random() - 0.5) * 0.08 * state.titoShiver; state.titoShiver = Math.max(0, state.titoShiver - dt * 0.5); }
    tito.position.x += (tx - tito.position.x) * dt * 4; tito.position.y += (ty - tito.position.y) * dt * 4;
    titoMat.color.setRGB(1 - grey * 0.5, 1 - grey * 0.45, 1 - grey * 0.4);
    guardian.position.x += (L.guardX - guardian.position.x) * dt * 4;
    guardian.position.y = L.guardY + Math.sin(t * 1.1 + 1) * 0.08;
    // Tamaño de los sprites al cambiar de ventana.
    if (titoMat.map && titoMat.map.image && tito.userData.height !== L.titoH) { tito.userData.height = L.titoH; tito.scale.set(L.titoH * titoMat.map.image.width / titoMat.map.image.height, L.titoH, 1); }
    if (guardianMat.map && guardianMat.map.image && guardian.userData.height !== L.guardH) { guardian.userData.height = L.guardH; guardian.scale.set(L.guardH * guardianMat.map.image.width / guardianMat.map.image.height, L.guardH, 1); }

    // Dominós que brillan.
    for (let i = dominoes.length - 1; i >= 0; i--) {
      const d = dominoes[i];
      d.userData.t += dt;
      const k = d.userData.t;
      d.rotation.y = k * 4;
      d.rotation.x = Math.sin(k * 2) * 0.3;
      d.position.y = -0.5 + k * 1.4;
      d.position.z = 2 - k * 1.2;
      const s = Math.min(1, k * 3) * (1 + Math.sin(k * 6) * 0.05);
      d.scale.setScalar(s);
      d.material.emissiveIntensity = 0.3 + Math.sin(k * 8) * 0.25 + k * 0.4;
      if (k > 1.8) { d.material.opacity = Math.max(0, 1 - (k - 1.8) * 2); d.material.transparent = true; }
      if (k > 2.4) { scene.remove(d); dominoes.splice(i, 1); }
    }
    // Añicos que caen.
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.userData.v.y -= 9.8 * dt;
      s.position.addScaledVector(s.userData.v, dt);
      s.rotation.x += s.userData.r.x * dt; s.rotation.y += s.userData.r.y * dt;
      s.userData.life -= dt;
      if (s.userData.life < 0.5) { s.material.transparent = true; s.material.opacity = Math.max(0, s.userData.life * 2); }
      if (s.userData.life <= 0) { scene.remove(s); shards.splice(i, 1); }
    }

    renderer.render(scene, camera);
  }

  function animateParticles(points, dt, dir, opacity) {
    const pos = points.geometry.attributes.position.array;
    const speed = points.geometry.userData.speed;
    for (let i = 0; i < speed.length; i++) {
      pos[i * 3 + 1] += speed[i] * dt * dir;
      pos[i * 3] += Math.sin(clock.elapsedTime * speed[i] + i) * dt * 0.15;
      if (dir > 0 && pos[i * 3 + 1] > 5.5) pos[i * 3 + 1] = -5.5;
      if (dir < 0 && pos[i * 3 + 1] < -5.5) pos[i * 3 + 1] = 5.5;
    }
    points.geometry.attributes.position.needsUpdate = true;
    points.material.opacity = opacity;
  }

  return { init, setBackground, setTitoPose, setGuardian, setWarmth, openPortal, dominoGlow, dominoShatter, titoCelebrate, titoFreeze, isReady: () => ready };
})();
