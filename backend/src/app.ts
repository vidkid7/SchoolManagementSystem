import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { logger } from '@utils/logger';
import {
  helmetMiddleware,
  corsMiddleware,
  hppMiddleware,
  compressionMiddleware,
  disablePoweredBy,
  xssProtection
} from '@middleware/security';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import { apiRateLimiter } from '@middleware/rateLimiter';
import { swaggerSpec } from '@config/swagger';

/**
 * Express Application Setup
 */

const app: Application = express();

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(hppMiddleware);
app.use(disablePoweredBy);
app.use(xssProtection);

// Compression
app.use(compressionMiddleware);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// HTTP Request Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Health Check Endpoint (before rate limiting)
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Apply rate limiting to all API routes
// 100 requests per minute per user with Redis storage
app.use('/api', apiRateLimiter);

// API Routes
app.get('/api/v1', (_req, res) => {
  res.json({
    success: true,
    message: 'School Management System API v1',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'School Management System API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
import authRoutes from '@modules/auth/auth.routes';
import studentRoutes from '@modules/student/student.routes';
import admissionRoutes from '@modules/admission/admission.routes';
import staffRoutes from '@modules/staff/staff.routes';
import userRoutes from '@modules/user/user.routes';
import academicRoutes from '@modules/academic/academic.routes';
import financeRoutes from '@modules/finance/finance.routes';
import attendanceRoutes from '@modules/attendance/attendance.routes';
import sportsRoutes from '@modules/sports/sports.routes';
import ecaRoutes from '@modules/eca/eca.routes';
import communicationRoutes from '@modules/communication/communication.routes';
import certificateRoutes from '@modules/certificate/certificate.routes';
import certificateTemplateRoutes from '@modules/certificate/certificateTemplate.routes';
import documentRoutes from '@modules/document/document.routes';
import calendarRoutes from '@modules/calendar/event.routes';
import cvRoutes from '@modules/cv/cv.routes';
import reportRoutes from '@modules/report/report.routes';
import configRoutes from '@modules/config/config.routes';
import rolePermissionRoutes from '@modules/config/rolePermission.routes';
import systemSettingsRoutes from '@modules/config/systemSettings.routes';
import auditRoutes from '@modules/audit/audit.routes';
import archiveRoutes from '@modules/archive/archive.routes';
import backupRoutes from '@modules/backup/backup.routes';
import examRoutes from '@modules/examination/exam.routes';
import examScheduleRoutes from '@modules/examination/examSchedule.routes';
import gradeEntryRoutes from '@modules/examination/gradeEntry.routes';
import libraryRoutes from '@modules/library/library.routes';
import transportRoutes from '@modules/transport/transport.routes';
import hostelRoutes from '@modules/hostel/hostel.routes';
import nonTeachingStaffRoutes from '@modules/nonTeachingStaff/nonTeachingStaff.routes';
import parentRoutes from '@modules/parent/parent.routes';
import teacherRoutes from '@modules/teacher/teacher.routes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/admissions', admissionRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/academic', academicRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/sports', sportsRoutes);
app.use('/api/v1/eca', ecaRoutes);
app.use('/api/v1/communication', communicationRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/certificate-templates', certificateTemplateRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/cv', cvRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/config', rolePermissionRoutes);
app.use('/api/v1/system-settings', systemSettingsRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/archive', archiveRoutes);
app.use('/api/v1/backup', backupRoutes);
app.use('/api/v1/examinations', examRoutes);
app.use('/api/v1/exam-schedules', examScheduleRoutes);
app.use('/api/v1/grades', gradeEntryRoutes);
app.use('/api/v1/library', libraryRoutes);

app.use('/api/v1/transport', transportRoutes);
app.use('/api/v1/hostel', hostelRoutes);
app.use('/api/v1/non-teaching-staff', nonTeachingStaffRoutes);
app.use('/api/v1/parents', parentRoutes);
app.use('/api/v1/teachers', teacherRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler (must be last)
app.use(errorHandler);

export default app;

