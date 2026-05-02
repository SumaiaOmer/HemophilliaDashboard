import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { MedicineDistributionService } from '../../services/medicineDistribution';
import { FactorsService } from '../../services/factors';
import { MedicineDistribution, MedicineDistributionRequest, Factor } from '../../types/api';
import { formatDate, getDistributionDate } from '../../lib/dateUtils';

export const DeliveredManager: React.FC = () => {
  const [distributions, setDistributions] = useState<MedicineDistribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<MedicineDistribution[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deliveryStartDate, setDeliveryStartDate] = useState('');
  const [deliveryEndDate, setDeliveryEndDate] = useState('');

  useEffect(() => {
    loadDistributions();
  }, []);

  useEffect(() => {
    filterDistributions();
  }, [distributions, searchTerm, filterState, startDate, endDate, deliveryStartDate, deliveryEndDate]);

  const loadDistributions = async () => {
    try {
      setLoading(true);
      const [data, factorData] = await Promise.all([
        MedicineDistributionService.getAll(),
        FactorsService.getAll().catch(err => {
          console.error('Error loading factors:', err);
          return [];
        })
      ]);
      setDistributions(data);
      setFactors(factorData);
    } catch (error) {
      console.error('Error loading distributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFactorName = (factorId: number) => {
    const factor = factors.find(f => f.id === factorId);
    return factor ? factor.name : `Factor ID: ${factorId}`;
  };

  const handleToggleStatus = async (distribution: MedicineDistribution) => {
    try {
      if (distribution.status === 'Delivered') {
        // mark as Pending
        const updateData: MedicineDistributionRequest = {
          factorId: distribution.factorId,
          state: distribution.state,
          quantity: distribution.quantity,
          quantityDistributed: distribution.quantityDistributed,
          distributionDate: '',
          expiryDate: distribution.expiryDate,
          mg: distribution.mg,
          companyName: distribution.companyName,
          category: distribution.category,
        };
        await MedicineDistributionService.update(distribution.id, updateData);
      } else {
        // mark as Delivered
        await MedicineDistributionService.deliver(distribution.id);
      }
      await loadDistributions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const filterDistributions = () => {
    let filtered = [...distributions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(dist => {
        const factorName = getFactorName(dist.factorId).toLowerCase();
        return (
          factorName.includes(term) ||
          dist.state.toLowerCase().includes(term) ||
          dist.companyName.toLowerCase().includes(term) ||
          dist.category.toLowerCase().includes(term)
        );
      });
    }

    if (filterState !== 'all') {
      filtered = filtered.filter(dist => dist.state === filterState);
    }

    if (startDate) {
      filtered = filtered.filter(dist => new Date(dist.distributionDate) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(dist => new Date(dist.distributionDate) <= new Date(endDate));
    }

    if (deliveryStartDate) {
      filtered = filtered.filter(dist => {
        if (!dist.deliveryDate) return false;
        return new Date(dist.deliveryDate) >= new Date(deliveryStartDate);
      });
    }

    if (deliveryEndDate) {
      filtered = filtered.filter(dist => {
        if (!dist.deliveryDate) return false;
        return new Date(dist.deliveryDate) <= new Date(deliveryEndDate);
      });
    }

    setFilteredDistributions(filtered);
  };

  const uniqueStates = Array.from(new Set(distributions.map(d => d.state))).sort();


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-800">Filters</h3>
          </div>
          {(searchTerm || filterState !== 'all' || startDate || endDate || deliveryStartDate || deliveryEndDate) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterState('all');
                setStartDate('');
                setEndDate('');
                setDeliveryStartDate('');
                setDeliveryEndDate('');
              }}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by state, medicine, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none bg-white"
            >
              <option value="all">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-800">Filter by Delivery Date</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-red-700 mb-1">From</label>
                <input
                  type="date"
                  value={deliveryStartDate}
                  onChange={(e) => setDeliveryStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-red-700 mb-1">To</label>
                <input
                  type="date"
                  value={deliveryEndDate}
                  onChange={(e) => setDeliveryEndDate(e.target.value)}
                  min={deliveryStartDate || undefined}
                  className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                />
              </div>
            </div>
            {(deliveryStartDate || deliveryEndDate) && (
              <button
                onClick={() => { setDeliveryStartDate(''); setDeliveryEndDate(''); }}
                className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear delivery date filter
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-500">
          Showing {filteredDistributions.length} of {distributions.length} records
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distribution Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine / Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concentration (MG/UI)</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y divide-gray-200">
  {filteredDistributions.map((dist) => {
    const isExpired = new Date(dist.expiryDate) < new Date();
    const isExpiringSoon = new Date(dist.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const isDelivered = dist.status === 'Delivered';

    return (
      <tr key={dist.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            {formatDate(getDistributionDate(dist))}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">{dist.state}</td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {getFactorName(dist.factorId)}
          {dist.category ? ` / ${dist.category}` : ''}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">{dist.quantityDistributed}</td>
        <td className="px-6 py-4 text-sm text-gray-900">{dist.mg}</td>
        {/* <td className="px-6 py-4 text-sm text-gray-900">{dist.companyName}</td> */}
        <td className="px-6 py-4 text-sm">
          <span
            className={`${
              isExpired
                ? 'text-red-600 font-medium'
                : isExpiringSoon
                ? 'text-yellow-600 font-medium'
                : 'text-gray-900'
            }`}
          >
            {formatDate(dist.expiryDate)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            {dist.deliveryDate ? formatDate(dist.deliveryDate) : 'N/A'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              dist.status === 'Delivered'
                ? 'bg-green-100 text-green-800'
                : dist.status === 'Pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {dist.status || 'N/A'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {isDelivered ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-400 cursor-not-allowed">
              Delivered
            </span>
          ) : (
            <span
              onClick={() => handleToggleStatus(dist)}
              className="cursor-pointer px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 hover:bg-green-200"
            >
              Mark as Delivered
            </span>
          )}
        </td>
      </tr>
    );
  })}
</tbody>

          </table>

          {filteredDistributions.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
