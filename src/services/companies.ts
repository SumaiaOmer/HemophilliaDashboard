import { ApiClient } from './api';
import { Company, CompanyRequest } from '../types/api';

export class CompaniesService {
  static async getAll(): Promise<Company[]> {
    return ApiClient.get<Company[]>('/Companies');
  }

  static async getById(id: number): Promise<Company> {
    return ApiClient.get<Company>(`/Companies/${id}`);
  }

  static async create(company: CompanyRequest): Promise<Company> {
    return ApiClient.post<Company>('/Companies', company);
  }

  static async update(id: number, company: CompanyRequest): Promise<Company> {
    return ApiClient.put<Company>(`/Companies/${id}`, company);
  }
  static async delete(id: number): Promise<void> {
    return ApiClient.delete<void>(`/Companies/${id}`, { responseType: 'text' });
  }
}