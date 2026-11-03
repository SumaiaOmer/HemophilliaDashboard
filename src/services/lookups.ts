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

export interface LocationHierarchy {
  states: string[];
  citiesByState: Record<string, string[]>;
  localAreasByCity: Record<string, string[]>;
}

const LOCATION_LEVEL_KEYS = {
  state: ['state', 'states', 'sudanstate', 'sudanstates'],
  city: ['city', 'cities', 'town', 'towns', 'citytown', 'statecity', 'statecities'],
  localArea: ['localarea', 'localareas', 'citylocality', 'citylocalities'],
};

const normalizeTypeKey = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');

const readProperty = (item: Record<string, unknown>, propertyName: string) => {
  const key = Object.keys(item).find(
    (candidate) => candidate.toLowerCase() === propertyName.toLowerCase()
  );
  return key ? item[key] : undefined;
};

const normalizeItem = (item: Record<string, unknown>): LookupItem => {
  const id = readProperty(item, 'id');
  const name = readProperty(item, 'name');
  const type = readProperty(item, 'type');
  const parentId = readProperty(item, 'parentId');

  return {
    id: String(id ?? ''),
    name: String(name ?? ''),
    type: String(type ?? ''),
    parentId: parentId == null ? null : String(parentId),
  };
};

const buildApiBody = (item: LookupItemRequest) => {
  // The LookupItemDto uses PascalCase; ASP.NET model binding is also case-insensitive.
  const body: any = { Name: item.name, Type: item.type };
  if (item.parentId && item.parentId !== '0' && item.parentId !== '') {
    body.ParentId = parseInt(String(item.parentId), 10);
  } else {
    body.ParentId = 0;
  }
  return body;
};

export class LookupsService {
  static async getByType(type: string): Promise<LookupItem[]> {
    try {
      const data = await apiClient.get<any>(`/Lookups/${encodeURIComponent(type)}`);
      const list = Array.isArray(data) ? data : [];
      return list.map(normalizeItem);
    } catch (error) {
      console.error(`Error fetching lookups for type ${type}:`, error);
      return [];
    }
  }

  static async getAll(): Promise<LookupItem[]> {
    const data = await apiClient.get<any>('/Lookups/all');
    if (!Array.isArray(data)) {
      throw new Error('Lookup API returned an unexpected response for GET /Lookups');
    }
    return data.map(normalizeItem);
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
    const rootItems = new Map<string, LookupItem>();

    for (const item of items) {
      const typeName = item.type.trim();
      if (!typeName) continue;
      const typeKey = typeName.toLowerCase();
      const isRoot = item.name.trim().toLowerCase() === typeKey;

      if (!typeMap.has(typeKey)) {
        typeMap.set(typeKey, {
          name: typeName,
          label: typeName,
          rootItemId: null,
          parentType: null,
        });
      }

      if (isRoot) {
        rootItems.set(typeKey, item);
      }

      if (item.parentId && item.parentId !== '0') {
        const parentItem = items.find((candidate) => candidate.id === item.parentId);
        const parentTypeKey = parentItem?.type.trim().toLowerCase();
        const type = typeMap.get(typeKey);
        if (type && parentTypeKey && parentTypeKey !== typeKey) {
          type.parentType = typeMap.get(parentTypeKey)?.name ?? parentItem?.type.trim() ?? null;
        }
      }
    }

    for (const [typeKey, rootItem] of rootItems) {
      const type = typeMap.get(typeKey);
      if (!type) continue;
      type.rootItemId = rootItem.id;

      if (rootItem.parentId && rootItem.parentId !== '0') {
        const parent = items.find((item) => item.id === rootItem.parentId);
        const parentTypeKey = parent?.type.trim().toLowerCase();
        type.parentType = parentTypeKey ? typeMap.get(parentTypeKey)?.name ?? parent?.type.trim() ?? null : null;
      }
    }

    return Array.from(typeMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  static async getLocationHierarchy(): Promise<LocationHierarchy> {
    const items = await this.getAll();
    const typeNames = Array.from(new Set(items.map((i) => i.type)));
    const findType = (keys: string[]) => typeNames.find((n) => keys.includes(normalizeTypeKey(n)));
    const stateType = findType(LOCATION_LEVEL_KEYS.state);
    const cityType = findType(LOCATION_LEVEL_KEYS.city);
    const localAreaType = findType(LOCATION_LEVEL_KEYS.localArea);
    const childrenOf = (type: string | undefined) =>
      items.filter((i) => i.type === type && i.name.toLowerCase() !== i.type.toLowerCase());

    const states = childrenOf(stateType);
    const cities = childrenOf(cityType);
    const localAreas = childrenOf(localAreaType);
    const stateNameById = new Map(states.map((s) => [s.id, s.name]));
    const cityNameById = new Map(cities.map((c) => [c.id, c.name]));

    const citiesByState: Record<string, string[]> = {};
    cities.forEach((c) => {
      const stateName = stateNameById.get(c.parentId ?? '');
      if (!stateName) return;
      (citiesByState[stateName] = citiesByState[stateName] || []).push(c.name);
    });

    const localAreasByCity: Record<string, string[]> = {};
    localAreas.forEach((la) => {
      const cityName = cityNameById.get(la.parentId ?? '');
      if (!cityName) return;
      (localAreasByCity[cityName] = localAreasByCity[cityName] || []).push(la.name);
    });

    const sortNames = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b));
    Object.keys(citiesByState).forEach((k) => (citiesByState[k] = sortNames(citiesByState[k])));
    Object.keys(localAreasByCity).forEach((k) => (localAreasByCity[k] = sortNames(localAreasByCity[k])));

    return {
      states: sortNames(states.map((s) => s.name)),
      citiesByState,
      localAreasByCity,
    };
  }

  static async create(item: LookupItemRequest): Promise<LookupItem> {
    const data = await apiClient.post<any>('/Lookups/create-body', buildApiBody(item));
    return normalizeItem(data ?? { name: item.name, type: item.type, parentId: item.parentId });
  }

  static async update(id: string, item: LookupItemRequest): Promise<void> {
    await apiClient.put(`/Lookups/update-body/${encodeURIComponent(id)}`, buildApiBody(item));
  }

  static async remove(id: string): Promise<void> {
    await apiClient.delete(`/Lookups/delete/${encodeURIComponent(id)}`);
  }
}
