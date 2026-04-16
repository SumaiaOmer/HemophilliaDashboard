import { apiClient } from '../lib/api';

export interface Screen {
  id: number;
  code: string;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  screens?: Screen[];
}

export interface RoleScreen {
  roleId: number;
  screenIds: number[];
}

export class RolesService {
  static async createRole(roleName: string): Promise<Role> {
    const result = await apiClient.post<any>('/roles', { name: roleName });
    if (!result) {
      throw new Error('Failed to create role: No response from server');
    }
    const id = result.Id || result.id;
    if (!id) {
      throw new Error('Failed to create role: No ID returned from server');
    }
    return {
      id,
      name: result.Name || result.name || roleName,
      screens: result.Screens || result.screens || []
    };
  }

  static async assignScreensToRole(roleId: number, screenIds: number[]): Promise<void> {
    await apiClient.post<void>(`/roles/${roleId}/screens`, screenIds);
  }

  static async assignUserToRole(roleId: number, userId: number): Promise<void> {
    await apiClient.post<void>(`/roles/${roleId}/users/${userId}`, {});
  }

  static async getAllRoles(): Promise<Role[]> {
    const result = await apiClient.get<any>('/roles');
    if (Array.isArray(result)) {
      return result.map(role => ({
        id: role.Id || role.id || 0,
        name: role.Name || role.name || '',
        screens: role.Screens || role.screens || []
      }));
    }
    return [];
  }

  static async getRoleById(roleId: number): Promise<Role> {
    const result = await apiClient.get<any>(`/roles/${roleId}`);
    const role = result || { id: roleId, name: '' };
    return {
      id: role.Id || role.id || roleId,
      name: role.Name || role.name || '',
      screens: role.Screens || role.screens || []
    };
  }
}
