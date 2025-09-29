import { ApiClient } from './api';
import { Treatment, TreatmentRequest } from '../types/api';

export class TreatmentsService {
  static async getAll(): Promise<Treatment[]> {
    return ApiClient.get<Treatment[]>('/Treatments');
  }

  static async getById(id: number): Promise<Treatment> {
    return ApiClient.get<Treatment>(`/Treatments/${id}`);
  }

  static async create(treatment: TreatmentRequest): Promise<Treatment> {
    return ApiClient.post<Treatment>('/Treatments', treatment);
  }

  static async update(id: number, treatment: TreatmentRequest): Promise<Treatment> {
    return ApiClient.put<Treatment>(`/Treatments/${id}`, treatment);
  }

  static async delete(id: number): Promise<void> {
    return ApiClient.delete<void>(`/Treatments/${id}`, { responseType: 'text' });
  }
}