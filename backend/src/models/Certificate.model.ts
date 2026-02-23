/**
 * Certificate Model
 * 
 * Implements certificate entity for storing generated certificates
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface CertificateAttributes {
  certificateId: number;
  certificateNumber: string;
  templateId: number;
  studentId: number;
  type: 'character' | 'transfer' | 'academic_excellence' | 'eca' | 'sports' | 'course_completion' | 'bonafide' | 'conduct' | 'participation';
  issuedDate: Date;
  issuedDateBS: string;
  data: Record<string, any>;
  pdfUrl: string;
  qrCode: string;
  issuedBy: number;
  verificationUrl: string;
  status: 'active' | 'revoked';
  revokedAt?: Date;
  revokedBy?: number;
  revokedReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CertificateCreationAttributes 
  extends Optional<CertificateAttributes, 'certificateId' | 'status' | 'revokedAt' | 'revokedBy' | 'revokedReason'> {}

export class Certificate
  extends Model<CertificateAttributes, CertificateCreationAttributes>
  implements CertificateAttributes
{
  public certificateId!: number;
  public certificateNumber!: string;
  public templateId!: number;
  public studentId!: number;
  public type!: 'character' | 'transfer' | 'academic_excellence' | 'eca' | 'sports' | 'course_completion' | 'bonafide' | 'conduct' | 'participation';
  public issuedDate!: Date;
  public issuedDateBS!: string;
  public data!: Record<string, any>;
  public pdfUrl!: string;
  public qrCode!: string;
  public issuedBy!: number;
  public verificationUrl!: string;
  public status!: 'active' | 'revoked';
  public revokedAt?: Date;
  public revokedBy?: number;
  public revokedReason?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if certificate is active
   */
  public isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Revoke certificate
   */
  public revoke(revokedBy: number, reason: string): void {
    this.status = 'revoked';
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revokedReason = reason;
  }

public toJSON(): object {
    return {
      certificateId: this.get('certificateId') as number,
      certificateNumber: this.get('certificateNumber') as string,
      templateId: this.get('templateId') as number,
      studentId: this.get('studentId') as number,
      type: this.get('type') as string,
      issuedDate: this.get('issuedDate') as Date,
      issuedDateBS: this.get('issuedDateBS') as string,
      data: this.get('data') as Record<string, any>,
      pdfUrl: this.get('pdfUrl') as string,
      qrCode: this.get('qrCode') as string,
      issuedBy: this.get('issuedBy') as number,
      verificationUrl: this.get('verificationUrl') as string,
      status: this.get('status') as string,
      revokedAt: this.get('revokedAt') as Date | undefined,
      revokedBy: this.get('revokedBy') as number | undefined,
      revokedReason: this.get('revokedReason') as string | undefined,
      createdAt: this.get('createdAt') as Date,
      updatedAt: this.get('updatedAt') as Date,
    };
  }
}

Certificate.init(
  {
    certificateId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    certificateNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    templateId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'certificate_templates',
        key: 'template_id',
      },
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id',
      },
    },
    type: {
      type: DataTypes.ENUM(
        'character',
        'transfer',
        'academic_excellence',
        'eca',
        'sports',
        'course_completion',
        'bonafide',
        'conduct',
        'participation'
      ),
      allowNull: false,
    },
    issuedDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    issuedDateBS: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'issued_date_bs',
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    pdfUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    issuedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    verificationUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'revoked'),
      allowNull: false,
      defaultValue: 'active',
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    revokedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'certificates',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_certificates_number',
        fields: ['certificate_number'],
        unique: true,
      },
      {
        name: 'idx_certificates_student',
        fields: ['student_id'],
      },
      {
        name: 'idx_certificates_type',
        fields: ['type'],
      },
      {
        name: 'idx_certificates_status',
        fields: ['status'],
      },
      {
        name: 'idx_certificates_issued_date',
        fields: ['issued_date'],
      },
    ],
  }
);

export default Certificate;
