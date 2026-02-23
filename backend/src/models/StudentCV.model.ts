/**
 * Student CV Model
 * Stores CV customization preferences and generated CV data
 * 
 * Requirements: 26.3, 26.4
 */

import {
  DataTypes,
  Model,
  Optional,
  CreationOptional
} from 'sequelize';
import { sequelize } from '@config/database';
import Student from './Student.model';

export interface CVCustomizationAttributes {
  cvId: number;
  studentId: number;
  
  // Section visibility settings
  showPersonalInfo: boolean;
  showAcademicPerformance: boolean;
  showAttendance: boolean;
  showECA: boolean;
  showSports: boolean;
  showCertificates: boolean;
  showAwards: boolean;
  showTeacherRemarks: boolean;
  
  // Custom fields
  skills: string;           // JSON array of skills
  hobbies: string;          // JSON array of hobbies
  careerGoals: string;      // Text field for career goals
  personalStatement: string; // Text field for personal statement
  
  // Template and branding
  templateId: string;       // CV template identifier
  schoolBrandingEnabled: boolean;
  
  // Metadata
  lastGeneratedAt?: Date;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

interface CVCustomizationCreationAttributes
  extends Optional<CVCustomizationAttributes, 'cvId' | 'lastGeneratedAt' | 'createdAt' | 'updatedAt'> {}

class StudentCV
  extends Model<CVCustomizationAttributes, CVCustomizationCreationAttributes>
  implements CVCustomizationAttributes
{
  public cvId!: number;
  public studentId!: number;
  
  public showPersonalInfo!: boolean;
  public showAcademicPerformance!: boolean;
  public showAttendance!: boolean;
  public showECA!: boolean;
  public showSports!: boolean;
  public showCertificates!: boolean;
  public showAwards!: boolean;
  public showTeacherRemarks!: boolean;
  
  public skills!: string;
  public hobbies!: string;
  public careerGoals!: string;
  public personalStatement!: string;
  
  public templateId!: string;
  public schoolBrandingEnabled!: boolean;
  
  public lastGeneratedAt?: Date;
  
  public readonly createdAt!: CreationOptional<Date>;
  public readonly updatedAt!: CreationOptional<Date>;

  // Associations
  public static associate(models: { Student: typeof Student }): void {
    StudentCV.belongsTo(models.Student, {
      foreignKey: 'studentId',
      as: 'student'
    });
  }

  // Helper methods
  public getSkills(): string[] {
    try {
      return this.skills ? JSON.parse(this.skills) : [];
    } catch {
      return [];
    }
  }

  public setSkills(skills: string[]): void {
    this.skills = JSON.stringify(skills);
  }

  public getHobbies(): string[] {
    try {
      return this.hobbies ? JSON.parse(this.hobbies) : [];
    } catch {
      return [];
    }
  }

  public setHobbies(hobbies: string[]): void {
    this.hobbies = JSON.stringify(hobbies);
  }

  public getSectionVisibility(): Record<string, boolean> {
    return {
      personalInfo: this.showPersonalInfo,
      academicPerformance: this.showAcademicPerformance,
      attendance: this.showAttendance,
      eca: this.showECA,
      sports: this.showSports,
      certificates: this.showCertificates,
      awards: this.showAwards,
      teacherRemarks: this.showTeacherRemarks
    };
  }

  public setSectionVisibility(visibility: Record<string, boolean>): void {
    if (visibility.personalInfo !== undefined) this.showPersonalInfo = visibility.personalInfo;
    if (visibility.academicPerformance !== undefined) this.showAcademicPerformance = visibility.academicPerformance;
    if (visibility.attendance !== undefined) this.showAttendance = visibility.attendance;
    if (visibility.eca !== undefined) this.showECA = visibility.eca;
    if (visibility.sports !== undefined) this.showSports = visibility.sports;
    if (visibility.certificates !== undefined) this.showCertificates = visibility.certificates;
    if (visibility.awards !== undefined) this.showAwards = visibility.awards;
    if (visibility.teacherRemarks !== undefined) this.showTeacherRemarks = visibility.teacherRemarks;
  }
}

StudentCV.init(
  {
    cvId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      onDelete: 'CASCADE'
    },
    showPersonalInfo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    showAcademicPerformance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    showAttendance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    showECA: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    showSports: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    showCertificates: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    showAwards: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    showTeacherRemarks: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]'
    },
    hobbies: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]'
    },
    careerGoals: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    personalStatement: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    templateId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'standard'
    },
    schoolBrandingEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lastGeneratedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'student_cv',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['student_id']
      }
    ]
  }
);

export default StudentCV;