import API from './api.js';

const form = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');

async function boot() {
  const REDIRECT_KEY = '_auth_auto_redirect';
  const count = parseInt(sessionStorage.getItem(REDIRECT_KEY) || '0', 10);
  if (count < 1) {
    const ok = await API.hasSession();
    if (ok) {
      sessionStorage.setItem(REDIRECT_KEY, '1');
      location.replace('/admin');
      return;
    }
  } else {
    sessionStorage.removeItem(REDIRECT_KEY);
  }
  passwordInput?.focus();
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';
  const password = passwordInput.value;
  if (!password) {
    errorMsg.textContent = '请输入密码';
    passwordInput.focus();
    return;
  }
  loginBtn.disabled = true;
  loginBtn.textContent = '登录中...';
  sessionStorage.removeItem('_auth_auto_redirect');
  try {
    await API.login(password);
    errorMsg.style.color = '#067647';
    errorMsg.textContent = '登录成功，正在进入…';
    setTimeout(() => location.replace('/admin'), 400);
  } catch (err) {
    errorMsg.style.color = '#dc2626';
    errorMsg.textContent = err.message || '登录失败';
    passwordInput.focus();
    passwordInput.select();
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = '立即登录';
  }
});

boot();
