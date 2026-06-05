import { apiClient } from '../lib/api';
import { Factor, FactorRequest } from '../types/api';

export class FactorsService {
  static async getAll(): Promise<Factor[]> {
    const response = await apiClient.get<Factor[]>('/Factors');
    return response;
  }

  static async getById(id: number): Promise<Factor> {
    const response = await apiClient.get<Factor>(`/Factors/${id}`);
    return response;
  }

  static async create(factor: FactorRequest): Promise<Factor> {
    const response = await apiClient.post<Factor>('/Factors', factor);
    return response;
  }

  static async update(id: number, factor: FactorRequest): Promise<void> {
    await apiClient.put(`/Factors/${id}`, factor);
  }

  static async delete(id: number): Promise<void> {
    await apiClient.delete(`/Factors/${id}`);
  }
}
