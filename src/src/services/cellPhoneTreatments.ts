import { apiClient } from '../lib/api';
import { CellPhoneTreatment, CellPhoneTreatmentRequest } from '../types/api';

export class CellPhoneTreatmentsService {
  static async getAll(): Promise<CellPhoneTreatment[]> {
    return apiClient.get<CellPhoneTreatment[]>('/CellphoneTreatment');
  }

  static async getById(id: number): Promise<CellPhoneTreatment> {
    return apiClient.get<CellPhoneTreatment>(`/CellphoneTreatment/${id}`);
  }

  static async create(treatment: CellPhoneTreatmentRequest): Promise<CellPhoneTreatment> {
    return apiClient.post<CellPhoneTreatment>('/CellphoneTreatment', treatment);
  }

  static async update(id: number, treatment: CellPhoneTreatmentRequest): Promise<void> {
    await apiClient.put(`/CellphoneTreatment/${id}`, treatment);
  }

  static async delete(id: number): Promise<void> {
    await apiClient.delete(`/CellphoneTreatment/${id}`);
  }
}
