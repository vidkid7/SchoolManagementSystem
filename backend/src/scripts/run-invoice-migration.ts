import sequelize from '../config/database';
import { QueryInterface } from 'sequelize';
import { up } from '../migrations/016-create-invoice-tables';

async function runMigration() {
  try {
    console.log('Running invoice tables migration...');
    
    const queryInterface: QueryInterface = sequelize.getQueryInterface();
    
    // Run the migration
    await up(queryInterface);
    
    console.log('✓ Invoice tables migration completed successfully');
    
    // Verify tables were created
    const tables = await queryInterface.showAllTables();
    console.log('\nCreated tables:', tables.filter(t => 
      t === 'invoices' || t === 'invoice_items'
    ));
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
