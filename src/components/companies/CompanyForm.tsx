import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Company, CompanyRequest } from '../../types/api';

interface CompanyFormProps {
  company?: Company | null;
  onSave: (company: CompanyRequest) => void;
  onCancel: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  company,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CompanyRequest>({
    name: '',
    country: '',
    quantity: 0,
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        country: company.country,
        quantity: company.quantity,
      });
    }
  }, [company]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {company ? 'Edit Company' : 'Add New Company'}
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
            Company Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter country"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter quantity"
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
            {company ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};