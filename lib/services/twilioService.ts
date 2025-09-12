// Twilio integration service for SMS and WhatsApp messaging
// Reference: twilio_send_message blueprint integration

import twilio from 'twilio';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface SendMessageOptions {
  to: string;
  message: string;
  type?: 'sms' | 'whatsapp';
  mediaUrl?: string;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

class TwilioService {
  private client: twilio.Twilio | null = null;
  private config: TwilioConfig | null = null;

  constructor() {
    this.initializeFromEnv();
  }

  private initializeFromEnv() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && phoneNumber) {
      this.config = {
        accountSid,
        authToken,
        phoneNumber
      };
      this.client = twilio(accountSid, authToken);
    }
  }

  public configure(config: TwilioConfig) {
    this.config = config;
    this.client = twilio(config.accountSid, config.authToken);
  }

  public isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  public async sendSMS(to: string, message: string, mediaUrl?: string): Promise<SendMessageResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio not configured. Please set environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER'
      };
    }

    try {
      const messageOptions: any = {
        body: message,
        from: this.config!.phoneNumber,
        to: to
      };

      if (mediaUrl) {
        messageOptions.mediaUrl = [mediaUrl];
      }

      const twilioMessage = await this.client!.messages.create(messageOptions);

      return {
        success: true,
        messageId: twilioMessage.sid,
        status: twilioMessage.status
      };
    } catch (error) {
      console.error('Twilio SMS Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public async sendWhatsApp(to: string, message: string, mediaUrl?: string): Promise<SendMessageResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio not configured. Please set environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER'
      };
    }

    try {
      // WhatsApp numbers must be in format: whatsapp:+1234567890
      const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const whatsappFrom = this.config!.phoneNumber.startsWith('whatsapp:') 
        ? this.config!.phoneNumber 
        : `whatsapp:${this.config!.phoneNumber}`;

      const messageOptions: any = {
        body: message,
        from: whatsappFrom,
        to: whatsappTo
      };

      if (mediaUrl) {
        messageOptions.mediaUrl = [mediaUrl];
      }

      const twilioMessage = await this.client!.messages.create(messageOptions);

      return {
        success: true,
        messageId: twilioMessage.sid,
        status: twilioMessage.status
      };
    } catch (error) {
      console.error('Twilio WhatsApp Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const { to, message, type = 'sms', mediaUrl } = options;

    if (type === 'whatsapp') {
      return this.sendWhatsApp(to, message, mediaUrl);
    } else {
      return this.sendSMS(to, message, mediaUrl);
    }
  }

  // Validate phone number format
  public validatePhoneNumber(phoneNumber: string, type: 'sms' | 'whatsapp' = 'sms'): boolean {
    if (type === 'whatsapp') {
      // WhatsApp format: whatsapp:+1234567890 or +1234567890
      const whatsappRegex = /^(whatsapp:)?\+[1-9]\d{1,14}$/;
      const cleanNumber = phoneNumber.replace('whatsapp:', '');
      return whatsappRegex.test(cleanNumber) || whatsappRegex.test(`+${cleanNumber}`);
    } else {
      // SMS format: +1234567890
      const smsRegex = /^\+[1-9]\d{1,14}$/;
      return smsRegex.test(phoneNumber);
    }
  }

  // Format phone number for display
  public formatPhoneNumber(phoneNumber: string, type: 'sms' | 'whatsapp' = 'sms'): string {
    if (type === 'whatsapp' && !phoneNumber.startsWith('whatsapp:')) {
      return `whatsapp:${phoneNumber}`;
    }
    return phoneNumber;
  }

  // Get delivery status
  public async getMessageStatus(messageId: string): Promise<{ status: string; error?: string }> {
    if (!this.isConfigured()) {
      return { status: 'error', error: 'Twilio not configured' };
    }

    try {
      const message = await this.client!.messages(messageId).fetch();
      return { status: message.status };
    } catch (error) {
      console.error('Error fetching message status:', error);
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Create singleton instance
export const twilioService = new TwilioService();

// Export types and service
export type { SendMessageOptions, SendMessageResult, TwilioConfig };
export { TwilioService };