import { Bot, InputFile } from "grammy";
import { z } from "zod";

const telegramConfigSchema = z.object({
  BOT_TOKEN: z.string().min(1, "Telegram Bot Token is required"),
  STORAGE_CHANNEL_ID: z.string().regex(/^-100\d+$/, "Storage Channel ID must start with -100"),
  PUBLIC_CHANNEL_ID: z.string().optional(),
  PUBLIC_GROUP_ID: z.string().optional(),
});

let _bot: Bot | null = null;
let _telegramConfig: any = null;

function getBot() {
  if (_bot) return { bot: _bot, telegramConfig: _telegramConfig };

  const processEnv = {
    BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    STORAGE_CHANNEL_ID: process.env.TELEGRAM_STORAGE_CHANNEL_ID,
    PUBLIC_CHANNEL_ID: process.env.TELEGRAM_PUBLIC_CHANNEL_ID,
    PUBLIC_GROUP_ID: process.env.TELEGRAM_PUBLIC_GROUP_ID,
  };

  const parsed = telegramConfigSchema.safeParse(processEnv);
  if (!parsed.success) {
    throw new Error(`Telegram config missing or invalid: ${parsed.error.message}`);
  }
  
  _telegramConfig = parsed.data;
  _bot = new Bot(_telegramConfig.BOT_TOKEN);
  return { bot: _bot, telegramConfig: _telegramConfig };
}

export interface TelegramUploadResult {
  fileId: string;
  fileUniqueId: string;
  messageId: number;
  fileSize?: number;
}

export async function uploadToTelegramStorage(
  fileBuffer: Buffer | Uint8Array | string,
  fileName: string,
  caption?: string
): Promise<TelegramUploadResult> {
  const { bot, telegramConfig } = getBot();
  const inputFile = new InputFile(fileBuffer, fileName);
  const channelId = telegramConfig.STORAGE_CHANNEL_ID;

  try {
    const message = await bot.api.sendDocument(channelId, inputFile, {
      caption: caption || `📁 Archive File: ${fileName}`,
    });

    const doc = message.document;
    if (!doc) {
      throw new Error("Telegram did not return document information.");
    }

    return {
      fileId: doc.file_id,
      fileUniqueId: doc.file_unique_id,
      messageId: message.message_id,
      fileSize: doc.file_size,
    };
  } catch (error) {
    console.error("❌ [Telegram Storage] Upload failed:", error);
    throw error;
  }
}

export async function getTelegramFileStreamUrl(fileId: string): Promise<string> {
  try {
    const { bot, telegramConfig } = getBot();
    const file = await bot.api.getFile(fileId);
    return `https://api.telegram.org/file/bot${telegramConfig.BOT_TOKEN}/${file.file_path}`;
  } catch (error) {
    console.error("❌ [Telegram Storage] Failed to generate stream URL:", error);
    throw error;
  }
}

export async function deleteFromTelegramStorage(messageId: number): Promise<boolean> {
  try {
    const { bot, telegramConfig } = getBot();
    await bot.api.deleteMessage(telegramConfig.STORAGE_CHANNEL_ID, messageId);
    return true;
  } catch (error) {
    console.error("❌ [Telegram Storage] Failed to delete file:", error);
    return false;
  }
}
