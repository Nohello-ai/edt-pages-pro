/**
 * Feature: network optimize — preferred IPs / ADD.txt / modes.
 */
import API from '../api.js';
import { $, getValue, setValue, toast } from '../ui.js';
import { getState, setState, markDirty } from './state.js';

export async function loadAddText() {
  try {
    const text = await API.getAddList();
    setState({ addText: text === 'null' ? '' : text });
  } catch {
    setState({ addText: getState().addText || '' });
  }
}

export function renderOptimize(root) {
  const config = getState().config || {};
  const pref = config.优选订阅生成 || {};
  const localLib = pref.本地IP库 || {};
  const mode = pref.local === false ? 'generator' : localLib.随机IP === false ? 'custom' : 'random';

  root.innerHTML = `
    <div class="section-head">
      <h2>网络优选</h2>
      <p>管理优选模式、随机数量、自定义地址列表（ADD.txt）</p>
    </div>
    <div class="panel">
      <h3>优选模式</h3>
      <div class="grid-2">
        <div class="field">
          <label>模式</label>
          <select id="optMode">
            <option value="random" ${mode === 'random' ? 'selected' : ''}>随机优选（本地 IP 库）</option>
            <option value="custom" ${mode === 'custom' ? 'selected' : ''}>自定义列表（ADD.txt）</option>
            <option value="generator" ${mode === 'generator' ? 'selected' : ''}>外部优选生成器</option>
          </select>
        </div>
        <div class="field">
          <label>随机数量 (1-99)</label>
          <input id="optRandomCount" type="number" min="1" max="99" value="${Number(localLib.随机数量) || 16}">
        </div>
        <div class="field">
          <label>指定端口（-1 为随机 TLS 端口）</label>
          <input id="optPort" type="number" value="${localLib.指定端口 ?? -1}">
        </div>
        <div class="field">
          <label>生成器地址（模式=生成器时）</label>
          <input id="optGenerator" placeholder="sub.example.com" value="${escapeAttr(pref.SUB || '')}">
        </div>
      </div>
    </div>
    <div class="panel">
      <h3>自定义优选地址 <span class="muted" style="font-weight:500">每行 host:port#备注</span></h3>
      <div class="field">
        <textarea id="optAddText" placeholder="www.visa.cn:443#优选1">${escapeText(getState().addText || '')}</textarea>
      </div>
      <div class="form-actions">
        <button class="btn" id="btnReloadAdd">重新加载</button>
        <button class="btn btn-primary" id="btnSaveOpt">保存优选</button>
      </div>
    </div>
  `;

  $('#btnReloadAdd', root)?.addEventListener('click', async () => {
    try {
      await loadAddText();
      setValue('optAddText', getState().addText || '');
      toast('已重新加载 ADD.txt', 'ok');
    } catch (err) {
      toast(err.message || '加载失败', 'err');
    }
  });

  $('#btnSaveOpt', root)?.addEventListener('click', async () => {
    const cfg = structuredClone(getState().config || {});
    cfg.优选订阅生成 = cfg.优选订阅生成 || {};
    cfg.优选订阅生成.本地IP库 = cfg.优选订阅生成.本地IP库 || {};
    const m = getValue('optMode');
    if (m === 'generator') {
      cfg.优选订阅生成.local = false;
      cfg.优选订阅生成.SUB = getValue('optGenerator').trim() || null;
    } else {
      cfg.优选订阅生成.local = true;
      cfg.优选订阅生成.本地IP库.随机IP = m === 'random';
      cfg.优选订阅生成.SUB = null;
    }
    cfg.优选订阅生成.本地IP库.随机数量 = clamp(Number(getValue('optRandomCount')) || 16, 1, 99);
    cfg.优选订阅生成.本地IP库.指定端口 = Number(getValue('optPort'));
    const addText = getValue('optAddText');

    try {
      await API.saveConfig(cfg);
      if (m === 'custom' || addText.trim()) {
        await API.saveAddList(addText);
      }
      setState({ config: cfg, addText, dirty: false });
      toast('优选配置已保存', 'ok');
    } catch (err) {
      toast(err.message || '保存失败', 'err');
    }
  });

  ['optMode', 'optRandomCount', 'optPort', 'optGenerator', 'optAddText'].forEach((id) => {
    root.querySelector(`#${id}`)?.addEventListener('change', () => markDirty(true));
    root.querySelector(`#${id}`)?.addEventListener('input', () => markDirty(true));
  });
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function escapeAttr(s) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}
function escapeText(s) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;');
}

export default { renderOptimize, loadAddText };
