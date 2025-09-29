import React, { useState, useEffect } from 'react';
import { Users, Building2, Pill, Stethoscope, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { CompaniesService } from '../services/companies';
import { FactorsService } from '../services/factors';
import { PatientsService } from '../services/patients';
import { TreatmentsService } from '../services/treatments';

interface DashboardStats {
  totalPatients: number;
  totalCompanies: number;
  totalFactors: number;
  totalTreatments: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalCompanies: 0,
    totalFactors: 0,
    totalTreatments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [patients, companies, factors, treatments] = await Promise.all([
          PatientsService.getAll(),
          CompaniesService.getAll(),
          FactorsService.getAll(),
          TreatmentsService.getAll(),
        ]);

        setStats({
          totalPatients: patients.length,
          totalCompanies: companies.length,
          totalFactors: factors.length,
          totalTreatments: treatments.length,
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
      title: 'Available Factors',
      value: stats.totalFactors,
      icon: Pill,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Partner Companies',
      value: stats.totalCompanies,
      icon: Building2,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* System Status */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">System Status</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">API Connection: Active</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Database: Connected</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Sync Status: Pending Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};