import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Smartphone, Calendar, FileText, User, MapPin, Package, Phone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { CellPhoneTreatment, CellPhoneTreatmentRequest, Patient } from '../../types/api';
import { CellPhoneTreatmentsService } from '../../services/cellPhoneTreatments';
import { PatientsService } from '../../services/patients';
import { CellPhoneForm } from './CellPhoneForm';

export const CellPhoneManager: React.FC = () => {
  const [treatments, setTreatments] = useState<CellPhoneTreatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<CellPhoneTreatment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [treatmentsData, patientsData] = await Promise.all([
        CellPhoneTreatmentsService.getAll(),
        PatientsService.getAll(),
      ]);
      setTreatments(treatmentsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (treatmentData: CellPhoneTreatmentRequest) => {
    try {
      if (editingTreatment) {
        await CellPhoneTreatmentsService.update(editingTreatment.id, treatmentData);
      } else {
        await CellPhoneTreatmentsService.create(treatmentData);
      }
      await loadData();
      setShowForm(false);
      setEditingTreatment(null);
    } catch (error) {
      console.error('Error saving treatment:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this cell phone treatment?')) {
      try {
        await CellPhoneTreatmentsService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting treatment:', error);
      }
    }
  };

  const handleEdit = (treatment: CellPhoneTreatment) => {
    setEditingTreatment(treatment);
    setShowForm(true);
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : `Patient ID: ${patientId}`;
  };

  const filteredTreatments = treatments.filter(treatment => {
    const patientName = getPatientName(treatment.patientId).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      patientName.includes(searchLower) ||
      treatment.cellTreatmentCenter.toLowerCase().includes(searchLower) ||
      treatment.treatmentType.toLowerCase().includes(searchLower) ||
      treatment.indicationOfTreatment.toLowerCase().includes(searchLower) ||
      treatment.lot.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Phone Treatment Guidance</h2>
          <p className="text-gray-600">Provide treatment guidance and support to patients via phone calls</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Phone Guidance</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search by patient name, phone number, center, type, indication, or lot..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Cell Phone Treatments Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Treatment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center & Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lot & Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTreatments.map((treatment) => (
                <tr key={treatment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getPatientName(treatment.patientId)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {treatment.patientId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">
                      {treatment.treatmentType}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {treatment.indicationOfTreatment}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {treatment.cellTreatmentCenter}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(treatment.noteDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Lot: {treatment.lot}
                    </div>
                    <div className="text-sm text-gray-500">
                      Qty: {treatment.quantityLot}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(treatment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(treatment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTreatments.length === 0 && (
        <div className="text-center py-12">
          <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No phone guidance sessions found</p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search criteria
            </p>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <CellPhoneForm
            treatment={editingTreatment}
            patients={patients}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingTreatment(null);
            }}
          />
        </div>
      )}
    </div>
  );
};