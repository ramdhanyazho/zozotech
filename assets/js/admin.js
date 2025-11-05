async function fetchJSON(p){ const r=await fetch(p,{cache:'no-store'}); return r.json(); }
function dl(filename, content, type='application/json'){
  const a=document.createElement('a');
  const file=new Blob([content], {type});
  a.href=URL.createObjectURL(file);
  a.download=filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

let postsData={posts:[]};
let pricesData={packages:[]};

function renderPosts(){
  const tb=document.getElementById('postList');
  tb.innerHTML='';
  postsData.posts.sort((a,b)=> a.date>b.date?-1:1).forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.title}</td><td>${p.date}</td><td>${p.id}</td>
      <td><button data-slug="${p.id}" class="edit">Edit</button> <button data-slug="${p.id}" class="del" style="background:#e11d48">Hapus</button></td>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll('.edit').forEach(b=>b.onclick=()=>{
    const p=postsData.posts.find(x=>x.id===b.dataset.slug);
    if(!p) return;
    document.getElementById('pTitle').value=p.title;
    document.getElementById('pDate').value=p.date;
    document.getElementById('pIcon').value=p.icon||'';
    document.getElementById('pSlug').value=p.id;
    document.getElementById('pExcerpt').value=p.excerpt||'';
    document.getElementById('pContent').value=p.content||'';
  });
  tb.querySelectorAll('.del').forEach(b=>b.onclick=()=>{
    postsData.posts = postsData.posts.filter(x=>x.id!==b.dataset.slug);
    renderPosts();
  });
}

function renderPrices(){
  const tb=document.getElementById('priceList');
  tb.innerHTML='';
  pricesData.packages.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.name}</td><td>${p.price}</td><td>${p.detail||''}</td>
      <td><button data-name="${p.name}" class="editH">Edit</button> <button data-name="${p.name}" class="delH" style="background:#e11d48">Hapus</button></td>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll('.editH').forEach(b=>b.onclick=()=>{
    const p=pricesData.packages.find(x=>x.name===b.dataset.name);
    if(!p) return;
    document.getElementById('hName').value=p.name;
    document.getElementById('hPrice').value=p.price;
    document.getElementById('hDetail').value=p.detail||'';
    document.getElementById('hIcon').value=p.icon||'';
    document.getElementById('hFeatured').checked=!!p.featured;
    document.getElementById('hFeatures').value=(p.features||[]).join('\n');
  });
  tb.querySelectorAll('.delH').forEach(b=>b.onclick=()=>{
    pricesData.packages = pricesData.packages.filter(x=>x.name!==b.dataset.name);
    renderPrices();
  });
}

async function init(){
  postsData = await fetchJSON('data/posts.json');
  pricesData = await fetchJSON('data/prices.json');
  renderPosts(); renderPrices();

  document.getElementById('addPost').onclick=()=>{
    const obj={
      id: document.getElementById('pSlug').value.trim(),
      title: document.getElementById('pTitle').value.trim(),
      date: document.getElementById('pDate').value,
      icon: document.getElementById('pIcon').value.trim(),
      excerpt: document.getElementById('pExcerpt').value.trim(),
      content: document.getElementById('pContent').value.trim()
    };
    if(!obj.id || !obj.title || !obj.date){ alert('Slug, Judul, dan Tanggal wajib diisi'); return; }
    const idx=postsData.posts.findIndex(x=>x.id===obj.id);
    if(idx>=0) postsData.posts[idx]=obj; else postsData.posts.push(obj);
    renderPosts();
  };

  document.getElementById('downloadPosts').onclick=()=>{
    dl('posts.json', JSON.stringify(postsData, null, 2));
  };

  document.getElementById('addPrice').onclick=()=>{
    const obj={
      name: document.getElementById('hName').value.trim(),
      price: parseInt(document.getElementById('hPrice').value||'0',10),
      detail: document.getElementById('hDetail').value.trim(),
      icon: document.getElementById('hIcon').value.trim()||'💻',
      featured: document.getElementById('hFeatured').checked,
      features: document.getElementById('hFeatures').value.split('\n').map(x=>x.trim()).filter(Boolean)
    };
    if(!obj.name){ alert('Nama paket wajib diisi'); return; }
    const idx=pricesData.packages.findIndex(x=>x.name===obj.name);
    if(idx>=0) pricesData.packages[idx]=obj; else pricesData.packages.push(obj);
    renderPrices();
  };

  document.getElementById('downloadPrices').onclick=()=>{
    dl('prices.json', JSON.stringify(pricesData, null, 2));
  };

  // config generator
  document.getElementById('saveCfg').onclick=()=>{
    const siteName=document.getElementById('cfgName').value.trim()||'POS Solutions';
    const number=document.getElementById('cfgWa').value.trim()||'6281234567890';
    const msg=document.getElementById('cfgWaMsg').value.trim()||'Halo, saya tertarik dengan produk Anda';
    const js = `window.SITE_CONFIG = {\n  siteName: ${JSON.stringify(siteName)},\n  whatsappNumber: ${JSON.stringify(number)},\n  whatsappMessage: ${JSON.stringify(msg)},\n  currency: 'Rp'\n};\n`;
    dl('config.js', js, 'text/javascript');
  };

  const logoutBtn=document.getElementById('logoutBtn');
  if(logoutBtn){
    logoutBtn.onclick=()=>{
      if(typeof window.__ADMIN_LOGOUT==='function'){
        window.__ADMIN_LOGOUT();
      } else {
        const key=window.__ADMIN_SESSION_KEY||'zozotechAdminSession';
        sessionStorage.removeItem(key);
      }
      location.reload();
    };
  }
}

function runAdminInit(){
  init().catch(err=>{
    console.error('Gagal memuat data admin:', err);
    alert('Terjadi kesalahan saat memuat data admin. Silakan muat ulang halaman.');
  });
}

window.startAdminEditor=function(){
  if(window.__adminEditorStarted){ return; }
  window.__adminEditorStarted=true;
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', runAdminInit, {once:true});
  } else {
    runAdminInit();
  }
};
