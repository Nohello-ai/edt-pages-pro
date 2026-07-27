/**
 * Feature: subscriptions — node links & client subscription URLs.
 */
import { $, copyText, toast } from '../ui.js';
import { getState } from './state.js';

function buildSubLinks(config) {
  const origin = location.origin;
  const token = config?.优选订阅生成?.TOKEN || '';
  const link = config?.LINK || '';
  const base = token ? `${origin}/sub?token=${encodeURIComponent(token)}` : `${origin}/sub`;
  return {
    node: link,
    auto: base,
    base64: `${base}${base.includes('?') ? '&' : '?'}b64`,
    clash: `${base}${base.includes('?') ? '&' : '?'}clash`,
    singbox: `${base}${base.includes('?') ? '&' : '?'}sb`,
    token,
  };
}

export function renderSubscriptions(root) {
  const config = getState().config || {};
  const links = buildSubLinks(config);

  root.innerHTML = `
    <div class="section-head">
      <h2>节点订阅</h2>
      <p>复制节点链接与各客户端订阅地址（鉴权 token 来自 Worker 配置）</p>
    </div>
    <div class="panel">
      <h3>节点链接</h3>
      <div class="copy-row">
        <input id="linkNode" readonly value="${escapeAttr(links.node)}">
        <button class="btn btn-primary btn-sm" data-copy="linkNode">复制</button>
      </div>
      <p class="muted" style="margin-top:8px;font-size:12px">协议 / 路径 / UUID 变更后请先在「高级配置」保存，再回到此处复制。</p>
    </div>
    <div class="panel">
      <h3>客户端订阅</h3>
      ${row('自适应订阅', 'linkAuto', links.auto)}
      ${row('Base64', 'linkB64', links.base64)}
      ${row('Clash', 'linkClash', links.clash)}
      ${row('Sing-box', 'linkSB', links.singbox)}
      <div class="field" style="margin-top:12px">
        <label>订阅 TOKEN</label>
        <input readonly class="mono" value="${escapeAttr(links.token)}">
      </div>
    </div>
  `;

  root.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-copy');
      try {
        await copyText(document.getElementById(id)?.value || '');
        toast('已复制', 'ok');
      } catch (err) {
        toast(err.message || '复制失败', 'err');
      }
    });
  });
}

function row(label, id, value) {
  return `
    <div class="field" style="margin-bottom:12px">
      <label>${label}</label>
      <div class="copy-row">
        <input id="${id}" readonly value="${escapeAttr(value)}">
        <button class="btn btn-sm" data-copy="${id}">复制</button>
      </div>
    </div>`;
}

function escapeAttr(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export default { renderSubscriptions };
