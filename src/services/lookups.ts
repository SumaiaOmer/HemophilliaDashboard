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

/**
 * Predefined lookup types from the API Swagger spec.
 * Each has a human-readable label and the type string the API expects.
 */
export const PREDEFINED_TYPES: { value: string; label: string }[] = [
  { value: 'SudanStates', label: 'Sudan States' },
  { value: 'States', label: 'States' },
  { value: 'Occupations', label: 'Occupations' },
  { value: 'Complaints', label: 'Complaints' },
  { value: 'ComplaintOptions', label: 'Complaint Options' },
  { value: 'BloodGroups', label: 'Blood Groups' },
  { value: 'Genders', label: 'Genders' },
  { value: 'DiagnosisTypes', label: 'Diagnosis Types' },
  { value: 'Severities', label: 'Severities' },
  { value: 'MaritalStatuses', label: 'Marital Statuses' },
  { value: 'ResidenceTypes', label: 'Residence Types' },
  { value: 'FamilyHistories', label: 'Family Histories' },
  { value: 'ChronicDiseases', label: 'Chronic Diseases' },
  { value: 'ChronicDiseaseOptions', label: 'Chronic Disease Options' },
  { value: 'VitalStatuses', label: 'Vital Statuses' },
  { value: 'InhibitorStatuses', label: 'Inhibitor Statuses' },
  { value: 'ResidenceRegions', label: 'Residence Regions' },
  { value: 'ResidenceCountries', label: 'Residence Countries' },
  { value: 'MedicalCenters', label: 'Medical Centers' },
  { value: 'StateCenters', label: 'State Centers' },
  { value: 'Cities', label: 'Cities' },
  { value: 'LocalAreas', label: 'Local Areas' },
  { value: 'DiagnosisYears', label: 'Diagnosis Years' },
  { value: 'DrugTypeOptions', label: 'Drug Type Options' },
];

/**
 * Type metadata stored in localStorage — tracks user-created types
 * and parent-child relationships between types. The API has no
 * separate type entity, so this is client-side only.
 */
export interface TypeMeta {
  name: string;
  label: string;
  parentType?: string | null;
}

const TYPE_META_KEY = 'hemocore_lookup_type_meta';

const getTypeMetaMap = (): Record<string, TypeMeta> => {
  try {
    const raw = localStorage.getItem(TYPE_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveTypeMetaMap = (map: Record<string, TypeMeta>) => {
  localStorage.setItem(TYPE_META_KEY, JSON.stringify(map));
};

export const TypeMetaStore = {
  getAll(): TypeMeta[] {
    return Object.values(getTypeMetaMap());
  },

  get(name: string): TypeMeta | undefined {
    return getTypeMetaMap()[name];
  },

  upsert(meta: TypeMeta) {
    const map = getTypeMetaMap();
    map[meta.name] = meta;
    saveTypeMetaMap(map);
  },

  remove(name: string) {
    const map = getTypeMetaMap();
    delete map[name];
    saveTypeMetaMap(map);
  },
};

const normalizeItem = (item: any): LookupItem => ({
  id: String(item.id ?? item.Id ?? ''),
  name: item.name ?? item.Name ?? '',
  type: item.type ?? item.Type ?? '',
  parentId: item.parentId ?? item.ParentId ?? item.parentTypeId ?? item.ParentTypeId ?? null,
});

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

  static async create(item: LookupItemRequest): Promise<LookupItem> {
    const body: any = { Name: item.name, Type: item.type };
    if (item.parentId) body.ParentId = item.parentId;
    const data = await apiClient.post<any>('/Lookups/create-body', body);
    return normalizeItem(data ?? { name: item.name, type: item.type, parentId: item.parentId });
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
