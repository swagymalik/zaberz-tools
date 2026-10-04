/* ============================================
   ZABERZ RUNNER 3D — TRUE 3D ENGINE (Three.js)
   Same menu / characters / missions / save system
   as before, now rendered with real WebGL 3D.
   ============================================ */

/* ---------- Load Three.js with CDN fallback ---------- */
const THREE_VERSION = '0.180.0';
const THREE_SOURCES = [
  `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/build/three.module.js`,
  `https://unpkg.com/three@${THREE_VERSION}/build/three.module.js`,
];

async function loadThree() {
  for (const url of THREE_SOURCES) {
    try {
      const mod = await import(/* @vite-ignore */ url);
      return mod;
    } catch (err) {
      console.warn('Three.js failed to load from', url, err);
    }
  }
  return null;
}

const loadBarFill = document.getElementById('loadBarFill');
const loadText = document.getElementById('loadText');
function setLoad(pct, text) {
  if (loadBarFill) loadBarFill.style.width = pct + '%';
  if (loadText && text) loadText.textContent = text;
}

setLoad(15, 'Fetching 3D engine...');

const THREE = await loadThree();

if (!THREE) {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('errorScreen').style.display = 'flex';
  throw new Error('Three.js could not be loaded from any CDN');
}

setLoad(45, 'Building world...');

/* ============================================
   SAVE DATA (unchanged structure from before)
   ============================================ */
let saveData = {
  coins: 0, gems: 0, best: 0, level: 1, xp: 0,
  unlockedChars: ['alpha'], selectedChar: 'alpha',
  totalDistance: 0, totalJumps: 0, totalSlides: 0,
  claimedMissions: []
};
try {
  const s = localStorage.getItem('zr3d_save');
  if (s) saveData = { ...saveData, ...JSON.parse(s) };
} catch (e) { /* ignore */ }
function saveGame() {
  try { localStorage.setItem('zr3d_save', JSON.stringify(saveData)); } catch (e) { /* ignore */ }
}

const characters = [
  { id: 'alpha', name: 'Runner', icon: '🏃', color: 0x4f6bff, unlock: 'default', price: 0 },
  { id: 'cyber', name: 'Ninja', icon: '🥷', color: 0x00ffff, unlock: 'coins', price: 2000 },
  { id: 'robot', name: 'Robot', icon: '🤖', color: 0x94a3b8, unlock: 'coins', price: 5000 },
  { id: 'fire', name: 'Fire', icon: '🔥', color: 0xef4444, unlock: 'gems', price: 100 },
  { id: 'storm', name: 'Storm', icon: '⚡', color: 0xa855f7, unlock: 'level', price: 20 },
  { id: 'galaxy', name: 'Galaxy', icon: '🌌', color: 0x8b5cf6, unlock: 'coins', price: 10000 },
];

const missions = [
  { id: 'dist3000', text: 'Run 3000m', target: 3000, progress: () => saveData.totalDistance, r: 150 },
  { id: 'jump100', text: 'Jump 100 Times', target: 100, progress: () => saveData.totalJumps, r: 80 },
  { id: 'slide50', text: 'Slide 50 Times', target: 50, progress: () => saveData.totalSlides, r: 60 },
];

const worlds = [
  { name: 'Neon City', sky: 0x0a0a2e, fog: 0x0a0a2e, ground: 0x1e293b, road: 0x0f172a, line: 0x00ffff, minDist: 0 },
  { name: 'Desert', sky: 0x3a1a00, fog: 0x3a1a00, ground: 0x78350f, road: 0x451a03, line: 0xfbbf24, minDist: 2000 },
  { name: 'Snow Land', sky: 0x334155, fog: 0x334155, ground: 0xcbd5e1, road: 0xe2e8f0, line: 0xffffff, minDist: 4000 },
  { name: 'Cyber World', sky: 0x000000, fog: 0x0a0014, ground: 0x0f0f1a, road: 0x1a1a2e, line: 0xa855f7, minDist: 6000 },
];

/* ============================================
   AUDIO (simple synth SFX, unchanged approach)
   ============================================ */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new AudioCtx(); }
function sfx(f, t, v, d) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = t; o.frequency.value = f;
  g.gain.setValueAtTime(v || 0.1, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (d || 0.1));
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + (d || 0.1));
}
function sfxCoin() { sfx(880, 'square', 0.08, 0.08); setTimeout(() => sfx(1100, 'square', 0.08, 0.06), 80); }
function sfxJump() { sfx(300, 'sine', 0.12, 0.1); }
function sfxCrash() { sfx(80, 'sawtooth', 0.2, 0.2); sfx(60, 'triangle', 0.15, 0.25); }
function sfxPowerup() { sfx(600, 'square', 0.08, 0.08); setTimeout(() => sfx(900, 'square', 0.08, 0.08), 80); setTimeout(() => sfx(1200, 'square', 0.08, 0.08), 160); }

/* ============================================
   THREE.JS SCENE SETUP
   ============================================ */
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false; // baked shadow blobs are used instead, for performance

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(worlds[0].fog, 32, 140);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 5.2, 8.5);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x22224a, 1.8);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
sunLight.position.set(5, 12, 6);
scene.add(sunLight);
const fillLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(fillLight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- Lanes & constants ---------- */
const LANE_WIDTH = 2.6;
const LANE_X = [-LANE_WIDTH, 0, LANE_WIDTH];
const GROUND_Y = 0;
const JUMP_VELOCITY = 0.19;
const GRAVITY = -0.011;
const DESPAWN_Z = 11;
const SPAWN_Z = -95;

/* ============================================
   ROAD (recycled segments for infinite scroll)
   ============================================ */
const ROAD_SEGMENT_LEN = 20;
const ROAD_SEGMENTS = 6;
const roadGroup = new THREE.Group();
scene.add(roadGroup);

const roadMat = new THREE.MeshStandardMaterial({ color: worlds[0].road, roughness: 0.9 });
const groundMat = new THREE.MeshStandardMaterial({ color: worlds[0].ground, roughness: 1 });
const lineMat = new THREE.MeshBasicMaterial({ color: worlds[0].line });

const roadSegments = [];
for (let i = 0; i < ROAD_SEGMENTS; i++) {
  const segGroup = new THREE.Group();
  segGroup.position.z = -i * ROAD_SEGMENT_LEN;

  const road = new THREE.Mesh(new THREE.PlaneGeometry(LANE_WIDTH * 3 + 1, ROAD_SEGMENT_LEN), roadMat);
  road.rotation.x = -Math.PI / 2;
  segGroup.add(road);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, ROAD_SEGMENT_LEN), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  segGroup.add(ground);

  [-1, 1].forEach(side => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, ROAD_SEGMENT_LEN), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(side * LANE_WIDTH * 0.5, 0.01, 0);
    segGroup.add(line);
  });

  roadGroup.add(segGroup);
  roadSegments.push(segGroup);
}

function updateRoad(distZ) {
  roadSegments.forEach(seg => {
    seg.position.z += distZ;
    if (seg.position.z > ROAD_SEGMENT_LEN) {
      seg.position.z -= ROAD_SEGMENT_LEN * ROAD_SEGMENTS;
    }
  });
}

/* ============================================
   PLAYER CHARACTER (built from primitives)
   ============================================ */
const player = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4f6bff, roughness: 0.5, metalness: 0.1 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd782, roughness: 0.6 });

const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.55, 4, 8), bodyMat);
torso.position.y = 0.75;
player.add(torso);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), skinMat);
head.position.y = 1.35;
player.add(head);

const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 4, 8), bodyMat);
legL.position.set(-0.16, 0.28, 0);
const legR = legL.clone();
legR.position.x = 0.16;
player.add(legL, legR);

const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.42, 4, 8), bodyMat);
armL.position.set(-0.44, 0.78, 0);
const armR = armL.clone();
armR.position.x = 0.44;
player.add(armL, armR);

// Simple shadow blob (cheap fake-shadow trick, no real-time shadow maps needed)
const shadowBlob = new THREE.Mesh(
  new THREE.CircleGeometry(0.45, 16),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
);
shadowBlob.rotation.x = -Math.PI / 2;
shadowBlob.position.y = 0.02;
player.add(shadowBlob);

player.position.set(0, GROUND_Y, 0);
scene.add(player);

function applyCharacterAppearance(charId) {
  const c = characters.find(ch => ch.id === charId) || characters[0];
  bodyMat.color.setHex(c.color);
}

/* ============================================
   POOLS: obstacles / coins / powerups / particles
   ============================================ */
const obstacleGeoms = {
  train: new THREE.BoxGeometry(LANE_WIDTH * 0.8, 1.6, 1.4),
  barrier: new THREE.BoxGeometry(LANE_WIDTH * 0.8, 0.9, 0.5),
  cone: new THREE.ConeGeometry(0.35, 0.9, 12),
  laser: new THREE.BoxGeometry(LANE_WIDTH * 0.8, 0.18, 0.18),
  rock: new THREE.DodecahedronGeometry(0.55),
};
const obstacleColors = { train: 0xef4444, barrier: 0xf59e0b, cone: 0xf97316, laser: 0xef4444, rock: 0x78716c };
const obstacleJumpable = { train: false, barrier: true, cone: true, laser: false, rock: true };
const obstacleLowClear = { laser: true }; // laser is overhead-ish, jump under NOT needed; kept simple: must jump over except train

const coinGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.07, 16);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x7a5200, roughness: 0.3, metalness: 0.6 });

const gemGeo = new THREE.OctahedronGeometry(0.26);
const gemMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0x8a0e50, emissiveIntensity: 0.8, roughness: 0.15, metalness: 0.3 });

const powerupGeo = new THREE.OctahedronGeometry(0.32);
const powerupColors = { shield: 0x8b5cf6, magnet: 0xf59e0b, boost: 0x22c55e, slowmo: 0x3b82f6, jetpack: 0x00ffff, double: 0xfbbf24 };

let obstacles = [], coins = [], gemsPickups = [], powerups = [], particles = [];

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const types = Object.keys(obstacleGeoms);
  const type = types[Math.floor(Math.random() * types.length)];
  const mat = new THREE.MeshStandardMaterial({ color: obstacleColors[type], roughness: 0.6 });
  const mesh = new THREE.Mesh(obstacleGeoms[type], mat);
  const baseY = type === 'train' ? 0.8 : type === 'barrier' ? 0.45 : type === 'cone' ? 0.45 : type === 'laser' ? 0.55 : 0.4;
  mesh.position.set(LANE_X[lane], baseY, SPAWN_Z);
  scene.add(mesh);
  obstacles.push({ mesh, lane, type, jumpable: obstacleJumpable[type] });
}

function spawnCoinRow() {
  const lane = Math.floor(Math.random() * 3);
  const count = Math.random() > 0.7 ? 3 : Math.random() > 0.4 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(coinGeo, coinMat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(LANE_X[lane], 0.7, SPAWN_Z - i * 2.2);
    scene.add(mesh);
    coins.push({ mesh, lane, collected: false });
  }
}

function spawnPowerup() {
  const lane = Math.floor(Math.random() * 3);
  const type = Object.keys(powerupColors)[Math.floor(Math.random() * 6)];
  const mat = new THREE.MeshStandardMaterial({ color: powerupColors[type], emissive: powerupColors[type], emissiveIntensity: 0.6 });
  const mesh = new THREE.Mesh(powerupGeo, mat);
  mesh.position.set(LANE_X[lane], 0.9, SPAWN_Z);
  scene.add(mesh);
  powerups.push({ mesh, lane, type });
}

function spawnGem() {
  const lane = Math.floor(Math.random() * 3);
  const mesh = new THREE.Mesh(gemGeo, gemMat);
  mesh.position.set(LANE_X[lane], 0.85, SPAWN_Z);
  scene.add(mesh);
  gemsPickups.push({ mesh, lane });
}

function addParticles(x, y, z, color, n) {
  for (let i = 0; i < n; i++) {
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    particles.push({
      mesh,
      vx: (Math.random() - 0.5) * 0.08, vy: Math.random() * 0.1 + 0.02, vz: (Math.random() - 0.5) * 0.08,
      life: 1, decay: 0.03 + Math.random() * 0.03,
    });
  }
}

function clearWorldObjects() {
  [...obstacles.map(o => o.mesh), ...coins.map(c => c.mesh), ...gemsPickups.map(g => g.mesh), ...powerups.map(p => p.mesh), ...particles.map(p => p.mesh)]
    .forEach(m => scene.remove(m));
  obstacles = []; coins = []; gemsPickups = []; powerups = []; particles = [];
}

/* ============================================
   GAME STATE
   ============================================ */
let gameState = 'menu';
let score = 0, gameCoins = 0, gameGems = 0, distance = 0, frame = 0, speed = 0.28;
let currentLane = 1, targetX = LANE_X[1];
let vy = 0, isJumping = false, isSliding = false, slideTimer = 0;
let activePowerup = null, powerupTimer = 0;
let currentWorld = 0;
let runCyclePhase = 0;

function resetRun() {
  clearWorldObjects();
  currentLane = 1; targetX = LANE_X[1];
  player.position.set(targetX, GROUND_Y, 0);
  vy = 0; isJumping = false; isSliding = false; slideTimer = 0;
  score = 0; gameCoins = 0; gameGems = 0; distance = 0; frame = 0; speed = 0.28;
  activePowerup = null; powerupTimer = 0; currentWorld = 0;
  applyWorldTheme(0);
  document.getElementById('hudScore').textContent = '0';
  document.getElementById('hudCoins').textContent = '0';
  document.getElementById('hudPowerup').style.display = 'none';
}

function applyWorldTheme(idx) {
  const w = worlds[idx];
  scene.fog.color.setHex(w.fog);
  renderer.setClearColor(w.sky);
  roadMat.color.setHex(w.road);
  groundMat.color.setHex(w.ground);
  lineMat.color.setHex(w.line);
}

/* ============================================
   UPDATE LOOP
   ============================================ */
function update() {
  if (gameState !== 'playing') return;
  frame++;

  // difficulty ramp
  speed = 0.28 + Math.floor(distance / 400) * 0.035;
  if (activePowerup === 'slowmo') speed *= 0.55;
  if (activePowerup === 'boost') speed *= 1.35;

  // lane movement (smooth lerp)
  player.position.x += (targetX - player.position.x) * 0.25;

  // jump physics
  if (isJumping) {
    vy += GRAVITY;
    player.position.y += vy;
    if (player.position.y <= GROUND_Y) {
      player.position.y = GROUND_Y;
      vy = 0; isJumping = false;
    }
  } else if (activePowerup === 'jetpack') {
    player.position.y = Math.min(player.position.y + 0.03, 1.6);
  } else {
    player.position.y = GROUND_Y;
  }

  // slide
  if (isSliding) {
    slideTimer--;
    player.scale.y = 0.55;
    player.position.y = GROUND_Y;
    if (slideTimer <= 0) { isSliding = false; player.scale.y = 1; }
  }

  // running animation
  runCyclePhase += speed * 2.2;
  const swing = Math.sin(runCyclePhase) * 0.5;
  legL.rotation.x = swing; legR.rotation.x = -swing;
  armL.rotation.x = -swing; armR.rotation.x = swing;

  // powerup timer
  if (activePowerup) {
    powerupTimer--;
    document.getElementById('hudPowerupFill').style.width = (powerupTimer / 360 * 100) + '%';
    if (powerupTimer <= 0) {
      activePowerup = null;
      document.getElementById('hudPowerup').style.display = 'none';
    }
  }

  // world theme progression
  const nw = worlds.reduce((acc, w, i) => (distance >= w.minDist ? i : acc), 0);
  if (nw !== currentWorld) { currentWorld = nw; applyWorldTheme(nw); }

  // spawn cadence (scales with difficulty)
  const spawnGap = Math.max(38, 75 - Math.floor(distance / 300) * 3);
  if (frame % spawnGap === 0) spawnObstacle();
  if (frame % 22 === 0 && Math.random() > 0.35) spawnCoinRow();
  if (frame % 420 === 0 && Math.random() > 0.5) spawnPowerup();
  if (frame % 650 === 0 && Math.random() > 0.55) spawnGem();

  const worldSpeed = speed * 6;
  updateRoad(worldSpeed);

  // obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.mesh.position.z += worldSpeed;
    if (o.mesh.position.z > DESPAWN_Z) {
      scene.remove(o.mesh); obstacles.splice(i, 1); continue;
    }
    const inZone = o.mesh.position.z > -0.6 && o.mesh.position.z < 0.6;
    if (inZone && o.lane === currentLane && activePowerup !== 'shield') {
      const clearedByJump = o.jumpable && player.position.y > 0.5;
      if (!clearedByJump) { endRun(); return; }
    }
  }

  // coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.mesh.position.z += worldSpeed;
    c.mesh.rotation.y += 0.15;
    if (c.mesh.position.z > DESPAWN_Z) { scene.remove(c.mesh); coins.splice(i, 1); continue; }
    if (activePowerup === 'magnet' && Math.abs(c.mesh.position.z) < 6) {
      c.mesh.position.x += (player.position.x - c.mesh.position.x) * 0.15;
    }
    const inZone = c.mesh.position.z > -0.7 && c.mesh.position.z < 0.7;
    const laneMatch = c.lane === currentLane || Math.abs(c.mesh.position.x - player.position.x) < 0.9;
    if (!c.collected && inZone && laneMatch) {
      c.collected = true;
      const bonus = activePowerup === 'double' ? 2 : 1;
      gameCoins += bonus; score += 10 * bonus;
      sfxCoin();
      addParticles(c.mesh.position.x, 0.7, 0, 0xfbbf24, 6);
      scene.remove(c.mesh); coins.splice(i, 1);
      document.getElementById('hudCoins').textContent = gameCoins;
    }
  }

  // gem pickups (rare currency for gem-locked characters)
  for (let i = gemsPickups.length - 1; i >= 0; i--) {
    const g = gemsPickups[i];
    g.mesh.position.z += worldSpeed;
    g.mesh.rotation.y += 0.1; g.mesh.rotation.x += 0.06;
    if (g.mesh.position.z > DESPAWN_Z) { scene.remove(g.mesh); gemsPickups.splice(i, 1); continue; }
    const inZone = g.mesh.position.z > -0.7 && g.mesh.position.z < 0.7;
    if (inZone && g.lane === currentLane) {
      gameGems += 1;
      sfxPowerup();
      addParticles(g.mesh.position.x, 0.85, 0, 0xec4899, 8);
      scene.remove(g.mesh); gemsPickups.splice(i, 1);
    }
  }

  // powerups
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.mesh.position.z += worldSpeed;
    p.mesh.rotation.y += 0.08; p.mesh.rotation.x += 0.05;
    if (p.mesh.position.z > DESPAWN_Z) { scene.remove(p.mesh); powerups.splice(i, 1); continue; }
    const inZone = p.mesh.position.z > -0.7 && p.mesh.position.z < 0.7;
    if (inZone && p.lane === currentLane) {
      activePowerup = p.type; powerupTimer = 360;
      sfxPowerup();
      addParticles(p.mesh.position.x, 0.9, 0, 0x00ffff, 10);
      document.getElementById('hudPowerup').style.display = 'flex';
      document.getElementById('hudPowerupIcon').textContent =
        p.type === 'shield' ? '🛡️' : p.type === 'magnet' ? '🧲' : p.type === 'boost' ? '⚡' :
        p.type === 'slowmo' ? '🐌' : p.type === 'jetpack' ? '🚀' : '⭐';
      scene.remove(p.mesh); powerups.splice(i, 1);
    }
  }

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.mesh.position.x += pt.vx; pt.mesh.position.y += pt.vy; pt.mesh.position.z += pt.vz;
    pt.vy -= 0.004;
    pt.life -= pt.decay;
    pt.mesh.material.opacity = Math.max(pt.life, 0);
    pt.mesh.material.transparent = true;
    if (pt.life <= 0) { scene.remove(pt.mesh); particles.splice(i, 1); }
  }

  distance += worldSpeed * 0.9;
  score += 0.2 * (activePowerup === 'boost' ? 2 : 1);
  document.getElementById('hudScore').textContent = Math.floor(score);

  // camera follows player laterally, gentle bob
  camera.position.x += (player.position.x * 0.6 - camera.position.x) * 0.08;
  camera.position.y = 5.2 + Math.sin(frame * 0.05) * 0.05;
  camera.lookAt(player.position.x * 0.3, 1.2, -6);
}

function render() {
  renderer.render(scene, camera);
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

/* ============================================
   GAME FLOW
   ============================================ */
function startGame() {
  initAudio();
  resetRun();
  gameState = 'playing';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('gameHUD').style.display = 'flex';
}

function endRun() {
  gameState = 'gameover';
  sfxCrash();
  saveData.coins += gameCoins;
  saveData.gems += gameGems;
  saveData.totalDistance += Math.floor(distance);
  if (score > saveData.best) saveData.best = Math.floor(score);
  saveData.xp += Math.floor(distance / 10);
  while (saveData.xp >= saveData.level * 100) { saveData.xp -= saveData.level * 100; saveData.level++; }
  saveGame();

  document.getElementById('goScore').textContent = Math.floor(score);
  document.getElementById('goCoins').textContent = gameCoins;
  document.getElementById('goDistance').textContent = Math.floor(distance) + 'm';
  showScreen('gameOverScreen');
  document.getElementById('gameHUD').style.display = 'none';
  updateMenuStats();
}

function moveAction(dir) {
  if (gameState !== 'playing') return;
  if (dir === 'left' && currentLane > 0) { currentLane--; targetX = LANE_X[currentLane]; }
  if (dir === 'right' && currentLane < 2) { currentLane++; targetX = LANE_X[currentLane]; }
  if ((dir === 'up' || dir === 'space') && !isJumping && !isSliding) {
    vy = JUMP_VELOCITY; isJumping = true; saveData.totalJumps++; sfxJump();
  }
  if (dir === 'down' && !isJumping && !isSliding) {
    isSliding = true; slideTimer = 40; saveData.totalSlides++;
  }
}

/* ============================================
   UI SCREENS
   ============================================ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  updateMenuStats();
}

function updateMenuStats() {
  document.getElementById('menuBest').textContent = saveData.best;
  document.getElementById('menuCoins').textContent = saveData.coins;
  document.getElementById('menuGems').textContent = saveData.gems;
  document.getElementById('menuLevel').textContent = saveData.level;
}

function renderCharGrid() {
  const grid = document.getElementById('charGrid');
  grid.innerHTML = '';
  characters.forEach(c => {
    const unlocked = saveData.unlockedChars.includes(c.id);
    const selected = saveData.selectedChar === c.id;
    const div = document.createElement('div');
    div.className = 'char-card' + (selected ? ' selected' : '') + (!unlocked ? ' locked' : '');
    div.innerHTML = `<span class="char-icon">${c.icon}</span><span class="char-name">${c.name}</span>${
      !unlocked ? `<span class="char-price">${c.unlock === 'gems' ? '💎' : '🪙'} ${c.price}</span>` :
      (selected ? '<span class="char-status">✅</span>' : '<span class="char-status" style="color:var(--accent);">Select</span>')
    }`;
    div.addEventListener('click', () => {
      if (!unlocked) {
        const canBuy = (c.unlock === 'coins' && saveData.coins >= c.price) ||
                       (c.unlock === 'gems' && saveData.gems >= c.price) ||
                       (c.unlock === 'level' && saveData.level >= c.price);
        if (canBuy) {
          if (c.unlock === 'coins') saveData.coins -= c.price;
          else if (c.unlock === 'gems') saveData.gems -= c.price;
          saveData.unlockedChars.push(c.id);
          saveData.selectedChar = c.id;
          saveGame(); renderCharGrid(); updateMenuStats();
          applyCharacterAppearance(c.id);
        }
      } else {
        saveData.selectedChar = c.id;
        saveGame(); renderCharGrid();
        applyCharacterAppearance(c.id);
      }
    });
    grid.appendChild(div);
  });
}

function renderMissions() {
  document.getElementById('missionList').innerHTML = missions.map(m => {
    const p = Math.min(m.progress(), m.target);
    const done = p >= m.target;
    const claimed = saveData.claimedMissions.includes(m.id);
    let rightSide;
    if (claimed) {
      rightSide = `<span style="color:var(--green);">✅ Claimed</span>`;
    } else if (done) {
      rightSide = `<button type="button" class="btn btn-primary btn-small" data-claim="${m.id}" style="padding:4px 12px;">Claim 🪙${m.r}</button>`;
    } else {
      rightSide = `<span style="color:var(--gold);">${p}/${m.target} 🪙${m.r}</span>`;
    }
    return `<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:8px;"><span>${done ? '✅ ' : ''}${m.text}</span>${rightSide}</div>`;
  }).join('');

  document.querySelectorAll('[data-claim]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-claim');
      const mission = missions.find(m => m.id === id);
      if (!mission || saveData.claimedMissions.includes(id)) return;
      if (mission.progress() < mission.target) return;
      saveData.coins += mission.r;
      saveData.claimedMissions.push(id);
      saveGame();
      renderMissions();
      updateMenuStats();
    });
  });
}

/* ============================================
   INPUT
   ============================================ */
document.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); moveAction('left'); }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); moveAction('right'); }
  if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') { e.preventDefault(); moveAction(e.code === 'Space' ? 'space' : 'up'); }
  if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); moveAction('down'); }
});

let touchStart = null;
canvas.addEventListener('touchstart', e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (gameState !== 'playing' && gameState !== 'menu') return;
});
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
    moveAction(dx < 0 ? 'left' : 'right');
  } else if (dy < -30) {
    moveAction('up');
  } else if (dy > 40) {
    moveAction('down');
  }
  touchStart = null;
});

/* ============================================
   UI BUTTON WIRING
   ============================================ */
document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('playAgainBtn').addEventListener('click', startGame);
document.getElementById('charBtn').addEventListener('click', () => showScreen('charScreen'));
document.getElementById('missionBtn').addEventListener('click', () => showScreen('missionScreen'));
document.getElementById('menuBtn').addEventListener('click', () => showScreen('menuScreen'));
document.querySelectorAll('[data-back]').forEach(btn => btn.addEventListener('click', () => showScreen('menuScreen')));

/* ============================================
   BOOT
   ============================================ */
setLoad(80, 'Almost ready...');
applyCharacterAppearance(saveData.selectedChar);
renderCharGrid();
renderMissions();
updateMenuStats();
applyWorldTheme(0);

setLoad(100, 'Ready!');
setTimeout(() => {
  document.getElementById('loadingScreen').style.display = 'none';
  showScreen('menuScreen');
  gameLoop();
}, 250);