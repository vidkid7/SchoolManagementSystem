import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '@config/database';
import User, { UserRole } from '@models/User.model';
import Student from '@models/Student.model';
import { logger } from '@utils/logger';

type DbRow = Record<string, any>;

function iso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asNullableString(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
}

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeStops(stops: unknown): unknown[] {
  if (Array.isArray(stops)) return stops;
  if (typeof stops === 'string' && stops.trim()) {
    return stops.split(',').map((stop) => stop.trim()).filter(Boolean);
  }
  return [];
}

async function selectRows(sql: string, replacements: Record<string, unknown> = {}): Promise<DbRow[]> {
  return sequelize.query<DbRow>(sql, { replacements, type: QueryTypes.SELECT });
}

async function selectOne(sql: string, replacements: Record<string, unknown> = {}): Promise<DbRow | null> {
  const rows = await selectRows(sql, replacements);
  return rows[0] ?? null;
}

async function insertRow(sql: string, replacements: Record<string, unknown>): Promise<number> {
  const [result, metadata] = await sequelize.query(sql, { replacements });
  return Number(
    (typeof result === 'number' ? result : undefined) ??
    (result as { insertId?: number })?.insertId ??
    (typeof metadata === 'number' ? metadata : undefined) ??
    (metadata as { insertId?: number })?.insertId
  );
}

async function deleteById(tableName: string, id: number): Promise<boolean> {
  const existing = await selectOne(`SELECT id FROM ${tableName} WHERE id = :id LIMIT 1`, { id });
  if (!existing) return false;
  await sequelize.query(`DELETE FROM ${tableName} WHERE id = :id`, { replacements: { id } });
  return true;
}

function mapRoute(row: DbRow) {
  return {
    id: row.id,
    routeId: row.id,
    routeName: row.route_name,
    origin: row.origin,
    destination: row.destination,
    stops: parseJsonArray(row.stops),
    vehicleId: row.vehicle_id,
    driverName: row.driver_name ?? '',
    driverPhone: row.driver_phone ?? '',
    departureTime: row.departure_time ?? '',
    arrivalTime: row.arrival_time ?? '',
    status: row.status,
    studentCount: row.student_count,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapVehicle(row: DbRow) {
  return {
    id: row.id,
    vehicleId: row.id,
    vehicleNumber: row.vehicle_number,
    type: row.type,
    capacity: row.capacity,
    driverName: row.driver_name ?? '',
    driverPhone: row.driver_phone ?? '',
    insuranceExpiry: row.insurance_expiry,
    registrationExpiry: row.registration_expiry,
    status: row.status,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapPickupPoint(row: DbRow) {
  return {
    id: row.id,
    pickupPointId: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    routeId: row.route_id,
    estimatedTime: row.estimated_time ?? '',
    status: row.status,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapDriver(row: DbRow) {
  return {
    id: row.id,
    driverId: row.id,
    name: row.name,
    licenseNumber: row.license_number,
    licenseExpiry: row.license_expiry,
    phone: row.phone ?? '',
    address: row.address ?? '',
    assignedVehicleId: row.assigned_vehicle_id,
    status: row.status,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapMaintenanceRecord(row: DbRow) {
  return {
    id: row.id,
    recordId: row.id,
    vehicleId: row.vehicle_id,
    type: row.type,
    description: row.description ?? '',
    cost: Number(row.cost ?? 0),
    date: row.date,
    nextDueDate: row.next_due_date,
    status: row.status,
    createdBy: row.created_by,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapAttendance(row: DbRow) {
  return {
    id: row.id,
    date: row.date,
    routeId: row.route_id,
    studentId: row.student_id,
    status: row.status,
    markedBy: row.marked_by,
    markedAt: iso(row.marked_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

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
        attributes: ['user_id', 'username', 'email', 'role', 'status', 'phone_number', 'createdAt']
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

  async getRoutes(_req: Request, res: Response): Promise<void> {
    try {
      const rows = await selectRows('SELECT * FROM transport_routes ORDER BY id DESC');
      res.status(200).json({ success: true, data: { routes: rows.map(mapRoute), total: rows.length } });
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

      const id = await insertRow(
        `INSERT INTO transport_routes
          (route_name, origin, destination, stops, vehicle_id, driver_name, driver_phone, departure_time, arrival_time, status, student_count, created_by, created_at, updated_at)
         VALUES
          (:routeName, :origin, :destination, :stops, :vehicleId, :driverName, :driverPhone, :departureTime, :arrivalTime, 'active', 0, :createdBy, NOW(), NOW())`,
        {
          routeName,
          origin,
          destination,
          stops: JSON.stringify(normalizeStops(stops)),
          vehicleId: asNullableNumber(vehicleId),
          driverName: driverName ?? '',
          driverPhone: driverPhone ?? '',
          departureTime: departureTime ?? '',
          arrivalTime: arrivalTime ?? '',
          createdBy: req.user?.userId ?? null,
        }
      );

      const row = await selectOne('SELECT * FROM transport_routes WHERE id = :id', { id });
      res.status(201).json({ success: true, data: mapRoute(row as DbRow) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ROUTE_CREATE_ERROR', message: error.message } });
    }
  }

  async updateRoute(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.routeId);
      const existing = await selectOne('SELECT * FROM transport_routes WHERE id = :id', { id });
      if (!existing) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
        return;
      }

      const current = mapRoute(existing);
      const updated = { ...current, ...req.body };
      await sequelize.query(
        `UPDATE transport_routes SET
          route_name = :routeName, origin = :origin, destination = :destination, stops = :stops,
          vehicle_id = :vehicleId, driver_name = :driverName, driver_phone = :driverPhone,
          departure_time = :departureTime, arrival_time = :arrivalTime, status = :status,
          updated_at = NOW()
         WHERE id = :id`,
        {
          replacements: {
            id,
            routeName: updated.routeName,
            origin: updated.origin,
            destination: updated.destination,
            stops: JSON.stringify(normalizeStops(updated.stops)),
            vehicleId: asNullableNumber(updated.vehicleId),
            driverName: updated.driverName ?? '',
            driverPhone: updated.driverPhone ?? '',
            departureTime: updated.departureTime ?? '',
            arrivalTime: updated.arrivalTime ?? '',
            status: updated.status ?? 'active',
          }
        }
      );

      const row = await selectOne('SELECT * FROM transport_routes WHERE id = :id', { id });
      res.status(200).json({ success: true, data: mapRoute(row as DbRow) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ROUTE_UPDATE_ERROR', message: error.message } });
    }
  }

  async deleteRoute(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await deleteById('transport_routes', Number(req.params.routeId));
      if (!deleted) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
        return;
      }
      res.status(200).json({ success: true, message: 'Route deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ROUTE_DELETE_ERROR', message: error.message } });
    }
  }

  async getVehicles(_req: Request, res: Response): Promise<void> {
    try {
      const rows = await selectRows('SELECT * FROM transport_vehicles ORDER BY id DESC');
      res.status(200).json({ success: true, data: { vehicles: rows.map(mapVehicle), total: rows.length } });
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

      const id = await insertRow(
        `INSERT INTO transport_vehicles
          (vehicle_number, type, capacity, driver_name, driver_phone, insurance_expiry, registration_expiry, status, created_by, created_at, updated_at)
         VALUES
          (:vehicleNumber, :type, :capacity, :driverName, :driverPhone, :insuranceExpiry, :registrationExpiry, 'active', :createdBy, NOW(), NOW())`,
        {
          vehicleNumber,
          type,
          capacity: asNumber(capacity, 40),
          driverName: driverName ?? '',
          driverPhone: driverPhone ?? '',
          insuranceExpiry: asNullableString(insuranceExpiry),
          registrationExpiry: asNullableString(registrationExpiry),
          createdBy: req.user?.userId ?? null,
        }
      );

      const row = await selectOne('SELECT * FROM transport_vehicles WHERE id = :id', { id });
      res.status(201).json({ success: true, data: mapVehicle(row as DbRow) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'VEHICLE_CREATE_ERROR', message: error.message } });
    }
  }

  async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.vehicleId);
      const existing = await selectOne('SELECT * FROM transport_vehicles WHERE id = :id', { id });
      if (!existing) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
        return;
      }

      const updated = { ...mapVehicle(existing), ...req.body };
      await sequelize.query(
        `UPDATE transport_vehicles SET
          vehicle_number = :vehicleNumber, type = :type, capacity = :capacity,
          driver_name = :driverName, driver_phone = :driverPhone,
          insurance_expiry = :insuranceExpiry, registration_expiry = :registrationExpiry,
          status = :status, updated_at = NOW()
         WHERE id = :id`,
        {
          replacements: {
            id,
            vehicleNumber: updated.vehicleNumber,
            type: updated.type,
            capacity: asNumber(updated.capacity, 40),
            driverName: updated.driverName ?? '',
            driverPhone: updated.driverPhone ?? '',
            insuranceExpiry: asNullableString(updated.insuranceExpiry),
            registrationExpiry: asNullableString(updated.registrationExpiry),
            status: updated.status ?? 'active',
          }
        }
      );

      const row = await selectOne('SELECT * FROM transport_vehicles WHERE id = :id', { id });
      res.status(200).json({ success: true, data: mapVehicle(row as DbRow) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'VEHICLE_UPDATE_ERROR', message: error.message } });
    }
  }

  async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await deleteById('transport_vehicles', Number(req.params.vehicleId));
      if (!deleted) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
        return;
      }
      res.status(200).json({ success: true, message: 'Vehicle deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'VEHICLE_DELETE_ERROR', message: error.message } });
    }
  }

  async getPickupPoints(_req: Request, res: Response): Promise<void> {
    try {
      const rows = await selectRows('SELECT * FROM transport_pickup_points ORDER BY id DESC');
      res.status(200).json({ success: true, data: { pickupPoints: rows.map(mapPickupPoint), total: rows.length } });
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

      const id = await insertRow(
        `INSERT INTO transport_pickup_points
          (name, address, latitude, longitude, route_id, estimated_time, status, created_by, created_at, updated_at)
         VALUES
          (:name, :address, :latitude, :longitude, :routeId, :estimatedTime, 'active', :createdBy, NOW(), NOW())`,
        {
          name,
          address,
          latitude: asNullableNumber(latitude),
          longitude: asNullableNumber(longitude),
          routeId: asNullableNumber(routeId),
          estimatedTime: estimatedTime ?? '',
          createdBy: req.user?.userId ?? null,
        }
      );

      const row = await selectOne('SELECT * FROM transport_pickup_points WHERE id = :id', { id });
      res.status(201).json({ success: true, data: mapPickupPoint(row as DbRow) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'PICKUP_CREATE_ERROR', message: error.message } });
    }
  }

  async deletePickupPoint(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await deleteById('transport_pickup_points', Number(req.params.pickupPointId));
      if (!deleted) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pickup point not found' } });
        return;
      }
      res.status(200).json({ success: true, message: 'Pickup point deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'PICKUP_DELETE_ERROR', message: error.message } });
    }
  }

  async markTransportAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { date, routeId, records } = req.body;
      if (!date || !Array.isArray(records)) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'date and records array are required' } });
        return;
      }

      const saved = [];
      for (const record of records) {
        await sequelize.query(
          `INSERT INTO transport_attendance
            (date, route_id, student_id, status, marked_by, marked_at, created_at, updated_at)
           VALUES
            (:date, :routeId, :studentId, :status, :markedBy, NOW(), NOW(), NOW())
           ON DUPLICATE KEY UPDATE
            route_id = VALUES(route_id), status = VALUES(status), marked_by = VALUES(marked_by),
            marked_at = NOW(), updated_at = NOW()`,
          {
            replacements: {
              date,
              routeId: asNullableNumber(routeId),
              studentId: asNumber(record.studentId),
              status: record.status ?? 'present',
              markedBy: req.user?.userId ?? null,
            }
          }
        );
        saved.push({ date, routeId: routeId ?? null, studentId: record.studentId, status: record.status ?? 'present', markedBy: req.user?.userId });
      }
      res.status(200).json({ success: true, data: { marked: saved.length, records: saved } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ATTENDANCE_MARK_ERROR', message: error.message } });
    }
  }

  async getTransportAttendance(req: Request, res: Response): Promise<void> {
    try {
      const conditions = [];
      const replacements: Record<string, unknown> = {};
      if (req.query.date) {
        conditions.push('date = :date');
        replacements.date = String(req.query.date);
      }
      if (req.query.routeId) {
        conditions.push('route_id = :routeId');
        replacements.routeId = Number(req.query.routeId);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = await selectRows(`SELECT * FROM transport_attendance ${where} ORDER BY date DESC, id DESC`, replacements);
      res.status(200).json({ success: true, data: { records: rows.map(mapAttendance), total: rows.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'ATTENDANCE_GET_ERROR', message: error.message } });
    }
  }

  async getDrivers(_req: Request, res: Response): Promise<void> {
    try {
      const rows = await selectRows('SELECT * FROM transport_drivers ORDER BY id DESC');
      res.status(200).json({ success: true, data: { drivers: rows.map(mapDriver), total: rows.length } });
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

      const id = await insertRow(
        `INSERT INTO transport_drivers
          (name, license_number, license_expiry, phone, address, assigned_vehicle_id, status, created_by, created_at, updated_at)
         VALUES
          (:name, :licenseNumber, :licenseExpiry, :phone, :address, :assignedVehicleId, :status, :createdBy, NOW(), NOW())`,
        {
          name,
          licenseNumber,
          licenseExpiry: asNullableString(licenseExpiry),
          phone: phone ?? '',
          address: address ?? '',
          assignedVehicleId: asNullableNumber(assignedVehicleId),
          status: status ?? 'active',
          createdBy: req.user?.userId ?? null,
        }
      );

      const row = await selectOne('SELECT * FROM transport_drivers WHERE id = :id', { id });
      res.status(201).json({ success: true, data: mapDriver(row as DbRow) });
    } catch (error: any) {
      logger.error('Create driver error:', error);
      res.status(500).json({ success: false, error: { code: 'DRIVER_CREATE_ERROR', message: error.message } });
    }
  }

  async updateDriver(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.driverId);
      const existing = await selectOne('SELECT * FROM transport_drivers WHERE id = :id', { id });
      if (!existing) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
        return;
      }

      const updated = { ...mapDriver(existing), ...req.body };
      await sequelize.query(
        `UPDATE transport_drivers SET
          name = :name, license_number = :licenseNumber, license_expiry = :licenseExpiry,
          phone = :phone, address = :address, assigned_vehicle_id = :assignedVehicleId,
          status = :status, updated_at = NOW()
         WHERE id = :id`,
        {
          replacements: {
            id,
            name: updated.name,
            licenseNumber: updated.licenseNumber,
            licenseExpiry: asNullableString(updated.licenseExpiry),
            phone: updated.phone ?? '',
            address: updated.address ?? '',
            assignedVehicleId: asNullableNumber(updated.assignedVehicleId),
            status: updated.status ?? 'active',
          }
        }
      );

      const row = await selectOne('SELECT * FROM transport_drivers WHERE id = :id', { id });
      res.status(200).json({ success: true, data: mapDriver(row as DbRow) });
    } catch (error: any) {
      logger.error('Update driver error:', error);
      res.status(500).json({ success: false, error: { code: 'DRIVER_UPDATE_ERROR', message: error.message } });
    }
  }

  async deleteDriver(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await deleteById('transport_drivers', Number(req.params.driverId));
      if (!deleted) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
        return;
      }
      res.status(200).json({ success: true, message: 'Driver deleted' });
    } catch (error: any) {
      logger.error('Delete driver error:', error);
      res.status(500).json({ success: false, error: { code: 'DRIVER_DELETE_ERROR', message: error.message } });
    }
  }

  async getMaintenanceRecords(req: Request, res: Response): Promise<void> {
    try {
      const replacements: Record<string, unknown> = {};
      const where = req.query.vehicleId ? 'WHERE vehicle_id = :vehicleId' : '';
      if (req.query.vehicleId) replacements.vehicleId = Number(req.query.vehicleId);
      const rows = await selectRows(`SELECT * FROM transport_maintenance_records ${where} ORDER BY id DESC`, replacements);
      res.status(200).json({ success: true, data: { records: rows.map(mapMaintenanceRecord), total: rows.length } });
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

      const id = await insertRow(
        `INSERT INTO transport_maintenance_records
          (vehicle_id, type, description, cost, date, next_due_date, status, created_by, created_at, updated_at)
         VALUES
          (:vehicleId, :type, :description, :cost, :date, :nextDueDate, :status, :createdBy, NOW(), NOW())`,
        {
          vehicleId: asNumber(vehicleId),
          type,
          description: description ?? '',
          cost: asNumber(cost, 0),
          date: asNullableString(date) ?? new Date().toISOString().slice(0, 10),
          nextDueDate: asNullableString(nextDueDate),
          status: status ?? 'scheduled',
          createdBy: req.user?.userId ?? null,
        }
      );

      const row = await selectOne('SELECT * FROM transport_maintenance_records WHERE id = :id', { id });
      res.status(201).json({ success: true, data: mapMaintenanceRecord(row as DbRow) });
    } catch (error: any) {
      logger.error('Create maintenance record error:', error);
      res.status(500).json({ success: false, error: { code: 'MAINTENANCE_CREATE_ERROR', message: error.message } });
    }
  }

  async updateMaintenanceRecord(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.recordId);
      const existing = await selectOne('SELECT * FROM transport_maintenance_records WHERE id = :id', { id });
      if (!existing) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } });
        return;
      }

      const updated = { ...mapMaintenanceRecord(existing), ...req.body };
      await sequelize.query(
        `UPDATE transport_maintenance_records SET
          vehicle_id = :vehicleId, type = :type, description = :description, cost = :cost,
          date = :date, next_due_date = :nextDueDate, status = :status, updated_at = NOW()
         WHERE id = :id`,
        {
          replacements: {
            id,
            vehicleId: asNumber(updated.vehicleId),
            type: updated.type,
            description: updated.description ?? '',
            cost: asNumber(updated.cost, 0),
            date: asNullableString(updated.date),
            nextDueDate: asNullableString(updated.nextDueDate),
            status: updated.status ?? 'scheduled',
          }
        }
      );

      const row = await selectOne('SELECT * FROM transport_maintenance_records WHERE id = :id', { id });
      res.status(200).json({ success: true, data: mapMaintenanceRecord(row as DbRow) });
    } catch (error: any) {
      logger.error('Update maintenance record error:', error);
      res.status(500).json({ success: false, error: { code: 'MAINTENANCE_UPDATE_ERROR', message: error.message } });
    }
  }

  async deleteMaintenanceRecord(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await deleteById('transport_maintenance_records', Number(req.params.recordId));
      if (!deleted) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } });
        return;
      }
      res.status(200).json({ success: true, message: 'Maintenance record deleted' });
    } catch (error: any) {
      logger.error('Delete maintenance record error:', error);
      res.status(500).json({ success: false, error: { code: 'MAINTENANCE_DELETE_ERROR', message: error.message } });
    }
  }
}

export default new TransportController();
