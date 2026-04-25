import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, User, MapPin, Pill, AlertCircle } from 'lucide-react';
import { PatientVisit, Patient, Factor } from '../../types/api';
import { PatientVisitsService } from '../../services/patientVisits';
import { formatDate } from '../../lib/dateUtils';

interface PatientVisitDetailsProps {
  visitId: number;
  patient: Patient | undefined;
  factors: Factor[];
  onClose: () => void;
}

export const PatientVisitDetails: React.FC<PatientVisitDetailsProps> = ({
  visitId,
  patient,
  factors,
  onClose,
}) => {
  const [visit, setVisit] = useState<PatientVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVisitDetails();
  }, [visitId]);

  const loadVisitDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const visitData = await PatientVisitsService.getById(visitId);
      setVisit(visitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };


  const getDrugName = (drugId: number) => {
    const factor = factors.find(f => f.id === drugId);
    return factor?.name || `Drug ID: ${drugId}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex items-start mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Error Loading Details</h3>
              <p className="text-sm text-gray-600 mt-1">{error || 'Visit not found'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-gray-900">Visit Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Information */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Patient Information
            </h3>
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <p className="text-xs text-gray-600">Full Name</p>
                    <p className="font-semibold text-gray-900">{patient?.fullName || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <p className="text-xs text-gray-600">National ID</p>
                    <p className="font-semibold text-gray-900">{patient?.nationalIdNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <p className="text-xs text-gray-600">Date of Birth</p>
                    <p className="font-semibold text-gray-900">
                      {patient?.dateOfBirth ? formatDate(patient.dateOfBirth) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <p className="text-xs text-gray-600">Age</p>
                    <p className="font-semibold text-gray-900">{patient?.age || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <p className="text-xs text-gray-600">Gender</p>
                    <p className="font-semibold text-gray-900">{patient?.gender || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-100">
                    <p className="text-xs text-gray-600">Marital Status</p>
                    <p className="font-semibold text-gray-900">{patient?.maritalStatus || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Contact & Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {patient?.contactNumber1 && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Primary Contact</p>
                      <p className="font-semibold text-gray-900">{patient.contactNumber1}</p>
                    </div>
                  )}
                  {patient?.contactNumber2 && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Secondary Contact</p>
                      <p className="font-semibold text-gray-900">{patient.contactNumber2}</p>
                    </div>
                  )}
                  {patient?.homeState && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Home State</p>
                      <p className="font-semibold text-gray-900">{patient.homeState}</p>
                    </div>
                  )}
                  {patient?.homeCityOrTown && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Home City/Town</p>
                      <p className="font-semibold text-gray-900">{patient.homeCityOrTown}</p>
                    </div>
                  )}
                  {patient?.homeLocality && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Home Locality</p>
                      <p className="font-semibold text-gray-900">{patient.homeLocality}</p>
                    </div>
                  )}
                  {patient?.residenceType && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Residence Type</p>
                      <p className="font-semibold text-gray-900">{patient.residenceType === 'InsideSudan' ? 'Inside Sudan' : 'Outside Sudan'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Medical Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {patient?.diagnosis && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Diagnosis</p>
                      <p className="font-semibold text-gray-900">{patient.diagnosis}</p>
                    </div>
                  )}
                  {patient?.diagnosisType && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Diagnosis Type</p>
                      <p className="font-semibold text-gray-900">{patient.diagnosisType}</p>
                    </div>
                  )}
                  {patient?.diagnosisYear && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Diagnosis Year</p>
                      <p className="font-semibold text-gray-900">{patient.diagnosisYear}</p>
                    </div>
                  )}
                  {patient?.severity && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Severity</p>
                      <p className="font-semibold text-gray-900 capitalize">{patient.severity}</p>
                    </div>
                  )}
                  {patient?.factorPercent !== undefined && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Factor Percent</p>
                      <p className="font-semibold text-gray-900">{patient.factorPercent}%</p>
                    </div>
                  )}
                  {patient?.factorPercentDate && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Factor Percent Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(patient.factorPercentDate)}</p>
                    </div>
                  )}
                  {patient?.bloodGroup && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Blood Group</p>
                      <p className="font-semibold text-gray-900">{patient.bloodGroup}</p>
                    </div>
                  )}
                  {patient?.incidenceDate && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Incidence Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(patient.incidenceDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Health Status */}
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Health Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {patient?.vitalStatus && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Vital Status</p>
                      <p className={`font-semibold ${patient.vitalStatus === 'Died' ? 'text-red-600' : patient.vitalStatus === 'Alive' ? 'text-green-600' : 'text-gray-600'}`}>
                        {patient.vitalStatus}
                      </p>
                    </div>
                  )}
                  {patient?.hasInhibitors !== undefined && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Has Inhibitors</p>
                      <p className="font-semibold text-gray-900">{patient.hasInhibitors ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {patient?.inhibitorLevel !== undefined && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Inhibitor Level</p>
                      <p className="font-semibold text-gray-900">{patient.inhibitorLevel}</p>
                    </div>
                  )}
                  {patient?.inhibitorScreeningDate && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Inhibitor Screening Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(patient.inhibitorScreeningDate)}</p>
                    </div>
                  )}
                  {patient?.hasHBVVaccination !== undefined && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">HBV Vaccination</p>
                      <p className="font-semibold text-gray-900">{patient.hasHBVVaccination ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {patient?.hasHealthInsurance !== undefined && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Health Insurance</p>
                      <p className="font-semibold text-gray-900">{patient.hasHealthInsurance ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {patient?.insuranceProvider && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Insurance Provider</p>
                      <p className="font-semibold text-gray-900">{patient.insuranceProvider}</p>
                    </div>
                  )}
                  {patient?.isCircumcised !== undefined && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Circumcised</p>
                      <p className="font-semibold text-gray-900">{patient.isCircumcised ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {patient?.longTermMedication !== undefined && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Long-term Medication</p>
                      <p className="font-semibold text-gray-900">{patient.longTermMedication ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {patient?.occupation && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Occupation</p>
                      <p className="font-semibold text-gray-900">{patient.occupation}</p>
                    </div>
                  )}
                  {patient?.familyHistory && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Family History</p>
                      <p className="font-semibold text-gray-900">{patient.familyHistory.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {patient?.hemophiliaCenterId && (
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <p className="text-xs text-gray-600">Hemophilia Center ID</p>
                      <p className="font-semibold text-gray-900">{patient.hemophiliaCenterId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chronic Diseases */}
              {patient?.chronicDiseases && patient.chronicDiseases.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Chronic Diseases</h4>
                  <div className="bg-white p-3 rounded border border-blue-100">
                    <div className="flex flex-wrap gap-2">
                      {patient.chronicDiseases.map((disease, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {disease}
                        </span>
                      ))}
                    </div>
                    {patient.chronicDiseaseOther && (
                      <p className="text-xs text-gray-600 mt-2">Other: {patient.chronicDiseaseOther}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visit Information */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Visit Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Visit Date</p>
                <p className="font-semibold text-gray-900">{formatDate(visit.visitDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Visit Type</p>
                <p className="font-semibold text-gray-900">
                  {visit.visitType ? visit.visitType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                </p>
              </div>
              {visit.serviceType && (
                <div>
                  <p className="text-sm text-gray-600">Service Type</p>
                  <p className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                    {visit.serviceType === 'new_visit'
                      ? 'New Visit'
                      : visit.serviceType === 'hospital_admission'
                        ? 'Hospital Admission'
                        : 'Follow-up'}
                  </p>
                </div>
              )}
              {visit.centerName && (
                <div>
                  <p className="text-sm text-gray-600">Center Name</p>
                  <p className="font-semibold text-gray-900">{visit.centerName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Information */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              Clinical Information
            </h3>
            <div className="space-y-4">
              {visit.complaint && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Chief Complaint</p>
                  <p className="text-gray-900 bg-white p-3 rounded border border-purple-100">
                    {visit.complaint}
                    {visit.complaint === 'Other' && visit.complaintOther && ` - ${visit.complaintOther}`}
                  </p>
                </div>
              )}

              {visit.diagnosis && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Diagnosis</p>
                  <p className="text-gray-900 bg-white p-3 rounded border border-purple-100">
                    {visit.diagnosis}
                  </p>
                </div>
              )}

              {visit.diagnosisType && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Diagnosis Type</p>
                  <p className="font-semibold text-gray-900">{visit.diagnosisType}</p>
                </div>
              )}

              {visit.vitalStatus && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Vital Status</p>
                  <p className={`font-semibold ${visit.vitalStatus === 'Died' ? 'text-red-600' : 'text-green-600'}`}>
                    {visit.vitalStatus}
                  </p>
                </div>
              )}

              {visit.managementPlan && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Management Plan</p>
                  <p className="text-gray-900 bg-white p-3 rounded border border-purple-100">
                    {visit.managementPlan}
                  </p>
                </div>
              )}

              {visit.notes && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Notes</p>
                  <p className="text-gray-900 bg-white p-3 rounded border border-purple-100">
                    {visit.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Medications */}
          {visit.drugs && visit.drugs.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Pill className="h-5 w-5 mr-2 text-yellow-600" />
                Medications Administered ({visit.drugs.length})
              </h3>
              <div className="space-y-2">
                {visit.drugs.map((drug, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-yellow-200">
                    <p className="font-semibold text-gray-900">{getDrugName(drug.drugId)}</p>
                    <p className="text-sm text-gray-600">Quantity: {drug.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Medical Tests */}
          {visit.otherMedicalTests && visit.otherMedicalTests.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-orange-600" />
                Other Medical Tests ({visit.otherMedicalTests.length})
              </h3>
              <div className="space-y-2">
                {visit.otherMedicalTests.map((test, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-orange-200">
                    <p className="font-semibold text-gray-900">{test.testName}</p>
                    <p className="text-sm text-gray-600">Result: {test.testResult}</p>
                    <p className="text-xs text-gray-500">Date: {formatDate(test.testDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inhibitors */}
          {visit.inhibitors && visit.inhibitors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                Inhibitor Screening ({visit.inhibitors.length})
              </h3>
              <div className="space-y-2">
                {visit.inhibitors.map((inhibitor, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-red-200">
                    {inhibitor.inhibitorLevel !== undefined && (
                      <p className="text-sm text-gray-600">
                        Level: <span className="font-semibold text-gray-900">{inhibitor.inhibitorLevel}</span>
                      </p>
                    )}
                    {inhibitor.inhibitorScreeningDate && (
                      <p className="text-xs text-gray-500">
                        Date: {formatDate(inhibitor.inhibitorScreeningDate)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {visit.enteredBy && (
                <div>
                  <p className="text-gray-600">Entered By</p>
                  <p className="font-semibold text-gray-900">{visit.enteredBy}</p>
                </div>
              )}
              {visit.centerState && (
                <div>
                  <p className="text-gray-600">Center State</p>
                  <p className="font-semibold text-gray-900">{visit.centerState}</p>
                </div>
              )}
              {visit.createdAt && (
                <div>
                  <p className="text-gray-600">Record Created</p>
                  <p className="font-semibold text-gray-900">{formatDate(visit.createdAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
