import { sequelize } from '../config/database';
import * as migration010 from '../migrations/010-create-staff-documents-table';

async function runMigration(): Promise<void> {
  try {
    console.log('🔄 Running staff_documents table migration...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Run the migration
    await migration010.up(sequelize.getQueryInterface());
    
    console.log('✅ staff_documents table created successfully');
    console.log('✅ All indexes created');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if table already exists
    if (error.original?.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Table already exists, skipping migration');
      process.exit(0);
    }
    
    process.exit(1);
  }
}

runMigration();
