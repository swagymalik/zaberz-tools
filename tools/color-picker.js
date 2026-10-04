/* ============================================
   COLOR PICKER — TOOL LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const colorPicker = document.getElementById('colorPicker');
  const hexInput = document.getElementById('hexInput');
  const mainPreview = document.getElementById('mainPreview');
  const hexValue = document.getElementById('hexValue');
  const rgbValue = document.getElementById('rgbValue');
  const hslValue = document.getElementById('hslValue');
  const tintsRow = document.getElementById('tintsRow');
  const shadesRow = document.getElementById('shadesRow');
  const harmonyRow = document.getElementById('harmonyRow');
  const historyRow = document.getElementById('historyRow');
  const toast = document.getElementById('toast');

  const history = [];
  const MAX_HISTORY = 8;

  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  /* ---------- Color conversion helpers ---------- */
  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  /* ---------- Main update ---------- */
  function updateColor(hex) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;

    hex = hex.toUpperCase();
    const { r, g, b } = hexToRgb(hex);
    const { h, s, l } = rgbToHsl(r, g, b);

    colorPicker.value = hex;
    hexInput.value = hex;
    mainPreview.style.background = hex;
    hexValue.textContent = hex;
    rgbValue.textContent = `rgb(${r}, ${g}, ${b})`;
    hslValue.textContent = `hsl(${h}, ${s}%, ${l}%)`;

    renderTintsShades(h, s, l);
    renderHarmony(h, s, l);
    addToHistory(hex);
  }

  function renderTintsShades(h, s, l) {
    const tints = [10, 20, 30, 40, 50].map(step => {
      const newL = Math.min(l + step, 97);
      const { r, g, b } = hslToRgb(h, s, newL);
      return rgbToHex(r, g, b);
    });
    const shades = [10, 20, 30, 40, 50].map(step => {
      const newL = Math.max(l - step, 3);
      const { r, g, b } = hslToRgb(h, s, newL);
      return rgbToHex(r, g, b);
    });

    tintsRow.innerHTML = tints.map(c => swatchHTML(c)).join('');
    shadesRow.innerHTML = shades.map(c => swatchHTML(c)).join('');
    bindSwatches(tintsRow);
    bindSwatches(shadesRow);
  }

  function renderHarmony(h, s, l) {
    const complementary = (h + 180) % 360;
    const analogous1 = (h + 30) % 360;
    const analogous2 = (h + 330) % 360;

    const colors = [complementary, analogous1, analogous2].map(hue => {
      const { r, g, b } = hslToRgb(hue, s, l);
      return rgbToHex(r, g, b);
    });

    harmonyRow.innerHTML = colors.map(c => swatchHTML(c)).join('');
    bindSwatches(harmonyRow);
  }

  function swatchHTML(hex) {
    return `<button type="button" class="swatch" style="background:${hex};" data-hex="${hex}" title="${hex}"></button>`;
  }

  function bindSwatches(container) {
    container.querySelectorAll('.swatch').forEach(sw => {
      sw.addEventListener('click', () => updateColor(sw.getAttribute('data-hex')));
    });
  }

  /* ---------- History ---------- */
  function addToHistory(hex) {
    if (history.includes(hex)) return;
    history.unshift(hex);
    if (history.length > MAX_HISTORY) history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (!history.length) {
      historyRow.innerHTML = '<span class="history-empty">Colors you pick will appear here.</span>';
      return;
    }
    historyRow.innerHTML = history.map(c => swatchHTML(c)).join('');
    bindSwatches(historyRow);
  }

  /* ---------- Copy ---------- */
  async function copyText(text) {
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

  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy');
      const el = document.getElementById(targetId);
      if (el) copyText(el.textContent);
    });
  });

  /* ---------- Input events ---------- */
  colorPicker.addEventListener('input', () => updateColor(colorPicker.value));

  hexInput.addEventListener('input', () => {
    let val = hexInput.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      updateColor(val);
    }
  });

  /* ---------- Initial render ---------- */
  updateColor(colorPicker.value);

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