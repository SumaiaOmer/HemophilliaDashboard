export interface Company {
  id: number;
  name: string;
  country: string;
  quantity: number;
}

export interface CompanyRequest {
  name: string;
  country: string;
  quantity: number;
}

export interface Factor {
  id: number;
  name: string;
  lotNo: string;
  quantity: number;
  expiryDate: string;
  mg: number;
  companyName: string;
  category: string;
}

export interface FactorRequest {
  name: string;
  lotNo: string;
  quantity: number;
  expiryDate: string;
  mg: number;
  companyName: string;
  category: string;
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  nationalId: string;
  state: string;
  diagnosis: string;
  birthDate: string;
}

export interface PatientRequest {
  name: string;
  age: number;
  nationalId: string;
  state: string;
  diagnosis: string;
  birthDate: string;
}

export interface Treatment {
  id: number;
  patientId: number;
  treatmentCenter: string;
  treatmentType: string;
  indicationOfTreatment: string;
  lot: string;
  noteDate: string;
  quantityLot: number;
}

export interface TreatmentRequest {
  patientId: number;
  treatmentCenter: string;
  treatmentType: string;
  indicationOfTreatment: string;
  lot: string;
  noteDate: string;
  quantityLot: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}