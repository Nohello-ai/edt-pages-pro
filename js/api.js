/**
 * Worker API client — keeps endpoints compatible with edgetunnel-v3.
 */
const API = {
  async request(path, options = {}) {
    const opts = {
      cache: 'no-store',
      ...options,
      headers: { ...(options.headers || {}) },
    };
    const res = await fetch(path, opts);
    return res;
  },

  async getJSON(path) {
    const res = await this.request(`${path}${path.includes('?') ? '&' : '?'}_t=${Date.now()}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async sendJSON(path, method, body) {
    const res = await this.request(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data;
  },

  getConfig() {
    return this.getJSON('/admin/config.json');
  },

  saveConfig(config) {
    return this.sendJSON('/admin/config.json', 'POST', config);
  },

  initConfig() {
    return this.getJSON('/admin/init');
  },

  getLogs() {
    return this.getJSON('/admin/log.json');
  },

  getAddList() {
    return this.request(`/admin/ADD.txt?_t=${Date.now()}`).then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    });
  },

  saveAddList(text) {
    return this.request('/admin/ADD.txt', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: text,
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    });
  },

  getTG() {
    // stored via config.TG + dedicated endpoint for secrets
    return this.getConfig().then((c) => c.TG || {});
  },

  saveTG(body) {
    return this.sendJSON('/admin/tg.json', 'POST', body);
  },

  saveCF(body) {
    return this.sendJSON('/admin/cf.json', 'POST', body);
  },

  getCloudflareUsage(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.getJSON(`/admin/getCloudflareUsage?${q}`);
  },

  checkProxy(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.getJSON(`/admin/check?${q}`);
  },

  async login(password) {
    const res = await this.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `password=${encodeURIComponent(password)}`,
      redirect: 'manual',
    });
    if (res.type === 'opaqueredirect') return { success: true, redirected: true };
    if (!res.ok) throw new Error(`登录失败 (${res.status})`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      if (data.success) return data;
      throw new Error('密码错误');
    }
    throw new Error('密码错误，请重试');
  },

  async hasSession() {
    try {
      const res = await this.request(`/admin/config.json?_t=${Date.now()}`, {
        method: 'HEAD',
        redirect: 'manual',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  logout() {
    window.location.href = '/logout';
  },
};

export default API;
