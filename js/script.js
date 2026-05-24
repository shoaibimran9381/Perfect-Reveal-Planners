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
let currentSlide=0;const totalSlides=4;
function goToSlide(n){
  currentSlide=n;
  document.getElementById('testiSlides').style.transform=`translateX(-${n*100}%)`;
  document.querySelectorAll('.testi-dot').forEach((d,i)=>d.classList.toggle('active',i===n));
}
function changeSlide(dir){goToSlide((currentSlide+dir+totalSlides)%totalSlides)}
setInterval(()=>changeSlide(1),5000);

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
