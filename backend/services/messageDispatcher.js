// Multi-Channel Message Dispatcher for Church Announcements
// Handles email, SMS, WhatsApp, and push notifications

const { pool } = require('../db');

class MessageDispatcher {
  constructor() {
    // Message channel providers
    this.providers = {
      email: new EmailProvider(),
      sms: new SMSProvider(),
      whatsapp: new WhatsAppProvider(),
      push: new PushNotificationProvider(),
      website: new WebsiteProvider()
    };
  }

  /**
   * Dispatch announcement to selected channels
   * @param {Object} announcement - The announcement object
   * @param {Array} channels - Array of channel names to send to
   * @param {Object} options - Additional options
   */
  async dispatchAnnouncement(announcement, channels = [], options = {}) {
    const dispatchResults = [];
    const timestamp = new Date().toISOString();
    
    console.log(`📢 Dispatching announcement ${announcement.referenceNumber} to channels: ${channels.join(', ')}`);

    for (const channel of channels) {
      try {
        const provider = this.providers[channel];
        if (!provider) {
          throw new Error(`Unknown channel: ${channel}`);
        }

        const result = await provider.send(announcement, options);
        
        // Log successful dispatch
        await this.logMessage({
          announcementId: announcement.id,
          channel,
          status: 'sent',
          recipientCount: result.recipientCount || 0,
          language: options.language || 'en',
          subjectEn: announcement.title?.en,
          subjectFa: announcement.title?.fa,
          contentEn: announcement.content?.en,
          contentFa: announcement.content?.fa,
          result,
          timestamp
        });

        dispatchResults.push({
          channel,
          success: true,
          recipientCount: result.recipientCount || 0,
          messageId: result.messageId || null
        });

        console.log(`✅ ${channel}: sent to ${result.recipientCount || 0} recipients`);

      } catch (error) {
        console.error(`❌ Failed to send to ${channel}:`, error.message);
        
        // Log failed dispatch
        await this.logMessage({
          announcementId: announcement.id,
          channel,
          status: 'failed',
          language: options.language || 'en',
          subjectEn: announcement.title?.en,
          subjectFa: announcement.title?.fa,
          contentEn: announcement.content?.en,
          contentFa: announcement.content?.fa,
          error: error.message,
          timestamp
        });

        dispatchResults.push({
          channel,
          success: false,
          error: error.message
        });
      }
    }

    // Update announcement status
    if (dispatchResults.some(r => r.success)) {
      await this.updateAnnouncementStatus(announcement.id, 'published');
    }

    return {
      success: dispatchResults.some(r => r.success),
      results: dispatchResults,
      totalRecipients: dispatchResults.reduce((sum, r) => sum + (r.recipientCount || 0), 0)
    };
  }

  /**
   * Log message dispatch to database
   */
  async logMessage(logEntry) {
    try {
      await pool.query(`
        INSERT INTO message_logs 
        (reference_id, reference_type, channel, recipient_type, recipient_address, language,
         subject_en, subject_fa, content_en, content_fa, status, sent_at, delivery_status, 
         error_message, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
      `, [
        logEntry.announcementId,
        'announcement',
        logEntry.channel,
        'broadcast',
        logEntry.recipientAddress || 'multiple',
        logEntry.language || 'en',
        logEntry.subjectEn || '',
        logEntry.subjectFa || '',
        logEntry.contentEn || '',
        logEntry.contentFa || '',
        logEntry.status,
        logEntry.timestamp,
        logEntry.status === 'sent' ? 'delivered' : 'failed',
        logEntry.error || null,
        JSON.stringify(logEntry.result || {})
      ]);
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }

  /**
   * Update announcement status
   */
  async updateAnnouncementStatus(announcementId, status) {
    try {
      await pool.query(
        'UPDATE church_announcements SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, announcementId]
      );
    } catch (error) {
      console.error('Failed to update announcement status:', error);
    }
  }

  /**
   * Get message history for announcement
   */
  async getMessageHistory(announcementId) {
    try {
      const result = await pool.query(
        'SELECT * FROM message_logs WHERE reference_id = $1 AND reference_type = $2 ORDER BY sent_at DESC',
        [announcementId, 'announcement']
      );
      return result.rows;
    } catch (error) {
      console.error('Failed to get message history:', error);
      return [];
    }
  }
}

// Email Provider
class EmailProvider {
  async send(announcement, options = {}) {
    // In production, this would use a service like SendGrid, Mailgun, or SMTP
    const { title, content } = this.getLocalizedContent(announcement, options.language || 'en');
    
    // Mock email sending
    const recipients = await this.getEmailRecipients(announcement.targetAudience);
    
    console.log(`📧 Email: Sending "${title}" to ${recipients.length} recipients`);
    
    return {
      success: true,
      recipientCount: recipients.length,
      messageId: `email_${Date.now()}`,
      provider: 'mock-email'
    };
  }

  getLocalizedContent(announcement, language) {
    return {
      title: announcement.title[language] || announcement.title.en,
      content: announcement.content[language] || announcement.content.en
    };
  }

  async getEmailRecipients(targetAudience) {
    // Mock recipients based on target audience
    const mockRecipients = [
      'member1@church.com',
      'member2@church.com',
      'admin@church.com'
    ];
    return targetAudience.includes('all') ? mockRecipients : mockRecipients.slice(0, 1);
  }
}

// SMS Provider  
class SMSProvider {
  async send(announcement, options = {}) {
    const { title, content } = this.getLocalizedContent(announcement, options.language || 'en');
    
    // Mock SMS sending
    const recipients = await this.getSMSRecipients(announcement.targetAudience);
    const message = `${title}\n\n${content.substring(0, 140)}...`;
    
    console.log(`📱 SMS: Sending "${title}" to ${recipients.length} recipients`);
    
    return {
      success: true,
      recipientCount: recipients.length,
      messageId: `sms_${Date.now()}`,
      provider: 'mock-sms'
    };
  }

  getLocalizedContent(announcement, language) {
    return {
      title: announcement.title[language] || announcement.title.en,
      content: announcement.content[language] || announcement.content.en
    };
  }

  async getSMSRecipients(targetAudience) {
    // Mock phone numbers
    const mockNumbers = ['+1234567890', '+1234567891'];
    return targetAudience.includes('all') ? mockNumbers : mockNumbers.slice(0, 1);
  }
}

// WhatsApp Provider
class WhatsAppProvider {
  async send(announcement, options = {}) {
    const { title, content } = this.getLocalizedContent(announcement, options.language || 'en');
    
    const recipients = await this.getWhatsAppRecipients(announcement.targetAudience);
    
    console.log(`💬 WhatsApp: Sending "${title}" to ${recipients.length} recipients`);
    
    return {
      success: true,
      recipientCount: recipients.length,
      messageId: `whatsapp_${Date.now()}`,
      provider: 'mock-whatsapp'
    };
  }

  getLocalizedContent(announcement, language) {
    return {
      title: announcement.title[language] || announcement.title.en,
      content: announcement.content[language] || announcement.content.en
    };
  }

  async getWhatsAppRecipients(targetAudience) {
    const mockNumbers = ['+1234567890', '+1234567891'];
    return targetAudience.includes('all') ? mockNumbers : mockNumbers.slice(0, 1);
  }
}

// Push Notification Provider
class PushNotificationProvider {
  async send(announcement, options = {}) {
    const { title, content } = this.getLocalizedContent(announcement, options.language || 'en');
    
    const subscribers = await this.getPushSubscribers(announcement.targetAudience);
    
    console.log(`🔔 Push: Sending "${title}" to ${subscribers.length} subscribers`);
    
    return {
      success: true,
      recipientCount: subscribers.length,
      messageId: `push_${Date.now()}`,
      provider: 'mock-push'
    };
  }

  getLocalizedContent(announcement, language) {
    return {
      title: announcement.title[language] || announcement.title.en,
      content: announcement.content[language] || announcement.content.en
    };
  }

  async getPushSubscribers(targetAudience) {
    const mockSubscribers = ['sub1', 'sub2', 'sub3'];
    return targetAudience.includes('all') ? mockSubscribers : mockSubscribers.slice(0, 1);
  }
}

// Website Provider (publishes to website)
class WebsiteProvider {
  async send(announcement, options = {}) {
    console.log(`🌐 Website: Publishing "${announcement.title.en || announcement.title.fa}" to website`);
    
    return {
      success: true,
      recipientCount: 1, // Represents website publication
      messageId: `website_${Date.now()}`,
      provider: 'website',
      url: `/announcements/${announcement.referenceNumber}`
    };
  }
}

const messageDispatcher = new MessageDispatcher();
module.exports = { messageDispatcher, MessageDispatcher };