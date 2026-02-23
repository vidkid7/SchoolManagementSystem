import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Core Database Tables
 * Creates students, staff, academic_years, terms, classes, subjects tables
 * with proper foreign keys, indexes, soft delete, and audit columns
 * 
 * Requirements: 40.1, 40.2, 40.3, 40.8
 */

// eslint-disable-next-line max-lines-per-function
export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create academic_years table
  await queryInterface.createTable('academic_years', {
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g., "2081-2082 BS"'
    },
    start_date_bs: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'YYYY-MM-DD format in Bikram Sambat'
    },
    end_date_bs: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'YYYY-MM-DD format in Bikram Sambat'
    },
    start_date_ad: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Start date in Anno Domini'
    },
    end_date_ad: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'End date in Anno Domini'
    },
    is_current: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Only one academic year should be current at a time'
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'archived'),
      allowNull: false,
      defaultValue: 'active'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  // Create terms table
  await queryInterface.createTable('terms', {
    term_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'First Terminal, Second Terminal, Final'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    exam_start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    exam_end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  // Create classes table
  await queryInterface.createTable('classes', {
    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    grade_level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '1-12 for Classes 1 to 12'
    },
    section: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'A, B, C, etc.'
    },
    shift: {
      type: DataTypes.ENUM('morning', 'day', 'evening'),
      allowNull: false,
      defaultValue: 'morning'
    },
    class_teacher_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    capacity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 40
    },
    current_strength: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    room_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  // Create subjects table
  await queryInterface.createTable('subjects', {
    subject_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Unique subject code'
    },
    name_en: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Subject name in English'
    },
    name_np: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Subject name in Nepali'
    },
    type: {
      type: DataTypes.ENUM('compulsory', 'optional'),
      allowNull: false,
      defaultValue: 'compulsory'
    },
    credit_hours: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 100,
      comment: 'Minimum 100 hours per subject as per NEB'
    },
    theory_marks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 75
    },
    practical_marks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 25
    },
    pass_marks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 35,
      comment: 'Minimum 35% required as per NEB'
    },
    full_marks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 100
    },
    applicable_classes: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of grade levels [1,2,3...12]'
    },
    stream: {
      type: DataTypes.ENUM('science', 'management', 'humanities', 'technical', 'general'),
      allowNull: true,
      comment: 'For Classes 11-12 optional subjects'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  // Create students table
  await queryInterface.createTable('students', {
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Link to user account for portal access'
    },
    student_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'School-generated unique ID: {prefix}-{year}-{seq}'
    },
    symbol_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'For SEE students (Class 10)'
    },
    neb_registration_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'For Class 11-12 students'
    },
    // Personal Information
    first_name_en: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    middle_name_en: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    last_name_en: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    first_name_np: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    middle_name_np: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    last_name_np: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    date_of_birth_bs: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'YYYY-MM-DD format in Bikram Sambat'
    },
    date_of_birth_ad: {
      type: DataTypes.DATE,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false
    },
    blood_group: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    // Contact Information
    address_en: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    address_np: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // Guardian Information
    father_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    father_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    father_citizenship_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    mother_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    mother_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    mother_citizenship_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    local_guardian_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    local_guardian_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    local_guardian_relation: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Academic Information
    admission_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    admission_class: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'Class at time of admission'
    },
    current_class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    roll_number: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    previous_school: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    // Health Information
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    medical_conditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emergency_contact: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    // Status
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'transferred', 'graduated', 'suspended'),
      allowNull: false,
      defaultValue: 'active'
    },
    photo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  // Create staff table
  await queryInterface.createTable('staff', {
    staff_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Link to user account for portal access'
    },
    staff_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'School-generated unique ID'
    },
    // Personal Information
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    middle_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    date_of_birth: {
      type: DataTypes.DATE,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false
    },
    citizenship_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Contact Information
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    emergency_contact: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    // Employment Details
    join_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Teacher, Librarian, Accountant, etc.'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Science, Mathematics, English, etc.'
    },
    employment_type: {
      type: DataTypes.ENUM('permanent', 'temporary', 'contract'),
      allowNull: false,
      defaultValue: 'permanent'
    },
    salary_grade: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    // Qualifications
    qualifications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of degrees, certifications, teaching license'
    },
    teaching_license_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Status
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'terminated'),
      allowNull: false,
      defaultValue: 'active'
    },
    photo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  // Create indexes for academic_years
  await queryInterface.addIndex('academic_years', ['is_current'], {
    name: 'idx_academic_years_is_current'
  });

  await queryInterface.addIndex('academic_years', ['status'], {
    name: 'idx_academic_years_status'
  });

  // Create indexes for terms
  await queryInterface.addIndex('terms', ['academic_year_id'], {
    name: 'idx_terms_academic_year_id'
  });

  // Create indexes for classes
  await queryInterface.addIndex('classes', ['academic_year_id'], {
    name: 'idx_classes_academic_year_id'
  });

  await queryInterface.addIndex('classes', ['grade_level', 'section'], {
    name: 'idx_classes_grade_section'
  });

  await queryInterface.addIndex('classes', ['class_teacher_id'], {
    name: 'idx_classes_class_teacher_id'
  });

  // Create indexes for subjects
  await queryInterface.addIndex('subjects', ['code'], {
    unique: true,
    name: 'idx_subjects_code'
  });

  await queryInterface.addIndex('subjects', ['type'], {
    name: 'idx_subjects_type'
  });

  await queryInterface.addIndex('subjects', ['stream'], {
    name: 'idx_subjects_stream'
  });

  // Create indexes for students
  await queryInterface.addIndex('students', ['student_code'], {
    unique: true,
    name: 'idx_students_student_code'
  });

  await queryInterface.addIndex('students', ['user_id'], {
    name: 'idx_students_user_id'
  });

  await queryInterface.addIndex('students', ['current_class_id'], {
    name: 'idx_students_current_class_id'
  });

  await queryInterface.addIndex('students', ['status'], {
    name: 'idx_students_status'
  });

  await queryInterface.addIndex('students', ['symbol_number'], {
    unique: true,
    name: 'idx_students_symbol_number'
  });

  await queryInterface.addIndex('students', ['neb_registration_number'], {
    unique: true,
    name: 'idx_students_neb_registration_number'
  });

  // Create indexes for staff
  await queryInterface.addIndex('staff', ['staff_code'], {
    unique: true,
    name: 'idx_staff_staff_code'
  });

  await queryInterface.addIndex('staff', ['user_id'], {
    name: 'idx_staff_user_id'
  });

  await queryInterface.addIndex('staff', ['email'], {
    unique: true,
    name: 'idx_staff_email'
  });

  await queryInterface.addIndex('staff', ['status'], {
    name: 'idx_staff_status'
  });

  await queryInterface.addIndex('staff', ['department'], {
    name: 'idx_staff_department'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await queryInterface.dropTable('staff');
  await queryInterface.dropTable('students');
  await queryInterface.dropTable('subjects');
  await queryInterface.dropTable('classes');
  await queryInterface.dropTable('terms');
  await queryInterface.dropTable('academic_years');
}
