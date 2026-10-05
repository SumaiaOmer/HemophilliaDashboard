import { apiClient } from '../lib/api';

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

export interface LookupType {
  name: string;
  label: string;
  rootItemId: string | null;
  parentType: string | null;
}

const normalizeItem = (item: any): LookupItem => ({
  id: String(item.id ?? item.Id ?? ''),
  name: item.name ?? item.Name ?? '',
  type: item.type ?? item.Type ?? '',
  parentId: item.parentId ?? item.ParentId ?? null,
});

const buildApiBody = (item: LookupItemRequest) => {
  const body: any = { Name: item.name, Type: item.type };
  const pid = item.parentId ? parseInt(String(item.parentId), 10) : 0;
  body.ParentId = isNaN(pid) ? 0 : pid;
  return body;
};

export class LookupsService {
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

  /**
   * Derives lookup types from all items.
   * A "type root" is an item where Name === Type (case-insensitive).
   * Types without a root item are still listed (from unique Type values).
   * Parent-child relationships between types come from the root item's ParentId.
   */
  static async getAllTypes(): Promise<LookupType[]> {
    const items = await this.getAll();
    const typeMap = new Map<string, LookupType>();

    for (const item of items) {
      const isRoot = item.name.toLowerCase() === item.type.toLowerCase();

      if (!typeMap.has(item.type)) {
        typeMap.set(item.type, {
          name: item.type,
          label: item.type,
          rootItemId: isRoot ? item.id : null,
          parentType: null,
        });
      }

      if (isRoot) {
        const entry = typeMap.get(item.type)!;
        entry.rootItemId = item.id;
        if (item.parentId && item.parentId !== '0') {
          const parent = items.find((i) => i.id === item.parentId);
          entry.parentType = parent?.type ?? null;
        }
      }
    }

    return Array.from(typeMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  static async create(item: LookupItemRequest): Promise<LookupItem> {
    const data = await apiClient.post<any>('/Lookups/create-body', buildApiBody(item));
    return normalizeItem(data ?? { name: item.name, type: item.type, parentId: item.parentId });
  }

  static async update(id: string, item: LookupItemRequest): Promise<void> {
    await apiClient.put(`/Lookups/update-body/${id}`, buildApiBody(item));
  }

  static async remove(id: string): Promise<void> {
    await apiClient.delete(`/Lookups/delete/${id}`);
  }
}
