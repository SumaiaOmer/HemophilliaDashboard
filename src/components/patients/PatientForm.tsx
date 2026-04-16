import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Patient, PatientRequest, PatientTestDate, TestType, OtherMedicalTest } from '../../types/api';

interface PatientFormProps {
  patient?: Patient | null;
  onSave: (patient: PatientRequest) => void;
  onCancel: () => void;
}

const CHRONIC_DISEASES = ['DM', 'HTN', 'Asthma', 'Cardiac disease', 'Other'];

const OCCUPATIONS = [
  'Student',
  'Teacher',
  'Doctor',
  'Nurse',
  'Engineer',
  'Farmer',
  'Business Owner',
  'Government Employee',
  'Private Sector Employee',
  'Military',
  'Police',
  'Driver',
  'Mechanic',
  'Carpenter',
  'Electrician',
  'Retired',
  'Unemployed',
  'Housewife',
  'Child',
  'Other'
];

const STATE_CITIES: Record<string, string[]> = {
  'Khartoum': ['Khartoum', 'Omdurman', 'Bahri (Khartoum North)', 'Shambat'],
  'Al Jazirah': ['Wad Madani', 'Al Managil', 'Al Hasaheisa'],
  'White Nile': ['Rabak', 'Kosti', 'Ed Dueim'],
  'Blue Nile': ['Ad-Damazin', 'Ar Roseires'],
  'Northern': ['Dongola', 'Karima', 'Merowe'],
  'River Nile': ['Atbara', 'Ed Damer', 'Shendi', 'Berber'],
  'Red Sea': ['Port Sudan', 'Suakin', 'Halaib'],
  'Kassala': ['Kassala', 'Wad al Hilaiw'],
  'Al Qadarif': ['Al Qadarif', 'Al Faw', 'Doka'],
  'Sennar': ['Sennar', 'Singa'],
  'North Kordofan': ['El Obeid', 'Bara', 'Sodiri'],
  'South Kordofan': ['Kadugli', 'Dilling', 'Talodi'],
  'West Kordofan': ['El Fula', 'Babanusa'],
  'Central Darfur': ['Zalingei', 'Wadi Salih'],
  'North Darfur': ['El Fasher', 'Kutum', 'Mellit'],
  'South Darfur': ['Nyala', 'Ed Daein', 'Tulus'],
  'East Darfur': ['Ed Daein', 'Yassin'],
  'West Darfur': ['El Geneina', 'Beida']
};

const CITY_LOCALITIES: Record<string, string[]> = {
  'Khartoum': ['Al Riyadh', 'Al Amarat', 'Al Manshiya', 'Al Daim', 'Burri', 'Kalakla', 'Soba', 'Al Muhandiseen', 'Al Sahafa', 'Jabra'],
  'Omdurman': ['Al Thawra', 'Al Murada', 'Wad Nubawi', 'Umbada', 'Al Abbasiya', 'Karari'],
  'Bahri (Khartoum North)': ['Shambat', 'Halfaya', 'Al Haj Yousif', 'Al Azhari', 'Dar El Salam', 'Al Kadaro'],
  'Wad Madani': ['Central Wad Madani', 'Al Andalus', 'Al Muwaylih'],
  'Port Sudan': ['Central Port Sudan', 'Deim Al Arab', 'Al Malaab'],
  'Kassala': ['Central Kassala', 'Al Khatmiya', 'Toteel'],
  'El Obeid': ['Central El Obeid', 'Al Ibaydiya', 'Al Suq'],
  'Nyala': ['Central Nyala', 'Al Wahda', 'Al Jeer'],
  'El Fasher': ['Central El Fasher', 'Al Fasher South'],
  'El Geneina': ['Central El Geneina', 'Riyad'],
  'Atbara': ['Central Atbara', 'Al Girf'],
  'Al Qadarif': ['Central Al Qadarif', 'Al Suq'],
  'Kosti': ['Central Kosti', 'Al Hilla'],
  'Ad-Damazin': ['Central Ad-Damazin'],
  'Sennar': ['Central Sennar'],
  'Dongola': ['Central Dongola', 'New Dongola'],
  'Shendi': ['Central Shendi'],
  'Merowe': ['Central Merowe'],
  'Rabak': ['Central Rabak'],
  'Zalingei': ['Central Zalingei']
};

const COUNTRIES = [
  'Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'Jordan', 'Lebanon', 'Turkey', 'Ethiopia', 'Eritrea', 'Kenya', 'Uganda', 'Chad',
  'Libya', 'South Sudan', 'United Kingdom', 'United States', 'Canada', 'Germany',
  'France', 'Italy', 'Spain', 'Australia', 'Other'
];

const PHONE_CODE_OPTIONS = [
  { country: 'Sudan', code: '+249' },
  { country: 'Egypt', code: '+20' },
  { country: 'Saudi Arabia', code: '+966' },
  { country: 'United Arab Emirates', code: '+971' },
  { country: 'Qatar', code: '+974' },
  { country: 'Kuwait', code: '+965' },
  { country: 'Bahrain', code: '+973' },
  { country: 'Oman', code: '+968' },
  { country: 'Jordan', code: '+962' },
  { country: 'Lebanon', code: '+961' },
  { country: 'Turkey', code: '+90' },
  { country: 'United Kingdom', code: '+44' },
  { country: 'United States', code: '+1' },
  { country: 'Canada', code: '+1' },
  { country: 'Germany', code: '+49' },
  { country: 'France', code: '+33' },
  { country: 'Italy', code: '+39' },
  { country: 'Spain', code: '+34' },
  { country: 'Australia', code: '+61' }
];

const normalizePhoneValue = (value?: string): { code: string; number: string } => {
  if (!value) return { code: '+249', number: '' };
  const trimmed = value.trim();
  if (trimmed.startsWith('+')) {
    const option = PHONE_CODE_OPTIONS.find(item => trimmed.startsWith(item.code));
    if (option) {
      const number = trimmed.slice(option.code.length).trim().replace(/^0+/, '');
      return { code: option.code, number };
    }
    return { code: '+249', number: trimmed.replace(/^\+/, '').replace(/^0+/, '') };
  }
  const local = trimmed.replace(/^0+/, '');
  return { code: '+249', number: local };
};

const composePhoneNumber = (code: string | undefined, number: string | undefined): string => {
  const cleanNumber = (number || '').trim().replace(/^\+/, '').replace(/^0+/, '');
  if (!cleanNumber) return '';
  return `${code || '+249'}${cleanNumber}`;
};

export const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onSave,
  onCancel,
}) => {
  const getInitialChronicDiseases = () => {
    if (!patient) return false;

    if (patient.HasChronicDiseases !== undefined) {
      return patient.HasChronicDiseases;
    }

    if (!patient.chronicDiseases) return false;
    if (Array.isArray(patient.chronicDiseases)) {
      return patient.chronicDiseases.length > 0;
    }
    if (typeof patient.chronicDiseases === 'string') {
      try {
        const parsed = JSON.parse(patient.chronicDiseases);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    }
    return false;
  };

  const [formData, setFormData] = useState<PatientRequest & {
    contactNumber1CountryCode: string;
    contactNumber2CountryCode: string;
  }>({
    fullName: '',
    nationalIdNumber: '',
    dateOfBirth: '',
    gender: '',
    contactNumber1: '',
    contactNumber1CountryCode: '+249',
    homeState: '',
    homeCityOrTown: '',
    homeLocality: '',
    residenceType: 'InsideSudan',
    residenceState: '',
    residenceCityOrTown: '',
    residenceLocalArea: '',
    residenceRegion: '',
    country: '',
    cityOrTown: '',
    locality: '',
    state: '',
    maritalStatus: '',
    occupation: '',
    contactNumber2: '',
    contactNumber2CountryCode: '+249',
 
    vitalStatus: 'Alive',
    hemophiliaCenterId: '',
    diagnosis: '',
    diagnosisType: '',
    diagnosisYear: undefined,
    incidenceDate: '',
    severity: '',
    factorPercent: undefined,
    factorPercentDate: undefined,
    familyHistory: '',
    HasInhibitors: false,
    hasInhibitors: false,
    inhibitorLevel: undefined,
    inhibitorScreeningDate: '',
    inhibitors: [],
    HasChronicDiseases: false,
    chronicDiseases: [],
    chronicDiseaseOther: '',
    bloodGroup: '',
    hasHBVVaccination: false,
    hasHealthInsurance: false,
    insuranceProvider: '',
    isCircumcised: false,
  });

  const [hasChronicDiseases, setHasChronicDiseases] = useState(getInitialChronicDiseases());
  const [hasFactorLevel, setHasFactorLevel] = useState(false);
  const [factorTestDate, setFactorTestDate] = useState('');
  const [hasFamilyHistory, setHasFamilyHistory] = useState(false);

  const [testDates, setTestDates] = useState<Partial<Record<TestType, { hasTaken: boolean; testDate: string; result?: 'positive' | 'negative' }>>>({
    HBV: { hasTaken: false, testDate: '', result: undefined },
    HCV: { hasTaken: false, testDate: '', result: undefined },
    HIV: { hasTaken: false, testDate: '', result: undefined },
    Other: { hasTaken: false, testDate: '' },
  });

  const [hasOtherTests, setHasOtherTests] = useState(false);
  const [otherTests, setOtherTests] = useState<OtherMedicalTest[]>([]);
  const [currentTest, setCurrentTest] = useState({
    testName: '',
    testResult: ''
  });

  useEffect(() => {
    if (patient) {
      const dateOfBirth = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '';
      const inhibitorScreeningDate = patient.inhibitorScreeningDate ? new Date(patient.inhibitorScreeningDate).toISOString().split('T')[0] : '';
      const incidenceDate = patient.incidenceDate ? new Date(patient.incidenceDate).toISOString().split('T')[0] : '';

      let chronicDiseasesArray: string[] = [];
      if (patient.chronicDiseases) {
        if (Array.isArray(patient.chronicDiseases)) {
          chronicDiseasesArray = patient.chronicDiseases;
        } else if (typeof patient.chronicDiseases === 'string') {
          try {
            const parsed = JSON.parse(patient.chronicDiseases);
            chronicDiseasesArray = Array.isArray(parsed) ? parsed : [];
          } catch {
            chronicDiseasesArray = [];
          }
        }
      }

      const hasChronicDiseasesValue = patient.HasChronicDiseases !== undefined
        ? patient.HasChronicDiseases
        : chronicDiseasesArray.length > 0;

      const hasFactorLevelValue = patient.factorPercent !== undefined && patient.factorPercent !== null;

      const factorPercentDate = patient.factorPercentDate ? new Date(patient.factorPercentDate).toISOString().split('T')[0] : '';

      const normalized1 = normalizePhoneValue(patient.contactNumber1 || patient.contactNumber);
      const normalized2 = normalizePhoneValue(patient.contactNumber2);

      setFormData({
        fullName: patient.fullName || '',
        nationalIdNumber: patient.nationalIdNumber || '',
        dateOfBirth,
        gender: patient.gender || '',
        age: patient.age || '',
        contactNumber1: normalized1.number,
        contactNumber1CountryCode: normalized1.code,
        contactNumber2: normalized2.number,
        contactNumber2CountryCode: normalized2.code,
        homeState: patient.homeState || '',
        homeCityOrTown: patient.homeCityOrTown || '',
        homeLocality: patient.homeLocality || '',
        residenceType: patient.residenceType || 'InsideSudan',
        residenceState: patient.residenceState || patient.state || '',
        residenceCityOrTown: patient.residenceCityOrTown || patient.cityOrTown || '',
        residenceLocalArea: patient.residenceLocalArea || patient.locality || '',
        residenceRegion: patient.residenceRegion || '',
        country: patient.country || '',
        state: patient.residenceType === 'OutsideSudan'
          ? (patient.residenceRegion || patient.state || '')
          : (patient.residenceState || patient.state || ''),
        cityOrTown: patient.residenceCityOrTown || patient.cityOrTown || '',
        locality: patient.residenceType === 'OutsideSudan'
          ? ''
          : (patient.residenceLocalArea || patient.locality || ''),
        maritalStatus: patient.maritalStatus?.toLowerCase() || '',
        occupation: patient.occupation || '',
        vitalStatus: patient.vitalStatus || 'Alive',
        hemophiliaCenterId: patient.hemophiliaCenterId || '',
        diagnosis: patient.diagnosis || '',
        diagnosisType: patient.diagnosisType || '',
        diagnosisYear: patient.diagnosisYear ? Number(patient.diagnosisYear) : undefined,
        incidenceDate,
        severity: patient.severity?.toLowerCase() || '',
        factorPercent: patient.factorPercent ? Number(patient.factorPercent) : undefined,
        factorPercentDate: factorPercentDate,
        familyHistory: (() => {
          const reverseMap: Record<string, string> = {
            'FirstDegree': 'first_degree',
            'SecondDegree': 'second_degree',
            'ThirdDegree': 'third_degree',
            'None': 'none'
          };
          const fh = patient.familyHistory;
          if (!fh || fh === 'none' || fh === 'None') return '';
          return reverseMap[fh] || fh.toLowerCase();
        })(),
        HasInhibitors: patient.HasInhibitors === true || patient.hasInhibitors === true || patient.inhibitor === true,
        hasInhibitors: patient.hasInhibitors === true || patient.HasInhibitors === true || patient.inhibitor === true,
        inhibitorLevel: patient.inhibitorLevel ? Number(patient.inhibitorLevel) : undefined,
        inhibitorScreeningDate,
        inhibitors: patient.inhibitors || [],
        HasChronicDiseases: hasChronicDiseasesValue,
        chronicDiseases: chronicDiseasesArray,
        chronicDiseaseOther: patient.chronicDiseaseOther || '',
        bloodGroup: patient.bloodGroup || '',
        hasHBVVaccination: patient.hasHBVVaccination || false,
        hasHealthInsurance: patient.hasHealthInsurance || false,
        insuranceProvider: patient.insuranceProvider || '',
        isCircumcised: patient.isCircumcised || false,
        longTermMedication: patient.longTermMedication || false,
      });

      setHasChronicDiseases(hasChronicDiseasesValue);
      setHasFactorLevel(hasFactorLevelValue);
      setFactorTestDate(factorPercentDate);
      setHasFamilyHistory(!!patient.familyHistory && patient.familyHistory !== 'none');

      if (patient.otherMedicalTests && patient.otherMedicalTests.length > 0) {
        setOtherTests(patient.otherMedicalTests);
        setHasOtherTests(true);
      } else {
        setOtherTests([]);
        setHasOtherTests(false);
      }

      if (patient.testDates && Array.isArray(patient.testDates)) {
        const testDatesMap: Partial<Record<TestType, { hasTaken: boolean; testDate: string; result?: 'positive' | 'negative' }>> = {
          HBV: { hasTaken: false, testDate: '', result: undefined },
          HCV: { hasTaken: false, testDate: '', result: undefined },
          HIV: { hasTaken: false, testDate: '', result: undefined },
          Other: { hasTaken: false, testDate: '' },
        };

        patient.testDates.forEach((td) => {
          if (td.testType in testDatesMap) {
            testDatesMap[td.testType] = {
              hasTaken: td.hasTaken,
              testDate: td.testDate ? new Date(td.testDate).toISOString().split('T')[0] : '',
              result: td.result,
            };
          }
        });

        setTestDates(testDatesMap);
      }
    } else {
      setHasChronicDiseases(false);
      setHasFactorLevel(false);
      setFactorTestDate('');
      setHasFamilyHistory(false);
      setOtherTests([]);
      setHasOtherTests(false);
      setTestDates({
        HBV: { hasTaken: false, testDate: '', result: undefined },
        HCV: { hasTaken: false, testDate: '', result: undefined },
        HIV: { hasTaken: false, testDate: '', result: undefined },
        Other: { hasTaken: false, testDate: '' },
      });
    }
  }, [patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = {
      fullName: 'Full Name',
      nationalIdNumber: 'National ID Number',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      homeState: 'Home State',
      homeCityOrTown: 'Home City or Town',
      homeLocality: 'Home Locality',
      residenceType: 'Current Residence',
      contactNumber1: 'Contact Number 1',
      contactNumber2: 'Contact Number 2',
      hemophiliaCenterId: 'Hemophilia Center ID',
      severity: 'Severity',
      bloodGroup: 'Blood Group',
      vitalStatus: 'Vital Status',
      maritalStatus: 'Marital Status',
      occupation: 'Occupation'
    };

    const missingFields: string[] = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      const value = formData[field as keyof typeof formData];
      if (!value || value === '' || value === undefined) {
        missingFields.push(label);
      }
    }

    if (formData.residenceType === 'InsideSudan') {
      if (!formData.state) missingFields.push('State (Current Residence)');
      if (!formData.cityOrTown) missingFields.push('City/Town (Current Residence)');
      if (!formData.locality) missingFields.push('Locality (Current Residence)');
    }

    if (formData.residenceType === 'OutsideSudan') {
      if (!formData.country) missingFields.push('Country (Current Residence)');
      if (!formData.state) missingFields.push('Region/State (Current Residence)');
    }

    if (hasFamilyHistory && (!formData.familyHistory || formData.familyHistory === '')) {
      missingFields.push('Family History');
    }

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
      return;
    }

    const chronicDiseasesArray = formData.chronicDiseases && formData.chronicDiseases.length > 0
      ? formData.chronicDiseases
      : [];

    const testDatesArray: PatientTestDate[] = Object.entries(testDates)
      .filter(([_, value]) => value.hasTaken)
      .map(([testType, value]) => ({
        testType: testType as TestType,
        hasTaken: value.hasTaken,
        testDate: value.testDate || undefined,
        ...(value.result && { result: value.result }),
      }));

    const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

    const familyHistoryMap: Record<string, string> = {
      'first_degree': 'FirstDegree',
      'second_degree': 'SecondDegree',
      'third_degree': 'ThirdDegree'
    };

    const maritalStatusMap: Record<string, string> = {
      'single': 'Single',
      'married': 'Married',
      'divorced': 'Divorced',
      'widowed': 'Widowed'
    };

    const severityMap: Record<string, string> = {
      'mild': 'Mild',
      'moderate': 'Moderate',
      'severe': 'Severe'
    };

    const chronicDiseaseString = chronicDiseasesArray.length > 0 ? chronicDiseasesArray.join(', ') : '';

    const resolvedContactNumber1 = composePhoneNumber(formData.contactNumber1CountryCode, formData.contactNumber1);
    const resolvedContactNumber2 = composePhoneNumber(formData.contactNumber2CountryCode, formData.contactNumber2);

    const submitData: PatientRequest = {
      fullName: formData.fullName,
      nationalIdNumber: formData.nationalIdNumber,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      maritalStatus: maritalStatusMap[formData.maritalStatus] || capitalizeFirstLetter(formData.maritalStatus),
      occupation: formData.occupation,
      contactNumber1: resolvedContactNumber1,
      vitalStatus: (formData.vitalStatus || 'Alive') as 'Alive' | 'Died' | 'Unknown',
      hemophiliaCenterId: formData.hemophiliaCenterId,
      HasInhibitors: formData.HasInhibitors,
      HasChronicDiseases: chronicDiseasesArray.length > 0,
      residenceType: formData.residenceType,
      homeState: formData.homeState,
      homeCityOrTown: formData.homeCityOrTown,
      homeLocality: formData.homeLocality,
    };

    if (resolvedContactNumber2) submitData.contactNumber2 = resolvedContactNumber2; 
    if (formData.diagnosis) submitData.diagnosis = formData.diagnosis;
    if (formData.diagnosisType) submitData.diagnosisType = formData.diagnosisType;
    if (formData.diagnosisYear && formData.diagnosisYear > 0) submitData.diagnosisYear = formData.diagnosisYear;
    if (formData.severity) submitData.severity = severityMap[formData.severity] || capitalizeFirstLetter(formData.severity);
    if (hasFamilyHistory && formData.familyHistory) submitData.familyHistory = familyHistoryMap[formData.familyHistory] || formData.familyHistory;
    if (formData.bloodGroup) submitData.bloodGroup = formData.bloodGroup;
    if (hasFactorLevel && formData.factorPercent) submitData.factorPercent = formData.factorPercent;
    if (hasFactorLevel && factorTestDate) submitData.factorPercentDate = factorTestDate;
    if (formData.hasInhibitors) submitData.hasInhibitors = formData.hasInhibitors;
    if (formData.inhibitorLevel) submitData.inhibitorLevel = formData.inhibitorLevel;
    if (formData.inhibitorScreeningDate) submitData.inhibitorScreeningDate = formData.inhibitorScreeningDate;
    if (chronicDiseaseString) submitData.chronicDiseases = chronicDiseasesArray;
    if (formData.chronicDiseaseOther) submitData.chronicDiseaseOther = formData.chronicDiseaseOther;
    if (formData.hasHBVVaccination) submitData.hasHBVVaccination = formData.hasHBVVaccination;
    if (formData.hasHealthInsurance) submitData.hasHealthInsurance = formData.hasHealthInsurance;
    submitData.insuranceProvider = formData.insuranceProvider || '';
    if (formData.isCircumcised) submitData.isCircumcised = formData.isCircumcised;

    if (formData.residenceType === 'InsideSudan') {
      submitData.residenceState = formData.state;
      submitData.residenceCityOrTown = formData.cityOrTown;
      submitData.residenceLocalArea = formData.locality;
    } else if (formData.residenceType === 'OutsideSudan') {
      submitData.residenceRegion = formData.state;
      submitData.residenceCityOrTown = formData.cityOrTown;
      submitData.country = formData.country;
    }

    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'residenceType') {
      setFormData(prev => ({
        ...prev,
        residenceType: value as 'InsideSudan' | 'OutsideSudan',
        country: value === 'InsideSudan' ? '' : prev.country,
        cityOrTown: value === 'OutsideSudan' ? prev.cityOrTown : prev.cityOrTown,
        locality: value === 'OutsideSudan' ? '' : prev.locality,
        state: value === 'OutsideSudan' ? prev.state : prev.state
      }));
    } else if (name === 'homeState') {
      const cities = value ? STATE_CITIES[value] || [] : [];
      const autoSelectCity = cities.length === 1 ? cities[0] : '';
      const localities = autoSelectCity ? CITY_LOCALITIES[autoSelectCity] || [] : [];
      const autoSelectLocality = localities.length === 1 ? localities[0] : '';
      setFormData(prev => ({
        ...prev,
        homeState: value,
        homeCityOrTown: autoSelectCity,
        homeLocality: autoSelectLocality
      }));
    } else if (name === 'homeCityOrTown') {
      const localities = value ? CITY_LOCALITIES[value] || [] : [];
      const autoSelectLocality = localities.length === 1 ? localities[0] : '';
      setFormData(prev => ({
        ...prev,
        homeCityOrTown: value,
        homeLocality: autoSelectLocality
      }));
    } else if (name === 'state') {
      const cities = value ? STATE_CITIES[value] || [] : [];
      const autoSelectCity = cities.length === 1 ? cities[0] : '';
      const localities = autoSelectCity ? CITY_LOCALITIES[autoSelectCity] || [] : [];
      const autoSelectLocality = localities.length === 1 ? localities[0] : '';
      setFormData(prev => ({
        ...prev,
        state: value,
        cityOrTown: autoSelectCity,
        locality: autoSelectLocality
      }));
    } else if (name === 'cityOrTown') {
      const localities = value ? CITY_LOCALITIES[value] || [] : [];
      const autoSelectLocality = localities.length === 1 ? localities[0] : '';
      setFormData(prev => ({
        ...prev,
        cityOrTown: value,
        locality: autoSelectLocality
      }));
    } else if (name === 'HasInhibitors') {
      const inhibitorValue = value === 'true';
      setFormData(prev => ({
        ...prev,
        HasInhibitors: inhibitorValue,
        hasInhibitors: inhibitorValue,
        inhibitorLevel: inhibitorValue ? prev.inhibitorLevel : undefined
      }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const availableCities = formData.state ? STATE_CITIES[formData.state] || [] : [];
  const availableLocalities = formData.cityOrTown ? CITY_LOCALITIES[formData.cityOrTown] || [] : [];

  const handleChronicDiseaseChange = (disease: string, checked: boolean) => {
    setFormData(prev => {
      const diseases = Array.isArray(prev.chronicDiseases) ? prev.chronicDiseases : [];
      const updatedDiseases = checked
        ? [...diseases, disease]
        : diseases.filter(d => d !== disease);

      const hasDiseases = updatedDiseases.length > 0;
      setHasChronicDiseases(hasDiseases);

      return {
        ...prev,
        chronicDiseases: updatedDiseases,
        HasChronicDiseases: hasDiseases
      };
    });
  };

  const addOtherTest = () => {
    if (currentTest.testName.trim() && currentTest.testResult.trim()) {
      setOtherTests([...otherTests, { ...currentTest }]);
      setCurrentTest({
        testName: '',
        testResult: ''
      });
    }
  };

  const removeOtherTest = (index: number) => {
    setOtherTests(otherTests.filter((_, i) => i !== index));
  };

  // Patient-level inhibitor entries management
  const addPatientInhibitor = () => {
    setFormData(prev => ({
      ...prev,
      inhibitors: [...(prev.inhibitors || []), { inhibitorLevel: 0, inhibitorScreeningDate: '' }]
    }));
  };

  const removePatientInhibitor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inhibitors: (prev.inhibitors || []).filter((_, i) => i !== index)
    }));
  };

  const updatePatientInhibitor = (index: number, field: keyof InhibitorEntry, value: any) => {
    setFormData(prev => ({
      ...prev,
      inhibitors: (prev.inhibitors || []).map((inh, i) => i === index ? { ...inh, [field]: value } : inh)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl my-8 shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
          <h3 className="text-xl font-semibold text-gray-800">
            {patient ? 'Edit Patient' : 'Add New Patient'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Demographic Data</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  National ID Number *
                </label>
                <input
                  type="text"
                  name="nationalIdNumber"
                  value={formData.nationalIdNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="National ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home State *
                </label>
                <select
                  name="homeState"
                  value={formData.homeState || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select State</option>
                  <option value="Khartoum">Khartoum</option>
                  <option value="Al Jazirah">Al Jazirah</option>
                  <option value="White Nile">White Nile</option>
                  <option value="Blue Nile">Blue Nile</option>
                  <option value="Northern">Northern</option>
                  <option value="River Nile">River Nile</option>
                  <option value="Red Sea">Red Sea</option>
                  <option value="Kassala">Kassala</option>
                  <option value="Al Qadarif">Al Qadarif</option>
                  <option value="Sennar">Sennar</option>
                  <option value="North Kordofan">North Kordofan</option>
                  <option value="South Kordofan">South Kordofan</option>
                  <option value="West Kordofan">West Kordofan</option>
                  <option value="Central Darfur">Central Darfur</option>
                  <option value="North Darfur">North Darfur</option>
                  <option value="South Darfur">South Darfur</option>
                  <option value="East Darfur">East Darfur</option>
                  <option value="West Darfur">West Darfur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City or Town *
                </label>
                <select
                  name="homeCityOrTown"
                  value={formData.homeCityOrTown || ''}
                  onChange={handleChange}
                  required
                  disabled={!formData.homeState}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.homeState ? 'Select City or Town' : 'Select State First'}</option>
                  {formData.homeState && STATE_CITIES[formData.homeState]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local area *
                </label>
                <select
                  name="homeLocality"
                  value={formData.homeLocality || ''}
                  onChange={handleChange}
                  required
                  disabled={!formData.homeCityOrTown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.homeCityOrTown ? 'Select Local Area' : 'Select City First'}</option>
                  {formData.homeCityOrTown && CITY_LOCALITIES[formData.homeCityOrTown]?.map(locality => (
                    <option key={locality} value={locality}>{locality}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Residence *
              </label>
              <select
                name="residenceType"
                value={formData.residenceType || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Residence</option>
                <option value="InsideSudan">Inside Sudan</option>
                <option value="OutsideSudan">Outside Sudan</option>
              </select>
            </div>

            {formData.residenceType === 'InsideSudan' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select State</option>
                    <option value="Khartoum">Khartoum</option>
                    <option value="Al Jazirah">Al Jazirah</option>
                    <option value="White Nile">White Nile</option>
                    <option value="Blue Nile">Blue Nile</option>
                    <option value="Northern">Northern</option>
                    <option value="River Nile">River Nile</option>
                    <option value="Red Sea">Red Sea</option>
                    <option value="Kassala">Kassala</option>
                    <option value="Al Qadarif">Al Qadarif</option>
                    <option value="Sennar">Sennar</option>
                    <option value="North Kordofan">North Kordofan</option>
                    <option value="South Kordofan">South Kordofan</option>
                    <option value="West Kordofan">West Kordofan</option>
                    <option value="Central Darfur">Central Darfur</option>
                    <option value="North Darfur">North Darfur</option>
                    <option value="South Darfur">South Darfur</option>
                    <option value="East Darfur">East Darfur</option>
                    <option value="West Darfur">West Darfur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City or Town
                  </label>
                  <select
                    name="cityOrTown"
                    value={formData.cityOrTown || ''}
                    onChange={handleChange}
                    disabled={!formData.state}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{formData.state ? 'Select City or Town' : 'Select State First'}</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Local area
                  </label>
                  <select
                    name="locality"
                    value={formData.locality || ''}
                    onChange={handleChange}
                    disabled={!formData.cityOrTown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{formData.cityOrTown ? 'Select Local Area' : 'Select City First'}</option>
                    {availableLocalities.map(locality => (
                      <option key={locality} value={locality}>{locality}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {formData.residenceType === 'OutsideSudan' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    name="country"
                    value={formData.country || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Region
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    placeholder="Enter state or region"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marital Status *
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widow">Widow</option>
                  <option value="widower">Widower</option>
                  <option value="child">Child</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation *
                </label>
                <select
                  name="occupation"
                  value={formData.occupation || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Occupation</option>
                  {OCCUPATIONS.map(occupation => (
                    <option key={occupation} value={occupation}>{occupation}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number 1 *
                </label>
                <div className="flex gap-2">
                  <select
                    name="contactNumber1CountryCode"
                    value={formData.contactNumber1CountryCode || '+249'}
                    onChange={handleChange}
                    className="w-36 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    {PHONE_CODE_OPTIONS.map(option => (
                      <option key={option.code} value={option.code}>
                        {option.country} ({option.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="contactNumber1"
                    value={formData.contactNumber1}
                    onChange={handleChange}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Phone number 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number 2 *
                </label>
                <div className="flex gap-2">
                  <select
                    name="contactNumber2CountryCode"
                    value={formData.contactNumber2CountryCode || '+249'}
                    onChange={handleChange}
                    className="w-36 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    {PHONE_CODE_OPTIONS.map(option => (
                      <option key={option.code} value={option.code}>
                        {option.country} ({option.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="contactNumber2"
                    value={formData.contactNumber2}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Phone number 2"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vital Status *
              </label>
              <select
                name="vitalStatus"
                value={formData.vitalStatus || 'Alive'}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="Alive">Alive</option>
                <option value="Died">Died</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-900 mb-4">Medical Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hemophilia Center ID *
                </label>
                <input
                  type="text"
                  name="hemophiliaCenterId"
                  value={formData.hemophiliaCenterId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Center ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incidence Date
                </label>
                <input
                  type="date"
                  name="incidenceDate"
                  value={formData.incidenceDate || ''}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis
                </label>
                <select
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Diagnosis</option>
                  <option value="Hemophilia A">Hemophilia A</option>
                  <option value="Hemophilia B">Hemophilia B</option>
                  <option value="Hemophilia A carrier">Hemophilia A carrier</option>
                  <option value="Hemophilia B carrier">Hemophilia B carrier</option>
                  <option value="Acquired hemophilia">Acquired hemophilia</option>
                  <option value="Von Willebrand Disease">Von Willebrand Disease</option>
                  <option value="Afibrinogenemia">Afibrinogenemia</option>
                  <option value="Hypofibrinogenemia">Hypofibrinogenemia</option>
                  <option value="Dysfibrinogenemia">Dysfibrinogenemia</option>
                  <option value="Platelete dysfunction">Platelete dysfunction</option>
                  <option value="Bernard Soulier syndrome">Bernard Soulier syndrome</option>
                  <option value="Glanzmann thrombasthenia">Glanzmann thrombasthenia</option>
                  <option value="Prothrombin deficiency">Prothrombin deficiency</option>
                  <option value="Factor V deficiency">Factor V deficiency</option>
                  <option value="Combined factor V and VIII deficiency">Combined factor V and VIII deficiency</option>
                  <option value="Factor VII deficiency">Factor VII deficiency</option>
                  <option value="Factor X deficiency">Factor X deficiency</option>
                  <option value="Factor XI deficiency">Factor XI deficiency</option>
                  <option value="Factor XII deficiency">Factor XII deficiency</option>
                  <option value="Factor XIII deficiency">Factor XIII deficiency</option>
                  <option value="Vitamin K dependent factor deficiency">Vitamin K dependent factor deficiency</option>
                  <option value="Other bleeding disorder">Other bleeding disorder</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis Type
                </label>
                <input
                  type="text"
                  name="diagnosisType"
                  value={formData.diagnosisType || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., new_patient, followup"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis Year
                </label>
                <input
                  type="number"
                  name="diagnosisYear"
                  value={formData.diagnosisYear || ''}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Year of diagnosis"
                />
              </div>
              
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group *
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity *
              </label>
              <select
                name="severity"
                value={formData.severity || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Severity</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Has Factor Level Test?
              </label>
              <select
                value={hasFactorLevel ? 'true' : 'false'}
                onChange={(e) => {
                  const value = e.target.value === 'true';
                  setHasFactorLevel(value);
                  if (!value) {
                    setFormData(prev => ({
                      ...prev,
                      factorPercent: undefined,
                      factorPercentDate: undefined
                    }));
                    setFactorTestDate('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>

            {hasFactorLevel && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level of factor at diagnosis
                    </label>
                    <input
                      type="number"
                      name="factorPercent"
                      value={formData.factorPercent || ''}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Factor %"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Factor Test Date
                    </label>
                    <input
                      type="date"
                      value={factorTestDate}
                      onChange={(e) => setFactorTestDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inhibitor
              </label>
              <select
                name="HasInhibitors"
                value={formData.HasInhibitors ? 'true' : 'false'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>

            {formData.HasInhibitors && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inhibitor Screening Date
                    </label>
                    <input
                      type="date"
                      name="inhibitorScreeningDate"
                      value={formData.inhibitorScreeningDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inhibitor Level
                    </label>
                    <input
                      type="number"
                      name="inhibitorLevel"
                      value={formData.inhibitorLevel || ''}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Inhibitor level"
                    />
                  </div>
                </div>

                {/* Patient-level Inhibitor Records */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-purple-900">Inhibitor Information</h4>
                    <button
                      type="button"
                      onClick={addPatientInhibitor}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Inhibitor</span>
                    </button>
                  </div>

                  {formData.inhibitors && formData.inhibitors.length > 0 ? (
                    <div className="space-y-4">
                      {formData.inhibitors.map((inhibitor, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-medium text-gray-800">Inhibitor #{index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removePatientInhibitor(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                              title="Remove inhibitor"
                              aria-label={`Remove inhibitor ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Inhibitor Level</label>
                              <input
                                type="number"
                                value={inhibitor.inhibitorLevel || ''}
                                onChange={(e) => updatePatientInhibitor(index, 'inhibitorLevel', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Screening Date</label>
                              <input
                                type="date"
                                value={inhibitor.inhibitorScreeningDate || ''}
                                onChange={(e) => updatePatientInhibitor(index, 'inhibitorScreeningDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No inhibitor entries. Click "Add Inhibitor" to add one.</p>
                  )}
                </div>
              </>
            )}

            <div className="mb-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Has Chronic Diseases?
                </label>
                <select
                  value={hasChronicDiseases ? 'true' : 'false'}
                  onChange={(e) => {
                    const value = e.target.value === 'true';
                    setHasChronicDiseases(value);
                    if (!value) {
                      setFormData(prev => ({
                        ...prev,
                        HasChronicDiseases: false,
                        chronicDiseases: [],
                        chronicDiseaseOther: ''
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        HasChronicDiseases: true,
                        chronicDiseases: Array.isArray(prev.chronicDiseases) ? prev.chronicDiseases : []
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              {hasChronicDiseases && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Chronic Diseases
                  </label>
                  <div className="space-y-2">
                    {CHRONIC_DISEASES.map(disease => {
                      const chronicDiseasesArray = Array.isArray(formData.chronicDiseases) ? formData.chronicDiseases : [];
                      const isChecked = chronicDiseasesArray.includes(disease);
                      return (
                        <label key={disease} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleChronicDiseaseChange(disease, e.target.checked)}
                            className="mr-2 h-4 w-4 cursor-pointer"
                          />
                          {disease}
                        </label>
                      );
                    })}
                  </div>
                  {formData.chronicDiseases?.includes('Other') && (
                    <input
                      type="text"
                      name="chronicDiseaseOther"
                      value={formData.chronicDiseaseOther}
                      onChange={handleChange}
                      placeholder="Specify other chronic disease"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mt-2"
                    />
                  )}
                </>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Has Family History?
              </label>
              <select
                value={hasFamilyHistory ? 'true' : 'false'}
                onChange={(e) => {
                  const value = e.target.value === 'true';
                  setHasFamilyHistory(value);
                  if (!value) {
                    setFormData(prev => ({
                      ...prev,
                      familyHistory: ''
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>

            {hasFamilyHistory && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family History
                </label>
                <select
                  name="familyHistory"
                  value={formData.familyHistory || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Family History</option>
                  <option value="first_degree">First Degree</option>
                  <option value="second_degree">Second Degree</option>
                  <option value="third_degree">Third Degree</option>
                </select>
              </div>
            )}

          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Additional Health Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    name="hasHBVVaccination"
                    checked={formData.hasHBVVaccination || false}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 cursor-pointer"
                  />
                  Has HBV Vaccination
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    name="hasHealthInsurance"
                    checked={formData.hasHealthInsurance || false}
                    onChange={(e) => {
                      handleChange(e);
                      if (!e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          insuranceProvider: ''
                        }));
                      }
                    }}
                    className="mr-2 h-4 w-4 cursor-pointer"
                  />
                  Has Health Insurance
                </label>
              </div>
            </div>

            {formData.hasHealthInsurance && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={formData.insuranceProvider || ''}
                  onChange={handleChange}
                  placeholder="Enter insurance provider"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  name="isCircumcised"
                  checked={formData.isCircumcised || false}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 cursor-pointer"
                />
                Is Circumcised
              </label>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-teal-900 mb-4">Viral Screening </h4>

            <div className="space-y-4">
              <div className="border-b border-teal-200 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    HBV Test
                  </label>
                  <select
                    value={testDates.HBV?.hasTaken ? 'true' : 'false'}
                    onChange={(e) => {
                      const hasTaken = e.target.value === 'true';
                      setTestDates(prev => ({
                        ...prev,
                        HBV: { hasTaken, testDate: hasTaken ? prev.HBV?.testDate || '' : '', result: hasTaken ? prev.HBV?.result : undefined }
                      }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {testDates.HBV?.hasTaken && (
                  <div className="space-y-2 mt-2">
                    <input
                      type="date"
                      value={testDates.HBV.testDate}
                      onChange={(e) => setTestDates(prev => ({
                        ...prev,
                        HBV: { ...prev.HBV!, testDate: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Test Date"
                    />
                    <select
                      value={testDates.HBV.result || ''}
                      onChange={(e) => setTestDates(prev => ({
                        ...prev,
                        HBV: { ...prev.HBV!, result: e.target.value as 'positive' | 'negative' | undefined }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Result</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="border-b border-teal-200 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    HCV Test
                  </label>
                  <select
                    value={testDates.HCV?.hasTaken ? 'true' : 'false'}
                    onChange={(e) => {
                      const hasTaken = e.target.value === 'true';
                      setTestDates(prev => ({
                        ...prev,
                        HCV: { hasTaken, testDate: hasTaken ? prev.HCV?.testDate || '' : '', result: hasTaken ? prev.HCV?.result : undefined }
                      }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {testDates.HCV?.hasTaken && (
                  <div className="space-y-2 mt-2">
                    <input
                      type="date"
                      value={testDates.HCV.testDate}
                      onChange={(e) => setTestDates(prev => ({
                        ...prev,
                        HCV: { ...prev.HCV!, testDate: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Test Date"
                    />
                    <select
                      value={testDates.HCV.result || ''}
                      onChange={(e) => setTestDates(prev => ({
                        ...prev,
                        HCV: { ...prev.HCV!, result: e.target.value as 'positive' | 'negative' | undefined }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Result</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="border-b border-teal-200 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    HIV Test
                  </label>
                  <select
                    value={testDates.HIV?.hasTaken ? 'true' : 'false'}
                    onChange={(e) => {
                      const hasTaken = e.target.value === 'true';
                      setTestDates(prev => ({
                        ...prev,
                        HIV: { hasTaken, testDate: hasTaken ? prev.HIV?.testDate || '' : '', result: hasTaken ? prev.HIV?.result : undefined }
                      }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {testDates.HIV?.hasTaken && (
                  <div className="space-y-2 mt-2">
                    <input
                      type="date"
                      value={testDates.HIV.testDate}
                      onChange={(e) => setTestDates(prev => ({
                        ...prev,
                        HIV: { ...prev.HIV!, testDate: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Test Date"
                    />
                    <select
                      value={testDates.HIV.result || ''}
                      onChange={(e) => setTestDates(prev => ({
                        ...prev,
                        HIV: { ...prev.HIV!, result: e.target.value as 'positive' | 'negative' | undefined }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Result</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="mb-4">
              <label className="block text-lg font-semibold text-purple-900 mb-2">
                Other Medical Tests + New Test
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setHasOtherTests(true);
                    if (!hasOtherTests) {
                      setOtherTests([]);
                      setCurrentTest({
                        testName: '',
                        testResult: ''
                      });
                    }
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    hasOtherTests
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasOtherTests(false);
                    setOtherTests([]);
                    setCurrentTest({
                      testName: '',
                      testResult: ''
                    });
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    !hasOtherTests
                      ? 'bg-gray-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {hasOtherTests && (
              <>
                <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Add New Test</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Name
                      </label>
                      <input
                        type="text"
                        value={currentTest.testName}
                        onChange={(e) => setCurrentTest({ ...currentTest, testName: e.target.value })}
                        placeholder="e.g., CBC, Liver Function"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Result
                      </label>
                      <input
                        type="text"
                        value={currentTest.testResult}
                        onChange={(e) => setCurrentTest({ ...currentTest, testResult: e.target.value })}
                        placeholder="e.g., Normal, Positive"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addOtherTest}
                    disabled={!currentTest.testName.trim() || !currentTest.testResult.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Test</span>
                  </button>
                </div>

                {otherTests.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700">Added Tests ({otherTests.length})</h5>
                    {otherTests.map((test, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Test:</span>
                              <span className="ml-1 text-gray-900">{test.testName}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Result:</span>
                              <span className="ml-1 text-gray-900">{test.testResult}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOtherTest(index)}
                            className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {patient ? 'Update Patient' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
