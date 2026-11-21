import { apiClient } from '../lib/api';

export interface LookupItem {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  isActive?: boolean;
  parentId?: string | null;
}

export interface LookupItemRequest {
  name: string;
  type: string;
  parentId?: string | null;
}

interface LookupItemDto {
  name: string;
  type: string;
  parentId: number;
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
  city: ['city', 'cities', 'town', 'towns', 'citytown', 'cityortown', 'statecity', 'statecities', 'sudancity', 'sudancities'],
  localArea: ['localarea', 'localareas', 'sudanlocalarea', 'sudanlocalareas', 'citylocality', 'citylocalities'],
};

const normalizeTypeKey = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');
const LOCATION_CATEGORY_KEYS = new Set([
  ...LOCATION_LEVEL_KEYS.state,
  ...LOCATION_LEVEL_KEYS.city,
  ...LOCATION_LEVEL_KEYS.localArea,
]);

const readProperty = (item: Record<string, unknown>, propertyName: string) => {
  const key = Object.keys(item).find(
    (candidate) => candidate.toLowerCase() === propertyName.toLowerCase()
  );
  return key ? item[key] : undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeItem = (item: Record<string, unknown>): LookupItem => {
  const id = readProperty(item, 'id');
  const rawName = String(readProperty(item, 'name') ?? '');
  const rawType = String(readProperty(item, 'type') ?? '');
  const description = readProperty(item, 'description');
  const isActive = readProperty(item, 'isActive');
  const parentId = readProperty(item, 'parentId');
  // Some API records store the location category in `name` and the option value in `type`
  // (for example { name: 'State', type: 'Red Sea' }); normalize those to the usual shape.
  const isLegacyLocationRecord = LOCATION_CATEGORY_KEYS.has(normalizeTypeKey(rawName)) &&
    !LOCATION_CATEGORY_KEYS.has(normalizeTypeKey(rawType));

  return {
    id: String(id ?? ''),
    name: isLegacyLocationRecord ? rawType : rawName,
    type: isLegacyLocationRecord ? rawName : rawType,
    description: typeof description === 'string' ? description : null,
    isActive: typeof isActive === 'boolean' ? isActive : undefined,
    parentId: parentId == null ? null : String(parentId),
  };
};

const normalizeItems = (data: unknown, endpoint: string): LookupItem[] => {
  if (!Array.isArray(data)) {
    throw new Error(`Lookup API returned an unexpected response for ${endpoint}`);
  }
  return data.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Lookup API returned an invalid item at index ${index} for ${endpoint}`);
    }
    return normalizeItem(item);
  });
};

const parseApiId = (id: string, fieldName: string): number => {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId < 1 || parsedId > 2147483647) {
    throw new Error(`Lookup ${fieldName} must be a positive 32-bit integer`);
  }
  return parsedId;
};

const buildApiBody = (item: LookupItemRequest): LookupItemDto => {
  const rawParentId = item.parentId?.trim();
  const parentId = !rawParentId || rawParentId === '0' ? 0 : Number(rawParentId);
  if (!Number.isInteger(parentId) || parentId < 0 || parentId > 2147483647) {
    throw new Error('Lookup parentId must be a non-negative 32-bit integer');
  }
  return {
    name: item.name,
    type: item.type,
    parentId,
  };
};

export class LookupsService {
  static async getByType(type: string): Promise<LookupItem[]> {
    try {
      const endpoint = `/Lookups/type/${encodeURIComponent(type)}`;
      const data = await apiClient.get<unknown>(endpoint);
      return normalizeItems(data, `GET ${endpoint}`);
    } catch (error) {
      console.error(`Error fetching lookups for type ${type}:`, error);
      return [];
    }
  }

  static async getAll(): Promise<LookupItem[]> {
    const data = await apiClient.get<unknown>('/Lookups');
    return normalizeItems(data, 'GET /Lookups');
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
    const [items, sudanStateItems] = await Promise.all([
      this.getAll(),
      this.getByType('SudanStates'),
    ]);
    const itemsOfTypes = (keys: string[], matchesType?: (typeKey: string) => boolean) => items.filter((item) => {
      const typeKey = normalizeTypeKey(item.type);
      return (keys.includes(typeKey) || matchesType?.(typeKey)) &&
        item.name.toLowerCase() !== item.type.toLowerCase();
    });

    const states = [
      ...itemsOfTypes(LOCATION_LEVEL_KEYS.state, (typeKey) => /states?$/.test(typeKey)),
      ...sudanStateItems.filter((item) => item.name.toLowerCase() !== item.type.toLowerCase()),
    ];
    const cities = itemsOfTypes(LOCATION_LEVEL_KEYS.city);
    const localAreas = itemsOfTypes(LOCATION_LEVEL_KEYS.localArea);
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
      states: sortNames(Array.from(new Set(states.map((s) => s.name)))),
      citiesByState,
      localAreasByCity,
    };
  }

  static async create(item: LookupItemRequest): Promise<LookupItem> {
    const data = await apiClient.post<unknown>('/Lookups', buildApiBody(item));
    if (!isRecord(data)) {
      throw new Error('Lookup API returned an unexpected response for POST /Lookups');
    }
    return normalizeItem(data);
  }

  static async update(id: string, item: LookupItemRequest): Promise<LookupItem> {
    const lookupId = parseApiId(id, 'id');
    const data = await apiClient.put<unknown>(`/Lookups/${lookupId}`, buildApiBody(item));
    if (!isRecord(data)) {
      throw new Error(`Lookup API returned an unexpected response for PUT /Lookups/${lookupId}`);
    }
    return normalizeItem(data);
  }

  static async remove(id: string): Promise<void> {
    const lookupId = parseApiId(id, 'id');
    await apiClient.delete(`/Lookups/${lookupId}`);
  }
}
