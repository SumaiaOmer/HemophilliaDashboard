import { apiClient } from '../lib/api';
import { PatientVisit, PatientVisitRequest } from '../types/api';

export class PatientVisitsService {
  static async getAll(): Promise<PatientVisit[]> {
    const data = await apiClient.get<PatientVisit[]>('/patientVisits');
    const visits = (Array.isArray(data) ? data : []).map(this.normalizeVisit);
    return visits.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }

  static async getById(id: number): Promise<PatientVisit> {
    const data = await apiClient.get<PatientVisit>(`/patientVisits/${id}`);
    return this.normalizeVisit(data);
  }

  private static normalizeVisit(visit: any): PatientVisit {
    let drugs: any[] = [];
    const drugsField = visit.Drugs || visit.drugs;
    if (drugsField && Array.isArray(drugsField)) {
      drugs = drugsField.map((drug: any) => ({
        drugId: drug.DrugId || drug.drugId || 0,
        quantity: drug.Quantity || drug.quantity || 0
      }));
    }

    return {
      id: visit.Id || visit.id,
      patientId: visit.PatientId || visit.patient_id || visit.patientId,
      visitDate: visit.VisitDate || visit.visit_date || visit.visitDate,
      centerName: visit.CenterName || visit.center_name || visit.centerName,
      visitType: visit.VisitType || visit.visit_type || visit.visitType,
      diagnosisType: visit.DiagnosisType || visit.diagnosis_type || visit.diagnosisType,
      complaint: visit.Complaint || visit.complaint,
      notes: visit.Notes || visit.notes,
      enteredBy: visit.EnteredBy || visit.entered_by || visit.enteredBy,
      vitalStatus: visit.VitalStatus || visit.vitalStatus || visit.vital_status,
      managementPlan: visit.ManagementPlan || visit.managementPlan || visit.management_plan,
      drugs: drugs.length > 0 ? drugs : undefined,
    };
  }

  private static transformForAPI(visit: PatientVisitRequest): any {
    const transformed: any = {
      PatientId: visit.patientId,
      VisitType: visit.visitType || null,
      ServiceType: visit.serviceType || null,
      VisitDate: visit.visitDate,
      Diagnosis: visit.diagnosis || null,
      DiagnosisType: visit.diagnosisType || null,
      Complaint: visit.complaint || null,
      ComplaintOther: visit.complaintOther || null,
      ComplaintDetails: visit.complaintDetails || null,
      ManagementPlan: visit.managementPlan || null,
      Notes: visit.notes || null,
      CenterState: visit.centerState || null,
      State: visit.state || null,
      CenterName: visit.centerName || null,
      EnteredBy: visit.enteredBy || null,
      HasInhibitors: visit.hasInhibitors || false,
      InhibitorLevel: visit.inhibitorLevel || null,
      VitalStatus: visit.vitalStatus || null,
    };

    if (visit.drugs && visit.drugs.length > 0) {
      transformed.Drugs = visit.drugs.map(drug => ({
        DrugId: drug.drugId,
        Quantity: drug.quantity
      }));
    }

    if (visit.tests && visit.tests.length > 0) {
      transformed.Tests = visit.tests.map(test => ({
        TestName: test.testName,
        Result: test.result,
        TestDate: test.testDate
      }));
    }

    return transformed;
  }

  static async create(visit: PatientVisitRequest): Promise<PatientVisit> {
    const transformed = this.transformForAPI(visit);
    const data = await apiClient.post<PatientVisit>('/patientVisits', transformed);
    return this.normalizeVisit(data);
  }

  static async update(id: number, visit: PatientVisitRequest): Promise<void> {
    const transformed = this.transformForAPI(visit);
    await apiClient.put(`/patientVisits/${id}`, transformed);
  }

  static async delete(id: number): Promise<void> {
    await apiClient.delete(`/patientVisits/${id}`);
  }
}
