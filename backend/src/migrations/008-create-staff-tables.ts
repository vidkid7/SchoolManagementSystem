import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Staff and Staff Assignments Tables
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create staff table
  await queryInterface.createTable('staff', {
    staff_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'staff_id'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    staff_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'staff_code'
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
    blood_group: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'photo_url'
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
    emergency_contact: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_contact'
    },
    employee_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'employee_id'
    },
    category: {
      type: DataTypes.ENUM('teaching', 'non_teaching', 'administrative'),
      allowNull: false
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    employment_type: {
      type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'temporary'),
      allowNull: false,
      defaultValue: 'full_time'
    },
    join_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'join_date'
    },
    termination_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'termination_date'
    },
    salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    salary_grade: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'salary_grade'
    },
    highest_qualification: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'highest_qualification'
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    teaching_license: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'teaching_license'
    },
    citizenship_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'citizenship_number'
    },
    pan_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'pan_number'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'terminated', 'retired'),
      allowNull: false,
      defaultValue: 'active'
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

  // Create staff_assignments table
  await queryInterface.createTable('staff_assignments', {
    assignment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'assignment_id'
    },
    staff_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'staff_id',
      references: {
        model: 'staff',
        key: 'staff_id'
      }
    },
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'academic_year_id',
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      }
    },
    assignment_type: {
      type: DataTypes.ENUM('class_teacher', 'subject_teacher', 'department_head', 'shift_incharge'),
      allowNull: false,
      field: 'assignment_type'
    },
    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'class_id',
      references: {
        model: 'classes',
        key: 'class_id'
      }
    },
    subject_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'subject_id',
      references: {
        model: 'subjects',
        key: 'subject_id'
      }
    },
    section: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
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
  await queryInterface.addIndex('staff', ['status']);
  await queryInterface.addIndex('staff', ['category']);
  await queryInterface.addIndex('staff', ['department']);
  await queryInterface.addIndex('staff', ['staff_code']);
  await queryInterface.addIndex('staff_assignments', ['staff_id']);
  await queryInterface.addIndex('staff_assignments', ['academic_year_id']);
  await queryInterface.addIndex('staff_assignments', ['assignment_type']);
  await queryInterface.addIndex('staff_assignments', ['class_id']);

  console.log('✅ Staff and staff_assignments tables created successfully');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('staff_assignments');
  await queryInterface.dropTable('staff');
  console.log('✅ Staff tables dropped successfully');
}
