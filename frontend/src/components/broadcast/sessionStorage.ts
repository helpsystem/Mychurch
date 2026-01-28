/**
 * 💾 Session Storage Service
 * 
 * ذخیره و بازیابی session های Broadcast Console در Supabase
 */

import { BroadcastSession, BroadcastSlide } from './types';

const API_BASE = '/api/broadcast-sessions';

// Session Types
export interface SavedSession {
  id: string;
  name: string;
  description?: string;
  slides: BroadcastSlide[];
  settings: BroadcastSession['settings'];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  tags?: string[];
}

export interface SessionListItem {
  id: string;
  name: string;
  description?: string;
  slideCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  tags?: string[];
  thumbnail?: string;
}

export interface PrayerRequest {
  id: string;
  name: string;
  request: string;
  isAnonymous: boolean;
  status: 'pending' | 'prayed' | 'displayed';
  createdAt: string;
}

/**
 * ذخیره session جدید
 */
export async function saveSession(
  session: Omit<SavedSession, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedSession> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save session');
  }

  return response.json();
}

/**
 * بروزرسانی session موجود
 */
export async function updateSession(
  id: string,
  updates: Partial<SavedSession>
): Promise<SavedSession> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update session');
  }

  return response.json();
}

/**
 * دریافت یک session
 */
export async function getSession(id: string): Promise<SavedSession> {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Session not found');
  }

  return response.json();
}

/**
 * دریافت لیست session ها
 */
export async function listSessions(options?: {
  limit?: number;
  offset?: number;
  isTemplate?: boolean;
  tags?: string[];
  search?: string;
}): Promise<{ sessions: SessionListItem[]; total: number }> {
  const params = new URLSearchParams();
  
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  if (options?.isTemplate !== undefined) params.set('isTemplate', options.isTemplate.toString());
  if (options?.tags?.length) params.set('tags', options.tags.join(','));
  if (options?.search) params.set('search', options.search);

  const response = await fetch(`${API_BASE}?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list sessions');
  }

  return response.json();
}

/**
 * حذف session
 */
export async function deleteSession(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete session');
  }
}

/**
 * کپی session به عنوان template
 */
export async function duplicateSession(
  id: string,
  newName: string
): Promise<SavedSession> {
  const response = await fetch(`${API_BASE}/${id}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to duplicate session');
  }

  return response.json();
}

/**
 * دریافت template های آماده
 */
export async function getTemplates(): Promise<SessionListItem[]> {
  const result = await listSessions({ isTemplate: true });
  return result.sessions;
}

// ============ Prayer Requests ============

/**
 * دریافت درخواست‌های دعا
 */
export async function getPrayerRequests(
  status?: 'pending' | 'prayed' | 'displayed'
): Promise<PrayerRequest[]> {
  const params = status ? `?status=${status}` : '';
  const response = await fetch(`/api/prayer-requests${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch prayer requests');
  }

  return response.json();
}

/**
 * بروزرسانی وضعیت درخواست دعا
 */
export async function updatePrayerRequestStatus(
  id: string,
  status: 'prayed' | 'displayed'
): Promise<PrayerRequest> {
  const response = await fetch(`/api/prayer-requests/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update prayer request');
  }

  return response.json();
}

/**
 * ارسال درخواست دعای جدید
 */
export async function submitPrayerRequest(
  request: { name: string; request: string; isAnonymous?: boolean }
): Promise<PrayerRequest> {
  const response = await fetch('/api/prayer-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit prayer request');
  }

  return response.json();
}

// ============ Auto-save ============

const AUTOSAVE_KEY = 'broadcast_autosave';

/**
 * ذخیره خودکار در localStorage
 */
export function autoSaveLocal(slides: BroadcastSlide[], settings: any): void {
  try {
    const data = {
      slides,
      settings,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Auto-save error:', err);
  }
}

/**
 * بازیابی از auto-save
 */
export function getAutoSave(): { slides: BroadcastSlide[]; settings: any; savedAt: string } | null {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error('Auto-save load error:', err);
    return null;
  }
}

/**
 * پاک کردن auto-save
 */
export function clearAutoSave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}

// ============ Export Helpers ============

/**
 * Export session به فایل JSON
 */
export function exportSessionJSON(session: SavedSession): void {
  const dataStr = JSON.stringify(session, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `broadcast_session_${session.name.replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import session از فایل JSON
 */
export async function importSessionJSON(file: File): Promise<SavedSession> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate required fields
        if (!data.name || !data.slides) {
          throw new Error('Invalid session file');
        }
        
        resolve(data as SavedSession);
      } catch (err) {
        reject(new Error('Failed to parse session file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export default {
  saveSession,
  updateSession,
  getSession,
  listSessions,
  deleteSession,
  duplicateSession,
  getTemplates,
  getPrayerRequests,
  updatePrayerRequestStatus,
  submitPrayerRequest,
  autoSaveLocal,
  getAutoSave,
  clearAutoSave,
  exportSessionJSON,
  importSessionJSON,
};
