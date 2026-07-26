// api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5057/api';

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('hemocore_token');
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, headers = {}, ...fetchOptions } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof headers === 'object' && !Array.isArray(headers)) {
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          requestHeaders[key] = value;
        });
      } else {
        Object.assign(requestHeaders, headers);
      }
    }

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    if (response.status === 401) {
      localStorage.removeItem('hemocore_token');
      localStorage.removeItem('hemocore_user');
      window.location.href = '/';
      throw new Error('Unauthorized - redirecting to login');
    }

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && typeof errorJson.errors === 'object') {
          const validationErrors: Record<string, string[]> = errorJson.errors;
          const errorMessages = Object.entries(validationErrors)
            .map(([field, messages]) => {
              const msgs = Array.isArray(messages) ? messages : [messages];
              return msgs.map(msg => `${field}: ${msg}`).join('\n');
            })
            .join('\n');
          throw new Error(errorMessages);
        }
        if (errorJson.error) {
          throw new Error(errorJson.error);
        }
        if (errorJson.message) {
          throw new Error(errorJson.message);
        }
        if (errorJson.title) {
          throw new Error(errorJson.title);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.includes('JSON')) {
          throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
        throw parseErr;
      }
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const responseText = await response.text();

    if (!responseText) {
      return {} as T;
    }

    try {
      const parsed = JSON.parse(responseText);
      return this.extractResponsePayload(parsed);
    } catch (err) {
      throw new Error(`Failed to parse response as JSON: ${responseText}`);
    }
  }

  private extractResponsePayload<T>(parsed: any): T {
    if (parsed && typeof parsed === 'object') {
      if ('success' in parsed && 'data' in parsed) {
        parsed = parsed.data;
      }

      if (parsed && typeof parsed === 'object') {
        if ('result' in parsed) {
          parsed = parsed.result;
        } else if ('items' in parsed && Object.keys(parsed).length === 1) {
          parsed = parsed.items;
        } else if (
          'data' in parsed &&
          parsed.data &&
          typeof parsed.data === 'object' &&
          'items' in parsed.data
        ) {
          parsed = parsed.data.items;
        }
      }
    }

    return parsed as T;
  }

  async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  async post<T>(endpoint: string, data?: unknown, requiresAuth = true): Promise<T> {
    console.log(`POST ${endpoint}`);
    console.log('Request body:', JSON.stringify(data, null, 2));
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  async put<T>(endpoint: string, data: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }
}

export const apiClient = new ApiClient(API_URL);

// ================= COMPANY =================
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

// ================= FACTOR =================
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

// ================= PATIENT TEST TYPES =================
export type TestType = 'FactorLevel' | 'InhibitorScreening' | 'HBV' | 'HCV' | 'HIV' | 'Other';

export interface InhibitorTestRequest {
  level: number;
  testDate: string;
}

export interface OtherMedicalTest {
  id?: number;
  testName: string;
  testResult: string;
  testDate: string;
}

export interface OtherMedicalTestRequest {
  testName: string;
  testResult: string;
  testDate: string;
}

export interface PatientTestDate {
  testType: TestType;
  hasTaken: boolean;
  testDate?: string;
  result?: 'positive' | 'negative';
}

export interface InhibitorEntry {
  inhibitorLevel?: number;
  inhibitorScreeningDate?: string;
}

export interface InhibitorHistory {
  id?: number;
  testDate: string;
  level: number;
}

// ================= PATIENT =================
export interface Patient {
  id: number;
  fullName: string;
  nationalIdNumber: string;
  dateOfBirth: string;
  gender?: string;
  age?: string;
  homeState?: string;
  homeCityOrTown?: string;
  homeLocality?: string;
  residenceType?: 'InsideSudan' | 'OutsideSudan';
  residenceState?: string;
  residenceCityOrTown?: string;
  residenceLocalArea?: string;
  residenceRegion?: string;
  residenceCountry?: string;
  country?: string;
  cityOrTown?: string;
  locality?: string;
  state?: string;
  maritalStatus?: string;
  occupation?: string;
  contactNumber?: string;
  contactNumber1?: string;
  contactNumber2?: string;
  contactRelation?: string;
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
  isDiagnosed?: boolean;
  HasInhibitors?: boolean;
  hasInhibitors?: boolean;
  inhibitorLevel?: number;
  inhibitorScreeningDate?: string;
  inhibitors?: InhibitorEntry[];
  inhibitorHistory?: InhibitorHistory[];
  inhibitorTests?: InhibitorTestRequest[];
  latestInhibitorLevel?: number;
  latestInhibitorTestDate?: string;
  HasChronicDiseases?: boolean;
  hasChronicDiseases?: boolean;
  chronicDiseases?: string[] | string;
  chronicDiseaseOther?: string;
  bloodGroup?: string;
  hasHBVVaccination?: boolean;
  hbvVaccinationDate?: string;
  hbvTestTaken?: boolean;
  hbvTestDate?: string;
  hbvTestResult?: string;
  hcvTestTaken?: boolean;
  hcvTestDate?: string;
  hcvTestResult?: string;
  hivTestTaken?: boolean;
  hivTestDate?: string;
  hivTestResult?: string;
  hasHealthInsurance?: boolean;
  insuranceProvider?: string;
  isCircumcised?: boolean;
  longTermMedication?: boolean;
  testDates?: PatientTestDate[];
  otherMedicalTests?: OtherMedicalTest[];
  name?: string;
  category?: string;
  factorLevelTestDate?: string;
  viralScreeningDate?: string;
  otherTestDate?: string;
  inhibitor?: boolean;
}

// ================= PATIENT REQUEST =================
export interface PatientRequest {
  fullName: string;
  nationalIdNumber: string;
  dateOfBirth: string;
  gender: string;
  age?: string;
  contactNumber1: string;
  bloodGroup?: string;
  maritalStatus?: string;
  occupation?: string;
  contactNumber2?: string;
  contactRelation?: string;
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
  residenceCountry?: string;
  state?: string;
  cityOrTown?: string;
  locality?: string;
  country?: string;
  incidenceDate?: string;
  isDiagnosed?: boolean;
  HasInhibitors?: boolean;
  inhibitorLevel?: number;
  inhibitorScreeningDate?: string;
  inhibitors?: InhibitorEntry[];
  inhibitorHistory?: InhibitorHistory[];
  inhibitorTests?: InhibitorTestRequest[];
  HasChronicDiseases?: boolean;
  hasChronicDiseases?: boolean;
  chronicDiseases?: string | string[];
  chronicDiseaseOther?: string;
  hasHBVVaccination?: boolean;
  hbvVaccinationDate?: string;
  hbvTestTaken?: boolean;
  hbvTestDate?: string;
  hbvTestResult?: string;
  hcvTestTaken?: boolean;
  hcvTestDate?: string;
  hcvTestResult?: string;
  hivTestTaken?: boolean;
  hivTestDate?: string;
  hivTestResult?: string;
  hasHealthInsurance?: boolean;
  insuranceProvider?: string;
  isCircumcised?: boolean;
  longTermMedication?: boolean;
  testDates?: PatientTestDate[];
  otherMedicalTests?: OtherMedicalTestRequest[];
}

// ================= VISIT =================
export interface VisitDrug {
  drugId?: number;
  factorId?: number;
  drugType: string;
  concentration: number;
  quantity: number;
  lotNumber?: string;
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

// ================= TREATMENT =================
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

// ================= API RESPONSE =================
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// ================= USER =================
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

export interface LayoutUser {
  id?: number;
  name: string;
  email: string;
  role: string;
}

export interface User extends LayoutUser {
  username?: string;
  state?: string;
  userRoles?: ApiUser['userRoles'];
}

export interface UserRole {
  userId: number;
  roleId: number;
  role: Role;
}

export interface Role {
  id: number;
  name: string;
}

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

// ================= MEDICINE DISTRIBUTION =================
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
  deliveryDate: string;
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