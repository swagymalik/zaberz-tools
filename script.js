// ============================================
// ZABERZ 2.0 – CYBERPUNK SCRIPT (OPTIMIZED)
// Particle Network + Cursor Glow + Magnetic Cards + Fast Scroll Reveal
// ============================================

(function () {
  // ---------- PARTICLE NETWORK (optimized) ----------
  const canvas = document.getElementById('particleCanvas') || document.getElementById('bg-canvas');
  let W, H;
  const particles = [];
  const mouse = { x: -1000, y: -1000 };
  const PARTICLE_COUNT = 60; // slightly reduced for performance
  const CONNECTION_DIST = 130;
  const MOUSE_RADIUS = 160;

  if (canvas) {
    const ctx = canvas.getContext('2d');

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * H;
      }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = 1 + Math.random() * 1.8;
        this.opacity = 0.25 + Math.random() * 0.4;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -30) this.x = W + 30;
        if (this.x > W + 30) this.x = -30;
        if (this.y < -30) this.y = H + 30;
        if (this.y > H + 30) this.y = -30;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          this.x -= dx * force * 0.025;
          this.y -= dy * force * 0.025;
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79, 107, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.2;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(79, 107, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      for (let i = 0; i < particles.length; i++) {
        const dx = mouse.x - particles[i].x;
        const dy = mouse.y - particles[i].y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_RADIUS) {
          const alpha = (1 - dist / MOUSE_RADIUS) * 0.35;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(particles[i].x, particles[i].y);
          ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // ---------- CURSOR GLOW ----------
  const cursorGlow = document.getElementById('cursorGlow');
  let cursorTimeout;
  if (cursorGlow) {
    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
      cursorGlow.style.opacity = '1';
      clearTimeout(cursorTimeout);
      cursorTimeout = setTimeout(() => { cursorGlow.style.opacity = '0'; }, 1500);
    });
    document.addEventListener('mouseleave', () => { cursorGlow.style.opacity = '0'; });
    document.addEventListener('touchmove', (e) => {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      cursorGlow.style.left = e.touches[0].clientX + 'px';
      cursorGlow.style.top = e.touches[0].clientY + 'px';
      cursorGlow.style.opacity = '1';
      clearTimeout(cursorTimeout);
      cursorTimeout = setTimeout(() => { cursorGlow.style.opacity = '0'; }, 1500);
    }, { passive: true });
  }

  // ---------- MAGNETIC TILT CARDS ----------
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0) scale(1)';
    });
  });

  // ---------- FAST SCROLL REVEAL (IntersectionObserver) ----------
  // Cards appear almost immediately when they enter the viewport.
  const revealCards = document.querySelectorAll('.card');
  if (revealCards.length) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Tiny stagger for smoothness, but much faster than before
          const index = Array.from(revealCards).indexOf(entry.target);
          const delay = Math.min(index * 15, 150); // max 150ms delay
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    revealCards.forEach(card => cardObserver.observe(card));
  }

  // Reveal sections (e.g., .reveal-section)
  const revealSections = document.querySelectorAll('.reveal-section');
  if (revealSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealSections.forEach(section => sectionObserver.observe(section));
  }

  // ---------- MOBILE NAV TOGGLE ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // ---------- COUNTER ANIMATION ----------
  const statNums = document.querySelectorAll('.stat-num[data-count]');
  let countersAnimated = false;
  function animateCounters() {
    if (countersAnimated) return;
    const statsSection = document.querySelector('.hero-stats');
    if (!statsSection) return;
    const top = statsSection.getBoundingClientRect().top;
    if (top < window.innerHeight) {
      countersAnimated = true;
      statNums.forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));
        const duration = 1200;
        const start = performance.now();
        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target);
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
      });
    }
  }
  window.addEventListener('scroll', animateCounters, { passive: true });
  animateCounters();

  // ---------- CHART (homepage) ----------
  if (typeof Chart !== 'undefined' && document.getElementById('chart')) {
    const chartCtx = document.getElementById('chart').getContext('2d');
    new Chart(chartCtx, {
      type: 'bar',
      data: {
        labels: ['Text Tools', 'Calculators', 'Generators', 'Media Tools', 'Social Tools', 'Games'],
        datasets: [{
          label: 'Usage',
          data: [520, 380, 340, 260, 210, 630],
          backgroundColor: [
            'rgba(79,107,255,0.7)', 'rgba(168,85,247,0.7)', 'rgba(56,189,248,0.7)',
            'rgba(236,72,153,0.7)', 'rgba(245,158,11,0.7)', 'rgba(0,255,255,0.7)'
          ],
          borderColor: [
            'rgba(79,107,255,1)', 'rgba(168,85,247,1)', 'rgba(56,189,248,1)',
            'rgba(236,72,153,1)', 'rgba(245,158,11,1)', 'rgba(0,255,255,1)'
          ],
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b8' } },
          x: { grid: { display: false }, ticks: { color: '#8892b8', font: { size: 10 } } }
        }
      }
    });
  }

  // ---------- ICONS ----------
  if (typeof lucide !== 'undefined') lucide.createIcons();
  console.log('🚀 Zaberz 2.0 – Optimized');
})();