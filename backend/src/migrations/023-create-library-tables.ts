/**
 * Migration: Create Library Tables
 * 
 * Creates database tables for library management (books, circulations, reservations)
 * 
 * Requirements: 10.1, 10.2, 10.4, 10.5, 10.7, 10.8, 10.10
 */

import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  // Create books table
  await queryInterface.createTable('books', {
    book_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    accession_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    isbn: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    title_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    author_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    publisher: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    publication_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'English',
    },
    edition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pages: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    copies: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    available_copies: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shelf_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    keywords: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('available', 'borrowed', 'lost', 'damaged', 'withdrawn'),
      allowNull: false,
      defaultValue: 'available',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create circulations table
  await queryInterface.createTable('circulations', {
    circulation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    book_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'books',
        key: 'book_id',
      },
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id',
      },
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    return_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('borrowed', 'returned', 'overdue', 'lost', 'renewed'),
      allowNull: false,
      defaultValue: 'borrowed',
    },
    renewal_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    max_renewals: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 2,
    },
    issued_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    returned_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    condition_on_issue: {
      type: DataTypes.ENUM('good', 'damaged', 'poor'),
      allowNull: false,
      defaultValue: 'good',
    },
    condition_on_return: {
      type: DataTypes.ENUM('good', 'damaged', 'poor'),
      allowNull: true,
    },
    fine: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    fine_paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create reservations table
  await queryInterface.createTable('reservations', {
    reservation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    book_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'books',
        key: 'book_id',
      },
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id',
      },
    },
    reservation_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'fulfilled', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notification_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fulfilled_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    cancelled_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    cancel_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create library_fines table
  await queryInterface.createTable('library_fines', {
    fine_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    circulation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'circulations',
        key: 'circulation_id',
      },
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id',
      },
    },
    fine_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    fine_reason: {
      type: DataTypes.ENUM('overdue', 'lost', 'damaged'),
      allowNull: false,
    },
    days_overdue: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    daily_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'partial', 'paid', 'waived'),
      allowNull: false,
      defaultValue: 'pending',
    },
    waived_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    waived_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    waived_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    waived_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paid_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create indexes
  await queryInterface.addIndex('books', ['accession_number'], { name: 'idx_books_accession' });
  await queryInterface.addIndex('books', ['isbn'], { name: 'idx_books_isbn' });
  await queryInterface.addIndex('books', ['category'], { name: 'idx_books_category' });
  await queryInterface.addIndex('books', ['status'], { name: 'idx_books_status' });
  await queryInterface.addIndex('books', ['barcode'], { name: 'idx_books_barcode' });
  
  await queryInterface.addIndex('circulations', ['book_id'], { name: 'idx_circulations_book_id' });
  await queryInterface.addIndex('circulations', ['student_id'], { name: 'idx_circulations_student_id' });
  await queryInterface.addIndex('circulations', ['status'], { name: 'idx_circulations_status' });
  await queryInterface.addIndex('circulations', ['due_date'], { name: 'idx_circulations_due_date' });
  
  await queryInterface.addIndex('reservations', ['book_id'], { name: 'idx_reservations_book_id' });
  await queryInterface.addIndex('reservations', ['student_id'], { name: 'idx_reservations_student_id' });
  await queryInterface.addIndex('reservations', ['status'], { name: 'idx_reservations_status' });
  
  await queryInterface.addIndex('library_fines', ['student_id'], { name: 'idx_library_fines_student_id' });
  await queryInterface.addIndex('library_fines', ['circulation_id'], { name: 'idx_library_fines_circulation_id' });
  await queryInterface.addIndex('library_fines', ['status'], { name: 'idx_library_fines_status' });
}

export async function down(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  await queryInterface.dropTable('library_fines');
  await queryInterface.dropTable('reservations');
  await queryInterface.dropTable('circulations');
  await queryInterface.dropTable('books');
}
