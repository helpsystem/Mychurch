import { getAuthToken } from './tokenManager';
import { BibleBook, BibleImportData, ContentData } from '../types';

class ApiNotConfiguredError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ApiNotConfiguredError";
    }
}

const LOCAL_STORAGE_API_KEY = 'iccdc-api-base-url';

// Exported for use in the settings page
export const getApiBaseUrl = (): string => {
    // For localhost development, always use Vite proxy
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return '';
    }
    
    // For Replit environment, construct backend URL
    if (typeof window !== 'undefined' && window.location.hostname.includes('.replit.dev')) {
        const domain = window.location.hostname.replace('-00-', '-01-');
        return `https://${domain}`;
    }
    
    // Check localStorage for custom API URL
    if (typeof window !== 'undefined') {
        const storedUrl = localStorage.getItem(LOCAL_STORAGE_API_KEY);
        if (storedUrl !== null) {
            return storedUrl.replace(/\/+$/, '');
        }
    }
    
    // Fallback to environment variable
    if (typeof process !== 'undefined' && process.env.VITE_API_BASE) {
        return process.env.VITE_API_BASE;
    }
    
    return ''; 
};

// Exported for use in the settings page
export const setApiBaseUrl = (url: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_API_KEY, url);
    }
};


/**
 * A centralized and type-safe fetch wrapper for making API calls.
 * It automatically adds the Authorization header and handles JSON parsing and errors.
 *
 * @param endpoint The API endpoint to call (e.g., '/api/users').
 * @param options The standard `RequestInit` options for fetch.
 * @returns The JSON response from the API.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}, queryParams?: Record<string, string>): Promise<T> {
  const API_BASE_URL = getApiBaseUrl();
  console.log('🌐 Using API URL:', API_BASE_URL);

  const token = getAuthToken();
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let url = `${API_BASE_URL}${endpoint}`;
    if (queryParams) {
        const params = new URLSearchParams(queryParams);
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
    }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
        // Default error message
        let errorMessage = `Request failed with status: ${response.status}`;
        
        // Try to parse a more specific error message from the JSON body
        try {
            const errorData = await response.json();
            if (errorData && typeof errorData.message === 'string') {
                errorMessage = errorData.message;
            }
        } catch (e) {
            // Could not parse JSON, use the default message.
        }
        
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error:`, error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown network error occurred.');
  }
}

async function apiUpload<T>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  const API_BASE_URL = getApiBaseUrl();
  
  // Auto-configure API in development if not set
  if (typeof window !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_API_KEY) === null) {
    if (window.location.hostname.includes('.replit.dev')) {
      const backendUrl = '/api';
      localStorage.setItem(LOCAL_STORAGE_API_KEY, backendUrl);
    } else if (window.location.hostname === 'localhost') {
      localStorage.setItem(LOCAL_STORAGE_API_KEY, '/api');
    }
  }
  
  const isApiUnconfigured = typeof window !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_API_KEY) === null;
  
  if (isApiUnconfigured) {
    throw new ApiNotConfiguredError("API not configured. Using mock data.");
  }
  
  const token = getAuthToken();
  
  const headers = new Headers();
  // Let the browser set the Content-Type header for FormData, it will include the boundary.
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: formData,
    });

    if (!response.ok) {
        let errorMessage = `Request failed with status: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData && typeof errorData.message === 'string') {
                errorMessage = errorData.message;
            }
        } catch (e) {
            // Could not parse JSON, use the default message.
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Upload Error:`, error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown network error occurred.');
  }
}

export const api = {
  get: <T>(endpoint: string, queryParams?: Record<string, string>, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }, queryParams),
  
  post: <T>(endpoint:string, body: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, queryParams?: Record<string, string>, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }, queryParams),
  
  patch: <T>(endpoint: string, body: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  
  upload: <T>(endpoint: string, formData: FormData) => apiUpload<T>(endpoint, formData, 'POST'),
  
  replace: <T>(endpoint: string, formData: FormData) => apiUpload<T>(endpoint, formData, 'PUT'),

  importBibleChapter: (data: BibleImportData): Promise<{ books: BibleBook[], content: ContentData['bibleContent'] }> =>
    api.post('/api/bible/import', data),

  // Prayer Requests API methods
  getPrayerRequests: (publicOnly?: boolean) => {
    const queryParams = publicOnly ? { public_only: 'true' } : {};
    return api.get<any[]>('/api/prayer-requests', queryParams);
  },

  createPrayerRequest: (data: any) => 
    api.post<any>('/api/prayer-requests', data),

  updatePrayerRequest: (id: number, data: any) =>
    api.put<any>(`/api/prayer-requests/${id}`, data),

  incrementPrayerCount: (id: number) =>
    api.patch<any>(`/api/prayer-requests/${id}/pray`, {}),

  deletePrayerRequest: (id: number) =>
    api.delete(`/api/prayer-requests/${id}`),
};