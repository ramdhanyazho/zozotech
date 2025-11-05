(function(){
  const ADMIN_USERNAME = 'admin';
  // Password: Zozotech!2024
  const ADMIN_PASSWORD_HASH = 'd7247db20395f26ce880dd9e3613f9b0426f4f844c27199ab56b2456b173d4eb';
  const SESSION_KEY = 'zozotechAdminSession';

  function bufferToHex(buffer){
    return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2, '0')).join('');
  }

  async function sha256(text){
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
  }

  function markAuthenticated(){
    sessionStorage.setItem(SESSION_KEY, '1');
  }

  function clearAuthenticated(){
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isAuthenticated(){
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function startApp(){
    const overlay = document.getElementById('loginOverlay');
    if(overlay){
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.add('admin-authenticated');
    if(typeof window.startAdminEditor === 'function'){
      window.startAdminEditor();
    }
  }

  window.__ADMIN_SESSION_KEY = SESSION_KEY;
  window.__ADMIN_LOGOUT = clearAuthenticated;

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('loginOverlay');
    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('loginError');
    const userInput = document.getElementById('loginUser');
    const passInput = document.getElementById('loginPass');

    if(!overlay || !form || !userInput || !passInput){
      if(typeof window.startAdminEditor === 'function'){
        window.startAdminEditor();
      }
      return;
    }

    function showOverlay(){
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden', 'false');
      userInput.focus();
    }

    function hideError(){
      if(errorMsg){
        errorMsg.style.display = 'none';
      }
    }

    if(isAuthenticated()){
      startApp();
      return;
    }

    showOverlay();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideError();

      const username = userInput.value.trim();
      const password = passInput.value;

      const passwordHash = await sha256(password);
      if(username.toLowerCase() === ADMIN_USERNAME && passwordHash === ADMIN_PASSWORD_HASH){
        markAuthenticated();
        passInput.value = '';
        startApp();
      } else if(errorMsg){
        errorMsg.style.display = 'block';
      }
    });

    userInput.addEventListener('input', hideError);
    passInput.addEventListener('input', hideError);
  });
})();
