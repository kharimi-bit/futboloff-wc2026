// Futboloff · Bot Webhook
// Принимает сообщения от участников → регистрирует их по имени
// Деплой: supabase functions deploy bot-webhook --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!; // https://futboloff-wc2026.vercel.app

async function sendMessage(chatId: number, text: string, extra: object = {}) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const msg = body.message || body.callback_query?.message;
    if (!msg) return new Response("ok");

    const chatId: number = msg.chat.id;
    const telegramId: number = (body.callback_query?.from || msg.from).id;
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Обработка нажатия кнопки с именем
    if (body.callback_query) {
      const data = body.callback_query.data;

      if (data.startsWith("register:")) {
        const userId = parseInt(data.split(":")[1]);

        // Проверяем не занят ли аккаунт
        const { data: existing } = await sb
          .from("users")
          .select("name, telegram_id")
          .eq("id", userId)
          .single();

        if (existing?.telegram_id && existing.telegram_id !== telegramId) {
          await sendMessage(chatId, `❌ <b>${existing.name}</b> уже зарегистрирован другим пользователем.`);
          return new Response("ok");
        }

        // Сохраняем telegram_id
        await sb.from("users").update({ telegram_id: telegramId }).eq("id", userId);

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: body.callback_query.id }),
        });

        await sendMessage(chatId,
          `✅ Отлично, <b>${existing?.name}</b>! Ты в игре.\n\nТеперь открывай приложение и ставь прогнозы:`,
          {
            reply_markup: {
              inline_keyboard: [[{
                text: "⚽ Открыть Футболофф ЧМ 2026",
                web_app: { url: APP_URL }
              }]]
            }
          }
        );
      }
      return new Response("ok");
    }

    const text = msg.text || "";

    // /start — показываем список участников
    if (text.startsWith("/start")) {
      const { data: users } = await sb
        .from("users")
        .select("id, name, telegram_id, role")
        .neq("id", 98)
        .in("role", ["participant", "owner", "admin"])
        .order("id");

      // Проверяем зарегистрирован ли уже
      const alreadyRegistered = users?.find(u => u.telegram_id === telegramId);
      if (alreadyRegistered) {
        await sendMessage(chatId,
          `👋 Привет, <b>${alreadyRegistered.name}</b>! Ты уже в игре.\n\nОткрывай приложение:`,
          {
            reply_markup: {
              inline_keyboard: [[{
                text: "⚽ Открыть Футболофф ЧМ 2026",
                web_app: { url: APP_URL }
              }]]
            }
          }
        );
        return new Response("ok");
      }

      // Кнопки с именами участников
      const buttons = (users || [])
        .filter(u => !u.telegram_id)
        .map(u => [{ text: u.name, callback_data: `register:${u.id}` }]);

      await sendMessage(chatId,
        "👋 Привет! Это игра прогнозов <b>Футболофф · ЧМ 2026</b>.\n\nВыбери своё имя из списка:",
        { reply_markup: { inline_keyboard: buttons } }
      );
    }

    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});
