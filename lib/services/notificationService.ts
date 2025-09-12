// Comprehensive notification service for Iranian Christian Church
// Frontend client that communicates with secure backend notification API

export interface NotificationChannel {
  email?: boolean;
  sms?: boolean;
  whatsapp?: boolean;
  inApp?: boolean;
  push?: boolean;
}

export interface NotificationRecipient {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  preferredLanguage?: 'en' | 'fa';
  channels: NotificationChannel;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'announcement' | 'event_reminder' | 'prayer_request' | 'daily_devotional' | 'admin_alert' | 'custom';
  subject: {
    en: string;
    fa: string;
  };
  content: {
    email: {
      html: { en: string; fa: string };
      text: { en: string; fa: string };
    };
    sms: {
      en: string;
      fa: string;
    };
    push: {
      title: { en: string; fa: string };
      body: { en: string; fa: string };
    };
  };
  variables?: string[]; // For dynamic content replacement
}

export interface NotificationOptions {
  templateId?: string;
  subject?: { en: string; fa: string };
  content: {
    email?: {
      html: { en: string; fa: string };
      text: { en: string; fa: string };
    };
    sms: { en: string; fa: string };
    push?: {
      title: { en: string; fa: string };
      body: { en: string; fa: string };
    };
  };
  channels: NotificationChannel;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  variables?: Record<string, string>; // For template variable replacement
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}

export interface NotificationResult {
  id: string;
  recipientId: string;
  channels: {
    email?: { success: boolean; messageId?: string; error?: string };
    sms?: { success: boolean; messageId?: string; error?: string };
    whatsapp?: { success: boolean; messageId?: string; error?: string };
    inApp?: { success: boolean; messageId?: string; error?: string };
    push?: { success: boolean; messageId?: string; error?: string };
  };
  status: 'sent' | 'failed' | 'partial';
  sentAt: Date;
  errors?: string[];
}

class NotificationService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${this.apiUrl}${url}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Send notification to a single recipient
  public async sendNotification(
    recipient: NotificationRecipient,
    options: NotificationOptions
  ): Promise<NotificationResult> {
    try {
      const response = await this.fetchWithAuth('/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({ recipient, options })
      });

      return response.result;
    } catch (error) {
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Send notification to multiple recipients
  public async sendBulkNotification(
    recipients: NotificationRecipient[],
    options: NotificationOptions
  ): Promise<NotificationResult[]> {
    try {
      const response = await this.fetchWithAuth('/api/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify({ recipients, options })
      });

      return response.results;
    } catch (error) {
      throw new Error(`Failed to send bulk notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get delivery log
  public async getDeliveryLog(limit?: number, status?: 'sent' | 'failed' | 'partial'): Promise<NotificationResult[]> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (status) params.append('status', status);
      
      const response = await this.fetchWithAuth(`/api/notifications/history?${params}`);
      return response.history;
    } catch (error) {
      console.error('Failed to fetch delivery log:', error);
      return [];
    }
  }

  // Get delivery statistics
  public async getDeliveryStats(hours: number = 24): Promise<{
    total: number;
    sent: number;
    partial: number;
    failed: number;
    channels: {
      email: { sent: number; failed: number };
      sms: { sent: number; failed: number };
      whatsapp: { sent: number; failed: number };
    }
  }> {
    try {
      const response = await this.fetchWithAuth(`/api/notifications/stats?hours=${hours}`);
      return response.stats;
    } catch (error) {
      console.error('Failed to fetch delivery stats:', error);
      return {
        total: 0,
        sent: 0,
        partial: 0,
        failed: 0,
        channels: {
          email: { sent: 0, failed: 0 },
          sms: { sent: 0, failed: 0 },
          whatsapp: { sent: 0, failed: 0 }
        }
      };
    }
  }

  // Test connectivity of all services
  public async testConnectivity(): Promise<{
    email: { available: boolean; error?: string };
    sms: { available: boolean; error?: string };
    whatsapp: { available: boolean; error?: string };
  }> {
    try {
      const response = await this.fetchWithAuth('/api/notifications/connectivity');
      return response.connectivity;
    } catch (error) {
      console.error('Failed to test connectivity:', error);
      return {
        email: { available: false, error: 'Unable to connect to backend' },
        sms: { available: false, error: 'Unable to connect to backend' },
        whatsapp: { available: false, error: 'Unable to connect to backend' }
      };
    }
  }

  // Get available templates
  public async getTemplates(): Promise<NotificationTemplate[]> {
    try {
      const response = await this.fetchWithAuth('/api/notifications/templates');
      return response.templates;
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      return [];
    }
  }

  // Get recipients
  public async getRecipients(): Promise<NotificationRecipient[]> {
    try {
      const response = await this.fetchWithAuth('/api/notifications/recipients');
      return response.recipients;
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
      return [];
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;