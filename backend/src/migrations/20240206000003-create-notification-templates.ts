import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('notification_templates', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM('attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library', 'general'),
        allowNull: false,
      },
      channel: {
        type: DataTypes.ENUM('sms', 'email', 'push', 'in_app'),
        allowNull: false,
      },
      language: {
        type: DataTypes.ENUM('nepali', 'english'),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      template_en: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      template_np: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      variables: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create indexes
    await queryInterface.addIndex('notification_templates', ['code'], { unique: true });
    await queryInterface.addIndex('notification_templates', ['category']);
    await queryInterface.addIndex('notification_templates', ['channel']);
    await queryInterface.addIndex('notification_templates', ['is_active']);

    // Insert default notification templates
    await queryInterface.bulkInsert('notification_templates', [
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Low Attendance Alert',
        code: 'LOW_ATTENDANCE_ALERT',
        description: 'Alert sent when student attendance falls below threshold',
        category: 'attendance',
        channel: 'sms',
        language: 'english',
        subject: null,
        template_en: 'Dear {{parent_name}}, your child {{student_name}} has {{attendance_percentage}}% attendance which is below the required {{threshold}}%. Please ensure regular attendance.',
        template_np: 'प्रिय {{parent_name}}, तपाईंको छोरा/छोरी {{student_name}} को उपस्थिति {{attendance_percentage}}% छ जुन आवश्यक {{threshold}}% भन्दा कम छ। कृपया नियमित उपस्थिति सुनिश्चित गर्नुहोस्।',
        variables: JSON.stringify(['parent_name', 'student_name', 'attendance_percentage', 'threshold']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'Fee Payment Reminder',
        code: 'FEE_PAYMENT_REMINDER',
        description: 'Reminder for pending fee payment',
        category: 'fee',
        channel: 'sms',
        language: 'english',
        subject: null,
        template_en: 'Dear {{parent_name}}, fee payment of NPR {{amount}} for {{student_name}} is due on {{due_date}}. Please pay at the earliest.',
        template_np: 'प्रिय {{parent_name}}, {{student_name}} को NPR {{amount}} शुल्क भुक्तानी {{due_date}} मा हुनुपर्छ। कृपया जतिसक्दो चाँडो भुक्तानी गर्नुहोस्।',
        variables: JSON.stringify(['parent_name', 'student_name', 'amount', 'due_date']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        name: 'Exam Schedule Notification',
        code: 'EXAM_SCHEDULE',
        description: 'Notification about upcoming exam',
        category: 'exam',
        channel: 'sms',
        language: 'english',
        subject: null,
        template_en: 'Dear {{student_name}}, your {{exam_name}} exam for {{subject_name}} is scheduled on {{exam_date}} at {{exam_time}}. Best wishes!',
        template_np: 'प्रिय {{student_name}}, तपाईंको {{subject_name}} को {{exam_name}} परीक्षा {{exam_date}} मा {{exam_time}} बजे तय गरिएको छ। शुभकामना!',
        variables: JSON.stringify(['student_name', 'exam_name', 'subject_name', 'exam_date', 'exam_time']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-000000000006',
        name: 'Leave Application Approved',
        code: 'LEAVE_APPROVED',
        description: 'Notification when leave application is approved',
        category: 'leave',
        channel: 'in_app',
        language: 'english',
        subject: 'Leave Application Approved',
        template_en: 'Your leave application from {{start_date}} to {{end_date}} has been approved.',
        template_np: 'तपाईंको {{start_date}} देखि {{end_date}} सम्मको बिदा आवेदन स्वीकृत भएको छ।',
        variables: JSON.stringify(['start_date', 'end_date']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('notification_templates');
  },
};
