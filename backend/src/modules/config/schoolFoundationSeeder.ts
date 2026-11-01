import { Transaction } from 'sequelize';
import { AcademicYear, Term } from '@models/AcademicYear.model';
import Class from '@models/Class.model';
import { ClassSubject, Subject } from '@models/Subject.model';
import { getCurrentAcademicYearInfo } from '@utils/nepaliCalendar';

const DAY_MS = 24 * 60 * 60 * 1000;

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Seed only reusable school foundations. No people, payments, sample events,
 * or demo credentials are created here.
 */
export async function seedSchoolFoundation(
  schoolConfigId: string,
  municipalityId: string,
  transaction: Transaction
): Promise<{ academicYear: string; terms: number; classes: number; subjects: number }> {
  const yearInfo = getCurrentAcademicYearInfo(new Date());
  const tenantScope = { schoolConfigId };

  const [academicYear] = await AcademicYear.findOrCreate({
    where: { name: yearInfo.name, ...tenantScope } as any,
    defaults: {
      name: yearInfo.name,
      startDateBS: yearInfo.startDateBS,
      endDateBS: yearInfo.endDateBS,
      startDateAD: dateOnly(yearInfo.startDateAD),
      endDateAD: dateOnly(yearInfo.endDateAD),
      isCurrent: true,
      municipalityId,
      schoolConfigId,
    } as any,
    transaction,
  });

  const start = new Date(dateOnly(yearInfo.startDateAD) + 'T00:00:00.000Z');
  const end = new Date(dateOnly(yearInfo.endDateAD) + 'T00:00:00.000Z');
  const yearDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1);
  const terms = [
    { name: 'First Terminal', startDay: 0, endDay: Math.floor(yearDays / 3) - 1 },
    { name: 'Second Terminal', startDay: Math.floor(yearDays / 3), endDay: Math.floor((2 * yearDays) / 3) - 1 },
    { name: 'Third Terminal', startDay: Math.floor((2 * yearDays) / 3), endDay: yearDays - 1 },
  ];

  for (const term of terms) {
    const startDate = new Date(start.getTime() + term.startDay * DAY_MS);
    const endDate = new Date(start.getTime() + term.endDay * DAY_MS);
    const examStartDate = new Date(Math.max(startDate.getTime(), endDate.getTime() - 14 * DAY_MS));
    await Term.findOrCreate({
      where: { academicYearId: academicYear.academicYearId, name: term.name, ...tenantScope } as any,
      defaults: {
        academicYearId: academicYear.academicYearId,
        name: term.name,
        startDate: dateOnly(startDate),
        endDate: dateOnly(endDate),
        examStartDate: dateOnly(examStartDate),
        examEndDate: dateOnly(endDate),
        municipalityId,
        schoolConfigId,
      } as any,
      transaction,
    });
  }

  const subjectCodePrefix = 'S' + schoolConfigId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const subjectDefinitions = [
    ['NEP', 'Nepali', 'नेपाली'],
    ['ENG', 'English', 'अंग्रेजी'],
    ['MAT', 'Mathematics', 'गणित'],
    ['SCI', 'Science', 'विज्ञान'],
    ['SOC', 'Social Studies', 'सामाजिक अध्ययन'],
    ['HPE', 'Health and Physical Education', 'स्वास्थ्य तथा शारीरिक शिक्षा'],
  ] as const;

  const subjects: Subject[] = [];
  for (const [code, nameEn, nameNp] of subjectDefinitions) {
    const subjectCode = subjectCodePrefix + '-' + code;
    const [subject] = await Subject.findOrCreate({
      where: { code: subjectCode, schoolConfigId } as any,
      defaults: {
        code: subjectCode,
        nameEn,
        nameNp,
        type: 'compulsory',
        creditHours: 4,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
        fullMarks: 100,
        applicableClasses: Array.from({ length: 12 }, (_, index) => index + 1),
        municipalityId,
        schoolConfigId,
      } as any,
      transaction,
    });
    subjects.push(subject);
  }

  for (let gradeLevel = 1; gradeLevel <= 12; gradeLevel += 1) {
    const [schoolClass] = await Class.findOrCreate({
      where: {
        academicYearId: academicYear.academicYearId,
        gradeLevel,
        section: 'A',
        shift: 'day',
        ...tenantScope,
      } as any,
      defaults: {
        academicYearId: academicYear.academicYearId,
        gradeLevel,
        section: 'A',
        shift: 'day',
        capacity: 40,
        currentStrength: 0,
        municipalityId,
        schoolConfigId,
      } as any,
      transaction,
    });

    for (const subject of subjects) {
      await ClassSubject.findOrCreate({
        where: {
          classId: schoolClass.classId,
          subjectId: subject.subjectId,
          schoolConfigId,
        } as any,
        defaults: {
          classId: schoolClass.classId,
          subjectId: subject.subjectId,
          municipalityId,
          schoolConfigId,
        } as any,
        transaction,
      });
    }
  }

  return {
    academicYear: academicYear.name,
    terms: terms.length,
    classes: 12,
    subjects: subjects.length,
  };
}
