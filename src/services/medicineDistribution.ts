import { apiClient } from '../lib/api';
import { MedicineDistribution, MedicineDistributionRequest } from '../types/api';

export class MedicineDistributionService {
  static async getAll(): Promise<MedicineDistribution[]> {
    const response = await apiClient.get<MedicineDistribution[]>('/DrugDistributions');
    return response;
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
    const response = await apiClient.get<MedicineDistribution[]>(`/DrugDistributions/state/${state}`);
    return response;
  }

  static async deliver(id: number): Promise<void> {
    await apiClient.put(`/DrugDistributions/${id}/deliver`, {});
  }
}
