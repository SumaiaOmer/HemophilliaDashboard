// services/auth.ts
import { apiClient } from '../lib/api';
import { LoginRequest, RegisterRequest, LoginResponse, User, ApiUser, LayoutUser } from '../types/api';

export class AuthService {
  private static tokenKey = 'hemocore_token';
  private static userKey = 'hemocore_user';
  private static listeners: Array<(user: User | null) => void> = [];

  static onAuthChange(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private static notifyListeners() {
    const user = this.getCurrentUser();
    this.listeners.forEach(callback => callback(user));
  }

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('Login request:', credentials);
      
      const response = await apiClient.post<any>('/Auth/login', credentials, false);
      console.log('Login response:', response);

      if (response.token) {
        localStorage.setItem(this.tokenKey, response.token);
        
        // Extract role from token
        const role = this.extractRoleFromToken(response.token);
        
        // Create user object that matches both ApiUser and Layout expectations
        const user: User = {
          id: response.user?.id,
          username: response.user?.username || credentials.username,
          name: response.user?.username || credentials.username,
          email: response.user?.email || response.user?.username || credentials.username,
          role: role,
          state: response.user?.state || '',
          userRoles: [] // Initialize empty, can be fetched later
        };
        
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.notifyListeners();
      }

      return {
        token: response.token,
        user: response.user
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      console.log('Register request:', userData);
      
      const response = await apiClient.post<any>('/Auth/register', userData, false);
      console.log('Register response:', response);

      if (response.token) {
        localStorage.setItem(this.tokenKey, response.token);
        
        const role = this.extractRoleFromToken(response.token);
        
        const user: User = {
          id: response.user?.id,
          username: response.user?.username || userData.username,
          name: response.user?.username || userData.username,
          email: response.user?.email || response.user?.username || userData.username,
          role: role || userData.role,
          state: userData.state,
          userRoles: []
        };
        
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.notifyListeners();
      }

      return {
        token: response.token,
        user: response.user
      };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  private static extractRoleFromToken(token: string): string {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return 'User';
      
      const payload = JSON.parse(atob(parts[1]));
      
      const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
                        payload.role || 
                        payload.roles;
      
      if (Array.isArray(roleClaim)) return roleClaim[0] || 'User';
      if (typeof roleClaim === 'string') return roleClaim;
      return 'User';
    } catch {
      return 'User';
    }
  }

  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  static getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post('/Auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      this.notifyListeners();
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.notifyListeners();
  }
}