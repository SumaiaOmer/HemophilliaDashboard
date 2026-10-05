import { apiClient } from '../lib/api';

export interface LookupType {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface LookupTypeRequest {
  name: string;
  parentId?: string | null;
}

export interface LookupItem {
  id: string;
  name: string;
  type: string;
  parentId?: string | null;
}

export interface LookupItemRequest {
  name: string;
  type: string;
  parentId?: string | null;
}

const normalizeType = (t: any): LookupType => ({
  id: String(t.id ?? t.Id ?? ''),
  name: t.name ?? t.Name ?? '',
  parentId: t.parentId ?? t.ParentId ?? t.parentTypeId ?? t.ParentTypeId ?? null,
});

const normalizeItem = (item: any): LookupItem => ({
  id: String(item.id ?? item.Id ?? ''),
  name: item.name ?? item.Name ?? '',
  type: item.type ?? item.Type ?? '',
  parentId: item.parentId ?? item.ParentId ?? item.parentTypeId ?? item.ParentTypeId ?? null,
});

export class LookupsService {
  // ---- Lookup Types ----

  static async getAllTypes(): Promise<LookupType[]> {
    try {
      const data = await apiClient.get<any>('/Lookups/types');
      const list = Array.isArray(data) ? data : [];
      return list.map(normalizeType);
    } catch (error) {
      console.error('Error fetching lookup types:', error);
      return [];
    }
  }

  static async createType(type: LookupTypeRequest): Promise<LookupType> {
    const body: any = { Name: type.name };
    if (type.parentId) body.ParentId = type.parentId;
    const data = await apiClient.post<any>('/Lookups/types', body);
    return normalizeType(data ?? { name: type.name, parentId: type.parentId ?? null });
  }

  static async updateType(id: string, type: LookupTypeRequest): Promise<void> {
    const body: any = { Name: type.name };
    if (type.parentId) body.ParentId = type.parentId;
    await apiClient.put(`/Lookups/types/${id}`, body);
  }

  static async deleteType(id: string): Promise<void> {
    await apiClient.delete(`/Lookups/types/${id}`);
  }

  // ---- Lookup Items ----

  static async getByType(type: string): Promise<LookupItem[]> {
    try {
      const data = await apiClient.get<any>(`/Lookups/${type}`);
      const list = Array.isArray(data) ? data : [];
      return list.map(normalizeItem);
    } catch (error) {
      console.error(`Error fetching lookups for type ${type}:`, error);
      return [];
    }
  }

  static async getAll(): Promise<LookupItem[]> {
    try {
      const data = await apiClient.get<any>('/Lookups/all');
      const list = Array.isArray(data) ? data : [];
      return list.map(normalizeItem);
    } catch (error) {
      console.error('Error fetching all lookups:', error);
      return [];
    }
  }

  static async create(item: LookupItemRequest): Promise<LookupItem> {
    const body: any = { Name: item.name, Type: item.type };
    if (item.parentId) body.ParentId = item.parentId;
    const data = await apiClient.post<any>('/Lookups/create-body', body);
    return normalizeItem(data ?? item);
  }

  static async update(id: string, item: LookupItemRequest): Promise<void> {
    const body: any = { Name: item.name, Type: item.type };
    if (item.parentId) body.ParentId = item.parentId;
    await apiClient.put(`/Lookups/update-body/${id}`, body);
  }

  static async remove(id: string): Promise<void> {
    await apiClient.delete(`/Lookups/delete/${id}`);
  }
}
