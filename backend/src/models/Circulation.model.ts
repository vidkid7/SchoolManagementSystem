/**
 * Circulation Model
 * 
 * Implements library book circulation (issue/return) entity
 * 
 * Requirements: 10.1, 10.2, 10.4, 10.5
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface CirculationAttributes {
  circulationId: number;
  bookId: number;
  studentId: number;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'borrowed' | 'returned' | 'overdue' | 'lost' | 'renewed';
  renewalCount: number;
  maxRenewals: number;
  issuedBy: number;
  returnedBy?: number;
  conditionOnIssue: 'good' | 'damaged' | 'poor';
  conditionOnReturn?: 'good' | 'damaged' | 'poor';
  fine: number;
  finePaid: boolean;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CirculationCreationAttributes extends Optional<CirculationAttributes, 'circulationId' | 'renewalCount' | 'status' | 'fine' | 'finePaid'> {}

export class Circulation
  extends Model<CirculationAttributes, CirculationCreationAttributes>
  implements CirculationAttributes
{
  public circulationId!: number;
  public bookId!: number;
  public studentId!: number;
  public issueDate!: Date;
  public dueDate!: Date;
  public returnDate?: Date;
  public status!: 'borrowed' | 'returned' | 'overdue' | 'lost' | 'renewed';
  public renewalCount!: number;
  public maxRenewals!: number;
  public issuedBy!: number;
  public returnedBy?: number;
  public conditionOnIssue!: 'good' | 'damaged' | 'poor';
  public conditionOnReturn?: 'good' | 'damaged' | 'poor';
  public fine!: number;
  public finePaid!: boolean;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public isOverdue(): boolean {
    if (this.status === 'returned' || this.status === 'lost') {
      return false;
    }
    return new Date() > this.dueDate;
  }

  public getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public canRenew(): boolean {
    return this.renewalCount < this.maxRenewals && this.status === 'borrowed';
  }

  public async renew(): Promise<Circulation> {
    if (!this.canRenew()) {
      throw new Error('Cannot renew this circulation');
    }
    this.renewalCount += 1;
    // Extend due date by 14 days
    const newDueDate = new Date(this.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 14);
    this.dueDate = newDueDate;
    this.status = 'renewed';
    await this.save();
    return this;
  }

  public calculateFine(dailyRate: number = 5): number {
    const daysOverdue = this.getDaysOverdue();
    return daysOverdue * dailyRate;
  }

  public toJSON(): object {
    return {
      circulationId: this.circulationId,
      bookId: this.bookId,
      studentId: this.studentId,
      issueDate: this.issueDate,
      dueDate: this.dueDate,
      returnDate: this.returnDate,
      status: this.status,
      renewalCount: this.renewalCount,
      maxRenewals: this.maxRenewals,
      issuedBy: this.issuedBy,
      returnedBy: this.returnedBy,
      conditionOnIssue: this.conditionOnIssue,
      conditionOnReturn: this.conditionOnReturn,
      fine: this.fine,
      finePaid: this.finePaid,
      remarks: this.remarks,
      isOverdue: this.isOverdue(),
      daysOverdue: this.getDaysOverdue(),
      canRenew: this.canRenew(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initCirculation(sequelize: any): typeof Circulation {
  Circulation.init(
    {
      circulationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      bookId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'books',
          key: 'book_id',
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
      issueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      returnDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('borrowed', 'returned', 'overdue', 'lost', 'renewed'),
        allowNull: false,
        defaultValue: 'borrowed',
      },
      renewalCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      maxRenewals: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 2,
      },
      issuedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      returnedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      conditionOnIssue: {
        type: DataTypes.ENUM('good', 'damaged', 'poor'),
        allowNull: false,
        defaultValue: 'good',
      },
      conditionOnReturn: {
        type: DataTypes.ENUM('good', 'damaged', 'poor'),
        allowNull: true,
      },
      fine: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      finePaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'circulations',
      timestamps: true,
      indexes: [
        {
          name: 'idx_circulations_book_id',
          fields: ['book_id'],
        },
        {
          name: 'idx_circulations_student_id',
          fields: ['student_id'],
        },
        {
          name: 'idx_circulations_status',
          fields: ['status'],
        },
        {
          name: 'idx_circulations_due_date',
          fields: ['due_date'],
        },
        {
          name: 'idx_circulations_student_status',
          fields: ['student_id', 'status'],
        },
      ],
    }
  );

  return Circulation;
}

export default Circulation;
