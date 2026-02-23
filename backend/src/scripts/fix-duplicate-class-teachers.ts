/* eslint-disable no-console */
/* eslint-disable max-lines-per-function */
import 'dotenv/config';
import StaffAssignment from '../models/StaffAssignment.model';
import Staff from '../models/Staff.model';
import { AssignmentType } from '../models/StaffAssignment.model';

/**
 * Fix Duplicate Class Teacher Assignments
 * 
 * This script finds teachers who are assigned as class teachers
 * for multiple classes and keeps only the most recent assignment,
 * deactivating the others.
 */

async function fixDuplicateClassTeachers(): Promise<void> {
  try {
    console.log('🔍 Searching for duplicate class teacher assignments...\n');

    // Find all active class teacher assignments
    const allClassTeachers = await StaffAssignment.findAll({
      where: {
        assignmentType: AssignmentType.CLASS_TEACHER,
        isActive: true
      },
      order: [['staffId', 'ASC'], ['startDate', 'DESC']]
    });

    // Group by staff ID
    const staffMap = new Map<number, StaffAssignment[]>();
    
    for (const assignment of allClassTeachers) {
      const assignments = staffMap.get(assignment.staffId) || [];
      assignments.push(assignment);
      staffMap.set(assignment.staffId, assignments);
    }

    // Find staff with multiple class teacher assignments
    const duplicates = Array.from(staffMap.entries()).filter(([, assignments]) => assignments.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate class teacher assignments found!');
      console.log('   All teachers have at most one class teacher assignment.');
      process.exit(0);
    }

    console.log(`⚠️  Found ${duplicates.length} teacher(s) with multiple class teacher assignments:\n`);

    let totalFixed = 0;

    // Fix each duplicate
    for (const [staffId, assignments] of duplicates) {
      const staff = await Staff.findByPk(staffId);
      const staffName = staff ? `${staff.firstNameEn} ${staff.lastNameEn}` : `Staff ID ${staffId}`;
      
      console.log(`📋 ${staffName} (Staff ID: ${staffId})`);
      console.log(`   Has ${assignments.length} active class teacher assignments:`);
      
      assignments.forEach((a, index) => {
        console.log(`   ${index + 1}. Class ID: ${a.classId}, Section: ${a.section}, Started: ${a.startDate}`);
      });

      // Keep the most recent (first in sorted array), deactivate others
      console.log(`   ✅ Keeping: Assignment ${assignments[0].assignmentId} (most recent)`);
      
      for (let i = 1; i < assignments.length; i++) {
        await assignments[i].update({
          isActive: false,
          endDate: new Date()
        });
        console.log(`   ❌ Deactivated: Assignment ${assignments[i].assignmentId}`);
        totalFixed++;
      }
      
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Cleanup complete!');
    console.log(`   Fixed ${totalFixed} duplicate assignment(s)`);
    console.log(`   ${duplicates.length} teacher(s) now have only one class teacher assignment`);
    console.log('═══════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing duplicate class teachers:', error);
    process.exit(1);
  }
}

fixDuplicateClassTeachers();
