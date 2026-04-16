import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, FileText, Search } from 'lucide-react';
import { PatientVisit, Patient } from '../../types/api';
import { PatientVisitsService } from '../../services/patientVisits';
import { PatientsService } from '../../services/patients';

export const DiagnosisPatients: React.FC = () => {
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'new_patient' | 'followup' | 'admission'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [visitsData, patientsData] = await Promise.all([
        PatientVisitsService.getAll(),
        PatientsService.getAll()
      ]);
      setVisits(visitsData.filter(v => v.serviceType || v.diagnosisType));
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.fullName : 'Unknown Patient';
  };

  const getPatientDetails = (patientId: number) => {
    return patients.find(p => p.id === patientId);
  };

  const getServiceTypeColor = (type?: string) => {
    switch (type) {
      case 'new_visit':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-500',
          text: 'text-green-700',
          label: 'New Visit'
        };
      case 'followup':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          badge: 'bg-yellow-500',
          text: 'text-yellow-700',
          label: 'Follow-up'
        };
      case 'hospital_admission':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-500',
          text: 'text-red-700',
          label: 'Hospital Admission'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-500',
          text: 'text-gray-700',
          label: 'Unknown'
        };
    }
  };

  const filteredVisits = visits.filter(visit => {
    const patient = getPatientDetails(visit.patientId);
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      patient?.fullName?.toLowerCase().includes(searchLower) ||
      patient?.nationalIdNumber?.toLowerCase().includes(searchLower) ||
      visit.centerName?.toLowerCase().includes(searchLower);

    const visitServiceType = visit.serviceType ||
      (visit.diagnosisType === 'new_patient' ? 'new_visit' :
       visit.diagnosisType === 'admission' ? 'hospital_admission' :
       visit.diagnosisType);
    const matchesFilter = filterType === 'all' || visitServiceType === filterType;

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const stats = {
    total: visits.length,
    newVisit: visits.filter(v => v.serviceType === 'new_visit' || v.diagnosisType === 'new_patient').length,
    followup: visits.filter(v => v.serviceType === 'followup' || v.diagnosisType === 'followup').length,
    hospitalAdmission: visits.filter(v => v.serviceType === 'hospital_admission' || v.diagnosisType === 'admission').length,
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
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Patient Service Types</h2>
        <p className="text-gray-600">View patients categorized by service type</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total Visits</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-green-700">New Visits</div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-2xl font-bold text-green-800">{stats.newVisit}</div>
        </div>

        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-yellow-700">Follow-ups</div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          </div>
          <div className="text-2xl font-bold text-yellow-800">{stats.followup}</div>
        </div>

        <div className="bg-red-50 rounded-lg border border-red-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-red-700">Hospital Admissions</div>
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
          </div>
          <div className="text-2xl font-bold text-red-800">{stats.hospitalAdmission}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or center..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="new_visit">New Visit</option>
            <option value="followup">Follow-up</option>
            <option value="hospital_admission">Hospital Admission</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVisits.map((visit) => {
          const serviceType = visit.serviceType ||
            (visit.diagnosisType === 'new_patient' ? 'new_visit' :
             visit.diagnosisType === 'admission' ? 'hospital_admission' :
             visit.diagnosisType);
          const colors = getServiceTypeColor(serviceType);
          const patient = getPatientDetails(visit.patientId);

          return (
            <div
              key={visit.id}
              className={`${colors.bg} rounded-lg border ${colors.border} shadow-sm p-4 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 ${colors.bg} rounded-full flex items-center justify-center border-2 ${colors.border}`}>
                    <User className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{getPatientName(visit.patientId)}</h3>
                    <p className="text-xs text-gray-500">ID: {patient?.nationalIdNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className={`h-3 w-3 rounded-full ${colors.badge}`}></div>
              </div>

              <div className="space-y-2 text-sm">
                <div className={`inline-flex items-center px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
                  <span className={`font-medium ${colors.text} text-xs`}>{colors.label}</span>
                </div>

                {serviceType && (
                  <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border border-gray-200">
                    <div className="text-xs">
                      <span className="text-gray-500">Service Type: </span>
                      <span className="font-semibold text-gray-800">
                        {colors.label}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-gray-600 mt-2">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-xs">{formatDate(visit.visitDate)}</span>
                </div>

                {visit.centerName && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-xs">{visit.centerName}</span>
                  </div>
                )}

                {visit.complaint && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Complaint:</p>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {visit.complaint}
                          {visit.complaint === 'Other' && visit.complaintOther && ` - ${visit.complaintOther}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredVisits.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No diagnosis patients found</p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search criteria
            </p>
          )}
        </div>
      )}
    </div>
  );
};
