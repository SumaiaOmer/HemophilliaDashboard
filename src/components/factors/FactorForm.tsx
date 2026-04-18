import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Factor, FactorRequest } from '../../types/api';
import { toDateInputValue, toISOStringFromDateInput } from '../../lib/dateUtils';

interface FactorFormProps {
  factor?: Factor | null;
  onSave: (factor: FactorRequest) => void;
  onCancel: () => void;
}

export const FactorForm: React.FC<FactorFormProps> = ({
  factor,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FactorRequest>({
    name: '',
    lotNo: '',
    quantity: 0,
    expiryDate: '',
    mg: 0,
    drugType: '',
    supplierName: '',
    companyName: '',
  });


  useEffect(() => {
    if (factor) {
      setFormData({
        name: factor.name,
        lotNo: factor.lotNo,
        quantity: factor.quantity,
        expiryDate: toDateInputValue(factor.expiryDate),
        mg: factor.mg,
        drugType: factor.drugType,
        supplierName: factor.supplierName,
        companyName: factor.companyName,
      });
    }
  }, [factor]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      expiryDate: toISOStringFromDateInput(formData.expiryDate),
    };
    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const categories = [
   'Factor VIII',
'Combined Factor VIII +VWF',
'Factor IX',
'Factor X',
'Factor XIII',
'Fibrinogen',
'FEIBA',
'Tranexamic acid',
'Factor VIIa'
  ];

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto shadow-xl max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {factor ? 'Edit Drug' : 'Add New Drug'}
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
            Drug Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter drug name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lot Number *
            </label>
            <input
              type="text"
              name="lotNo"
              value={formData.lotNo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Lot number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Quantity"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Concentration amount"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supplier Name *
          </label>
          <input
            type="text"
            name="supplierName"
            value={formData.supplierName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter supplier name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Drug Type *
          </label>
          <select
            name="drugType"
            value={formData.drugType}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select Drug Type</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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
            {factor ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};