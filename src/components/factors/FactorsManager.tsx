import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Pill, Calendar, Package, Building2 } from 'lucide-react';
import { Factor, FactorRequest } from '../../types/api';
import { FactorsService } from '../../services/factors';
import { FactorForm } from './FactorForm';
import { formatDate } from '../../lib/dateUtils';

export const FactorsManager: React.FC = () => {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFactor, setEditingFactor] = useState<Factor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    try {
      setLoading(true);
      const data = await FactorsService.getAll();
      setFactors(data);
    } catch (error) {
      console.error('Error loading factors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (factorData: FactorRequest) => {
    try {
      if (editingFactor) {
        await FactorsService.update(editingFactor.id, factorData);
      } else {
        await FactorsService.create(factorData);
      }
      // Reload data and close modal
      await loadFactors();
      setShowForm(false);
      setEditingFactor(null);
    } catch (error) {
      // Re-throw error to be handled by the form
      const errorMessage = error instanceof Error ? error.message : 'Failed to save drug';
      throw new Error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this factor?')) {
      try {
        await FactorsService.delete(id);
        // Reload data after deletion
        await loadFactors();
      } catch (error) {
        console.error('Error deleting factor:', error);
      }
    }
  };

  const handleEdit = (factor: Factor) => {
    setEditingFactor(factor);
    setShowForm(true);
  };

  const filteredFactors = factors.filter(factor =>
    factor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    factor.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    factor.drugType.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 180);
    const expiry = new Date(expiryDate);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Drug Management</h2>
          <p className="text-gray-600">Manage blood clotting Drugs and medications</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Drug</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search Drugs by name, lot number, or Drug Type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
        />
      </div>

      {/* Factors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFactors.map((factor) => (
          <div
            key={factor.id}
            className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 ${
              isExpired(factor.expiryDate) 
                  ? 'border-red-500 bg-red-50' 
                : isExpiringSoon(factor.expiryDate)
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Pill className={`h-8 w-8 mr-3 ${
                  isExpired(factor.expiryDate) 
                    ? 'text-red-600' 
                    : isExpiringSoon(factor.expiryDate)
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`} />
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {factor.name}
                </h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(factor)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(factor.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Lot No:</span>
                <span className="font-medium text-gray-800">{factor.lotNo}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium text-gray-800">{factor.quantity}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Concentration:</span>
                <span className="font-medium text-gray-800">{factor.mg}</span>
              </div>

              <div className="flex items-center text-gray-600 text-sm">
                <Package className="h-4 w-4 mr-2" />
                <span>{factor.drugType}</span>
              </div>

              <div className={`flex items-center text-sm ${
                isExpired(factor.expiryDate) 
                  ? 'text-red-600' 
                  : isExpiringSoon(factor.expiryDate)
                  ? 'text-yellow-600'
                  : 'text-gray-600'
              }`}>
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {isExpired(factor.expiryDate) && 'EXPIRED: '}
                  {isExpiringSoon(factor.expiryDate) && 'EXPIRES SOON: '}
                  {formatDate(factor.expiryDate)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFactors.length === 0 && !searchTerm && factors.length === 0 && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-12 text-center">
          <Pill className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Factors Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Add hemophilia medications (factors) to track inventory, expiry dates, and distributions.
            Factors are the medicines used to treat hemophilia patients.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>Add Your First Factor</span>
          </button>
        </div>
      )}

      {filteredFactors.length === 0 && (searchTerm || factors.length > 0) && (
        <div className="text-center py-12">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No factors found</p>
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
          <FactorForm
            factor={editingFactor}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingFactor(null);
            }}
          />
        </div>
      )}
    </div>
  );
};