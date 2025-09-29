import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { CompaniesService } from '../../services/companies';
import { FactorsService } from '../../services/factors';
import { PatientsService } from '../../services/patients';
import { TreatmentsService } from '../../services/treatments';

export const ReportsManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalPatients: 0,
    totalTreatments: 0,
    totalFactors: 0,
    totalCompanies: 0,
    treatmentsByMonth: [] as Array<{ month: string; count: number }>,
    expiringFactors: [] as Array<{ name: string; expiryDate: string; quantity: number }>,
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [patients, treatments, factors, companies] = await Promise.all([
        PatientsService.getAll(),
        TreatmentsService.getAll(),
        FactorsService.getAll(),
        CompaniesService.getAll(),
      ]);

      // Calculate monthly treatments
      const treatmentsByMonth = treatments.reduce((acc, treatment) => {
        const month = new Date(treatment.noteDate).toLocaleString('default', { month: 'long', year: 'numeric' });
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ month, count: 1 });
        }
        return acc;
      }, [] as Array<{ month: string; count: number }>);

      // Find expiring factors (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringFactors = factors
        .filter(factor => {
          const expiryDate = new Date(factor.expiryDate);
          return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
        })
        .map(factor => ({
          name: factor.name,
          expiryDate: factor.expiryDate,
          quantity: factor.quantity,
        }));

      setReportData({
        totalPatients: patients.length,
        totalTreatments: treatments.length,
        totalFactors: factors.length,
        totalCompanies: companies.length,
        treatmentsByMonth: treatmentsByMonth.slice(-6), // Last 6 months
        expiringFactors,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-gray-600">System reports and data insights</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
          <Download className="h-5 w-5" />
          <span>Export Reports</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Patients</p>
              <p className="text-3xl font-bold text-blue-700">{reportData.totalPatients}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Total Treatments</p>
              <p className="text-3xl font-bold text-green-700">{reportData.totalTreatments}</p>
            </div>
            <div className="bg-green-600 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Available Factors</p>
              <p className="text-3xl font-bold text-purple-700">{reportData.totalFactors}</p>
            </div>
            <div className="bg-purple-600 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">Partner Companies</p>
              <p className="text-3xl font-bold text-orange-700">{reportData.totalCompanies}</p>
            </div>
            <div className="bg-orange-600 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Treatments Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Treatments</h3>
          <div className="space-y-3">
            {reportData.treatmentsByMonth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max(10, (item.count / Math.max(...reportData.treatmentsByMonth.map(t => t.count))) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-800 min-w-[2rem] text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {reportData.treatmentsByMonth.length === 0 && (
            <p className="text-center text-gray-500 py-8">No treatment data available</p>
          )}
        </div>

        {/* Expiring Factors */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Expiring Factors (Next 30 Days)
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {reportData.expiringFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-medium text-gray-800">{factor.name}</p>
                  <p className="text-xs text-gray-500">Qty: {factor.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-yellow-700 font-medium">
                    {formatDate(factor.expiryDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {reportData.expiringFactors.length === 0 && (
            <p className="text-center text-gray-500 py-8">No factors expiring soon</p>
          )}
        </div>
      </div>

      {/* Report Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-800">Patient Summary Report</span>
            </div>
            <p className="text-sm text-gray-600">Comprehensive patient data overview</p>
          </button>

          <button className="text-left p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors duration-200">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-gray-800">Treatment Analytics</span>
            </div>
            <p className="text-sm text-gray-600">Treatment patterns and statistics</p>
          </button>

          <button className="text-left p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium text-gray-800">Inventory Report</span>
            </div>
            <p className="text-sm text-gray-600">Factor quantities and expiry dates</p>
          </button>
        </div>
      </div>
    </div>
  );
};