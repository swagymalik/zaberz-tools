/* ============================================
   LOAN EMI CALCULATOR — TOOL LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const amountEl = document.getElementById('amount');
  const rateEl = document.getElementById('rate');
  const tenureEl = document.getElementById('tenure');
  const tenureUnitEl = document.getElementById('tenureUnit');
  const calcBtn = document.getElementById('calcBtn');
  const resultBox = document.getElementById('resultBox');
  const scheduleBody = document.getElementById('scheduleBody');
  const toast = document.getElementById('toast');

  const statEMI = document.getElementById('statEMI');
  const statInterest = document.getElementById('statInterest');
  const statTotal = document.getElementById('statTotal');

  let chart;

  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function formatNumber(num) {
    return Math.round(num).toLocaleString('en-US');
  }

  function calculateEMI() {
    const principal = parseFloat(amountEl.value);
    const annualRate = parseFloat(rateEl.value);
    let tenureInput = parseFloat(tenureEl.value);

    if (!principal || principal <= 0 || annualRate === '' || isNaN(annualRate) || annualRate < 0 || !tenureInput || tenureInput <= 0) {
      showToast('Please enter valid loan details');
      return;
    }

    const months = tenureUnitEl.value === 'years' ? Math.round(tenureInput * 12) : Math.round(tenureInput);
    const monthlyRate = annualRate / 1200;

    let emi;
    if (monthlyRate === 0) {
      emi = principal / months;
    } else {
      const factor = Math.pow(1 + monthlyRate, months);
      emi = (principal * monthlyRate * factor) / (factor - 1);
    }

    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    statEMI.textContent = formatNumber(emi);
    statInterest.textContent = formatNumber(totalInterest);
    statTotal.textContent = formatNumber(totalPayment);

    buildSchedule(principal, monthlyRate, months, emi);
    updateChart(principal, totalInterest);

    resultBox.style.display = 'block';
  }

  function buildSchedule(principal, monthlyRate, months, emi) {
    let balance = principal;
    let yearPrincipal = 0;
    let yearInterest = 0;
    const rows = [];

    for (let m = 1; m <= months; m++) {
      const interestPortion = balance * monthlyRate;
      let principalPortion = emi - interestPortion;
      if (principalPortion > balance) principalPortion = balance;

      balance -= principalPortion;
      yearPrincipal += principalPortion;
      yearInterest += interestPortion;

      if (m % 12 === 0 || m === months) {
        rows.push({
          year: Math.ceil(m / 12),
          principal: yearPrincipal,
          interest: yearInterest,
          balance: Math.max(balance, 0),
        });
        yearPrincipal = 0;
        yearInterest = 0;
      }
    }

    scheduleBody.innerHTML = rows.map(r => `
      <tr>
        <td>Year ${r.year}</td>
        <td>${formatNumber(r.principal)}</td>
        <td>${formatNumber(r.interest)}</td>
        <td>${formatNumber(r.balance)}</td>
      </tr>
    `).join('');
  }

  function updateChart(principal, totalInterest) {
    const canvas = document.getElementById('loanChart');
    if (!canvas || !window.Chart) return;

    const data = [Math.round(principal), Math.round(totalInterest)];

    if (chart) {
      chart.data.datasets[0].data = data;
      chart.update();
      return;
    }

    chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Principal', 'Total Interest'],
        datasets: [{
          data: data,
          backgroundColor: ['rgba(79, 107, 255, 0.75)', 'rgba(212, 175, 106, 0.75)'],
          borderColor: ['#4f6bff', '#d4af6a'],
          borderWidth: 1.5,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8892ab', font: { family: 'Poppins' }, padding: 16 }
          }
        }
      }
    });
  }

  calcBtn.addEventListener('click', calculateEMI);

  [amountEl, rateEl, tenureEl].forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') calculateEMI();
    });
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