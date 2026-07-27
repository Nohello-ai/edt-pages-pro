/**
 * Shared admin app state.
 */
const state = {
  config: null,
  dirty: false,
  view: 'subscriptions',
  advancedOpen: false,
  logs: [],
  addText: '',
  loading: false,
  error: null,
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function markDirty(flag = true) {
  setState({ dirty: flag });
}

export default state;
