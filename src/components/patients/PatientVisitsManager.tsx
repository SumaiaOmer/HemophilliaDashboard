import React, { useState, useEffect } from 'react';
import { Plus, Calendar, FileText, User, MapPin, Pill } from 'lucide-react';
import { PatientVisit, PatientVisitRequest, Patient, Factor } from '../../types/api';
import { PatientVisitsService } from '../../services/patientVisits';
import { PatientsService } from '../../services/patients';
import { FactorsService } from '../../services/factors';
import { PatientVisitForm } from './PatientVisitForm';
import { PatientVisitDetails } from './PatientVisitDetails';
import { formatDate } from '../../lib/dateUtils';

export const PatientVisitsManager: React.FC = () => {
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [visitsData, patientsData, factorsData] = await Promise.all([
        PatientVisitsService.getAll(),
        PatientsService.getAll(),
        FactorsService.getAll()
      ]);
      setVisits(visitsData);
      setPatients(patientsData);
      setFactors(factorsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (visitData: PatientVisitRequest) => {
    try {
      await PatientVisitsService.create(visitData);
      await loadData();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving visit:', error);
    }
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.fullName : 'Unknown Patient';
  };

  const getPatientId = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.nationalIdNumber : 'N/A';
  };

  const filteredVisits = visits.filter(visit => {
    const patientName = getPatientName(visit.patientId).toLowerCase();
    const patientId = getPatientId(visit.patientId).toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return patientName.includes(searchLower) ||
           patientId.includes(searchLower) ||
           visit.visitType?.toLowerCase().includes(searchLower) ||
           visit.centerName?.toLowerCase().includes(searchLower);
  });


  const formatVisitType = (type?: string) => {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatServiceType = (type?: string) => {
    if (!type) return null;
    if (type === 'hospital_admission') return 'Hospital Admission';
    if (type === 'new_visit') return 'New Visit';
    if (type === 'followup') return 'Follow-up';
    return type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Patient Visits</h2>
          <p className="text-gray-600">Track and manage patient visit records</p>
        </div>
        <button
          onClick={() => {
            if (patients.length === 0) {
              alert('No patients available. Please add patients first.');
              return;
            }
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <Plus className="h-5 w-5" />
          <span>Add Visit</span>
        </button>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search by patient name, ID, visit type, or center..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVisits.map((visit) => (
          <div
            key={visit.id}
            onClick={() => setSelectedVisitId(visit.id)}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer hover:border-blue-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{getPatientName(visit.patientId)}</h3>
                  <p className="text-xs text-gray-500">ID: {getPatientId(visit.patientId)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>{formatDate(visit.visitDate)}</span>
              </div>

              {visit.visitType && (
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {formatVisitType(visit.visitType)}
                  </span>
                </div>
              )}

              {visit.serviceType && (
                <div className="flex items-center text-gray-600">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                    {formatServiceType(visit.serviceType)}
                  </span>
                </div>
              )}

              {visit.vitalStatus && (
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className={`text-xs font-medium ${visit.vitalStatus === 'Died' ? 'text-red-600' : 'text-green-600'}`}>
                    Status: {visit.vitalStatus}
                  </span>
                </div>
              )}

              {visit.drugs && visit.drugs.length > 0 && (
                <div className="flex items-center text-gray-600">
                  <Pill className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-700">
                    Drugs Administered: {visit.drugs.length}
                  </span>
                </div>
              )}

              {visit.inhibitors && visit.inhibitors.length > 0 && (
                <div className="flex items-center text-gray-600">
                  <FileText className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-xs font-semibold text-purple-700">
                    Inhibitor Tests: {visit.inhibitors.length}
                  </span>
                </div>
              )}

              {visit.centerName && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{visit.centerName}</span>
                </div>
              )}

              {visit.enteredBy && (
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-xs">By: {visit.enteredBy}</span>
                </div>
              )}

              {visit.complaint && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600 font-medium mb-1">Complaint:</p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {visit.complaint}
                    {visit.complaint === 'Other' && visit.complaintOther && ` - ${visit.complaintOther}`}
                  </p>
                </div>
              )}

              {visit.managementPlan && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 font-medium mb-1">Management Plan:</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{visit.managementPlan}</p>
                </div>
              )}

              {visit.notes && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 font-medium mb-1">Notes:</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{visit.notes}</p>
                </div>
              )}

              {visit.otherMedicalTests && visit.otherMedicalTests.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600 font-medium mb-2">Other Medical Tests ({visit.otherMedicalTests.length}):</p>
                  <div className="space-y-1">
                    {visit.otherMedicalTests.map((test, index) => (
                      <div key={index} className="text-xs bg-green-50 p-2 rounded border border-green-200">
                        <p className="font-medium text-green-900">{test.testName}</p>
                        <p className="text-green-700">Result: {test.testResult}</p>
                        <p className="text-green-600 text-[10px]">Date: {formatDate(test.testDate)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredVisits.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No visits found</p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search criteria
            </p>
          )}
        </div>
      )}

      {showForm && (
        <PatientVisitForm
          patients={patients}
          factors={factors}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {selectedVisitId && (
        <PatientVisitDetails
          visitId={selectedVisitId}
          patient={patients.find(p => p.id === visits.find(v => v.id === selectedVisitId)?.patientId)}
          factors={factors}
          onClose={() => setSelectedVisitId(null)}
        />
      )}
    </div>
  );
};