import { apiClient } from '../lib/api';
import { MedicineDistribution, MedicineDistributionRequest } from '../types/api';

export class MedicineDistributionService {
  private static async getDistributions(endpoint: string, requiresAuth = true): Promise<MedicineDistribution[]> {
    try {
      return await apiClient.get<MedicineDistribution[]>(endpoint, requiresAuth);
    } catch (error) {
      if (requiresAuth) {
        try {
          return await apiClient.get<MedicineDistribution[]>(endpoint, false);
        } catch {
          return [];
        }
      }
      throw error;
    }
  }

  static async getAll(): Promise<MedicineDistribution[]> {
    return this.getDistributions('/DrugDistributions');
  }

  static async getById(id: number): Promise<MedicineDistribution> {
    const response = await apiClient.get<MedicineDistribution>(`/DrugDistributions/${id}`);
    return response;
  }

  static async create(distribution: MedicineDistributionRequest): Promise<MedicineDistribution> {
    const response = await apiClient.post<MedicineDistribution>('/DrugDistributions', distribution);
    return response;
  }

  static async update(id: number, distribution: MedicineDistributionRequest): Promise<void> {
    await apiClient.put(`/DrugDistributions/${id}`, distribution);
  }

  static async delete(id: number): Promise<void> {
    await apiClient.delete(`/DrugDistributions/${id}`);
  }

  static async getByState(state: string): Promise<MedicineDistribution[]> {
    const normalizedState = state?.trim();
    if (!normalizedState) {
      return [];
    }

    return this.getDistributions(`/DrugDistributions/state/${encodeURIComponent(normalizedState)}`);
  }

  static async deliver(id: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await apiClient.put(`/DrugDistributions/${id}/deliver`, { deliveryDate: today });
  }
}
