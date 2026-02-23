import 'dotenv/config';
import sequelize from '../config/database';
import { logger } from '../utils/logger';

async function seedClassesAndSubjects(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Create academic year
    await sequelize.query(`
      INSERT IGNORE INTO academic_years (academic_year_id, name, start_date_bs, end_date_bs, start_date_ad, end_date_ad, is_current, created_at, updated_at)
      VALUES (1, '2081-2082', '2081-01-01', '2081-12-30', '2024-04-14', '2025-04-13', 1, NOW(), NOW())
    `);

    // Create classes (grade_level + section combinations)
    await sequelize.query(`
      INSERT IGNORE INTO classes (class_id, academic_year_id, grade_level, section, shift, capacity, current_strength, created_at, updated_at)
      VALUES 
        (1, 1, 1, 'A', 'morning', 40, 0, NOW(), NOW()),
        (2, 1, 2, 'A', 'morning', 40, 0, NOW(), NOW()),
        (3, 1, 3, 'A', 'morning', 40, 0, NOW(), NOW()),
        (4, 1, 4, 'A', 'morning', 40, 0, NOW(), NOW()),
        (5, 1, 5, 'A', 'morning', 40, 0, NOW(), NOW()),
        (6, 1, 6, 'A', 'morning', 40, 0, NOW(), NOW()),
        (7, 1, 7, 'A', 'morning', 40, 0, NOW(), NOW()),
        (8, 1, 8, 'A', 'morning', 40, 0, NOW(), NOW()),
        (9, 1, 9, 'A', 'morning', 40, 0, NOW(), NOW()),
        (10, 1, 10, 'A', 'morning', 40, 0, NOW(), NOW())
    `);

    // Create subjects
    await sequelize.query(`
      INSERT IGNORE INTO subjects (subject_id, code, name_en, name_np, type, credit_hours, theory_marks, practical_marks, pass_marks, full_marks, applicable_classes, created_at, updated_at)
      VALUES 
        (1, 'MATH', 'Mathematics', 'गणित', 'compulsory', 100, 75, 25, 35, 100, '[1,2,3,4,5,6,7,8,9,10]', NOW(), NOW()),
        (2, 'SCI', 'Science', 'विज्ञान', 'compulsory', 100, 75, 25, 35, 100, '[1,2,3,4,5,6,7,8,9,10]', NOW(), NOW()),
        (3, 'ENG', 'English', 'अंग्रेजी', 'compulsory', 100, 75, 25, 35, 100, '[1,2,3,4,5,6,7,8,9,10]', NOW(), NOW()),
        (4, 'NEP', 'Nepali', 'नेपाली', 'compulsory', 100, 75, 25, 35, 100, '[1,2,3,4,5,6,7,8,9,10]', NOW(), NOW()),
        (5, 'SOC', 'Social Studies', 'सामाजिक अध्ययन', 'compulsory', 100, 75, 25, 35, 100, '[1,2,3,4,5,6,7,8,9,10]', NOW(), NOW()),
        (6, 'CS', 'Computer Science', 'कम्प्युटर विज्ञान', 'optional', 100, 75, 25, 35, 100, '[6,7,8,9,10]', NOW(), NOW()),
        (7, 'PHY', 'Physics', 'भौतिक विज्ञान', 'compulsory', 100, 75, 25, 35, 100, '[9,10]', NOW(), NOW()),
        (8, 'CHEM', 'Chemistry', 'रसायन विज्ञान', 'compulsory', 100, 75, 25, 35, 100, '[9,10]', NOW(), NOW()),
        (9, 'BIO', 'Biology', 'जीवविज्ञान', 'compulsory', 100, 75, 25, 35, 100, '[9,10]', NOW(), NOW()),
        (10, 'ECO', 'Economics', 'अर्थशास्त्र', 'optional', 100, 75, 25, 35, 100, '[9,10]', NOW(), NOW())
    `);

    logger.info('✅ Classes and subjects seeded successfully');
    logger.info('Created:');
    logger.info('- 10 Classes (Grade 1-10, Section A)');
    logger.info('- 10 Subjects (Math, Science, English, etc.)');
    logger.info('- 1 Academic Year (2081-2082)');

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding classes and subjects:', error);
    process.exit(1);
  }
}

seedClassesAndSubjects();
