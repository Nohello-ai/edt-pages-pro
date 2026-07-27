/**
 * Tiny UI helpers: toast, copy, DOM.
 */
export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $all(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((child) => {
    if (child == null) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return node;
}

export function ensureToastHost() {
  let host = $('#toastHost');
  if (!host) {
    host = el('div', { id: 'toastHost', class: 'toast-host' });
    document.body.append(host);
  }
  return host;
}

export function toast(message, type = 'ok', ms = 2800) {
  const host = ensureToastHost();
  const item = el('div', { class: `toast ${type}`, text: message });
  host.append(item);
  setTimeout(() => item.remove(), ms);
}

export async function copyText(text) {
  const value = String(text ?? '');
  if (!value) throw new Error('没有可复制的内容');
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const ta = el('textarea', { style: 'position:fixed;left:-9999px;top:0' });
  ta.value = value;
  document.body.append(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

export function setText(id, value) {
  const node = typeof id === 'string' ? document.getElementById(id) : id;
  if (node) node.textContent = value == null || value === '' ? '—' : String(value);
}

export function setValue(id, value) {
  const node = typeof id === 'string' ? document.getElementById(id) : id;
  if (node) node.value = value == null ? '' : String(value);
}

export function getValue(id) {
  const node = typeof id === 'string' ? document.getElementById(id) : id;
  return node ? node.value : '';
}

export function fmtNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('zh-CN');
}
