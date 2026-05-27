import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  getFirestore,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const db = isFirebaseConfigured() ? getFirestore(initializeApp(firebaseConfig)) : null;

// PARTICLES
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W;
let H;
const particles = [];

function resize() {
  W = canvas.width = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}

resize();
window.addEventListener('resize', resize);
for (let i = 0; i < 80; i += 1) {
  particles.push({
    x: Math.random() * 2000,
    y: Math.random() * 800,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.4 + 0.1,
    opacity: Math.random() * 0.6 + 0.2,
    twinkle: Math.random() * Math.PI * 2
  });
}

function animParticles() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(particle => {
    particle.twinkle += 0.02;
    particle.y -= particle.speed;
    if (particle.y < 0) {
      particle.y = H;
      particle.x = Math.random() * W;
    }
    const opacity = particle.opacity * (0.5 + 0.5 * Math.sin(particle.twinkle));
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,168,76,${opacity})`;
    ctx.fill();
  });
  requestAnimationFrame(animParticles);
}
animParticles();

// GOLD LINE ANIMATE
setTimeout(() => document.getElementById('goldLine').classList.add('animate'), 300);

// NAV SCROLL
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60));

// SCROLL REVEAL
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

// COUNTER ANIMATION
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.counted) {
      entry.target.dataset.counted = '1';
      const element = entry.target;
      const target = Number(element.dataset.count);
      let start = 0;
      const step = () => {
        start += Math.ceil(target / 40);
        if (start >= target) {
          element.textContent = target + (target === 5 ? '★' : target === 100 ? '%' : '+');
        } else {
          element.textContent = start;
          requestAnimationFrame(step);
        }
      };
      step();
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num[data-count]').forEach(element => counterObserver.observe(element));

// LOCAL LINK PRESS COUNTER
(() => {
  const storageKey = 'perfectRevealLinkPressCount';
  const countElement = document.getElementById('linkPressCount');
  const trackedLinkSelectors = [
    'a[href*="wa.me"]',
    'a[href*="instagram.com"]',
    'button[onclick*="wa.me"]',
    'button[onclick*="instagram.com"]'
  ];

  function getCount() {
    return Number(localStorage.getItem(storageKey) || 0);
  }

  function updateCount() {
    if (countElement) countElement.textContent = getCount();
  }

  function saveClick() {
    localStorage.setItem(storageKey, String(getCount() + 1));
    updateCount();
  }

  updateCount();
  document.querySelectorAll(trackedLinkSelectors.join(',')).forEach(element => {
    element.addEventListener('click', saveClick, { capture: true });
  });
})();

// TESTIMONIAL CAROUSEL
let currentSlide = 0;
let totalSlides = 0;
let rotationTimer;

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = String(value || '');
  return element.innerHTML;
}

function reviewDateValue(review) {
  if (review.createdAt && typeof review.createdAt.toMillis === 'function') {
    return review.createdAt.toMillis();
  }
  return new Date(review.date || 0).getTime();
}

function goToSlide(number) {
  currentSlide = number;
  document.getElementById('testiSlides').style.transform = `translateX(-${number * 100}%)`;
  document.querySelectorAll('.testi-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === number);
  });
}

function changeSlide(direction) {
  if (totalSlides) goToSlide((currentSlide + direction + totalSlides) % totalSlides);
}

function toggleOwnerResponse(headerElement) {
  const textElement = headerElement.nextElementSibling;
  const icon = headerElement.querySelector('.expand-icon');
  const isExpanded = textElement.style.display !== 'none';
  textElement.style.display = isExpanded ? 'none' : 'block';
  icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
}

function renderReviews(reviews) {
  // Normalize rating and date, then sort by rating (desc) then by published/created date (desc)
  const topReviews = reviews
    .map(r => ({
      ...r,
      rating: Number(r.rating) || 0,
      _sortDate: (r.publishedAt && typeof r.publishedAt.toMillis === 'function')
        ? r.publishedAt.toMillis()
        : (r.createdAt && typeof r.createdAt.toMillis === 'function')
          ? r.createdAt.toMillis()
          : new Date(r.date || 0).getTime()
    }))
    .sort((a, b) => (b.rating - a.rating) || (b._sortDate - a._sortDate))
    .slice(0, 5);

  totalSlides = topReviews.length;
  currentSlide = 0;
  const slidesContainer = document.getElementById('testiSlides');
  const navContainer = document.getElementById('testiNav');
  slidesContainer.innerHTML = '';
  navContainer.innerHTML = '';

  topReviews.forEach((review, idx) => {
    const stars = '★'.repeat(Number(review.rating));
    const slide = document.createElement('div');
    slide.className = 'testi-slide';
    slide.innerHTML = `
      <div class="testi-card">
        ${idx === 0 ? '<div class="top-badge">Top review</div>' : ''}
        <div class="testi-quote">"</div>
        <div class="testi-stars">${stars}</div>
        <p class="testi-text">${escapeHtml(review.text)}</p>
        <div class="testi-author">${escapeHtml(review.name)}</div>
        <div class="testi-role">${escapeHtml(review.role)}</div>
        <div class="owner-response">
          <div class="owner-response-header">
            <span class="owner-name">Perfect Reveal Planners responded</span>
            <span class="expand-icon">▼</span>
          </div>
          <div class="owner-response-text" style="display:none">${escapeHtml(review.ownerResponse || 'Thank you for your feedback!')}</div>
        </div>
      </div>
    `;
    slide.querySelector('.owner-response-header').addEventListener('click', event => {
      toggleOwnerResponse(event.currentTarget);
    });
    slidesContainer.appendChild(slide);
  });

  for (let index = 0; index < totalSlides; index += 1) {
    const dot = document.createElement('div');
    dot.className = `testi-dot${index === 0 ? ' active' : ''}`;
    dot.addEventListener('click', () => goToSlide(index));
    navContainer.appendChild(dot);
  }

  clearInterval(rotationTimer);
  if (totalSlides > 1) rotationTimer = setInterval(() => changeSlide(1), 5000);
}

function loadReviews() {
  if (!db) {
    document.getElementById('testiSlides').innerHTML = '<div class="testi-slide"><div class="testi-card"><p class="testi-text">Online reviews are not configured.</p></div></div>';
    return;
  }

  // Real-time listener: updates on any changes to publishedReviews
  onSnapshot(collection(db, 'publishedReviews'), snapshot => {
    const reviews = snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
    if (!reviews.length) {
      document.getElementById('testiSlides').innerHTML = '<div class="testi-slide"><div class="testi-card"><p class="testi-text">No reviews published yet.</p></div></div>';
      return;
    }
    renderReviews(reviews);
  }, error => {
    document.getElementById('testiSlides').innerHTML = '<div class="testi-slide"><div class="testi-card"><p class="testi-text">Reviews are temporarily unavailable.</p></div></div>';
  });
}

function showReviewMessage(text, type) {
  const messageElement = document.getElementById('reviewMessage');
  messageElement.style.display = 'block';
  messageElement.className = `review-message ${type}`;
  messageElement.textContent = text;
}

async function submitReview(event) {
  event.preventDefault();
  const form = document.getElementById('reviewForm');
  const submitButton = form.querySelector('button[type="submit"]');
  const review = {
    name: document.getElementById('reviewName').value.trim(),
    email: document.getElementById('reviewEmail').value.trim(),
    role: document.getElementById('reviewRole').value.trim(),
    rating: Number.parseInt(document.getElementById('reviewRating').value, 10),
    text: document.getElementById('reviewText').value.trim()
  };

  if (!review.name || !review.email || !review.role || !review.rating || !review.text) {
    showReviewMessage('Please fill in all fields.', 'error');
    return;
  }
  if (!db) {
    showReviewMessage('Online review submission is not configured yet. Please contact us directly.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';
  try {
    await addDoc(collection(db, 'reviewSubmissions'), {
      ...review,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    showReviewMessage('Thank you for sharing your experience with us.', 'success');
    form.reset();
  } catch (error) {
    showReviewMessage('We could not submit your review right now. Please try again later.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Your Review';
  }
}

window.changeSlide = changeSlide;
window.submitReview = submitReview;

document.addEventListener('DOMContentLoaded', loadReviews);

// MOBILE NAV TOGGLE
(() => {
  const navToggle = document.getElementById('navToggle');
  const navbarEl = document.getElementById('navbar');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));

  if (!navToggle || !navbarEl) return;

  function setAria(open) {
    navToggle.setAttribute('aria-expanded', String(open));
  }

  navToggle.addEventListener('click', () => {
    const isOpen = navbarEl.classList.toggle('open');
    setAria(isOpen);
  });

  // Close menu when a link is clicked (mobile)
  navLinks.forEach(link => link.addEventListener('click', () => {
    if (navbarEl.classList.contains('open')) {
      navbarEl.classList.remove('open');
      setAria(false);
    }
  }));

  // Close mobile menu on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navbarEl.classList.contains('open')) {
      navbarEl.classList.remove('open');
      setAria(false);
    }
  });
})();

// WHATSAPP GREETING
(() => {
  const waGreeting = document.getElementById('waGreeting');
  const waClose = document.getElementById('waClose');
  const plansSection = document.getElementById('plans');
  let wasAbovePlans = true;
  let messageClosed = false;

  function showWa() {
    if (!plansSection) return;
    const rect = plansSection.getBoundingClientRect();
    const isAbovePlans = rect.bottom > 0;
    const isBelowPlans = rect.top < 0;

    if (isBelowPlans && wasAbovePlans) {
      wasAbovePlans = false;
      messageClosed = false;
    }
    if (isAbovePlans && !wasAbovePlans) {
      wasAbovePlans = true;
      messageClosed = false;
    }
    if (!wasAbovePlans && !messageClosed) {
      setTimeout(() => {
        if (!messageClosed) waGreeting.classList.add('show');
      }, 300);
    } else {
      waGreeting.classList.remove('show');
    }
  }

  window.addEventListener('scroll', showWa, { passive: true });
  showWa();

  if (waClose) {
    waClose.addEventListener('click', event => {
      event.preventDefault();
      messageClosed = true;
      waGreeting.classList.remove('show');
    });
  }
  document.getElementById('waBtn').addEventListener('mouseenter', () => {
    if (!messageClosed) waGreeting.classList.add('show');
  });
})();
