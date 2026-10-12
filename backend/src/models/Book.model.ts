/**
 * Book Model
 * 
 * Implements library book entity
 * 
 * Requirements: 10.1, 10.2
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface BookAttributes {
  bookId: number;
  accessionNumber: string;
  isbn: string;
  title: string;
  titleNp?: string;
  author: string;
  authorNp?: string;
  publisher?: string;
  publicationYear?: number;
  category: string;
  subcategory?: string;
  language: string;
  edition?: string;
  pages?: number;
  price?: number;
  copies: number;
  availableCopies: number;
  location?: string;
  shelfNumber?: string;
  barcode?: string;
  coverImage?: string;
  description?: string;
  keywords?: string[];
  status: 'available' | 'borrowed' | 'lost' | 'damaged' | 'withdrawn';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookCreationAttributes extends Optional<BookAttributes, 'bookId' | 'availableCopies' | 'status'> {}

export class Book
  extends Model<BookAttributes, BookCreationAttributes>
  implements BookAttributes
{
  declare public bookId: number;
  declare public accessionNumber: string;
  declare public isbn: string;
  declare public title: string;
  declare public titleNp?: string;
  declare public author: string;
  declare public authorNp?: string;
  declare public publisher?: string;
  declare public publicationYear?: number;
  declare public category: string;
  declare public subcategory?: string;
  declare public language: string;
  declare public edition?: string;
  declare public pages?: number;
  declare public price?: number;
  declare public copies: number;
  declare public availableCopies: number;
  declare public location?: string;
  declare public shelfNumber?: string;
  declare public barcode?: string;
  declare public coverImage?: string;
  declare public description?: string;
  declare public keywords?: string[];
  declare public status: 'available' | 'borrowed' | 'lost' | 'damaged' | 'withdrawn';
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  public async decrementAvailableCopies(): Promise<void> {
    const availableCopies = Number(this.getDataValue('availableCopies') ?? 0);
    if (availableCopies > 0) {
      const nextAvailableCopies = availableCopies - 1;
      this.setDataValue('availableCopies', nextAvailableCopies);
      if (nextAvailableCopies === 0) {
        this.setDataValue('status', 'borrowed');
      }
      await this.save();
    }
  }

  public async incrementAvailableCopies(): Promise<void> {
    const availableCopies = Number(this.getDataValue('availableCopies') ?? 0);
    const copies = Number(this.getDataValue('copies') ?? 0);
    if (availableCopies < copies) {
      const nextAvailableCopies = availableCopies + 1;
      this.setDataValue('availableCopies', nextAvailableCopies);
      if (nextAvailableCopies > 0) {
        this.setDataValue('status', 'available');
      }
      await this.save();
    }
  }

  public isAvailable(): boolean {
    return Number(this.getDataValue('availableCopies') ?? 0) > 0 && this.getDataValue('status') === 'available';
  }

  public toJSON(): object {
    const values = this.get({ plain: true }) as BookAttributes;
    return {
      ...values,
      isAvailable: this.isAvailable(),
    };
  }
}

Book.init(
  {
    bookId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    accessionNumber: {
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
    titleNp: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    authorNp: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    publisher: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    publicationYear: {
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
    availableCopies: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shelfNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    coverImage: {
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
  },
  {
    sequelize,
    tableName: 'books',
    timestamps: true,
    indexes: [
      {
        name: 'idx_books_accession',
        fields: ['accession_number'],
      },
      {
        name: 'idx_books_isbn',
        fields: ['isbn'],
      },
      {
        name: 'idx_books_category',
        fields: ['category'],
      },
      {
        name: 'idx_books_status',
        fields: ['status'],
      },
      {
        name: 'idx_books_barcode',
        fields: ['barcode'],
      },
    ],
  }
);

export default Book;
