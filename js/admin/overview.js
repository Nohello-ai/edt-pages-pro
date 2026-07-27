/**
 * Feature: overview — service summary, CF usage, quick status.
 */
import API from '../api.js';
import { $, setText, fmtNumber, toast } from '../ui.js';
import { getState, setState } from './state.js';

function usageFromConfig(config) {
  const u = config?.CF?.Usage || {};
  return {
    workers: u.workers ?? 0,
    pages: u.pages ?? 0,
    total: u.total ?? ((u.workers || 0) + (u.pages || 0)),
    max: u.max ?? 100000,
    success: !!u.success,
  };
}

export function renderOverview(root) {
  const config = getState().config || {};
  const usage = usageFromConfig(config);
  const pct = usage.max ? Math.min(100, Math.round((usage.total / usage.max) * 100)) : 0;
  const protocol = config.协议类型 || config.protocol || '—';
  const transport = config.传输协议 || config.transport || 'ws';
  const host = config.HOST || location.hostname;
  const subName = config.优选订阅生成?.SUBNAME || 'edgetunnel';

  root.innerHTML = `
    <div class="section-head">
      <h2>运行概览</h2>
      <p>边缘服务状态、请求额度与节点摘要</p>
    </div>
    <div class="stat-grid" style="margin-bottom:14px">
      <div class="stat"><div class="k">服务</div><div class="v"><span class="badge ok">运行中</span></div><div class="m">Cloudflare Worker</div></div>
      <div class="stat"><div class="k">协议 / 传输</div><div class="v" style="font-size:18px">${escapeHtml(String(protocol).toUpperCase())}</div><div class="m">${escapeHtml(String(transport))}</div></div>
      <div class="stat"><div class="k">今日请求</div><div class="v">${fmtNumber(usage.total)}</div><div class="m">配额 ${fmtNumber(usage.max)} · ${pct}%</div></div>
      <div class="stat"><div class="k">订阅名</div><div class="v" style="font-size:18px">${escapeHtml(subName)}</div><div class="m">${escapeHtml(host)}</div></div>
    </div>
    <div class="panel">
      <h3>Workers / Pages 用量 <button class="btn btn-sm" id="btnRefreshUsage">刷新</button></h3>
      <div class="grid-3">
        <div class="stat"><div class="k">Workers</div><div class="v" id="statWorkers">${fmtNumber(usage.workers)}</div></div>
        <div class="stat"><div class="k">Pages</div><div class="v" id="statPages">${fmtNumber(usage.pages)}</div></div>
        <div class="stat"><div class="k">使用率</div><div class="v" id="statPct">${pct}%</div></div>
      </div>
      <div style="margin-top:14px;height:10px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#5b8cff,#36d6c3)"></div>
      </div>
      <p class="muted" style="margin-top:10px;font-size:12px">用量来自 config.CF.Usage；可在「系统运维」配置 CF 凭据后由 Worker 刷新。</p>
    </div>
    <div class="panel">
      <h3>节点摘要</h3>
      <div class="grid-2">
        <div class="field"><label>HOST</label><input readonly value="${escapeAttr(host)}"></div>
        <div class="field"><label>UUID</label><input readonly value="${escapeAttr(config.UUID || '')}"></div>
        <div class="field"><label>PATH</label><input readonly value="${escapeAttr(config.PATH || '/')}"></div>
        <div class="field"><label>完整节点路径</label><input readonly value="${escapeAttr(config.完整节点路径 || config.PATH || '/')}"></div>
      </div>
    </div>
  `;

  $('#btnRefreshUsage', root)?.addEventListener('click', async () => {
    try {
      const next = await API.getConfig();
      setState({ config: next });
      toast('配置已刷新', 'ok');
      renderOverview(root);
    } catch (err) {
      toast(err.message || '刷新失败', 'err');
    }
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll("'", '&#39;');
}

export default { renderOverview };
