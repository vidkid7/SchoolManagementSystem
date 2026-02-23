/**
 * Main App Component
 * 
 * Root component with routing, lite mode, and lazy-loaded routes
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { CssBaseline, CircularProgress, Box, Typography, Button } from '@mui/material';
import { store } from './store';
import './i18n/config';
import { ThemeProvider } from './theme/ThemeContext';
import { AccessibilityProvider, useAccessibility } from './contexts/AccessibilityContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useNetworkMonitor } from './hooks/useNetworkMonitor';
import { selectShouldDisableAnimations } from './store/slices/liteModeSlice';
import type { RootState } from './store';

const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));

const StudentList = React.lazy(() => import('./pages/students/StudentList').then(m => ({ default: m.StudentList })));
const StudentForm = React.lazy(() => import('./pages/students/StudentForm').then(m => ({ default: m.StudentForm })));
const StudentDetail = React.lazy(() => import('./pages/students/StudentDetail').then(m => ({ default: m.StudentDetail })));
const BulkImport = React.lazy(() => import('./pages/students/BulkImport').then(m => ({ default: m.BulkImport })));
const StudentCV = React.lazy(() => import('./pages/students/StudentCV').then(m => ({ default: m.StudentCV })));

const AttendanceMarking = React.lazy(() => import('./pages/attendance/AttendanceMarking').then(m => ({ default: m.AttendanceMarking })));
const AttendanceDashboard = React.lazy(() => import('./pages/attendance/AttendanceDashboard').then(m => ({ default: m.AttendanceDashboard })));
const AttendanceReports = React.lazy(() => import('./pages/attendance/AttendanceReports').then(m => ({ default: m.AttendanceReports })));
const StaffAttendanceMarking = React.lazy(() => import('./pages/attendance/StaffAttendanceMarking').then(m => ({ default: m.StaffAttendanceMarking })));
const LeaveManagement = React.lazy(() => import('./pages/attendance/LeaveManagement').then(m => ({ default: m.LeaveManagement })));
const AttendanceSettings = React.lazy(() => import('./pages/attendance/AttendanceSettings').then(m => ({ default: m.AttendanceSettings })));

const FinanceDashboard = React.lazy(() => import('./pages/finance/FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));
const FeeStructures = React.lazy(() => import('./pages/finance/FeeStructures').then(m => ({ default: m.FeeStructures })));
const InvoiceList = React.lazy(() => import('./pages/finance/InvoiceList').then(m => ({ default: m.InvoiceList })));
const Payments = React.lazy(() => import('./pages/finance/Payments').then(m => ({ default: m.Payments })));
const PaymentGateways = React.lazy(() => import('./pages/finance/PaymentGateways').then(m => ({ default: m.PaymentGateways })));
const FinancialReports = React.lazy(() => import('./pages/finance/FinancialReports').then(m => ({ default: m.FinancialReports })));

const StaffList = React.lazy(() => import('./pages/staff/StaffList').then(m => ({ default: m.StaffList })));
const StaffForm = React.lazy(() => import('./pages/staff/StaffForm').then(m => ({ default: m.StaffForm })));
const StaffDetail = React.lazy(() => import('./pages/staff/StaffDetail').then(m => ({ default: m.StaffDetail })));
const StaffAssignments = React.lazy(() => import('./pages/staff/StaffAssignments').then(m => ({ default: m.StaffAssignments })));

const ClassManagement = React.lazy(() => import('./pages/academic/ClassManagement').then(m => ({ default: m.ClassManagement })));
const AcademicDashboard = React.lazy(() => import('./pages/academic/AcademicDashboard').then(m => ({ default: m.AcademicDashboard })));
const AcademicYears = React.lazy(() => import('./pages/academic/AcademicYears').then(m => ({ default: m.AcademicYears })));
const AcademicCalendar = React.lazy(() => import('./pages/academic/Calendar').then(m => ({ default: m.Calendar })));
const Timetable = React.lazy(() => import('./pages/academic/Timetable').then(m => ({ default: m.Timetable })));
const Syllabus = React.lazy(() => import('./pages/academic/Syllabus').then(m => ({ default: m.Syllabus })));
const ClassSubjects = React.lazy(() => import('./pages/academic/ClassSubjects').then(m => ({ default: m.ClassSubjects })));
const ClassTeacherView = React.lazy(() => import('./pages/academic/ClassTeacherView').then(m => ({ default: m.ClassTeacherView })));
const SubjectTeachersView = React.lazy(() => import('./pages/academic/SubjectTeachersView').then(m => ({ default: m.SubjectTeachersView })));

const ExaminationDashboard = React.lazy(() => import('./pages/examinations/ExaminationDashboard').then(m => ({ default: m.ExaminationDashboard })));
const ExamList = React.lazy(() => import('./pages/examinations/ExamList').then(m => ({ default: m.ExamList })));
const CreateExam = React.lazy(() => import('./pages/examinations/CreateExam').then(m => ({ default: m.CreateExam })));
const GradeEntry = React.lazy(() => import('./pages/examinations/GradeEntry').then(m => ({ default: m.GradeEntry })));
const GradingScheme = React.lazy(() => import('./pages/examinations/GradingScheme').then(m => ({ default: m.GradingScheme })));
const ReportCards = React.lazy(() => import('./pages/examinations/ReportCards').then(m => ({ default: m.ReportCards })));

const LibraryDashboard = React.lazy(() => import('./pages/library/LibraryDashboard').then(m => ({ default: m.LibraryDashboard })));
const BookCatalog = React.lazy(() => import('./pages/library/BookCatalog').then(m => ({ default: m.BookCatalog })));
const BookCirculation = React.lazy(() => import('./pages/library/BookCirculation').then(m => ({ default: m.BookCirculation })));
const LibraryCategories = React.lazy(() => import('./pages/library/Categories').then(m => ({ default: m.Categories })));
const LibraryReports = React.lazy(() => import('./pages/library/LibraryReports').then(m => ({ default: m.LibraryReports })));
const LibraryManagement = React.lazy(() => import('./pages/library/LibraryManagement').then(m => ({ default: m.LibraryManagement })));

const ECADashboard = React.lazy(() => import('./pages/eca/ECADashboard').then(m => ({ default: m.ECADashboard })));
const ECAList = React.lazy(() => import('./pages/eca/ECAList').then(m => ({ default: m.ECAList })));
const ECAManagement = React.lazy(() => import('./pages/eca/ECAManagement').then(m => ({ default: m.ECAManagement })));

const SportsDashboard = React.lazy(() => import('./pages/sports/SportsDashboard').then(m => ({ default: m.SportsDashboard })));
const SportsManagement = React.lazy(() => import('./pages/sports/SportsManagement').then(m => ({ default: m.SportsManagement })));

const AdmissionDashboard = React.lazy(() => import('./pages/admissions/AdmissionDashboard').then(m => ({ default: m.AdmissionDashboard })));
const AdmissionList = React.lazy(() => import('./pages/admissions/AdmissionList').then(m => ({ default: m.AdmissionList })));
const NewInquiry = React.lazy(() => import('./pages/admissions/NewInquiry').then(m => ({ default: m.NewInquiry })));
const AdmissionDetail = React.lazy(() => import('./pages/admissions/AdmissionDetail').then(m => ({ default: m.AdmissionDetail })));

const ReportsAnalytics = React.lazy(() => import('./pages/reports/ReportsAnalytics'));

const TeacherDashboard = React.lazy(() => import('./pages/teacher/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const LessonPlanning = React.lazy(() => import('./pages/teacher/LessonPlanning').then(m => ({ default: m.LessonPlanning })));
const AssignmentManagement = React.lazy(() => import('./pages/teacher/AssignmentManagement').then(m => ({ default: m.AssignmentManagement })));

const Messaging = React.lazy(() => import('./pages/communication/Messaging').then(m => ({ default: m.Messaging })));
const Announcements = React.lazy(() => import('./pages/communication/Announcements').then(m => ({ default: m.Announcements })));

const CertificateManagement = React.lazy(() => import('./pages/certificates/CertificateManagement').then(m => ({ default: m.CertificateManagement })));
const CertificateVerification = React.lazy(() => import('./pages/certificates/CertificateVerification').then(m => ({ default: m.CertificateVerification })));
const StudentCertificates = React.lazy(() => import('./pages/certificates/StudentCertificates').then(m => ({ default: m.StudentCertificates })));
const CertificateDashboard = React.lazy(() => import('./pages/certificates/CertificateDashboard').then(m => ({ default: m.CertificateDashboard })));
const TemplateManagement = React.lazy(() => import('./pages/certificates/TemplateManagement').then(m => ({ default: m.TemplateManagement })));

const DocumentManagement = React.lazy(() => import('./pages/documents/DocumentManagement').then(m => ({ default: m.DocumentManagement })));
const Calendar = React.lazy(() => import('./pages/calendar/Calendar'));
const CalendarDashboard = React.lazy(() => import('./pages/calendar/CalendarDashboard').then(m => ({ default: m.CalendarDashboard })));
const EventManagement = React.lazy(() => import('./pages/calendar/EventManagement').then(m => ({ default: m.EventManagement })));
const AuditLogs = React.lazy(() => import('./pages/audit/AuditLogs'));
const NotificationCenter = React.lazy(() => import('./pages/notifications/NotificationCenter').then(m => ({ default: m.NotificationCenter })));
const UserManagement = React.lazy(() => import('./pages/users/UserManagement').then(m => ({ default: m.UserManagement })));

const StudentPortal = React.lazy(() => import('./pages/portals/EnhancedStudentPortal'));
const ParentPortal = React.lazy(() => import('./pages/portals/ParentPortal'));
const AdminSettings = React.lazy(() => import('./pages/portals/AdminSettings'));
const TransportPortal = React.lazy(() => import('./pages/portals/TransportPortal'));
const HostelPortal = React.lazy(() => import('./pages/portals/HostelPortal'));
const NonTeachingStaffPortal = React.lazy(() => import('./pages/portals/NonTeachingStaffPortal'));

const RoleManagement = React.lazy(() => import('./pages/settings/RoleManagement').then(m => ({ default: m.RoleManagement })));
const SystemSettings = React.lazy(() => import('./pages/settings/SystemSettings').then(m => ({ default: m.SystemSettings })));
const SchoolConfiguration = React.lazy(() => import('./pages/settings/SchoolConfiguration').then(m => ({ default: m.SchoolConfiguration })));
const BackupManagement = React.lazy(() => import('./pages/settings/BackupManagement').then(m => ({ default: m.BackupManagement })));
const ArchiveManagement = React.lazy(() => import('./pages/settings/ArchiveManagement').then(m => ({ default: m.ArchiveManagement })));

const ADMIN = 'School_Admin';
const CLASS_TEACHER = 'Class_Teacher';
const SUBJECT_TEACHER = 'Subject_Teacher';
const DEPT_HEAD = 'Department_Head';
const ECA_COORD = 'ECA_Coordinator';
const SPORTS_COORD = 'Sports_Coordinator';
const STUDENT = 'Student';
const PARENT = 'Parent';
const LIBRARIAN = 'Librarian';
const ACCOUNTANT = 'Accountant';
const TRANSPORT = 'Transport_Manager';
const HOSTEL = 'Hostel_Warden';
const NON_TEACHING = 'Non_Teaching_Staff';

const ALL_ROLES = [ADMIN, CLASS_TEACHER, SUBJECT_TEACHER, DEPT_HEAD, ECA_COORD, SPORTS_COORD, STUDENT, PARENT, LIBRARIAN, ACCOUNTANT, TRANSPORT, HOSTEL, NON_TEACHING];
const TEACHER_ROLES = [ADMIN, CLASS_TEACHER, SUBJECT_TEACHER, DEPT_HEAD];
const STAFF_ROLES = [ADMIN, CLASS_TEACHER, SUBJECT_TEACHER, DEPT_HEAD, ECA_COORD, SPORTS_COORD, LIBRARIAN, ACCOUNTANT, TRANSPORT, HOSTEL, NON_TEACHING];

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  );
}

function UnauthorizedPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
      <Typography variant="h4" color="error">Access Denied</Typography>
      <Typography variant="body1" color="text.secondary">You do not have permission to view this page.</Typography>
      <Button variant="contained" onClick={() => window.history.back()}>Go Back</Button>
    </Box>
  );
}

function AppContent() {
  useNetworkMonitor();

  const shouldDisableAnimations = useSelector((state: RootState) =>
    selectShouldDisableAnimations(state)
  );

  return (
    <AccessibilityProvider>
      <ThemeProviderWithAccessibility disableAnimations={shouldDisableAnimations} />
    </AccessibilityProvider>
  );
}

function ThemeProviderWithAccessibility({ disableAnimations }: { disableAnimations: boolean }) {
  const { highContrastMode } = useAccessibility();

  return (
    <ThemeProvider
      defaultMode="light"
      defaultPrimaryColor="#1976d2"
      defaultSecondaryColor="#dc004e"
      disableAnimations={disableAnimations}
      highContrast={highContrastMode}
    >
      <CssBaseline />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Admin and Staff Dashboard */}
            <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
            </Route>

            {/* Calendar, Messages, Announcements - accessible to all logged-in users */}
            <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/calendar/view" element={<Calendar />} />
                <Route path="/communication/messages" element={<Messaging />} />
                <Route path="/communication/announcements" element={<Announcements />} />
              </Route>
            </Route>

            {/* Calendar Management - Admin only */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/calendar/dashboard" element={<CalendarDashboard />} />
                <Route path="/calendar/events" element={<EventManagement />} />
              </Route>
            </Route>

            {/* Student Management — Admin + Teachers */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, CLASS_TEACHER, SUBJECT_TEACHER, DEPT_HEAD]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/students" element={<StudentList />} />
                <Route path="/students/:id" element={<StudentDetail />} />
                <Route path="/students/:id/cv" element={<StudentCV />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ADMIN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/students/create" element={<StudentForm />} />
                <Route path="/students/bulk-import" element={<BulkImport />} />
                <Route path="/students/:id/edit" element={<StudentForm />} />
              </Route>
            </Route>

            {/* Student can view their own detail & CV */}
            <Route element={<ProtectedRoute allowedRoles={[STUDENT, PARENT]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/portal/student" element={<StudentPortal />} />
                <Route path="/my-certificates" element={<StudentCertificates />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[PARENT]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/portal/parent" element={<ParentPortal />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[TRANSPORT]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/portal/transport" element={<TransportPortal />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[HOSTEL]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/portal/hostel" element={<HostelPortal />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[NON_TEACHING]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/portal/non-teaching-staff" element={<NonTeachingStaffPortal />} />
              </Route>
            </Route>

            {/* Staff Management — Admin only */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/staff" element={<StaffList />} />
                <Route path="/staff/create" element={<StaffForm />} />
                <Route path="/staff/:id" element={<StaffDetail />} />
                <Route path="/staff/:id/edit" element={<StaffForm />} />
                <Route path="/staff/:id/assignments" element={<StaffAssignments />} />
              </Route>
            </Route>

            {/* Academic Management — Admin + Teachers */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, CLASS_TEACHER, SUBJECT_TEACHER, DEPT_HEAD]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/academic" element={<AcademicDashboard />} />
                <Route path="/academic/classes" element={<ClassManagement />} />
                <Route path="/academic/years" element={<AcademicYears />} />
                <Route path="/academic/calendar" element={<AcademicCalendar />} />
                <Route path="/academic/timetable" element={<Timetable />} />
                <Route path="/academic/syllabus" element={<Syllabus />} />
                <Route path="/academic/class-subjects" element={<ClassSubjects />} />
                <Route path="/academic/classes/:classId/teacher" element={<ClassTeacherView />} />
                <Route path="/academic/classes/:classId/subjects/:subjectId/teachers" element={<SubjectTeachersView />} />
              </Route>
            </Route>

            {/* Attendance — Admin + Teachers + Student/Parent (view only) */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, CLASS_TEACHER, SUBJECT_TEACHER, DEPT_HEAD]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/attendance" element={<AttendanceDashboard />} />
                <Route path="/attendance/student/mark" element={<AttendanceMarking />} />
                <Route path="/attendance/reports" element={<AttendanceReports />} />
                <Route path="/attendance/leave" element={<LeaveManagement />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ADMIN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/attendance/staff/mark" element={<StaffAttendanceMarking />} />
                <Route path="/attendance/settings" element={<AttendanceSettings />} />
              </Route>
            </Route>

            {/* Admission Management — Admin + Accountant */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, ACCOUNTANT]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admissions" element={<AdmissionDashboard />} />
                <Route path="/admissions/list" element={<AdmissionList />} />
                <Route path="/admissions/new" element={<NewInquiry />} />
                <Route path="/admissions/:id" element={<AdmissionDetail />} />
              </Route>
            </Route>

            {/* Finance Management — Admin + Accountant */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, ACCOUNTANT]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/finance" element={<FinanceDashboard />} />
                <Route path="/finance/dashboard" element={<FinanceDashboard />} />
                <Route path="/finance/fee-structures" element={<FeeStructures />} />
                <Route path="/finance/invoices" element={<InvoiceList />} />
                <Route path="/finance/payments" element={<Payments />} />
                <Route path="/finance/payment-gateways" element={<PaymentGateways />} />
                <Route path="/finance/reports" element={<FinancialReports />} />
              </Route>
            </Route>

            {/* Examination Management — Admin + Teachers */}
            <Route element={<ProtectedRoute allowedRoles={TEACHER_ROLES} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/examinations" element={<ExaminationDashboard />} />
                <Route path="/examinations/list" element={<ExamList />} />
                <Route path="/examinations/grading-scheme" element={<GradingScheme />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ADMIN, CLASS_TEACHER, SUBJECT_TEACHER]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/examinations/create" element={<CreateExam />} />
                <Route path="/examinations/:id/edit" element={<CreateExam />} />
                <Route path="/examinations/grades" element={<GradeEntry />} />
                <Route path="/examinations/:id/grades" element={<GradeEntry />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[...TEACHER_ROLES, STUDENT, PARENT]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/examinations/reports" element={<ReportCards />} />
              </Route>
            </Route>

            {/* Library Management — Admin + Librarian + Students/Parents (read) */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, LIBRARIAN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/library" element={<LibraryDashboard />} />
                <Route path="/library/dashboard" element={<LibraryDashboard />} />
                <Route path="/library/circulation" element={<BookCirculation />} />
                <Route path="/library/reports" element={<LibraryReports />} />
                <Route path="/library/management" element={<LibraryManagement />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ADMIN, LIBRARIAN, CLASS_TEACHER, SUBJECT_TEACHER, DEPT_HEAD, STUDENT, PARENT]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/library/books" element={<BookCatalog />} />
                <Route path="/library/categories" element={<LibraryCategories />} />
              </Route>
            </Route>

            {/* ECA Management — Admin + ECA_Coordinator (manage), All (read) */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, ECA_COORD, DEPT_HEAD]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/eca" element={<ECADashboard />} />
                <Route path="/eca/dashboard" element={<ECADashboard />} />
                <Route path="/eca/management" element={<ECAManagement />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[...ALL_ROLES]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/eca/list" element={<ECAList />} />
              </Route>
            </Route>

            {/* Sports Management — Admin + Sports_Coordinator (manage), All (read) */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, SPORTS_COORD, DEPT_HEAD]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/sports" element={<SportsDashboard />} />
                <Route path="/sports/dashboard" element={<SportsDashboard />} />
                <Route path="/sports/management" element={<SportsManagement />} />
              </Route>
            </Route>

            {/* Document Management — Admin + Staff */}
            <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/documents" element={<DocumentManagement />} />
              </Route>
            </Route>

            {/* Reports & Analytics — Admin + Dept Head + Coordinators */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, DEPT_HEAD, ACCOUNTANT, LIBRARIAN, ECA_COORD, SPORTS_COORD, CLASS_TEACHER, SUBJECT_TEACHER]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/reports" element={<ReportsAnalytics />} />
              </Route>
            </Route>

            {/* Teacher Portal — All teachers */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN, CLASS_TEACHER, SUBJECT_TEACHER, DEPT_HEAD]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="/teacher/lessons" element={<LessonPlanning />} />
                <Route path="/teacher/assignments" element={<AssignmentManagement />} />
              </Route>
            </Route>

            {/* Certificates */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/certificates" element={<CertificateDashboard />} />
                <Route path="/certificates/dashboard" element={<CertificateDashboard />} />
                <Route path="/certificates/manage" element={<CertificateManagement />} />
                <Route path="/certificates/templates" element={<TemplateManagement />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/certificates/verify" element={<CertificateVerification />} />
              </Route>
            </Route>

            {/* Audit Logs — Admin only */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/audit" element={<AuditLogs />} />
                <Route path="/notifications" element={<NotificationCenter />} />
                <Route path="/users" element={<UserManagement />} />
              </Route>
            </Route>

            {/* Admin Settings & System — Admin only */}
            <Route element={<ProtectedRoute allowedRoles={[ADMIN]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/settings" element={<AdminSettings />} />
                <Route path="/settings/school" element={<SchoolConfiguration />} />
                <Route path="/settings/roles" element={<RoleManagement />} />
                <Route path="/settings/system" element={<SystemSettings />} />
                <Route path="/settings/backup" element={<BackupManagement />} />
                <Route path="/settings/archive" element={<ArchiveManagement />} />
              </Route>
            </Route>

            {/* Default redirect - role-based */}
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
