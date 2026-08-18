import { apiClient } from '../lib/api';

export interface LookupItem {
  id: string;
  name: string;
  type: string;
}

export interface LookupItemRequest {
  name: string;
  type: string;
}

// Curated list of lookup types exposed by the API. These map to the
// /api/Lookups/<type> endpoints and are surfaced in the admin UI.
export const LOOKUP_TYPES: { value: string; label: string }[] = [
  { value: 'SudanStates', label: 'Sudan States' },
  { value: 'ComplaintOptions', label: 'Complaint Options' },
  { value: 'Occupations', label: 'Occupations' },
  { value: 'DrugTypeOptions', label: 'Drug Type Options' },
  { value: 'StateCenters', label: 'State Centers' },
  { value: 'BloodGroups', label: 'Blood Groups' },
  { value: 'Genders', label: 'Genders' },
  { value: 'DiagnosisTypes', label: 'Diagnosis Types' },
  { value: 'Severities', label: 'Severities' },
  { value: 'MaritalStatuses', label: 'Marital Statuses' },
  { value: 'ResidenceTypes', label: 'Residence Types' },
  { value: 'FamilyHistories', label: 'Family Histories' },
  { value: 'ChronicDiseases', label: 'Chronic Diseases' },
  { value: 'VitalStatuses', label: 'Vital Statuses' },
  { value: 'InhibitorStatuses', label: 'Inhibitor Statuses' },
  { value: 'ResidenceRegions', label: 'Residence Regions' },
  { value: 'ResidenceCountries', label: 'Residence Countries' },
];

const normalizeItem = (item: any): LookupItem => ({
  id: String(item.id ?? item.Id ?? ''),
  name: item.name ?? item.Name ?? '',
  type: item.type ?? item.Type ?? '',
});

export class LookupsService {
  /**
   * Fetches lookup items dynamically based on the type
   * @param type Example: 'ComplaintOptions', 'Occupations', or 'SudanStates'
   */
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
    const data = await apiClient.post<any>('/Lookups/create-body', {
      Name: item.name,
      Type: item.type,
    });
    return normalizeItem(data ?? item);
  }

  static async update(id: string, item: LookupItemRequest): Promise<void> {
    await apiClient.put(`/Lookups/update-body/${id}`, {
      Name: item.name,
      Type: item.type,
    });
  }

  static async remove(id: string): Promise<void> {
    await apiClient.delete(`/Lookups/delete/${id}`);
  }
}
