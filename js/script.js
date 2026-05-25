// Initialize reviews data in localStorage from JSON if not already set
async function initializeReviewsData(){
  // Check if reviewsData is already in localStorage
  if(!localStorage.getItem('reviewsData')){
    try{
      const response=await fetch('./data/reviews.json');
      const reviews=await response.json();
      localStorage.setItem('reviewsData',JSON.stringify(reviews));
    }catch(error){
      console.log('Could not initialize reviews from JSON file');
    }
  }
}

// PARTICLES
const canvas=document.getElementById('particles');
const ctx=canvas.getContext('2d');
let W,H,particles=[];
function resize(){W=canvas.width=canvas.offsetWidth;H=canvas.height=canvas.offsetHeight}
resize();window.addEventListener('resize',resize);
for(let i=0;i<80;i++)particles.push({x:Math.random()*2000,y:Math.random()*800,size:Math.random()*2+0.5,speed:Math.random()*0.4+0.1,opacity:Math.random()*0.6+0.2,twinkle:Math.random()*Math.PI*2});
function animParticles(){
  ctx.clearRect(0,0,W,H);
  particles.forEach(p=>{
    p.twinkle+=0.02;p.y-=p.speed;if(p.y<0){p.y=H;p.x=Math.random()*W}
    const op=p.opacity*(0.5+0.5*Math.sin(p.twinkle));
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fillStyle=`rgba(201,168,76,${op})`;ctx.fill();
  });
  requestAnimationFrame(animParticles);
}
animParticles();

// GOLD LINE ANIMATE
setTimeout(()=>{document.getElementById('goldLine').classList.add('animate')},300);

// NAV SCROLL
const navbar=document.getElementById('navbar');
window.addEventListener('scroll',()=>{navbar.classList.toggle('scrolled',window.scrollY>60)});

// SCROLL REVEAL
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible')}});
},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// COUNTER ANIMATION
const counterObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting&&!e.target.dataset.counted){
      e.target.dataset.counted='1';
      const el=e.target;const target=+el.dataset.count;let start=0;
      const step=()=>{start+=Math.ceil(target/40);if(start>=target){el.textContent=target+(target===5?'★':target===100?'%':'+');}else{el.textContent=start;requestAnimationFrame(step);}};
      step();
    }
  });
},{threshold:0.5});
document.querySelectorAll('.stat-num[data-count]').forEach(el=>counterObs.observe(el));

// LOCAL LINK PRESS COUNTER
(()=>{
  const storageKey = 'perfectRevealLinkPressCount';
  const countEl = document.getElementById('linkPressCount');
  const trackedLinkSelectors = [
    'a[href*="wa.me"]',
    'a[href*="instagram.com"]',
    'button[onclick*="wa.me"]',
    'button[onclick*="instagram.com"]'
  ];

  function getCount(){
    return Number(localStorage.getItem(storageKey) || 0);
  }

  function updateCount(){
    if(countEl) countEl.textContent = getCount();
  }

  function saveClick(){
    localStorage.setItem(storageKey, String(getCount() + 1));
    updateCount();
  }

  updateCount();
  document.querySelectorAll(trackedLinkSelectors.join(',')).forEach(el=>{
    el.addEventListener('click', saveClick, {capture:true});
  });
})();

// TESTIMONIAL CAROUSEL
let currentSlide=0;let totalSlides=0;

function goToSlide(n){
  currentSlide=n;
  document.getElementById('testiSlides').style.transform=`translateX(-${n*100}%)`;
  document.querySelectorAll('.testi-dot').forEach((d,i)=>d.classList.toggle('active',i===n));
}

function changeSlide(dir){goToSlide((currentSlide+dir+totalSlides)%totalSlides)}

// Load and render reviews from JSON or localStorage
async function loadReviews(){
  try{
    let allReviews=[];

    // Check localStorage first for approved reviews
    const stored=localStorage.getItem('reviewsData');
    if(stored){
      try{allReviews=JSON.parse(stored);}catch(e){}
    }

    // If no localStorage data, fetch from JSON file
    if(allReviews.length===0){
      const response=await fetch('./data/reviews.json');
      allReviews=await response.json();
    }

    // Sort by rating (desc) then by date (desc), take top 5
    const topReviews=allReviews
      .sort((a,b)=>(b.rating-a.rating)||(new Date(b.date)-new Date(a.date)))
      .slice(0,5);

    totalSlides=topReviews.length;

    // Render slides
    const slidesContainer=document.getElementById('testiSlides');
    slidesContainer.innerHTML='';

    topReviews.forEach(review=>{
      const stars='★'.repeat(review.rating);
      const slide=document.createElement('div');
      slide.className='testi-slide';
      slide.innerHTML=`
        <div class="testi-card">
          <div class="testi-quote">"</div>
          <div class="testi-stars">${stars}</div>
          <p class="testi-text">${review.text}</p>
          <div class="testi-author">${review.name}</div>
          <div class="testi-role">${review.role}</div>
          <div class="owner-response">
            <div class="owner-response-header" onclick="toggleOwnerResponse(this)">
              <span class="owner-name">muthu nani responded</span>
              <span class="expand-icon">▼</span>
            </div>
            <div class="owner-response-text" style="display:none">${review.ownerResponse||'Thank you for your feedback!'}</div>
          </div>
        </div>
      `;
      slidesContainer.appendChild(slide);
    });

    // Render dots
    const navContainer=document.getElementById('testiNav');
    navContainer.innerHTML='';
    for(let i=0;i<totalSlides;i++){
      const dot=document.createElement('div');
      dot.className='testi-dot'+(i===0?' active':'');
      dot.onclick=()=>goToSlide(i);
      navContainer.appendChild(dot);
    }

    // Auto-rotate carousel
    setInterval(()=>changeSlide(1),5000);
  }catch(error){
    console.error('Error loading reviews:',error);
  }
}

// Load reviews when DOM is ready
document.addEventListener('DOMContentLoaded',async ()=>{
  await initializeReviewsData();
  loadReviews();
});

// Toggle owner response expand/collapse
function toggleOwnerResponse(headerEl){
  const textEl=headerEl.nextElementSibling;
  const icon=headerEl.querySelector('.expand-icon');
  const isExpanded=textEl.style.display!=='none';
  textEl.style.display=isExpanded?'none':'block';
  icon.style.transform=isExpanded?'rotate(0deg)':'rotate(180deg)';
}

// REVIEW SUBMISSION
function submitReview(event){
  event.preventDefault();
  const name=document.getElementById('reviewName').value.trim();
  const email=document.getElementById('reviewEmail').value.trim();
  const role=document.getElementById('reviewRole').value.trim();
  const rating=parseInt(document.getElementById('reviewRating').value);
  const text=document.getElementById('reviewText').value.trim();
  const msgEl=document.getElementById('reviewMessage');

  if(!name||!email||!role||!rating||!text){
    msgEl.style.display='block';
    msgEl.className='review-message error';
    msgEl.textContent='Please fill in all fields';
    return;
  }

  const newReview={
    id:Date.now(),
    name,
    email,
    role,
    rating,
    text,
    date:new Date().toISOString().split('T')[0]
  };

  // Get existing pending reviews from localStorage
  let pendingReviews=[];
  const stored=localStorage.getItem('pendingReviews');
  if(stored){
    try{pendingReviews=JSON.parse(stored);}catch(e){}
  }

  pendingReviews.push(newReview);
  localStorage.setItem('pendingReviews',JSON.stringify(pendingReviews));

  // Debug: log to console
  console.log('Review saved! Total pending:', pendingReviews.length);
  console.log('Pending reviews:', pendingReviews);

  msgEl.style.display='block';
  msgEl.className='review-message success';
  msgEl.textContent='✓ Thank you! Your review has been submitted and is pending approval.';

  document.getElementById('reviewForm').reset();
  setTimeout(()=>{msgEl.style.display='none'},5000);
}

// WHATSAPP GREETING
(()=>{
  const waContainer = document.querySelector('.wa-container');
  const waGreeting = document.getElementById('waGreeting');
  const waClose = document.getElementById('waClose');
  const plansSection = document.getElementById('plans');
  let wasAbovePlans = true;
  let messageClosed = false;
  
  function showWa(){
    if(!plansSection) return;
    const rect = plansSection.getBoundingClientRect();
    const isAbovePlans = rect.bottom > 0;
    const isBelowPlans = rect.top < 0;
    
    if(isBelowPlans && wasAbovePlans){
      wasAbovePlans = false;
      messageClosed = false;
    }
    
    if(isAbovePlans && !wasAbovePlans){
      wasAbovePlans = true;
      messageClosed = false; // Reset closed state when crossing back above
    }
    
    if(!wasAbovePlans && !messageClosed){
      setTimeout(()=>{
        if(!messageClosed) waGreeting.classList.add('show');
      }, 300);
    } else {
      waGreeting.classList.remove('show');
    }
  }
  
  window.addEventListener('scroll', showWa, {passive:true});
  showWa();
  
  if(waClose){
    waClose.addEventListener('click', (e)=>{
      e.preventDefault();
      messageClosed = true;
      waGreeting.classList.remove('show');
    });
  }
  
  document.getElementById('waBtn').addEventListener('mouseenter',()=>{
    if(!messageClosed) waGreeting.classList.add('show');
  });
})();
