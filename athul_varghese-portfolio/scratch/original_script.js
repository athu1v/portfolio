/* ==========================================
   PREMIUM PORTFOLIO INTERACTION CONTROLLER
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- ANTIGRAVITY FLOATING PARTICLES CANVAS BACKDROP ---
  const canvas = document.getElementById('antigravity-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const mouse = { x: null, y: null, radius: 130 }; // repulsion range
    const particles = [];
    const particleCount = 200;

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = Math.random() * 2 + 1; // particle radius (1 to 3px)
        this.density = (Math.random() * 20) + 10; // return force speed
        
        // Gradient particle color assignment for depth
        const colors = ['#0088ff', '#00f0ff', '#3b82f6', '#1e293b'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        // Floating ambient movement (constant slow upward drift)
        this.baseY -= 0.25; 
        if (this.baseY < 0) {
          this.baseY = height;
          this.y = height;
          this.x = Math.random() * width;
          this.baseX = this.x;
        }

        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.hypot(dx, dy);

        if (distance < mouse.radius && mouse.x !== null) {
          // Push particles away smoothly (Anti-gravity repulsion)
          let forceFactor = (mouse.radius - distance) / mouse.radius;
          let forceX = (dx / distance) * forceFactor * this.density;
          let forceY = (dy / distance) * forceFactor * this.density;
          
          this.x -= forceX;
          this.y -= forceY;
        } else {
          // Smooth return path to base floating trajectory
          if (this.x !== this.baseX) {
            this.x += (this.baseX - this.x) * 0.05;
          }
          // Ambient float alignment
          this.y += (this.baseY - this.y) * 0.05;
          this.baseX = this.x; // Keep current x as base baseline
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    function init() {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    init();
    animate();
  }

  // --- SMOOTH CUSTOM CURSOR GLOW TRAILER ---
  const cursorTrailer = document.querySelector('.cursor-trailer');
  if (cursorTrailer) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let hasMoved = false;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        document.body.classList.add('cursor-active');
        currentX = targetX;
        currentY = targetY;
      }
    });

    window.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-active');
      hasMoved = false;
    });

    function updateCursor() {
      if (hasMoved) {
        // Interpolate coords using spring physics (lerp factor 0.06 for lag-behind weight)
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;
        
        cursorTrailer.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      }
      requestAnimationFrame(updateCursor);
    }
    updateCursor();
  }

  // --- HERO TYPEWRITER LOOP ---
  const typedTextSpan = document.getElementById('typed-text');
  if (typedTextSpan) {
    const roles = ["Cybersecurity Specialist", "Systems Auditor", "Penetration Tester", "Security Consultant"];
    let roleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
      const currentRole = roles[roleIdx];
      
      if (isDeleting) {
        typedTextSpan.textContent = currentRole.substring(0, charIdx - 1);
        charIdx--;
        typingSpeed = 50; // Deleting is faster
      } else {
        typedTextSpan.textContent = currentRole.substring(0, charIdx + 1);
        charIdx++;
        typingSpeed = 100;
      }

      if (!isDeleting && charIdx === currentRole.length) {
        // Pause at the end of the word
        isDeleting = true;
        typingSpeed = 1500;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        typingSpeed = 500; // Pause before starting next role
      }

      setTimeout(type, typingSpeed);
    }
    
    // Start after a slight delay
    setTimeout(type, 1000);
  }

  // --- TEXT SCROLL ON REVEAL ---
  const revealParagraph = document.querySelector('.reveal-paragraph');
  if (revealParagraph) {
    const rawText = revealParagraph.innerText;
    const words = rawText.split(' ');
    // Wrap each word in a custom reveal span
    revealParagraph.innerHTML = words.map(w => `<span class="reveal-word">${w}</span>`).join(' ');
    
    const wordSpans = revealParagraph.querySelectorAll('.reveal-word');
    
    function checkWordReveal() {
      const rect = revealParagraph.getBoundingClientRect();
      const winHeight = window.innerHeight;
      
      // Calculate scroll progress relative to viewport height
      const triggerStart = winHeight * 0.85;
      const triggerEnd = winHeight * 0.15;
      
      const elementHeight = rect.height;
      const currentPos = rect.top;
      
      let progress = (triggerStart - currentPos) / (triggerStart - triggerEnd + elementHeight);
      progress = Math.max(0, Math.min(1, progress)); // clamp
      
      const revealThreshold = Math.floor(progress * wordSpans.length * 1.4 - wordSpans.length * 0.15);
      
      wordSpans.forEach((span, idx) => {
        if (idx <= revealThreshold) {
          span.classList.add('active');
        } else {
          span.classList.remove('active');
        }
      });
    }
    
    window.addEventListener('scroll', checkWordReveal);
    window.addEventListener('resize', checkWordReveal);
    checkWordReveal();
  }

  // --- STICKY SECTIONS INTERSECTION LINKS ---
  const sections = document.querySelectorAll('section[id]');
  const sidebarLinks = document.querySelectorAll('.sidebar-item');
  
  const sectionObserverOptions = {
    root: null,
    rootMargin: '-30% 0px -40% 0px', // trigger when section occupies viewport center
    threshold: 0
  };
  
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        sidebarLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, sectionObserverOptions);
  
  sections.forEach(section => {
    sectionObserver.observe(section);
  });

  // --- SKILLS DYNAMIC BARS EXPANSION ---
  const skillBars = document.querySelectorAll('.skill-fill-line');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const widthVal = bar.getAttribute('data-width');
        bar.style.width = widthVal;
      }
    });
  }, { threshold: 0.2 });

  skillBars.forEach(bar => {
    skillObserver.observe(bar);
  });

  // --- EXPERIMENTAL NODE MESH CANVAS (Skills Dashboard Graphic) ---
  const nodesCanvas = document.getElementById('nodes-canvas');
  if (nodesCanvas) {
    const nCtx = nodesCanvas.getContext('2d');
    let cWidth = 0;
    let cHeight = 0;
    let nodesList = [];
    const totalNodesCount = 25;
    const connectDistance = 80;
    let localMouse = { x: null, y: null, radius: 80 };

    function resizeLocalCanvas() {
      const containerRect = nodesCanvas.parentElement.getBoundingClientRect();
      cWidth = nodesCanvas.width = containerRect.width;
      cHeight = nodesCanvas.height = containerRect.height;
      
      nodesList = [];
      for (let i = 0; i < totalNodesCount; i++) {
        nodesList.push({
          x: Math.random() * cWidth,
          y: Math.random() * cHeight,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          size: Math.random() * 2 + 1
        });
      }
    }

    nodesCanvas.addEventListener('mousemove', (e) => {
      const rect = nodesCanvas.getBoundingClientRect();
      localMouse.x = e.clientX - rect.left;
      localMouse.y = e.clientY - rect.top;
    });

    nodesCanvas.addEventListener('mouseleave', () => {
      localMouse.x = null;
      localMouse.y = null;
    });

    window.addEventListener('resize', resizeLocalCanvas);
    resizeLocalCanvas();

    const activePathsEl = document.getElementById('nodes-active-paths');

    function drawNodeNetwork() {
      nCtx.clearRect(0, 0, cWidth, cHeight);
      
      // Update and draw nodes
      nodesList.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        
        // Edge bouncing
        if (node.x > cWidth || node.x < 0) node.vx *= -1;
        if (node.y > cHeight || node.y < 0) node.vy *= -1;

        // Cursor attraction
        if (localMouse.x !== null && localMouse.y !== null) {
          let dx = localMouse.x - node.x;
          let dy = localMouse.y - node.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < localMouse.radius) {
            const pullForce = (localMouse.radius - distance) / localMouse.radius;
            node.x += dx * pullForce * 0.025;
            node.y += dy * pullForce * 0.025;
          }
        }

        nCtx.fillStyle = 'rgba(0, 240, 255, 0.65)';
        nCtx.beginPath();
        nCtx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        nCtx.fill();
      });

      // Connecting lines
      let activeConnections = 0;
      for (let i = 0; i < nodesList.length; i++) {
        for (let j = i + 1; j < nodesList.length; j++) {
          let dx = nodesList[i].x - nodesList[j].x;
          let dy = nodesList[i].y - nodesList[j].y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < connectDistance) {
            let opacity = (1 - (distance / connectDistance)) * 0.22;
            nCtx.strokeStyle = `rgba(0, 136, 255, ${opacity})`;
            
            // Highlight connections near cursor
            if (localMouse.x !== null && localMouse.y !== null) {
              let mDx = localMouse.x - nodesList[i].x;
              let mDy = localMouse.y - nodesList[i].y;
              let mDistance = Math.sqrt(mDx * mDx + mDy * mDy);
              if (mDistance < localMouse.radius) {
                nCtx.strokeStyle = `rgba(0, 240, 255, ${opacity * 2.5})`;
                activeConnections++;
              }
            }

            nCtx.lineWidth = 0.6;
            nCtx.beginPath();
            nCtx.moveTo(nodesList[i].x, nodesList[i].y);
            nCtx.lineTo(nodesList[j].x, nodesList[j].y);
            nCtx.stroke();
          }
        }
      }

      if (activePathsEl) {
        activePathsEl.innerText = `${activeConnections} paths active`;
      }

      requestAnimationFrame(drawNodeNetwork);
    }
    drawNodeNetwork();
  }

  // --- EXPERIMENTAL TIMELINE SCROLL TRIGGER ---
  const timelineSection = document.getElementById('experience');
  if (timelineSection) {
    const timelineItems = timelineSection.querySelectorAll('.timeline-item');
    const timelineLineTrack = timelineSection.querySelector('.timeline-line-track');
    
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          
          if (timelineLineTrack) {
            timelineLineTrack.style.height = '100%';
          }
        }
      });
    }, { threshold: 0.15 });

    timelineItems.forEach(item => {
      timelineObserver.observe(item);
    });
  }

  // --- WIDGET 1: PASSWORD COMPLEXITY AUDITOR ---
  const auditInput = document.getElementById('audit-input');
  const auditEntropy = document.getElementById('audit-entropy');
  const auditStrength = document.getElementById('audit-strength');
  const auditCracktime = document.getElementById('audit-cracktime');

  if (auditInput) {
    auditInput.addEventListener('input', () => {
      const val = auditInput.value;
      
      if (val.length === 0) {
        auditEntropy.innerText = "0 bits";
        auditEntropy.style.color = 'var(--text-muted)';
        auditStrength.innerText = "NONE";
        auditStrength.style.color = 'var(--text-muted)';
        auditCracktime.innerText = "Instantly (<0.01s)";
        auditCracktime.style.color = 'var(--text-muted)';
        return;
      }

      let R = 0;
      if (/[a-z]/.test(val)) R += 26;
      if (/[A-Z]/.test(val)) R += 26;
      if (/[0-9]/.test(val)) R += 10;
      if (/[^a-zA-Z0-9]/.test(val)) R += 33; 

      const entropy = Math.round(val.length * Math.log2(R));
      auditEntropy.innerText = `${entropy} bits`;

      const guesses = Math.pow(2, entropy);
      const secondsToCrack = guesses / 1e9; // 1 Billion guesses/sec hashing benchmark

      let timeText = "";

      if (entropy < 35) {
        auditStrength.innerText = "WEAK";
        timeText = "Instantly (<0.01s)";
        auditEntropy.style.color = '#ef4444';
        auditStrength.style.color = '#ef4444';
        auditCracktime.style.color = '#ef4444';
      } else if (entropy < 55) {
        auditStrength.innerText = "MODERATE";
        auditEntropy.style.color = 'var(--blue-color)';
        auditStrength.style.color = 'var(--blue-color)';
        auditCracktime.style.color = 'var(--blue-color)';
        if (secondsToCrack < 60) {
          timeText = `${Math.round(secondsToCrack)} seconds`;
        } else if (secondsToCrack < 3600) {
          timeText = `${Math.round(secondsToCrack / 60)} minutes`;
        } else {
          timeText = `${Math.round(secondsToCrack / 3600)} hours`;
        }
      } else {
        auditStrength.innerText = "SECURE";
        auditEntropy.style.color = 'var(--accent-color)';
        auditStrength.style.color = 'var(--accent-color)';
        auditCracktime.style.color = 'var(--accent-color)';
        const days = secondsToCrack / 86400;
        if (days < 365) {
          timeText = `${Math.round(days)} days`;
        } else if (days < 36500) {
          timeText = `${Math.round(days / 365)} years`;
        } else {
          timeText = "Centuries / Resistant";
        }
      }
      auditCracktime.innerText = timeText;
    });
  }

  // --- WIDGET 2: SIMULATED OCR SCANNER ---
  const ocrBtn = document.getElementById('trigger-ocr-btn');
  const ocrLaser = document.querySelector('.ocr-laser-line');
  const ocrOutput = document.getElementById('ocr-output-log');

  if (ocrBtn && ocrLaser && ocrOutput) {
    ocrBtn.addEventListener('click', () => {
      if (ocrLaser.classList.contains('sweeping')) return;

      ocrLaser.classList.add('sweeping');
      ocrOutput.innerText = "System: Initializing laser grid calibration...";
      ocrBtn.disabled = true;

      setTimeout(() => {
        ocrOutput.innerText = "System: Target locked. Scanning nutrition label vector metrics...";
      }, 900);

      setTimeout(() => {
        ocrOutput.innerText = "System: Parsing character matrix indexes [OCR Module ENG]...";
      }, 1900);

      setTimeout(() => {
        ocrLaser.classList.remove('sweeping');
        ocrBtn.disabled = false;

        const mockData = {
          status: "SUCCESS_DECRYPTED",
          fields_mapped: {
            item_type: "NUTRITION_FACTS",
            calories_count: "240 kcal",
            total_fat_grams: "8g",
            sodium_milligrams: "160mg",
            sugars_grams: "12g"
          },
          confidence_rating: "99.8%"
        };

        ocrOutput.innerHTML = `<pre style="line-height: 1.35; margin: 0; color: var(--accent-color);">${JSON.stringify(mockData, null, 2)}</pre>`;
      }, 3000);
    });
  }

  // --- TRANSMITTER PACKET FORM HANDLER ---
  const contactForm = document.getElementById('secure-contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      formStatus.className = 'form-dispatch-status';
      formStatus.innerText = 'TRANSMITTING TRANSMISSION ENVELOPE [AES-256]...';
      formStatus.style.display = 'block';

      setTimeout(() => {
        formStatus.innerText = 'TRANSMITTED COMPROMISED PAYLOAD AND SYNCHRONIZED ROUTE PEERS.';
        formStatus.classList.add('success');
        contactForm.reset();
      }, 2000);
    });
  }

  // --- CLOCK AND PING UTILITY TIMERS ---
  const clockElement = document.getElementById('sys-clock');
  if (clockElement) {
    setInterval(() => {
      const now = new Date();
      clockElement.innerText = now.toTimeString().split(' ')[0];
    }, 1000);
  }

  const pingElement = document.getElementById('ping-value');
  if (pingElement) {
    setInterval(() => {
      const randPing = Math.floor(Math.random() * 10) + 5;
      pingElement.innerText = `${randPing}ms`;
    }, 4000);
  }

  // --- SCROLL VELOCITY-BASED MOTION BLUR ---
  let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  let lastScrollTime = performance.now();
  let scrollBlurTimeout;

  window.addEventListener('scroll', () => {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const currentScrollTime = performance.now();

    const deltaY = Math.abs(currentScrollTop - lastScrollTop);
    const deltaTime = currentScrollTime - lastScrollTime;

    if (deltaTime > 0 && deltaY > 0) {
      const velocity = deltaY / deltaTime;
      // Map velocity to blur amount (clamped max to 4px)
      const blurValue = Math.min(velocity * 2.2, 4);
      document.documentElement.style.setProperty('--scroll-blur', `${blurValue}px`);
    }

    lastScrollTop = currentScrollTop;
    lastScrollTime = currentScrollTime;

    clearTimeout(scrollBlurTimeout);
    scrollBlurTimeout = setTimeout(() => {
      document.documentElement.style.setProperty('--scroll-blur', '0px');
    }, 120);
  }, { passive: true });

});
