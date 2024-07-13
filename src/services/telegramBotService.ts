import TelegramBot from "node-telegram-bot-api";
import { createClient } from "@supabase/supabase-js";

const serviceKey: string = process.env.SERVICE_KEY!;
const supabaseUrl: string = process.env.SUPABASE_URL!;
const token = process.env.ZARADROPSBOT_TOKEN!;
const telegramTokenTable: string = "Telegram_token";
const userTable: string = "User";
const supabase = createClient(supabaseUrl, serviceKey);

export const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  const uniqueToken = generateUniqueToken();

  const { data, error } = await supabase
    .from(telegramTokenTable)
    .insert([{ telegram_user_id: userId, token: uniqueToken }]);

  if (error) {
    if (error.code === "23505") {
      bot.sendMessage(
        chatId,
        "Ya se ha enviado un código, por favor dirijase a nuestra pagina web para completar la configuracion de su cuenta."
      );
      return;
    }
    bot.sendMessage(
      chatId,
      "Ocurrio un error, por favor intente nuevamente mas tarde."
    );
    console.error(error);
    return;
  }

  bot.sendMessage(
    chatId,
    `Por favor, ingrese el siguiente código en nuestro sitio web para vincular su cuenta de Telegram.: ${uniqueToken}`
  );
});

function generateUniqueToken() {
  return Math.random().toString(36).substr(2, 9);
}

export const sendTelegramAlert = async (userId: string, message: string) => {
  const { data, error } = await supabase
    .from(userTable)
    .select("telegram_id")
    .eq("uuid", userId)
    .single();

  if (error || !data.telegram_id) {
    console.error("Failed to retrieve Telegram ID");
    return;
  }

  const telegramId = data.telegram_id;
  bot.sendMessage(telegramId, message);
};
