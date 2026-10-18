import { mapAdmissionReportStats } from './admissionDashboardStats';

describe('mapAdmissionReportStats', () => {
  it('maps the admissions report status buckets to dashboard metrics', () => {
    expect(mapAdmissionReportStats({
      byStatus: {
        inquiry: 2,
        applied: 3,
        test_scheduled: 4,
        tested: 5,
        interview_scheduled: 6,
        interviewed: 7,
        admitted: 8,
        enrolled: 9,
        rejected: 10,
        withdrawn: 11,
      },
    })).toEqual({
      totalInquiries: 2,
      totalApplications: 63,
      totalAdmitted: 8,
      totalEnrolled: 9,
      totalRejected: 10,
      pendingTests: 7,
      pendingInterviews: 11,
    });
  });

  it('returns zeroed metrics when the report has no status buckets', () => {
    expect(mapAdmissionReportStats(null)).toEqual({
      totalInquiries: 0,
      totalApplications: 0,
      totalAdmitted: 0,
      totalEnrolled: 0,
      totalRejected: 0,
      pendingTests: 0,
      pendingInterviews: 0,
    });
  });
});
