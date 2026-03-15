/**
 * Model Associations
 * 
 * This file sets up all Sequelize model associations to avoid circular dependency issues.
 * Import this file after all models are loaded to establish relationships.
 */

import Exam from './Exam.model';
import ExamSchedule from './ExamSchedule.model';
import ECA from './ECA.model';
import ECAEnrollment from './ECAEnrollment.model';
import ECAAchievement from './ECAAchievement.model';
import Message from './Message.model';
import Conversation from './Conversation.model';
import User from './User.model';
import Student from './Student.model';
import StudentCV from './StudentCV.model';
import Event from './Event.model';
import Class from './Class.model';
import Invoice from './Invoice.model';
import Payment from './Payment.model';
import Grade from './Grade.model';
import { Subject, ClassSubject } from './Subject.model';
import Book from './Book.model';
import Circulation from './Circulation.model';
import Sport from './Sport.model';
import SportsEnrollment from './SportsEnrollment.model';
import Staff from './Staff.model';
import StaffAssignment from './StaffAssignment.model';
import StaffAttendance from './StaffAttendance.model';
import LeaveApplication from './LeaveApplication.model';
import Assignment from './Assignment.model';
import AssignmentSubmission from './AssignmentSubmission.model';
import LessonPlan from './LessonPlan.model';
import SyllabusProgress from './SyllabusProgress.model';
import HostelRoom from './HostelRoom.model';
import HostelResident from './HostelResident.model';
import HostelIncident from './HostelIncident.model';
import HostelVisitor from './HostelVisitor.model';
import { initializeTenantIsolation } from './tenantIsolation';

/**
 * Set up Exam and ExamSchedule associations
 */
export function setupExamAssociations(): void {
  Exam.hasMany(ExamSchedule, {
    foreignKey: 'examId',
    as: 'schedules'
  });

  ExamSchedule.belongsTo(Exam, {
    foreignKey: 'examId',
    as: 'exam'
  });
}

/**
 * Set up ECA associations
 */
export function setupECAAssociations(): void {
  try {
    // Check if models are initialized
    if (!ECA || !ECAEnrollment || !Student) {
      return;
    }

    // Verify sequelize instance exists
    if (!ECA.sequelize || !ECAEnrollment.sequelize || !Student.sequelize) {
      return;
    }

    // ECA has many enrollments
    ECA.hasMany(ECAEnrollment, {
      foreignKey: 'ecaId',
      as: 'enrollments'
    });

    // ECAEnrollment belongs to ECA
    ECAEnrollment.belongsTo(ECA, {
      foreignKey: 'ecaId',
      as: 'eca'
    });

    // ECAEnrollment belongs to Student
    ECAEnrollment.belongsTo(Student, {
      foreignKey: 'studentId',
      as: 'student'
    });

    // Student has many ECA enrollments
    Student.hasMany(ECAEnrollment, {
      foreignKey: 'studentId',
      as: 'ecaEnrollments'
    });

    // Setup ECAAchievement associations if available
    if (ECAAchievement && ECAAchievement.sequelize) {
      ECA.hasMany(ECAAchievement, {
        foreignKey: 'ecaId',
        as: 'achievements'
      });

      ECAAchievement.belongsTo(ECA, {
        foreignKey: 'ecaId',
        as: 'eca'
      });
    }
  } catch (error) {
    // Silently skip if models aren't ready
    console.warn('ECA associations not set up:', error);
  }
}

/**
 * Set up Communication (Messaging) associations
 */
export function setupCommunicationAssociations(): void {
  // Check if models are initialized
  if (!Message.sequelize || !Conversation.sequelize || !User.sequelize) {
    // Models not yet initialized, skip associations
    return;
  }

  // Message belongs to Conversation
  Message.belongsTo(Conversation, {
    foreignKey: 'conversationId',
    as: 'conversation'
  });

  // Message belongs to User (sender)
  Message.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender'
  });

  // Message belongs to User (recipient)
  Message.belongsTo(User, {
    foreignKey: 'recipientId',
    as: 'recipient'
  });

  // Conversation has many Messages
  Conversation.hasMany(Message, {
    foreignKey: 'conversationId',
    as: 'messages'
  });

  // Conversation belongs to User (participant1)
  Conversation.belongsTo(User, {
    foreignKey: 'participant1Id',
    as: 'participant1'
  });

  // Conversation belongs to User (participant2)
  Conversation.belongsTo(User, {
    foreignKey: 'participant2Id',
    as: 'participant2'
  });

  // Conversation belongs to Message (lastMessage)
  Conversation.belongsTo(Message, {
    foreignKey: 'lastMessageId',
    as: 'lastMessage'
  });
}

/**
 * Initialize all model associations
 */
export function initializeAssociations(): void {
  setupExamAssociations();
  setupECAAssociations();
  setupCommunicationAssociations();
  setupStudentCVAssociations();
  setupEventAssociations();
  setupStudentClassAssociations();
  setupStaffAssignmentAssociations();
  setupFinanceAssociations();
  setupGradeAssociations();
  setupLibraryAssociations();
  setupSportsAssociations();
  setupClassSubjectAssociations();
  setupStaffAttendanceAssociations();
  setupLeaveApplicationAssociations();
  setupAssignmentAssociations();
  setupLessonPlanAssociations();
  setupHostelAssociations();
  initializeTenantIsolation();
  // Add other association setups here as needed
}

/**
 * Set up Student CV associations
 */
export function setupStudentCVAssociations(): void {
  // Check if models are initialized
  if (!Student.sequelize || !StudentCV.sequelize) {
    return;
  }

  // Student has one StudentCV
  Student.hasOne(StudentCV, {
    foreignKey: 'studentId',
    as: 'cv'
  });

  // StudentCV belongs to Student
  StudentCV.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
  });
}

/**
 * Set up Event associations
 */
export function setupEventAssociations(): void {
  // Check if models are initialized
  if (!Event.sequelize || !User.sequelize) {
    return;
  }

  // Event belongs to User (creator)
  Event.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });

  // User has many Events
  User.hasMany(Event, {
    foreignKey: 'createdBy',
    as: 'events'
  });
}

/**
 * Set up Student-Class associations
 */
export function setupStudentClassAssociations(): void {
  // Check if models are initialized
  if (!Student.sequelize || !Class.sequelize) {
    return;
  }

  // Student belongs to Class (current class)
  Student.belongsTo(Class, {
    foreignKey: 'currentClassId',
    as: 'currentClass'
  });

  // Class has many Students
  Class.hasMany(Student, {
    foreignKey: 'currentClassId',
    as: 'students'
  });

  // Class belongs to Staff (class teacher)
  if (Staff && Staff.sequelize) {
    Class.belongsTo(Staff, {
      foreignKey: 'classTeacherId',
      as: 'classTeacher'
    });

    // Staff has many Classes as class teacher
    Staff.hasMany(Class, {
      foreignKey: 'classTeacherId',
      as: 'classesAsTeacher'
    });
  }
}

/**
 * Set up StaffAssignment-Class associations
 */
export function setupStaffAssignmentAssociations(): void {
  if (!StaffAssignment.sequelize || !Class.sequelize) {
    return;
  }

  StaffAssignment.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'class'
  });

  Class.hasMany(StaffAssignment, {
    foreignKey: 'classId',
    as: 'staffAssignments'
  });
}

/**
 * Set up Finance (Invoice, Payment) associations
 */
export function setupFinanceAssociations(): void {
  // Check if models are initialized
  if (!Invoice.sequelize || !Payment.sequelize || !Student.sequelize) {
    return;
  }

  // Invoice belongs to Student
  Invoice.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
  });

  // Student has many Invoices
  Student.hasMany(Invoice, {
    foreignKey: 'studentId',
    as: 'invoices'
  });

  // Payment belongs to Invoice
  Payment.belongsTo(Invoice, {
    foreignKey: 'invoiceId',
    as: 'invoice'
  });

  // Payment belongs to Student
  Payment.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
  });

  // Invoice has many Payments
  Invoice.hasMany(Payment, {
    foreignKey: 'invoiceId',
    as: 'payments'
  });

  // Student has many Payments
  Student.hasMany(Payment, {
    foreignKey: 'studentId',
    as: 'payments'
  });
}

/**
 * Set up Grade and Exam associations
 */
export function setupGradeAssociations(): void {
  // Check if models are initialized
  if (!Grade.sequelize || !Exam.sequelize || !Student.sequelize || !Subject.sequelize) {
    return;
  }

  // Grade belongs to Exam
  Grade.belongsTo(Exam, {
    foreignKey: 'examId',
    as: 'exam'
  });

  // Grade belongs to Student
  Grade.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
  });

  // Exam has many Grades
  Exam.hasMany(Grade, {
    foreignKey: 'examId',
    as: 'grades'
  });

  // Student has many Grades
  Student.hasMany(Grade, {
    foreignKey: 'studentId',
    as: 'grades'
  });

  // Exam belongs to Subject
  Exam.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'subject'
  });

  // Subject has many Exams
  Subject.hasMany(Exam, {
    foreignKey: 'subjectId',
    as: 'exams'
  });

  // Exam belongs to Class
  Exam.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'class'
  });

  // Class has many Exams
  Class.hasMany(Exam, {
    foreignKey: 'classId',
    as: 'exams'
  });
}

/**
 * Set up Library (Book, Circulation) associations
 */
export function setupLibraryAssociations(): void {
  try {
    // Check if models are initialized
    if (!Book || !Circulation || !Student) {
      return;
    }

    // Verify sequelize instance exists
    if (!Book.sequelize || !Circulation.sequelize || !Student.sequelize) {
      return;
    }

    // Circulation belongs to Book
    Circulation.belongsTo(Book, {
      foreignKey: 'bookId',
      as: 'book'
    });

    // Circulation belongs to Student
    Circulation.belongsTo(Student, {
      foreignKey: 'studentId',
      as: 'student'
    });

    // Book has many Circulations
    Book.hasMany(Circulation, {
      foreignKey: 'bookId',
      as: 'circulations'
    });

    // Student has many Circulations
    Student.hasMany(Circulation, {
      foreignKey: 'studentId',
      as: 'circulations'
    });
  } catch (error) {
    // Silently skip if models aren't ready
    console.warn('Library associations not set up:', error);
  }
}

/**
 * Set up Sports associations
 */
export function setupSportsAssociations(): void {
  try {
    // Check if models are initialized
    if (!Sport || !SportsEnrollment || !Student) {
      return;
    }

    // Verify sequelize instance exists
    if (!Sport.sequelize || !SportsEnrollment.sequelize || !Student.sequelize) {
      return;
    }

    // SportsEnrollment belongs to Sport
    SportsEnrollment.belongsTo(Sport, {
      foreignKey: 'sportId',
      as: 'sport'
    });

    // SportsEnrollment belongs to Student
    SportsEnrollment.belongsTo(Student, {
      foreignKey: 'studentId',
      as: 'student'
    });

    // Sport has many SportsEnrollments
    Sport.hasMany(SportsEnrollment, {
      foreignKey: 'sportId',
      as: 'enrollments'
    });

    // Student has many SportsEnrollments
    Student.hasMany(SportsEnrollment, {
      foreignKey: 'studentId',
      as: 'sportsEnrollments'
    });
  } catch (error) {
    // Silently skip if models aren't ready
    console.warn('Sports associations not set up:', error);
  }
}

/**
 * Set up ClassSubject associations
 */
export function setupClassSubjectAssociations(): void {
  try {
    if (!ClassSubject || !Subject || !Class) {
      return;
    }

    if (!ClassSubject.sequelize || !Subject.sequelize || !Class.sequelize) {
      return;
    }

    ClassSubject.belongsTo(Subject, {
      foreignKey: 'subjectId',
      as: 'subject'
    });

    Subject.hasMany(ClassSubject, {
      foreignKey: 'subjectId',
      as: 'classSubjects'
    });

    ClassSubject.belongsTo(Class, {
      foreignKey: 'classId',
      as: 'class'
    });

    Class.hasMany(ClassSubject, {
      foreignKey: 'classId',
      as: 'classSubjects'
    });

    if (Staff && Staff.sequelize) {
      ClassSubject.belongsTo(Staff, {
        foreignKey: 'teacherId',
        as: 'teacher'
      });

      Staff.hasMany(ClassSubject, {
        foreignKey: 'teacherId',
        as: 'subjectAssignments'
      });
    }
  } catch (error) {
    console.warn('ClassSubject associations not set up:', error);
  }
}

/**
 * Set up StaffAttendance associations
 */
export function setupStaffAttendanceAssociations(): void {
  try {
    if (!StaffAttendance || !Staff) {
      return;
    }

    if (!StaffAttendance.sequelize || !Staff.sequelize) {
      return;
    }

    StaffAttendance.belongsTo(Staff, {
      foreignKey: 'staffId',
      as: 'staff'
    });

    Staff.hasMany(StaffAttendance, {
      foreignKey: 'staffId',
      as: 'attendanceRecords'
    });
  } catch (error) {
    console.warn('StaffAttendance associations not set up:', error);
  }
}

/**
 * Set up LeaveApplication associations
 */
export function setupLeaveApplicationAssociations(): void {
  try {
    if (!LeaveApplication || !Student) {
      return;
    }

    if (!LeaveApplication.sequelize || !Student.sequelize) {
      return;
    }

    LeaveApplication.belongsTo(Student, {
      foreignKey: 'studentId',
      as: 'student'
    });

    Student.hasMany(LeaveApplication, {
      foreignKey: 'studentId',
      as: 'leaveApplications'
    });
  } catch (error) {
    console.warn('LeaveApplication associations not set up:', error);
  }
}

/**
 * Set up Assignment and AssignmentSubmission associations
 */
export function setupAssignmentAssociations(): void {
  try {
    if (!Assignment || !AssignmentSubmission) {
      return;
    }

    if (!Assignment.sequelize || !AssignmentSubmission.sequelize) {
      return;
    }

    Assignment.hasMany(AssignmentSubmission, {
      foreignKey: 'assignmentId',
      as: 'submissions'
    });

    AssignmentSubmission.belongsTo(Assignment, {
      foreignKey: 'assignmentId',
      as: 'assignment'
    });
  } catch (error) {
    console.warn('Assignment associations not set up:', error);
  }
}

/**
 * Set up LessonPlan and SyllabusProgress associations
 */
export function setupLessonPlanAssociations(): void {
  try {
    if (!LessonPlan || !SyllabusProgress) {
      return;
    }

    if (!LessonPlan.sequelize || !SyllabusProgress.sequelize) {
      return;
    }

    // LessonPlan has no FK relations to SyllabusProgress — both are standalone
    // but share a createdBy/teacherId -> User relationship if User is available
    if (User && User.sequelize) {
      LessonPlan.belongsTo(User, {
        foreignKey: 'createdBy',
        as: 'lessonPlanCreator'
      });

      SyllabusProgress.belongsTo(User, {
        foreignKey: 'teacherId',
        as: 'syllabusTeacher'
      });
    }
  } catch (error) {
    console.warn('LessonPlan associations not set up:', error);
  }
}

/**
 * Set up Hostel model associations
 */
export function setupHostelAssociations(): void {
  try {
    if (!HostelRoom || !HostelResident || !HostelIncident || !HostelVisitor) {
      return;
    }

    if (!HostelRoom.sequelize || !HostelResident.sequelize) {
      return;
    }

    HostelRoom.hasMany(HostelResident, {
      foreignKey: 'roomId',
      as: 'residents'
    });

    HostelResident.belongsTo(HostelRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });
  } catch (error) {
    console.warn('Hostel associations not set up:', error);
  }
}
