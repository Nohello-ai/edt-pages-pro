import API from './api.js';
import { $, toast } from './ui.js';

const form = $('#loginForm');
const passwordInput = $('#password');
const loginBtn = $('#loginBtn');
const errorMsg = $('#errorMsg');

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
  loginBtn.disabled = true;
  sessionStorage.removeItem('_auth_auto_redirect');
  try {
    await API.login(passwordInput.value);
    location.replace('/admin');
  } catch (err) {
    errorMsg.textContent = err.message || '登录失败';
    passwordInput.focus();
    passwordInput.select();
    toast(err.message || '登录失败', 'err');
  } finally {
    loginBtn.disabled = false;
  }
});

boot();
