import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  Search,
  X,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DeathNotification, DeathNotificationCreateRequest, Patient } from '../../types/api';
import { DeathNotificationsService } from '../../services/deathNotifications';
import { PatientsService } from '../../services/patients';
import { DeathNotificationForm } from './DeathNotificationForm';
import { formatDate, toDateInputValue } from '../../lib/dateUtils';

export const DeathNotificationsManager: React.FC = () => {
  const [notifications, setNotifications] = useState<DeathNotification[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [view, setView] = useState<'list' | 'statistics'>('list');
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (view === 'statistics') {
      DeathNotificationsService.getStatistics(
        startDate || undefined,
        endDate || undefined
      )
        .then(setStatistics)
        .catch((err) => console.error('Error loading statistics:', err));
    }
  }, [view, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientsResult, notificationsResult] = await Promise.allSettled([
        PatientsService.getAll(),
        DeathNotificationsService.getAll(),
      ]);

      if (patientsResult.status === 'fulfilled') {
        setPatients(patientsResult.value);
      } else {
        console.error('Error loading patients:', patientsResult.reason);
        setPatients([]);
      }

      if (notificationsResult.status === 'fulfilled') {
        setNotifications(notificationsResult.value);
      } else {
        console.error('Error loading death notifications:', notificationsResult.reason);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading death notifications data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (notificationData: DeathNotificationCreateRequest) => {
    try {
      await DeathNotificationsService.create(notificationData);
      await loadData();
      setShowForm(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save notification';
      throw new Error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this death notification?')) {
      try {
        await DeathNotificationsService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting death notification:', error);
      }
    }
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) return patient.fullName;
    const notification = notifications.find((n) => n.patientId === patientId);
    return notification?.patientFullName || `Patient ID: ${patientId}`;
  };

  const getPatientNationalId = (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) return patient.nationalIdNumber || 'N/A';
    const notification = notifications.find((n) => n.patientId === patientId);
    return notification?.patientNationalIdNumber || 'N/A';
  };

  const filteredNotifications = notifications.filter((notification) => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = getPatientName(notification.patientId).toLowerCase();
    const nationalId = getPatientNationalId(notification.patientId).toLowerCase();
    const reference = (notification.referenceNumber || '').toLowerCase();
    const cause = (notification.causeOfDeath || '').toLowerCase();

    const matchesSearch =
      patientName.includes(searchLower) ||
      nationalId.includes(searchLower) ||
      reference.includes(searchLower) ||
      cause.includes(searchLower);

    let matchesDateRange = true;
    if (startDate || endDate) {
      const deathDate = new Date(notification.dateOfDeath);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && deathDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && deathDate <= end;
      }
    }

    return matchesSearch && matchesDateRange;
  });

  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => new Date(b.dateOfDeath).getTime() - new Date(a.dateOfDeath).getTime()
  );

  const hasActiveFilters = searchTerm || startDate || endDate;

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const renderStatistics = () => {
    if (!statistics) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      );
    }

    const totalDeaths = statistics.totalDeaths ?? 0;
    const averageAge = statistics.averageAgeAtDeath;
    const deathsByGender = statistics.deathsByGender || {};
    const deathsByCause = statistics.deathsByCause || {};
    const deathsByState = statistics.deathsByState || {};
    const deathsByMonth = statistics.deathsByMonth || [];

    const maxCauseCount = Math.max(...Object.values(deathsByCause), 1);
    const maxStateCount = Math.max(...Object.values(deathsByState), 1);
    const maxMonthCount = Math.max(...deathsByMonth.map((m: any) => m.count), 1);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 rounded-xl p-6 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Total Deaths</p>
                <p className="text-3xl font-bold text-red-700">{totalDeaths}</p>
              </div>
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Average Age at Death</p>
                <p className="text-3xl font-bold text-blue-700">
                  {averageAge !== undefined && averageAge !== null ? `${averageAge} yrs` : 'N/A'}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">In Date Range</p>
                <p className="text-3xl font-bold text-purple-700">
                  {sortedNotifications.length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Deaths by Cause</h3>
            <div className="space-y-3">
              {Object.keys(deathsByCause).length > 0 ? (
                Object.entries(deathsByCause).map(([cause, count]) => (
                  <div key={cause} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate max-w-[200px]">{cause}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${Math.max(10, ((count as number) / maxCauseCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 min-w-[2rem] text-right">
                        {count as number}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No cause data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Deaths by State</h3>
            <div className="space-y-3">
              {Object.keys(deathsByState).length > 0 ? (
                Object.entries(deathsByState).map(([state, count]) => (
                  <div key={state} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate max-w-[200px]">{state}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.max(10, ((count as number) / maxStateCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 min-w-[2rem] text-right">
                        {count as number}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No state data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Deaths by Gender</h3>
            <div className="space-y-3">
              {Object.keys(deathsByGender).length > 0 ? (
                Object.entries(deathsByGender).map(([gender, count]) => (
                  <div key={gender} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{gender}</span>
                    <span className="text-sm font-medium text-gray-800">{count as number}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No gender data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Deaths by Month</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {deathsByMonth.length > 0 ? (
                deathsByMonth.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate max-w-[140px]">{item.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.max(10, (item.count / maxMonthCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 min-w-[2rem] text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No monthly data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Death Notifications</h2>
          <p className="text-gray-600">Record and track patient death notifications</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Notification</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setView('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              view === 'list' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Notifications List</span>
          </button>
          <button
            onClick={() => setView('statistics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              view === 'statistics' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Statistics</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, national ID, reference, or cause..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              placeholder="End Date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        )}

        <div className="mt-3 text-sm text-gray-500">
          Showing {sortedNotifications.length} of {notifications.length} notifications
        </div>
      </div>

      {view === 'statistics' && renderStatistics()}

      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNotifications.map((notification) => {
            const patientName = getPatientName(notification.patientId);
            const nationalId = getPatientNationalId(notification.patientId);

            return (
              <div
                key={notification.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">{patientName}</h3>
                      <p className="text-xs text-gray-500">ID: {nationalId}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {notification.referenceNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium text-gray-900">{notification.referenceNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Date of Death: {formatDate(notification.dateOfDeath)}</span>
                  </div>
                  {notification.causeOfDeath && (
                    <div className="flex items-start text-gray-600">
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Cause: {notification.causeOfDeath}</span>
                    </div>
                  )}
                  {notification.placeOfDeath && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Place: {notification.placeOfDeath}</span>
                    </div>
                  )}
                  {notification.reporterName && (
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span>Reporter: {notification.reporterName}</span>
                    </div>
                  )}
                  {notification.reporterPhone && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium text-gray-600 mr-2">Phone:</span>
                      <span>{notification.reporterPhone}</span>
                    </div>
                  )}
                  {notification.reportDate && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium text-gray-600 mr-2">Report Date:</span>
                      <span>{formatDate(notification.reportDate)}</span>
                    </div>
                  )}
                  {notification.directCauseOfDeath && (
                    <div className="flex items-start text-gray-600">
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Direct cause: {notification.directCauseOfDeath}</span>
                    </div>
                  )}
                  {notification.underlyingCauseOfDeath && (
                    <div className="flex items-start text-gray-600">
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Underlying cause: {notification.underlyingCauseOfDeath}</span>
                    </div>
                  )}
                  {notification.complicationType && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium text-gray-600 mr-2">Complication:</span>
                      <span>{notification.complicationType}</span>
                    </div>
                  )}
                  {notification.receivedClottingFactors !== undefined && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium text-gray-600 mr-2">Clotting factors:</span>
                      <span>{notification.receivedClottingFactors ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {notification.lastDoseDate && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium text-gray-600 mr-2">Last dose:</span>
                      <span>{formatDate(notification.lastDoseDate)}</span>
                    </div>
                  )}
                  {notification.caseSummary && (
                    <div className="pt-2 border-t border-gray-100 text-gray-500 text-xs italic">
                      <span className="font-semibold text-gray-700">Summary:</span> {notification.caseSummary}
                    </div>
                  )}
                  {notification.recommendations && (
                    <div className="text-gray-600 text-xs italic">
                      <span className="font-semibold text-gray-700">Recommendations:</span> {notification.recommendations}
                    </div>
                  )}
                  {notification.surveillanceOfficerName && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium text-gray-600 mr-2">Surveillance officer:</span>
                      <span>{notification.surveillanceOfficerName}</span>
                    </div>
                  )}
                  {notification.programDirectorName && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium text-gray-600 mr-2">Program director:</span>
                      <span>{notification.programDirectorName}</span>
                    </div>
                  )}
                  {notification.notes && !notification.caseSummary && (
                    <div className="pt-2 border-t border-gray-100 text-gray-500 text-xs italic">
                      {notification.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'list' && sortedNotifications.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No death notifications found</p>
          {hasActiveFilters && (
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or date filters</p>
          )}
        </div>
      )}

      {showForm && (
        <DeathNotificationForm
          patients={patients}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
};
