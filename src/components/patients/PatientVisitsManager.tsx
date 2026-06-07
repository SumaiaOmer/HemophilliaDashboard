import React, { useState, useEffect } from 'react';
import { Plus, Calendar, FileText, User, MapPin, Pill, ChevronDown, ChevronUp, ChevronRight, CreditCard as Edit2, Users, Phone } from 'lucide-react';
import { PatientVisit, PatientVisitRequest, Patient, Factor, VisitDrug } from '../../types/api';
import { PatientVisitsService } from '../../services/patientVisits';
import { PatientsService } from '../../services/patients';
import { FactorsService } from '../../services/factors';
import { PatientVisitForm } from './PatientVisitForm';
import { formatDate } from '../../lib/dateUtils';

export const PatientVisitsManager: React.FC = () => {
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<PatientVisit | null>(null);
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => { loadData(); }, []);

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
      if (editingVisit) {
        await PatientVisitsService.update(editingVisit.id, visitData);
      } else {
        await PatientVisitsService.create(visitData);
      }
      await loadData();
      setShowForm(false);
      setEditingVisit(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save visit';
      throw new Error(errorMessage);
    }
  };

  const handleEdit = (visitId: number) => {
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      setEditingVisit(visit);
      setShowForm(true);
    }
  };

  const getPatient = (patientId: number) => patients.find(p => p.id === patientId);

  const getPatientName = (patientId: number) => {
    const patient = getPatient(patientId);
    return patient ? patient.fullName : 'Unknown Patient';
  };

  const getPatientNationalId = (patientId: number) => {
    const patient = getPatient(patientId);
    return patient ? patient.nationalIdNumber : 'N/A';
  };

  const getDrugName = (drugId: number) => {
    const factor = factors.find(f => f.id === drugId);
    return factor?.name || `Drug ID: ${drugId}`;
  };

  const filteredVisits = visits.filter(visit => {
    const patientName = getPatientName(visit.patientId).toLowerCase();
    const patientId = getPatientNationalId(visit.patientId).toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = patientName.includes(searchLower) ||
      patientId.includes(searchLower) ||
      visit.visitType?.toLowerCase().includes(searchLower) ||
      visit.centerName?.toLowerCase().includes(searchLower);

    let matchesDateRange = true;
    if (fromDate || toDate) {
      const visitDate = new Date(visit.visitDate);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && visitDate >= from;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && visitDate <= to;
      }
    }

    return matchesSearch && matchesDateRange;
  });

  // Group visits by patient
  const groupedByPatient = filteredVisits.reduce<Record<number, PatientVisit[]>>((acc, visit) => {
    if (!acc[visit.patientId]) acc[visit.patientId] = [];
    acc[visit.patientId].push(visit);
    return acc;
  }, {});

  // Sort visits within each group by date descending
  Object.values(groupedByPatient).forEach(group =>
    group.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  );

  const patientEntries = Object.entries(groupedByPatient)
    .map(([patientId, patientVisits]) => ({
      patientId: Number(patientId),
      visits: patientVisits,
      patient: getPatient(Number(patientId)),
      latestVisit: patientVisits[0]
    }))
    .sort((a, b) => new Date(b.latestVisit.visitDate).getTime() - new Date(a.latestVisit.visitDate).getTime());

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

  const getServiceTypeBadge = (type?: string) => {
    if (!type) return null;
    const label = formatServiceType(type);
    if (!label) return null;
    const colorMap: Record<string, string> = {
      new_visit: 'bg-green-100 text-green-800',
      followup: 'bg-blue-100 text-blue-800',
      hospital_admission: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${colorMap[type] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  const renderDrugBadges = (drugs?: VisitDrug[]) => {
    if (!drugs || drugs.length === 0) return null;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <Pill className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-medium text-red-700">{drugs.length} drug{drugs.length !== 1 ? 's' : ''}</span>
      </div>
    );
  };

  const renderExpandedVisit = (visit: PatientVisit) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Visit header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-red-50 rounded-full flex items-center justify-center border border-red-200">
            <Calendar className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{formatDate(visit.visitDate)}</span>
              {getServiceTypeBadge(visit.serviceType)}
              {visit.visitType && (
                <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                  {formatVisitType(visit.visitType)}
                </span>
              )}
            </div>
            {visit.centerName && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                {visit.centerName}
                {visit.centerState && ` - ${visit.centerState}`}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => handleEdit(visit.id)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Edit visit"
        >
          <Edit2 className="h-4 w-4" />
        </button>
      </div>

      {/* Clinical info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visit.complaint && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Complaints</p>
            <div className="flex flex-wrap gap-1">
              {visit.complaint.split(',').map((c, i) => {
                const trimmed = c.trim();
                if (!trimmed) return null;
                return (
                  <span key={i} className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                    {trimmed}
                    {trimmed === 'Other' && visit.complaintOther && ` - ${visit.complaintOther}`}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {visit.diagnosis && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Diagnosis</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">{visit.diagnosis}</p>
          </div>
        )}
        {visit.managementPlan && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Management Plan</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-3">{visit.managementPlan}</p>
          </div>
        )}
        {visit.vitalStatus && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Vital Status</p>
            <span className={`inline-block text-sm font-medium ${visit.vitalStatus === 'Died' ? 'text-red-600' : 'text-green-600'}`}>
              {visit.vitalStatus}
            </span>
          </div>
        )}
      </div>

      {/* Drugs */}
      {visit.drugs && visit.drugs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Medications ({visit.drugs.length})</p>
          <div className="space-y-1.5">
            {visit.drugs.map((drug, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-yellow-50 p-2 rounded border border-yellow-100">
                <div className="flex items-center gap-2">
                  <Pill className="h-3.5 w-3.5 text-yellow-600" />
                  <span className="font-medium text-gray-800">{getDrugName(drug.drugId)}</span>
                </div>
                <span className="text-gray-600">Qty: {drug.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inhibitors */}
      {visit.inhibitors && visit.inhibitors.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Inhibitor Screening ({visit.inhibitors.length})</p>
          <div className="space-y-1.5">
            {visit.inhibitors.map((inh, i) => (
              <div key={i} className="text-sm bg-purple-50 p-2 rounded border border-purple-100 flex items-center justify-between">
                <span className="text-gray-800">Level: <strong>{inh.inhibitorLevel ?? 'N/A'}</strong></span>
                {inh.inhibitorScreeningDate && <span className="text-xs text-gray-500">{formatDate(inh.inhibitorScreeningDate)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Medical Tests */}
      {visit.otherMedicalTests && visit.otherMedicalTests.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Other Medical Tests ({visit.otherMedicalTests.length})</p>
          <div className="space-y-1.5">
            {visit.otherMedicalTests.map((test, i) => (
              <div key={i} className="text-sm bg-orange-50 p-2 rounded border border-orange-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{test.testName}</span>
                  <span className="text-xs text-gray-500">{formatDate(test.testDate)}</span>
                </div>
                <p className="text-gray-600">Result: {test.testResult}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {visit.notes && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">{visit.notes}</p>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
        {visit.enteredBy && (
          <span className="flex items-center gap-1"><User className="h-3 w-3" /> By: {visit.enteredBy}</span>
        )}
        {visit.createdAt && (
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Created: {formatDate(visit.createdAt)}</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <Plus className="h-5 w-5" />
          <span>Add Visit</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search by patient name, ID, visit type, or center..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); }}
            className="mt-3 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            Clear Dates
          </button>
        )}
      </div>

      {/* Patient cards with grouped visits */}
      <div className="space-y-4">
        {patientEntries.map(({ patientId, visits: patientVisits, patient, latestVisit }) => {
          const isExpanded = expandedPatient === patientId;
          const firstVisit = patientVisits[patientVisits.length - 1];
          const lastVisit = patientVisits[0];

          return (
            <div
              key={patientId}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              {/* Patient header - always visible */}
              <button
                onClick={() => setExpandedPatient(isExpanded ? null : patientId)}
                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{getPatientName(patientId)}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {patientVisits.length} visit{patientVisits.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>ID: {getPatientNationalId(patientId)}</span>
                    {patient?.gender && <span className="capitalize">{patient.gender}</span>}
                    {patient?.age && <span>{patient.age} yrs</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Last: {formatDate(lastVisit.visitDate)}
                    </span>
                    {firstVisit && firstVisit.id !== lastVisit.id && (
                      <span className="flex items-center gap-1">
                        First: {formatDate(firstVisit.visitDate)}
                      </span>
                    )}
                    {lastVisit.centerName && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lastVisit.centerName}
                      </span>
                    )}
                    {patient?.contactNumber1 && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.contactNumber1}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded visits list */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-6 pb-5 space-y-3">
                  {/* Visit summary row */}
                  <div className="pt-3">
                    {patientVisits.map((visit) => {
                      const isVisitExpanded = expandedVisit === visit.id;

                      return (
                        <div key={visit.id} className="mb-3">
                          {/* Visit row - clickable to expand */}
                          <button
                            onClick={() => setExpandedVisit(isVisitExpanded ? null : visit.id)}
                            className="w-full text-left flex items-center gap-3 py-3 px-4 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-red-200 transition-all duration-200"
                          >
                            <ChevronRight
                              className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                                isVisitExpanded ? 'rotate-90' : ''
                              }`}
                            />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900">{formatDate(visit.visitDate)}</span>
                              {getServiceTypeBadge(visit.serviceType)}
                              {visit.visitType && (
                                <span className="text-xs text-gray-500">{formatVisitType(visit.visitType)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {visit.vitalStatus && (
                                <span className={`text-xs font-medium ${visit.vitalStatus === 'Died' ? 'text-red-600' : 'text-green-600'}`}>
                                  {visit.vitalStatus}
                                </span>
                              )}
                              {renderDrugBadges(visit.drugs)}
                              {visit.complaint && (
                                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {visit.complaint.split(',').map(c => c.trim()).filter(c => c).join(', ')}
                                </span>
                              )}
                              {visit.centerName && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <MapPin className="h-3 w-3" />
                                  {visit.centerName}
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Expanded visit details */}
                          {isVisitExpanded && (
                            <div className="mt-2 ml-7">
                              {renderExpandedVisit(visit)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {patientEntries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No visits found</p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
          )}
        </div>
      )}

      {showForm && (
        <PatientVisitForm
          visit={editingVisit}
          patients={patients}
          factors={factors}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingVisit(null);
          }}
        />
      )}
    </div>
  );
};
