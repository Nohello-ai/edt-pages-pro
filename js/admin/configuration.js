/**
 * Feature: advanced configuration — protocol, transport, path, proxy, convert.
 */
import API from '../api.js';
import { $, getValue, toast } from '../ui.js';
import { getState, setState, markDirty } from './state.js';

export function renderConfiguration(root) {
  const c = getState().config || {};
  const ss = c.SS || {};
  const proxy = c.反代 || {};
  const sock = proxy.SOCKS5 || {};
  const convert = c.订阅转换配置 || {};
  const proxyKey = Object.keys(proxy).find((k) => k !== 'SOCKS5' && k !== '路径模板') || 'ProxyIP';

  root.innerHTML = `
    <div class="section-head">
      <h2>高级配置</h2>
      <p>协议、传输、路径与反代 / 订阅转换（保存写入 KV config.json）</p>
    </div>
    <div class="panel">
      <h3>节点基础</h3>
      <div class="grid-2">
        <div class="field"><label>订阅名称</label><input id="cfgSubName" value="${v(c.优选订阅生成?.SUBNAME)}"></div>
        <div class="field"><label>HOST（只读）</label><input readonly value="${v(c.HOST)}"></div>
        <div class="field"><label>UUID（只读，环境变量）</label><input readonly value="${v(c.UUID)}"></div>
        <div class="field"><label>PATH</label><input id="cfgPath" value="${v(c.PATH || '/')}"></div>
        <div class="field">
          <label>节点协议</label>
          <select id="cfgProtocol">
            <option value="vless" ${sel(c.协议类型, 'vless')}>VLESS</option>
            <option value="trojan" ${sel(c.协议类型, 'trojan')}>Trojan</option>
            <option value="ss" ${sel(c.协议类型, 'ss')}>Shadowsocks</option>
          </select>
        </div>
        <div class="field">
          <label>传输协议</label>
          <select id="cfgTransport">
            <option value="ws" ${sel(c.传输协议, 'ws')}>WebSocket</option>
            <option value="xhttp" ${sel(c.传输协议, 'xhttp')}>XHTTP</option>
            <option value="grpc" ${sel(c.传输协议, 'grpc')}>gRPC</option>
          </select>
        </div>
        <div class="field">
          <label>gRPC 模式</label>
          <select id="cfgGrpcMode">
            <option value="gun" ${sel(c.gRPC模式, 'gun')}>gun</option>
            <option value="multi" ${sel(c.gRPC模式, 'multi')}>multi</option>
          </select>
        </div>
        <div class="field"><label>gRPC UA</label><input id="cfgGrpcUA" value="${v(c.gRPCUserAgent)}"></div>
        <div class="field">
          <label>指纹</label>
          <select id="cfgFingerprint">
            ${['chrome','firefox','safari','ios','android','edge','360','qq','random','randomized']
              .map((x) => `<option value="${x}" ${sel(c.Fingerprint, x)}>${x}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>SS 加密</label>
          <select id="cfgSsMethod">
            <option value="aes-128-gcm" ${sel(ss.加密方式, 'aes-128-gcm')}>aes-128-gcm</option>
            <option value="aes-256-gcm" ${sel(ss.加密方式, 'aes-256-gcm')}>aes-256-gcm</option>
          </select>
        </div>
      </div>
      <div class="grid-3" style="margin-top:12px">
        <label class="badge"><input type="checkbox" id="cfgRandomPath" ${c.随机路径 ? 'checked' : ''}> 随机路径</label>
        <label class="badge"><input type="checkbox" id="cfg0RTT" ${c.启用0RTT ? 'checked' : ''}> 0-RTT</label>
        <label class="badge"><input type="checkbox" id="cfgSsTLS" ${ss.TLS ? 'checked' : ''}> SS TLS</label>
        <label class="badge"><input type="checkbox" id="cfgEch" ${c.ECH ? 'checked' : ''}> ECH</label>
      </div>
    </div>
    <div class="panel">
      <h3>反代</h3>
      <div class="grid-2">
        <div class="field"><label>ProxyIP / 反代值</label><input id="cfgProxyIP" value="${v(proxy[proxyKey] ?? 'auto')}"></div>
        <div class="field"><label>SOCKS5 账号</label><input id="cfgSocks" value="${v(sock.账号)}" placeholder="user:pass@host:port"></div>
        <div class="field">
          <label>代理类型</label>
          <select id="cfgSocksType">
            <option value="" ${!sock.启用 ? 'selected' : ''}>关闭（走 ProxyIP）</option>
            ${['socks5','http','https','turn','sstp'].map((t) =>
              `<option value="${t}" ${sel(sock.启用, t)}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>全局代理</label>
          <select id="cfgSocksGlobal">
            <option value="false" ${!sock.全局 ? 'selected' : ''}>否</option>
            <option value="true" ${sock.全局 ? 'selected' : ''}>是</option>
          </select>
        </div>
      </div>
    </div>
    <div class="panel">
      <h3>订阅转换</h3>
      <div class="grid-2">
        <div class="field"><label>SUBAPI</label><input id="cfgSubApi" value="${v(convert.SUBAPI)}"></div>
        <div class="field"><label>SUBCONFIG</label><input id="cfgSubConfig" value="${v(convert.SUBCONFIG)}"></div>
      </div>
      <div class="grid-3" style="margin-top:12px">
        <label class="badge"><input type="checkbox" id="cfgUdp" ${convert.UDP ? 'checked' : ''}> UDP</label>
        <label class="badge"><input type="checkbox" id="cfgXudp" ${convert.XUDP ? 'checked' : ''}> XUDP</label>
        <label class="badge"><input type="checkbox" id="cfgTls13" ${convert.TLS13 ? 'checked' : ''}> TLS1.3</label>
        <label class="badge"><input type="checkbox" id="cfgEmoji" ${convert.SUBEMOJI ? 'checked' : ''}> Emoji</label>
        <label class="badge"><input type="checkbox" id="cfgSubList" ${convert.SUBLIST ? 'checked' : ''}> 仅节点列表</label>
      </div>
      <div class="form-actions">
        <button class="btn" id="btnReloadCfg">放弃修改并重载</button>
        <button class="btn btn-primary" id="btnSaveCfg">保存配置</button>
      </div>
    </div>
  `;

  root.querySelectorAll('input,select,textarea').forEach((node) => {
    node.addEventListener('change', () => markDirty(true));
    node.addEventListener('input', () => markDirty(true));
  });

  $('#btnReloadCfg', root)?.addEventListener('click', async () => {
    try {
      const config = await API.getConfig();
      setState({ config, dirty: false });
      toast('已重新加载', 'ok');
      renderConfiguration(root);
    } catch (err) {
      toast(err.message || '加载失败', 'err');
    }
  });

  $('#btnSaveCfg', root)?.addEventListener('click', async () => {
    try {
      const next = buildConfigFromForm(getState().config || {});
      await API.saveConfig(next);
      const fresh = await API.getConfig();
      setState({ config: fresh, dirty: false });
      toast('配置已保存', 'ok');
      renderConfiguration(root);
    } catch (err) {
      toast(err.message || '保存失败', 'err');
    }
  });
}

function buildConfigFromForm(base) {
  const cfg = structuredClone(base);
  cfg.优选订阅生成 = cfg.优选订阅生成 || {};
  cfg.SS = cfg.SS || {};
  cfg.反代 = cfg.反代 || {};
  cfg.反代.SOCKS5 = cfg.反代.SOCKS5 || {};
  cfg.订阅转换配置 = cfg.订阅转换配置 || {};
  cfg.ECHConfig = cfg.ECHConfig || { DNS: 'https://dns.alidns.com/dns-query', SNI: 'cloudflare-ech.com' };

  cfg.优选订阅生成.SUBNAME = getValue('cfgSubName') || cfg.优选订阅生成.SUBNAME || 'edgetunnel';
  cfg.PATH = getValue('cfgPath') || '/';
  cfg.协议类型 = getValue('cfgProtocol') || 'vless';
  cfg.传输协议 = getValue('cfgTransport') || 'ws';
  cfg.gRPC模式 = getValue('cfgGrpcMode') || 'gun';
  cfg.gRPCUserAgent = getValue('cfgGrpcUA') || cfg.gRPCUserAgent || '';
  cfg.Fingerprint = getValue('cfgFingerprint') || 'chrome';
  cfg.随机路径 = !!document.getElementById('cfgRandomPath')?.checked;
  cfg.启用0RTT = !!document.getElementById('cfg0RTT')?.checked;
  cfg.ECH = !!document.getElementById('cfgEch')?.checked;
  cfg.SS.加密方式 = getValue('cfgSsMethod') || 'aes-128-gcm';
  cfg.SS.TLS = !!document.getElementById('cfgSsTLS')?.checked;

  const proxyKey = Object.keys(cfg.反代).find((k) => k !== 'SOCKS5' && k !== '路径模板') || 'ProxyIP';
  cfg.反代[proxyKey] = getValue('cfgProxyIP') || 'auto';
  cfg.反代.SOCKS5.账号 = getValue('cfgSocks') || '';
  cfg.反代.SOCKS5.启用 = getValue('cfgSocksType') || null;
  cfg.反代.SOCKS5.全局 = getValue('cfgSocksGlobal') === 'true';

  cfg.订阅转换配置.SUBAPI = getValue('cfgSubApi');
  cfg.订阅转换配置.SUBCONFIG = getValue('cfgSubConfig');
  cfg.订阅转换配置.UDP = !!document.getElementById('cfgUdp')?.checked;
  cfg.订阅转换配置.XUDP = !!document.getElementById('cfgXudp')?.checked;
  cfg.订阅转换配置.TLS13 = !!document.getElementById('cfgTls13')?.checked;
  cfg.订阅转换配置.SUBEMOJI = !!document.getElementById('cfgEmoji')?.checked;
  cfg.订阅转换配置.SUBLIST = !!document.getElementById('cfgSubList')?.checked;

  if (!cfg.UUID || !cfg.HOST) {
    throw new Error('配置不完整：缺少 UUID 或 HOST');
  }
  return cfg;
}

function v(x) {
  return String(x ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;');
}
function sel(cur, value) {
  return String(cur ?? '') === String(value) ? 'selected' : '';
}

export default { renderConfiguration };
