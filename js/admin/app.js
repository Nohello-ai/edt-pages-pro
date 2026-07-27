/**
 * Admin SPA shell — Ivory layout:
 * left: overview + optimize
 * center (default): subscriptions
 * right: me (admin hero + logs) + advanced switch for configuration
 */
import API from '../api.js';
import { $, $all, toast } from '../ui.js';
import { getState, setState } from './state.js';
import { renderOverview } from './overview.js';
import { renderSubscriptions } from './subscriptions.js';
import { renderOptimize, loadAddText } from './optimize.js';
import { renderConfiguration } from './configuration.js';
import { renderOperations, loadLogs } from './operations.js';

const VIEWS = [
  { id: 'overview', label: '运行概览', desc: '服务状态与用量摘要', zone: 'left', icon: '◈' },
  { id: 'optimize', label: '网络优选', desc: '优选模式与地址列表', zone: 'left', icon: '◎' },
  { id: 'subscriptions', label: '节点订阅', desc: '提取节点与客户端订阅链接', zone: 'center', icon: '▣' },
  { id: 'me', label: '我的', desc: '管理员与运维日志', zone: 'right', icon: '◉' },
  { id: 'configuration', label: '高级设置', desc: '协议 / 传输 / 反代 / 转换', zone: 'advanced', icon: '⚙' },
];

const renderers = {
  overview: renderOverview,
  subscriptions: renderSubscriptions,
  optimize: renderOptimize,
  configuration: renderConfiguration,
  me: renderMe,
};

function renderMe(root) {
  // Reuse operations module content under a big "管理员" hero
  root.innerHTML = `
    <div class="me-hero panel">
      <div class="eyebrow">Account</div>
      <h2>管理员</h2>
      <p>运维入口：通知、Cloudflare 凭据、操作日志。高级协议与反代请打开左侧底部「高级设置」开关。</p>
    </div>
    <div id="meOpsMount"></div>
  `;
  const mount = root.querySelector('#meOpsMount');
  renderOperations(mount);
  // Hide the duplicate "危险操作" reset if topbar has it — keep both is fine
}

async function boot() {
  const authed = await API.hasSession();
  if (!authed) {
    location.replace('/login');
    return;
  }

  bindShell();
  setState({ loading: true, advancedOpen: false });
  try {
    const config = await API.getConfig();
    setState({ config, loading: false, error: null });
    await Promise.allSettled([loadAddText(), loadLogs()]);
  } catch (err) {
    setState({ loading: false, error: err.message || '加载失败' });
    toast(err.message || '无法加载配置，请重新登录', 'err');
    if (String(err.message).includes('401') || String(err.message).includes('403')) {
      location.replace('/login');
      return;
    }
  }

  // Default home: subscriptions (extract links). Respect hash if valid.
  const hash = location.hash.replace(/^#/, '');
  const advancedOpen = hash === 'configuration' || localStorage.getItem('et_advanced_open') === '1';
  setAdvancedOpen(advancedOpen, false);
  const initial =
    VIEWS.some((v) => v.id === hash) ? hash :
    advancedOpen && hash === 'configuration' ? 'configuration' :
    'subscriptions';
  switchView(initial, false);
}

function bindShell() {
  renderNav();

  window.addEventListener('hashchange', () => {
    const id = location.hash.replace(/^#/, '');
    if (id === 'configuration') {
      setAdvancedOpen(true, false);
      switchView('configuration', false);
      return;
    }
    if (VIEWS.some((v) => v.id === id && v.zone !== 'advanced')) {
      switchView(id, false);
    }
  });

  $('#btnLogout')?.addEventListener('click', () => API.logout());
  $('#btnReset')?.addEventListener('click', async () => {
    if (!confirm('确定重置全部配置？')) return;
    try {
      const config = await API.initConfig();
      setState({ config, dirty: false });
      toast('已重置配置', 'warn');
      switchView(getState().view || 'subscriptions', false);
    } catch (err) {
      toast(err.message || '重置失败', 'err');
    }
  });
  $('#btnReload')?.addEventListener('click', async () => {
    try {
      const config = await API.getConfig();
      setState({ config, dirty: false });
      await Promise.allSettled([loadAddText(), loadLogs()]);
      toast('已刷新', 'ok');
      switchView(getState().view || 'subscriptions', false);
    } catch (err) {
      toast(err.message || '刷新失败', 'err');
    }
  });
}

function renderNav() {
  const nav = $('#opsDesktopNav');
  const mobile = $('#opsMobileNav');

  const left = VIEWS.filter((v) => v.zone === 'left');
  const center = VIEWS.filter((v) => v.zone === 'center');
  const right = VIEWS.filter((v) => v.zone === 'right');

  const btn = (v) =>
    `<button type="button" class="nav-btn" data-view="${v.id}"><span class="ico">${v.icon}</span><span>${v.label}</span></button>`;

  if (nav) {
    nav.innerHTML = `
      <div class="nav-group">
        <div class="nav-group-label">左侧</div>
        ${left.map(btn).join('')}
      </div>
      <div class="nav-group">
        <div class="nav-group-label">中间</div>
        ${center.map(btn).join('')}
      </div>
      <div class="nav-group">
        <div class="nav-group-label">我的</div>
        ${right.map(btn).join('')}
      </div>
      <div class="nav-advanced-switch" id="advancedSwitchBox">
        <div class="row">
          <div>
            <strong>高级设置</strong>
            <span>协议 · 传输 · 反代 · 转换</span>
          </div>
          <label class="switch" title="打开高级设置">
            <input type="checkbox" id="advancedToggle">
            <span class="slider"></span>
          </label>
        </div>
        <button type="button" class="btn btn-sm btn-block" id="btnOpenAdvanced" style="margin-top:10px;display:none">进入高级设置</button>
      </div>
    `;
  }

  // Mobile: main tabs only + advanced when on
  if (mobile) {
    mobile.innerHTML = [...left, ...center, ...right]
      .map(btn)
      .join('');
  }

  $all('[data-view]').forEach((el) => {
    el.addEventListener('click', () => switchView(el.dataset.view));
  });

  const toggle = $('#advancedToggle');
  const openBtn = $('#btnOpenAdvanced');
  if (toggle) {
    toggle.checked = !!getState().advancedOpen;
    toggle.addEventListener('change', () => {
      setAdvancedOpen(toggle.checked, true);
      if (toggle.checked) switchView('configuration');
      else if (getState().view === 'configuration') switchView('me');
    });
  }
  openBtn?.addEventListener('click', () => {
    setAdvancedOpen(true, true);
    switchView('configuration');
  });
  syncAdvancedChrome();
}

function setAdvancedOpen(open, persist = true) {
  setState({ advancedOpen: !!open });
  if (persist) localStorage.setItem('et_advanced_open', open ? '1' : '0');
  syncAdvancedChrome();
}

function syncAdvancedChrome() {
  const open = !!getState().advancedOpen;
  const toggle = $('#advancedToggle');
  const openBtn = $('#btnOpenAdvanced');
  if (toggle) toggle.checked = open;
  if (openBtn) openBtn.style.display = open ? 'flex' : 'none';

  // Optional: show advanced as active nav state only when on that view
  $all('[data-view="configuration"]').forEach((b) => {
    b.classList.toggle('active', open && getState().view === 'configuration');
  });
}

function switchView(viewId, updateHash = true) {
  let meta = VIEWS.find((v) => v.id === viewId);
  if (!meta) meta = VIEWS.find((v) => v.id === 'subscriptions');

  if (meta.id === 'configuration' && !getState().advancedOpen) {
    setAdvancedOpen(true, true);
  }

  setState({ view: meta.id });
  $all('[data-view]').forEach((btn) => {
    const active = btn.dataset.view === meta.id;
    btn.classList.toggle('active', active);
  });
  syncAdvancedChrome();

  const title = $('#pageTitle');
  const sub = $('#pageSub');
  if (title) title.textContent = meta.label;
  if (sub) sub.textContent = meta.desc;
  if (updateHash) history.replaceState(null, '', `#${meta.id}`);

  const mount = $('#viewRoot');
  if (!mount) return;
  if (getState().loading) {
    mount.innerHTML = `<div class="empty">正在加载配置…</div>`;
    return;
  }
  if (getState().error && !getState().config) {
    mount.innerHTML = `<div class="empty">加载失败：${escapeHtml(getState().error)}</div>`;
    return;
  }
  const render = renderers[meta.id];
  mount.innerHTML = '';
  render?.(mount);
}

function escapeHtml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

boot();
