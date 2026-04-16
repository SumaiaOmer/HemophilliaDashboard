import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';
import { CellPhoneTreatment, CellPhoneTreatmentRequest, Patient } from '../../types/api';

interface CellPhoneFormProps {
  treatment?: CellPhoneTreatment | null;
  patients: Patient[];
  onSave: (treatment: CellPhoneTreatmentRequest) => void;
  onCancel: () => void;
}

export const CellPhoneForm: React.FC<CellPhoneFormProps> = ({
  treatment,
  patients,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CellPhoneTreatmentRequest>({
    patientId: 0,
    cellTreatmentCenter: '',
    treatmentType: '',
    indicationOfTreatment: '',
    lot: '',
    noteDate: '',
    quantityLot: 0,
  });

  useEffect(() => {
    if (treatment) {
      const noteDate = new Date(treatment.noteDate).toISOString().split('T')[0];
      setFormData({
        patientId: treatment.patientId,
        cellTreatmentCenter: treatment.cellTreatmentCenter,
        treatmentType: treatment.treatmentType,
        indicationOfTreatment: treatment.indicationOfTreatment,
        lot: treatment.lot,
        noteDate,
        quantityLot: treatment.quantityLot,
      });
    }
  }, [treatment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      noteDate: new Date(formData.noteDate).toISOString(),
    };
    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const treatmentTypes = [
    'Prophylactic',
    'On-demand',
    'Pre-surgical',
    'Post-surgical',
    'Emergency',
    'Maintenance',
    'Other',
  ];

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto shadow-xl max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {treatment ? 'Edit Cell Phone Treatment' : 'Add Cell Phone Treatment'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient *
          </label>
          <select
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value={0}>Select patient</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} (ID: {patient.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cell Treatment Center *
          </label>
          <input
            type="text"
            name="cellTreatmentCenter"
            value={formData.cellTreatmentCenter}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter treatment center name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Treatment Type *
          </label>
          <select
            name="treatmentType"
            value={formData.treatmentType}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select treatment type</option>
            {treatmentTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Indication of Treatment *
          </label>
          <textarea
            name="indicationOfTreatment"
            value={formData.indicationOfTreatment}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="Enter indication for treatment"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lot Number *
            </label>
            <input
              type="text"
              name="lot"
              value={formData.lot}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Lot number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Lot *
            </label>
            <input
              type="number"
              name="quantityLot"
              value={formData.quantityLot}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Quantity"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note Date *
          </label>
          <input
            type="date"
            name="noteDate"
            value={formData.noteDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex space-x-3 pt-4">
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
            {treatment ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};