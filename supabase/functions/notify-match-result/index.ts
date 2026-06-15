// Futboloff · Уведомления о результатах матчей
// Триггер: Database Webhook на таблице matches (UPDATE)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!;

function calcPts(pred: string | null, hs: number, as_: number): number | null {
  if (!pred) return null;
  const [ph, pa] = pred.split(":").map(Number);
  if (isNaN(ph) || isNaN(pa)) return null;
  if (ph === hs && pa === as_) return 5;
  const winner = (h: number, a: number) => h > a ? 1 : h < a ? -1 : 0;
  if (winner(ph, pa) !== winner(hs, as_)) return 0;
  if ((ph - pa) === (hs - as_)) return 3;
  return 1;
}

async function sendTelegram(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{
          text: "⚽ Открыть Футболофф",
          web_app: { url: APP_URL }
        }]]
      }
    }),
  });
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const newRecord = payload.record;
    const oldRecord = payload.old_record;

    if (
      newRecord.home_score === null ||
      newRecord.away_score === null ||
      (newRecord.home_score === oldRecord?.home_score &&
        newRecord.away_score === oldRecord?.away_score)
    ) {
      return new Response("no score change", { status: 200 });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const [usersRes, matchesRes, predsRes] = await Promise.all([
      sb.from("users").select("id, name, role, telegram_id")
        .in("role", ["participant", "owner", "admin"])
        .neq("id", 98)
        .not("telegram_id", "is", null),
      sb.from("matches").select("*"),
      sb.from("predictions").select("*"),
    ]);

    const users = usersRes.data || [];
    const matches = matchesRes.data || [];
    const preds = predsRes.data || [];

    if (!users.length) return new Response("no users", { status: 200 });

    // Рейтинг
    const ranked = users
      .map((u) => {
        let pts = 0, exact = 0;
        for (const m of matches) {
          if (m.home_score === null || m.away_score === null) continue;
          const p = preds.find((x) => x.user_id === u.id && x.match_id === m.id);
          const p_ = calcPts(p?.prediction ?? null, m.home_score, m.away_score);
          if (p_ !== null) { pts += p_; if (p_ === 5) exact++; }
        }
        return { ...u, pts, exact };
      })
      .sort((a, b) => b.pts - a.pts || b.exact - a.exact);

    await Promise.all(users.map(async (u) => {
      if (!u.telegram_id) return;

      const userPred = preds.find(
        (p) => p.user_id === u.id && p.match_id === newRecord.id
      );
      const pts = calcPts(userPred?.prediction ?? null, newRecord.home_score, newRecord.away_score);
      const rank = ranked.findIndex((x) => x.id === u.id) + 1;
      const totalPts = ranked.find((x) => x.id === u.id)?.pts ?? 0;

      let ptsLine = "";
      if (pts === null) {
        ptsLine = "❌ Прогноз не был поставлен — <b>0 очков</b>";
      } else if (pts === 5) {
        ptsLine = `🎯 Прогноз: <b>${userPred!.prediction}</b> — ТОЧНЫЙ СЧЁТ! <b>+5 очков</b> 🏆`;
      } else if (pts === 3) {
        ptsLine = `✅ Прогноз: <b>${userPred!.prediction}</b> — разница угадана! <b>+3 очка</b>`;
      } else if (pts === 1) {
        ptsLine = `👍 Прогноз: <b>${userPred!.prediction}</b> — победитель угадан! <b>+1 очко</b>`;
      } else {
        ptsLine = `❌ Прогноз: <b>${userPred!.prediction}</b> — не угадал, <b>+0 очков</b>`;
      }

      const text =
        `🏁 Матч завершён!\n` +
        `⚽ <b>${newRecord.home_team} ${newRecord.home_score}:${newRecord.away_score} ${newRecord.away_team}</b>\n\n` +
        `${ptsLine}\n\n` +
        `📊 Твоё место: <b>#${rank}</b> · Всего очков: <b>${totalPts}</b>`;

      await sendTelegram(u.telegram_id, text);
    }));

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});
