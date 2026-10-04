/* ============================================
   IMAGE COMPRESSOR — TOOL LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const imgInput = document.getElementById('imgInput');
  const fileDrop = document.getElementById('fileDrop');
  const fileInfo = document.getElementById('fileInfo');
  const formatSelect = document.getElementById('format');
  const qualitySlider = document.getElementById('quality');
  const qualityGroup = document.getElementById('qualityGroup');
  const qv = document.getElementById('qv');
  const scaleSlider = document.getElementById('scale');
  const sv = document.getElementById('sv');
  const sharpenCheck = document.getElementById('sharpen');
  const compressBtn = document.getElementById('compressBtn');
  const resultArea = document.getElementById('resultArea');
  const originalImg = document.getElementById('originalImg');
  const originalStat = document.getElementById('originalStat');
  const canvas = document.getElementById('canvas');
  const compressedStat = document.getElementById('compressedStat');
  const reductionValue = document.getElementById('reductionValue');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const toast = document.getElementById('toast');

  let currentFile = null;
  let lastBlob = null;
  let originalKB = 0;

  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  /* ---------- Slider labels ---------- */
  qualitySlider.addEventListener('input', () => { qv.textContent = qualitySlider.value + '%'; });
  scaleSlider.addEventListener('input', () => { sv.textContent = scaleSlider.value + '%'; });

  /* ---------- Quality only applies to lossy formats ---------- */
  function updateQualityVisibility() {
    qualityGroup.classList.toggle('hidden', formatSelect.value === 'image/png');
  }
  formatSelect.addEventListener('change', updateQualityVisibility);
  updateQualityVisibility();

  /* ---------- File handling ---------- */
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }
    currentFile = file;
    originalKB = file.size / 1024;
    fileInfo.textContent = `${file.name} — ${originalKB.toFixed(1)} KB`;

    originalImg.src = URL.createObjectURL(file);
    originalImg.onload = () => {
      originalStat.innerHTML = `<strong>${originalKB.toFixed(1)} KB</strong> &middot; ${originalImg.naturalWidth}&times;${originalImg.naturalHeight}px`;
    };
  }

  imgInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

  ['dragover', 'dragenter'].forEach(evt => {
    fileDrop.addEventListener(evt, (e) => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
  });
  ['dragleave', 'drop'].forEach(evt => {
    fileDrop.addEventListener(evt, (e) => { e.preventDefault(); fileDrop.classList.remove('drag-over'); });
  });
  fileDrop.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  /* ---------- Sharpen kernel (unchanged logic, proven to work) ---------- */
  function applySharpen(ctx, w, h) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const out = ctx.createImageData(w, h);
    const o = out.data;
    const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0, i = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * w + (x + kx)) * 4 + c;
              sum += data[idx] * k[i++];
            }
          }
          const idx = (y * w + x) * 4 + c;
          o[idx] = Math.min(255, Math.max(0, sum));
        }
        o[(y * w + x) * 4 + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  /* ---------- Compress ---------- */
  function compressImage() {
    if (!currentFile) {
      showToast('Please select an image first');
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(currentFile);

    img.onload = () => {
      const ctx = canvas.getContext('2d');
      const scale = parseInt(scaleSlider.value, 10) / 100;

      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (sharpenCheck.checked) {
        applySharpen(ctx, canvas.width, canvas.height);
      }

      const format = formatSelect.value;
      const quality = parseInt(qualitySlider.value, 10) / 100;

      canvas.toBlob((blob) => {
        if (!blob) {
          showToast('Could not process this image — try a different format');
          return;
        }

        lastBlob = blob;
        const compressedKB = blob.size / 1024;
        compressedStat.innerHTML = `<strong>${compressedKB.toFixed(1)} KB</strong> &middot; ${canvas.width}&times;${canvas.height}px`;

        const reduction = ((originalKB - compressedKB) / originalKB) * 100;
        const isSmaller = reduction >= 0;
        reductionValue.textContent = (isSmaller ? '-' : '+') + Math.abs(reduction).toFixed(1) + '%';
        reductionValue.style.color = isSmaller ? '#22c55e' : '#ef4444';

        resultArea.style.display = 'block';
      }, format, format === 'image/png' ? undefined : quality);
    };

    img.onerror = () => showToast('Could not load this image');
  }

  compressBtn.addEventListener('click', compressImage);

  /* ---------- Download ---------- */
  downloadBtn.addEventListener('click', () => {
    if (!lastBlob) { showToast('Compress an image first'); return; }
    const ext = formatSelect.value === 'image/png' ? 'png' : (formatSelect.value === 'image/webp' ? 'webp' : 'jpg');
    const url = URL.createObjectURL(lastBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zaberz-compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded!');
  });

  /* ---------- Reset ---------- */
  resetBtn.addEventListener('click', () => {
    currentFile = null;
    lastBlob = null;
    imgInput.value = '';
    fileInfo.textContent = 'No image selected';
    resultArea.style.display = 'none';
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