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
  drugType: string;
  supplierName: string;
  companyName: string;
}

export interface FactorRequest {
  name: string;
  lotNo: string;
  quantity: number;
  expiryDate: string;
  mg: number;
  drugType: string;
  supplierName: string;
  companyName: string;
}

export interface Patient {
  id: number;
  fullName: string;
  nationalIdNumber: string;
  dateOfBirth: string;
  gender?: string;
  homeState?: string;
  homeCityOrTown?: string;
  homeLocality?: string;
  residenceType?: 'InsideSudan' | 'OutsideSudan';
  country?: string;
  cityOrTown?: string;
  locality?: string;
  state?: string;
  maritalStatus?: string;
  occupation?: string;
  contactNumber?: string;
  contactNumber1?: string;
  contactNumber2?: string;
  vitalStatus?: 'Alive' | 'Died' | 'Unknown';
  hemophiliaCenterId?: string;
  diagnosis?: string;
  diagnosisType?: string;
  diagnosisYear?: number;
  incidenceDate?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'unknown';
  factorPercent?: number;
  factorPercentDate?: string;
  familyHistory?: 'first_degree' | 'second_degree' | 'third_degree' | 'none';
  HasInhibitors?: boolean;
  hasInhibitors?: boolean;
  inhibitorLevel?: number;
  inhibitorScreeningDate?: string;
  inhibitors?: InhibitorEntry[];
  HasChronicDiseases?: boolean;
  chronicDiseases?: string[];
  chronicDiseaseOther?: string;
  bloodGroup?: string;
  hasHBVVaccination?: boolean;
  hasHealthInsurance?: boolean;
  insuranceProvider?: string;
  isCircumcised?: boolean;
  longTermMedication?: boolean;
  testDates?: PatientTestDate[];
  otherMedicalTests?: OtherMedicalTest[];
  name?: string;
  age?: string;
  category?: string;
  factorLevelTestDate?: string;
  viralScreeningDate?: string;
  otherTestDate?: string;
  inhibitor?: boolean;
}

export type TestType = 'FactorLevel' | 'InhibitorScreening' | 'HBV' | 'HCV' | 'HIV' | 'Other';

export interface PatientTestDate {
  testType: TestType;
  hasTaken: boolean;
  testDate?: string;
  result?: 'positive' | 'negative';
}

export interface PatientRequest {
  fullName: string;
  nationalIdNumber: string;
  dateOfBirth: string;
  gender: string;
  age:string;
  contactNumber1: string;
  bloodGroup?: string;
  maritalStatus?: string;
  occupation?: string;
  contactNumber2?: string; 
  hemophiliaCenterId?: string;
  diagnosis?: string;
  diagnosisType?: string;
  diagnosisYear?: number;
  severity?: string;
  factorPercent?: number;
  factorPercentDate?: string;
  hasInhibitors?: boolean;
  familyHistory?: string;
  vitalStatus?: 'Alive' | 'Died' | 'Unknown';
  homeState?: string;
  homeCityOrTown?: string;
  homeLocality?: string;
  residenceType?: 'InsideSudan' | 'OutsideSudan';
  residenceState?: string;
  residenceCityOrTown?: string;
  residenceLocalArea?: string;
  residenceRegion?: string;
  state?: string;
  cityOrTown?: string;
  locality?: string;
  country?: string;
  incidenceDate?: string;
  HasInhibitors?: boolean;
  inhibitorLevel?: number;
  inhibitorScreeningDate?: string;
  inhibitors?: InhibitorEntry[];
  HasChronicDiseases?: boolean;
  chronicDiseases?: string[];
  chronicDiseaseOther?: string;
  hasHBVVaccination?: boolean;
  hasHealthInsurance?: boolean;
  insuranceProvider?: string;
  isCircumcised?: boolean;
  longTermMedication?: boolean;
  testDates?: PatientTestDate[];
  otherMedicalTests?: OtherMedicalTest[];
}

export interface InhibitorEntry {
  inhibitorLevel?: number;
  inhibitorScreeningDate?: string;
}

export interface VisitDrug {
  drugId: number;
  quantity: number;
}

export interface PatientVisit {
  diagnosis: string;
  id: number;
  patientId: number;
  visitDate: string;
  centerName?: string;
  visitType?: string;
  diagnosisType?: string;
  complaint?: string;
  notes?: string;
  enteredBy?: string;
  createdAt?: string;
  vitalStatus?: 'Alive' | 'Died' | 'Unknown';
  managementPlan?: string;
  drugs?: VisitDrug[];
  centerState?: string;
  complaintOther?: string;
  complaintDetails?: string;
  serviceType?: 'new_visit' | 'followup' | 'hospital_admission';
  factorLevelTestDates?: string[];
  inhibitorScreeningDates?: string[];
  viralScreeningDates?: string[];
  otherTestDates?: string[];
  otherMedicalTests?: OtherMedicalTest[];
  inhibitors?: InhibitorEntry[];
}

export interface OtherMedicalTest {
  testName: string;
  testResult: string;
  testDate: string;
}

export interface VisitTest {
  testName: string;
  result: string;
  testDate: string;
}

export interface VisitTestRequest {
  testName: string;
  result: string;
  testDate: string;
}

export interface VisitDrugRequest {
  factorId: number;
  drugType: string | number | readonly string[] | undefined;
  concentration: string | number | readonly string[] | undefined;
  lotNumber: string;
  drugId: number;
  quantity: number;
}

export interface PatientVisitRequest {
  serviceType: string;
  centerState: any;
  state?: string;
  complaintOther: string | number | readonly string[] | undefined;
  complaintDetails: string | number | readonly string[] | undefined;
  patientId: number;
  visitType?: string;
  visitDate: string;
  diagnosis?: string;
  diagnosisType?: string;
  complaint?: string;
  managementPlan?: string;
  notes?: string;
  centerName?: string;
  enteredBy?: string;
  hasInhibitors?: boolean;
  inhibitorLevel?: number;
  vitalStatus?: 'Alive' | 'Died' | 'Unknown';
  drugs?: VisitDrugRequest[];
  tests?: VisitTestRequest[];
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


// This is the actual API User model from Swagger
export interface ApiUser {
  id: number;
  username: string;
  passwordHash?: string;
  state: string;
  userRoles?: Array<{
    roleId: number;
    userId: number;
    role: {
      id: number;
      name: string;
    };
  }>;
}

// This is what your Layout component expects
export interface LayoutUser {
  id?: number;
  name: string;
  email: string;
  role: string;
}

// For backward compatibility, you can keep a combined type
export interface User extends LayoutUser {
  username?: string;
  state?: string;
  userRoles?: ApiUser['userRoles'];
}

// UserRole model from Swagger
export interface UserRole {
  userId: number;
  roleId: number;
  role: Role;
}

// Role model from Swagger
export interface Role {
  id: number;
  name: string;
}

// Screen model from Swagger
export interface Screen {
  id: number;
  code: string;
  name: string;
  displayName?: string;
  icon?: string;
  route?: string;
  parentId?: number;
  order: number;
  children?: Screen[];
  roleScreens?: RoleScreen[];
}

// RoleScreen model from Swagger
export interface RoleScreen {
  roleId: number;
  screenId: number;
  role: Role;
  screen: Screen;
}

export interface LoginRequest {
  username: string;
  password: string;
}
// Login Response (from actual API response)
export interface LoginResponse {
  token: string;
  user: {
    username: string;
  };
}

export interface RegisterRequest {
 username: string;
  password: string;
  role: string;
  state: string;
}


 

export interface MedicineDistribution {
  id: number;
  factorId: number;
  state: string;
  quantity: number;
  quantityDistributed: number;
  distributionDate?: string;
  dateOfDistribution?: string;
  expiryDate: string;
  mg: number;
  companyName: string;
  category: string;
  status: string;
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

export interface FactorDistribution {
  id: number;
  factorId: number;
  factorName: string;
  state: string;
  quantityDistributed: number;
  distributionDate: string;
  
}

export interface FactorDistributionRequest {
  factorId: number;
  state: string;
  quantityDistributed: number;
  distributionDate: string;
}