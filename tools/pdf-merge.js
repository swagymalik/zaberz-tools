/* ============================================
   PDF MERGE TOOL — TOOL LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const pdfInput = document.getElementById('pdfInput');
  const fileDrop = document.getElementById('fileDrop');
  const fileListEl = document.getElementById('pdfFileList');
  const mergeBtn = document.getElementById('mergeBtn');
  const resultArea = document.getElementById('resultArea');
  const resultStat = document.getElementById('resultStat');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const toast = document.getElementById('toast');

  let queuedFiles = [];
  let mergedBlob = null;

  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function formatSize(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /* ---------- Render file queue ---------- */
  function renderList() {
    if (!queuedFiles.length) {
      fileListEl.innerHTML = '<span class="history-empty">No PDFs added yet.</span>';
      return;
    }

    fileListEl.innerHTML = queuedFiles.map((f, i) => `
      <div class="pdf-file-item">
        <span class="pdf-file-order">${i + 1}</span>
        <div class="pdf-file-meta">
          <span class="pdf-file-name">${f.name}</span>
          <span class="pdf-file-size">${formatSize(f.size)}</span>
        </div>
        <div class="pdf-file-actions">
          <button type="button" data-action="up" data-index="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">
            <span data-lucide="chevron-up" style="width:14px;height:14px;"></span>
          </button>
          <button type="button" data-action="down" data-index="${i}" ${i === queuedFiles.length - 1 ? 'disabled' : ''} aria-label="Move down">
            <span data-lucide="chevron-down" style="width:14px;height:14px;"></span>
          </button>
          <button type="button" data-action="remove" data-index="${i}" aria-label="Remove">
            <span data-lucide="x" style="width:14px;height:14px;"></span>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();

    fileListEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const action = btn.getAttribute('data-action');

        if (action === 'up' && idx > 0) {
          [queuedFiles[idx - 1], queuedFiles[idx]] = [queuedFiles[idx], queuedFiles[idx - 1]];
        } else if (action === 'down' && idx < queuedFiles.length - 1) {
          [queuedFiles[idx + 1], queuedFiles[idx]] = [queuedFiles[idx], queuedFiles[idx + 1]];
        } else if (action === 'remove') {
          queuedFiles.splice(idx, 1);
        }
        renderList();
      });
    });
  }

  /* ---------- File handling ---------- */
  function addFiles(fileList) {
    const newPdfs = Array.from(fileList).filter(f =>
      f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (!newPdfs.length) {
      showToast('Please select PDF files only');
      return;
    }
    queuedFiles.push(...newPdfs);
    renderList();
  }

  pdfInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    pdfInput.value = '';
  });

  ['dragover', 'dragenter'].forEach(evt => {
    fileDrop.addEventListener(evt, (e) => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
  });
  ['dragleave', 'drop'].forEach(evt => {
    fileDrop.addEventListener(evt, (e) => { e.preventDefault(); fileDrop.classList.remove('drag-over'); });
  });
  fileDrop.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  /* ---------- Wait for pdf-lib (CDN may take a moment / fall back) ---------- */
  function waitForPDFLib(retriesLeft = 40) {
    return new Promise((resolve) => {
      function check(remaining) {
        if (typeof PDFLib !== 'undefined') {
          resolve(true);
          return;
        }
        if (remaining <= 0) {
          resolve(false);
          return;
        }
        setTimeout(() => check(remaining - 1), 250);
      }
      check(retriesLeft);
    });
  }

  /* ---------- Merge ---------- */
  mergeBtn.addEventListener('click', async () => {
    if (queuedFiles.length < 2) {
      showToast('Add at least 2 PDF files to merge');
      return;
    }

    mergeBtn.disabled = true;
    const originalLabel = mergeBtn.textContent;
    mergeBtn.textContent = 'Merging...';

    const ready = await waitForPDFLib();
    if (!ready) {
      showToast('PDF library failed to load — check your internet connection');
      mergeBtn.disabled = false;
      mergeBtn.textContent = originalLabel;
      return;
    }

    try {
      const { PDFDocument } = PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (const file of queuedFiles) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });

      resultStat.innerHTML = `<strong>${queuedFiles.length} files merged</strong> &middot; ${formatSize(mergedBlob.size)} total`;
      resultArea.style.display = 'block';
      showToast('Merged successfully!');
    } catch (err) {
      showToast('Could not merge — one of the files may be corrupted or password-protected');
    } finally {
      mergeBtn.disabled = false;
      mergeBtn.textContent = originalLabel;
    }
  });

  /* ---------- Download ---------- */
  downloadBtn.addEventListener('click', () => {
    if (!mergedBlob) { showToast('Merge PDFs first'); return; }
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zaberz-merged.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded!');
  });

  /* ---------- Start over ---------- */
  clearBtn.addEventListener('click', () => {
    queuedFiles = [];
    mergedBlob = null;
    resultArea.style.display = 'none';
    renderList();
  });

  renderList();

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