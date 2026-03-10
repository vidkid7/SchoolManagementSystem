import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User, { UserRole } from '@models/User.model';
import Student from '@models/Student.model';
import { logger } from '@utils/logger';

// In-memory stores for hostel data (persists during server runtime)
// In production these would be DB tables
const hostelRooms: Map<number, any> = new Map();
const roomAssignments: Map<string, any> = new Map(); // studentId -> assignment
const disciplineRecords: Map<number, any> = new Map();
const visitorLogs: Map<number, any> = new Map();
const leaveRecords: Map<number, any> = new Map();
const incidentRecords: Map<number, any> = new Map();
const messMenus: Map<number, any> = new Map();
const mealAttendance: Map<string, any> = new Map(); // `${date}_${studentId}` -> record
const inventoryItems: Map<number, any> = new Map();
let nextRoomId = 1;
let nextDisciplineId = 1;
let nextVisitorId = 1;
let nextLeaveId = 1;
let nextIncidentId = 1;
let nextMenuId = 1;
let nextInventoryId = 1;

class HostelController {
  async getDashboard(req: Request, res: Response): Promise<void> {
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
            role: UserRole.HOSTEL_WARDEN
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
      logger.error('Hostel dashboard error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'HOSTEL_DASHBOARD_ERROR', message: error.message || 'Failed to load dashboard' }
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
      logger.error('Hostel profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PROFILE_ERROR', message: error.message || 'Failed to load profile' }
      });
    }
  }

  async getResidentStudents(req: Request, res: Response): Promise<void> {
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
      logger.error('Hostel resident students error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'RESIDENT_LIST_ERROR', message: error.message || 'Failed to load resident list' }
      });
    }
  }

  // ─────────────────── ROOM MANAGEMENT ───────────────────

  async getRooms(req: Request, res: Response): Promise<void> {
    try {
      const rooms = Array.from(hostelRooms.values());
      res.status(200).json({ success: true, data: { rooms, total: rooms.length } });
    } catch (error: any) {
      logger.error('Get rooms error:', error);
      res.status(500).json({ success: false, error: { code: 'ROOM_LIST_ERROR', message: error.message } });
    }
  }

  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomNumber, floor, type, capacity, description } = req.body;
      if (!roomNumber || !type) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'roomNumber and type are required' } });
        return;
      }
      const room = { id: nextRoomId++, roomNumber, floor: floor ?? 1, type, capacity: capacity ?? 2, description: description ?? '', occupied: 0, status: 'available', createdAt: new Date().toISOString() };
      hostelRooms.set(room.id, room);
      res.status(201).json({ success: true, data: room });
    } catch (error: any) {
      logger.error('Create room error:', error);
      res.status(500).json({ success: false, error: { code: 'ROOM_CREATE_ERROR', message: error.message } });
    }
  }

  async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.roomId);
      const room = hostelRooms.get(id);
      if (!room) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } }); return; }
      const updated = { ...room, ...req.body, id };
      hostelRooms.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Update room error:', error);
      res.status(500).json({ success: false, error: { code: 'ROOM_UPDATE_ERROR', message: error.message } });
    }
  }

  async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.roomId);
      if (!hostelRooms.has(id)) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } }); return; }
      hostelRooms.delete(id);
      res.status(200).json({ success: true, message: 'Room deleted' });
    } catch (error: any) {
      logger.error('Delete room error:', error);
      res.status(500).json({ success: false, error: { code: 'ROOM_DELETE_ERROR', message: error.message } });
    }
  }

  async assignRoom(req: Request, res: Response): Promise<void> {
    try {
      const roomId = Number(req.params.roomId);
      const { studentId, checkInDate, notes } = req.body;
      const room = hostelRooms.get(roomId);
      if (!room) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } }); return; }
      if (room.occupied >= room.capacity) { res.status(409).json({ success: false, error: { code: 'ROOM_FULL', message: 'Room is at full capacity' } }); return; }
      const assignment = { roomId, studentId, checkInDate: checkInDate ?? new Date().toISOString(), notes: notes ?? '', status: 'active' };
      roomAssignments.set(String(studentId), assignment);
      room.occupied = (room.occupied || 0) + 1;
      if (room.occupied >= room.capacity) room.status = 'occupied';
      hostelRooms.set(roomId, room);
      res.status(200).json({ success: true, data: assignment });
    } catch (error: any) {
      logger.error('Assign room error:', error);
      res.status(500).json({ success: false, error: { code: 'ROOM_ASSIGN_ERROR', message: error.message } });
    }
  }

  async unassignRoom(req: Request, res: Response): Promise<void> {
    try {
      const roomId = Number(req.params.roomId);
      const { studentId, checkOutDate } = req.body;
      const room = hostelRooms.get(roomId);
      if (!room) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } }); return; }
      const key = String(studentId);
      if (!roomAssignments.has(key)) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } }); return; }
      const assignment = roomAssignments.get(key);
      assignment.status = 'checked-out';
      assignment.checkOutDate = checkOutDate ?? new Date().toISOString();
      room.occupied = Math.max(0, (room.occupied || 1) - 1);
      if (room.occupied < room.capacity) room.status = 'available';
      hostelRooms.set(roomId, room);
      res.status(200).json({ success: true, data: assignment });
    } catch (error: any) {
      logger.error('Unassign room error:', error);
      res.status(500).json({ success: false, error: { code: 'ROOM_UNASSIGN_ERROR', message: error.message } });
    }
  }

  // ─────────────────── DISCIPLINE ───────────────────

  async getDisciplineRecords(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.query;
      let records = Array.from(disciplineRecords.values());
      if (studentId) records = records.filter(r => String(r.studentId) === String(studentId));
      res.status(200).json({ success: true, data: { records, total: records.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'DISCIPLINE_LIST_ERROR', message: error.message } });
    }
  }

  async createDisciplineRecord(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, violation, description, action, severity, date } = req.body;
      if (!studentId || !violation) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId and violation are required' } }); return; }
      const record = { id: nextDisciplineId++, studentId, violation, description: description ?? '', action: action ?? 'Warning', severity: severity ?? 'minor', date: date ?? new Date().toISOString(), status: 'open', recordedBy: req.user?.userId, createdAt: new Date().toISOString() };
      disciplineRecords.set(record.id, record);
      res.status(201).json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'DISCIPLINE_CREATE_ERROR', message: error.message } });
    }
  }

  async updateDisciplineRecord(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.recordId);
      const record = disciplineRecords.get(id);
      if (!record) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } }); return; }
      const updated = { ...record, ...req.body, id };
      disciplineRecords.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'DISCIPLINE_UPDATE_ERROR', message: error.message } });
    }
  }

  // ─────────────────── VISITOR MANAGEMENT ───────────────────

  async getVisitors(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      let visitors = Array.from(visitorLogs.values());
      if (date) visitors = visitors.filter(v => v.visitDate?.startsWith(String(date)));
      res.status(200).json({ success: true, data: { visitors, total: visitors.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'VISITOR_LIST_ERROR', message: error.message } });
    }
  }

  async registerVisitor(req: Request, res: Response): Promise<void> {
    try {
      const { visitorName, studentId, relation, phone, purpose, visitDate } = req.body;
      if (!visitorName || !studentId) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'visitorName and studentId are required' } }); return; }
      const visitor = { id: nextVisitorId++, visitorName, studentId, relation: relation ?? 'Guest', phone: phone ?? '', purpose: purpose ?? '', visitDate: visitDate ?? new Date().toISOString(), checkInTime: new Date().toISOString(), checkOutTime: null, status: 'checked-in', registeredBy: req.user?.userId };
      visitorLogs.set(visitor.id, visitor);
      res.status(201).json({ success: true, data: visitor });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'VISITOR_CREATE_ERROR', message: error.message } });
    }
  }

  async checkoutVisitor(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.visitorId);
      const visitor = visitorLogs.get(id);
      if (!visitor) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Visitor not found' } }); return; }
      visitor.checkOutTime = new Date().toISOString();
      visitor.status = 'checked-out';
      visitorLogs.set(id, visitor);
      res.status(200).json({ success: true, data: visitor });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'VISITOR_CHECKOUT_ERROR', message: error.message } });
    }
  }

  // ─────────────────── LEAVE MANAGEMENT ───────────────────

  async getLeaveRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status, studentId } = req.query;
      let leaves = Array.from(leaveRecords.values());
      if (status) leaves = leaves.filter(l => l.status === String(status));
      if (studentId) leaves = leaves.filter(l => String(l.studentId) === String(studentId));
      res.status(200).json({ success: true, data: { leaves, total: leaves.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'LEAVE_LIST_ERROR', message: error.message } });
    }
  }

  async processLeaveRequest(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.leaveId);
      const { action, remarks } = req.body; // action: 'approve' | 'reject'
      if (!['approve', 'reject'].includes(action)) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'action must be approve or reject' } }); return; }
      const leave = leaveRecords.get(id);
      if (!leave) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Leave not found' } }); return; }
      leave.status = action === 'approve' ? 'approved' : 'rejected';
      leave.remarks = remarks ?? '';
      leave.processedBy = req.user?.userId;
      leave.processedAt = new Date().toISOString();
      leaveRecords.set(id, leave);
      res.status(200).json({ success: true, data: leave });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'LEAVE_PROCESS_ERROR', message: error.message } });
    }
  }

  // ─────────────────── INCIDENT MANAGEMENT ───────────────────

  async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      const incidents = Array.from(incidentRecords.values());
      res.status(200).json({ success: true, data: { incidents, total: incidents.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'INCIDENT_LIST_ERROR', message: error.message } });
    }
  }

  async createIncident(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, studentsInvolved, severity, date, actionTaken } = req.body;
      if (!title || !description) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title and description are required' } }); return; }
      const incident = { id: nextIncidentId++, title, description, studentsInvolved: studentsInvolved ?? [], severity: severity ?? 'low', date: date ?? new Date().toISOString(), actionTaken: actionTaken ?? '', status: 'open', reportedBy: req.user?.userId, createdAt: new Date().toISOString() };
      incidentRecords.set(incident.id, incident);
      res.status(201).json({ success: true, data: incident });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'INCIDENT_CREATE_ERROR', message: error.message } });
    }
  }

  async updateIncident(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.incidentId);
      const incident = incidentRecords.get(id);
      if (!incident) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Incident not found' } }); return; }
      const updated = { ...incident, ...req.body, id };
      incidentRecords.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'INCIDENT_UPDATE_ERROR', message: error.message } });
    }
  }

  // ─────────────────── MESS MANAGEMENT ───────────────────

  async getMessMenu(req: Request, res: Response): Promise<void> {
    try {
      const { day } = req.query;
      let menus = Array.from(messMenus.values());
      if (day) menus = menus.filter(m => m.day === String(day));
      res.status(200).json({ success: true, data: { menus, total: menus.length } });
    } catch (error: any) {
      logger.error('Get mess menu error:', error);
      res.status(500).json({ success: false, error: { code: 'MESS_MENU_LIST_ERROR', message: error.message } });
    }
  }

  async createMessMenu(req: Request, res: Response): Promise<void> {
    try {
      const { day, mealType, items, specialNotes } = req.body;
      if (!day || !mealType || !items) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'day, mealType, and items are required' } });
        return;
      }
      const menu = { id: nextMenuId++, day, mealType, items, specialNotes: specialNotes ?? '', createdAt: new Date().toISOString() };
      messMenus.set(menu.id, menu);
      res.status(201).json({ success: true, data: menu });
    } catch (error: any) {
      logger.error('Create mess menu error:', error);
      res.status(500).json({ success: false, error: { code: 'MESS_MENU_CREATE_ERROR', message: error.message } });
    }
  }

  async updateMessMenu(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.menuId);
      const menu = messMenus.get(id);
      if (!menu) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Menu not found' } }); return; }
      const updated = { ...menu, ...req.body, id };
      messMenus.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Update mess menu error:', error);
      res.status(500).json({ success: false, error: { code: 'MESS_MENU_UPDATE_ERROR', message: error.message } });
    }
  }

  async deleteMessMenu(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.menuId);
      if (!messMenus.has(id)) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Menu not found' } }); return; }
      messMenus.delete(id);
      res.status(200).json({ success: true, message: 'Menu deleted' });
    } catch (error: any) {
      logger.error('Delete mess menu error:', error);
      res.status(500).json({ success: false, error: { code: 'MESS_MENU_DELETE_ERROR', message: error.message } });
    }
  }

  async getMealAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      let records = Array.from(mealAttendance.values());
      if (date) records = records.filter(r => r.date === String(date));
      res.status(200).json({ success: true, data: { records, total: records.length } });
    } catch (error: any) {
      logger.error('Get meal attendance error:', error);
      res.status(500).json({ success: false, error: { code: 'MEAL_ATTENDANCE_LIST_ERROR', message: error.message } });
    }
  }

  async markMealAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { date, mealType, records } = req.body;
      if (!date || !mealType || !Array.isArray(records)) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'date, mealType, and records array are required' } });
        return;
      }
      const saved: any[] = [];
      for (const r of records) {
        const key = `${date}_${r.studentId}`;
        const entry = { date, mealType, studentId: r.studentId, status: r.status ?? 'present', markedBy: req.user?.userId, markedAt: new Date().toISOString() };
        mealAttendance.set(key, entry);
        saved.push(entry);
      }
      res.status(200).json({ success: true, data: { marked: saved.length, records: saved } });
    } catch (error: any) {
      logger.error('Mark meal attendance error:', error);
      res.status(500).json({ success: false, error: { code: 'MEAL_ATTENDANCE_MARK_ERROR', message: error.message } });
    }
  }

  // ─────────────────── INVENTORY MANAGEMENT ───────────────────

  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      let items = Array.from(inventoryItems.values());
      if (category) items = items.filter(i => i.category === String(category));
      res.status(200).json({ success: true, data: { items, total: items.length } });
    } catch (error: any) {
      logger.error('Get inventory error:', error);
      res.status(500).json({ success: false, error: { code: 'INVENTORY_LIST_ERROR', message: error.message } });
    }
  }

  async createInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const { name, category, quantity, unit, minStock, location } = req.body;
      if (!name || !category) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name and category are required' } });
        return;
      }
      const item = { id: nextInventoryId++, name, category, quantity: quantity ?? 0, unit: unit ?? 'pcs', minStock: minStock ?? 0, location: location ?? '', createdAt: new Date().toISOString() };
      inventoryItems.set(item.id, item);
      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      logger.error('Create inventory item error:', error);
      res.status(500).json({ success: false, error: { code: 'INVENTORY_CREATE_ERROR', message: error.message } });
    }
  }

  async updateInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.itemId);
      const item = inventoryItems.get(id);
      if (!item) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } }); return; }
      const updated = { ...item, ...req.body, id };
      inventoryItems.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Update inventory item error:', error);
      res.status(500).json({ success: false, error: { code: 'INVENTORY_UPDATE_ERROR', message: error.message } });
    }
  }

  async deleteInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.itemId);
      if (!inventoryItems.has(id)) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } }); return; }
      inventoryItems.delete(id);
      res.status(200).json({ success: true, message: 'Item deleted' });
    } catch (error: any) {
      logger.error('Delete inventory item error:', error);
      res.status(500).json({ success: false, error: { code: 'INVENTORY_DELETE_ERROR', message: error.message } });
    }
  }
}

export default new HostelController();
