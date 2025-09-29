import { ApiClient } from './api';
import { Factor, FactorRequest } from '../types/api';

export class FactorsService {
  static async getAll(): Promise<Factor[]> {
    return ApiClient.get<Factor[]>('/Factors');
  }

  static async getById(id: number): Promise<Factor> {
    return ApiClient.get<Factor>(`/Factors/${id}`);
  }

  static async create(factor: FactorRequest): Promise<Factor> {
    return ApiClient.post<Factor>('/Factors', factor);
  }

  static async update(id: number, factor: FactorRequest): Promise<Factor> {
    return ApiClient.put<Factor>(`/Factors/${id}`, factor);
  }

  static async delete(id: number): Promise<void> {
    return ApiClient.delete<void>(`/Factors/${id}`, { responseType: 'text' });
  }
}