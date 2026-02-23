/**
 * Seed Nepal Government Holidays
 * 
 * Seeds common Nepal government holidays into the events table
 * 
 * Requirements: 31.2
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_management',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
  }
);

/**
 * Nepal Government Holidays for 2081 BS (2024-2025 AD)
 * 
 * Note: These are approximate dates and should be verified with official calendar
 */
const nepalHolidays2081 = [
  {
    title: 'New Year\'s Day',
    titleNp: 'नयाँ वर्ष',
    category: 'holiday',
    startDate: '2024-04-14',
    startDateBS: '2081-01-01',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Nepali New Year',
    governmentHolidayNameNp: 'नेपाली नयाँ वर्ष',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Buddha Jayanti',
    titleNp: 'बुद्ध जयन्ती',
    category: 'holiday',
    startDate: '2024-05-23',
    startDateBS: '2081-02-10',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Buddha Jayanti',
    governmentHolidayNameNp: 'बुद्ध जयन्ती',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Republic Day',
    titleNp: 'गणतन्त्र दिवस',
    category: 'holiday',
    startDate: '2024-05-29',
    startDateBS: '2081-02-16',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Republic Day',
    governmentHolidayNameNp: 'गणतन्त्र दिवस',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Janai Purnima',
    titleNp: 'जनै पूर्णिमा',
    category: 'holiday',
    startDate: '2024-08-19',
    startDateBS: '2081-05-04',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Janai Purnima',
    governmentHolidayNameNp: 'जनै पूर्णिमा',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Krishna Janmashtami',
    titleNp: 'कृष्ण जन्माष्टमी',
    category: 'holiday',
    startDate: '2024-08-26',
    startDateBS: '2081-05-11',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Krishna Janmashtami',
    governmentHolidayNameNp: 'कृष्ण जन्माष्टमी',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Teej',
    titleNp: 'तीज',
    category: 'holiday',
    startDate: '2024-09-06',
    startDateBS: '2081-05-22',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Teej',
    governmentHolidayNameNp: 'तीज',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Constitution Day',
    titleNp: 'संविधान दिवस',
    category: 'holiday',
    startDate: '2024-09-19',
    startDateBS: '2081-06-03',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Constitution Day',
    governmentHolidayNameNp: 'संविधान दिवस',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Dashain (Ghatasthapana)',
    titleNp: 'दशैं (घटस्थापना)',
    category: 'holiday',
    startDate: '2024-10-03',
    startDateBS: '2081-06-17',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Dashain',
    governmentHolidayNameNp: 'दशैं',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Dashain (Fulpati)',
    titleNp: 'दशैं (फूलपाती)',
    category: 'holiday',
    startDate: '2024-10-10',
    startDateBS: '2081-06-24',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Dashain Fulpati',
    governmentHolidayNameNp: 'दशैं फूलपाती',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Dashain (Maha Ashtami)',
    titleNp: 'दशैं (महा अष्टमी)',
    category: 'holiday',
    startDate: '2024-10-11',
    startDateBS: '2081-06-25',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Dashain Maha Ashtami',
    governmentHolidayNameNp: 'दशैं महा अष्टमी',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Dashain (Maha Nawami)',
    titleNp: 'दशैं (महा नवमी)',
    category: 'holiday',
    startDate: '2024-10-12',
    startDateBS: '2081-06-26',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Dashain Maha Nawami',
    governmentHolidayNameNp: 'दशैं महा नवमी',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Dashain (Vijaya Dashami)',
    titleNp: 'दशैं (विजया दशमी)',
    category: 'holiday',
    startDate: '2024-10-13',
    startDateBS: '2081-06-27',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Dashain Vijaya Dashami',
    governmentHolidayNameNp: 'दशैं विजया दशमी',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Dashain (Ekadashi)',
    titleNp: 'दशैं (एकादशी)',
    category: 'holiday',
    startDate: '2024-10-14',
    startDateBS: '2081-06-28',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Dashain Ekadashi',
    governmentHolidayNameNp: 'दशैं एकादशी',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Dashain (Dwadashi)',
    titleNp: 'दशैं (द्वादशी)',
    category: 'holiday',
    startDate: '2024-10-15',
    startDateBS: '2081-06-29',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Dashain Dwadashi',
    governmentHolidayNameNp: 'दशैं द्वादशी',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Kojagrat Purnima',
    titleNp: 'कोजाग्रत पूर्णिमा',
    category: 'holiday',
    startDate: '2024-10-17',
    startDateBS: '2081-07-01',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Kojagrat Purnima',
    governmentHolidayNameNp: 'कोजाग्रत पूर्णिमा',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Tihar (Kaag Tihar)',
    titleNp: 'तिहार (काग तिहार)',
    category: 'holiday',
    startDate: '2024-10-31',
    startDateBS: '2081-07-15',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Tihar Kaag Tihar',
    governmentHolidayNameNp: 'तिहार काग तिहार',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Tihar (Kukur Tihar)',
    titleNp: 'तिहार (कुकुर तिहार)',
    category: 'holiday',
    startDate: '2024-11-01',
    startDateBS: '2081-07-16',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Tihar Kukur Tihar',
    governmentHolidayNameNp: 'तिहार कुकुर तिहार',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Tihar (Laxmi Puja)',
    titleNp: 'तिहार (लक्ष्मी पूजा)',
    category: 'holiday',
    startDate: '2024-11-02',
    startDateBS: '2081-07-17',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Tihar Laxmi Puja',
    governmentHolidayNameNp: 'तिहार लक्ष्मी पूजा',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Tihar (Govardhan Puja)',
    titleNp: 'तिहार (गोवर्धन पूजा)',
    category: 'holiday',
    startDate: '2024-11-03',
    startDateBS: '2081-07-18',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Tihar Govardhan Puja',
    governmentHolidayNameNp: 'तिहार गोवर्धन पूजा',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Tihar (Bhai Tika)',
    titleNp: 'तिहार (भाई टीका)',
    category: 'holiday',
    startDate: '2024-11-04',
    startDateBS: '2081-07-19',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Tihar Bhai Tika',
    governmentHolidayNameNp: 'तिहार भाई टीका',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Chhath',
    titleNp: 'छठ',
    category: 'holiday',
    startDate: '2024-11-07',
    startDateBS: '2081-07-22',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Chhath',
    governmentHolidayNameNp: 'छठ',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Udhauli Parva',
    titleNp: 'उधौली पर्व',
    category: 'holiday',
    startDate: '2024-12-15',
    startDateBS: '2081-09-01',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Udhauli Parva',
    governmentHolidayNameNp: 'उधौली पर्व',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Christmas',
    titleNp: 'क्रिसमस',
    category: 'holiday',
    startDate: '2024-12-25',
    startDateBS: '2081-09-11',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Christmas',
    governmentHolidayNameNp: 'क्रिसमस',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Tamu Lhosar',
    titleNp: 'तामु ल्होसार',
    category: 'holiday',
    startDate: '2024-12-30',
    startDateBS: '2081-09-16',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Tamu Lhosar',
    governmentHolidayNameNp: 'तामु ल्होसार',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Sonam Lhosar',
    titleNp: 'सोनाम ल्होसार',
    category: 'holiday',
    startDate: '2025-01-29',
    startDateBS: '2081-10-16',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Sonam Lhosar',
    governmentHolidayNameNp: 'सोनाम ल्होसार',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Basanta Panchami / Saraswati Puja',
    titleNp: 'बसन्त पञ्चमी / सरस्वती पूजा',
    category: 'holiday',
    startDate: '2025-02-02',
    startDateBS: '2081-10-20',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Basanta Panchami',
    governmentHolidayNameNp: 'बसन्त पञ्चमी',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Maha Shivaratri',
    titleNp: 'महा शिवरात्री',
    category: 'holiday',
    startDate: '2025-02-26',
    startDateBS: '2081-11-14',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Maha Shivaratri',
    governmentHolidayNameNp: 'महा शिवरात्री',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Holi',
    titleNp: 'होली',
    category: 'holiday',
    startDate: '2025-03-14',
    startDateBS: '2081-12-01',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Holi',
    governmentHolidayNameNp: 'होली',
    color: '#d32f2f',
    status: 'scheduled',
  },
  {
    title: 'Ghode Jatra',
    titleNp: 'घोडे जात्रा',
    category: 'holiday',
    startDate: '2025-03-29',
    startDateBS: '2081-12-16',
    isHoliday: true,
    isNepalGovernmentHoliday: true,
    governmentHolidayName: 'Ghode Jatra',
    governmentHolidayNameNp: 'घोडे जात्रा',
    color: '#d32f2f',
    status: 'scheduled',
  },
];

async function seedHolidays() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    console.log('Seeding Nepal government holidays...');

    // Check if holidays already exist
    const [existingHolidays] = await sequelize.query(
      'SELECT COUNT(*) as count FROM events WHERE is_nepal_government_holiday = true'
    );

    const count = (existingHolidays[0] as any).count;

    if (count > 0) {
      console.log(`Found ${count} existing government holidays. Skipping seed.`);
      console.log('To re-seed, delete existing holidays first.');
      return;
    }

    // Insert holidays
    for (const holiday of nepalHolidays2081) {
      await sequelize.query(
        `INSERT INTO events (
          title, title_np, category, start_date, start_date_bs,
          is_holiday, is_nepal_government_holiday,
          government_holiday_name, government_holiday_name_np,
          color, status, target_audience,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            holiday.title,
            holiday.titleNp,
            holiday.category,
            holiday.startDate,
            holiday.startDateBS,
            holiday.isHoliday,
            holiday.isNepalGovernmentHoliday,
            holiday.governmentHolidayName,
            holiday.governmentHolidayNameNp,
            holiday.color,
            holiday.status,
            'all',
          ],
        }
      );
    }

    console.log(`Successfully seeded ${nepalHolidays2081.length} Nepal government holidays.`);
  } catch (error) {
    console.error('Error seeding holidays:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the seed function
seedHolidays()
  .then(() => {
    console.log('Seed completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
