import { Router } from 'express';
import hostelController from './hostel.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN),
  hostelController.getDashboard
);

router.get(
  '/profile',
  authorize(UserRole.HOSTEL_WARDEN),
  hostelController.getProfile
);

router.get(
  '/residents',
  authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN),
  hostelController.getResidentStudents
);

// Room management
router.get('/rooms', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.getRooms);
router.post('/rooms', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.createRoom);
router.put('/rooms/:roomId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.updateRoom);
router.delete('/rooms/:roomId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.deleteRoom);
router.post('/rooms/:roomId/assign', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.assignRoom);
router.post('/rooms/:roomId/unassign', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.unassignRoom);

// Discipline records
router.get('/discipline', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.getDisciplineRecords);
router.post('/discipline', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.createDisciplineRecord);
router.put('/discipline/:recordId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.updateDisciplineRecord);
router.delete('/discipline/:recordId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.deleteDisciplineRecord);

// Visitor management
router.get('/visitors', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.getVisitors);
router.post('/visitors', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.registerVisitor);
router.put('/visitors/:visitorId/checkout', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.checkoutVisitor);
router.delete('/visitors/:visitorId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.deleteVisitor);

// Leave management
router.get('/leaves', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.getLeaveRequests);
router.post('/leaves', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.createLeaveRequest);
router.put('/leaves/:leaveId/process', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.processLeaveRequest);
router.delete('/leaves/:leaveId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.deleteLeaveRequest);

// Incident management
router.get('/incidents', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.getIncidents);
router.post('/incidents', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.createIncident);
router.put('/incidents/:incidentId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.updateIncident);
router.delete('/incidents/:incidentId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.deleteIncident);

// Mess management
router.get('/mess-menu', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.getMessMenu);
router.post('/mess-menu', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.createMessMenu);
router.put('/mess-menu/:menuId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.updateMessMenu);
router.delete('/mess-menu/:menuId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.deleteMessMenu);
router.get('/meal-attendance', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.getMealAttendance);
router.post('/meal-attendance', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.markMealAttendance);
router.delete('/meal-attendance/:recordId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.deleteMealAttendance);

// Inventory management
router.get('/inventory', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.getInventory);
router.post('/inventory', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.createInventoryItem);
router.put('/inventory/:itemId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.updateInventoryItem);
router.delete('/inventory/:itemId', authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN), hostelController.deleteInventoryItem);

export default router;
