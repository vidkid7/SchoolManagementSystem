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
  publisher: string;
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
  public bookId!: number;
  public accessionNumber!: string;
  public isbn!: string;
  public title!: string;
  public titleNp?: string;
  public author!: string;
  public authorNp?: string;
  public publisher!: string;
  public publicationYear?: number;
  public category!: string;
  public subcategory?: string;
  public language!: string;
  public edition?: string;
  public pages?: number;
  public price?: number;
  public copies!: number;
  public availableCopies!: number;
  public location?: string;
  public shelfNumber?: string;
  public barcode?: string;
  public coverImage?: string;
  public description?: string;
  public keywords?: string[];
  public status!: 'available' | 'borrowed' | 'lost' | 'damaged' | 'withdrawn';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async decrementAvailableCopies(): Promise<void> {
    if (this.availableCopies > 0) {
      this.availableCopies -= 1;
      if (this.availableCopies === 0) {
        this.status = 'borrowed';
      }
      await this.save();
    }
  }

  public async incrementAvailableCopies(): Promise<void> {
    if (this.availableCopies < this.copies) {
      this.availableCopies += 1;
      if (this.availableCopies > 0) {
        this.status = 'available';
      }
      await this.save();
    }
  }

  public isAvailable(): boolean {
    return this.availableCopies > 0 && this.status === 'available';
  }

  public toJSON(): object {
    return {
      bookId: this.bookId,
      accessionNumber: this.accessionNumber,
      isbn: this.isbn,
      title: this.title,
      titleNp: this.titleNp,
      author: this.author,
      authorNp: this.authorNp,
      publisher: this.publisher,
      publicationYear: this.publicationYear,
      category: this.category,
      subcategory: this.subcategory,
      language: this.language,
      edition: this.edition,
      pages: this.pages,
      price: this.price,
      copies: this.copies,
      availableCopies: this.availableCopies,
      location: this.location,
      shelfNumber: this.shelfNumber,
      barcode: this.barcode,
      coverImage: this.coverImage,
      description: this.description,
      keywords: this.keywords,
      status: this.status,
      isAvailable: this.isAvailable(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
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
      allowNull: false,
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
