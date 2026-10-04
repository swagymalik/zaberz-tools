/* ============================================
   QR CODE GENERATOR — TOOL LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const textEl = document.getElementById('text');
  const sizeSelect = document.getElementById('sizeSelect');
  const fgColor = document.getElementById('fgColor');
  const bgColor = document.getElementById('bgColor');
  const errorLevel = document.getElementById('errorLevel');
  const generateBtn = document.getElementById('generateBtn');
  const canvas = document.getElementById('qrCanvas');
  const placeholder = document.getElementById('qrPlaceholder');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const historyList = document.getElementById('historyList');
  const toast = document.getElementById('toast');

  let hasGenerated = false;
  const history = [];
  const MAX_HISTORY = 5;
  let debounceTimer;

  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function generateQR(retriesLeft = 40) {
    const text = textEl.value.trim();

    if (!text) {
      canvas.style.display = 'none';
      placeholder.style.display = 'block';
      placeholder.textContent = 'Your QR code will appear here.';
      hasGenerated = false;
      return;
    }

    // The QR library loads from a CDN (with automatic fallbacks) and may take
    // a few seconds if the first CDN is unreachable. Retry before erroring out.
    if (typeof QRCode === 'undefined') {
      if (retriesLeft > 0) {
        setTimeout(() => generateQR(retriesLeft - 1), 250);
        return;
      }
      showToast('QR library failed to load — check your internet connection');
      return;
    }

    const options = {
      width: parseInt(sizeSelect.value, 10),
      margin: 2,
      color: {
        dark: fgColor.value,
        light: bgColor.value,
      },
      errorCorrectionLevel: errorLevel.value,
    };

    QRCode.toCanvas(canvas, text, options, (err) => {
      if (err) {
        showToast('Could not generate QR code — try shorter text');
        return;
      }
      canvas.style.display = 'block';
      placeholder.style.display = 'none';
      hasGenerated = true;
      addToHistory(text);
    });
  }

  function scheduleGenerate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generateQR, 400);
  }

  generateBtn.addEventListener('click', () => {
    clearTimeout(debounceTimer);
    generateQR();
  });

  [textEl, sizeSelect, fgColor, bgColor, errorLevel].forEach(el => {
    el.addEventListener('input', scheduleGenerate);
    el.addEventListener('change', scheduleGenerate);
  });

  /* ---------- Download ---------- */
  downloadBtn.addEventListener('click', () => {
    if (!hasGenerated) {
      showToast('Generate a QR code first');
      return;
    }
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zaberz-qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloaded!');
  });

  /* ---------- Clear ---------- */
  clearBtn.addEventListener('click', () => {
    textEl.value = '';
    canvas.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = 'Your QR code will appear here.';
    hasGenerated = false;
    textEl.focus();
  });

  /* ---------- History ---------- */
  function addToHistory(text) {
    if (history.includes(text)) return; // avoid duplicate entries
    history.unshift(text);
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (!history.length) {
      historyList.innerHTML = '<span class="history-empty">Generated QR codes will appear here.</span>';
      return;
    }
    historyList.innerHTML = history.map(entry => {
      const short = entry.length > 40 ? entry.slice(0, 40) + '…' : entry;
      return `
        <div class="history-item">
          <span>${short}</span>
          <button type="button" data-text="${encodeURIComponent(entry)}">Reload</button>
        </div>
      `;
    }).join('');

    historyList.querySelectorAll('button[data-text]').forEach(btn => {
      btn.addEventListener('click', () => {
        textEl.value = decodeURIComponent(btn.getAttribute('data-text'));
        generateQR();
      });
    });
  }

  /* ---------- Pre-fill from URL query param (e.g. ?text=... from other tools) ---------- */
  const urlParams = new URLSearchParams(window.location.search);
  const prefillText = urlParams.get('text');
  if (prefillText) {
    textEl.value = prefillText;
    generateQR();
  }

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

});