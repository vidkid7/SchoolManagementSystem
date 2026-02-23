export interface EnrollmentReportParams {
  academicYearId?: string;
  classId?: string;
  section?: string;
  gender?: 'male' | 'female' | 'other';
  shift?: 'morning' | 'day' | 'evening';
}

export interface AttendanceReportParams {
  startDate: string;
  endDate: string;
  classId?: string;
  section?: string;
  studentId?: string;
}

export interface FeeCollectionReportParams {
  startDate: string;
  endDate: string;
  classId?: string;
  section?: string;
  status?: 'pending' | 'partial' | 'paid' | 'overdue';
}

export interface ExaminationReportParams {
  examId?: string;
  classId?: string;
  subjectId?: string;
  academicYearId?: string;
  termId?: string;
}

export interface TeacherPerformanceReportParams {
  teacherId?: string;
  startDate: string;
  endDate: string;
}

export interface LibraryReportParams {
  startDate: string;
  endDate: string;
  category?: string;
}

export interface ECAReportParams {
  academicYearId?: string;
  ecaId?: string;
}

export interface SportsReportParams {
  academicYearId?: string;
  sportId?: string;
}

export interface EnrollmentReport {
  totalStudents: number;
  byClass: Array<{ class: number; section: string; count: number }>;
  byGender: Array<{ gender: string; count: number }>;
  byShift: Array<{ shift: string; count: number }>;
  trend: Array<{ date: string; count: number }>;
}

export interface AttendanceReport {
  totalDays: number;
  averageAttendance: number;
  byClass: Array<{ class: number; section: string; attendanceRate: number }>;
  byDate: Array<{ date: string; presentCount: number; absentCount: number; lateCount: number }>;
  lowAttendanceStudents: Array<{ studentId: string; studentName: string; attendanceRate: number }>;
}

export interface FeeCollectionReport {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  byClass: Array<{ class: number; section: string; collected: number; pending: number }>;
  byDate: Array<{ date: string; amount: number }>;
  byPaymentMethod: Array<{ method: string; amount: number; count: number }>;
  defaulters: Array<{ studentId: string; studentName: string; pendingAmount: number }>;
}

export interface ExaminationReport {
  totalStudents: number;
  averageMarks: number;
  averageGPA: number;
  passRate: number;
  gradeDistribution: Array<{ grade: string; count: number; percentage: number }>;
  subjectWisePerformance: Array<{ subjectName: string; averageMarks: number; passRate: number }>;
  topPerformers: Array<{ studentId: string; studentName: string; totalMarks: number; gpa: number }>;
}

export interface TeacherPerformanceReport {
  teacherId: string;
  teacherName: string;
  attendanceRate: number;
  totalClasses: number;
  classesAttended: number;
  syllabusCompletion: number;
  subjects: Array<{ subjectName: string; completionRate: number }>;
}

export interface LibraryReport {
  totalBooks: number;
  totalIssued: number;
  totalReturned: number;
  overdueBooks: number;
  mostBorrowedBooks: Array<{ bookTitle: string; author: string; borrowCount: number }>;
  activeMembers: Array<{ studentId: string; studentName: string; borrowCount: number }>;
  fineCollected: number;
}

export interface ECAReport {
  totalActivities: number;
  totalParticipants: number;
  byActivity: Array<{ activityName: string; participantCount: number }>;
  byCategory: Array<{ category: string; count: number }>;
  achievements: Array<{ studentName: string; activityName: string; achievement: string }>;
}

export interface SportsReport {
  totalSports: number;
  totalParticipants: number;
  bySport: Array<{ sportName: string; participantCount: number }>;
  tournaments: Array<{ tournamentName: string; date: string; participants: number }>;
  achievements: Array<{ studentName: string; sportName: string; achievement: string; rank: number }>;
}

export interface DashboardSummary {
  totalStudents: number;
  totalStaff: number;
  totalClasses?: number;
  totalBooks?: number;
  attendanceRate: number;
  feeCollectionRate: number;
  totalMaleStudents: number;
  totalFemaleStudents: number;
  newAdmissionsThisMonth: number;
  totalExams: number;
  pendingFeeStudents: number;
}

export interface ChartData {
  label: string;
  value: number;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface DashboardData {
  summary: DashboardSummary;
  charts: {
    enrollmentTrend: ChartData[];
    attendanceTrend: ChartData[];
    feeCollection: ChartData[];
    examPerformance: ChartData[];
    genderDistribution: ChartData[];
    staffByDepartment: ChartData[];
    feeByClass: ChartData[];
    monthlyNewAdmissions: ChartData[];
  };
  recentActivities: Array<{
    id: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
}
