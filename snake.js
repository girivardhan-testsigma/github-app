const GRID_SIZE = 20;
const CELL_SIZE = 20;
const BASE_TICK_MS = 150;
const SPEEDUP_EVERY = 5;
const MIN_TICK_MS = 60;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highEl = document.getElementById("highScore");
const speedEl = document.getElementById("speed");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMsg = document.getElementById("overlayMsg");
const startBtn = document.getElementById("startBtn");

const state = {
  snake: [],
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  food: { x: 0, y: 0 },
  score: 0,
  highScore: 0,
  speedLevel: 1,
  running: false,
  paused: false,
  timer: null,
};

function loadHighScore() {
  const raw = localStorage.getItem("snake.highScore");
  state.highScore = raw ? parseInt(raw, 10) || 0 : 0;
  highEl.textContent = state.highScore;
}

function saveHighScore() {
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem("snake.highScore", String(state.highScore));
    highEl.textContent = state.highScore;
  }
}

function initGame() {
  const mid = Math.floor(GRID_SIZE / 2);
  state.snake = [
    { x: mid - 1, y: mid },
    { x: mid, y: mid },
    { x: mid + 1, y: mid },
  ];
  state.dir = { x: 1, y: 0 };
  state.nextDir = { x: 1, y: 0 };
  state.score = 0;
  state.speedLevel = 1;
  scoreEl.textContent = "0";
  speedEl.textContent = "1";
  spawnFood();
  draw();
}

function spawnFood() {
  const occupied = new Set(state.snake.map((s) => `${s.x},${s.y}`));
  const empty = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
    }
  }
  if (empty.length === 0) {
    win();
    return;
  }
  state.food = empty[Math.floor(Math.random() * empty.length)];
}

function tickInterval() {
  const ms = BASE_TICK_MS - (state.speedLevel - 1) * 12;
  return Math.max(MIN_TICK_MS, ms);
}

function startLoop() {
  if (state.timer) clearInterval(state.timer);
  state.timer = setInterval(gameLoop, tickInterval());
}

function gameLoop() {
  if (!state.running || state.paused) return;
  update();
  draw();
}

function update() {
  if (!isReverse(state.nextDir, state.dir)) {
    state.dir = state.nextDir;
  }

  const head = state.snake[state.snake.length - 1];
  const newHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };

  if (checkWallCollision(newHead) || checkSelfCollision(newHead)) {
    gameOver();
    return;
  }

  state.snake.push(newHead);

  if (newHead.x === state.food.x && newHead.y === state.food.y) {
    state.score += 1;
    scoreEl.textContent = String(state.score);
    if (state.score % SPEEDUP_EVERY === 0) {
      state.speedLevel += 1;
      speedEl.textContent = String(state.speedLevel);
      startLoop();
    }
    spawnFood();
  } else {
    state.snake.shift();
  }
}

function checkWallCollision(p) {
  return p.x < 0 || p.x >= GRID_SIZE || p.y < 0 || p.y >= GRID_SIZE;
}

function checkSelfCollision(p) {
  return state.snake.some((seg) => seg.x === p.x && seg.y === p.y);
}

function isReverse(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

function draw() {
  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ef4444";
  drawCell(state.food.x, state.food.y);

  state.snake.forEach((seg, i) => {
    const isHead = i === state.snake.length - 1;
    ctx.fillStyle = isHead ? "#16a34a" : "#4ade80";
    drawCell(seg.x, seg.y);
  });
}

function drawCell(gx, gy) {
  const pad = 1;
  ctx.fillRect(
    gx * CELL_SIZE + pad,
    gy * CELL_SIZE + pad,
    CELL_SIZE - pad * 2,
    CELL_SIZE - pad * 2,
  );
}

function handleKey(e) {
  const k = e.key.toLowerCase();
  if (k === " " || k === "spacebar") {
    e.preventDefault();
    togglePause();
    return;
  }
  if (k === "r") {
    restart();
    return;
  }
  const map = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };
  const nd = map[k];
  if (nd) {
    e.preventDefault();
    state.nextDir = nd;
  }
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  if (state.paused) {
    showOverlay("Paused", "Press Space to resume");
  } else {
    hideOverlay();
  }
}

function gameOver() {
  state.running = false;
  clearInterval(state.timer);
  state.timer = null;
  saveHighScore();
  showOverlay("Game Over", `Score ${state.score} · Press R or Start`);
  startBtn.textContent = "Restart";
}

function win() {
  state.running = false;
  clearInterval(state.timer);
  state.timer = null;
  saveHighScore();
  showOverlay("You Win!", `Filled the board · Score ${state.score}`);
  startBtn.textContent = "Restart";
}

function start() {
  initGame();
  state.running = true;
  state.paused = false;
  hideOverlay();
  startLoop();
}

function restart() {
  start();
}

function showOverlay(title, msg) {
  overlayTitle.textContent = title;
  overlayMsg.textContent = msg;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

document.addEventListener("keydown", handleKey);
startBtn.addEventListener("click", start);

loadHighScore();
initGame();
showOverlay("Snake", "Press Space or click Start");
