// ============================================
// ZABERZ — ARROW SHOOTER (Bow & Arrow Target)
// ============================================

(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // DOM elements
  const scoreValue = document.getElementById('scoreValue');
  const bestValue = document.getElementById('bestValue');
  const arrowsValue = document.getElementById('arrowsValue');
  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const finalScoreText = document.getElementById('finalScoreText');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');

  // Game state
  let score, best, arrowsLeft, gameState;
  let targetX, targetY, targetRadius, targetDirX, targetDirY, targetSpeed;
  let bowX, bowY, aimAngle;
  let arrows = [];
  let mouseX, mouseY;
  let particles = [];
  let floatingScores = [];

  // High score localStorage
  try {
    best = parseInt(localStorage.getItem('zaberz_arrowshooter_best')) || 0;
    bestValue.textContent = best;
  } catch (e) {
    best = 0;
  }

  // Target settings
  targetRadius = 50;
  targetSpeed = 1.2;

  function resetGame() {
    score = 0;
    arrowsLeft = 10;
    gameState = 'waiting';
    arrows = [];
    particles = [];
    floatingScores = [];
    bowX = canvas.width / 2;
    bowY = canvas.height - 80;
    aimAngle = 0;
    mouseX = canvas.width / 2;
    mouseY = canvas.height / 2;
    spawnTarget();
    updateUI();
  }

  function spawnTarget() {
    targetX = 80 + Math.random() * (canvas.width - 160);
    targetY = 80 + Math.random() * 180;
    targetDirX = (Math.random() - 0.5) * 2;
    targetDirY = (Math.random() - 0.5) * 2;
    const len = Math.sqrt(targetDirX * targetDirX + targetDirY * targetDirY);
    targetDirX /= len;
    targetDirY /= len;
  }

  function updateUI() {
    scoreValue.textContent = score;
    bestValue.textContent = best;
    arrowsValue.textContent = arrowsLeft;
  }

  function shoot() {
    if (gameState !== 'playing' || arrowsLeft <= 0) return;

    arrowsLeft--;
    updateUI();

    const arrowSpeed = 8;
    const dx = Math.cos(aimAngle) * arrowSpeed;
    const dy = Math.sin(aimAngle) * arrowSpeed;

    arrows.push({
      x: bowX,
      y: bowY,
      vx: dx,
      vy: dy,
      angle: aimAngle,
      active: true
    });
  }

  function addParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.02 + Math.random() * 0.04,
        color: color,
        size: 3 + Math.random() * 4
      });
    }
  }

  function addFloatingScore(x, y, points) {
    floatingScores.push({
      x: x,
      y: y,
      text: '+' + points,
      life: 1,
      vy: -2.5
    });
  }

  function getScoreForHit(distance) {
    if (distance < targetRadius * 0.15) return 100;  // Bullseye
    if (distance < targetRadius * 0.35) return 50;   // Inner
    if (distance < targetRadius * 0.6) return 25;    // Middle
    if (distance < targetRadius) return 10;          // Outer
    return 0;
  }

  function update() {
    if (gameState !== 'playing') return;

    // Move target
    targetX += targetDirX * targetSpeed;
    targetY += targetDirY * targetSpeed;

    // Bounce target off walls
    if (targetX - targetRadius < 0) {
      targetX = targetRadius;
      targetDirX = Math.abs(targetDirX);
    }
    if (targetX + targetRadius > canvas.width) {
      targetX = canvas.width - targetRadius;
      targetDirX = -Math.abs(targetDirX);
    }
    if (targetY - targetRadius < 0) {
      targetY = targetRadius;
      targetDirY = Math.abs(targetDirY);
    }
    if (targetY + targetRadius > canvas.height * 0.5) {
      targetY = canvas.height * 0.5 - targetRadius;
      targetDirY = -Math.abs(targetDirY);
    }

    // Update arrows
    for (let i = arrows.length - 1; i >= 0; i--) {
      const a = arrows[i];
      a.x += a.vx;
      a.y += a.vy;

      // Check collision with target
      const distToTarget = Math.hypot(a.x - targetX, a.y - targetY);
      if (distToTarget < targetRadius + 6) {
        const points = getScoreForHit(distToTarget);
        score += points;
        addParticles(a.x, a.y, points >= 50 ? '#fbbf24' : '#4ade80');
        addFloatingScore(a.x, a.y, points);
        spawnTarget();
        arrows.splice(i, 1);

        if (score > best) {
          best = score;
          try {
            localStorage.setItem('zaberz_arrowshooter_best', best);
          } catch (e) {}
        }
        updateUI();
        continue;
      }

      // Remove if off screen
      if (a.x < -20 || a.x > canvas.width + 20 || a.y < -20 || a.y > canvas.height + 20) {
        arrows.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;
      particles[i].life -= particles[i].decay;
      if (particles[i].life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update floating scores
    for (let i = floatingScores.length - 1; i >= 0; i--) {
      floatingScores[i].y += floatingScores[i].vy;
      floatingScores[i].life -= 0.025;
      if (floatingScores[i].life <= 0) {
        floatingScores.splice(i, 1);
      }
    }

    updateUI();

    // Check round over
    if (arrowsLeft <= 0 && arrows.length === 0 && particles.length === 0) {
      endGame();
    }
  }

  function drawTarget() {
    // Outer ring - red
    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // White ring
    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Red ring
    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // White inner
    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    // Bullseye
    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    // Cross lines
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(targetX - targetRadius, targetY);
    ctx.lineTo(targetX + targetRadius, targetY);
    ctx.moveTo(targetX, targetY - targetRadius);
    ctx.lineTo(targetX, targetY + targetRadius);
    ctx.stroke();
  }

  function drawBow() {
    ctx.save();
    ctx.translate(bowX, bowY);

    // Bow string
    const stringPull = 18;
    const bowHeight = 55;
    const stringX = stringPull;
    const bowLeftX = -stringPull;

    // Bow arc
    ctx.beginPath();
    ctx.moveTo(bowLeftX, -bowHeight);
    ctx.quadraticCurveTo(bowLeftX - 20, 0, bowLeftX, bowHeight);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 3;
    ctx.stroke();

    // String
    ctx.beginPath();
    ctx.moveTo(bowLeftX, -bowHeight);
    ctx.lineTo(stringX, 0);
    ctx.lineTo(bowLeftX, bowHeight);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Arrow (when aiming)
    if (arrowsLeft > 0) {
      const arrowLen = 40;
      ctx.beginPath();
      ctx.moveTo(stringX, 0);
      ctx.lineTo(stringX + arrowLen, 0);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(stringX + arrowLen, 0);
      ctx.lineTo(stringX + arrowLen - 10, -5);
      ctx.moveTo(stringX + arrowLen, 0);
      ctx.lineTo(stringX + arrowLen - 10, 5);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrow fletching
      ctx.beginPath();
      ctx.moveTo(stringX, 0);
      ctx.lineTo(stringX - 8, -5);
      ctx.moveTo(stringX, 0);
      ctx.lineTo(stringX - 8, 5);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFlyingArrows() {
    arrows.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);

      // Arrow shaft
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(28, 0);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(20, -4);
      ctx.moveTo(28, 0);
      ctx.lineTo(20, 4);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Fletching
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-6, -4);
      ctx.moveTo(0, 0);
      ctx.lineTo(-6, 4);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
      if (p.color.startsWith('#')) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawFloatingScores() {
    floatingScores.forEach(fs => {
      ctx.save();
      ctx.globalAlpha = fs.life;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px "Sora", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fs.text, fs.x, fs.y);
      ctx.restore();
    });
  }

  function drawAimLine() {
    if (arrowsLeft <= 0) return;
    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(bowX, bowY);
    const lineLen = 200;
    ctx.lineTo(bowX + Math.cos(aimAngle) * lineLen, bowY + Math.sin(aimAngle) * lineLen);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function draw() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#1e1b4b');
    skyGrad.addColorStop(0.6, '#312e81');
    skyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#f8fafc';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137.5) % canvas.width;
      const sy = (i * 89.7) % (canvas.height * 0.7);
      const twinkle = 0.4 + Math.sin(Date.now() * 0.002 + i) * 0.3;
      ctx.globalAlpha = twinkle;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ground
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, canvas.height - 8, canvas.width, 8);
    ctx.fillStyle = '#047857';
    ctx.fillRect(0, canvas.height - 4, canvas.width, 4);

    drawTarget();
    drawAimLine();
    drawBow();
    drawFlyingArrows();
    drawParticles();
    drawFloatingScores();

    // Arrow count indicator
    for (let i = 0; i < arrowsLeft; i++) {
      const ax = 15 + i * 22;
      const ay = 15;
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + 14, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax + 14, ay);
      ctx.lineTo(ax + 8, ay - 3);
      ctx.moveTo(ax + 14, ay);
      ctx.lineTo(ax + 8, ay + 3);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
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
    gameOverOverlay.style.display = 'flex';
    finalScoreText.textContent = 'Final Score: ' + score;
  }

  // Mouse tracking for aiming
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
    aimAngle = Math.atan2(mouseY - bowY, mouseX - bowX);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.touches[0].clientX - rect.left) * scaleX;
    mouseY = (e.touches[0].clientY - rect.top) * scaleY;
    aimAngle = Math.atan2(mouseY - bowY, mouseX - bowX);
  }, { passive: false });

  canvas.addEventListener('click', (e) => {
    if (gameState === 'gameover') {
      startGame();
      return;
    }
    shoot();
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'gameover') {
      startGame();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.touches[0].clientX - rect.left) * scaleX;
    mouseY = (e.touches[0].clientY - rect.top) * scaleY;
    aimAngle = Math.atan2(mouseY - bowY, mouseX - bowX);
    shoot();
  }, { passive: false });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (gameState === 'gameover') {
        startGame();
      } else {
        shoot();
      }
    }
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  // Initial target spawn
  spawnTarget();
  gameState = 'waiting';
  gameLoop();
})();