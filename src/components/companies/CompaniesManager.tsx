import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Building2, Globe, Package } from 'lucide-react';
import { Company, CompanyRequest } from '../../types/api';
import { CompaniesService } from '../../services/companies';
import { CompanyForm } from './CompanyForm';

export const CompaniesManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await CompaniesService.getAll();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (companyData: CompanyRequest) => {
    try {
      if (editingCompany) {
        await CompaniesService.update(editingCompany.id, companyData);
      } else {
        await CompaniesService.create(companyData);
      }
      // Reload data and close modal
      await loadCompanies();
      setShowForm(false);
      setEditingCompany(null);
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await CompaniesService.delete(id);
        // Reload data after deletion
        await loadCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-2xl font-bold text-gray-800">Companies Management</h2>
          <p className="text-gray-600">Manage pharmaceutical companies and suppliers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search companies by name or country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {company.name}
                </h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(company)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <Globe className="h-4 w-4 mr-2" />
                <span className="text-sm">{company.country}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Package className="h-4 w-4 mr-2" />
                <span className="text-sm">Quantity: {company.quantity.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCompanies.length === 0 && !searchTerm && companies.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-12 text-center">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Companies Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Start by adding pharmaceutical companies that supply hemophilia medications.
            Companies are essential for tracking medicine sources and inventory.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>Add Your First Company</span>
          </button>
        </div>
      )}

      {filteredCompanies.length === 0 && (searchTerm || companies.length > 0) && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No companies found</p>
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
          <CompanyForm
            company={editingCompany}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingCompany(null);
            }}
          />
        </div>
      )}
    </div>
  );
};