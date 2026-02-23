import sequelize from '../config/database';
import GradingScheme from '../models/GradingScheme.model';
import AttendanceRule from '../models/AttendanceRule.model';
import NotificationTemplate from '../models/NotificationTemplate.model';

async function seedSystemSettings() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if default grading scheme exists
    const existingScheme = await GradingScheme.findOne({
      where: { isDefault: true },
    });

    if (!existingScheme) {
      console.log('Creating default NEB grading scheme...');
      await GradingScheme.create({
        name: 'NEB Standard Grading',
        description: 'National Examination Board (NEB) standard grading system for Nepal',
        isDefault: true,
        isActive: true,
        grades: [
          {
            grade: 'A+',
            gradePoint: 4.0,
            minPercentage: 90,
            maxPercentage: 100,
            description: 'Outstanding',
          },
          {
            grade: 'A',
            gradePoint: 3.6,
            minPercentage: 80,
            maxPercentage: 89,
            description: 'Excellent',
          },
          {
            grade: 'B+',
            gradePoint: 3.2,
            minPercentage: 70,
            maxPercentage: 79,
            description: 'Very Good',
          },
          {
            grade: 'B',
            gradePoint: 2.8,
            minPercentage: 60,
            maxPercentage: 69,
            description: 'Good',
          },
          {
            grade: 'C+',
            gradePoint: 2.4,
            minPercentage: 50,
            maxPercentage: 59,
            description: 'Satisfactory',
          },
          {
            grade: 'C',
            gradePoint: 2.0,
            minPercentage: 40,
            maxPercentage: 49,
            description: 'Acceptable',
          },
          {
            grade: 'D',
            gradePoint: 1.6,
            minPercentage: 35,
            maxPercentage: 39,
            description: 'Basic',
          },
          {
            grade: 'NG',
            gradePoint: 0.0,
            minPercentage: 0,
            maxPercentage: 34,
            description: 'Not Graded',
          },
        ],
      });
      console.log('✓ Default grading scheme created');
    } else {
      console.log('✓ Default grading scheme already exists');
    }

    // Check if default attendance rule exists
    const existingRule = await AttendanceRule.findOne({
      where: { isActive: true },
    });

    if (!existingRule) {
      console.log('Creating default attendance rule...');
      await AttendanceRule.create({
        name: 'Default Attendance Rule',
        description: 'Standard attendance rules for Nepal schools',
        minimumAttendancePercentage: 75.0,
        lowAttendanceThreshold: 75.0,
        criticalAttendanceThreshold: 60.0,
        correctionWindowHours: 24,
        allowTeacherCorrection: true,
        allowAdminCorrection: true,
        maxLeaveDaysPerMonth: 5,
        maxLeaveDaysPerYear: 30,
        requireLeaveApproval: true,
        enableLowAttendanceAlerts: true,
        alertParents: true,
        alertAdmins: true,
        isActive: true,
      });
      console.log('✓ Default attendance rule created');
    } else {
      console.log('✓ Default attendance rule already exists');
    }

    // Check if default notification templates exist
    const existingTemplates = await NotificationTemplate.count();

    if (existingTemplates === 0) {
      console.log('Creating default notification templates...');
      
      await NotificationTemplate.bulkCreate([
        {
          name: 'Low Attendance Alert',
          code: 'LOW_ATTENDANCE_ALERT',
          description: 'Alert sent when student attendance falls below threshold',
          category: 'attendance',
          channel: 'sms',
          language: 'english',
          templateEn: 'Dear {{parent_name}}, your child {{student_name}} has {{attendance_percentage}}% attendance which is below the required {{threshold}}%. Please ensure regular attendance.',
          templateNp: 'प्रिय {{parent_name}}, तपाईंको छोरा/छोरी {{student_name}} को उपस्थिति {{attendance_percentage}}% छ जुन आवश्यक {{threshold}}% भन्दा कम छ। कृपया नियमित उपस्थिति सुनिश्चित गर्नुहोस्।',
          variables: ['parent_name', 'student_name', 'attendance_percentage', 'threshold'],
          isActive: true,
        },
        {
          name: 'Fee Payment Reminder',
          code: 'FEE_PAYMENT_REMINDER',
          description: 'Reminder for pending fee payment',
          category: 'fee',
          channel: 'sms',
          language: 'english',
          templateEn: 'Dear {{parent_name}}, fee payment of NPR {{amount}} for {{student_name}} is due on {{due_date}}. Please pay at the earliest.',
          templateNp: 'प्रिय {{parent_name}}, {{student_name}} को NPR {{amount}} शुल्क भुक्तानी {{due_date}} मा हुनुपर्छ। कृपया जतिसक्दो चाँडो भुक्तानी गर्नुहोस्।',
          variables: ['parent_name', 'student_name', 'amount', 'due_date'],
          isActive: true,
        },
        {
          name: 'Exam Schedule Notification',
          code: 'EXAM_SCHEDULE',
          description: 'Notification about upcoming exam',
          category: 'exam',
          channel: 'sms',
          language: 'english',
          templateEn: 'Dear {{student_name}}, your {{exam_name}} exam for {{subject_name}} is scheduled on {{exam_date}} at {{exam_time}}. Best wishes!',
          templateNp: 'प्रिय {{student_name}}, तपाईंको {{subject_name}} को {{exam_name}} परीक्षा {{exam_date}} मा {{exam_time}} बजे तय गरिएको छ। शुभकामना!',
          variables: ['student_name', 'exam_name', 'subject_name', 'exam_date', 'exam_time'],
          isActive: true,
        },
        {
          name: 'Leave Application Approved',
          code: 'LEAVE_APPROVED',
          description: 'Notification when leave application is approved',
          category: 'leave',
          channel: 'in_app',
          language: 'english',
          subject: 'Leave Application Approved',
          templateEn: 'Your leave application from {{start_date}} to {{end_date}} has been approved.',
          templateNp: 'तपाईंको {{start_date}} देखि {{end_date}} सम्मको बिदा आवेदन स्वीकृत भएको छ।',
          variables: ['start_date', 'end_date'],
          isActive: true,
        },
        {
          name: 'Grade Published',
          code: 'GRADE_PUBLISHED',
          description: 'Notification when exam grades are published',
          category: 'grade',
          channel: 'in_app',
          language: 'english',
          subject: 'Exam Results Published',
          templateEn: 'Dear {{student_name}}, your {{exam_name}} results have been published. You scored {{marks}}/{{total_marks}} ({{grade}}).',
          templateNp: 'प्रिय {{student_name}}, तपाईंको {{exam_name}} परिणाम प्रकाशित भएको छ। तपाईंले {{marks}}/{{total_marks}} ({{grade}}) प्राप्त गर्नुभयो।',
          variables: ['student_name', 'exam_name', 'marks', 'total_marks', 'grade'],
          isActive: true,
        },
      ]);
      
      console.log('✓ Default notification templates created');
    } else {
      console.log('✓ Notification templates already exist');
    }

    console.log('\n✓ System settings seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding system settings:', error);
    process.exit(1);
  }
}

seedSystemSettings();
