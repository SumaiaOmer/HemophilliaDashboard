import { apiClient } from '../lib/api';

export interface User {
  id: number;
  username: string;
  email?: string;
  state?: string;
  passwordHash?: string;
  role?: string;
}

export interface UserRole {
  id: number;
  name: string;
}

export interface Screen {
  id: number;
  name: string;
  code: string;
  displayName?: string;
  icon?: string;
  route?: string;
  parentId?: number;
  order?: number;
}

export class UsersService {
  static async getAllUsers(): Promise<User[]> {
    const result = await apiClient.get<any>('/users');
    if (Array.isArray(result)) {
      return result.map(user => ({
        id: user.id || user.Id || 0,
        username: user.username || user.Username || '',
        email: user.email || user.Email,
        state: user.state || user.State,
        passwordHash: user.passwordHash || user.PasswordHash,
        role: user.role || user.Role
      }));
    }
    return [];
  }

  static async createUser(userData: { username: string; passwordHash?: string; role?: string; state?: string }, roleId?: number): Promise<User> {
    const params = roleId ? `?roleId=${roleId}` : '';
    const result = await apiClient.post<any>(`/users${params}`, userData);
    return result || { id: 0, username: userData.username };
  }

  static async getUserById(userId: number): Promise<User> {
    const result = await apiClient.get<any>(`/users/${userId}`);
    const user = result || { id: userId, username: '' };
    return {
      id: user.id || user.Id || userId,
      username: user.username || user.Username || '',
      email: user.email || user.Email,
      state: user.state || user.State,
      passwordHash: user.passwordHash || user.PasswordHash,
      role: user.role || user.Role
    };
  }

  static async getUserRoles(userId: number): Promise<UserRole[]> {
    const result = await apiClient.get<any>(`/users/${userId}/roles`);
    if (Array.isArray(result)) {
      return result;
    }
    return [];
  }

  static async getMyScreens(): Promise<Screen[]> {
    const result = await apiClient.get<any>('/users/my-screens');
    if (Array.isArray(result)) {
      return result.map(screen => ({
        id: screen.id || screen.Id || 0,
        name: screen.name || screen.Name || '',
        code: screen.code || screen.Code || '',
        displayName: screen.displayName || screen.DisplayName,
        icon: screen.icon || screen.Icon,
        route: screen.route || screen.Route,
        parentId: screen.parentId || screen.ParentId,
        order: screen.order || screen.Order || 0
      }));
    }
    return [];
  }
}
