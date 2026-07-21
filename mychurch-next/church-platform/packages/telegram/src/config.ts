import { z } from "zod";

const telegramConfigSchema = z.object({
  BOT_TOKEN: z.string().min(1, "Telegram Bot Token is required"),
  STORAGE_CHANNEL_ID: z.string().regex(/^-100\d+$/, "Storage Channel ID must start with -100"),
  PUBLIC_CHANNEL_ID: z.string().optional(),
  PUBLIC_GROUP_ID: z.string().optional(),
});

// Read from process.env
const processEnv = {
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  STORAGE_CHANNEL_ID: process.env.TELEGRAM_STORAGE_CHANNEL_ID,
  PUBLIC_CHANNEL_ID: process.env.TELEGRAM_PUBLIC_CHANNEL_ID,
  PUBLIC_GROUP_ID: process.env.TELEGRAM_PUBLIC_GROUP_ID,
};

export const telegramConfig = telegramConfigSchema.parse(processEnv);
