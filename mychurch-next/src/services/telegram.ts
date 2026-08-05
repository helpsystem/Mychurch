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
let _mtprotoClient: any = null;

export function getBot() {
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

let _mtprotoPromise: Promise<any> | null = null;

export async function getMTProtoClient() {
  if (_mtprotoClient && _mtprotoClient.connected) return _mtprotoClient;
  if (_mtprotoPromise) return _mtprotoPromise;

  _mtprotoPromise = (async () => {
      const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
      const apiHash = process.env.TELEGRAM_API_HASH || '';
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!apiId || !apiHash || !botToken) {
          throw new Error('TELEGRAM_API_ID, TELEGRAM_API_HASH or TELEGRAM_BOT_TOKEN missing');
      }

      const { TelegramClient } = await import('telegram');
      const { StringSession } = await import('telegram/sessions');

      // Empty string session for bot auth
      const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
          connectionRetries: 3,
          retryDelay: 1000,
      });

      await client.start({
          botAuthToken: botToken,
      });

      _mtprotoClient = client;
      return client;
  })();

  try {
      await _mtprotoPromise;
  } catch (error) {
      _mtprotoPromise = null;
      throw error;
  }
  
  return _mtprotoClient;
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
  const { telegramConfig } = getBot();
  const client = await getMTProtoClient();
  const channelId = BigInt(telegramConfig.STORAGE_CHANNEL_ID);

  try {
    let fileToSend: any = fileBuffer;
    let bufferLength = 0;
    
    // Determine size and convert to buffer if needed
    if (Buffer.isBuffer(fileBuffer)) {
        bufferLength = fileBuffer.length;
    } else if (fileBuffer instanceof Uint8Array) {
        bufferLength = fileBuffer.byteLength;
        fileToSend = Buffer.from(fileBuffer);
    } else if (typeof fileBuffer === 'string') {
        bufferLength = 50 * 1024 * 1024; // Treat path strings as large to force MTProto just in case
        fileToSend = fileBuffer;
    }

    // --- Fast Path: Bot API for files < 50MB ---
    if (bufferLength > 0 && bufferLength < 49 * 1024 * 1024) {
      const { bot } = getBot();
      const inputFile = new InputFile(fileToSend, fileName);
      const msg = await bot.api.sendDocument(telegramConfig.STORAGE_CHANNEL_ID, inputFile, {
          caption: caption || `📁 Archive File: ${fileName}`,
      });

      if (!msg || !msg.document) {
          throw new Error("Telegram Bot API did not return document information.");
      }

      return {
          fileId: msg.document.file_id, // REAL Bot API file_id!
          fileUniqueId: msg.document.file_unique_id,
          messageId: msg.message_id,
          fileSize: msg.document.file_size,
      };
    }

    // --- Fallback: MTProto for large files (>= 50MB) ---
    const channelId = BigInt(telegramConfig.STORAGE_CHANNEL_ID);
    
    // gramjs needs CustomFile for buffers to know the name
    if (Buffer.isBuffer(fileToSend) || fileToSend instanceof Uint8Array) {
        const { CustomFile } = await import('telegram/client/uploads');
        fileToSend = new CustomFile(fileName, bufferLength, "", Buffer.from(fileToSend));
    }

    const message = await client.sendFile(channelId, {
      file: fileToSend,
      caption: caption || `📁 Large Archive File: ${fileName}`,
      workers: 4, // Parallel upload
      forceDocument: true, // IMPORTANT: Prevents images from being converted to photos
    });

    if (!message || !message.media || !message.media.document) {
      throw new Error("Telegram MTProto did not return document information.");
    }

    const doc = message.media.document;
    
    return {
      fileId: doc.id.toString(), // Store MTProto doc ID 
      fileUniqueId: doc.id.toString(),
      messageId: message.id,
      fileSize: Number(doc.size),
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

/**
 * Returns an AsyncIterable of buffers for streaming directly to HTTP response.
 * Bypasses 20MB bot download limit by using MTProto.
 */
export async function getTelegramFileStream(messageId: number): Promise<AsyncIterable<Buffer>> {
    const client = await getMTProtoClient();
    const { telegramConfig } = getBot();
    
    // Convert -100 string to BigInt
    const channelId = BigInt(telegramConfig.STORAGE_CHANNEL_ID);
    
    // Fetch the message containing the document
    const messages = await client.getMessages(channelId, { ids: [messageId] });
    if (!messages || messages.length === 0 || !messages[0].media) {
        throw new Error("Message or media not found in Telegram");
    }
    
    const media = messages[0].media;
    
    // iterDownload returns an AsyncIterable
    const iterable = client.iterDownload({
        file: media,
        requestSize: 1024 * 1024, // 1MB chunks
    });
    
    return iterable as AsyncIterable<Buffer>;
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

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  try {
    const { bot } = getBot();
    await bot.api.sendMessage(chatId, text);
    return true;
  } catch (error) {
    console.error("❌ [Telegram Bot] Failed to send message:", error);
    return false;
  }
}
