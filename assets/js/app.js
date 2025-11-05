async function loadJSON(path){
  const res = await fetch(path, {cache: "no-store"});
  return res.json();
}

function formatCurrency(n){
  const c = window.SITE_CONFIG?.currency || "Rp";
  return c + " " + (n||0).toLocaleString("id-ID");
}

function waLink(){
  const num = window.SITE_CONFIG?.whatsappNumber || "6281234567890";
  const text = encodeURIComponent(window.SITE_CONFIG?.whatsappMessage || "");
  return `https://wa.me/${num}?text=${text}`;
}

function navInit(){
  const mobileToggle=document.getElementById('mobileToggle');
  const navMenu=document.getElementById('navMenu');
  mobileToggle?.addEventListener('click',()=>navMenu.classList.toggle('active'));
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      if(a.getAttribute('href')==="#") return;
      e.preventDefault(); navMenu.classList.remove('active');
      const target=document.querySelector(a.getAttribute('href'));
      if(target){
        const offset=70, top=target.offsetTop - offset;
        window.scrollTo({top, behavior:'smooth'});
      }
    });
  });
  window.addEventListener('scroll',()=>{
    const navbar=document.getElementById('navbar');
    if(window.scrollY>50) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled');
  });
}

function renderPrices(data){
  const grid=document.querySelector('#pricingGrid');
  if(!grid) return;
  grid.innerHTML="";
  (data.packages||[]).forEach(p=>{
    const li=p.features?.map(f=>`<li>${f}</li>`).join("")||"";
    const featured=p.featured ? "featured" : "";
    const badge=p.featured ? '<div class="featured-badge">POPULER</div>' : "";
    grid.innerHTML += `
      <div class="pricing-card ${featured}">
        ${badge}
        <div class="card-icon">${p.icon||"💼"}</div>
        <h3>${p.name}</h3>
        <div class="price">${formatCurrency(p.price)}</div>
        <div class="price-detail">${p.detail||""}</div>
        <ul class="features">${li}</ul>
        <a href="#contact" class="order-button">Pesan Sekarang</a>
      </div>`;
  });
}

function renderPosts(data){
  const grid=document.querySelector('#articleGrid');
  if(!grid) return;
  grid.innerHTML="";
  (data.posts||[]).sort((a,b)=> (a.date>b.date?-1:1)).forEach(post=>{
    grid.innerHTML += `
      <div class="article-card" data-id="${post.id}">
        <div class="card-icon">${post.icon||"📰"}</div>
        <h3>${post.title}</h3>
        <p style="color:#666;margin:15px 0;text-align:left">${post.excerpt||""}</p>
        <div class="article-meta">
          <span>📅 ${new Date(post.date).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}</span>
          <span style="color:#667eea;font-weight:700">Baca Selengkapnya →</span>
        </div>
      </div>`;
  });

  // Modal logic
  const modal=document.getElementById('postModal');
  const modalTitle=document.getElementById('modalTitle');
  const modalBody=document.getElementById('modalBody');
  const closeBtn=document.getElementById('modalClose');
  grid.querySelectorAll('.article-card').forEach(card=>{
    card.addEventListener('click',()=>{
      const id=card.getAttribute('data-id');
      const p=data.posts.find(x=>x.id===id);
      if(p){
        modalTitle.textContent=p.title;
        modalBody.innerHTML = `<div class="badge">${new Date(p.date).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}</div>
        <div style="margin-top:12px">${p.content||""}</div>`;
        modal.classList.add('active');
      }
    });
  });
  closeBtn?.addEventListener('click',()=>modal.classList.remove('active'));
  modal?.addEventListener('click',e=>{ if(e.target===modal) modal.classList.remove('active'); });
}

async function init(){
  navInit();
  // WhatsApp link hydrate
  const waBtn = document.getElementById('waBtn');
  if(waBtn) waBtn.href = waLink();

  const prices = await loadJSON('data/prices.json');
  renderPrices(prices);

  const posts = await loadJSON('data/posts.json');
  renderPosts(posts);

  // Simple fade-in animation for cards
  const cards=document.querySelectorAll('.pricing-card,.article-card');
  const observer=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.style.opacity='0';
        entry.target.style.transform='translateY(30px)';
        setTimeout(()=>{
          entry.target.style.transition='all .6s ease';
          entry.target.style.opacity='1';
          entry.target.style.transform='translateY(0)';
        },100);
      }
    });
  },{threshold:0.1});
  cards.forEach(c=>observer.observe(c));
}
document.addEventListener('DOMContentLoaded', init);