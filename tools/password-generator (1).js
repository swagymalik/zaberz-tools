/* ============================================
   PASSWORD GENERATOR — TOOL LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const lengthInput = document.getElementById('length');
  const lengthValue = document.getElementById('lengthValue');
  const optUpper = document.getElementById('optUpper');
  const optLower = document.getElementById('optLower');
  const optNumbers = document.getElementById('optNumbers');
  const optSymbols = document.getElementById('optSymbols');
  const optExcludeSimilar = document.getElementById('optExcludeSimilar');
  const generateBtn = document.getElementById('generateBtn');
  const resultEl = document.getElementById('result');
  const copyIconBtn = document.getElementById('copyIconBtn');
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');
  const historyList = document.getElementById('historyList');
  const toast = document.getElementById('toast');

  const POOLS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };
  const SIMILAR = /[il1LoO0]/g;

  const history = [];
  const MAX_HISTORY = 5;

  /* ---------- Secure random helpers ---------- */
  function secureRandomInt(max) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ---------- Length slider ---------- */
  lengthInput.addEventListener('input', () => {
    lengthValue.textContent = lengthInput.value;
  });

  /* ---------- Toast helper ---------- */
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  /* ---------- Generate password ---------- */
  function generatePassword() {
    const length = parseInt(lengthInput.value, 10);
    let selectedPools = [];

    if (optUpper.checked) selectedPools.push(POOLS.upper);
    if (optLower.checked) selectedPools.push(POOLS.lower);
    if (optNumbers.checked) selectedPools.push(POOLS.numbers);
    if (optSymbols.checked) selectedPools.push(POOLS.symbols);

    // Fallback: if nothing is selected, default to lowercase + numbers
    if (selectedPools.length === 0) {
      selectedPools = [POOLS.lower, POOLS.numbers];
      optLower.checked = true;
      optNumbers.checked = true;
      showToast('No options selected — using default');
    }

    if (optExcludeSimilar.checked) {
      selectedPools = selectedPools.map(pool => pool.replace(SIMILAR, ''));
    }

    const combinedPool = selectedPools.join('');

    // Guarantee at least one character from each selected pool
    let passwordChars = selectedPools.map(pool => pool[secureRandomInt(pool.length)]);

    while (passwordChars.length < length) {
      passwordChars.push(combinedPool[secureRandomInt(combinedPool.length)]);
    }

    passwordChars = shuffle(passwordChars).slice(0, length);
    const password = passwordChars.join('');

    resultEl.textContent = password;
    updateStrength(password, combinedPool.length);
    addToHistory(password);
  }

  /* ---------- Strength meter ---------- */
  function updateStrength(password, poolSize) {
    const entropy = password.length * Math.log2(Math.max(poolSize, 2));
    let level, color, widthPct;

    if (entropy < 35) {
      level = 'Weak'; color = '#ef4444'; widthPct = 25;
    } else if (entropy < 60) {
      level = 'Fair'; color = '#f59e0b'; widthPct = 50;
    } else if (entropy < 90) {
      level = 'Strong'; color = '#38bdf8'; widthPct = 75;
    } else {
      level = 'Very Strong'; color = '#22c55e'; widthPct = 100;
    }

    strengthFill.style.width = widthPct + '%';
    strengthFill.style.background = color;
    strengthText.textContent = level;
    strengthText.style.color = color;
  }

  /* ---------- History ---------- */
  function addToHistory(password) {
    history.unshift(password);
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (!history.length) {
      historyList.innerHTML = '<span class="history-empty">Generated passwords will appear here.</span>';
      return;
    }
    historyList.innerHTML = history.map(pw => `
      <div class="history-item">
        <span>${pw}</span>
        <button type="button" data-pw="${pw}">Copy</button>
      </div>
    `).join('');

    historyList.querySelectorAll('button[data-pw]').forEach(btn => {
      btn.addEventListener('click', () => copyText(btn.getAttribute('data-pw')));
    });
  }

  /* ---------- Copy helper ---------- */
  async function copyText(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      showToast('Copied to clipboard!');
    }
  }

  /* ---------- Events ---------- */
  generateBtn.addEventListener('click', generatePassword);

  copyIconBtn.addEventListener('click', () => {
    const current = resultEl.textContent;
    if (!current || current.startsWith('Click Generate')) {
      showToast('Generate a password first');
      return;
    }
    copyText(current);
  });

  /* ---------- FAQ Accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        i.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Generate one on page load ---------- */
  generatePassword();

});