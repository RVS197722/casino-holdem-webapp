const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// sid — “идентификатор устройства” (хранится в браузере Telegram на этом устройстве)
function getSid() {
  let sid = localStorage.getItem("sid");
  if (!sid) {
    sid = (crypto.randomUUID && crypto.randomUUID()) || (String(Date.now()) + Math.random());
    localStorage.setItem("sid", sid);
  }
  return sid;
}

document.getElementById("send").addEventListener("click", () => {
  const payload = {
    t: "cards",
    sid: getSid(),
    ts: Date.now(),
    demo: true
  };

  // sendData отправляет строку и закрывает Mini App (лимит ~4096 байт) :contentReference[oaicite:3]{index=3}
  tg.sendData(JSON.stringify(payload));
  tg.close();
});
