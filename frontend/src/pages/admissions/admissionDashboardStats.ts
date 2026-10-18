export interface AdmissionStats {
  totalInquiries: number;
  totalApplications: number;
  totalAdmitted: number;
  totalEnrolled: number;
  totalRejected: number;
  pendingTests: number;
  pendingInterviews: number;
}

export interface AdmissionReportData {
  byStatus?: Record<string, number>;
}

const APPLICATION_STATUSES = [
  'applied',
  'test_scheduled',
  'tested',
  'interview_scheduled',
  'interviewed',
  'admitted',
  'enrolled',
  'rejected',
  'withdrawn',
];

export function mapAdmissionReportStats(report?: AdmissionReportData | null): AdmissionStats {
  const byStatus = report?.byStatus ?? {};
  const count = (status: string) => Number(byStatus[status] ?? 0);

  return {
    totalInquiries: count('inquiry'),
    totalApplications: APPLICATION_STATUSES.reduce((total, status) => total + count(status), 0),
    totalAdmitted: count('admitted'),
    totalEnrolled: count('enrolled'),
    totalRejected: count('rejected'),
    pendingTests: count('applied') + count('test_scheduled'),
    pendingInterviews: count('tested') + count('interview_scheduled'),
  };
}
