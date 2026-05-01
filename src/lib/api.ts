const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5057/api';

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

    if (response.status === 401) {
      localStorage.removeItem('hemocore_token');
      localStorage.removeItem('hemocore_user');
      window.location.href = '/';
      throw new Error('Unauthorized - redirecting to login');
    }

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        
        // Handle validation errors (RFC 9110 Problem Details)
        if (errorJson.errors && typeof errorJson.errors === 'object') {
          const validationErrors: Record<string, string[]> = errorJson.errors;
          const errorMessages = Object.entries(validationErrors)
            .map(([field, messages]) => {
              const msgs = Array.isArray(messages) ? messages : [messages];
              return msgs.map(msg => `${field}: ${msg}`).join('\n');
            })
            .join('\n');
          throw new Error(errorMessages);
        }
        
        // Handle standard error response
        if (errorJson.error) {
          throw new Error(errorJson.error);
        }
        if (errorJson.message) {
          throw new Error(errorJson.message);
        }
        if (errorJson.title) {
          throw new Error(errorJson.title);
        }
      } catch (parseErr) {
        // If parsing fails, use the raw text
        if (parseErr instanceof Error && parseErr.message.includes('JSON')) {
          throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
        throw parseErr;
      }
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const responseText = await response.text();

    if (!responseText) {
      return {} as T;
    }

    try {
      return JSON.parse(responseText);
    } catch (err) {
      throw new Error(`Failed to parse response as JSON: ${responseText}`);
    }
  }

  async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  async post<T>(endpoint: string, data?: unknown, requiresAuth = true): Promise<T> {
    console.log(`POST ${endpoint}`);
    console.log('Request body:', JSON.stringify(data, null, 2));
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
