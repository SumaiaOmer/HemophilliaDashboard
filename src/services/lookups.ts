import { apiClient } from '../lib/api';

export interface LookupItem {
  id: string;
  name: string;
  type: string;
}

export class LookupsService {
  /**
   * Fetches lookup items dynamically based on the type
   * @param type Example: 'ComplaintOptions', 'Occupations', or 'SudanStates'
   */
  static async getByType(type: string): Promise<LookupItem[]> {
    try {
      return await apiClient.get<LookupItem[]>(`/Lookups/${type}`);
    } catch (error) {
      console.error(`Error fetching lookups for type ${type}:`, error);
      return [];
    }
  }
}