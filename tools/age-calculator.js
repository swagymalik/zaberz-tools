/* ============================================
   AGE CALCULATOR — TOOL LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const dobInput = document.getElementById('dob');
  const calcBtn = document.getElementById('calcBtn');
  const resultBox = document.getElementById('resultBox');
  const toast = document.getElementById('toast');

  const els = {
    ageMain: document.getElementById('ageMain'),
    ageSub: document.getElementById('ageSub'),
    years: document.getElementById('statYears'),
    months: document.getElementById('statMonths'),
    days: document.getElementById('statDays'),
    totalDays: document.getElementById('statTotalDays'),
    totalWeeks: document.getElementById('statTotalWeeks'),
    totalMonths: document.getElementById('statTotalMonths'),
    birthDay: document.getElementById('statBirthDay'),
    zodiac: document.getElementById('statZodiac'),
    note: document.getElementById('birthdayNote'),
  };

  const ZODIAC = [
    { sign: 'Capricorn', endMonth: 0, endDay: 19 },
    { sign: 'Aquarius', endMonth: 1, endDay: 18 },
    { sign: 'Pisces', endMonth: 2, endDay: 20 },
    { sign: 'Aries', endMonth: 3, endDay: 19 },
    { sign: 'Taurus', endMonth: 4, endDay: 20 },
    { sign: 'Gemini', endMonth: 5, endDay: 20 },
    { sign: 'Cancer', endMonth: 6, endDay: 22 },
    { sign: 'Leo', endMonth: 7, endDay: 22 },
    { sign: 'Virgo', endMonth: 8, endDay: 22 },
    { sign: 'Libra', endMonth: 9, endDay: 22 },
    { sign: 'Scorpio', endMonth: 10, endDay: 21 },
    { sign: 'Sagittarius', endMonth: 11, endDay: 21 },
    { sign: 'Capricorn', endMonth: 11, endDay: 31 },
  ];

  function getZodiac(month, day) {
    for (const z of ZODIAC) {
      if (month === z.endMonth && day <= z.endDay) return z.sign;
    }
    // fallback shouldn't be reached, but default to Capricorn (year-end wrap)
    return 'Capricorn';
  }

  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function calculateAge() {
    if (!dobInput.value) {
      showToast('Please select your date of birth');
      return;
    }

    const dob = new Date(dobInput.value + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dob > today) {
      showToast('Date of birth cannot be in the future');
      return;
    }

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.floor((today - dob) / msPerDay);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;

    // Next birthday
    let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBirthday < today) {
      nextBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
    }
    const daysUntilBirthday = Math.ceil((nextBirthday - today) / msPerDay);
    const nextBirthdayWeekday = nextBirthday.toLocaleDateString('en-US', { weekday: 'long' });
    const nextBirthdayDate = nextBirthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const birthWeekday = dob.toLocaleDateString('en-US', { weekday: 'long' });
    const zodiacSign = getZodiac(dob.getMonth(), dob.getDate());

    // Update UI
    els.ageMain.textContent = years;
    els.ageSub.textContent = years === 1 ? 'year old' : 'years old';
    els.years.textContent = years;
    els.months.textContent = months;
    els.days.textContent = days;
    els.totalDays.textContent = totalDays.toLocaleString();
    els.totalWeeks.textContent = totalWeeks.toLocaleString();
    els.totalMonths.textContent = totalMonths.toLocaleString();
    els.birthDay.textContent = birthWeekday;
    els.zodiac.textContent = zodiacSign;

    const birthdayText = daysUntilBirthday === 0
      ? `🎉 It's your birthday today! Happy Birthday!`
      : `Your next birthday is in <strong>${daysUntilBirthday} day${daysUntilBirthday === 1 ? '' : 's'}</strong> (${nextBirthdayDate}, a ${nextBirthdayWeekday}).`;
    els.note.innerHTML = birthdayText;

    resultBox.style.display = 'block';
  }

  calcBtn.addEventListener('click', calculateAge);
  dobInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') calculateAge();
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