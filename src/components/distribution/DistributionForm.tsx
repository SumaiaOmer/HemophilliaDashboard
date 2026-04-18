import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { MedicineDistribution, MedicineDistributionRequest, Factor } from '../../types/api';

interface DistributionFormProps {
  distribution?: MedicineDistribution | null;
  factors: Factor[];
  onSave: (distribution: MedicineDistributionRequest) => void;
  onCancel: () => void;
}

export const DistributionForm: React.FC<DistributionFormProps> = ({
  distribution,
  factors,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<MedicineDistributionRequest>({
    factorId: 0,
    state: '',
    quantity: 1,
    quantityDistributed: 0,
    distributionDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    mg: 0,
    companyName: '',
    category: '',
  });

  const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null);

  useEffect(() => {
    if (distribution) {
      const distributionDate = new Date().toISOString().split('T')[0];
      const expiryDate = new Date(distribution.expiryDate).toISOString().split('T')[0];

      setFormData({
        factorId: Number(distribution.factorId),
        state: distribution.state,
        quantity: Number(distribution.quantity) || 1,
        quantityDistributed: Number(distribution.quantityDistributed) || 0,
        distributionDate,
        expiryDate,
        mg: Number(distribution.mg) || 0,
        companyName: distribution.companyName,
        category: distribution.category,
      });

      const factor = factors.find(f => f.id === distribution.factorId);
      if (factor) {
        setSelectedFactor(factor);
      }
    }
  }, [distribution, factors]);

  useEffect(() => {
    if (formData.factorId > 0 && factors.length > 0) {
      const factor = factors.find(f => f.id === formData.factorId);

      if (factor) {
        setSelectedFactor(factor);

        if (!distribution) {
          const expiryDate = new Date(factor.expiryDate).toISOString().split('T')[0];
          setFormData(prev => ({
            ...prev,
            quantity: factor.quantity,
            expiryDate,
            mg: factor.mg,
            companyName: factor.companyName,
            category: factor.drugType,
          }));
        }
      }
    } else {
      setSelectedFactor(null);
    }
  }, [formData.factorId, factors, distribution]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      distributionDate: new Date(formData.distributionDate).toISOString(),
      expiryDate: new Date(formData.expiryDate).toISOString(),
    };
    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;

    if (name === 'factorId') {
      parsedValue = parseInt(value) || 0;
    } else if (type === 'number') {
      if (name === 'quantity') {
        parsedValue = parseInt(value) || 0;
      } else {
        parsedValue = parseFloat(value) || 0;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const states = [
    'Khartoum',
    'Gezira',
    'White Nile',
    'Blue Nile',
    'Northern',
    'River Nile',
    'Red Sea',
    'Kassala',
    'Gedaref',
    'Sennar',
    'North Kordofan',
    'South Kordofan',
    'West Kordofan',
    'North Darfur',
    'South Darfur',
    'West Darfur',
    'East Darfur',
    'Central Darfur'
  ];

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto shadow-xl max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {distribution ? 'Edit Drug Distribution' : 'New Drug Distribution'}
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
            Select Medicine/Drug *
          </label>
          <select
            name="factorId"
            value={formData.factorId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value={0}>Select medicine/factor</option>
            {Array.isArray(factors) && factors.length > 0 ? (
              factors.map(factor => (
                <option key={factor.id} value={factor.id}>
                  {factor.name} - {factor.drugType} (Available: {factor.quantity})
                </option>
              ))
            ) : (
              <option value="" disabled>
                No factors available - Add some in Factors section
              </option>
            )}
          </select>

          {selectedFactor && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Available Qty:</strong> {selectedFactor.quantity} <br />
                <strong> Expiry:</strong> {(() => { const d = new Date(selectedFactor.expiryDate); const off = d.getTimezoneOffset(); const adj = new Date(d.getTime() + off * 60000); return `${String(adj.getDate()).padStart(2,'0')}/${String(adj.getMonth()+1).padStart(2,'0')}/${adj.getFullYear()}`; })()} |
                
              </div>
              <div className="text-sm text-blue-800 mt-1">
                <strong>Lot:</strong> {selectedFactor.lotNo} |
                <strong> Concentration:</strong> {selectedFactor.mg} |
                <strong> Drug Type:</strong> {selectedFactor.drugType}
              </div>
              {formData.quantityDistributed > selectedFactor.quantity && (
                <div className="mt-2 flex items-center text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Distribution quantity exceeds available stock
                </div>
              )}
            </div>
          )}

          {Array.isArray(factors) && factors.length === 0 && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm text-yellow-800">
                No factors/medicines available. Please add some factors first in the Factors section.
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sudan State *
            </label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Select Sudan state</option>
              {states.map(state => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              placeholder="Available quantity"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Distribute *
            </label>
            <input
              type="number"
              name="quantityDistributed"
              value={formData.quantityDistributed}
              onChange={handleChange}
              required
              min="1"
              max={selectedFactor?.quantity || 999999}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Quantity to distribute"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concentration *
            </label>
            <input
              type="number"
              name="mg"
              value={formData.mg}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              placeholder="Concentration"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distribution Date *
            </label>
            <input
              type="date"
              name="distributionDate"
              value={formData.distributionDate}
              onChange={handleChange}
              required
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Automatically set to today's date</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date *
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              required
              readOnly
              disabled={!selectedFactor}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
              placeholder="Auto-filled"
            />
            <p className="mt-1 text-xs text-gray-500">Auto-filled from selected factor</p>
          </div>
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
            disabled={!selectedFactor}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {distribution ? 'Update Distribution' : 'Create Distribution'}
          </button>
        </div>
      </form>
    </div>
  );
};
