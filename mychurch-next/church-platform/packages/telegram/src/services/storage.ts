import { InputFile } from "grammy";
import { bot } from "../bot";
import { telegramConfig } from "../config";

export interface TelegramUploadResult {
  fileId: string;
  fileUniqueId: string;
  messageId: number;
  fileSize?: number;
}

/**
 * Upload a file to the private storage channel (Telegram CDN)
 * @param fileBuffer Buffer or path of the file
 * @param fileName File name with extension (e.g. sermon-101.mp3)
 * @param caption Internal description
 */
export async function uploadToTelegramStorage(
  fileBuffer: Buffer | Uint8Array | string,
  fileName: string,
  caption?: string
): Promise<TelegramUploadResult> {
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

/**
 * Get direct stream URL (valid for 1 hour)
 * @param fileId Unique file ID stored in DB
 */
export async function getTelegramFileStreamUrl(fileId: string): Promise<string> {
  try {
    const file = await bot.api.getFile(fileId);
    return `https://api.telegram.org/file/bot${telegramConfig.BOT_TOKEN}/${file.file_path}`;
  } catch (error) {
    console.error("❌ [Telegram Storage] Failed to generate stream URL:", error);
    throw error;
  }
}

/**
 * Delete file from storage
 */
export async function deleteFromTelegramStorage(messageId: number): Promise<boolean> {
  try {
    await bot.api.deleteMessage(telegramConfig.STORAGE_CHANNEL_ID, messageId);
    return true;
  } catch (error) {
    console.error("❌ [Telegram Storage] Failed to delete file:", error);
    return false;
  }
}
