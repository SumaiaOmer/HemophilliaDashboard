import { apiClient } from '../lib/api';
import { MedicineDistribution, MedicineDistributionRequest } from '../types/api';

export class MedicineDistributionService {
  private static normalize(raw: any): MedicineDistribution {
    return {
      id: raw.id ?? raw.Id,
      factorId: raw.factorId ?? raw.FactorId,
      state: raw.state ?? raw.State ?? '',
      quantity: raw.quantity ?? raw.Quantity ?? raw.quantityDistributed ?? raw.QuantityDistributed ?? 0,
      quantityDistributed: raw.quantityDistributed ?? raw.QuantityDistributed ?? 0,
      distributionDate: raw.distributionDate ?? raw.DistributionDate ?? raw.dateOfDistribution ?? raw.DateOfDistribution ?? '',
      dateOfDistribution: raw.dateOfDistribution ?? raw.DateOfDistribution ?? raw.distributionDate ?? raw.DistributionDate ?? '',
      expiryDate: raw.expiryDate ?? raw.ExpiryDate ?? '',
      mg: raw.mg ?? raw.Mg ?? 0,
      companyName: raw.companyName ?? raw.CompanyName ?? '',
      category: raw.category ?? raw.Category ?? '',
      status: raw.status ?? raw.Status ?? '',
      deliveryDate: raw.deliveryDate ?? raw.DeliveryDate ?? '',
    };
  }

  static async getAll(): Promise<MedicineDistribution[]> {
    const response = await apiClient.get<any[]>('/DrugDistributions');
    return (Array.isArray(response) ? response : []).map(this.normalize);
  }

  static async getById(id: number): Promise<MedicineDistribution> {
    const response = await apiClient.get<any>(`/DrugDistributions/${id}`);
    return this.normalize(response);
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
    const today = new Date().toISOString().split('T')[0];
    await apiClient.put(`/DrugDistributions/${id}/deliver`, { deliveryDate: today });
  }
}
