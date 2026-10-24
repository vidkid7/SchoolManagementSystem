import { Sequelize, Options } from 'sequelize';
import { logger } from '../utils/logger';

/**
 * Database Configuration
 * Handles MySQL connection with connection pooling
 * Supports both DATABASE_URL (Railway) and individual env vars
 */

// Parse DATABASE_URL if provided (Railway format)
const parseDatabaseUrl = (url: string) => {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    return {
      username: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5]
    };
  }
  return null;
};

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const parsedUrl = databaseUrl ? parseDatabaseUrl(databaseUrl) : null;
// Allow isolated service tests to opt into an ephemeral database. Production and
// development remain MySQL unless both NODE_ENV=test and TEST_DB_DIALECT=sqlite.
const useInMemorySqliteForTests =
  process.env.NODE_ENV === 'test' && process.env.TEST_DB_DIALECT === 'sqlite';

const dbConfig: Options = {
  host: parsedUrl?.host || process.env.DB_HOST || 'localhost',
  port: parsedUrl?.port || parseInt(process.env.DB_PORT || '3306'),
  database: parsedUrl?.database || process.env.DB_NAME || 'school_management_system',
  username: parsedUrl?.username || process.env.DB_USER || 'root',
  password: parsedUrl?.password || process.env.DB_PASSWORD || '',
  dialect: useInMemorySqliteForTests ? 'sqlite' : 'mysql',
  ...(useInMemorySqliteForTests ? { storage: ':memory:' } : {}),
  ...(process.env.DB_SSL === 'true' ? { dialectOptions: { ssl: {} } } : {}),
  
  // Connection Pool Configuration
  pool: {
    // SQLite :memory: databases and connection-local PRAGMAs must use one
    // connection; production MySQL keeps the configured pool size.
    min: useInMemorySqliteForTests ? 0 : parseInt(process.env.DB_POOL_MIN || '2'),
    max: useInMemorySqliteForTests ? 1 : parseInt(process.env.DB_POOL_MAX || '10'),
    acquire: 30000,
    idle: 10000
  },
  
  // Logging
  logging: process.env.NODE_ENV === 'development' 
    ? (msg: string) => logger.debug(msg)
    : false,
  
  // Timezone
  ...(!useInMemorySqliteForTests ? { timezone: '+05:45' } : {}), // SQLite returns UTC and rejects custom timezone settings
  
  // Performance
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  
  // Query options
  query: {
    raw: false
  },
  
  // Retry configuration
  retry: {
    max: 3,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ]
  }
};

// Create Sequelize instance
export const sequelize = new Sequelize(dbConfig);

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to database:', error);
    return false;
  }
};

/**
 * Close database connection
 */
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

/**
 * Sync database models (use with caution in production)
 */
export const syncDatabase = async (force = false): Promise<void> => {
  try {
    await sequelize.sync({ force, alter: !force });
    logger.info(`Database synced ${force ? '(forced)' : '(altered)'}`);
  } catch (error) {
    logger.error('Error syncing database:', error);
    throw error;
  }
};

export default sequelize;
