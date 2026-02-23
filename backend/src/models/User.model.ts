import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';
import bcrypt from 'bcrypt';

/**
 * User Roles as per Nepal School Management System
 */
export enum UserRole {
  SCHOOL_ADMIN = 'School_Admin',
  SUBJECT_TEACHER = 'Subject_Teacher',
  CLASS_TEACHER = 'Class_Teacher',
  DEPARTMENT_HEAD = 'Department_Head',
  ECA_COORDINATOR = 'ECA_Coordinator',
  SPORTS_COORDINATOR = 'Sports_Coordinator',
  STUDENT = 'Student',
  PARENT = 'Parent',
  LIBRARIAN = 'Librarian',
  ACCOUNTANT = 'Accountant',
  TRANSPORT_MANAGER = 'Transport_Manager',
  HOSTEL_WARDEN = 'Hostel_Warden',
  NON_TEACHING_STAFF = 'Non_Teaching_Staff'
}

/**
 * User Status
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  LOCKED = 'locked'
}

/**
 * User Attributes Interface
 */
export interface UserAttributes {
  userId: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  profilePhoto?: string;
  lastLogin?: Date;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * User Creation Attributes (optional fields for creation)
 */
export interface UserCreationAttributes extends Optional<UserAttributes, 
  'userId' | 'status' | 'failedLoginAttempts' | 'lastLogin' | 'accountLockedUntil' | 
  'passwordChangedAt' | 'passwordResetToken' | 'passwordResetExpires' | 'refreshToken' | 
  'refreshTokenExpiresAt' | 'phoneNumber' | 'profilePhoto' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * User Model Class
 */
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare userId: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare role: UserRole;
  declare status: UserStatus;
  declare phoneNumber?: string;
  declare profilePhoto?: string;
  declare lastLogin?: Date;
  declare failedLoginAttempts: number;
  declare accountLockedUntil?: Date;
  declare passwordChangedAt?: Date;
  declare passwordResetToken?: string;
  declare passwordResetExpires?: Date;
  declare refreshToken?: string;
  declare refreshTokenExpiresAt?: Date;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  /**
   * Compare password with hashed password
   */
  public comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Check if account is locked
   */
  public isAccountLocked(): boolean {
    if (!this.accountLockedUntil) return false;
    return this.accountLockedUntil > new Date();
  }

  /**
   * Check if password was changed after token was issued
   */
  public changedPasswordAfter(jwtTimestamp: number): boolean {
    if (this.passwordChangedAt) {
      const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
      return jwtTimestamp < changedTimestamp;
    }
    return false;
  }

  /**
   * Generate password reset token
   * Returns a random token and sets expiration to 1 hour
   */
  public async generatePasswordResetToken(): Promise<string> {
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before storing in database
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expiration to 1 hour from now
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    
    await this.save();
    
    // Return unhashed token to send to user
    return resetToken;
  }

  /**
   * Verify password reset token
   */
  public static async verifyPasswordResetToken(token: string): Promise<User | null> {
    const crypto = await import('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken
      }
    });
    
    if (!user || !user.passwordResetExpires) {
      return null;
    }
    
    // Check if token has expired
    if (user.passwordResetExpires < new Date()) {
      return null;
    }
    
    return user;
  }

  /**
   * Clear password reset token
   */
  public async clearPasswordResetToken(): Promise<void> {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
    await this.save();
  }
}

/**
 * Initialize User Model
 */
User.init(
  {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'user_id'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255]
      }
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      allowNull: false,
      defaultValue: UserStatus.ACTIVE
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'phone_number',
      validate: {
        is: /^[0-9+\-() ]+$/
      }
    },
    profilePhoto: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'profile_photo'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'failed_login_attempts'
    },
    accountLockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'account_locked_until'
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_changed_at'
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_reset_token'
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires'
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token'
    },
    refreshTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'refresh_token_expires_at'
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
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['username']
      },
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['status']
      }
    ],
    hooks: {
      /**
       * Hash password before creating user
       * Using bcrypt cost factor 12 as per security requirements
       */
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      /**
       * Hash password before updating if password changed
       * Using bcrypt cost factor 12 as per security requirements
       */
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
          user.passwordChangedAt = new Date();
        }
      }
    }
  }
);

export default User;
