// app.js
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const app = document.getElementById("app");
const backBtn = document.getElementById("back");
const titleEl = document.getElementById("title");
const subEl = document.getElementById("subtitle");

const RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];
const SUITS = [
  {v:"s", t:"♠ (s)"},
  {v:"h", t:"♥ (h)"},
  {v:"d", t:"♦ (d)"},
  {v:"c", t:"♣ (c)"},
];

function getScreen() {
  const sp = new URLSearchParams(location.search);
  return sp.get("screen") || "start";
}

function go(screen) {
  const sp = new URLSearchParams(location.search);
  sp.set("screen", screen);
  history.replaceState(null, "", `${location.pathname}?${sp.toString()}`);
  render();
}

backBtn.addEventListener("click", () => go("start"));

function setHeader(title, subtitle, showBack) {
  titleEl.textContent = title;
  subEl.textContent = subtitle || "";
  backBtn.style.display = showBack ? "block" : "none";
}

function getSid() {
  let sid = localStorage.getItem("sid");
  if (!sid) {
    sid = (crypto.randomUUID && crypto.randomUUID()) || (String(Date.now()) + Math.random());
    localStorage.setItem("sid", sid);
  }
  return sid;
}

function sendToBot(payload) {
  payload.sid = getSid();
  payload.ts = Date.now();
  payload.initData = tg.initData; // важно для проверки подписи на стороне бота
  tg.sendData(JSON.stringify(payload));
  tg.close();
}

function mkSelect(options, placeholder, id) {
  const s = document.createElement("select");
  s.id = id;

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholder;
  s.appendChild(opt0);

  for (const o of options) {
    const opt = document.createElement("option");
    opt.value = o.v ?? o;
    opt.textContent = o.t ?? o;
    s.appendChild(opt);
  }
  return s;
}

function mkCardGrid(prefix, count) {
  const grid = document.createElement("div");
  grid.className = "grid";
  for (let i = 0; i < count; i++) {
    grid.appendChild(mkSelect(RANKS, `Ранг ${i+1}`, `${prefix}_r_${i}`));
    grid.appendChild(mkSelect(SUITS, `Масть ${i+1}`, `${prefix}_s_${i}`));
  }
  return grid;
}

function readCard(prefix, i) {
  const r = document.getElementById(`${prefix}_r_${i}`).value;
  const s = document.getElementById(`${prefix}_s_${i}`).value;
  if (!r && !s) return "";     // пусто
  if (!r || !s) return null;   // недозаполнено
  return `${r}${s}`;           // например As
}

function needBoardCount(street) {
  if (street === "flop") return 3;
  if (street === "turn") return 4;
  return 5;
}

/* -------------------- Screens -------------------- */

function renderStart() {
  setHeader("▶️ Старт", "Главный экран Mini App", false);
  app.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div style="font-weight:700; margin-bottom:6px;">Что сделать?</div>
    <div class="muted">Подсказки бот выдаёт только после отправки данных из Mini App.</div>
  `;

  const b1 = document.createElement("button");
  b1.className = "btn";
  b1.textContent = "🃏 Ввод карт";
  b1.onclick = () => go("input");

  const b2 = document.createElement("button");
  b2.className = "btn";
  b2.textContent = "📊 Показать статистику (в чат)";
  b2.onclick = () => sendToBot({ t: "stats" });

  const b3 = document.createElement("button");
  b3.className = "btn";
  b3.textContent = "⚙️ Сбросить сессию (в чат)";
  b3.onclick = () => sendToBot({ t: "reset" });

  const b4 = document.createElement("button");
  b4.className = "btn";
  b4.textContent = "❓ Помощь";
  b4.onclick = () => go("help");

  const b5 = document.createElement("button");
  b5.className = "btn";
  b5.textContent = "📌 О боте";
  b5.onclick = () => go("about");

  app.appendChild(card);
  app.appendChild(b1);
  app.appendChild(b2);
  app.appendChild(b3);
  app.appendChild(b4);
  app.appendChild(b5);
}

function renderStats() {
  setHeader("📊 Статистика", "Нажми кнопку, чтобы бот прислал статус в чат", true);
  app.innerHTML = "";

  const b = document.createElement("button");
  b.className = "btn";
  b.textContent = "Отправить запрос статистики в чат";
  b.onclick = () => sendToBot({ t: "stats" });

  const note = document.createElement("div");
  note.className = "muted";
  note.textContent = "Если сессия активна на другом устройстве — бот ответит отказом.";

  app.appendChild(b);
  app.appendChild(note);
}

function renderSettings() {
  setHeader("⚙️ Настройки", "Пока доступен только сброс сессии", true);
  app.innerHTML = "";

  const b = document.createElement("button");
  b.className = "btn";
  b.textContent = "Сбросить сессию (в чат)";
  b.onclick = () => sendToBot({ t: "reset" });

  const note = document.createElement("div");
  note.className = "muted";
  note.textContent = "Сброс разрешён только активному устройству (чтобы второе не могло перехватить управление).";

  app.appendChild(b);
  app.appendChild(note);
}

function renderHelp() {
  setHeader("❓ Помощь", "Как пользоваться", true);
  app.innerHTML = `
    <div class="card">
      <div style="margin:8px 0;">1) Открой “🃏 Ввод карт”</div>
      <div style="margin:8px 0;">2) Выбери улицу (флоп/тёрн/ривер)</div>
      <div style="margin:8px 0;">3) Укажи свои карты и общие карты</div>
      <div style="margin:8px 0;">4) Нажми “Отправить” — бот пришлёт подсказку</div>
      <div class="muted" style="margin-top:12px;">
        Если пишет “сессия активна на другом устройстве” — закрой другое устройство или подожди.
        Сброс — в “⚙️ Настройки”.
      </div>
    </div>
  `;
}

function renderAbout() {
  setHeader("📌 О боте", "Информация", true);
  app.innerHTML = `
    <div class="card">
      <div style="margin:8px 0;">• Ввод карт — только через Mini App</div>
      <div style="margin:8px 0;">• Блокировка второго устройства — по SID</div>
      <div style="margin:8px 0;">• Проверка initData защищает от подделки запросов</div>
    </div>
  `;
}

function renderInput() {
  setHeader("🃏 Ввод карт", "Заполни и нажми “Отправить”", true);
  app.innerHTML = "";

  const streetSel = document.createElement("select");
  streetSel.id = "street";
  streetSel.innerHTML = `
    <option value="flop">Флоп (3 общие карты)</option>
    <option value="turn">Тёрн (4 общие карты)</option>
    <option value="river">Ривер (5 общих карт)</option>
  `;

  const decisionSel = document.createElement("select");
  decisionSel.id = "decision";
  decisionSel.innerHTML = `
    <option value="call">Колл</option>
    <option value="fold">Фолд</option>
  `;

  const playerLabel = document.createElement("div");
  playerLabel.style.margin = "10px 0 6px";
  playerLabel.innerHTML = "<b>Твои карты (2)</b>";

  const boardLabel = document.createElement("div");
  boardLabel.style.margin = "10px 0 6px";
  boardLabel.innerHTML = "<b>Общие карты (до 5)</b><div class='muted'>На флопе нужно 3, на тёрне 4, на ривере 5.</div>";

  const playerGrid = mkCardGrid("p", 2);
  const boardGrid = mkCardGrid("b", 5);

  const err = document.createElement("div");
  err.className = "error";
  err.id = "err";

  const sendBtn = document.createElement("button");
  sendBtn.className = "btn";
  sendBtn.textContent = "Отправить";

  function validateAndSend() {
    err.textContent = "";

    const street = streetSel.value;
    const decision = decisionSel.value;

    // игрок
    const player = [];
    for (let i = 0; i < 2; i++) {
      const c = readCard("p", i);
      if (c === null) { err.textContent = "Заполни ранг и масть для обеих карт игрока."; return; }
      if (!c) { err.textContent = "Укажи обе карты игрока."; return; }
      player.push(c);
    }

    // стол
    const board = [];
    for (let i = 0; i < 5; i++) {
      const c = readCard("b", i);
      if (c === null) { err.textContent = "На общих картах где-то выбран только ранг или только масть."; return; }
      if (c) board.push(c);
    }

    const need = needBoardCount(street);
    if (board.length !== need) {
      err.textContent = `Для ${street.toUpperCase()} нужно ровно ${need} общих карт. Сейчас: ${board.length}.`;
      return;
    }

    const all = [...player, ...board];
    if (new Set(all).size !== all.length) {
      err.textContent = "Есть повторяющиеся карты.";
      return;
    }

    sendToBot({
      t: "cards",
      street,
      decision,
      player,
      board,
    });
  }

  sendBtn.onclick = validateAndSend;

  // UI
  const l1 = document.createElement("div");
  l1.style.margin = "8px 0 6px";
  l1.textContent = "Улица (этап)";
  const l2 = document.createElement("div");
  l2.style.margin = "8px 0 6px";
  l2.textContent = "Решение";

  app.appendChild(l1);
  app.appendChild(streetSel);

  app.appendChild(l2);
  app.appendChild(decisionSel);

  app.appendChild(playerLabel);
  app.appendChild(playerGrid);

  app.appendChild(boardLabel);
  app.appendChild(boardGrid);

  app.appendChild(err);
  app.appendChild(sendBtn);
}

/* -------------------- Router -------------------- */

function render() {
  const screen = getScreen();

  if (screen === "start") return renderStart();
  if (screen === "input") return renderInput();
  if (screen === "stats") return renderStats();
  if (screen === "settings") return renderSettings();
  if (screen === "help") return renderHelp();
  if (screen === "about") return renderAbout();

  // если неизвестно — на старт
  return renderStart();
}

render();
