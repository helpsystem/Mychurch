/**
 * Telegram MTProto User Client Service
 * Sends messages from the church's personal Telegram account.
 * Unlike bots, user accounts can message anyone by phone number
 * without needing them to /start the bot first.
 */

let _client: any = null;

async function getUserClient() {
    if (_client && _client.connected) return _client;

    const session = process.env.TELEGRAM_USER_SESSION;
    if (!session) {
        throw new Error('TELEGRAM_USER_SESSION not set in environment');
    }

    const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
    const apiHash = process.env.TELEGRAM_API_HASH || '';

    if (!apiId || !apiHash) {
        throw new Error('TELEGRAM_API_ID or TELEGRAM_API_HASH not set');
    }

    // Dynamic import to avoid issues with SSR
    const { TelegramClient } = await import('telegram');
    const { StringSession } = await import('telegram/sessions');

    const stringSession = new StringSession(session);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 3,
        retryDelay: 1000,
    });

    await client.connect();
    _client = client;
    return client;
}

/**
 * Send a message from the church Telegram account to a user by their phone number.
 * Phone should include country code, e.g. "+12029677030"
 */
export async function sendTelegramUserMessage(phone: string, text: string): Promise<boolean> {
    try {
        const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

        const client = await getUserClient();

        // Import user by phone number (contacts method)
        const { Api } = await import('telegram');

        // Try to resolve the phone to a user entity
        const result = await client.invoke(
            new Api.contacts.ImportContacts({
                contacts: [
                    new Api.InputPhoneContact({
                        clientId: BigInt(Date.now()),
                        phone: normalizedPhone,
                        firstName: 'Church Member',
                        lastName: '',
                    }),
                ],
            })
        );

        const users = (result as any).users;
        if (!users || users.length === 0) {
            console.warn(`[MTProto] ⚠️ User with phone ${normalizedPhone} not found on Telegram`);
            return false;
        }

        const targetUser = users[0];
        await client.sendMessage(targetUser, { message: text });

        console.log(`[MTProto] ✅ Message sent to ${normalizedPhone} via church account`);
        return true;
    } catch (err: any) {
        console.error(`[MTProto] ❌ Failed to send message: ${err.message}`);
        return false;
    }
}

/**
 * Send a message from the church Telegram account to a user by their Chat ID.
 * Works even without /start if using user account.
 */
export async function sendTelegramUserMessageById(chatId: string, text: string): Promise<boolean> {
    try {
        const client = await getUserClient();
        await client.sendMessage(chatId, { message: text });
        console.log(`[MTProto] ✅ Message sent to chat ID ${chatId} via church account`);
        return true;
    } catch (err: any) {
        console.error(`[MTProto] ❌ Failed to send to chat ID ${chatId}: ${err.message}`);
        return false;
    }
}
