import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Truck, Package, MapPin, Calendar, Building2, Pill, Info, Filter, X } from 'lucide-react';
import { MedicineDistribution, MedicineDistributionRequest, Factor } from '../../types/api';
import { MedicineDistributionService } from '../../services/medicineDistribution';
import { FactorsService } from '../../services/factors';
import { DistributionForm } from './DistributionForm';
import { formatDate, getDistributionDate } from '../../lib/dateUtils';

export const DistributionManager: React.FC = () => {
  const [distributions, setDistributions] = useState<MedicineDistribution[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDistribution, setEditingDistribution] = useState<MedicineDistribution | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading distribution data...');

      const [factorsData, distributionsData] = await Promise.all([
        FactorsService.getAll().catch(err => {
          console.error('Error loading factors:', err);
          return [];
        }),
        MedicineDistributionService.getAll().catch(err => {
          console.error('Error loading distributions:', err);
          return [];
        })
      ]);

      console.log('Factors loaded:', factorsData.length);
      console.log('Distributions loaded:', distributionsData.length);


      setFactors(factorsData);
      setDistributions(distributionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setDistributions([]);
      setFactors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (distributionData: MedicineDistributionRequest) => {
    try {
      if (editingDistribution) {
        await MedicineDistributionService.update(editingDistribution.id, distributionData);
      } else {
        await MedicineDistributionService.create(distributionData);
      }
      await loadData();
      setShowForm(false);
      setEditingDistribution(null);
    } catch (error) {
      console.error('Error saving distribution:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this distribution record?')) {
      try {
        await MedicineDistributionService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting distribution:', error);
      }
    }
  };

  const handleEdit = (distribution: MedicineDistribution) => {
    setEditingDistribution(distribution);
    setShowForm(true);
  };

  const getFactorName = (factorId: number) => {
    const factor = factors.find(f => f.id === factorId);
    return factor ? factor.name : `Factor ID: ${factorId}`;
  };

  const filteredDistributions = distributions.filter(distribution => {
    const factorName = getFactorName(distribution.factorId).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      factorName.includes(searchLower) ||
      (distribution.state || '').toLowerCase().includes(searchLower) ||
      (distribution.companyName || '').toLowerCase().includes(searchLower) ||
      (distribution.category || '').toLowerCase().includes(searchLower);

    const matchesState = stateFilter === 'all' || distribution.state === stateFilter;

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && (!distribution.status || distribution.status === 'Pending')) ||
      (statusFilter === 'delivered' && distribution.status === 'Delivered');

    let matchesDateRange = true;
    if (startDate || endDate) {
      const distributionDate = distribution.deliveryDate ? new Date(distribution.deliveryDate) : new Date(getDistributionDate(distribution));

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        matchesDateRange = distributionDate >= start && distributionDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        matchesDateRange = distributionDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        matchesDateRange = distributionDate <= end;
      }
    }

    return matchesSearch && matchesState && matchesStatus && matchesDateRange;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStateFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchTerm || stateFilter !== 'all' || statusFilter !== 'all' || startDate || endDate;


  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 180);
    const expiry = new Date(expiryDate);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
  };

  const getStatesWithDistributions = () => {
    const statesSet = new Set<string>();
    distributions.forEach(distribution => {
      if (distribution.state) {
        statesSet.add(distribution.state);
      }
    });
    return Array.from(statesSet).sort();
  };

  const statesWithDistributions = getStatesWithDistributions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const pendingCount = filteredDistributions.filter(d => !d.status || d.status === 'Pending').length;
  const deliveredCount = filteredDistributions.filter(d => d.status === 'Delivered').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Drug Distribution</h2>
          <p className="text-gray-600">Manage drug distribution to Sudan states</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>New Distribution</span>
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-700 mt-2">{pendingCount}</p>
            </div>
            <div className="bg-yellow-200 p-3 rounded-full">
              <Truck className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Delivered</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{deliveredCount}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-full">
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <X className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by medicine, state ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            >
              <option value="all">All States</option>
              {statesWithDistributions.map(state => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Date Range:</label>
              <input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <div className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                <span>Search: {searchTerm}</span>
                <button onClick={() => setSearchTerm('')} className="hover:bg-red-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {stateFilter !== 'all' && (
              <div className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                <span>State: {stateFilter}</span>
                <button onClick={() => setStateFilter('all')} className="hover:bg-purple-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {statusFilter !== 'all' && (
              <div className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <span>Status: {statusFilter === 'pending' ? 'Pending' : 'Delivered'}</span>
                <button onClick={() => setStatusFilter('all')} className="hover:bg-green-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {(startDate || endDate) && (
              <div className="inline-flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                <span>
                  Date: {startDate ? formatDate(startDate) : 'Start'} - {endDate ? formatDate(endDate) : 'End'}
                </span>
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="hover:bg-orange-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredDistributions.length} of {distributions.length} distributions
        </div>
      </div>

      {/* Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDistributions.map((distribution) => {
          const isDelivered = distribution.status === 'Delivered';
          const isPending = !distribution.status || distribution.status === 'Pending';

          return (
          <div
            key={distribution.id}
            className={`rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 ${
              isDelivered
                ? 'border-green-200 bg-green-50'
                : isPending
                ? 'border-yellow-200 bg-yellow-50'
                : isExpired(distribution.expiryDate)
                ? 'border-red-200 bg-red-50'
                : 'border-red-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Package className={`h-8 w-8 mr-3 ${
                  isDelivered
                    ? 'text-green-600'
                    : isPending
                    ? 'text-yellow-600'
                    : isExpired(distribution.expiryDate)
                    ? 'text-red-600'
                    : 'text-red-600'
                }`} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {getFactorName(distribution.factorId)}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {distribution.category}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(distribution)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(distribution.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Info className="h-4 w-4 mr-2" />
                  <span>{distribution.status}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Distribution Date:</span>
                  <div className="text-sm text-gray-800 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(getDistributionDate(distribution)) || 'Not set'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{distribution.state}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  <span>Qty: {distribution.quantityDistributed}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              
                <div className="flex items-center text-sm text-gray-600">
                  <Pill className="h-4 w-4 mr-2" />
                  <span>{distribution.mg} Concentration</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              
                <div>
                  <span className="text-xs text-gray-500">Expiry Date:</span>
                  <div className={`text-sm flex items-center ${
                    isExpired(distribution.expiryDate)
                      ? 'text-red-600'
                      : isExpiringSoon(distribution.expiryDate)
                      ? 'text-yellow-600'
                      : 'text-gray-800'
                  }`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {isExpired(distribution.expiryDate) && 'EXPIRED: '}
                    {isExpiringSoon(distribution.expiryDate) && 'EXPIRES SOON: '}
                    {formatDate(distribution.expiryDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {filteredDistributions.length === 0 && !searchTerm && distributions.length === 0 && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-12 text-center">
          <Truck className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome to Drug Distribution
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Track medicine distribution across Sudan states. Before creating distributions,
            you need to add factors (medicines) and companies to your system.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">2</div>
              <h4 className="font-semibold text-gray-800 mb-1">Add Factors</h4>
              <p className="text-sm text-gray-600">Add hemophilia medicines with lot numbers and details</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">3</div>
              <h4 className="font-semibold text-gray-800 mb-1">Create Distributions</h4>
              <p className="text-sm text-gray-600">Distribute medicines to different Sudan states</p>
            </div>
          </div>

          {factors.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-yellow-800 font-medium mb-2">
                No factors (medicines) available
              </p>
              <p className="text-sm text-yellow-700">
                Please go to the <strong>Factors</strong> section to add medicines before creating distributions.
              </p>
            </div>
          )}
        </div>
      )}

      {filteredDistributions.length === 0 && (searchTerm || distributions.length > 0) && (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No distribution records found</p>
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
          <DistributionForm
            distribution={editingDistribution}
            factors={factors}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingDistribution(null);
            }}
          />
        </div>
      )}
    </div>
  );
};
