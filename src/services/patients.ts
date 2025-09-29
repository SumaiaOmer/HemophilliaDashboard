import { ApiClient } from './api';
import { Patient, PatientRequest } from '../types/api';

export class PatientsService {
  static async getAll(): Promise<Patient[]> {
    return ApiClient.get<Patient[]>('/Patients');
  }

  static async getById(id: number): Promise<Patient> {
    return ApiClient.get<Patient>(`/Patients/${id}`);
  }

  static async create(patient: PatientRequest): Promise<Patient> {
    return ApiClient.post<Patient>('/Patients', patient);
  }

  static async update(id: number, patient: PatientRequest): Promise<Patient> {
    return ApiClient.put<Patient>(`/Patients/${id}`, patient);
  }

  static async delete(id: number): Promise<void> {
    return ApiClient.delete<void>(`/Patients/${id}`, { responseType: 'text' });
  }
}