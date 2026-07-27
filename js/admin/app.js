/**
 * Admin SPA shell — one feature module per view.
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
  { id: 'overview', label: '运行概览', desc: '服务状态与用量摘要' },
  { id: 'subscriptions', label: '节点订阅', desc: '节点与客户端订阅链接' },
  { id: 'optimize', label: '网络优选', desc: '优选模式与 ADD 列表' },
  { id: 'configuration', label: '高级配置', desc: '协议 / 传输 / 反代' },
  { id: 'operations', label: '系统运维', desc: '通知、凭据与日志' },
];

const renderers = {
  overview: renderOverview,
  subscriptions: renderSubscriptions,
  optimize: renderOptimize,
  configuration: renderConfiguration,
  operations: renderOperations,
};

async function boot() {
  const authed = await API.hasSession();
  if (!authed) {
    location.replace('/login');
    return;
  }

  bindShell();
  setState({ loading: true });
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

  const initial = location.hash.replace(/^#/, '') || 'overview';
  switchView(VIEWS.some((v) => v.id === initial) ? initial : 'overview', false);
}

function bindShell() {
  const nav = $('#opsDesktopNav');
  const mobile = $('#opsMobileNav');
  const markup = VIEWS.map(
    (v) =>
      `<button type="button" class="nav-btn" data-view="${v.id}"><span class="ico">▣</span><span>${v.label}</span></button>`
  ).join('');
  if (nav) nav.innerHTML = markup;
  if (mobile) mobile.innerHTML = markup;

  $all('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace(/^#/, '');
    if (VIEWS.some((v) => v.id === id)) switchView(id, false);
  });

  $('#btnLogout')?.addEventListener('click', () => API.logout());
  $('#btnReset')?.addEventListener('click', async () => {
    if (!confirm('确定重置全部配置？')) return;
    try {
      const config = await API.initConfig();
      setState({ config, dirty: false });
      toast('已重置配置', 'warn');
      switchView(getState().view, false);
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
      switchView(getState().view, false);
    } catch (err) {
      toast(err.message || '刷新失败', 'err');
    }
  });
}

function switchView(viewId, updateHash = true) {
  const meta = VIEWS.find((v) => v.id === viewId) || VIEWS[0];
  setState({ view: meta.id });
  $all('[data-view]').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === meta.id));
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
