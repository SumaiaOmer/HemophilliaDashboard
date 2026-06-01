// src/types/api.ts

// --- Authentication & User Management ---
export interface User {
  id?: number;
  username: string;
  name: string;
  email: string;
  role: string;
  state?: string;
}

export interface ApiUser {
  id: number;
  username: string;
  email?: string;
  state?: string;
}

export interface LayoutUser {
  id?: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: string;
  state: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email?: string;
  };
}

// --- Dynamic Dynamic RBAC & UI Trees ---
export interface Screen {
  id: number;
  code: string;
  name: string;
  displayName?: string;
  icon?: string;
  route?: string;
  parentId?: number;
  order?: number;
  children?: Screen[];
}

export interface ScreenTreeNode extends Screen {
  children: ScreenTreeNode[];
}

export interface Role {
  id: number;
  name: string;
  screens?: Screen[];
}

export interface RoleScreen {
  roleId: number;
  screenIds: number[];
}

// --- Pharmaceuticals & Vendors (Factors & Companies) ---
export interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface CompanyRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Factor {
  id: number;
  name: string;
  lotNo: string;
  quantity: number;
  expiryDate: string;
  mg: number;
  drugType: string;
  supplierName?: string;
  companyName?: string;
}

export interface FactorRequest {
  name: string;
  lotNo: string;
  quantity: number;
  expiryDate: string;
  mg: number;
  drugType: string;
  supplierName?: string;
  companyName?: string;
}

// --- Patient Demographics & Clinical Baselines ---
export interface Patient {
  HasChronicDiseases: undefined;
  inhibitorScreeningDate(inhibitorScreeningDate: any): unknown;
  incidenceDate(incidenceDate: any): unknown;
  factorPercent: undefined;
  factorPercentDate(factorPercentDate: any): unknown;
  contactNumber1: any;
  contactNumber: any;
  contactNumber2(contactNumber2: any): unknown;
  fullName: string;
  nationalIdNumber: string;
  age: string;
  state: string | undefined;
  cityOrTown: string | undefined;
  locality: string | undefined;
  country: string;
  hemophiliaCenterId: string;
  diagnosis: string;
  diagnosisYear: any;
  familyHistory: any;
  HasInhibitors: boolean;
  inhibitor: boolean;
  inhibitors: never[];
  otherMedicalTests: boolean;
  testDates: boolean;
  id: number;
  hospitalNo?: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  nationalId?: string;
  phoneNumber?: string;
  relativePhoneNumber?: string;
  occupation?: string;
  educationalLevel?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  rhFactor?: string;
  diagnosisType: string; // e.g., Hemophilia A, Hemophilia B, von Willebrand
  severity: string;      // e.g., Severe, Moderate, Mild
  factorLevel?: number;
  hasInhibitors: boolean;
  inhibitorLevel?: number;
  chronicDiseases: string[];
  chronicDiseaseOther?: string;
  vitalStatus: string;   // Alive, Deceased
  homeState?: string;
  homeCityOrTown?: string;
  homeLocality?: string;
  residenceType: string; // InsideSudan, OutsideSudan
  residenceState?: string;
  residenceCityOrTown?: string;
  residenceLocalArea?: string;
  residenceRegion?: string;
  hasHBVVaccination: boolean;
  hasHealthInsurance: boolean;
  insuranceProvider?: string;
  isCircumcised: boolean;
  createdAt?: string;
}

export interface PatientRequest {
  hospitalNo?: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  nationalIdNumber?: string;
  contactNumber1?: string;
  contactNumber2?: string;
  occupation?: string;
  educationalLevel?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  rhFactor?: string;
  diagnosisType: string;
  diagnosis?: string;
  diagnosisYear?: number;
  hemophiliaCenterId?: string;
  severity: string;
  factorPercent?: number;
  hasInhibitors: boolean;
  inhibitorLevel?: number;
  inhibitorScreeningDate?: string;
  inhibitors?: InhibitorTest[];
  chronicDiseases: string | string[];
  chronicDiseaseOther?: string;
  familyHistory?: string;
  vitalStatus: string;
  homeState?: string;
  homeCityOrTown?: string;
  homeLocality?: string;
  residenceType: string;
  residenceState?: string;
  residenceCityOrTown?: string;
  residenceLocalArea?: string;
  residenceRegion?: string;
  residenceCountry?: string;
  hasHBVVaccination: boolean;
  hbvVaccinationDate?: string;
  hasHealthInsurance: boolean;
  insuranceProvider?: string;
  isCircumcised: boolean;
  otherMedicalTests?: OtherMedicalTest[];
  inhibitorTests?: InhibitorTest[];
}

export interface PatientTestDate {
  testType: string;
  testDate: string;
}

export type TestType = 'FactorLevel' | 'InhibitorScreening' | 'HBV' | 'HCV' | 'HIV' | 'HBsAgScreening' | 'Other';

export interface OtherMedicalTest {
  testName: string;
  testResult: string;
  testDate: string;
}

export interface InhibitorTest {
  level: number;
  testDate: string;
}

// --- Clinical Interventions & Multi-Complaint Array Structs ---
export interface VisitDrug {
  drugId: number;
  quantity: number;
  factorName?: string;
}

export interface VisitTest {
  testName: string;
  result: string;
  testDate: string;
}

export interface ComplaintItem {
  complaintType: string;
}

export interface PatientVisit {
  id: number;
  patientId: number;
  patientName?: string;
  visitDate: string;
  centerName: string;
  visitType: string;       // New Patient, Follow up, Admission
  serviceType?: string;     // Routine prophylactic, On demand, Pre-operative
  diagnosisType?: string;
  severity?: string;
  complaint?: string;       // Backward compatibility for single string property
  complaintOther?: string;
  complaints?: string[] | ComplaintItem[]; // Supported multi-complaint implementation for Atbara Center
  complaintDetails?: string;
  managementPlan?: string;
  notes?: string;
  centerState?: string;
  state?: string;
  enteredBy?: string;
  hasInhibitors: boolean;
  inhibitorLevel?: number;
  vitalStatus?: string;
  drugs: VisitDrug[];
  tests: VisitTest[];
  createdAt?: string;
}

export interface PatientVisitRequest {
  patientId: number;
  visitDate: string;
  centerName: string;
  visitType: string;
  serviceType?: string;
  diagnosisType?: string;
  severity?: string;
  complaint?: string;
  complaintOther?: string;
  complaints?: string[];
  complaintDetails?: string;
  managementPlan?: string;
  notes?: string;
  centerState?: string;
  state?: string;
  enteredBy?: string;
  hasInhibitors: boolean;
  inhibitorLevel?: number;
  vitalStatus?: string;
  drugs?: VisitDrug[];
  tests?: VisitTest[];
}

// --- Regional Medicine Supply Chain Tracking ---
export interface MedicineDistribution {
  id: number;
  factorId: number;
  factorName?: string;
  state: string;
  quantity: number;
  quantityDistributed: number;
  distributionDate: string;
  expiryDate: string;
  mg: number;
  companyName?: string;
  category?: string;
  status?: 'Pending' | 'Delivered';
  deliveryDate?: string;
}

export interface MedicineDistributionRequest {
  factorId: number;
  state: string;
  quantity: number;
  quantityDistributed: number;
  distributionDate: string;
  expiryDate: string;
  mg: number;
  companyName: string;
  category: string;
}

// --- Telemedicine & Support Infrastructure ---
export interface CellPhoneTreatment {
  id: number;
  patientId: number;
  patientName?: string;
  treatmentDetails: string;
  dateProvided: string;
}

export interface CellPhoneTreatmentRequest {
  patientId: number;
  treatmentDetails: string;
  dateProvided: string;
}