import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { MedicineDistributionService } from '../../services/medicineDistribution';
import { MedicineDistribution, MedicineDistributionRequest } from '../../types/api';

export const DeliveredManager: React.FC = () => {
  const [distributions, setDistributions] = useState<MedicineDistribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<MedicineDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadDistributions();
  }, []);

  useEffect(() => {
    filterDistributions();
  }, [distributions, searchTerm, filterState, startDate, endDate]);

  const loadDistributions = async () => {
    try {
      setLoading(true);
      const data = await MedicineDistributionService.getAll();
      setDistributions(data);
    } catch (error) {
      console.error('Error loading distributions:', error);
    } finally {
      setLoading(false);
    }
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
      filtered = filtered.filter(dist =>
        dist.state.toLowerCase().includes(term) ||
        dist.companyName.toLowerCase().includes(term) ||
        dist.category.toLowerCase().includes(term)
      );
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

    setFilteredDistributions(filtered);
  };

  const uniqueStates = Array.from(new Set(distributions.map(d => d.state))).sort();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by state, company, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
              >
                <option value="all">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vial (mg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
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
            {dist.deliveryDate ? formatDate(dist.deliveryDate) : 'N/A'}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">{dist.state}</td>
        <td className="px-6 py-4 text-sm text-gray-900">{dist.category}</td>
        <td className="px-6 py-4 text-sm text-gray-900">{dist.quantityDistributed}</td>
        <td className="px-6 py-4 text-sm text-gray-900">{dist.mg}</td>
        <td className="px-6 py-4 text-sm text-gray-900">{dist.companyName}</td>
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
