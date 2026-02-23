import sequelize from '../config/database';
import { BSCalendar } from '../models/BSCalendar.model';
import { BSCalendarService } from '../services/bsCalendar.service';
import { logger } from '../utils/logger';

/**
 * Script to populate BS calendar data
 * Run this after creating the bs_calendar table
 * 
 * Usage: npm run populate-bs-calendar
 */

async function populateBSCalendar(): Promise<void> {
  try {
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Populate calendar data
    logger.info('Populating BS calendar data...');
    await BSCalendarService.populateCalendar();
    
    // Verify data
    const count = await BSCalendar.count();
    logger.info(`BS calendar populated successfully with ${count} records`);

    // Show sample data
    const sampleData = await BSCalendar.findAll({
      where: { yearBS: 2080 },
      order: [['monthBS', 'ASC']],
      limit: 3
    });

    logger.info('Sample data (first 3 months of 2080 BS):');
    sampleData.forEach(record => {
      logger.info(`  ${record.yearBs}-${record.monthBs.toString().padStart(2, '0')} (${record.monthNameEn}): ${record.daysInMonth} days, AD: ${record.startDateAd.toISOString().split('T')[0]} to ${record.endDateAd.toISOString().split('T')[0]}`);
    });

    process.exit(0);
  } catch (error) {
    logger.error('Error populating BS calendar:', error);
    process.exit(1);
  }
}

populateBSCalendar();
