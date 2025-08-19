// ------------------------ คำศัพท์ ------------------------
const wordPairs = [
  ["cat","แมว"], ["dog","สุนัข"], ["apple","แอปเปิ้ล"], ["car","รถ"],
  ["book","หนังสือ"], ["house","บ้าน"], ["tree","ต้นไม้"], ["sun","พระอาทิตย์"],
  ["moon","พระจันทร์"], ["water","น้ำ"], ["fire","ไฟ"], ["earth","โลก"],
  ["friend","เพื่อน"], ["computer","คอมพิวเตอร์"], ["music","ดนตรี"],
  ["food","อาหาร"], ["drink","เครื่องดื่ม"], ["pen","ปากกา"],
  ["paper","กระดาษ"], ["phone","โทรศัพท์"], ["school","โรงเรียน"],
  ["teacher","ครู"], ["student","นักเรียน"], ["game","เกม"], ["love","รัก"]
];

// ------------------------ สถานะเกม ------------------------
let cards = [];
let flippedStack = [];
let score = 0;
let lives = 5;
let highScore = parseInt(localStorage.getItem("highScore") || "0", 10);

let canClick = false;
let currentMode = "easy";
let totalPairs = 0;

// ------------------------ อ้างอิง DOM ------------------------
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const highEl  = document.getElementById("highscore");
const boardEl = document.getElementById("game-board");
const controlsEl = document.getElementById("controls");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlay-title");
const overlayMsgEl = document.getElementById("overlay-msg");
const overlayActionsEl = document.getElementById("overlay-actions");

highEl.textContent = highScore;

// ------------------------ โหมดเกม ------------------------
const MODES = {
  easy:   { lives: 5, pairs: 5,  previewMs: 2000 },
  medium: { lives: 5, pairs: 10, previewMs: 2500 },
  hard:   { lives: 5, pairs: 15, previewMs: 3000 },
};
const MODE_ORDER = ["easy","medium","hard"];
function getNextMode(mode){
  const i = MODE_ORDER.indexOf(mode);
  return (i > -1 && i < MODE_ORDER.length - 1) ? MODE_ORDER[i+1] : null;
}

// ------------------------ เลือกโหมด ------------------------
controlsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-mode]");
  if (!btn) return;
  const mode = btn.dataset.mode;
  startGame(mode);
});

// ------------------------ utils ------------------------
function shuffle(a){
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

// เปิดการ์ดทั้งหมดชั่วคราว
function previewAll(duration = 2000){
  canClick = false;
  const cardDivs = Array.from(document.querySelectorAll('.card'));
  cardDivs.forEach((div, i) => {
    const card = cards[i];
    div.textContent = card.word;
    div.classList.add('flipped','preview');
  });
  setTimeout(() => {
    cardDivs.forEach(div => {
      if (!div.classList.contains('matched')){
        div.textContent = '';
        div.classList.remove('flipped','preview');
      }
    });
    canClick = true;
  }, duration);
}

// ------------------------ เริ่มเกม ------------------------
function startGame(mode = "easy"){
  currentMode = mode;
  const cfg = MODES[mode] || MODES.easy;
  const { lives: lv, pairs, previewMs } = cfg;

  score = 0;
  lives = lv;
  totalPairs = pairs;
  scoreEl.textContent = score;
  livesEl.textContent = "❤️ " + lives;

  // สุ่มเลือกคู่ตามโหมด
  const wp = wordPairs.slice();
  shuffle(wp);
  const selected = wp.slice(0, pairs);

  // สร้างการ์ด 2 ภาษา
  cards = [];
  selected.forEach(([eng, th]) => {
    cards.push({ word: eng, pair: th, matched: false });
    cards.push({ word: th, pair: eng, matched: false });
  });

  shuffle(cards);

  // วาดกระดาน
  boardEl.innerHTML = "";
  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.className = "card";
    div.dataset.index = index;
    div.addEventListener("click", () => flipCard(div, index));
    boardEl.appendChild(div);
  });

  // พรีวิวก่อนเริ่ม
  previewAll(previewMs);
}

// ------------------------ เล่นไพ่ ------------------------
function flipCard(div, index) {
  if (!canClick) return;
  const card = cards[index];
  if (card.matched || div.classList.contains("flipped") || flippedStack.length === 2) return;

  div.textContent = card.word;
  div.classList.add("flipped");
  flippedStack.push({ card, div });

  if (flippedStack.length === 2) {
    setTimeout(checkMatch, 800);
  }
}

function checkMatch() {
  const [first, second] = flippedStack;
  if (first.card.pair === second.card.word) {
    first.card.matched = true;
    second.card.matched = true;
    first.div.classList.add("matched");
    second.div.classList.add("matched");
    score++;
    scoreEl.textContent = score;

    // ชนะเมื่อจับครบทุกคู่
    if (score >= totalPairs) {
      canClick = false;
      setTimeout(() => endGame(true), 300);
      flippedStack = [];
      return;
    }
  } else {
    first.div.textContent = "";
    second.div.textContent = "";
    first.div.classList.remove("flipped");
    second.div.classList.remove("flipped");
    lives--;
    livesEl.textContent = "❤️ " + lives;
    if (lives <= 0) { endGame(false); flippedStack = []; return; }
  }
  flippedStack = [];
}

// ------------------------ จบเกม + เมนู ------------------------
function showOverlay({ win, score }){
  // อัปเดต High Score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", String(highScore));
    highEl.textContent = highScore;
  }

  overlayTitleEl.textContent = win ? "🎉 ชนะแล้ว!" : "จบเกม";
  overlayMsgEl.textContent = `คุณได้คะแนน ${score} | โหมด: ${currentMode}`;
  overlayActionsEl.innerHTML = "";

  // ปุ่ม “หน้าหลัก” (ตามที่กำหนด = game.html)
  const btnHome = document.createElement("button");
  btnHome.className = "btn-ghost";
  btnHome.textContent = "หน้าหลัก";
  btnHome.onclick = () => { window.location.href = "game.html"; };
  overlayActionsEl.appendChild(btnHome);

  if (win){
    const next = getNextMode(currentMode);
    if (next){
      const btnNext = document.createElement("button");
      btnNext.className = "btn-primary";
      btnNext.textContent = "ไปต่อ";
      btnNext.onclick = () => {
        overlayEl.style.display = "none";
        startGame(next);
      };
      overlayActionsEl.appendChild(btnNext);
    }else{
      const btnRetry = document.createElement("button");
      btnRetry.className = "btn-primary";
      btnRetry.textContent = "เล่นใหม่ (ระดับเดิม)";
      btnRetry.onclick = () => {
        overlayEl.style.display = "none";
        startGame(currentMode);
      };
      overlayActionsEl.appendChild(btnRetry);
    }
  }else{
    const btnRestart = document.createElement("button");
    btnRestart.className = "btn-primary";
    btnRestart.textContent = "เริ่มใหม่";
    btnRestart.onclick = () => {
      overlayEl.style.display = "none";
      startGame(currentMode);
    };
    overlayActionsEl.appendChild(btnRestart);
  }

  overlayEl.style.display = "flex";
  canClick = false;
}

function endGame(win = false) {
  showOverlay({ win, score });
}
