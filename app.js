const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];
const SUITS = [
  {v:"s", t:"♠ (s)"},
  {v:"h", t:"♥ (h)"},
  {v:"d", t:"♦ (d)"},
  {v:"c", t:"♣ (c)"},
];

function getSid() {
  let sid = localStorage.getItem("sid");
  if (!sid) {
    sid = (crypto.randomUUID && crypto.randomUUID()) || (String(Date.now()) + Math.random());
    localStorage.setItem("sid", sid);
  }
  return sid;
}

function mkSelect(options, placeholder) {
  const s = document.createElement("select");
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

function mkCardPicker(container, count, prefix) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const rank = mkSelect(RANKS, `Ранг ${i+1}`);
    rank.id = `${prefix}_r_${i}`;
    const suit = mkSelect(SUITS, `Масть ${i+1}`);
    suit.id = `${prefix}_s_${i}`;
    container.appendChild(rank);
    container.appendChild(suit);
  }
}

function readCard(prefix, i) {
  const r = document.getElementById(`${prefix}_r_${i}`).value;
  const s = document.getElementById(`${prefix}_s_${i}`).value;
  if (!r && !s) return "";         // пусто
  if (!r || !s) return null;       // недозаполнено
  return `${r}${s}`;               // например As
}

function uniqCheck(cards) {
  const set = new Set();
  for (const c of cards) {
    if (!c) continue;
    if (set.has(c)) return false;
    set.add(c);
  }
  return true;
}

function needBoardCount(street) {
  if (street === "flop") return 3;
  if (street === "turn") return 4;
  return 5; // river
}

function validateAndBuildPayload() {
  const street = document.getElementById("street").value;
  const decision = document.getElementById("decision").value;

  const player = [];
  for (let i = 0; i < 2; i++) {
    const c = readCard("p", i);
    if (c === null) return { error: "Заполни обе части карты (ранг и масть) в 'Твои карты'." };
    if (!c) return { error: "Укажи обе твои карты." };
    player.push(c);
  }

  const board = [];
  for (let i = 0; i < 5; i++) {
    const c = readCard("b", i);
    if (c === null) return { error: "На общих картах где-то выбран только ранг или только масть — дополни." };
    if (c) board.push(c);
  }

  const must = needBoardCount(street);
  if (board.length !== must) {
    return { error: `Для ${street.toUpperCase()} нужно ровно ${must} общих карт. Сейчас: ${board.length}.` };
  }

  const all = [...player, ...board];
  if (!uniqCheck(all)) return { error: "Есть повторяющиеся карты. Одна и та же карта не может встречаться дважды." };

  return {
    payload: {
      t: "cards",
      sid: getSid(),
      ts: Date.now(),
      street,
      decision,
      player,
      board,
      // опционально для (3):
      initData: tg.initData
    }
  };
}

// Инициализация UI
mkCardPicker(document.getElementById("playerCards"), 2, "p");
mkCardPicker(document.getElementById("boardCards"), 5, "b");

document.getElementById("send").addEventListener("click", () => {
  const errEl = document.getElementById("err");
  errEl.textContent = "";

  const { payload, error } = validateAndBuildPayload();
  if (error) {
    errEl.textContent = error;
    return;
  }

  // sendData отправляет строку обратно боту как web_app_data :contentReference[oaicite:0]{index=0}
  tg.sendData(JSON.stringify(payload));
  tg.close();
});
