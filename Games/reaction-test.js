// ============================================
// ZABERZ — REACTION TIME TEST (5 MODES)
// Fake Prize: $500 at 0.08s | Min Display: 0.10s
// Fake Leaderboard: SpeedDemon 0.04s
// ============================================

(function () {
  const reactionArea = document.getElementById('reactionArea');
  const reactionText = document.getElementById('reactionText');
  const reactionSub = document.getElementById('reactionSub');
  const lastTimeEl = document.getElementById('lastTime');
  const bestTimeEl = document.getElementById('bestTime');
  const attemptsEl = document.getElementById('attemptsValue');
  const categoryTabs = document.getElementById('categoryTabs');
  const resultPopup = document.getElementById('resultPopup');
  const overlayBg = document.getElementById('overlayBg');
  const popupTitle = document.getElementById('popupTitle');
  const popupTime = document.getElementById('popupTime');
  const popupMsg = document.getElementById('popupMsg');
  const closePopupBtn = document.getElementById('closePopup');

  const PRIZE_LIMIT = 0.08;
  const MIN_DISPLAY = 0.10;

  let currentMode = 'signal';
  let bestTime = null;
  let attempts = 0;
  let waitingForEvent = false;
  let waitTimeout = null;
  let startTime = 0;
  let gameActive = false;

  const modeConfig = {
    signal: { name: 'Signal Light', icon: '🚦', instruction: 'Wait for Green...', waitClass: 'waiting', goClass: 'ready' },
    stick: { name: 'Falling Stick', icon: '🏒', instruction: 'Tap when stick drops!', waitClass: 'neutral', goClass: 'neutral' },
    color: { name: 'Color Change', icon: '🎨', instruction: 'Wait for screen to turn Green...', waitClass: 'waiting', goClass: 'ready' },
    sound: { name: 'Sound Reflex', icon: '🔊', instruction: 'Listen for the beep...', waitClass: 'waiting', goClass: 'ready' },
    tap: { name: 'Quick Tap', icon: '⚡', instruction: 'Wait for target...', waitClass: 'neutral', goClass: 'neutral' }
  };

  function resetState() {
    clearTimeout(waitTimeout);
    waitingForEvent = false;
    gameActive = false;
    reactionArea.className = 'reaction-area neutral';
    reactionText.textContent = 'Click to Start';
    const cfg = modeConfig[currentMode];
    reactionSub.textContent = cfg.icon + ' ' + cfg.name + ' Mode';
  }

  function startRound() {
    if (gameActive) return;
    gameActive = true;
    waitingForEvent = true;
    const cfg = modeConfig[currentMode];
    reactionArea.className = 'reaction-area ' + cfg.waitClass;
    reactionText.textContent = cfg.instruction;
    reactionSub.textContent = cfg.icon + ' ' + cfg.name + ' Mode';

    if (currentMode === 'stick') {
      showFallingStick();
      return;
    }

    const delay = 1000 + Math.random() * 3000;
    waitTimeout = setTimeout(() => {
      if (!waitingForEvent) return;
      triggerGo();
    }, delay);
  }

  function triggerGo() {
    if (!waitingForEvent) return;
    startTime = performance.now();
    const cfg = modeConfig[currentMode];
    reactionArea.className = 'reaction-area ' + cfg.goClass;

    if (currentMode === 'sound') {
      playBeep();
      reactionText.textContent = '🔊 TAP NOW!';
    } else if (currentMode === 'color') {
      reactionText.textContent = 'TAP NOW!';
    } else if (currentMode === 'tap') {
      spawnTapTarget();
    } else {
      reactionText.textContent = 'TAP NOW!';
    }
  }

  function showFallingStick() {
    reactionText.textContent = '';
    reactionSub.textContent = '🏒 Tap to catch!';
    const stick = document.createElement('div');
    stick.className = 'stick-visual';
    stick.id = 'stickVisual';
    stick.style.height = '0px';
    stick.style.top = '0px';
    reactionArea.innerHTML = '';
    reactionArea.appendChild(stick);

    setTimeout(() => {
      if (!waitingForEvent) return;
      startTime = performance.now();
      stick.style.transition = 'height 0.4s linear';
      stick.style.height = reactionArea.offsetHeight + 'px';
      setTimeout(() => {
        if (waitingForEvent && stick.parentNode) {
          handleReaction(new Date().getTime());
        }
      }, 400);
    }, 500 + Math.random() * 1500);
  }

  function spawnTapTarget() {
    reactionArea.innerHTML = '';
    reactionText.textContent = '';
    const target = document.createElement('div');
    const size = 50 + Math.random() * 30;
    const x = 20 + Math.random() * (reactionArea.offsetWidth - size - 40);
    const y = 20 + Math.random() * (reactionArea.offsetHeight - size - 40);
    target.style.cssText = `
      position:absolute;
      width:${size}px;
      height:${size}px;
      background:linear-gradient(135deg,#fbbf24,#f59e0b);
      border-radius:50%;
      left:${x}px;
      top:${y}px;
      cursor:pointer;
      animation:pop-in 0.2s ease;
    `;
    target.id = 'tapTarget';
    reactionArea.appendChild(target);
    startTime = performance.now();
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'square';
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  function handleReaction(overrideTime) {
    if (!waitingForEvent && !overrideTime) return;
    if (!waitingForEvent) {
      if (!gameActive) return;
      clearTimeout(waitTimeout);
      resetState();
      reactionText.textContent = 'Too early! Click to retry.';
      return;
    }

    let reactionTime;
    if (overrideTime) {
      reactionTime = overrideTime - startTime;
    } else {
      reactionTime = performance.now() - startTime;
    }
    reactionTime = reactionTime / 1000;
    waitingForEvent = false;
    gameActive = false;
    clearTimeout(waitTimeout);

    if (reactionTime < 0) reactionTime = 0;
    let displayTime = Math.max(reactionTime, MIN_DISPLAY);
    displayTime = parseFloat(displayTime.toFixed(3));

    attempts++;
    attemptsEl.textContent = attempts;
    lastTimeEl.textContent = displayTime + 's';

    if (bestTime === null || displayTime < bestTime) {
      bestTime = displayTime;
      bestTimeEl.textContent = bestTime + 's';
    }

    showResultPopup(displayTime);
    resetState();
  }

  function showResultPopup(time) {
    popupTime.textContent = time + 's';

    if (time < 0.06) {
      popupTitle.textContent = '🤖 Bot Detected?!';
      popupMsg.textContent = 'That\'s inhumanly fast! Are you a robot? (Score capped at 0.10s)';
    } else if (time <= PRIZE_LIMIT) {
      popupTitle.textContent = '🏆 AMAZING! Prize Unlocked!';
      popupMsg.textContent = 'You beat 0.08s! The $500 prize will be sent to your email. Check your inbox! (Just kidding — this is a demo. But great reflexes!)';
    } else if (time < 0.15) {
      popupTitle.textContent = '⚡ Lightning Fast!';
      popupMsg.textContent = 'Incredible speed! You\'re in the top 1% of players. Almost unlocked the prize!';
    } else if (time < 0.25) {
      popupTitle.textContent = '👏 Great Reaction!';
      popupMsg.textContent = 'Above average! Keep practicing to get under 0.15s.';
    } else if (time < 0.40) {
      popupTitle.textContent = '👍 Not Bad!';
      popupMsg.textContent = 'Average reaction time. Try different modes to improve!';
    } else {
      popupTitle.textContent = '🐢 Keep Practicing!';
      popupMsg.textContent = 'A bit slow today. Try Quick Tap mode for faster reactions!';
    }

    resultPopup.classList.add('show');
    overlayBg.classList.add('show');
  }

  function hidePopup() {
    resultPopup.classList.remove('show');
    overlayBg.classList.remove('show');
  }

  // Event Listeners
  reactionArea.addEventListener('click', (e) => {
    if (e.target.id === 'tapTarget' && currentMode === 'tap') {
      handleReaction();
      return;
    }
    if (e.target.closest('#stickVisual') && currentMode === 'stick') {
      handleReaction();
      return;
    }
    if (!gameActive) {
      resetState();
      startRound();
    } else if (!waitingForEvent) {
      // Too early
    }
  });

  reactionArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.target.id === 'tapTarget' && currentMode === 'tap') {
      handleReaction();
      return;
    }
    if (!gameActive) {
      resetState();
      startRound();
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!gameActive) {
        resetState();
        startRound();
      } else if (waitingForEvent) {
        handleReaction();
      }
    }
  });

  categoryTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('cat-tab')) {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentMode = e.target.dataset.mode;
      resetState();
      reactionArea.innerHTML = '';
      reactionArea.appendChild(reactionText);
      reactionArea.appendChild(reactionSub);
      const cfg = modeConfig[currentMode];
      reactionSub.textContent = cfg.icon + ' ' + cfg.name + ' Mode';
    }
  });

  closePopupBtn.addEventListener('click', hidePopup);
  overlayBg.addEventListener('click', hidePopup);

  // Initialize
  resetState();
  bestTimeEl.textContent = '---';
  lastTimeEl.textContent = '---';
})();