/**
 * Feature: operations — logs, TG/CF credentials, reset.
 */
import API from '../api.js';
import { $, getValue, toast, fmtNumber } from '../ui.js';
import { getState, setState } from './state.js';

export async function loadLogs() {
  try {
    const logs = await API.getLogs();
    setState({ logs: Array.isArray(logs) ? logs : [] });
  } catch {
    setState({ logs: [] });
  }
}

export function renderOperations(root) {
  const config = getState().config || {};
  const tg = config.TG || {};
  const cf = config.CF || {};
  const logs = (getState().logs || []).slice().reverse().slice(0, 50);

  root.innerHTML = `
    <div class="panel">
      <h3>Telegram 通知</h3>
      <div class="grid-2">
        <div class="field"><label>启用</label>
          <select id="tgEnabled">
            <option value="false" ${!tg.启用 ? 'selected' : ''}>关闭</option>
            <option value="true" ${tg.启用 ? 'selected' : ''}>开启</option>
          </select>
        </div>
        <div class="field"><label>Chat ID</label><input id="tgChat" value="${v(tg.ChatID)}"></div>
        <div class="field" style="grid-column:1/-1"><label>Bot Token</label><input id="tgToken" placeholder="仅在保存时提交完整 token" value=""></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-danger" id="btnClearTg">清空 TG 配置</button>
        <button class="btn btn-primary" id="btnSaveTg">保存 TG</button>
      </div>
    </div>
    <div class="panel">
      <h3>Cloudflare 用量凭据</h3>
      <div class="grid-2">
        <div class="field"><label>Email</label><input id="cfEmail" value="${v(cf.Email)}"></div>
        <div class="field"><label>Global API Key</label><input id="cfKey" placeholder="保存时填写"></div>
        <div class="field"><label>Account ID</label><input id="cfAccount" value="${v(cf.AccountID)}"></div>
        <div class="field"><label>API Token</label><input id="cfToken" placeholder="保存时填写"></div>
        <div class="field" style="grid-column:1/-1"><label>Usage API URL（可选）</label><input id="cfUsageApi" value="${v(cf.UsageAPI)}"></div>
      </div>
      <p class="muted" style="font-size:12px;margin-top:8px">当前用量：Workers ${fmtNumber(cf.Usage?.workers)} · Pages ${fmtNumber(cf.Usage?.pages)} · Total ${fmtNumber(cf.Usage?.total)}</p>
      <div class="form-actions">
        <button class="btn btn-danger" id="btnClearCf">清空 CF 配置</button>
        <button class="btn btn-primary" id="btnSaveCf">保存 CF</button>
      </div>
    </div>
    <div class="panel">
      <h3>最近日志 <button class="btn btn-sm" id="btnReloadLogs">刷新</button></h3>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>时间</th><th>类型</th><th>IP</th><th>UA / URL</th></tr></thead>
          <tbody>
            ${logs.length ? logs.map(logRow).join('') : '<tr><td colspan="4" class="muted">暂无日志</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    <div class="panel">
      <h3>危险操作</h3>
      <p class="muted" style="margin-bottom:12px;font-size:13px">重置会把 KV 中的 config.json 恢复为 Worker 默认值。</p>
      <button class="btn btn-danger" id="btnReset">重置全部配置</button>
    </div>
  `;

  $('#btnSaveTg', root)?.addEventListener('click', async () => {
    try {
      const body = {
        BotToken: getValue('tgToken') || undefined,
        ChatID: getValue('tgChat') || null,
      };
      // enable flag lives in main config
      const cfg = structuredClone(getState().config || {});
      cfg.TG = cfg.TG || {};
      cfg.TG.启用 = getValue('tgEnabled') === 'true';
      if (body.ChatID) cfg.TG.ChatID = body.ChatID;
      await API.saveConfig(cfg);
      if (getValue('tgToken') && getValue('tgChat')) {
        await API.saveTG({ BotToken: getValue('tgToken'), ChatID: getValue('tgChat') });
      }
      const fresh = await API.getConfig();
      setState({ config: fresh });
      toast('Telegram 配置已保存', 'ok');
      renderOperations(root);
    } catch (err) {
      toast(err.message || '保存失败', 'err');
    }
  });

  $('#btnClearTg', root)?.addEventListener('click', async () => {
    if (!confirm('确定清空 Telegram 配置？')) return;
    try {
      await API.saveTG({ init: true });
      const cfg = structuredClone(getState().config || {});
      cfg.TG = { 启用: false, BotToken: null, ChatID: null };
      await API.saveConfig(cfg);
      setState({ config: await API.getConfig() });
      toast('已清空 TG', 'ok');
      renderOperations(root);
    } catch (err) {
      toast(err.message || '失败', 'err');
    }
  });

  $('#btnSaveCf', root)?.addEventListener('click', async () => {
    try {
      const payload = {};
      const email = getValue('cfEmail');
      const key = getValue('cfKey');
      const account = getValue('cfAccount');
      const token = getValue('cfToken');
      const usageApi = getValue('cfUsageApi');
      if (usageApi) payload.UsageAPI = usageApi;
      else if (email && key) {
        payload.Email = email;
        payload.GlobalAPIKey = key;
      } else if (account && token) {
        payload.AccountID = account;
        payload.APIToken = token;
      } else {
        throw new Error('请填写 Email+GlobalAPIKey，或 AccountID+APIToken，或 UsageAPI');
      }
      await API.saveCF(payload);
      setState({ config: await API.getConfig() });
      toast('CF 配置已保存', 'ok');
      renderOperations(root);
    } catch (err) {
      toast(err.message || '保存失败', 'err');
    }
  });

  $('#btnClearCf', root)?.addEventListener('click', async () => {
    if (!confirm('确定清空 Cloudflare 凭据？')) return;
    try {
      await API.saveCF({ init: true });
      setState({ config: await API.getConfig() });
      toast('已清空 CF', 'ok');
      renderOperations(root);
    } catch (err) {
      toast(err.message || '失败', 'err');
    }
  });

  $('#btnReloadLogs', root)?.addEventListener('click', async () => {
    await loadLogs();
    renderOperations(root);
    toast('日志已刷新', 'ok');
  });

  $('#btnReset', root)?.addEventListener('click', async () => {
    if (!confirm('确定重置全部配置为默认值？此操作不可撤销。')) return;
    try {
      const config = await API.initConfig();
      setState({ config, dirty: false });
      toast('配置已重置', 'warn');
    } catch (err) {
      toast(err.message || '重置失败', 'err');
    }
  });
}

function logRow(item) {
  const time = item.TIME ? new Date(item.TIME).toLocaleString('zh-CN') : '—';
  const ua = (item.UA || '').slice(0, 80);
  const url = (item.URL || '').slice(0, 100);
  return `<tr>
    <td class="mono">${v(time)}</td>
    <td>${v(item.TYPE || '')}</td>
    <td class="mono">${v(item.IP || '')}</td>
    <td><div class="muted" style="font-size:12px">${v(ua)}</div><div class="mono" style="font-size:11px;color:var(--text-mute)">${v(url)}</div></td>
  </tr>`;
}

function v(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export default { renderOperations, loadLogs };
