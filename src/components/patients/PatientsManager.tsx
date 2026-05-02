
import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Users, Calendar, MapPin, Phone, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Patient, PatientRequest } from '../../types/api';
import { PatientsService } from '../../services/patients';
import { PatientForm } from './PatientForm';
import { formatDate } from '../../lib/dateUtils';

export const PatientsManager: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await PatientsService.getAll();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (patientData: PatientRequest) => {
    try {
      if (editingPatient) {
        await PatientsService.update(editingPatient.id, patientData);
      } else {
        await PatientsService.create(patientData);
      }
      await loadPatients();
      setShowForm(false);
      setEditingPatient(null);
    } catch (error) {
      console.error('Error saving patient:', error);
      let errorMessage = 'Failed to save patient. Please check all required fields and try again.';

      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.errors) {
            const errorFields = Object.keys(errorData.errors);
            errorMessage = `Validation errors in the following fields:\n\n${errorFields.join('\n')}`;
          }
        } catch {
          errorMessage = error.message || errorMessage;
        }
      }

      alert(errorMessage);
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await PatientsService.delete(id);
        await loadPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const toggleExpand = (patientId: number) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const filteredPatients = patients.filter(patient =>
    patient.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.nationalIdNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.hemophiliaCenterId?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const formatOccupation = (occupation?: string) => {
    if (!occupation) return 'N/A';
    return occupation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatMaritalStatus = (status?: string) => {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Patient Management</h2>
          <p className="text-gray-600">Comprehensive patient records and medical information</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Patient</span>
        </button>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search by name, national ID, state, or center ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medical Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <React.Fragment key={patient.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-red-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                          <div className="text-xs text-gray-500">ID: {patient.nationalIdNumber}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                               ({formatDate(patient.dateOfBirth)})
                          </div>
                          {patient.gender && (
                            <div className="text-xs text-gray-500 capitalize">{patient.gender}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(patient.contactNumber1 || patient.contactNumber2) && (
                        <div className="text-sm text-gray-900">
                          {patient.contactNumber1 && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {patient.contactNumber1}
                            </div>
                          )}
                          {patient.contactNumber2 && (
                            <div className="flex items-center text-xs text-gray-600 mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {patient.contactNumber2}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{patient.diagnosis || 'N/A'}</div>
                      {patient.severity && (
                        <div className={`inline-block text-xs px-2 py-1 rounded mt-1 capitalize ${
                          patient.severity === 'severe' ? 'bg-red-100 text-red-800' :
                          patient.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          patient.severity === 'mild' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {patient.severity}
                        </div>
                      )}
                      {patient.bloodGroup && (
                        <div className="text-xs text-gray-500 mt-1">Blood: {patient.bloodGroup}</div>
                      )}
                      {patient.hemophiliaCenterId && (
                        <div className="text-xs text-gray-500">Center: {patient.hemophiliaCenterId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {patient.cityOrTown || patient.state || 'N/A'}
                      </div>
                      {patient.state && patient.cityOrTown && (
                        <div className="text-xs text-gray-500">{patient.state}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => toggleExpand(patient.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          title="View Details"
                        >
                          {expandedPatient === patient.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(patient)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedPatient === patient.id && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <Users className="h-4 w-4 mr-2 text-red-600" />
                              Demographic Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Full Name:</span>
                                <span className="ml-2 text-gray-900">{patient.fullName || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">National ID:</span>
                                <span className="ml-2 text-gray-900">{patient.nationalIdNumber || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Gender:</span>
                                <span className="ml-2 text-gray-900 capitalize">{patient.gender || 'N/A'}</span>
                              </div>
                                <div>
                                <span className="text-gray-600">Age:</span>
                                <span className="ml-2 text-gray-900 capitalize">{patient.age || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Marital Status:</span>
                                <span className="ml-2 text-gray-900">{formatMaritalStatus(patient.maritalStatus)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Occupation:</span>
                                <span className="ml-2 text-gray-900">{formatOccupation(patient.occupation)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Address:</span>
                                <span className="ml-2 text-gray-900">
                                  {[patient.locality, patient.cityOrTown, patient.state].filter(Boolean).join(', ') || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <Heart className="h-4 w-4 mr-2 text-red-600" />
                              Medical Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Center ID:</span>
                                <span className="ml-2 text-gray-900">{patient.hemophiliaCenterId || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Diagnosis:</span>
                                <span className="ml-2 text-gray-900">{patient.diagnosis || 'N/A'}</span>
                              </div>
                              {patient.incidenceDate && (
                                <div>
                                  <span className="text-gray-600">Incidence Date:</span>
                                  <span className="ml-2 text-gray-900">{formatDate(patient.incidenceDate)}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Severity:</span>
                                <span className="ml-2 text-gray-900 capitalize">{patient.severity || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Blood Group:</span>
                                <span className="ml-2 text-gray-900">{patient.bloodGroup || 'N/A'}</span>
                              </div>
                              {patient.factorPercent !== undefined && patient.factorPercent !== null && (
                                <div>
                                  <span className="text-gray-600">Factor Percent:</span>
                                  <span className="ml-2 text-gray-900">{patient.factorPercent}%</span>
                                  {patient.factorLevelTestDate && (
                                    <span className="text-xs text-gray-500"> (Test: {formatDate(patient.factorLevelTestDate)})</span>
                                  )}
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Family History:</span>
                                <span className="ml-2 text-gray-900 capitalize">{patient.familyHistory?.replace(/_/g, ' ') || 'None'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Inhibitor:</span>
                                <span className={`ml-2 font-medium ${patient.inhibitor ? 'text-red-600' : 'text-green-600'}`}>
                                  {patient.inhibitor ? 'Yes' : 'No'}
                                </span>
                                {patient.inhibitor && patient.inhibitorLevel && (
                                  <span className="text-xs text-gray-600"> (Level: {patient.inhibitorLevel})</span>
                                )}
                              </div>
                              {patient.inhibitorScreeningDate && (
                                <div>
                                  <span className="text-gray-600">Inhibitor Screening:</span>
                                  <span className="ml-2 text-gray-900 text-xs">{formatDate(patient.inhibitorScreeningDate)}</span>
                                </div>
                              )}
                              {patient.viralScreeningDate && (
                                <div>
                                  <span className="text-gray-600">Viral Screening:</span>
                                  <span className="ml-2 text-gray-900 text-xs">{formatDate(patient.viralScreeningDate)}</span>
                                </div>
                              )}
                              {patient.otherTestDate && (
                                <div>
                                  <span className="text-gray-600">Other Test:</span>
                                  <span className="ml-2 text-gray-900 text-xs">{formatDate(patient.otherTestDate)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-green-600" />
                              Contact & History
                            </h4>
                            <div className="space-y-2 text-sm">
                              {patient.contactNumber1 && (
                                <div>
                                  <span className="text-gray-600">Contact Number 1:</span>
                                  <span className="ml-2 text-gray-900">{patient.contactNumber1}</span>
                                </div>
                              )}
                              {patient.contactNumber2 && (
                                <div>
                                  <span className="text-gray-600">Contact Number 2:</span>
                                  <span className="ml-2 text-gray-900">{patient.contactNumber2}</span>
                                </div>
                              )}
                              {Array.isArray(patient.chronicDiseases) && patient.chronicDiseases.length > 0 && (
                                <div>
                                  <span className="text-gray-600">Chronic Diseases:</span>
                                  <p className="mt-1 text-gray-900 text-xs">
                                    {patient.chronicDiseases.join(', ')}
                                    {patient.chronicDiseaseOther && ` (${patient.chronicDiseaseOther})`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No patients found</p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search criteria
            </p>
          )}
        </div>
      )}

      {showForm && (
        <PatientForm
          patient={editingPatient}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingPatient(null);
          }}
        />
      )}
    </div>
  );
};
