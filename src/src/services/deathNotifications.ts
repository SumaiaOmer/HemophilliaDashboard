import { apiClient } from '../lib/api';
import {
  DeathNotification,
  DeathNotificationCreateRequest,
  DeathNotificationUpdateRequest,
  DeathNotificationStatistics,
} from '../types/api';

const normalizeField = <T>(...values: Array<T | undefined | null>): T | undefined => {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

const normalizeNotification = (notification: any): DeathNotification => {
  const patientName = normalizeField(
    notification.patientFullName,
    notification.PatientFullName,
    notification.patientName,
    notification.PatientName
  );
  const nationalId = normalizeField(
    notification.patientNationalIdNumber,
    notification.PatientNationalIdNumber,
    notification.patientNationalId,
    notification.PatientNationalId
  );

  return {
    id: notification.id || notification.Id,
    patientId: notification.patientId || notification.PatientId,
    referenceNumber: normalizeField(notification.referenceNumber, notification.ReferenceNumber),
    reporterName: normalizeField(notification.reporterName, notification.ReporterName, notification.notifiedBy, notification.NotifiedBy),
    reporterRelation: normalizeField(notification.reporterRelation, notification.ReporterRelation),
    reporterPhone: normalizeField(notification.reporterPhone, notification.ReporterPhone),
    reportDate: normalizeField(notification.reportDate, notification.ReportDate, notification.notificationDate, notification.NotificationDate, notification.dateOfDeath, notification.DateOfDeath),
    dateOfDeath: notification.dateOfDeath || notification.DateOfDeath || '',
    placeOfDeath: normalizeField(notification.placeOfDeath, notification.PlaceOfDeath),
    causeOfDeath: normalizeField(notification.causeOfDeath, notification.CauseOfDeath),
    directCauseOfDeath: normalizeField(notification.directCauseOfDeath, notification.DirectCauseOfDeath),
    underlyingCauseOfDeath: normalizeField(notification.underlyingCauseOfDeath, notification.UnderlyingCauseOfDeath),
    isDeathRelatedToBleedingDisorder: notification.isDeathRelatedToBleedingDisorder ?? notification.IsDeathRelatedToBleedingDisorder,
    complicationType: normalizeField(notification.complicationType, notification.ComplicationType),
    receivedClottingFactors: notification.receivedClottingFactors ?? notification.ReceivedClottingFactors,
    lastDoseDate: normalizeField(notification.lastDoseDate, notification.LastDoseDate),
    caseSummary: normalizeField(notification.caseSummary, notification.CaseSummary, notification.notes, notification.Notes),
    recommendations: normalizeField(notification.recommendations, notification.Recommendations),
    surveillanceOfficerName: normalizeField(notification.surveillanceOfficerName, notification.SurveillanceOfficerName),
    surveillanceOfficerSignature: normalizeField(notification.surveillanceOfficerSignature, notification.SurveillanceOfficerSignature),
    programDirectorName: normalizeField(notification.programDirectorName, notification.ProgramDirectorName),
    programDirectorSignature: normalizeField(notification.programDirectorSignature, notification.ProgramDirectorSignature),
    notifiedBy: normalizeField(notification.notifiedBy, notification.NotifiedBy),
    notificationDate: normalizeField(notification.notificationDate, notification.NotificationDate),
    notes: normalizeField(notification.notes, notification.Notes),
    patientFullName: patientName,
    patientName,
    patientNationalIdNumber: nationalId,
    patientNationalId: nationalId,
    patientDateOfBirth: normalizeField(notification.patientDateOfBirth, notification.PatientDateOfBirth),
    patientGender: normalizeField(notification.patientGender, notification.PatientGender),
    patientAge: normalizeField(notification.patientAge, notification.PatientAge),
    ageAtDeath: notification.ageAtDeath ?? notification.AgeAtDeath,
    patientDiagnosis: normalizeField(notification.patientDiagnosis, notification.PatientDiagnosis),
    patientSeverity: normalizeField(notification.patientSeverity, notification.PatientSeverity),
    patientState: normalizeField(notification.patientState, notification.PatientState),
    patientVitalStatus: normalizeField(notification.patientVitalStatus, notification.PatientVitalStatus),
    createdAt: normalizeField(notification.createdAt, notification.CreatedAt),
  };
};

const transformForApi = (data: DeathNotificationCreateRequest | DeathNotificationUpdateRequest): any => ({
  patientId: data.patientId,
  reporterName: data.reporterName || data.notifiedBy || '',
  reporterRelation: data.reporterRelation || 'Family Member',
  reporterPhone: data.reporterPhone || '',
  reportDate: data.reportDate || data.notificationDate || data.dateOfDeath,
  dateOfDeath: data.dateOfDeath,
  placeOfDeath: data.placeOfDeath || null,
  directCauseOfDeath: data.directCauseOfDeath || data.causeOfDeath || null,
  underlyingCauseOfDeath: data.underlyingCauseOfDeath || data.causeOfDeath || null,
  isDeathRelatedToBleedingDisorder: data.isDeathRelatedToBleedingDisorder ?? true,
  complicationType: data.complicationType || data.causeOfDeath || null,
  receivedClottingFactors: data.receivedClottingFactors ?? false,
  lastDoseDate: data.lastDoseDate || null,
  caseSummary: data.caseSummary || data.notes || null,
  recommendations: data.recommendations || null,
  surveillanceOfficerName: data.surveillanceOfficerName || null,
  surveillanceOfficerSignature: data.surveillanceOfficerSignature || null,
  programDirectorName: data.programDirectorName || null,
  programDirectorSignature: data.programDirectorSignature || null,
});

export class DeathNotificationsService {
  static async getAll(): Promise<DeathNotification[]> {
    const data = await apiClient.get<any>('/DeathNotification');
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeNotification);
  }

  static async getById(id: number): Promise<DeathNotification> {
    const data = await apiClient.get<any>(`/DeathNotification/${id}`);
    return normalizeNotification(data);
  }

  static async getByPatientId(patientId: number): Promise<DeathNotification[]> {
    const data = await apiClient.get<any>(`/DeathNotification/patient/${patientId}`);
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeNotification);
  }

  static async getByReferenceNumber(referenceNumber: string): Promise<DeathNotification | null> {
    try {
      const data = await apiClient.get<any>(`/DeathNotification/reference/${encodeURIComponent(referenceNumber)}`);
      if (!data) return null;
      if (Array.isArray(data)) return data.length > 0 ? normalizeNotification(data[0]) : null;
      return normalizeNotification(data);
    } catch {
      return null;
    }
  }

  static async getByDateRange(startDate: string, endDate: string): Promise<DeathNotification[]> {
    const data = await apiClient.get<any>(
      `/DeathNotification/date-range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeNotification);
  }

  static async getStatistics(startDate?: string, endDate?: string): Promise<DeathNotificationStatistics> {
    let endpoint = '/DeathNotification/statistics';
    const params: string[] = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;

    const data = await apiClient.get<any>(endpoint);
    return {
      totalDeaths: data?.totalDeaths ?? data?.TotalDeaths ?? data?.total ?? 0,
      deathsByCause: data?.deathsByCause ?? data?.DeathsByCause,
      deathsByState: data?.deathsByState ?? data?.DeathsByState,
      deathsByMonth: data?.deathsByMonth ?? data?.DeathsByMonth,
      averageAgeAtDeath: data?.averageAgeAtDeath ?? data?.AverageAgeAtDeath,
      deathsByGender: data?.deathsByGender ?? data?.DeathsByGender,
    };
  }

  static async generateReference(): Promise<string> {
    const data = await apiClient.post<any>('/DeathNotification/generate-reference', undefined);
    if (typeof data === 'string') return data;
    return data?.referenceNumber || data?.ReferenceNumber || data?.reference || data?.Reference || '';
  }

  static async patientHasRecord(patientId: number): Promise<boolean> {
    try {
      const data = await apiClient.get<any>(`/DeathNotification/patient/${patientId}/has-record`);
      if (typeof data === 'boolean') return data;
      return data === true || data?.hasRecord === true || data?.HasRecord === true;
    } catch {
      return false;
    }
  }

  static async create(notification: DeathNotificationCreateRequest): Promise<DeathNotification> {
    const data = await apiClient.post<any>('/DeathNotification', transformForApi(notification));
    return normalizeNotification(data || notification);
  }

  static async update(id: number, notification: DeathNotificationUpdateRequest): Promise<void> {
    await apiClient.put(`/DeathNotification/${id}`, transformForApi(notification));
  }

  static async delete(id: number): Promise<void> {
    await apiClient.delete(`/DeathNotification/${id}`);
  }
}
