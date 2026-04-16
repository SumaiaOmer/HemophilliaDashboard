import React, { useState, useEffect } from 'react';
import { Users, Building2, Pill, Stethoscope, TrendingUp, Calendar, AlertTriangle, Package, Truck, Clock } from 'lucide-react';
import { CompaniesService } from '../services/companies';
import { FactorsService } from '../services/factors';
import { PatientsService } from '../services/patients';
import { MedicineDistributionService } from '../services/medicineDistribution';
import { Factor, MedicineDistribution } from '../types/api';

interface DashboardStats {
  totalPatients: number;
  totalCompanies: number;
  totalFactors: number;
  totalTreatments: number;
  totalDistributions: number;
  pendingDistributions: number;
  deliveredDistributions: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalCompanies: 0,
    totalFactors: 0,
    totalTreatments: 0,
    totalDistributions: 0,
    pendingDistributions: 0,
    deliveredDistributions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lowStockDrugs, setLowStockDrugs] = useState<Factor[]>([]);
  const [expiringDrugs, setExpiringDrugs] = useState<Factor[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [patients, companies, factors, distributions] = await Promise.all([
          PatientsService.getAll(),
          CompaniesService.getAll(),
          FactorsService.getAll(),
          MedicineDistributionService.getAll(),
        ]);

        const pendingCount = distributions.filter(d => !d.deliveryDate).length;
        const deliveredCount = distributions.filter(d => d.deliveryDate).length;

        const lowStock = factors.filter(f => f.quantity < 10);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiring = factors.filter(f => new Date(f.expiryDate) <= thirtyDaysFromNow);

        setLowStockDrugs(lowStock);
        setExpiringDrugs(expiring);

        setStats({
          totalPatients: patients.length,
          totalCompanies: companies.length,
          totalFactors: factors.length,
          totalTreatments: 0,
          totalDistributions: distributions.length,
          pendingDistributions: pendingCount,
          deliveredDistributions: deliveredCount,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active Treatments',
      value: stats.totalTreatments,
      icon: Stethoscope,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Available Drugs',
      value: stats.totalFactors,
      icon: Pill,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Total Distributions',
      value: stats.totalDistributions,
      icon: Truck,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
    },
    {
      title: 'Pending Deliveries',
      value: stats.pendingDistributions,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Delivered',
      value: stats.deliveredDistributions,
      icon: Package,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to HemoCore</h2>
        <p className="text-blue-100">
          Comprehensive hemophilia treatment management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`${card.bgColor} rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className={`text-3xl font-bold ${card.textColor}`}>
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-sm">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Low Stock Alert</h3>
            <span className="ml-auto bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              {lowStockDrugs.length} items
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lowStockDrugs.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">All drugs are well stocked</p>
              </div>
            ) : (
              lowStockDrugs.map((drug) => (
                <div key={drug.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{drug.name}</div>
                    <div className="text-sm text-gray-600">Lot: {drug.lotNo}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{drug.quantity}</div>
                    <div className="text-xs text-gray-500">units left</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiring Drugs Alert */}
        <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-sm">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Expiring Soon</h3>
            <span className="ml-auto bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
              {expiringDrugs.length} items
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {expiringDrugs.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No drugs expiring in 30 days</p>
              </div>
            ) : (
              expiringDrugs.map((drug) => (
                <div key={drug.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{drug.name}</div>
                    <div className="text-sm text-gray-600">Lot: {drug.lotNo}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-orange-600">
                      {new Date(drug.expiryDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">expiry date</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200">
              <div className="font-medium text-gray-800">Register New Patient</div>
              <div className="text-sm text-gray-500">Add a new patient to the system</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors duration-200">
              <div className="font-medium text-gray-800">Record Treatment</div>
              <div className="text-sm text-gray-500">Log a new treatment session</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200">
              <div className="font-medium text-gray-800">Manage Inventory</div>
              <div className="text-sm text-gray-500">Update factor quantities</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center mb-4">
            <Calendar className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center p-3 rounded-lg bg-gray-50">
              <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">System initialized</div>
                <div className="text-xs text-gray-500">Ready to manage hemophilia care</div>
              </div>
            </div>
            <div className="flex items-center p-3 rounded-lg bg-gray-50">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">API connection established</div>
                <div className="text-xs text-gray-500">Ready to sync data</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-6 w-6 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">System Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
            <div className="text-xs text-gray-600 mt-1">Patients</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalTreatments}</div>
            <div className="text-xs text-gray-600 mt-1">Treatments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingDistributions}</div>
            <div className="text-xs text-gray-600 mt-1">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.deliveredDistributions}</div>
            <div className="text-xs text-gray-600 mt-1">Delivered</div>
          </div>
        </div>
      </div>
    </div>
  );
};