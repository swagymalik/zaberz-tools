/* ============================================
   BASE64 ENCODER / DECODER — TOOL LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const textArea = document.getElementById('text');
  const urlSafeCheckbox = document.getElementById('urlSafe');
  const errorText = document.getElementById('errorText');
  const toast = document.getElementById('toast');

  /* ---------- Toast helper ---------- */
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function showError(show) {
    errorText.classList.toggle('show', show);
  }

  /* ---------- UTF-8 safe Base64 helpers ---------- */
  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function base64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function toUrlSafe(b64) {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function normalizeForDecode(b64) {
    let str = b64.trim().replace(/-/g, '+').replace(/_/g, '/');
    const pad = str.length % 4;
    if (pad) str += '='.repeat(4 - pad);
    return str;
  }

  /* ---------- Encode ---------- */
  document.getElementById('encodeBtn').addEventListener('click', () => {
    const input = textArea.value;
    if (!input) {
      showToast('Nothing to encode');
      return;
    }
    try {
      let encoded = utf8ToBase64(input);
      if (urlSafeCheckbox.checked) encoded = toUrlSafe(encoded);
      textArea.value = encoded;
      showError(false);
    } catch {
      showToast('Could not encode this text');
    }
  });

  /* ---------- Decode ---------- */
  document.getElementById('decodeBtn').addEventListener('click', () => {
    const input = textArea.value;
    if (!input) {
      showToast('Nothing to decode');
      return;
    }
    try {
      const normalized = normalizeForDecode(input);
      const decoded = base64ToUtf8(normalized);
      textArea.value = decoded;
      showError(false);
    } catch {
      showError(true);
      showToast('Invalid Base64 string');
    }
  });

  /* ---------- Copy ---------- */
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

  document.getElementById('copyBtn').addEventListener('click', () => {
    if (!textArea.value) { showToast('Nothing to copy'); return; }
    copyText(textArea.value);
  });

  /* ---------- Download ---------- */
  document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!textArea.value) { showToast('Nothing to download'); return; }
    const blob = new Blob([textArea.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zaberz-base64.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded!');
  });

  /* ---------- Clear ---------- */
  document.getElementById('clearBtn').addEventListener('click', () => {
    textArea.value = '';
    showError(false);
    textArea.focus();
  });

  /* ---------- File to Base64 ---------- */
  const fileInput = document.getElementById('fileInput');
  const fileDrop = document.getElementById('fileDrop');
  const fileInfo = document.getElementById('fileInfo');
  const fileResult = document.getElementById('fileResult');
  const includeDataUri = document.getElementById('includeDataUri');

  let lastDataUrl = '';

  function handleFile(file) {
    if (!file) return;
    fileInfo.textContent = `${file.name} — ${(file.size / 1024).toFixed(1)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      lastDataUrl = reader.result;
      updateFileOutput();
    };
    reader.onerror = () => showToast('Could not read this file');
    reader.readAsDataURL(file);
  }

  function updateFileOutput() {
    if (!lastDataUrl) return;
    if (includeDataUri.checked) {
      fileResult.value = lastDataUrl;
    } else {
      fileResult.value = lastDataUrl.split(',')[1] || '';
    }
  }

  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  includeDataUri.addEventListener('change', updateFileOutput);

  // Drag & drop support
  ['dragover', 'dragenter'].forEach(evt => {
    fileDrop.addEventListener(evt, (e) => {
      e.preventDefault();
      fileDrop.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    fileDrop.addEventListener(evt, (e) => {
      e.preventDefault();
      fileDrop.classList.remove('drag-over');
    });
  });
  fileDrop.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  document.getElementById('copyFileBtn').addEventListener('click', () => {
    if (!fileResult.value) { showToast('Upload a file first'); return; }
    copyText(fileResult.value);
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

});