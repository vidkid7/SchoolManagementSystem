import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Admissions Table
 * Creates the admissions table for tracking student admission workflow
 * Requirements: 3.1-3.12
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('admissions', {
    admission_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'admission_id'
    },
    temporary_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Temporary ID for inquiry stage'
    },
    first_name_en: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'first_name_en'
    },
    middle_name_en: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'middle_name_en'
    },
    last_name_en: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'last_name_en'
    },
    first_name_np: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'first_name_np'
    },
    middle_name_np: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'middle_name_np'
    },
    last_name_np: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'last_name_np'
    },
    date_of_birth_bs: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'date_of_birth_bs'
    },
    date_of_birth_ad: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth_ad'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    },
    address_en: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'address_en'
    },
    address_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'address_np'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    father_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'father_name'
    },
    father_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'father_phone'
    },
    mother_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mother_name'
    },
    mother_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'mother_phone'
    },
    guardian_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'guardian_name'
    },
    guardian_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'guardian_phone'
    },
    guardian_relation: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'guardian_relation'
    },
    applying_for_class: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Class applying for (1-12)',
      validate: { min: 1, max: 12 }
    },
    previous_school: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'previous_school'
    },
    previous_class: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'previous_class'
    },
    previous_gpa: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      field: 'previous_gpa'
    },
    status: {
      type: DataTypes.ENUM(
        'inquiry',
        'applied',
        'test_scheduled',
        'tested',
        'interview_scheduled',
        'interviewed',
        'admitted',
        'enrolled',
        'rejected',
        'withdrawn'
      ),
      allowNull: false,
      defaultValue: 'inquiry'
    },
    inquiry_date: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'inquiry_date'
    },
    inquiry_source: {
      type: DataTypes.ENUM('walk-in', 'phone', 'online', 'referral'),
      allowNull: true,
      field: 'inquiry_source'
    },
    inquiry_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'inquiry_notes'
    },
    application_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'application_date'
    },
    application_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'application_fee'
    },
    application_fee_paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'application_fee_paid'
    },
    admission_test_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'admission_test_date'
    },
    admission_test_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'admission_test_score'
    },
    admission_test_max_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'admission_test_max_score'
    },
    admission_test_remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admission_test_remarks'
    },
    interview_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'interview_date'
    },
    interviewer_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'interviewer_name'
    },
    interview_feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'interview_feedback'
    },
    interview_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'interview_score'
    },
    admission_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'admission_date'
    },
    admission_offer_letter_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'admission_offer_letter_url'
    },
    documents_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'documents_verified'
    },
    documents_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'documents_notes'
    },
    enrolled_student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'enrolled_student_id',
      references: {
        model: 'students',
        key: 'student_id'
      }
    },
    enrollment_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'enrollment_date'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason'
    },
    rejection_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'rejection_date'
    },
    processed_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'processed_by',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'academic_year_id',
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  });

  // Create indexes
  await queryInterface.addIndex('admissions', ['status']);
  await queryInterface.addIndex('admissions', ['applying_for_class']);
  await queryInterface.addIndex('admissions', ['inquiry_date']);
  await queryInterface.addIndex('admissions', ['academic_year_id']);
  await queryInterface.addIndex('admissions', ['temporary_id']);

  console.log('✅ Admissions table created successfully');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('admissions');
  console.log('✅ Admissions table dropped successfully');
}
