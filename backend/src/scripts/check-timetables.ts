import { sequelize } from '../config/database';
import { Timetable, Period } from '../models/Timetable.model';

async function checkTimetables() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Get all timetables
    const timetables = await Timetable.findAll({
      order: [['timetableId', 'ASC']]
    });

    console.log('\n=== All Timetables ===');
    timetables.forEach((t: any) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`ID: ${t.timetableId}, Class: ${t.classId}, Year: ${t.academicYearId}, Day: ${dayNames[t.dayOfWeek]} (${t.dayOfWeek})`);
    });

    // Get all periods
    const periods = await Period.findAll({
      order: [['timetableId', 'ASC'], ['periodNumber', 'ASC']]
    });

    console.log('\n=== All Periods ===');
    periods.forEach((p: any) => {
      console.log(`Period ${p.periodNumber} - Timetable ID: ${p.timetableId}, Time: ${p.startTime}-${p.endTime}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTimetables();
