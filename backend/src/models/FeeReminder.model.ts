import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Reminder Type Enum
 */
export enum ReminderType {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
  FINAL = 'final'
}

/**
 * Reminder Status Enum
 */
export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered'
}

/**
 * Fee Reminder Attributes Interface
 */
export interface FeeReminderAttributes {
  feeReminderId: number;
  invoiceId: number;
  studentId: number;
  reminderType: ReminderType;
  daysOverdue: number;
  phoneNumber: string;
  message: string;
  status: ReminderStatus;
  smsGatewayId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Fee Reminder Creation Attributes
 */
export interface FeeReminderCreationAttributes extends Optional<FeeReminderAttributes,
  'feeReminderId' | 'status' | 'smsGatewayId' | 'sentAt' | 'deliveredAt' | 
  'failureReason' | 'createdAt' | 'updatedAt'> {}

/**
 * Fee Reminder Model Class
 * 
 * Tracks SMS reminders sent for overdue fee invoices
 * Requirements: 9.13
 */
class FeeReminder extends Model<FeeReminderAttributes, FeeReminderCreationAttributes> 
  implements FeeReminderAttributes {
  public feeReminderId!: number;
  public invoiceId!: number;
  public studentId!: number;
  public reminderType!: ReminderType;
  public daysOverdue!: number;
  public phoneNumber!: string;
  public message!: string;
  public status!: ReminderStatus;
  public smsGatewayId?: string;
  public sentAt?: Date;
  public deliveredAt?: Date;
  public failureReason?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if reminder is pending
   */
  public isPending(): boolean {
    return this.status === ReminderStatus.PENDING;
  }

  /**
   * Check if reminder was sent
   */
  public isSent(): boolean {
    return this.status === ReminderStatus.SENT || this.status === ReminderStatus.DELIVERED;
  }

  /**
   * Check if reminder failed
   */
  public isFailed(): boolean {
    return this.status === ReminderStatus.FAILED;
  }

  /**
   * Check if reminder was delivered
   */
  public isDelivered(): boolean {
    return this.status === ReminderStatus.DELIVERED;
  }

  /**
   * Mark reminder as sent
   */
  public markAsSent(smsGatewayId?: string): void {
    this.status = ReminderStatus.SENT;
    this.sentAt = new Date();
    if (smsGatewayId) {
      this.smsGatewayId = smsGatewayId;
    }
  }

  /**
   * Mark reminder as delivered
   */
  public markAsDelivered(): void {
    this.status = ReminderStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  /**
   * Mark reminder as failed
   */
  public markAsFailed(reason: string): void {
    this.status = ReminderStatus.FAILED;
    this.failureReason = reason;
  }

  /**
   * Get reminder type priority (1 = first, 4 = final)
   */
  public getTypePriority(): number {
    const priorities: Record<ReminderType, number> = {
      [ReminderType.FIRST]: 1,
      [ReminderType.SECOND]: 2,
      [ReminderType.THIRD]: 3,
      [ReminderType.FINAL]: 4
    };
    return priorities[this.reminderType];
  }
}

/**
 * Initialize Fee Reminder Model
 */
FeeReminder.init(
  {
    feeReminderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'fee_reminder_id'
    },
    invoiceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'invoice_id',
      references: {
        model: 'invoices',
        key: 'invoice_id'
      },
      comment: 'Link to invoice'
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id',
      references: {
        model: 'students',
        key: 'student_id'
      },
      comment: 'Link to student'
    },
    reminderType: {
      type: DataTypes.ENUM(...Object.values(ReminderType)),
      allowNull: false,
      field: 'reminder_type',
      comment: 'Type of reminder (first, second, third, final)'
    },
    daysOverdue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'days_overdue',
      validate: {
        min: 0
      },
      comment: 'Number of days overdue when reminder was sent'
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'phone_number',
      validate: {
        notEmpty: true,
        len: [10, 20]
      },
      comment: 'Phone number where reminder was sent'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'SMS message content'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ReminderStatus)),
      allowNull: false,
      defaultValue: ReminderStatus.PENDING,
      comment: 'Reminder status'
    },
    smsGatewayId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'sms_gateway_id',
      comment: 'SMS gateway message ID for tracking'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at',
      comment: 'Timestamp when reminder was sent'
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'delivered_at',
      comment: 'Timestamp when reminder was delivered'
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'failure_reason',
      comment: 'Reason for failure if status is failed'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'fee_reminders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['invoice_id']
      },
      {
        fields: ['student_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['sent_at']
      },
      {
        name: 'idx_fee_reminders_invoice_type',
        fields: ['invoice_id', 'reminder_type']
      },
      {
        name: 'idx_fee_reminders_student_status',
        fields: ['student_id', 'status']
      }
    ]
  }
);

/**
 * Reminder Config Attributes Interface
 */
export interface ReminderConfigAttributes {
  reminderConfigId: number;
  name: string;
  description?: string;
  firstReminderDays: number;
  secondReminderDays: number;
  thirdReminderDays: number;
  finalReminderDays: number;
  isActive: boolean;
  isDefault: boolean;
  messageTemplateFirst?: string;
  messageTemplateSecond?: string;
  messageTemplateThird?: string;
  messageTemplateFinal?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Reminder Config Creation Attributes
 */
export interface ReminderConfigCreationAttributes extends Optional<ReminderConfigAttributes,
  'reminderConfigId' | 'description' | 'isActive' | 'isDefault' | 
  'messageTemplateFirst' | 'messageTemplateSecond' | 'messageTemplateThird' | 
  'messageTemplateFinal' | 'createdAt' | 'updatedAt'> {}

/**
 * Reminder Config Model Class
 * 
 * Stores configurable reminder intervals and message templates
 * Requirements: 9.13
 */
class ReminderConfig extends Model<ReminderConfigAttributes, ReminderConfigCreationAttributes> 
  implements ReminderConfigAttributes {
  public reminderConfigId!: number;
  public name!: string;
  public description?: string;
  public firstReminderDays!: number;
  public secondReminderDays!: number;
  public thirdReminderDays!: number;
  public finalReminderDays!: number;
  public isActive!: boolean;
  public isDefault!: boolean;
  public messageTemplateFirst?: string;
  public messageTemplateSecond?: string;
  public messageTemplateThird?: string;
  public messageTemplateFinal?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Get reminder days for a specific type
   */
  public getReminderDays(type: ReminderType): number {
    const daysMap: Record<ReminderType, number> = {
      [ReminderType.FIRST]: this.firstReminderDays,
      [ReminderType.SECOND]: this.secondReminderDays,
      [ReminderType.THIRD]: this.thirdReminderDays,
      [ReminderType.FINAL]: this.finalReminderDays
    };
    return daysMap[type];
  }

  /**
   * Get message template for a specific type
   */
  public getMessageTemplate(type: ReminderType): string | undefined {
    const templateMap: Record<ReminderType, string | undefined> = {
      [ReminderType.FIRST]: this.messageTemplateFirst,
      [ReminderType.SECOND]: this.messageTemplateSecond,
      [ReminderType.THIRD]: this.messageTemplateThird,
      [ReminderType.FINAL]: this.messageTemplateFinal
    };
    return templateMap[type];
  }

  /**
   * Get all reminder intervals as array
   */
  public getAllReminderDays(): number[] {
    return [
      this.firstReminderDays,
      this.secondReminderDays,
      this.thirdReminderDays,
      this.finalReminderDays
    ];
  }

  /**
   * Validate reminder days are in ascending order
   */
  public validateReminderDays(): boolean {
    return (
      this.firstReminderDays < this.secondReminderDays &&
      this.secondReminderDays < this.thirdReminderDays &&
      this.thirdReminderDays < this.finalReminderDays
    );
  }
}

/**
 * Initialize Reminder Config Model
 */
ReminderConfig.init(
  {
    reminderConfigId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'reminder_config_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 100]
      },
      comment: 'Configuration name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of this configuration'
    },
    firstReminderDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      field: 'first_reminder_days',
      validate: {
        min: 0
      },
      comment: 'Days after due date to send first reminder'
    },
    secondReminderDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      field: 'second_reminder_days',
      validate: {
        min: 0
      },
      comment: 'Days after due date to send second reminder'
    },
    thirdReminderDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 14,
      field: 'third_reminder_days',
      validate: {
        min: 0
      },
      comment: 'Days after due date to send third reminder'
    },
    finalReminderDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: 'final_reminder_days',
      validate: {
        min: 0
      },
      comment: 'Days after due date to send final reminder'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: 'Whether this configuration is active'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default',
      comment: 'Whether this is the default configuration'
    },
    messageTemplateFirst: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'message_template_first',
      comment: 'SMS template for first reminder'
    },
    messageTemplateSecond: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'message_template_second',
      comment: 'SMS template for second reminder'
    },
    messageTemplateThird: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'message_template_third',
      comment: 'SMS template for third reminder'
    },
    messageTemplateFinal: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'message_template_final',
      comment: 'SMS template for final reminder'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'reminder_config',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_default']
      }
    ]
  }
);

export { FeeReminder, ReminderConfig };
export default FeeReminder;
