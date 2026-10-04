// ============================================
// ZABERZ — FLAPPY BIRD
// ============================================

(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // DOM elements
  const scoreValue = document.getElementById('scoreValue');
  const bestValue = document.getElementById('bestValue');
  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const finalScoreText = document.getElementById('finalScoreText');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const tapButton = document.getElementById('tapButton');

  // Game constants
  const GRAVITY = 0.45;
  const JUMP = -7.2;
  const PIPE_WIDTH = 52;
  const PIPE_GAP = 130;
  const PIPE_SPEED = 2.2;
  const PIPE_SPAWN_INTERVAL = 100;

  // Game state
  let bird, pipes, score, best, gameState, frameCount;

  // High score localStorage
  try {
    best = parseInt(localStorage.getItem('zaberz_flappy_best')) || 0;
    bestValue.textContent = best;
  } catch (e) {
    best = 0;
  }

  function resetGame() {
    bird = {
      x: 80,
      y: canvas.height / 2,
      vy: 0,
      radius: 14
    };
    pipes = [];
    score = 0;
    frameCount = 0;
    scoreValue.textContent = '0';
  }

  function jump() {
    if (gameState === 'playing') {
      bird.vy = JUMP;
    }
  }

  function spawnPipe() {
    const minH = 70;
    const maxH = canvas.height - PIPE_GAP - minH;
    const topHeight = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
    pipes.push({
      x: canvas.width,
      topHeight: topHeight,
      bottomY: topHeight + PIPE_GAP,
      passed: false
    });
  }

  function update() {
    if (gameState !== 'playing') return;

    // Bird physics
    bird.vy += GRAVITY;
    bird.y += bird.vy;

    // Spawn pipes
    if (frameCount % PIPE_SPAWN_INTERVAL === 0) {
      spawnPipe();
    }

    // Move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= PIPE_SPEED;

      // Check score
      if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < bird.x) {
        pipes[i].passed = true;
        score++;
        scoreValue.textContent = score;
      }

      // Remove off-screen pipes
      if (pipes[i].x + PIPE_WIDTH < 0) {
        pipes.splice(i, 1);
        continue;
      }

      // Collision with pipes
      const inPipeX = bird.x + bird.radius > pipes[i].x &&
                      bird.x - bird.radius < pipes[i].x + PIPE_WIDTH;
      const inTopPipe = bird.y - bird.radius < pipes[i].topHeight;
      const inBottomPipe = bird.y + bird.radius > pipes[i].bottomY;

      if (inPipeX && (inTopPipe || inBottomPipe)) {
        endGame();
        return;
      }
    }

    // Ground / Ceiling collision
    if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
      endGame();
      return;
    }

    frameCount++;
  }

  function draw() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pipes
    pipes.forEach(pipe => {
      // Top pipe
      const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      topGrad.addColorStop(0, '#22c55e');
      topGrad.addColorStop(0.5, '#4ade80');
      topGrad.addColorStop(1, '#166534');
      ctx.fillStyle = topGrad;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

      // Top pipe cap
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(pipe.x - 4, pipe.topHeight - 28, PIPE_WIDTH + 8, 28);
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x - 4, pipe.topHeight - 28, PIPE_WIDTH + 8, 28);

      // Bottom pipe
      const bottomGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      bottomGrad.addColorStop(0, '#22c55e');
      bottomGrad.addColorStop(0.5, '#4ade80');
      bottomGrad.addColorStop(1, '#166534');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);

      // Bottom pipe cap
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(pipe.x - 4, pipe.bottomY, PIPE_WIDTH + 8, 28);
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x - 4, pipe.bottomY, PIPE_WIDTH + 8, 28);
    });

    // Draw bird
    // Shadow
    ctx.beginPath();
    ctx.arc(bird.x + 2, bird.y + 2, bird.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // Body
    const birdGrad = ctx.createLinearGradient(bird.x, bird.y - bird.radius, bird.x, bird.y + bird.radius);
    birdGrad.addColorStop(0, '#fbbf24');
    birdGrad.addColorStop(0.5, '#f59e0b');
    birdGrad.addColorStop(1, '#d97706');
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    ctx.fillStyle = birdGrad;
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye
    ctx.beginPath();
    ctx.arc(bird.x + 5, bird.y - 4, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bird.x + 6.5, bird.y - 4.5, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Beak
    ctx.beginPath();
    ctx.moveTo(bird.x + bird.radius - 2, bird.y);
    ctx.lineTo(bird.x + bird.radius + 10, bird.y - 3);
    ctx.lineTo(bird.x + bird.radius - 2, bird.y + 6);
    ctx.closePath();
    ctx.fillStyle = '#f97316';
    ctx.fill();

    // Wing
    const wingAngle = bird.vy > 0 ? 0.4 : -0.3;
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.ellipse(-6, 2, 9, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Ground
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, canvas.height - 8, canvas.width, 8);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, canvas.height - 4, canvas.width, 4);
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
    canvas.focus();
  }

  function endGame() {
    gameState = 'gameover';
    gameOverOverlay.style.display = 'flex';
    finalScoreText.textContent = 'Score: ' + score;

    if (score > best) {
      best = score;
      bestValue.textContent = best;
      try {
        localStorage.setItem('zaberz_flappy_best', best);
      } catch (e) {}
    }
  }

  // Event listeners
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  tapButton.addEventListener('click', jump);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (gameState === 'gameover' || gameState === 'waiting') {
        startGame();
      } else {
        jump();
      }
    }
  });

  // Click on canvas
  canvas.addEventListener('click', () => {
    if (gameState === 'gameover' || gameState === 'waiting') {
      startGame();
    } else {
      jump();
    }
  });

  // Touch on canvas
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'gameover' || gameState === 'waiting') {
      startGame();
    } else {
      jump();
    }
  });

  // Initialize
  resetGame();
  gameState = 'waiting';
  gameLoop();
})();