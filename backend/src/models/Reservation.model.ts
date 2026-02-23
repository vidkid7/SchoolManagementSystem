/**
 * Reservation Model
 * 
 * Implements library book reservation entity
 * 
 * Requirements: 10.7, 10.8
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface ReservationAttributes {
  reservationId: number;
  bookId: number;
  studentId: number;
  reservationDate: Date;
  expiryDate: Date;
  status: 'pending' | 'available' | 'fulfilled' | 'expired' | 'cancelled';
  notificationSent: boolean;
  fulfilledDate?: Date;
  cancelledDate?: Date;
  cancelReason?: string;
  cancelledBy?: number;
  availableDate?: Date;
  queuePosition?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReservationCreationAttributes extends Optional<ReservationAttributes, 'reservationId' | 'status' | 'notificationSent'> {}

export class Reservation
  extends Model<ReservationAttributes, ReservationCreationAttributes>
  implements ReservationAttributes
{
  public reservationId!: number;
  public bookId!: number;
  public studentId!: number;
  public reservationDate!: Date;
  public expiryDate!: Date;
  public status!: 'pending' | 'available' | 'fulfilled' | 'expired' | 'cancelled';
  public notificationSent!: boolean;
  public fulfilledDate?: Date;
  public cancelledDate?: Date;
  public cancelReason?: string;
  public cancelledBy?: number;
  public availableDate?: Date;
  public queuePosition?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public isExpired(): boolean {
    return new Date() > this.expiryDate && this.status === 'pending';
  }

  public async markExpired(): Promise<void> {
    if (this.isExpired()) {
      this.status = 'expired';
      await this.save();
    }
  }

  public async fulfill(): Promise<void> {
    this.status = 'fulfilled';
    this.fulfilledDate = new Date();
    await this.save();
  }

  public async cancel(reason?: string): Promise<void> {
    this.status = 'cancelled';
    this.cancelledDate = new Date();
    this.cancelReason = reason;
    await this.save();
  }

  public toJSON(): object {
    return {
      reservationId: this.reservationId,
      bookId: this.bookId,
      studentId: this.studentId,
      reservationDate: this.reservationDate,
      expiryDate: this.expiryDate,
      status: this.status,
      notificationSent: this.notificationSent,
      fulfilledDate: this.fulfilledDate,
      cancelledDate: this.cancelledDate,
      cancelReason: this.cancelReason,
      cancelledBy: this.cancelledBy,
      availableDate: this.availableDate,
      queuePosition: this.queuePosition,
      isExpired: this.isExpired(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initReservation(sequelize: any): typeof Reservation {
  Reservation.init(
    {
      reservationId: {
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
      reservationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'available', 'fulfilled', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notificationSent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      fulfilledDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      cancelledDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      cancelReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cancelledBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      availableDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      queuePosition: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'reservations',
      timestamps: true,
      indexes: [
        {
          name: 'idx_reservations_book_id',
          fields: ['book_id'],
        },
        {
          name: 'idx_reservations_student_id',
          fields: ['student_id'],
        },
        {
          name: 'idx_reservations_status',
          fields: ['status'],
        },
        {
          name: 'idx_reservations_expiry_date',
          fields: ['expiry_date'],
        },
        {
          name: 'idx_reservations_queue_position',
          fields: ['queue_position'],
        },
      ],
    }
  );

  return Reservation;
}

export default Reservation;