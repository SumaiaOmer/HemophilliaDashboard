import React, { useState, useEffect, useRef } from 'react';
import { X, Search, AlertCircle, FileText } from 'lucide-react';
import {
  DeathNotification,
  DeathNotificationCreateRequest,
  Patient,
} from '../../types/api';
import { toDateInputValue, toISOStringFromDateInput } from '../../lib/dateUtils';
import { DeathNotificationsService } from '../../services/deathNotifications';
import { PatientsService } from '../../services/patients';

interface DeathNotificationFormProps {
  notification?: DeathNotification | null;
  patients: Patient[];
  onSave: (notification: DeathNotificationCreateRequest) => Promise<void>;
  onCancel: () => void;
}

const DEATH_CAUSES = [
  'Intracranial hemorrhage',
  'Gastrointestinal bleeding',
  'Severe joint bleeding',
  'Hemorrhagic shock',
  'Sepsis',
  'Liver failure',
  'Complications of inhibitor development',
  'Other',
];

const PLACE_OF_DEATH = [
  'Home',
  'Khartoum Teaching Hospital',
  'Omdurman Hospital',
  'Royal Care Hospital',
  'Ibn Sina Hospital',
  'Bahri Hospital',
  'Wad Madani Teaching Hospital',
  'Port Sudan Teaching Hospital',
  'El Obeid Teaching Hospital',
  'Nyala Teaching Hospital',
  'El Fasher Hospital',
  'Other',
];

export const DeathNotificationForm: React.FC<DeathNotificationFormProps> = ({
  notification,
  patients,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<DeathNotificationCreateRequest>({
    patientId: 0,
    reporterName: '',
    reporterRelation: 'Family Member',
    reporterPhone: '',
    reportDate: toDateInputValue(new Date().toISOString()),
    dateOfDeath: toDateInputValue(new Date().toISOString()),
    placeOfDeath: '',
    directCauseOfDeath: '',
    underlyingCauseOfDeath: '',
    isDeathRelatedToBleedingDisorder: true,
    complicationType: '',
    receivedClottingFactors: false,
    lastDoseDate: '',
    caseSummary: '',
    recommendations: '',
    surveillanceOfficerName: '',
    surveillanceOfficerSignature: '',
    programDirectorName: '',
    programDirectorSignature: '',
    causeOfDeath: '',
    notifiedBy: '',
    notificationDate: toDateInputValue(new Date().toISOString()),
    notes: '',
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [availablePatients, setAvailablePatients] = useState<Patient[]>(patients);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [patientAlreadyNotified, setPatientAlreadyNotified] = useState(false);
  const patientSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notification) {
      setFormData({
        patientId: notification.patientId,
        reporterName: (notification as any).reporterName || notification.notifiedBy || '',
        reporterRelation: (notification as any).reporterRelation || 'Family Member',
        reporterPhone: (notification as any).reporterPhone || '',
        reportDate: toDateInputValue((notification as any).reportDate || notification.notificationDate || notification.dateOfDeath),
        dateOfDeath: toDateInputValue(notification.dateOfDeath),
        placeOfDeath: notification.placeOfDeath || '',
        directCauseOfDeath: (notification as any).directCauseOfDeath || notification.causeOfDeath || '',
        underlyingCauseOfDeath: (notification as any).underlyingCauseOfDeath || notification.causeOfDeath || '',
        isDeathRelatedToBleedingDisorder: (notification as any).isDeathRelatedToBleedingDisorder ?? true,
        complicationType: (notification as any).complicationType || notification.causeOfDeath || '',
        receivedClottingFactors: (notification as any).receivedClottingFactors ?? false,
        lastDoseDate: (notification as any).lastDoseDate || '',
        caseSummary: (notification as any).caseSummary || notification.notes || '',
        recommendations: (notification as any).recommendations || '',
        surveillanceOfficerName: (notification as any).surveillanceOfficerName || '',
        surveillanceOfficerSignature: (notification as any).surveillanceOfficerSignature || '',
        programDirectorName: (notification as any).programDirectorName || '',
        programDirectorSignature: (notification as any).programDirectorSignature || '',
        causeOfDeath: notification.causeOfDeath || '',
        notifiedBy: notification.notifiedBy || '',
        notificationDate: toDateInputValue(notification.notificationDate || new Date().toISOString()),
        notes: notification.notes || '',
      });
      setReferenceNumber(notification.referenceNumber || null);

      const patient = patients.find((p) => p.id === notification.patientId);
      if (patient) {
        setPatientSearch(`${patient.fullName} - ${patient.nationalIdNumber}`);
      }
    } else {
      setFormData({
        patientId: 0,
        reporterName: '',
        reporterRelation: 'Family Member',
        reporterPhone: '',
        reportDate: toDateInputValue(new Date().toISOString()),
        dateOfDeath: toDateInputValue(new Date().toISOString()),
        placeOfDeath: '',
        directCauseOfDeath: '',
        underlyingCauseOfDeath: '',
        isDeathRelatedToBleedingDisorder: true,
        complicationType: '',
        receivedClottingFactors: false,
        lastDoseDate: '',
        caseSummary: '',
        recommendations: '',
        surveillanceOfficerName: '',
        surveillanceOfficerSignature: '',
        programDirectorName: '',
        programDirectorSignature: '',
        causeOfDeath: '',
        notifiedBy: '',
        notificationDate: toDateInputValue(new Date().toISOString()),
        notes: '',
      });
      setReferenceNumber(null);
    }
  }, [notification, patients]);

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
    setAvailablePatients(patients);
  }, [patients]);

  useEffect(() => {
    if (patients.length > 0) return;

    let isCancelled = false;
    PatientsService.getAll()
      .then((data) => {
        if (!isCancelled) {
          setAvailablePatients(data);
        }
      })
      .catch((err) => {
        console.error('Error loading patients for death notification form:', err);
        if (!isCancelled) {
          setAvailablePatients([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [patients.length]);

  useEffect(() => {
    if (!notification && formData.patientId > 0) {
      DeathNotificationsService.patientHasRecord(formData.patientId)
        .then(setPatientAlreadyNotified)
        .catch(() => setPatientAlreadyNotified(false));
    } else {
      setPatientAlreadyNotified(false);
    }
  }, [formData.patientId, notification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.patientId === 0) {
      setError('Please select a patient');
      return;
    }

    if (!formData.dateOfDeath) {
      setError('Date of death is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: DeathNotificationCreateRequest = {
        patientId: formData.patientId,
        reporterName: formData.reporterName || formData.notifiedBy || undefined,
        reporterRelation: formData.reporterRelation || 'Family Member',
        reporterPhone: formData.reporterPhone || undefined,
        reportDate: formData.reportDate || formData.notificationDate || formData.dateOfDeath,
        dateOfDeath: formData.dateOfDeath || undefined,
        placeOfDeath: formData.placeOfDeath || undefined,
        directCauseOfDeath: formData.directCauseOfDeath || formData.causeOfDeath || undefined,
        underlyingCauseOfDeath: formData.underlyingCauseOfDeath || formData.causeOfDeath || undefined,
        isDeathRelatedToBleedingDisorder: formData.isDeathRelatedToBleedingDisorder ?? true,
        complicationType: formData.complicationType || formData.causeOfDeath || undefined,
        receivedClottingFactors: formData.receivedClottingFactors ?? false,
        lastDoseDate: formData.lastDoseDate || undefined,
        caseSummary: formData.caseSummary || formData.notes || undefined,
        recommendations: formData.recommendations || undefined,
        surveillanceOfficerName: formData.surveillanceOfficerName || undefined,
        surveillanceOfficerSignature: formData.surveillanceOfficerSignature || undefined,
        programDirectorName: formData.programDirectorName || undefined,
        programDirectorSignature: formData.programDirectorSignature || undefined,
        causeOfDeath: formData.causeOfDeath || undefined,
        notifiedBy: formData.notifiedBy || undefined,
        notificationDate: formData.notificationDate || undefined,
        notes: formData.notes || undefined,
      };
      await onSave(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save death notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || undefined }));
  };

  const handlePatientSelect = (patient: Patient) => {
    setFormData((prev) => ({ ...prev, patientId: patient.id }));
    setPatientSearch(`${patient.fullName} - ${patient.nationalIdNumber}`);
    setShowPatientDropdown(false);
  };

  const handlePatientSearchChange = (value: string) => {
    setPatientSearch(value);
    setShowPatientDropdown(true);
    if (!value) {
      setFormData((prev) => ({ ...prev, patientId: 0 }));
    }
  };

  const handleGenerateReference = async () => {
    try {
      const ref = await DeathNotificationsService.generateReference();
      if (ref) setReferenceNumber(ref);
    } catch (err) {
      console.error('Error generating reference:', err);
    }
  };

  const filteredPatients = availablePatients.filter((patient) => {
    const searchLower = patientSearch.toLowerCase();
    return (
      patient.fullName?.toLowerCase().includes(searchLower) ||
      patient.nationalIdNumber?.toLowerCase().includes(searchLower) ||
      `${patient.fullName} - ${patient.nationalIdNumber}`.toLowerCase().includes(searchLower)
    );
  });

  const selectedPatient = availablePatients.find((p) => p.id === formData.patientId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-3xl my-8 shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
          <h3 className="text-xl font-semibold text-gray-800">
            {notification ? 'Edit Death Notification' : 'Add Death Notification'}
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
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {referenceNumber && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-600">Reference Number</p>
                  <p className="font-semibold text-red-700">{referenceNumber}</p>
                </div>
              </div>
              {!notification && (
                <button
                  type="button"
                  onClick={handleGenerateReference}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Regenerate
                </button>
              )}
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
            <div ref={patientSearchRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient *
              </label>
              {availablePatients.length === 0 ? (
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
                    placeholder="Search by name or national ID..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
              )}
              {showPatientDropdown && filteredPatients.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredPatients.map((patient) => (
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

            {patientAlreadyNotified && !notification && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  This patient already has a death notification on record.
                </p>
              </div>
            )}

            {selectedPatient && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{selectedPatient.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">National ID:</span>
                  <span className="font-medium text-gray-900">
                    {selectedPatient.nationalIdNumber || 'N/A'}
                  </span>
                </div>
                {selectedPatient.diagnosis && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diagnosis:</span>
                    <span className="font-medium text-gray-900">{selectedPatient.diagnosis}</span>
                  </div>
                )}
                {selectedPatient.severity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Severity:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {selectedPatient.severity}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Death *
                </label>
                <input
                  type="date"
                  name="dateOfDeath"
                  value={formData.dateOfDeath}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Date
                </label>
                <input
                  type="date"
                  name="notificationDate"
                  value={formData.notificationDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cause of Death
                </label>
                <select
                  name="causeOfDeath"
                  value={formData.causeOfDeath || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">Select cause (if known)</option>
                  {DEATH_CAUSES.map((cause) => (
                    <option key={cause} value={cause}>
                      {cause}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Place of Death
                </label>
                <select
                  name="placeOfDeath"
                  value={formData.placeOfDeath || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">Select place (if known)</option>
                  {PLACE_OF_DEATH.map((place) => (
                    <option key={place} value={place}>
                      {place}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notified By
              </label>
              <input
                type="text"
                name="notifiedBy"
                value={formData.notifiedBy || ''}
                onChange={handleChange}
                placeholder="Name of person who reported the death"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Additional notes about this notification"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              />
            </div>
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
              disabled={availablePatients.length === 0 || formData.patientId === 0 || isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{notification ? 'Update Notification' : 'Create Notification'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
