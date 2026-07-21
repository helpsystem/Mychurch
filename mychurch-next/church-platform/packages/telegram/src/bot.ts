import { Bot } from "grammy";
import { telegramConfig } from "./config";

// Create bot instance with the validated token
export const bot = new Bot(telegramConfig.BOT_TOKEN);

// Helper method for health check
export async function checkBotConnection(): Promise<boolean> {
  try {
    const me = await bot.api.getMe();
    console.log(`✅ [Telegram Bot] Connected successfully as @${me.username}`);
    return true;
  } catch (error) {
    console.error("❌ [Telegram Bot] Connection failed:", error);
    return false;
  }
}
