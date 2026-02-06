/**
 * 🎬 Broadcast Storage Service
 * سرویس ذخیره و بارگذاری تنظیمات و پرزنتیشن‌ها روی سرور
 */

const API_BASE = '/api/broadcast';

// ==================== CONFIGS (Templates) ====================

export interface SavedConfig {
  id: string;
  name: string;
  date: string;
  config?: any;
  filename?: string;
}

/**
 * Load all saved configs/templates from server
 */
export async function loadConfigs(): Promise<SavedConfig[]> {
  try {
    const res = await fetch(`${API_BASE}/configs`);
    const data = await res.json();
    if (data.success) {
      return data.configs || [];
    }
    console.error('Failed to load configs:', data.error);
    return [];
  } catch (err) {
    console.error('Error loading configs:', err);
    return [];
  }
}

/**
 * Load a specific config by ID
 */
export async function loadConfig(id: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/configs/${id}`);
    const data = await res.json();
    if (data.success) {
      return data.config?.config || null;
    }
    console.error('Failed to load config:', data.error);
    return null;
  } catch (err) {
    console.error('Error loading config:', err);
    return null;
  }
}

/**
 * Save a new config/template to server
 */
export async function saveConfig(id: string, name: string, config: any): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, config })
    });
    const data = await res.json();
    if (data.success) {
      console.log('✅ Config saved to server:', name);
      return true;
    }
    console.error('Failed to save config:', data.error);
    return false;
  } catch (err) {
    console.error('Error saving config:', err);
    return false;
  }
}

/**
 * Delete a config from server
 */
export async function deleteConfig(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/configs/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('Error deleting config:', err);
    return false;
  }
}

// ==================== PRESENTATIONS (Slides) ====================

export interface SavedPresentation {
  id: string;
  name: string;
  date: string;
  slideCount: number;
  slides?: any[];
  filename?: string;
}

/**
 * Load all saved presentations from server
 */
export async function loadPresentations(): Promise<SavedPresentation[]> {
  try {
    const res = await fetch(`${API_BASE}/presentations`);
    const data = await res.json();
    if (data.success) {
      return data.presentations || [];
    }
    console.error('Failed to load presentations:', data.error);
    return [];
  } catch (err) {
    console.error('Error loading presentations:', err);
    return [];
  }
}

/**
 * Load a specific presentation by ID
 */
export async function loadPresentation(id: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/presentations/${id}`);
    const data = await res.json();
    if (data.success) {
      return data.presentation || null;
    }
    console.error('Failed to load presentation:', data.error);
    return null;
  } catch (err) {
    console.error('Error loading presentation:', err);
    return null;
  }
}

/**
 * Save a new presentation to server
 */
export async function savePresentation(id: string, name: string, slides: any[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/presentations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, slides })
    });
    const data = await res.json();
    if (data.success) {
      console.log('✅ Presentation saved to server:', name);
      return true;
    }
    console.error('Failed to save presentation:', data.error);
    return false;
  } catch (err) {
    console.error('Error saving presentation:', err);
    return false;
  }
}

/**
 * Delete a presentation from server
 */
export async function deletePresentation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/presentations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('Error deleting presentation:', err);
    return false;
  }
}

// ==================== FILE UPLOADS ====================

export interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  originalName?: string;
  mimetype?: string;
}

/**
 * Upload a file to server
 */
export async function uploadFile(file: File): Promise<UploadedFile | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    if (data.success) {
      console.log('✅ File uploaded to server:', data.filename);
      return {
        filename: data.filename,
        url: data.url,
        size: data.size,
        uploadedAt: new Date().toISOString(),
        originalName: data.originalName,
        mimetype: data.mimetype
      };
    }
    console.error('Failed to upload file:', data.error);
    return null;
  } catch (err) {
    console.error('Error uploading file:', err);
    return null;
  }
}

/**
 * Load all uploaded files from server
 */
export async function loadUploads(): Promise<UploadedFile[]> {
  try {
    const res = await fetch(`${API_BASE}/uploads`);
    const data = await res.json();
    if (data.success) {
      return data.uploads || [];
    }
    console.error('Failed to load uploads:', data.error);
    return [];
  } catch (err) {
    console.error('Error loading uploads:', err);
    return [];
  }
}

/**
 * Delete an uploaded file from server
 */
export async function deleteUpload(filename: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/uploads/${filename}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('Error deleting upload:', err);
    return false;
  }
}
