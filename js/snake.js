/**
 * Camouflage page: Snake game
 */
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const statusEl = document.getElementById('status');
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');

const BEST_KEY = 'et_snake_best_v1';
const GRID = 20;
const COLS = 20;
const ROWS = 20;
const CELL = canvas.width / COLS;

let snake, dir, nextDir, food, score, best, timer, running, dead;

function loadBest() {
  return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
}

function saveBest(n) {
  localStorage.setItem(BEST_KEY, String(n));
}

function reset() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  dir = { x: 1, y: 0 };
  nextDir = { ...dir };
  score = 0;
  dead = false;
  running = false;
  placeFood();
  scoreEl.textContent = '0';
  best = loadBest();
  bestEl.textContent = String(best);
  statusEl.textContent = '按空格或点开始';
  draw();
}

function placeFood() {
  for (;;) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    if (!snake.some((s) => s.x === x && s.y === y)) {
      food = { x, y };
      return;
    }
  }
}

function setDir(nx, ny) {
  if (dead || !running) return;
  // no reverse
  if (nx === -dir.x && ny === -dir.y) return;
  nextDir = { x: nx, y: ny };
}

function tick() {
  if (!running || dead) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) {
    return gameOver();
  }
  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreEl.textContent = String(score);
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      saveBest(best);
    }
    placeFood();
  } else {
    snake.pop();
  }
  draw();
}

function gameOver() {
  dead = true;
  running = false;
  clearInterval(timer);
  timer = null;
  statusEl.textContent = '撞了 · 点开始重来';
  btnStart.textContent = '再来一局';
  draw(true);
}

function start() {
  if (dead) reset();
  if (running) return;
  running = true;
  dead = false;
  statusEl.textContent = '方向键 / WASD 控制';
  btnStart.textContent = '游戏中';
  clearInterval(timer);
  timer = setInterval(tick, 110);
  draw();
}

function pause() {
  if (dead) return;
  if (!running && timer == null && snake) {
    start();
    return;
  }
  running = false;
  clearInterval(timer);
  timer = null;
  statusEl.textContent = '已暂停 · 空格继续';
  btnStart.textContent = '继续';
  draw();
}

function draw(flash = false) {
  // board
  ctx.fillStyle = '#f7f4ed';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle grid
  ctx.strokeStyle = 'rgba(31, 77, 58, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL + 0.5, 0);
    ctx.lineTo(i * CELL + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let j = 0; j <= ROWS; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * CELL + 0.5);
    ctx.lineTo(canvas.width, j * CELL + 0.5);
    ctx.stroke();
  }

  // food
  const pad = 3;
  ctx.fillStyle = '#c23b4a';
  roundRect(food.x * CELL + pad, food.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 6);

  // snake
  snake.forEach((s, i) => {
    const t = i / Math.max(snake.length - 1, 1);
    ctx.fillStyle = i === 0 ? '#1f4d3a' : `rgba(31, 77, 58, ${0.85 - t * 0.35})`;
    roundRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4, 7);
  });

  if (flash || dead) {
    ctx.fillStyle = 'rgba(28, 24, 18, 0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// controls
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'enter') {
    e.preventDefault();
    if (!running || dead) start();
    else pause();
    return;
  }
  if (['arrowup', 'w'].includes(k)) {
    e.preventDefault();
    setDir(0, -1);
  } else if (['arrowdown', 's'].includes(k)) {
    e.preventDefault();
    setDir(0, 1);
  } else if (['arrowleft', 'a'].includes(k)) {
    e.preventDefault();
    setDir(-1, 0);
  } else if (['arrowright', 'd'].includes(k)) {
    e.preventDefault();
    setDir(1, 0);
  }
});

// touch swipe
let tx = 0;
let ty = 0;
canvas.addEventListener(
  'touchstart',
  (e) => {
    const t = e.changedTouches[0];
    tx = t.clientX;
    ty = t.clientY;
  },
  { passive: true }
);
canvas.addEventListener(
  'touchend',
  (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - tx;
    const dy = t.clientY - ty;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) {
      if (!running || dead) start();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
    else setDir(0, dy > 0 ? 1 : -1);
  },
  { passive: true }
);

btnStart?.addEventListener('click', () => {
  if (!running || dead) start();
});
btnPause?.addEventListener('click', () => pause());

document.querySelectorAll('.dpad [data-dir]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!running || dead) start();
    const d = btn.dataset.dir;
    if (d === 'up') setDir(0, -1);
    else if (d === 'down') setDir(0, 1);
    else if (d === 'left') setDir(-1, 0);
    else if (d === 'right') setDir(1, 0);
  });
});

reset();
