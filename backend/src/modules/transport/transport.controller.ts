import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User, { UserRole } from '@models/User.model';
import Student from '@models/Student.model';
import { logger } from '@utils/logger';

// In-memory stores for transport data
const transportRoutes: Map<number, any> = new Map();
const vehicles: Map<number, any> = new Map();
const pickupPoints: Map<number, any> = new Map();
const transportAttendance: Map<string, any> = new Map(); // date_studentId -> record
const drivers: Map<number, any> = new Map();
const maintenanceRecords: Map<number, any> = new Map();
let nextRouteId = 1;
let nextVehicleId = 1;
let nextPickupId = 1;
let nextDriverId = 1;
let nextMaintenanceId = 1;

class TransportController {
  async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const [totalStudents, activeStudents] = await Promise.all([
        Student.count(),
        Student.count({ where: { status: 'active' } })
      ]);

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalStudents,
            activeStudents,
            role: UserRole.TRANSPORT_MANAGER
          },
          quickLinks: [
            { label: 'Student List', path: '/students' },
            { label: 'Communication', path: '/communication/messages' },
            { label: 'Calendar', path: '/calendar' },
            { label: 'Documents', path: '/documents' }
          ]
        }
      });
    } catch (error: any) {
      logger.error('Transport dashboard error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'TRANSPORT_DASHBOARD_ERROR', message: error.message || 'Failed to load dashboard' }
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'phoneNumber', 'role', 'status', 'createdAt']
      });

      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      logger.error('Transport profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PROFILE_ERROR', message: error.message || 'Failed to load profile' }
      });
    }
  }

  async getStudentTransportList(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = { status: 'active' };
      if (search) {
        whereClause[Op.or] = [
          { firstNameEn: { [Op.like]: `%${search}%` } },
          { lastNameEn: { [Op.like]: `%${search}%` } },
          { studentCode: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Student.findAndCountAll({
        where: whereClause,
        attributes: ['studentId', 'firstNameEn', 'lastNameEn', 'studentCode', 'addressEn', 'fatherPhone', 'fatherName'],
        limit: Number(limit),
        offset,
        order: [['firstNameEn', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: {
          students: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error: any) {
      logger.error('Transport student list error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'STUDENT_LIST_ERROR', message: error.message || 'Failed to load student list' }
      });
    }
  }

  // ─────────────────── ROUTE MANAGEMENT ───────────────────

  async getRoutes(_req: Request, res: Response): Promise<void> {
    try {
      const routes = Array.from(transportRoutes.values());
      res.status(200).json({ success: true, data: { routes, total: routes.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ROUTE_LIST_ERROR', message: error.message } });
    }
  }

  async createRoute(req: Request, res: Response): Promise<void> {
    try {
      const { routeName, origin, destination, stops, vehicleId, driverName, driverPhone, departureTime, arrivalTime } = req.body;
      if (!routeName || !origin || !destination) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'routeName, origin, and destination are required' } });
        return;
      }
      const route = { id: nextRouteId++, routeName, origin, destination, stops: stops ?? [], vehicleId: vehicleId ?? null, driverName: driverName ?? '', driverPhone: driverPhone ?? '', departureTime: departureTime ?? '', arrivalTime: arrivalTime ?? '', status: 'active', studentCount: 0, createdAt: new Date().toISOString() };
      transportRoutes.set(route.id, route);
      res.status(201).json({ success: true, data: route });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ROUTE_CREATE_ERROR', message: error.message } });
    }
  }

  async updateRoute(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.routeId);
      const route = transportRoutes.get(id);
      if (!route) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }); return; }
      const updated = { ...route, ...req.body, id };
      transportRoutes.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ROUTE_UPDATE_ERROR', message: error.message } });
    }
  }

  async deleteRoute(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.routeId);
      if (!transportRoutes.has(id)) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }); return; }
      transportRoutes.delete(id);
      res.status(200).json({ success: true, message: 'Route deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ROUTE_DELETE_ERROR', message: error.message } });
    }
  }

  // ─────────────────── VEHICLE MANAGEMENT ───────────────────

  async getVehicles(_req: Request, res: Response): Promise<void> {
    try {
      const vlist = Array.from(vehicles.values());
      res.status(200).json({ success: true, data: { vehicles: vlist, total: vlist.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'VEHICLE_LIST_ERROR', message: error.message } });
    }
  }

  async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleNumber, type, capacity, driverName, driverPhone, insuranceExpiry, registrationExpiry } = req.body;
      if (!vehicleNumber || !type) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'vehicleNumber and type are required' } });
        return;
      }
      const vehicle = { id: nextVehicleId++, vehicleNumber, type, capacity: capacity ?? 40, driverName: driverName ?? '', driverPhone: driverPhone ?? '', insuranceExpiry: insuranceExpiry ?? null, registrationExpiry: registrationExpiry ?? null, status: 'active', createdAt: new Date().toISOString() };
      vehicles.set(vehicle.id, vehicle);
      res.status(201).json({ success: true, data: vehicle });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'VEHICLE_CREATE_ERROR', message: error.message } });
    }
  }

  async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.vehicleId);
      const vehicle = vehicles.get(id);
      if (!vehicle) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } }); return; }
      const updated = { ...vehicle, ...req.body, id };
      vehicles.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'VEHICLE_UPDATE_ERROR', message: error.message } });
    }
  }

  // ─────────────────── PICKUP POINTS ───────────────────

  async getPickupPoints(_req: Request, res: Response): Promise<void> {
    try {
      const points = Array.from(pickupPoints.values());
      res.status(200).json({ success: true, data: { pickupPoints: points, total: points.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'PICKUP_LIST_ERROR', message: error.message } });
    }
  }

  async createPickupPoint(req: Request, res: Response): Promise<void> {
    try {
      const { name, address, latitude, longitude, routeId, estimatedTime } = req.body;
      if (!name || !address) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name and address are required' } });
        return;
      }
      const point = { id: nextPickupId++, name, address, latitude: latitude ?? null, longitude: longitude ?? null, routeId: routeId ?? null, estimatedTime: estimatedTime ?? '', status: 'active', createdAt: new Date().toISOString() };
      pickupPoints.set(point.id, point);
      res.status(201).json({ success: true, data: point });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'PICKUP_CREATE_ERROR', message: error.message } });
    }
  }

  // ─────────────────── TRANSPORT ATTENDANCE ───────────────────

  async markTransportAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { date, routeId, records } = req.body; // records: [{studentId, status}]
      if (!date || !Array.isArray(records)) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'date and records array are required' } });
        return;
      }
      const saved: any[] = [];
      for (const r of records) {
        const key = `${date}_${r.studentId}`;
        const entry = { date, routeId: routeId ?? null, studentId: r.studentId, status: r.status ?? 'present', markedBy: req.user?.userId, markedAt: new Date().toISOString() };
        transportAttendance.set(key, entry);
        saved.push(entry);
      }
      res.status(200).json({ success: true, data: { marked: saved.length, records: saved } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ATTENDANCE_MARK_ERROR', message: error.message } });
    }
  }

  async getTransportAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { date, routeId } = req.query;
      let records = Array.from(transportAttendance.values());
      if (date) records = records.filter(r => r.date === String(date));
      if (routeId) records = records.filter(r => String(r.routeId) === String(routeId));
      res.status(200).json({ success: true, data: { records, total: records.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ATTENDANCE_GET_ERROR', message: error.message } });
    }
  }

  // ─────────────────── DRIVER MANAGEMENT ───────────────────

  async getDrivers(_req: Request, res: Response): Promise<void> {
    try {
      const driverList = Array.from(drivers.values());
      res.status(200).json({ success: true, data: { drivers: driverList, total: driverList.length } });
    } catch (error: any) {
      logger.error('Get drivers error:', error);
      res.status(500).json({ success: false, error: { code: 'DRIVER_LIST_ERROR', message: error.message } });
    }
  }

  async createDriver(req: Request, res: Response): Promise<void> {
    try {
      const { name, licenseNumber, licenseExpiry, phone, address, assignedVehicleId, status } = req.body;
      if (!name || !licenseNumber) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name and licenseNumber are required' } });
        return;
      }
      const driver = { id: nextDriverId++, name, licenseNumber, licenseExpiry: licenseExpiry ?? null, phone: phone ?? '', address: address ?? '', assignedVehicleId: assignedVehicleId ?? null, status: status ?? 'active', createdAt: new Date().toISOString() };
      drivers.set(driver.id, driver);
      res.status(201).json({ success: true, data: driver });
    } catch (error: any) {
      logger.error('Create driver error:', error);
      res.status(500).json({ success: false, error: { code: 'DRIVER_CREATE_ERROR', message: error.message } });
    }
  }

  async updateDriver(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.driverId);
      const driver = drivers.get(id);
      if (!driver) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } }); return; }
      const updated = { ...driver, ...req.body, id };
      drivers.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Update driver error:', error);
      res.status(500).json({ success: false, error: { code: 'DRIVER_UPDATE_ERROR', message: error.message } });
    }
  }

  async deleteDriver(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.driverId);
      if (!drivers.has(id)) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } }); return; }
      drivers.delete(id);
      res.status(200).json({ success: true, message: 'Driver deleted' });
    } catch (error: any) {
      logger.error('Delete driver error:', error);
      res.status(500).json({ success: false, error: { code: 'DRIVER_DELETE_ERROR', message: error.message } });
    }
  }

  // ─────────────────── MAINTENANCE MANAGEMENT ───────────────────

  async getMaintenanceRecords(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.query;
      let records = Array.from(maintenanceRecords.values());
      if (vehicleId) records = records.filter(r => String(r.vehicleId) === String(vehicleId));
      res.status(200).json({ success: true, data: { records, total: records.length } });
    } catch (error: any) {
      logger.error('Get maintenance records error:', error);
      res.status(500).json({ success: false, error: { code: 'MAINTENANCE_LIST_ERROR', message: error.message } });
    }
  }

  async createMaintenanceRecord(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId, type, description, cost, date, nextDueDate, status } = req.body;
      if (!vehicleId || !type) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'vehicleId and type are required' } });
        return;
      }
      const record = { id: nextMaintenanceId++, vehicleId, type, description: description ?? '', cost: cost ?? 0, date: date ?? new Date().toISOString(), nextDueDate: nextDueDate ?? null, status: status ?? 'scheduled', createdBy: req.user?.userId, createdAt: new Date().toISOString() };
      maintenanceRecords.set(record.id, record);
      res.status(201).json({ success: true, data: record });
    } catch (error: any) {
      logger.error('Create maintenance record error:', error);
      res.status(500).json({ success: false, error: { code: 'MAINTENANCE_CREATE_ERROR', message: error.message } });
    }
  }

  async updateMaintenanceRecord(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.recordId);
      const record = maintenanceRecords.get(id);
      if (!record) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } }); return; }
      const updated = { ...record, ...req.body, id };
      maintenanceRecords.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Update maintenance record error:', error);
      res.status(500).json({ success: false, error: { code: 'MAINTENANCE_UPDATE_ERROR', message: error.message } });
    }
  }
}

export default new TransportController();
