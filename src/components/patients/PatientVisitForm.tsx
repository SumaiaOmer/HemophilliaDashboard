import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Trash2 } from 'lucide-react';
import { PatientVisit, PatientVisitRequest, Patient, Factor, VisitDrug } from '../../types/api';
import { toDateInputValue } from '../../lib/dateUtils';
import { LookupsService, LookupItem } from '../../services/lookups';
interface PatientVisitFormProps {
  visit?: PatientVisit | null;
  patients: Patient[];
  factors: Factor[];
  onSave: (visit: PatientVisitRequest) => Promise<void>;
  onCancel: () => void;
}

const COMPLAINT_OPTIONS = [
  'Joint hemarthrosis',
  'Intracranial hemorrhage',
  'Iliopsoas hematoma',
  'Hematemesis',
  'Melena',
  'Gum bleeding',
  'Tooth extraction',
  'Tongue bleeding',
  'Epistaxis',
  'Hematuria',
  'Crush injury/RTA',
  'Hemorrhagic cyst',
  'Menorrhagia',
  'Subconjunctival bleeding',
  'Orbital hematoma',
  'Preoperative preparation/intervention',
  'Labour',
  'Circumcision',
  'Other',
];

const STATE_CENTERS: Record<string, string[]> = {
  'Khartoum': ['Khartoum Teaching Hospital', 'Omdurman Hospital', 'Bahri Hospital', 'Ibn Sina Hospital', 'Royal Care Hospital'],
  'Al Jazirah': ['Wad Madani Teaching Hospital', 'Al Managil Hospital'],
  'White Nile': ['Rabak Hospital', 'Kosti Hospital'],
  'Blue Nile': ['Ad-Damazin Hospital'],
  'Northern': ['Dongola Hospital', 'Merowe Hospital'],
  'River Nile': ['Atbara Teaching Hospital', 'Shendi Hospital'],
  'Red Sea': ['Port Sudan Teaching Hospital'],
  'Kassala': ['Kassala Teaching Hospital'],
  'Al Qadarif': ['Al Qadarif Hospital'],
  'Sennar': ['Sennar Hospital'],
  'North Kordofan': ['El Obeid Teaching Hospital'],
  'South Kordofan': ['Kadugli Hospital'],
  'West Kordofan': ['El Fula Hospital'],
  'Central Darfur': ['Zalingei Hospital'],
  'North Darfur': ['El Fasher Hospital'],
  'South Darfur': ['Nyala Teaching Hospital'],
  'East Darfur': ['Ed Daein Hospital'],
  'West Darfur': ['El Geneina Hospital']
};

// Mapping keyed by lookup `id` values for API lookups
const STATE_CENTERS_BY_ID: Record<string, string[]> = {
  'STATE_KHARTOUM': STATE_CENTERS['Khartoum'],
  'STATE_AL_JAZIRAH': STATE_CENTERS['Al Jazirah'],
  'STATE_WHITE_NILE': STATE_CENTERS['White Nile'],
  'STATE_BLUE_NILE': STATE_CENTERS['Blue Nile'],
  'STATE_NORTHERN': STATE_CENTERS['Northern'],
  'STATE_RIVER_NILE': STATE_CENTERS['River Nile'],
  'STATE_RED_SEA': STATE_CENTERS['Red Sea'],
  'STATE_KASSALA': STATE_CENTERS['Kassala'],
  'STATE_AL_QADARIF': STATE_CENTERS['Al Qadarif'],
  'STATE_SENNAR': STATE_CENTERS['Sennar'],
  'STATE_NORTH_KORDOFAN': STATE_CENTERS['North Kordofan'],
  'STATE_SOUTH_KORDOFAN': STATE_CENTERS['South Kordofan'],
  'STATE_WEST_KORDOFAN': STATE_CENTERS['West Kordofan'],
  'STATE_CENTRAL_DARFUR': STATE_CENTERS['Central Darfur'],
  'STATE_NORTH_DARFUR': STATE_CENTERS['North Darfur'],
  'STATE_SOUTH_DARFUR': STATE_CENTERS['South Darfur'],
  'STATE_EAST_DARFUR': STATE_CENTERS['East Darfur'],
  'STATE_WEST_DARFUR': STATE_CENTERS['West Darfur']
};

export const PatientVisitForm: React.FC<PatientVisitFormProps> = ({
  visit,
  patients,
  factors,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PatientVisitRequest>({
    patientId: 0,
    visitDate: toDateInputValue(new Date().toISOString()),
    diagnosis: '',
    diagnosisType: '',
    centerState: '',
    state: '',
    centerName: '',
    visitType: undefined,
    serviceType: 'followup',
    complaint: '',
    complaintOther: '',
    complaintDetails: '',
    notes: '',
    enteredBy: '',
    vitalStatus: undefined,
    managementPlan: '',
    drugs: [],
  });

  const [followUpDate, setFollowUpDate] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const patientSearchRef = useRef<HTMLDivElement>(null);
  const [vitalStatusOptions, setVitalStatusOptions] = useState<LookupItem[]>([
    { id: 'Alive', name: 'Alive', type: 'VitalStatuses' },
    { id: 'Died', name: 'Died', type: 'VitalStatuses' },
    { id: 'Unknown', name: 'Unknown', type: 'VitalStatuses' }
  ]);
  const [visitTypeOptions, setVisitTypeOptions] = useState<LookupItem[]>([
    { id: 'telephone_consultation', name: 'Telephone Consultation', type: 'VisitTypes' },
    { id: 'center_visit', name: 'Center Visit', type: 'VisitTypes' }
  ]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<LookupItem[]>([
    { id: 'new_visit', name: 'New Visit', type: 'ServiceTypes' },
    { id: 'followup', name: 'Follow-up', type: 'ServiceTypes' },
    { id: 'hospital_admission', name: 'Hospital Admission', type: 'ServiceTypes' }
  ]);
  const [complaintOptions, setComplaintOptions] = useState<LookupItem[]>(COMPLAINT_OPTIONS.map(option => ({ id: option, name: option, type: 'Complaints' })));
  const DEFAULT_SUDAN_STATES = [
    { id: 'Khartoum', name: 'Khartoum', type: 'SudanStates' },
    { id: 'Al Jazirah', name: 'Al Jazirah', type: 'SudanStates' },
    { id: 'White Nile', name: 'White Nile', type: 'SudanStates' },
    { id: 'Blue Nile', name: 'Blue Nile', type: 'SudanStates' },
    { id: 'Northern', name: 'Northern', type: 'SudanStates' },
    { id: 'River Nile', name: 'River Nile', type: 'SudanStates' },
    { id: 'Red Sea', name: 'Red Sea', type: 'SudanStates' },
    { id: 'Kassala', name: 'Kassala', type: 'SudanStates' },
    { id: 'Al Qadarif', name: 'Al Qadarif', type: 'SudanStates' },
    { id: 'Sennar', name: 'Sennar', type: 'SudanStates' },
    { id: 'North Kordofan', name: 'North Kordofan', type: 'SudanStates' },
    { id: 'South Kordofan', name: 'South Kordofan', type: 'SudanStates' },
    { id: 'West Kordofan', name: 'West Kordofan', type: 'SudanStates' },
    { id: 'Central Darfur', name: 'Central Darfur', type: 'SudanStates' },
    { id: 'North Darfur', name: 'North Darfur', type: 'SudanStates' },
    { id: 'South Darfur', name: 'South Darfur', type: 'SudanStates' },
    { id: 'East Darfur', name: 'East Darfur', type: 'SudanStates' },
    { id: 'West Darfur', name: 'West Darfur', type: 'SudanStates' }
  ];
  const [sudanStates, setSudanStates] = useState<LookupItem[]>(DEFAULT_SUDAN_STATES);

  useEffect(() => {
    if (visit) {
      const visitDate = visit.visitDate ? toDateInputValue(visit.visitDate) : '';
      const patient = patients.find(p => p.id === visit.patientId);

      let serviceType: 'new_visit' | 'followup' | 'hospital_admission' = 'followup';
      if (visit.serviceType) {
        serviceType = visit.serviceType;
      } else if (visit.diagnosisType) {
        if (visit.diagnosisType === 'new_patient') serviceType = 'new_visit';
        else if (visit.diagnosisType === 'admission') serviceType = 'hospital_admission';
        else if (visit.diagnosisType === 'followup') serviceType = 'followup';
      }

      setFormData({
        patientId: visit.patientId,
        visitDate,
        diagnosis: visit.diagnosis || '',
        diagnosisType: visit.diagnosisType || '',
        centerState: visit.centerState || '',
        state: visit.centerState || '',
        centerName: visit.centerName || '',
        visitType: visit.visitType,
        serviceType,
        complaint: visit.complaint || '',
        complaintOther: visit.complaintOther || '',
        complaintDetails: visit.complaintDetails || '',
        notes: visit.notes || '',
        enteredBy: visit.enteredBy || '',
        vitalStatus: visit.vitalStatus || 'Alive',
        managementPlan: visit.managementPlan || '',
        drugs: visit.drugs || [],
      });

      if (patient) {
        setPatientSearch(`${patient.fullName} - ${patient.nationalIdNumber}`);
      }
    }
  }, [visit, patients]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadLookupOptions = async () => {
      const [vitalStatusLookup, visitTypeLookup, serviceTypeLookup, complaintsLookup, sudanStatesLookup] = await Promise.all([
        LookupsService.getByType('VitalStatuses'),
        LookupsService.getByType('VisitTypes'),
        LookupsService.getByType('ServiceTypes'),
        LookupsService.getByType('Complaints'),
        LookupsService.getByType('SudanStates'),
      ]);

      if (vitalStatusLookup.length > 0) {
        setVitalStatusOptions(vitalStatusLookup);
      }
      if (visitTypeLookup.length > 0) {
        setVisitTypeOptions(visitTypeLookup);
      }
      if (serviceTypeLookup.length > 0) {
        setServiceTypeOptions(serviceTypeLookup);
      }
      if (complaintsLookup.length > 0) {
        setComplaintOptions(complaintsLookup);
      }
      if (sudanStatesLookup.length > 0) {
        setSudanStates(sudanStatesLookup.map(item => item.name).filter(Boolean));
      }
    };
    loadLookupOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let notesWithFollowUp = formData.notes || '';
      if (formData.serviceType === 'hospital_admission' && followUpDate) {
        const followUpText = `\nFollow-up Date: ${(() => { const d = new Date(followUpDate); const off = d.getTimezoneOffset(); const adj = new Date(d.getTime() + off * 60000); return `${String(adj.getDate()).padStart(2,'0')}/${String(adj.getMonth()+1).padStart(2,'0')}/${adj.getFullYear()}`; })()}`;
        notesWithFollowUp = notesWithFollowUp ? `${notesWithFollowUp}${followUpText}` : followUpText.trim();
      }

      const processDrugs = formData.visitType === 'center_visit' && formData.drugs && formData.drugs.length > 0
        ? formData.drugs.map(drug => ({
            drugId: drug.factorId || 0,
            quantity: drug.quantity || 0
          }))
        : undefined;

      const submitData: PatientVisitRequest = {
        patientId: formData.patientId,
        visitDate: new Date(formData.visitDate).toISOString(),
        diagnosis: formData.diagnosis || undefined,
        diagnosisType: formData.diagnosisType || undefined,
        visitType: formData.visitType,
        complaint: formData.complaint || undefined,
        centerState: formData.centerState || undefined,
        state: formData.state || undefined,
        centerName: formData.centerName || undefined,
        notes: notesWithFollowUp || undefined,
        enteredBy: formData.enteredBy || undefined,
        vitalStatus: formData.vitalStatus,
        managementPlan: formData.managementPlan || undefined,
        drugs: processDrugs,
      };

      await onSave(submitData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save visit';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'centerState') {
      setFormData(prev => ({
        ...prev,
        centerState: value || undefined,
        state: value || undefined,
        centerName: ''
      }));
    } else if (name === 'visitType') {
      setFormData(prev => ({
        ...prev,
        visitType: value as 'telephone_consultation' | 'center_visit' | undefined,
        ...(value !== 'center_visit' ? { drugs: undefined } : {})
      }));
    } else if (name === 'serviceType') {
      setFormData(prev => ({
        ...prev,
        serviceType: value as 'new_visit' | 'followup' | 'hospital_admission'
      }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseInt(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value || undefined }));
    }
  };



  const addDrug = () => {
    setFormData(prev => ({
      ...prev,
      drugs: [...(prev.drugs || []), {
        drugType: '',
        concentration: 0,
        quantity: 0,
        lotNumber: '',
        factorId: 0
      }]
    }));
  };

  const removeDrug = (index: number) => {
    setFormData(prev => ({
      ...prev,
      drugs: (prev.drugs || []).filter((_, i) => i !== index)
    }));
  };

  const updateDrug = (index: number, field: keyof VisitDrug, value: any) => {
    setFormData(prev => {
      const drugs = [...(prev.drugs || [])];
      if (field === 'factorId' && value) {
        const selectedFactor = factors.find(f => f.id === parseInt(value, 10));
        if (selectedFactor) {
          drugs[index] = {
            ...drugs[index],
            factorId: selectedFactor.id,
            drugType: selectedFactor.drugType,
            concentration: selectedFactor.mg,
            lotNumber: selectedFactor.lotNo
          };
        }
      } else {
        drugs[index] = { ...drugs[index], [field]: value };
      }
      return { ...prev, drugs };
    });
  };

  const availableCenters = formData.centerState ? STATE_CENTERS[formData.centerState] || [] : [];
  const selectedPatient = patients.find(p => p.id === formData.patientId);

  const filteredPatients = patients.filter(patient => {
    const searchLower = patientSearch.toLowerCase();
    return (
      patient.fullName?.toLowerCase().includes(searchLower) ||
      patient.nationalIdNumber?.toLowerCase().includes(searchLower) ||
      `${patient.fullName} - ${patient.nationalIdNumber}`.toLowerCase().includes(searchLower)
    );
  });

  const handlePatientSelect = (patient: Patient) => {
    setFormData(prev => ({ ...prev, patientId: patient.id, ...(visit ? { vitalStatus: patient.vitalStatus || 'Alive' } : {}) }));
    setPatientSearch(`${patient.fullName} - ${patient.nationalIdNumber}`);
    setShowPatientDropdown(false);
  };

  const handlePatientSearchChange = (value: string) => {
    setPatientSearch(value);
    setShowPatientDropdown(true);
    if (!value) {
      setFormData(prev => ({ ...prev, patientId: 0 }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-5xl my-8 shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
          <h3 className="text-xl font-semibold text-gray-800">
            {visit ? 'Edit Patient Visit' : 'Add New Patient Visit'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 m-6 mb-0">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div ref={patientSearchRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                {patients.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-red-300 bg-red-50 rounded-lg text-sm text-red-600">
                    No patients available. Please add patients first.
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => handlePatientSearchChange(e.target.value)}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Search by name or ID..."
                      required={formData.patientId === 0}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                  </div>
                )}
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPatients.map(patient => (
                      <div
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className={`px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors ${
                          formData.patientId === patient.id ? 'bg-red-100' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{patient.fullName}</div>
                        <div className="text-sm text-gray-600">{patient.nationalIdNumber}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Date *
                </label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {visit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vital Status
                  </label>
                  <select
                    name="vitalStatus"
                    value={formData.vitalStatus ?? 'Alive'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  >
                    <option value="">Select Status</option>
                    {vitalStatusOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Type *
                </label>
                <select
                  name="visitType"
                  value={formData.visitType || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">Select Visit Type</option>
                  {visitTypeOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">Select Service Type</option>
                  {serviceTypeOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Center State *
                </label>
                <select
                  name="centerState"
                  value={formData.centerState}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">Select State</option>
                  {sudanStates.map(state => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Center Name *
                </label>
                <select
                  name="centerName"
                  value={formData.centerName}
                  onChange={handleChange}
                  required
                  disabled={!formData.centerState}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.centerState ? 'Select Center' : 'Select State First'}</option>
                  {availableCenters.map(center => (
                    <option key={center} value={center}>{center}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entered By *
                </label>
                <input
                  type="text"
                  name="enteredBy"
                  value={formData.enteredBy}
                  onChange={handleChange}
                  required
            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Staff name"
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-900 mb-4">Complaint Information</h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complaint
              </label>
              <select
                name="complaint"
                value={formData.complaint || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              >
                <option value="">Select Complaint</option>
                {complaintOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.complaint === 'Other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify complaint
                </label>
                <input
                  type="text"
                  name="complaintOther"
                  value={formData.complaintOther}
                  onChange={handleChange}
                  placeholder="Describe the complaint"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Details
              </label>
              <textarea
                name="complaintDetails"
                value={formData.complaintDetails}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Detailed description of the complaint"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Management Plan
              </label>
              <textarea
                name="managementPlan"
                value={formData.managementPlan}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Describe the management plan for this patient visit..."
              />
            </div>
          </div>



          {formData.visitType === 'center_visit' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-orange-900">Drug Treatment Details</h4>
                <button
                  type="button"
                  onClick={addDrug}
                  className="flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Drug</span>
                </button>
              </div> 

            {formData.drugs && formData.drugs.length > 0 ? (
              <div className="space-y-4">
                {formData.drugs.map((drug, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-gray-800">Drug #{index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeDrug(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select from Inventory (Optional)
                        </label>
                        <select
                          value={drug.factorId || ''}
                          onChange={(e) => updateDrug(index, 'factorId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="">Select a drug from inventory</option>
                          {factors.filter(f => f.quantity > 0).map(factor => (
                            <option key={factor.id} value={factor.id}>
                              {factor.name} - {factor.drugType} ({factor.mg} mg) - Stock: {factor.quantity}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Drug Type *
                        </label>
                        <input
                          type="text"
                          value={drug.drugType}
                          onChange={(e) => updateDrug(index, 'drugType', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="e.g., Factor VIII"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Concentration (mg) *
                        </label>
                        <input
                          type="number"
                          value={drug.concentration}
                          onChange={(e) => updateDrug(index, 'concentration', parseFloat(e.target.value) || 0)}
                          required
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Concentration"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          value={drug.quantity}
                          onChange={(e) => updateDrug(index, 'quantity', parseInt(e.target.value) || 0)}
                          required
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Quantity"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lot Number
                        </label>
                        <input
                          type="text"
                          value={drug.lotNumber || ''}
                          onChange={(e) => updateDrug(index, 'lotNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Lot number"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No drug entries. Click "Add Drug" to add one.</p>
            )}
          </div>
          )}


          {formData.serviceType === 'hospital_admission' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-indigo-900 mb-4">Follow-up Information</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Additional notes about the visit"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={patients.length === 0 || formData.patientId === 0 || isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{visit ? 'Update Visit' : 'Create Visit'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};