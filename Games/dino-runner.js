// ============================================
// ZABERZ — DINO RUNNER
// Dynamic Colors: Green → Yellow → Red → Blue
// Speed increases with score, color changes with speed
// ============================================

(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // DOM elements
  const scoreValue = document.getElementById('scoreValue');
  const bestValue = document.getElementById('bestValue');
  const speedValue = document.getElementById('speedValue');
  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const finalScoreText = document.getElementById('finalScoreText');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const tapButton = document.getElementById('tapButton');

  // Game constants
  const GROUND_Y = 180;
  const DINO_WIDTH = 40;
  const DINO_HEIGHT = 50;
  const DINO_X = 70;

  // Game state
  let dino, obstacles, score, best, gameState, baseSpeed, currentSpeed;
  let frameCount, speedLevel;

  // Dino color system
  const colorStages = [
    { name: 'Green',  color: '#22c55e', dark: '#166534', eye: '#f8fafc', minScore: 0 },
    { name: 'Yellow', color: '#eab308', dark: '#a16207', eye: '#1e293b', minScore: 200 },
    { name: 'Red',    color: '#ef4444', dark: '#991b1b', eye: '#f8fafc', minScore: 500 },
    { name: 'Blue',   color: '#3b82f6', dark: '#1d4ed8', eye: '#f8fafc', minScore: 1000 }
  ];

  function getDinoColors() {
    for (let i = colorStages.length - 1; i >= 0; i--) {
      if (score >= colorStages[i].minScore) {
        return colorStages[i];
      }
    }
    return colorStages[0];
  }

  // High score
  try {
    best = parseInt(localStorage.getItem('zaberz_dino_best')) || 0;
    bestValue.textContent = best;
  } catch (e) {
    best = 0;
  }

  function resetGame() {
    dino = {
      y: GROUND_Y - DINO_HEIGHT,
      vy: 0,
      jumping: false
    };
    obstacles = [];
    score = 0;
    frameCount = 0;
    baseSpeed = 5;
    currentSpeed = baseSpeed;
    speedLevel = 1;
    updateUI();
    updateSpeedDisplay();
  }

  function updateUI() {
    scoreValue.textContent = Math.floor(score);
    bestValue.textContent = best;
  }

  function updateSpeedDisplay() {
    const colors = getDinoColors();
    speedValue.textContent = speedLevel + 'x';
    speedValue.style.background = `linear-gradient(135deg, ${colors.color}, ${colors.dark})`;
    speedValue.style.webkitBackgroundClip = 'text';
    speedValue.style.backgroundClip = 'text';
    speedValue.style.color = 'transparent';
  }

  function jump() {
    if (gameState === 'playing' && !dino.jumping) {
      dino.vy = -13;
      dino.jumping = true;
    }
  }

  function spawnObstacle() {
    const minGap = 80 + Math.floor(Math.random() * 60);
    const lastObs = obstacles[obstacles.length - 1];
    if (lastObs && lastObs.x > canvas.width - minGap) return;

    const types = ['cactus-small', 'cactus-tall', 'cactus-group'];
    const type = types[Math.floor(Math.random() * types.length)];

    let width, height;
    switch (type) {
      case 'cactus-small':
        width = 16;
        height = 35;
        break;
      case 'cactus-tall':
        width = 18;
        height = 50;
        break;
      case 'cactus-group':
        width = 32;
        height = 40;
        break;
    }

    obstacles.push({
      x: canvas.width,
      y: GROUND_Y - height,
      width: width,
      height: height,
      type: type
    });
  }

  function update() {
    if (gameState !== 'playing') return;

    // Score increases with speed
    score += currentSpeed * 0.08;
    
    // Speed level based on score
    speedLevel = 1 + Math.floor(score / 150);
    currentSpeed = baseSpeed + (speedLevel - 1) * 1.5;
    
    // Update speed display every 30 frames
    if (Math.floor(frameCount) % 30 === 0) {
      updateSpeedDisplay();
    }

    // Dino physics
    if (dino.jumping) {
      dino.vy += 0.7;
      dino.y += dino.vy;
      if (dino.y >= GROUND_Y - DINO_HEIGHT) {
        dino.y = GROUND_Y - DINO_HEIGHT;
        dino.vy = 0;
        dino.jumping = false;
      }
    }

    // Spawn obstacles
    const spawnRate = Math.max(30, 100 - speedLevel * 8);
    if (frameCount % spawnRate === 0) {
      spawnObstacle();
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= currentSpeed;

      // Collision detection
      const dinoHitbox = {
        x: DINO_X + 6,
        y: dino.y + 4,
        w: DINO_WIDTH - 12,
        h: DINO_HEIGHT - 8
      };
      const obsHitbox = {
        x: obstacles[i].x + 3,
        y: obstacles[i].y + 2,
        w: obstacles[i].width - 6,
        h: obstacles[i].height - 4
      };

      if (
        dinoHitbox.x < obsHitbox.x + obsHitbox.w &&
        dinoHitbox.x + dinoHitbox.w > obsHitbox.x &&
        dinoHitbox.y < obsHitbox.y + obsHitbox.h &&
        dinoHitbox.y + dinoHitbox.h > obsHitbox.y
      ) {
        endGame();
        return;
      }

      // Remove off-screen
      if (obstacles[i].x + obstacles[i].width < 0) {
        obstacles.splice(i, 1);
      }
    }

    frameCount++;
    updateUI();
  }

  function drawGround() {
    // Ground
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, GROUND_Y, canvas.width, 4);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, GROUND_Y + 4, canvas.width, canvas.height - GROUND_Y - 4);

    // Ground texture dots
    ctx.fillStyle = '#451a03';
    const dotOffset = (frameCount * currentSpeed * 0.5) % 30;
    for (let x = -dotOffset; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.arc(x, GROUND_Y + 10, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moving ground line
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const lineOffset = (frameCount * currentSpeed) % 40;
    ctx.setLineDash([10, 30]);
    ctx.lineDashOffset = -lineOffset;
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawDino() {
    const colors = getDinoColors();
    const x = DINO_X;
    const y = dino.y;
    const legPhase = Math.floor(frameCount / 8) % 2;

    ctx.save();

    // Body
    const bodyGrad = ctx.createLinearGradient(x, y, x, y + DINO_HEIGHT);
    bodyGrad.addColorStop(0, colors.color);
    bodyGrad.addColorStop(1, colors.dark);
    ctx.fillStyle = bodyGrad;

    // Main body shape
    ctx.beginPath();
    // Head
    ctx.arc(x + 30, y + 12, 14, 0, Math.PI * 2);
    // Body
    ctx.rect(x + 8, y + 18, 24, 22);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 24);
    ctx.lineTo(x - 4, y + 16);
    ctx.lineTo(x + 4, y + 32);
    ctx.closePath();
    ctx.fill();

    // Legs
    ctx.fillStyle = colors.dark;
    if (!dino.jumping) {
      if (legPhase === 0) {
        ctx.fillRect(x + 12, y + 40, 6, 10);
        ctx.fillRect(x + 24, y + 38, 6, 12);
      } else {
        ctx.fillRect(x + 12, y + 38, 6, 12);
        ctx.fillRect(x + 24, y + 40, 6, 10);
      }
    } else {
      ctx.fillRect(x + 14, y + 38, 5, 8);
      ctx.fillRect(x + 22, y + 35, 5, 8);
    }

    // Feet
    ctx.fillStyle = colors.dark;
    if (!dino.jumping) {
      if (legPhase === 0) {
        ctx.fillRect(x + 10, y + 48, 10, 3);
        ctx.fillRect(x + 22, y + 48, 10, 3);
      } else {
        ctx.fillRect(x + 10, y + 48, 10, 3);
        ctx.fillRect(x + 22, y + 48, 10, 3);
      }
    }

    // Eye
    ctx.fillStyle = colors.eye;
    ctx.beginPath();
    ctx.arc(x + 32, y + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.dark;
    ctx.beginPath();
    ctx.arc(x + 33, y + 7, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = colors.eye;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 38, y + 14, 5, 0, Math.PI * 0.6);
    ctx.stroke();

    // Spikes on back
    ctx.fillStyle = colors.dark;
    const spikePositions = [
      { sx: 16, sy: 16, sh: 6 },
      { sx: 20, sy: 15, sh: 7 },
      { sx: 24, sy: 16, sh: 6 }
    ];
    spikePositions.forEach(sp => {
      ctx.beginPath();
      ctx.moveTo(x + sp.sx, y + sp.sy);
      ctx.lineTo(x + sp.sx + 3, y + sp.sy - sp.sh);
      ctx.lineTo(x + sp.sx + 6, y + sp.sy);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawObstacles() {
    obstacles.forEach(obs => {
      const obsGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
      obsGrad.addColorStop(0, '#22c55e');
      obsGrad.addColorStop(1, '#166534');
      ctx.fillStyle = obsGrad;

      if (obs.type === 'cactus-group') {
        // Left cactus
        ctx.fillRect(obs.x, obs.y + 8, 10, obs.height - 8);
        ctx.fillRect(obs.x + 2, obs.y, 6, 8);
        // Right cactus
        ctx.fillRect(obs.x + 16, obs.y + 4, 10, obs.height - 4);
        ctx.fillRect(obs.x + 18, obs.y, 6, 4);
        // Spines
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(obs.x + 4, obs.y + 15, 2, 4);
        ctx.fillRect(obs.x + 20, obs.y + 10, 2, 4);
      } else if (obs.type === 'cactus-tall') {
        ctx.fillRect(obs.x + 4, obs.y, 10, obs.height);
        ctx.fillRect(obs.x, obs.y + 18, 18, 4);
        ctx.fillRect(obs.x + 2, obs.y, 6, 8);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(obs.x + 8, obs.y + 25, 2, 5);
      } else {
        // Small cactus
        ctx.fillRect(obs.x + 2, obs.y + 5, 12, obs.height - 5);
        ctx.fillRect(obs.x, obs.y + 3, 16, 4);
        ctx.fillRect(obs.x + 4, obs.y, 8, 5);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(obs.x + 7, obs.y + 15, 2, 4);
      }
    });
  }

  function drawClouds() {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    const cloudOffset = (frameCount * currentSpeed * 0.3) % (canvas.width + 200);
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 250) - cloudOffset + canvas.width + 200) % (canvas.width + 200) - 100;
      const cy = 25 + i * 18;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.arc(cx + 16, cy - 4, 10, 0, Math.PI * 2);
      ctx.arc(cx + 28, cy, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSpeedIndicator() {
    const colors = getDinoColors();
    ctx.fillStyle = colors.color;
    ctx.font = 'bold 10px "Sora", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🦖 ' + colors.name + ' Mode', canvas.width - 14, 20);
  }

  function draw() {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#1e293b');
    skyGrad.addColorStop(1, '#334155');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);

    drawClouds();
    drawGround();
    drawSpeedIndicator();
    drawObstacles();
    drawDino();
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    resetGame();
    gameState = 'playing';
    startOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
  }

  function endGame() {
    gameState = 'gameover';
    const finalScore = Math.floor(score);
    gameOverOverlay.style.display = 'flex';
    finalScoreText.textContent = 'Score: ' + finalScore;

    if (finalScore > best) {
      best = finalScore;
      bestValue.textContent = best;
      try {
        localStorage.setItem('zaberz_dino_best', best);
      } catch (e) {}
    }
  }

  // Controls
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (gameState === 'gameover') {
        startGame();
      } else {
        jump();
      }
    }
  });

  canvas.addEventListener('click', () => {
    if (gameState === 'gameover') {
      startGame();
    } else {
      jump();
    }
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'gameover') {
      startGame();
    } else {
      jump();
    }
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  tapButton.addEventListener('click', jump);
  tapButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
  });

  // Initialize
  resetGame();
  gameState = 'waiting';
  gameLoop();
})();