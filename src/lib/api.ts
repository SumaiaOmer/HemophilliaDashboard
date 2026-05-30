// src/lib/api.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5057/api';

//const API_URL = import.meta.env.VITE_API_URL || 'http://nbtc.gov.sd:5057/api';

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('hemocore_token');
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, headers = {}, ...fetchOptions } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof headers === 'object' && !Array.isArray(headers)) {
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          requestHeaders[key] = value;
        });
      } else {
        Object.assign(requestHeaders, headers);
      }
    }

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // Handle application/server exception messages gracefully
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || errorJson.error || `HTTP error! Status: ${response.status}`);
      } catch (parseErr) {
        if (parseErr instanceof Error && !parseErr.message.includes('HTTP error')) {
          throw new Error(errorText || `HTTP error! Status: ${response.status}`);
        }
        throw parseErr;
      }
    }

    // Return empty payload cleanly on HTTP 204 No Content responses (updates/deletions)
    if (response.status === 204) {
      return {} as T;
    }

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      return {} as T;
    }

    try {
      return JSON.parse(responseText);
    } catch (err) {
      // Fallback support for plain raw strings returned directly by endpoints
      return responseText as unknown as T;
    }
  }

  async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  async post<T>(endpoint: string, data?: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  async put<T>(endpoint: string, data: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }
}

export const apiClient = new ApiClient(API_URL);