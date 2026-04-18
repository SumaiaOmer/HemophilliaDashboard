import React, { useState, useEffect } from 'react';
import { formatDate } from '../../lib/dateUtils';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Building2, 
  Pill, 
  Stethoscope,
  AlertTriangle,
  MapPin,
  Clock,
  Package,
  Activity,
  PieChart
} from 'lucide-react';
import { CompaniesService } from '../../services/companies';
import { FactorsService } from '../../services/factors';
import { PatientsService } from '../../services/patients';
import { Company, Factor, Patient } from '../../types/api';

interface ReportData {
  patients: Patient[];
  factors: Factor[];
  companies: Company[];
}

interface StateStatistics {
  state: string;
  patientCount: number;
}

interface CompanyStatistics {
  company: string;
  factorCount: number;
  totalQuantity: number;
  categories: string[];
}

export const ReportsManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    patients: [],
    factors: [],
    companies: []
  });
  const [activeReport, setActiveReport] = useState<string>('overview');

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [patients, factors, companies] = await Promise.all([
        PatientsService.getAll(),
        FactorsService.getAll(),
        CompaniesService.getAll(),
      ]);

      setReportData({
        patients,
        factors,
        companies
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate state statistics
  const getStateStatistics = (): StateStatistics[] => {
    const stateMap = new Map<string, StateStatistics>();

    reportData.patients.forEach(patient => {
      if (!stateMap.has(patient.residenceState || '')) {
        const state = patient.residenceState || 'Unknown';
        stateMap.set(state, {
          state,
          patientCount: 0
        });
      }
      const stat = stateMap.get(patient.residenceState || '');
      if (stat) stat.patientCount++;
    });

    return Array.from(stateMap.values()).sort((a, b) => b.patientCount - a.patientCount);
  };

  // Calculate company statistics
  const getCompanyStatistics = (): CompanyStatistics[] => {
    const companyMap = new Map<string, CompanyStatistics>();

    reportData.factors.forEach(factor => {
      if (!companyMap.has(factor.companyName)) {
        companyMap.set(factor.companyName, {
          company: factor.companyName,
          factorCount: 0,
          totalQuantity: 0,
          categories: []
        });
      }
      const stat = companyMap.get(factor.companyName)!;
      stat.factorCount++;
      stat.totalQuantity += factor.quantity;
      if (!stat.categories.includes(factor.category)) {
        stat.categories.push(factor.category);
      }
    });

    return Array.from(companyMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  };

  // Get expiring factors
  const getExpiringFactors = () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return reportData.factors
      .filter(factor => {
        const expiryDate = new Date(factor.expiryDate);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  };

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stateStats = getStateStatistics();
  const companyStats = getCompanyStatistics();
  const expiringFactors = getExpiringFactors();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive system reports and data insights</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => exportToCSV(reportData.patients, 'patients_report')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Download className="h-5 w-5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'patients', label: 'Patient Summary', icon: Users },
            { id: 'inventory', label: 'Inventory Report', icon: Package },
            { id: 'states', label: 'State Consumption', icon: MapPin },
            { id: 'companies', label: 'Company Analysis', icon: Building2 }
          ].map(report => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activeReport === report.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{report.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Report */}
      {activeReport === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-blue-700">{reportData.patients.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Available Factors</p>
                  <p className="text-3xl font-bold text-purple-700">{reportData.factors.length}</p>
                </div>
                <Pill className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Partner Companies</p>
                  <p className="text-3xl font-bold text-orange-700">{reportData.companies.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Treatments */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Treatment Trends</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Month</span>
                  <span>Treatments</span>
                </div>
              </div>
              <div className="space-y-3">
                {monthlyTreatments.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max(10, (item.count / Math.max(...monthlyTreatments.map(t => t.count))) * 100)}%`
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
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Total Treatments: {monthlyTreatments.reduce((sum, item) => sum + item.count, 0)}
                </div>
              </div>
            </div>

            {/* Treatment Types */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Treatment Type Distribution</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Treatment Type</span>
                  <span>Count</span>
                </div>
              </div>
              <div className="space-y-3">
                {treatmentTypes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.type}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max(10, (item.count / Math.max(...treatmentTypes.map(t => t.count))) * 100)}%`
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
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Total Types: {treatmentTypes.length} | Total Treatments: {treatmentTypes.reduce((sum, item) => sum + item.count, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* State Distribution Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">State Distribution</h3>
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Patient Distribution by State</h4>
                <div className="space-y-2">
                  {stateStats.slice(0, 8).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">{stat.state}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{
                              width: `${Math.max(10, (stat.patientCount / Math.max(...stateStats.map(s => s.patientCount))) * 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800 min-w-[1.5rem] text-right">
                          {stat.patientCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Table */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed State Statistics</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-500">State</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-500">Patients</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-500">Treatments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stateStats.slice(0, 6).map((stat, index) => (
                        <tr key={index}>
                          <td className="px-2 py-2 text-gray-900">{stat.state}</td>
                          <td className="px-2 py-2 text-right text-gray-900">{stat.patientCount}</td>
                          <td className="px-2 py-2 text-right text-gray-900">{stat.treatmentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Company Performance Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Company Performance</h3>
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Factor Quantity by Company</h4>
                <div className="space-y-2">
                  {companyStats.slice(0, 6).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">{stat.company}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{
                              width: `${Math.max(10, (stat.totalQuantity / Math.max(...companyStats.map(c => c.totalQuantity))) * 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800 min-w-[2rem] text-right">
                          {stat.totalQuantity.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Table */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Company Details</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-500">Company</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-500">Products</th>
                        <th className="px-2 py-2 text-right font-medium text-gray-500">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {companyStats.slice(0, 6).map((stat, index) => (
                        <tr key={index}>
                          <td className="px-2 py-2 text-gray-900 truncate">{stat.company}</td>
                          <td className="px-2 py-2 text-right text-gray-900">{stat.factorCount}</td>
                          <td className="px-2 py-2 text-right text-gray-900">{stat.totalQuantity.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Summary Report */}
      {activeReport === 'patients' && (
        <div className="space-y-6">
          {/* Patient Age Distribution Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Patient Age Distribution</h3>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Age Groups</h4>
                <div className="space-y-2">
                  {(() => {
                    const ageGroups = [
                      { range: '0-18', min: 0, max: 18 },
                      { range: '19-35', min: 19, max: 35 },
                      { range: '36-50', min: 36, max: 50 },
                      { range: '51-65', min: 51, max: 65 },
                      { range: '65+', min: 66, max: 150 }
                    ];
                    const ageGroupCounts = ageGroups.map(group => ({
                      ...group,
                      count: reportData.patients.filter(p => p.age >= group.min && p.age <= group.max).length
                    }));
                    const maxCount = Math.max(...ageGroupCounts.map(g => g.count));
                    
                    return ageGroupCounts.map((group, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{group.range} years</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${maxCount > 0 ? Math.max(10, (group.count / maxCount) * 100) : 0}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-800 min-w-[1.5rem] text-right">
                            {group.count}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              {/* Summary Stats */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Patient Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Patients:</span>
                    <span className="text-sm font-medium text-gray-800">{reportData.patients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Age:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {reportData.patients.length > 0 ? Math.round(reportData.patients.reduce((sum, p) => sum + p.age, 0) / reportData.patients.length) : 0} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">States Covered:</span>
                    <span className="text-sm font-medium text-gray-800">{new Set(reportData.patients.map(p => p.state)).size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Youngest Patient:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {reportData.patients.length > 0 ? Math.min(...reportData.patients.map(p => p.age)) : 0} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Oldest Patient:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {reportData.patients.length > 0 ? Math.max(...reportData.patients.map(p => p.age)) : 0} years
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Details Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Patient Summary Report</h3>
              <button 
                onClick={() => exportToCSV(reportData.patients, 'patient_summary')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.patients.map((patient) => (
                      <tr key={patient.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{patient.fullName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{patient.age}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{patient.residenceType}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{patient.diagnosis}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {activeReport === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Factor Categories Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Factor Categories</h3>
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div className="space-y-2">
                {(() => {
                  const categoryMap = new Map();
                  reportData.factors.forEach(factor => {
                    categoryMap.set(factor.category, (categoryMap.get(factor.category) || 0) + 1);
                  });
                  const categories = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));
                  const maxCount = Math.max(...categories.map(c => c.count));
                  
                  return categories.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{
                              width: `${maxCount > 0 ? Math.max(10, (item.count / maxCount) * 100) : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800 min-w-[1.5rem] text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Expiry Status Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Expiry Status</h3>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="space-y-2">
                {(() => {
                  const now = new Date();
                  const thirtyDaysFromNow = new Date();
                  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                  
                  const expired = reportData.factors.filter(f => new Date(f.expiryDate) < now).length;
                  const expiringSoon = reportData.factors.filter(f => {
                    const expiry = new Date(f.expiryDate);
                    return expiry <= thirtyDaysFromNow && expiry >= now;
                  }).length;
                  const active = reportData.factors.length - expired - expiringSoon;
                  
                  const statusData = [
                    { status: 'Active', count: active, color: 'bg-green-600' },
                    { status: 'Expiring Soon', count: expiringSoon, color: 'bg-yellow-600' },
                    { status: 'Expired', count: expired, color: 'bg-red-600' }
                  ];
                  const maxCount = Math.max(...statusData.map(s => s.count));
                  
                  return statusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.status}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full`}
                            style={{
                              width: `${maxCount > 0 ? Math.max(10, (item.count / maxCount) * 100) : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800 min-w-[1.5rem] text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Expiring Factors Alert */}
          {expiringFactors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
                <h3 className="text-lg font-semibold text-yellow-800">Factors Expiring Soon</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiringFactors.map((factor) => (
                  <div key={factor.id} className="bg-white p-4 rounded-lg border border-yellow-300">
                    <div className="font-medium text-gray-800">{factor.name}</div>
                    <div className="text-sm text-gray-600">Lot: {factor.lotNo}</div>
                    <div className="text-sm text-gray-600">Qty: {factor.quantity}</div>
                    <div className="text-sm text-yellow-700 font-medium">
                      Expires: {formatDate(factor.expiryDate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Inventory Report</h3>
              <button 
                onClick={() => exportToCSV(reportData.factors, 'inventory_report')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factor Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.factors.map((factor) => {
                    const isExpired = new Date(factor.expiryDate) < new Date();
                    const isExpiringSoon = expiringFactors.some(ef => ef.id === factor.id);
                    return (
                      <tr key={factor.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{factor.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{factor.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{factor.quantity}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{factor.companyName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(factor.expiryDate)}</td>
                        <td className="px-6 py-4 text-sm">
                          {isExpired ? (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Expired
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Expiring Soon
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* State Consumption Report */}
      {activeReport === 'states' && (
        <div className="space-y-6">
          {/* State Consumption Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">State Consumption Analysis</h3>
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Distribution Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Patients by State</h4>
                <div className="space-y-2">
                  {stateStats.slice(0, 8).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{stat.state}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.max(10, (stat.patientCount / Math.max(...stateStats.map(s => s.patientCount))) * 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800 min-w-[1.5rem] text-right">
                          {stat.patientCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Treatment Distribution Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Treatments by State</h4>
                <div className="space-y-2">
                  {stateStats.slice(0, 8).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{stat.state}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${Math.max(10, (stat.treatmentCount / Math.max(...stateStats.map(s => s.treatmentCount))) * 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800 min-w-[1.5rem] text-right">
                          {stat.treatmentCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* State Details Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">State Consumption Report</h3>
              <button 
                onClick={() => exportToCSV(stateStats, 'state_consumption')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stateStats.map((stat, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <MapPin className="h-6 w-6 text-blue-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-800">{stat.state}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Patients:</span>
                      <span className="text-sm font-medium text-gray-800">{stat.patientCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Treatments:</span>
                      <span className="text-sm font-medium text-gray-800">{stat.treatmentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Factor Consumption:</span>
                      <span className="text-sm font-medium text-gray-800">{stat.factorConsumption}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Company Analysis Report */}
      {activeReport === 'companies' && (
        <div className="space-y-6">
          {/* Company Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Share Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Market Share by Quantity</h3>
                <PieChart className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-2">
                {companyStats.slice(0, 6).map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate">{stat.company}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max(10, (stat.totalQuantity / Math.max(...companyStats.map(c => c.totalQuantity))) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 min-w-[2rem] text-right">
                        {stat.totalQuantity.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Diversity Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Product Portfolio</h3>
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                {companyStats.slice(0, 6).map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate">{stat.company}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max(10, (stat.factorCount / Math.max(...companyStats.map(c => c.factorCount))) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 min-w-[1.5rem] text-right">
                        {stat.factorCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Company Details Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Company Analysis Report</h3>
              <button 
                onClick={() => exportToCSV(companyStats, 'company_analysis')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companyStats.map((stat, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Building2 className="h-6 w-6 text-orange-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-800">{stat.company}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Factor Products:</span>
                      <span className="text-sm font-medium text-gray-800">{stat.factorCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Quantity:</span>
                      <span className="text-sm font-medium text-gray-800">{stat.totalQuantity.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Categories:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stat.categories.map((category, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};