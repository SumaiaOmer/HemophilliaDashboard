import { apiClient } from '../lib/api';
import { Company, CompanyRequest } from '../types/api';

export class CompaniesService {
  static async getAll(): Promise<Company[]> {
    return apiClient.get<Company[]>('/Companies');
  }

  static async getById(id: number): Promise<Company> {
    return apiClient.get<Company>(`/Companies/${id}`);
  }

  static async create(company: CompanyRequest): Promise<Company> {
    return apiClient.post<Company>('/Companies', company);
  }

  static async update(id: number, company: CompanyRequest): Promise<void> {
    await apiClient.put(`/Companies/${id}`, company);
  }

  static async delete(id: number): Promise<void> {
    await apiClient.delete(`/Companies/${id}`);
  }
}
