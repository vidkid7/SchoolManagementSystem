import { Router } from 'express';
import transportController from './transport.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN),
  transportController.getDashboard
);

router.get(
  '/profile',
  authorize(UserRole.TRANSPORT_MANAGER),
  transportController.getProfile
);

router.get(
  '/students',
  authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN),
  transportController.getStudentTransportList
);

// Route management
router.get('/routes', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.getRoutes);
router.post('/routes', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.createRoute);
router.put('/routes/:routeId', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.updateRoute);
router.delete('/routes/:routeId', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.deleteRoute);

// Vehicle management
router.get('/vehicles', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.getVehicles);
router.post('/vehicles', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.createVehicle);
router.put('/vehicles/:vehicleId', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.updateVehicle);

// Pickup points
router.get('/pickup-points', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.getPickupPoints);
router.post('/pickup-points', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.createPickupPoint);

// Attendance
router.post('/attendance', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.markTransportAttendance);
router.get('/attendance', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.getTransportAttendance);

// Driver management
router.get('/drivers', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.getDrivers);
router.post('/drivers', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.createDriver);
router.put('/drivers/:driverId', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.updateDriver);
router.delete('/drivers/:driverId', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.deleteDriver);

// Maintenance management
router.get('/maintenance', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.getMaintenanceRecords);
router.post('/maintenance', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.createMaintenanceRecord);
router.put('/maintenance/:recordId', authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN), transportController.updateMaintenanceRecord);

export default router;
