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
import { FactorsService } from '../../services/factors';
import { PatientsService } from '../../services/patients';
import { Factor, Patient, MedicineDistribution } from '../../types/api';
import { MedicineDistributionService } from '../../services/medicineDistribution';
import { Pagination } from '../Pagination';

interface ReportData {
  patients: Patient[];
  factors: Factor[];
  distributions: MedicineDistribution[];
}

interface StateStatistics {
  state: string;
  patientCount: number;
  treatmentCount: number;
  factorConsumption: number;
}

interface CompanyStatistics {
  company: string;
  factorCount: number;
  totalQuantity: number;
  categories: string[];
}

export const ReportsManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    patients: [],
    factors: [],
    distributions: [],
  });
  const [activeReport, setActiveReport] = useState<string>('overview');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientStateFilter, setPatientStateFilter] = useState('all');
  const [patientGenderFilter, setPatientGenderFilter] = useState('all');
  const [patientSeverityFilter, setPatientSeverityFilter] = useState('all');
  const [drugSearch, setDrugSearch] = useState('');
  const [drugStateFilter, setDrugStateFilter] = useState('all');
  const [drugCategoryFilter, setDrugCategoryFilter] = useState('all');
  const [drugFromDate, setDrugFromDate] = useState('');
  const [drugToDate, setDrugToDate] = useState('');
  const [reportPageSize, setReportPageSize] = useState(10);
  const [patientResultsPage, setPatientResultsPage] = useState(1);
  const [patientSummaryPage, setPatientSummaryPage] = useState(1);
  const [vitalStatusPage, setVitalStatusPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [drugConsumptionPage, setDrugConsumptionPage] = useState(1);

  useEffect(() => {
    loadReportData();
  }, []);

  useEffect(() => {
    setPatientResultsPage(1);
  }, [patientSearch, patientStateFilter, patientGenderFilter, patientSeverityFilter]);

  useEffect(() => {
    setDrugConsumptionPage(1);
  }, [drugSearch, drugStateFilter, drugCategoryFilter, drugFromDate, drugToDate]);

  const loadReportData = async () => {
    setLoading(true);
    setLoadError(null);
    const [patientsResult, factorsResult, distributionsResult] = await Promise.allSettled([
      PatientsService.getAll(),
      FactorsService.getAll(),
      MedicineDistributionService.getAll(),
    ]);

    const failedSources: string[] = [];
    if (patientsResult.status === 'rejected') {
      failedSources.push('patients');
      console.error('Error loading patient report data:', patientsResult.reason);
    }
    if (factorsResult.status === 'rejected') {
      failedSources.push('drug inventory');
      console.error('Error loading inventory report data:', factorsResult.reason);
    }
    if (distributionsResult.status === 'rejected') {
      failedSources.push('drug distribution');
      console.error('Error loading drug distribution report data:', distributionsResult.reason);
    }

    setReportData({
      patients: patientsResult.status === 'fulfilled' && Array.isArray(patientsResult.value) ? patientsResult.value : [],
      factors: factorsResult.status === 'fulfilled' && Array.isArray(factorsResult.value) ? factorsResult.value : [],
      distributions: distributionsResult.status === 'fulfilled' && Array.isArray(distributionsResult.value) ? distributionsResult.value : [],
    });
    if (failedSources.length > 0) {
      setLoadError(`Could not load ${failedSources.join(', ')} data. Other available report data is still shown. Check the API connection and access permissions, then retry.`);
    }
    setLoading(false);
  };

  // Calculate state statistics
  const getStateStatistics = (): StateStatistics[] => {
    const stateMap = new Map<string, StateStatistics>();

    reportData.patients.forEach(patient => {
      const stateKey = patient.residenceState || patient.state || 'Unknown';
      if (!stateMap.has(stateKey)) {
        stateMap.set(stateKey, {
          state: stateKey,
          patientCount: 0,
          treatmentCount: 0,
          factorConsumption: 0,
        });
      }
      const stat = stateMap.get(stateKey)!;
      stat.patientCount++;
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
      if (!stat.categories.includes(factor.drugType)) {
        stat.categories.push(factor.drugType);
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

    const escapeCell = (value: unknown) => {
      const text = value == null
        ? ''
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
      const safeText = /^[\t\r ]*[=+@]/.test(text) || /^[\t\r ]*-/.test(text)
        ? `'${text}`
        : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const headers = Object.keys(data[0]).map(escapeCell).join(',');
    const rows = data
      .map(row => Object.values(row).map(escapeCell).join(','))
      .join('\r\n');
    // UTF-8 BOM makes Excel recognize Arabic and other Unicode text in CSV files.
    const csv = `\uFEFF${headers}\r\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const stateStats = getStateStatistics();
  const companyStats = getCompanyStatistics();
  const expiringFactors = getExpiringFactors();
  const reportPatients = reportData.patients.filter((patient) => {
    const state = patient.residenceState || patient.state || 'Unknown';
    const matchesSearch = `${patient.fullName} ${patient.nationalIdNumber} ${patient.diagnosis || ''}`
      .toLowerCase()
      .includes(patientSearch.trim().toLowerCase());
    return matchesSearch &&
      (patientStateFilter === 'all' || state === patientStateFilter) &&
      (patientGenderFilter === 'all' || patient.gender?.toLowerCase() === patientGenderFilter) &&
      (patientSeverityFilter === 'all' || (patient.severity || 'unknown').toLowerCase() === patientSeverityFilter);
  });
  const diagnosisChartData = Array.from(reportPatients.reduce((counts, patient) => {
    const diagnosis = patient.diagnosis || 'Not specified';
    counts.set(diagnosis, (counts.get(diagnosis) || 0) + 1);
    return counts;
  }, new Map<string, number>()).entries())
    .map(([diagnosis, count]) => ({ diagnosis, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const vitalStatusCounts = reportData.patients.reduce<Record<'Alive' | 'Died' | 'Unknown', number>>((counts, patient) => {
    const status = patient.vitalStatus?.trim().toLowerCase();
    const category = status === 'alive' ? 'Alive' : status === 'died' ? 'Died' : 'Unknown';
    counts[category] += 1;
    return counts;
  }, { Alive: 0, Died: 0, Unknown: 0 });
  const vitalStatusRows = [
    { label: 'Alive', count: vitalStatusCounts.Alive, style: 'bg-green-500', text: 'text-green-700', card: 'border-green-200 bg-green-50' },
    { label: 'Died', count: vitalStatusCounts.Died, style: 'bg-red-600', text: 'text-red-700', card: 'border-red-200 bg-red-50' },
    { label: 'Unknown', count: vitalStatusCounts.Unknown, style: 'bg-gray-500', text: 'text-gray-700', card: 'border-gray-200 bg-gray-50' },
  ];
  const distributionStates = Array.from(new Set(reportData.distributions.map((item) => item.state).filter(Boolean))).sort();
  const distributionCategories = Array.from(new Set(reportData.distributions.map((item) => item.category).filter(Boolean))).sort();
  const filteredDrugDistributions = reportData.distributions.filter((item) => {
    const distributionDate = (item.distributionDate || item.dateOfDistribution || '').slice(0, 10);
    return (drugStateFilter === 'all' || item.state === drugStateFilter) &&
      (drugCategoryFilter === 'all' || item.category === drugCategoryFilter) &&
      (!drugSearch.trim() || (reportData.factors.find((factor) => factor.id === item.factorId)?.name || item.category || '').toLowerCase().includes(drugSearch.trim().toLowerCase())) &&
      (!drugFromDate || (distributionDate !== '' && distributionDate >= drugFromDate)) &&
      (!drugToDate || (distributionDate !== '' && distributionDate <= drugToDate));
  });
  const drugConsumptionByState = Array.from(filteredDrugDistributions.reduce((summary, item) => {
    const factor = reportData.factors.find((candidate) => candidate.id === item.factorId);
    const drug = factor?.name || item.category || `Drug #${item.factorId}`;
    const key = `${item.state || 'Unknown'}\u0000${drug}`;
    const existing = summary.get(key) || { state: item.state || 'Unknown', drug, quantity: 0, records: 0 };
    existing.quantity += Number(item.quantityDistributed) || 0;
    existing.records += 1;
    summary.set(key, existing);
    return summary;
  }, new Map<string, { state: string; drug: string; quantity: number; records: number }>()).values())
    .sort((a, b) => a.state.localeCompare(b.state) || a.drug.localeCompare(b.drug));
  const stateDrugTotals = Array.from(drugConsumptionByState.reduce((totals, row) => {
    totals.set(row.state, (totals.get(row.state) || 0) + row.quantity);
    return totals;
  }, new Map<string, number>()).entries())
    .map(([state, quantity]) => ({ state, quantity }))
    .sort((a, b) => b.quantity - a.quantity);
  const totalDistributedQuantity = filteredDrugDistributions.reduce((sum, item) => sum + (Number(item.quantityDistributed) || 0), 0);
  const paginatedReportPatients = reportPatients.slice(
    (patientResultsPage - 1) * reportPageSize,
    patientResultsPage * reportPageSize
  );
  const paginatedPatientSummary = reportData.patients.slice(
    (patientSummaryPage - 1) * reportPageSize,
    patientSummaryPage * reportPageSize
  );
  const paginatedVitalStatus = reportData.patients.slice(
    (vitalStatusPage - 1) * reportPageSize,
    vitalStatusPage * reportPageSize
  );
  const paginatedInventory = reportData.factors.slice(
    (inventoryPage - 1) * reportPageSize,
    inventoryPage * reportPageSize
  );
  const paginatedDrugConsumption = drugConsumptionByState.slice(
    (drugConsumptionPage - 1) * reportPageSize,
    drugConsumptionPage * reportPageSize
  );

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

      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={loadReportData}
            className="rounded-lg border border-amber-400 px-3 py-1.5 font-medium hover:bg-amber-100"
          >
            Retry loading
          </button>
        </div>
      )}

      {/* Report Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'patients', label: 'Patient Summary', icon: Users },
            { id: 'patient-analytics', label: 'Patient Analytics', icon: Activity },
            { id: 'vital-status', label: 'Alive / Died / Unknown', icon: Users },
            { id: 'drug-consumption', label: 'Drug Consumption by State', icon: Pill },
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
                    ? 'bg-red-600 text-white'
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
            <div className="bg-red-50 rounded-xl p-6 border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-red-700">{reportData.patients.length}</p>
                </div>
                <Users className="h-8 w-8 text-red-600" />
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
                  <p className="text-3xl font-bold text-orange-700">{new Set(reportData.factors.map(factor => factor.companyName).filter(Boolean)).size}</p>
                </div>
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drug Type Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Drug Type Distribution</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Drug Type</span>
                  <span>Quantity</span>
                </div>
              </div>
              <div className="space-y-3">
                {(() => {
                  const typeMap = new Map<string, number>();
                  reportData.factors.forEach(f => {
                    typeMap.set(f.drugType, (typeMap.get(f.drugType) || 0) + f.quantity);
                  });
                  const items = Array.from(typeMap.entries())
                    .map(([type, count]) => ({ type, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6);
                  const maxCount = Math.max(...items.map(i => i.count), 1);
                  return items.length > 0 ? items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate max-w-[140px]">{item.type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.max(10, (item.count / maxCount) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800 min-w-[2rem] text-right">
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-4">No drug data available</p>
                  );
                })()}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Total Drug Types: {new Set(reportData.factors.map(f => f.drugType)).size}
                </div>
              </div>
            </div>

            {/* Patient Severity Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Severity Distribution</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Severity</span>
                  <span>Count</span>
                </div>
              </div>
              <div className="space-y-3">
                {(() => {
                  const severityMap = new Map<string, number>();
                  reportData.patients.forEach(p => {
                    const rawSeverity = p.severity?.trim().toLowerCase() || 'unknown';
                    const sev = ['severe', 'moderate', 'mild'].includes(rawSeverity)
                      ? rawSeverity
                      : 'unknown';
                    severityMap.set(sev, (severityMap.get(sev) || 0) + 1);
                  });
                  const items = Array.from(severityMap.entries())
                    .map(([type, count]) => ({ type, count }))
                    .sort((a, b) => b.count - a.count);
                  const maxCount = Math.max(...items.map(i => i.count), 1);
                  const colorMap: Record<string, string> = {
                    severe: 'bg-red-600',
                    moderate: 'bg-yellow-500',
                    mild: 'bg-green-500',
                    unknown: 'bg-gray-400',
                  };
                  return items.length > 0 ? items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{item.type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`${colorMap[item.type] || 'bg-gray-500'} h-2 rounded-full`}
                            style={{ width: `${Math.max(10, (item.count / maxCount) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800 min-w-[2rem] text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-4">No patient data available</p>
                  );
                })()}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Total Patients: {reportData.patients.length}
                </div>
              </div>
            </div>
          </div>

          {/* State Distribution Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">State Distribution</h3>
              <PieChart className="h-5 w-5 text-red-600" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Patients by State</h4>
                {stateStats.length > 0 ? (() => {
                  const totalPatients = stateStats.reduce((total, stat) => total + stat.patientCount, 0);
                  let currentPercent = 0;
                  const chartSegments = stateStats.map((stat, index) => {
                    const startPercent = currentPercent;
                    currentPercent += (stat.patientCount / totalPatients) * 100;
                    return {
                      ...stat,
                      color: `hsl(${Math.round((index * 360) / stateStats.length)}, 70%, 50%)`,
                      startPercent,
                      endPercent: currentPercent,
                    };
                  });
                  const pieGradient = chartSegments
                    .map((segment) => `${segment.color} ${segment.startPercent}% ${segment.endPercent}%`)
                    .join(', ');

                  return (
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                      <div
                        className="h-48 w-48 flex-shrink-0 rounded-full border border-white shadow-inner"
                        style={{ background: `conic-gradient(${pieGradient})` }}
                        role="img"
                        aria-label={`Pie chart of ${totalPatients} patients across ${stateStats.length} states`}
                      />
                      <div className="max-h-56 w-full space-y-2 overflow-y-auto">
                        {chartSegments.map((segment) => (
                          <div key={segment.state} className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex min-w-0 items-center gap-2 text-gray-700">
                              <span className="h-3 w-3 flex-shrink-0 rounded-sm" style={{ backgroundColor: segment.color }} />
                              <span className="truncate" title={segment.state}>{segment.state}</span>
                            </span>
                            <span className="flex-shrink-0 font-medium text-gray-800">
                              {segment.patientCount} ({((segment.patientCount / totalPatients) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })() : (
                  <p className="py-8 text-center text-sm text-gray-500">No patient data available.</p>
                )}
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
            {/* <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Company Performance</h3>
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div> */}
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
              {/* <div>
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
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* Filtered Patient Analytics Report */}
      {activeReport === 'patient-analytics' && (
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-label="Patient report filters">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Patient Report Filters</h3>
                <p className="mt-1 text-sm text-gray-500">Filter the chart and patient results below.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPatientSearch('');
                  setPatientStateFilter('all');
                  setPatientGenderFilter('all');
                  setPatientSeverityFilter('all');
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Clear filters
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="search"
                aria-label="Search patients"
                placeholder="Search name, ID, diagnosis..."
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
              <select
                aria-label="Filter by state"
                value={patientStateFilter}
                onChange={(event) => setPatientStateFilter(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="all">All states</option>
                {Array.from(new Set(reportData.patients.map((p) => p.residenceState || p.state || 'Unknown'))).sort().map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <select
                aria-label="Filter by gender"
                value={patientGenderFilter}
                onChange={(event) => setPatientGenderFilter(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="all">All genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <select
                aria-label="Filter by severity"
                value={patientSeverityFilter}
                onChange={(event) => setPatientSeverityFilter(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="all">All severities</option>
                <option value="severe">Severe</option>
                <option value="moderate">Moderate</option>
                <option value="mild">Mild</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800">Patients in this report</h3>
              <p className="mt-3 text-4xl font-bold text-red-700">{reportPatients.length}</p>
              <p className="mt-1 text-sm text-gray-500">matching the selected filters</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
              <h3 className="mb-5 text-lg font-semibold text-gray-800">Patients by diagnosis</h3>
              {diagnosisChartData.length > 0 ? (
                <div className="space-y-4" role="img" aria-label="Horizontal bar chart showing patients grouped by diagnosis">
                  {diagnosisChartData.map(({ diagnosis, count }) => (
                    <div key={diagnosis} className="grid grid-cols-[minmax(6rem,9rem)_1fr_2.5rem] items-center gap-3">
                      <span className="truncate text-sm text-gray-600" title={diagnosis}>{diagnosis}</span>
                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-red-600 transition-all"
                          style={{ width: `${Math.max(5, (count / Math.max(...diagnosisChartData.map((item) => item.count))) * 100)}%` }}
                        />
                      </div>
                      <span className="text-right text-sm font-semibold text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">No patients match these filters.</p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
              <h3 className="text-lg font-semibold text-gray-800">Patient Results</h3>
              <button
                onClick={() => exportToCSV(reportPatients, 'filtered_patient_report')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" /> Export filtered results
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">National ID</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">State</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Gender</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Severity</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedReportPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-900">{patient.fullName}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{patient.nationalIdNumber || '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{patient.residenceState || patient.state || 'Unknown'}</td>
                      <td className="px-5 py-3 text-sm capitalize text-gray-600">{patient.gender || '—'}</td>
                      <td className="px-5 py-3 text-sm">
                        {(() => {
                          const severity = (patient.severity || 'unknown').toLowerCase();
                          const severityStyle: Record<string, string> = {
                            severe: 'bg-red-100 text-red-800',
                            moderate: 'bg-yellow-100 text-yellow-800',
                            mild: 'bg-green-100 text-green-800',
                            unknown: 'bg-gray-100 text-gray-700',
                          };
                          const label = severity === 'unknown'
                            ? 'Unknown'
                            : severity.charAt(0).toUpperCase() + severity.slice(1);
                          return (
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${severityStyle[severity] || severityStyle.unknown}`}>
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{patient.diagnosis || 'Not specified'}</td>
                    </tr>
                  ))}
                  {reportPatients.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">No results found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={patientResultsPage}
              pageSize={reportPageSize}
              totalItems={reportPatients.length}
              onPageChange={setPatientResultsPage}
              onPageSizeChange={(size) => { setReportPageSize(size); setPatientResultsPage(1); }}
            />
          </section>
        </div>
      )}

      {/* Patient Vital Status Report */}
      {activeReport === 'vital-status' && (
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-800">Patient Vital Status</h3>
              <p className="mt-1 text-sm text-gray-500">
                Current status breakdown from all {reportData.patients.length} patient records. Missing or unrecognized status is counted as Unknown.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {vitalStatusRows.map((item) => (
                <div key={item.label} className={`rounded-xl border p-5 ${item.card}`}>
                  <p className={`text-sm font-medium ${item.text}`}>{item.label}</p>
                  <p className={`mt-2 text-3xl font-bold ${item.text}`}>{item.count.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {reportData.patients.length > 0
                      ? `${((item.count / reportData.patients.length) * 100).toFixed(1)}% of patients`
                      : '0.0% of patients'}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-gray-800">Vital Status Distribution</h3>
            {reportData.patients.length > 0 ? (
              <div className="space-y-5" role="img" aria-label="Patient counts by vital status">
                {vitalStatusRows.map((item) => (
                  <div key={item.label} className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${item.style}`}
                        style={{ width: `${(item.count / reportData.patients.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-right text-sm text-gray-600">
                      {item.count} ({((item.count / reportData.patients.length) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">No patient records are available for this report.</p>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
              <h3 className="text-lg font-semibold text-gray-800">Patient Status Details</h3>
              <button
                type="button"
                onClick={() => exportToCSV(reportData.patients.map((patient) => ({
                  fullName: patient.fullName,
                  nationalIdNumber: patient.nationalIdNumber,
                  vitalStatus: patient.vitalStatus || 'Unknown',
                  state: patient.residenceState || patient.state || 'Unknown',
                  diagnosis: patient.diagnosis || '',
                })), 'patient_vital_status_report')}
                disabled={reportData.patients.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Export status report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">National ID</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Vital Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">State</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedVitalStatus.map((patient) => {
                    const status = patient.vitalStatus?.trim().toLowerCase();
                    const label = status === 'alive' ? 'Alive' : status === 'died' ? 'Died' : 'Unknown';
                    const badge = label === 'Alive' ? 'bg-green-100 text-green-800' : label === 'Died' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700';
                    return (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-900">{patient.fullName || '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{patient.nationalIdNumber || '—'}</td>
                        <td className="px-5 py-3 text-sm"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge}`}>{label}</span></td>
                        <td className="px-5 py-3 text-sm text-gray-600">{patient.residenceState || patient.state || 'Unknown'}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{patient.diagnosis || '—'}</td>
                      </tr>
                    );
                  })}
                  {reportData.patients.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">No patient records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={vitalStatusPage}
              pageSize={reportPageSize}
              totalItems={reportData.patients.length}
              onPageChange={setVitalStatusPage}
              onPageSizeChange={(size) => { setReportPageSize(size); setVitalStatusPage(1); }}
            />
          </section>
        </div>
      )}

      {/* Drug Consumption by State Report */}
      {activeReport === 'drug-consumption' && (
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Drug Consumption by State</h3>
                <p className="mt-1 text-sm text-gray-500">Quantities are based on drug distribution records.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrugSearch('');
                  setDrugStateFilter('all');
                  setDrugCategoryFilter('all');
                  setDrugFromDate('');
                  setDrugToDate('');
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Clear filters
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input
                type="search"
                aria-label="Search drug name"
                placeholder="Search drug..."
                value={drugSearch}
                onChange={(event) => setDrugSearch(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
              <select
                aria-label="Filter by distribution state"
                value={drugStateFilter}
                onChange={(event) => setDrugStateFilter(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="all">All states</option>
                {distributionStates.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
              <select
                aria-label="Filter by drug category"
                value={drugCategoryFilter}
                onChange={(event) => setDrugCategoryFilter(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="all">All drug categories</option>
                {distributionCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <label className="text-xs text-gray-500">
                From date
                <input
                  type="date"
                  value={drugFromDate}
                  max={drugToDate || undefined}
                  onChange={(event) => setDrugFromDate(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                />
              </label>
              <label className="text-xs text-gray-500">
                To date
                <input
                  type="date"
                  value={drugToDate}
                  min={drugFromDate || undefined}
                  onChange={(event) => setDrugToDate(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                />
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-red-100 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-700">Distributed quantity</p>
              <p className="mt-2 text-3xl font-bold text-red-800">{totalDistributedQuantity.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">Distribution records</p>
              <p className="mt-2 text-3xl font-bold text-blue-800">{filteredDrugDistributions.length.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
              <p className="text-sm font-medium text-purple-700">States included</p>
              <p className="mt-2 text-3xl font-bold text-purple-800">{stateDrugTotals.length.toLocaleString()}</p>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-gray-800">Distributed Quantity by State</h3>
            {stateDrugTotals.length > 0 ? (
              <div className="space-y-4" role="img" aria-label="Bar chart of total distributed drug quantity by state">
                {stateDrugTotals.map(({ state, quantity }) => (
                  <div key={state} className="grid grid-cols-[minmax(6rem,10rem)_1fr_5rem] items-center gap-3">
                    <span className="truncate text-sm text-gray-700" title={state}>{state}</span>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-red-600 transition-all"
                        style={{ width: `${(quantity / Math.max(...stateDrugTotals.map((item) => item.quantity), 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-right text-sm font-semibold text-gray-800">{quantity.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">
                {reportData.distributions.length === 0
                  ? 'No drug distribution records are available.'
                  : 'No distributions match the selected filters.'}
              </p>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Drug Quantity Details</h3>
                <p className="mt-1 text-sm text-gray-500">Grouped by state and drug.</p>
              </div>
              <button
                type="button"
                disabled={drugConsumptionByState.length === 0}
                onClick={() => exportToCSV(drugConsumptionByState, 'drug_consumption_by_state')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Export report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">State</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Drug</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Quantity distributed</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedDrugConsumption.map((row) => (
                    <tr key={`${row.state}-${row.drug}`} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-800">{row.state}</td>
                      <td className="px-5 py-3 text-sm text-gray-800">{row.drug}</td>
                      <td className="px-5 py-3 text-right text-sm font-medium text-gray-900">{row.quantity.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-sm text-gray-600">{row.records}</td>
                    </tr>
                  ))}
                  {drugConsumptionByState.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">No drug consumption data to display.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={drugConsumptionPage}
              pageSize={reportPageSize}
              totalItems={drugConsumptionByState.length}
              onPageChange={setDrugConsumptionPage}
              onPageSizeChange={(size) => { setReportPageSize(size); setDrugConsumptionPage(1); }}
            />
          </section>
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
                  {paginatedPatientSummary.map((patient) => (
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
            <Pagination
              page={patientSummaryPage}
              pageSize={reportPageSize}
              totalItems={reportData.patients.length}
              onPageChange={setPatientSummaryPage}
              onPageSizeChange={(size) => { setReportPageSize(size); setPatientSummaryPage(1); }}
            />
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
                    categoryMap.set(factor.drugType, (categoryMap.get(factor.drugType) || 0) + 1);
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
                  {paginatedInventory.map((factor) => {
                    const isExpired = new Date(factor.expiryDate) < new Date();
                    const isExpiringSoon = expiringFactors.some(ef => ef.id === factor.id);
                    return (
                      <tr key={factor.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{factor.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{factor.drugType}</td>
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
            <Pagination
              page={inventoryPage}
              pageSize={reportPageSize}
              totalItems={reportData.factors.length}
              onPageChange={setInventoryPage}
              onPageSizeChange={(size) => { setReportPageSize(size); setInventoryPage(1); }}
            />
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
              <MapPin className="h-5 w-5 text-red-600" />
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
                    <MapPin className="h-6 w-6 text-red-600 mr-2" />
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
          {/* <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
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
                            <span key={idx} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      )}
    </div>
  );
};