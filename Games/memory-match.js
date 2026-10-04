(function () {
  const grid = document.getElementById('memoryGrid');
  const movesValue = document.getElementById('movesValue');
  const pairsValue = document.getElementById('pairsValue');
  const timerValue = document.getElementById('timerValue');
  const winOverlay = document.getElementById('winOverlay');
  const winStatsText = document.getElementById('winStatsText');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const difficultyBtns = document.querySelectorAll('.difficulty-btn');

  const emojis = ['🎮','🎯','🎪','🎲','🎸','🎧','🎨','🎭','🎪','🎯','🎮','🎲','🎸','🎧','🎨','🎭','🦖','🐦'];

  let cards = [], flipped = [], matched = [], moves = 0, totalPairs = 8;
  let timer = 0, timerInterval = null, gameActive = false;
  let level = 'easy', cols = 4, rows = 4;

  const levelConfig = { easy: { cols: 4, rows: 4 }, medium: { cols: 6, rows: 4 }, hard: { cols: 6, rows: 6 } };

  function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

  function resetGame() {
    const cfg = levelConfig[level]; cols = cfg.cols; rows = cfg.rows; totalPairs = (cols * rows) / 2;
    cards = []; flipped = []; matched = []; moves = 0; timer = 0; gameActive = false;
    if (timerInterval) clearInterval(timerInterval); timerInterval = null;
    movesValue.textContent = '0'; pairsValue.textContent = '0/' + totalPairs; timerValue.textContent = '00:00';
    winOverlay.style.display = 'none';
    const pairEmojis = shuffle([...emojis]).slice(0, totalPairs);
    const deck = shuffle([...pairEmojis, ...pairEmojis]);
    deck.forEach((emoji, i) => cards.push({ id: i, emoji, flipped: false, matched: false }));
    renderGrid();
  }

  function renderGrid() {
    grid.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
    grid.innerHTML = '';
    cards.forEach(card => {
      const div = document.createElement('div');
      div.className = 'memory-card';
      div.dataset.id = card.id;
      div.style.cssText = 'width:60px;height:60px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:28px;background:rgba(79,107,255,0.15);border:1px solid #232a42;transition:all 0.3s ease;user-select:none;';
      if (card.flipped || card.matched) { div.style.background = 'rgba(56,189,248,0.2)'; div.style.borderColor = '#38bdf8'; div.textContent = card.emoji; }
      else { div.textContent = '?'; }
      if (card.matched) { div.style.background = 'rgba(34,197,94,0.2)'; div.style.borderColor = '#22c55e'; div.style.cursor = 'default'; }
      div.addEventListener('click', () => flipCard(card.id));
      grid.appendChild(div);
    });
  }

  function flipCard(id) {
    if (!gameActive) { gameActive = true; startTimer(); }
    if (flipped.length >= 2 || cards[id].flipped || cards[id].matched) return;
    cards[id].flipped = true; flipped.push(id); renderGrid();
    if (flipped.length === 2) {
      moves++; movesValue.textContent = moves;
      const [a, b] = flipped;
      if (cards[a].emoji === cards[b].emoji) {
        cards[a].matched = true; cards[b].matched = true; matched.push(a, b);
        pairsValue.textContent = (matched.length / 2) + '/' + totalPairs;
        flipped = []; renderGrid();
        if (matched.length === cards.length) winGame();
      } else {
        setTimeout(() => { cards[a].flipped = false; cards[b].flipped = false; flipped = []; renderGrid(); }, 600);
      }
    }
  }

  function startTimer() { if (!timerInterval) { timerInterval = setInterval(() => { timer++; const m = Math.floor(timer / 60).toString().padStart(2, '0'); const s = (timer % 60).toString().padStart(2, '0'); timerValue.textContent = m + ':' + s; }, 1000); } }

  function winGame() {
    clearInterval(timerInterval); timerInterval = null; gameActive = false;
    winOverlay.style.display = 'flex';
    winStatsText.textContent = `Moves: ${moves} | Time: ${timerValue.textContent} | Level: ${level.charAt(0).toUpperCase() + level.slice(1)}`;
  }

  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      difficultyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      level = btn.dataset.level;
      resetGame();
    });
  });

  playAgainBtn.addEventListener('click', resetGame);
  resetGame();
})();