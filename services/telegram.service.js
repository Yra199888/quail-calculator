// services/telegram.service.js
export function sendTelegram(text) {
  const TOKEN = "8587753988:AAED18mOkUVo3TniDRnU0pCLNT-5UzR7cdQ";
  const CHAT_ID = "6182525216";

  fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML"
    })
  }).catch(() => {});
}
