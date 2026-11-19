import { apiClient } from '../lib/api';

export interface InhibitorTest {
  level: number;
  testDate: string;
}

export class InhibitorsService {
  static async getByPatientId(patientId: number): Promise<InhibitorTest[]> {
    try {
      const data = await apiClient.get<InhibitorTest[]>(`/patients/${patientId}/inhibitors`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching inhibitors:', error);
      return [];
    }
  }

  static async addInhibitorTest(patientId: number, test: InhibitorTest): Promise<InhibitorTest> {
    const response = await apiClient.post<InhibitorTest>(
      `/patients/${patientId}/inhibitors`,
      test
    );
    return response;
  }
}
