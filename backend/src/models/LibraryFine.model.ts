/**
 * LibraryFine Model
 * 
 * Implements library fine tracking entity
 * 
 * Requirements: 10.5, 10.6
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface LibraryFineAttributes {
  fineId: number;
  circulationId: number;
  studentId: number;
  fineAmount: number;
  paidAmount: number;
  balance: number;
  fineReason: 'overdue' | 'lost' | 'damaged';
  daysOverdue?: number;
  dailyRate?: number;
  status: 'pending' | 'partial' | 'paid' | 'waived';
  waivedAmount?: number;
  waivedBy?: number;
  waivedReason?: string;
  waivedDate?: Date;
  paidDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LibraryFineCreationAttributes extends Optional<LibraryFineAttributes, 'fineId' | 'paidAmount' | 'balance' | 'status'> {}

export class LibraryFine
  extends Model<LibraryFineAttributes, LibraryFineCreationAttributes>
  implements LibraryFineAttributes
{
  public fineId!: number;
  public circulationId!: number;
  public studentId!: number;
  public fineAmount!: number;
  public paidAmount!: number;
  public balance!: number;
  public fineReason!: 'overdue' | 'lost' | 'damaged';
  public daysOverdue?: number;
  public dailyRate?: number;
  public status!: 'pending' | 'partial' | 'paid' | 'waived';
  public waivedAmount?: number;
  public waivedBy?: number;
  public waivedReason?: string;
  public waivedDate?: Date;
  public paidDate?: Date;
  public paymentMethod?: string;
  public transactionId?: string;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async recordPayment(amount: number, method: string, transactionId?: string): Promise<void> {
    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }
    if (amount > this.balance) {
      throw new Error('Payment amount exceeds balance');
    }

    this.paidAmount += amount;
    this.balance = this.fineAmount - this.paidAmount - (this.waivedAmount || 0);
    this.paymentMethod = method;
    this.transactionId = transactionId;

    if (this.balance === 0) {
      this.status = 'paid';
      this.paidDate = new Date();
    } else {
      this.status = 'partial';
    }

    await this.save();
  }

  public async waive(amount: number, waivedBy: number, reason: string): Promise<void> {
    if (amount <= 0) {
      throw new Error('Waiver amount must be positive');
    }
    if (amount > this.balance) {
      throw new Error('Waiver amount exceeds balance');
    }

    this.waivedAmount = (this.waivedAmount || 0) + amount;
    this.balance = this.fineAmount - this.paidAmount - this.waivedAmount;
    this.waivedBy = waivedBy;
    this.waivedReason = reason;
    this.waivedDate = new Date();

    if (this.balance === 0) {
      this.status = 'waived';
    } else {
      this.status = 'partial';
    }

    await this.save();
  }

  public isPending(): boolean {
    return this.balance > 0 && this.status !== 'waived';
  }

  public toJSON(): object {
    return {
      fineId: this.fineId,
      circulationId: this.circulationId,
      studentId: this.studentId,
      fineAmount: this.fineAmount,
      paidAmount: this.paidAmount,
      balance: this.balance,
      fineReason: this.fineReason,
      daysOverdue: this.daysOverdue,
      dailyRate: this.dailyRate,
      status: this.status,
      waivedAmount: this.waivedAmount,
      waivedBy: this.waivedBy,
      waivedReason: this.waivedReason,
      waivedDate: this.waivedDate,
      paidDate: this.paidDate,
      paymentMethod: this.paymentMethod,
      transactionId: this.transactionId,
      remarks: this.remarks,
      isPending: this.isPending(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initLibraryFine(sequelize: any): typeof LibraryFine {
  LibraryFine.init(
    {
      fineId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      circulationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'circulations',
          key: 'circulation_id',
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
      fineAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fineReason: {
        type: DataTypes.ENUM('overdue', 'lost', 'damaged'),
        allowNull: false,
      },
      daysOverdue: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dailyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'partial', 'paid', 'waived'),
        allowNull: false,
        defaultValue: 'pending',
      },
      waivedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      waivedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      waivedReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      waivedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paidDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      transactionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'library_fines',
      timestamps: true,
      indexes: [
        {
          name: 'idx_library_fines_circulation_id',
          fields: ['circulation_id'],
        },
        {
          name: 'idx_library_fines_student_id',
          fields: ['student_id'],
        },
        {
          name: 'idx_library_fines_status',
          fields: ['status'],
        },
      ],
    }
  );

  return LibraryFine;
}

export default LibraryFine;
