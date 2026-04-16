import { apiClient } from '../lib/api';
import { Patient, PatientRequest } from '../types/api';

export class PatientsService {
  private static testTypeToEnum(testType: string): number {
    const mapping: Record<string, number> = {
      'FactorLevel': 1,
      'InhibitorScreening': 2,
      'HBV': 3,
      'HCV': 3,
      'HIV': 3,
      'HBsAgScreening': 4,
      'Other': 5
    };
    return mapping[testType] ?? 5;
  }

  private static normalizePatient(patient: any): Patient {
    let chronicDiseases: string[] = [];
    const chronicDiseasesField = patient.ChronicDiseases || patient.chronicDiseases || patient.chronic_diseases;
    if (chronicDiseasesField) {
      if (Array.isArray(chronicDiseasesField)) {
        chronicDiseases = chronicDiseasesField;
      } else if (typeof chronicDiseasesField === 'string') {
        try {
          const parsed = JSON.parse(chronicDiseasesField);
          chronicDiseases = Array.isArray(parsed) ? parsed : [];
        } catch {
          chronicDiseases = chronicDiseasesField.split(',').map(d => d.trim()).filter(d => d.length > 0);
        }
      }
    }

    const inhibitor = patient.HasInhibitors === true || patient.HasInhibitors === 'true' ||
                     patient.hasInhibitors === true || patient.hasInhibitors === 'true' ||
                     patient.inhibitor === true || patient.inhibitor === 'true' ||
                     patient.has_inhibitors === true || patient.has_inhibitors === 'true';

    // Parse inhibitors array if present on the patient record
    let inhibitors: any[] = [];
    const inhibitorsField = patient.Inhibitors || patient.inhibitors;
    if (inhibitorsField && Array.isArray(inhibitorsField)) {
      inhibitors = inhibitorsField.map((inh: any) => ({
        inhibitorLevel: inh.InhibitorLevel || inh.inhibitorLevel || inh.inhibitor_level,
        inhibitorScreeningDate: inh.InhibitorScreeningDate || inh.inhibitorScreeningDate || inh.inhibitor_screening_date,
      }));
    }

    const hasChronicDiseasesExplicit = patient.HasChronicDiseases === true || patient.HasChronicDiseases === 'true' ||
                               patient.hasChronicDiseases === true || patient.hasChronicDiseases === 'true' ||
                               patient.has_chronic_diseases === true || patient.has_chronic_diseases === 'true';

    const hasChronicDiseases = hasChronicDiseasesExplicit || chronicDiseases.length > 0;

    const residenceLocation = patient.ResidenceLocation || patient.residenceType || patient.residence_location;
    const hasCountry = !!(patient.Country || patient.country || patient.residenceCountry || patient.residence_country);
    const residenceType = residenceLocation || (hasCountry ? 'OutsideSudan' : 'InsideSudan');

    const state = patient.State || patient.residenceState || patient.residence_state || patient.state || '';
    const cityOrTown = patient.CityOrTown || patient.residenceCityOrTown || patient.residence_city_or_town || patient.cityOrTown || patient.city_or_town || '';
    const locality = patient.Locality || patient.residenceLocalArea || patient.residence_local_area || patient.locality || '';
    const country = patient.Country || patient.residenceCountry || patient.residence_country || patient.country || '';
    const homeState = patient.HomeState || patient.homeState || patient.home_state || '';
    const homeCityOrTown = patient.HomeCityOrTown || patient.homeCityOrTown || patient.home_city_or_town || '';
    const homeLocality = patient.HomeLocality || patient.homeLocality || patient.home_locality || '';

    // Process testDates from API response
    let testDates: any[] = [];
    const testDatesField = patient.testDates || patient.test_dates || patient.TestDates;
    if (testDatesField && Array.isArray(testDatesField)) {
      testDates = testDatesField.map((td: any) => {
        // Map enum to test type string
        const testTypeMap: Record<number, string> = {
          1: 'FactorLevel',
          2: 'InhibitorScreening',
          3: 'ViralScreening',
          4: 'HBsAgScreening',
          5: 'Other'
        };

        let testType = typeof td.testType === 'number'
          ? testTypeMap[td.testType] || 'Other'
          : (td.testType || td.TestType || 'Other');

        // Handle legacy ViralScreening - default to HBV if no specific type
        if (testType === 'ViralScreening') {
          testType = 'HBV';
        }

        return {
          testType,
          hasTaken: td.hasTaken === true || td.HasTaken === true,
          testDate: td.testDate || td.TestDate || undefined,
          result: td.result || td.Result || undefined
        };
      });
    }

    return {
      id: patient.id || patient.Id,
      fullName: patient.FullName || patient.fullName || patient.full_name || '',
      nationalIdNumber: patient.NationalIdNumber || patient.nationalIdNumber || patient.national_id_number || '',
      dateOfBirth: patient.DateOfBirth || patient.dateOfBirth || patient.date_of_birth || '',
      gender: patient.Gender || patient.gender || '',
      age: patient.Age || patient.age || '',
      homeState: patient.HomeState || patient.homeState || patient.home_state || '',
      homeCityOrTown: patient.HomeCityOrTown || patient.homeCityOrTown || patient.home_city_or_town || '',
      homeLocality: patient.HomeLocality || patient.homeLocality || patient.home_locality || '',
      residenceType,
      state,
      cityOrTown,
      locality,
      country,
      maritalStatus: patient.MaritalStatus || patient.maritalStatus || patient.marital_status || '',
      occupation: patient.Occupation || patient.occupation || '',
      contactNumber: patient.ContactNumber1 || patient.ContactNumber || patient.contactNumber || patient.contact_number || '',
      contactNumber1: patient.ContactNumber1 || patient.contactNumber1 || patient.contact_number1 || patient.ContactNumber || patient.contactNumber || patient.contact_number || '',
      contactNumber2: patient.ContactNumber2 || patient.contactNumber2 || patient.contact_number2 || '',
      vitalStatus: patient.VitalStatus || patient.vitalStatus || patient.vital_status || 'Alive',
      hemophiliaCenterId: patient.HemophiliaCenterId || patient.hemophiliaCenterId || patient.hemophilia_center_id || '',
      diagnosis: patient.Diagnosis || patient.diagnosis || patient.DiagnosisType || '',
      diagnosisType: patient.DiagnosisType || patient.diagnosisType || patient.diagnosis_type || '',
      incidenceDate: patient.IncidenceDate || patient.incidenceDate || patient.incidence_date || '',
      severity: patient.Severity || patient.severity || 'unknown',
      factorPercent: patient.FactorPercent || patient.factorPercent || patient.factor_percent,
      factorPercentDate: patient.FactorPercentDate || patient.factorPercentDate || patient.factor_percent_date,
      familyHistory: patient.FamilyHistory || patient.familyHistory || patient.family_history || 'none',
      HasInhibitors: inhibitor,
      inhibitorLevel: patient.InhibitorLevel || patient.inhibitorLevel || patient.inhibitor_level,
      inhibitorScreeningDate: patient.InhibitorScreeningDate || patient.inhibitorScreeningDate || patient.inhibitor_screening_date,
      inhibitors: inhibitors.length > 0 ? inhibitors : undefined,
      HasChronicDiseases: hasChronicDiseases,
      chronicDiseases: chronicDiseases,
      chronicDiseaseOther: patient.ChronicDiseaseOther || patient.chronicDiseaseOther || patient.chronic_disease_other || '',
      bloodGroup: patient.BloodGroup || patient.bloodGroup || patient.blood_group || '',
      longTermMedication: patient.LongTermMedication === true || patient.longTermMedication === true || patient.longTermMedication === 'true' || patient.LongTermMedication === 'true',
      testDates: testDates.length > 0 ? testDates : undefined
    };
  }

  static async getAll(): Promise<Patient[]> {
    const data = await apiClient.get<Patient[]>('/patients');
    return (Array.isArray(data) ? data : []).map(p => this.normalizePatient(p));
  }

  static async getById(id: number): Promise<Patient> {
    const data = await apiClient.get<Patient>(`/patients/${id}`);
    return this.normalizePatient(data);
  }

  private static transformPatientForAPI(patient: PatientRequest): any {
    const transformed: any = {
      FullName: patient.fullName,
      NationalIdNumber: patient.nationalIdNumber,
      DateOfBirth: patient.dateOfBirth,
      Gender: patient.gender,

      BloodGroup: patient.bloodGroup || null,
      MaritalStatus: patient.maritalStatus || null,
      Occupation: patient.occupation || null,
      ContactNumber1: patient.contactNumber1,
      ContactNumber2: patient.contactNumber2 || null,
      HemophiliaCenterId: patient.hemophiliaCenterId || null,
      Diagnosis: patient.diagnosis || null,
      DiagnosisType: patient.diagnosisType || null,
      DiagnosisYear: patient.diagnosisYear || null,
      Severity: patient.severity || null,
      FactorPercent: patient.factorPercent || null,
      FactorPercentDate: patient.factorPercentDate || null,
      HasInhibitors: patient.hasInhibitors || false,
      FamilyHistory: patient.familyHistory || null,
      VitalStatus: patient.vitalStatus || 'Alive',
      HomeState: patient.homeState || null,
      HomeCityOrTown: patient.homeCityOrTown || null,
      HomeLocality: patient.homeLocality || null,
      ResidenceType: patient.residenceType || 'InsideSudan',
      ResidenceState: patient.residenceState || null,
      ResidenceCityOrTown: patient.residenceCityOrTown || null,
      ResidenceLocalArea: patient.residenceLocalArea || null,
      ResidenceRegion: patient.residenceRegion || null,
      HasHBVVaccination: patient.hasHBVVaccination || false,
      HasHealthInsurance: patient.hasHealthInsurance || false,
      InsuranceProvider: patient.insuranceProvider || null,
      IsCircumcised: patient.isCircumcised || false,
    };

    return transformed;
  }

  static async create(patient: PatientRequest): Promise<Patient> {
    console.log('Creating patient with data:', patient);
    const transformed = this.transformPatientForAPI(patient);
    console.log('Transformed data for API:', JSON.stringify(transformed, null, 2));

    const data = await apiClient.post<Patient>('/patients', transformed);
    return this.normalizePatient(data);
  }

  static async update(id: number, patient: PatientRequest): Promise<void> {
    const transformed = this.transformPatientForAPI(patient);
    await apiClient.put(`/patients/${id}`, transformed);
  }

  static async delete(id: number): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  }
}
