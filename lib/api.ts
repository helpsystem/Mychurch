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
    if (typeof window !== 'undefined') {
        const storedUrl = localStorage.getItem(LOCAL_STORAGE_API_KEY);
        // If a value is stored in localStorage (even an empty string), use it.
        // This allows for relative paths if the user leaves the field blank.
        if (storedUrl !== null) {
            return storedUrl.replace(/\/+$/, '');
        }
    }
    // Fallback to an empty string for relative paths by default.
    // The previous hardcoded URL was incorrect.
    // A Vite env variable is not applicable in this project's setup.
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
  
  // The API is considered unconfigured if the local storage key has never been set.
  const isApiUnconfigured = typeof window !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_API_KEY) === null;

  if (isApiUnconfigured) {
    // This allows the app to function with mock data until configured.
    // It prevents failed network requests on first load.
    throw new ApiNotConfiguredError("API not configured. Using mock data.");
  }

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
  
  upload: <T>(endpoint: string, formData: FormData) => apiUpload<T>(endpoint, formData, 'POST'),
  
  replace: <T>(endpoint: string, formData: FormData) => apiUpload<T>(endpoint, formData, 'PUT'),

  importBibleChapter: (data: BibleImportData): Promise<{ books: BibleBook[], content: ContentData['bibleContent'] }> =>
    api.post('/api/bible/import', data),
};