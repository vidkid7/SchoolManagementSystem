# School Management System - Role Documentation

This folder contains detailed documentation for each of the 15 user roles in the School Management System.

## Available Roles

1. [Municipality Admin](MUNICIPALITY_ADMIN.md) - Municipality-level administration
2. [School Admin](SCHOOL_ADMIN.md) - Complete school management
3. [Subject Teacher](SUBJECT_TEACHER.md) - Subject-specific teaching duties
4. [Class Teacher](CLASS_TEACHER.md) - Class management and coordination
5. [Department Head](DEPARTMENT_HEAD.md) - Department oversight
6. [ECA Coordinator](ECA_COORDINATOR.md) - Extra-curricular activities management
7. [Sports Coordinator](SPORTS_COORDINATOR.md) - Sports and athletics management
8. [Student](STUDENT.md) - Student portal access
9. [Parent](PARENT.md) - Parent portal access
10. [Librarian](LIBRARIAN.md) - Library management
11. [Accountant](ACCOUNTANT.md) - Financial management
12. [Transport Manager](TRANSPORT_MANAGER.md) - Transport operations
13. [Hostel Warden](HOSTEL_WARDEN.md) - Hostel management
14. [Non-Teaching Staff](NON_TEACHING_STAFF.md) - Support staff

## Permission System

The system uses a granular permission-based access control with 16 permission categories:

- STUDENT, STAFF, ACADEMIC, ATTENDANCE, EXAMINATION
- FINANCE, LIBRARY, TRANSPORT, HOSTEL
- ECA, SPORTS, COMMUNICATION, DOCUMENT
- CERTIFICATE, REPORT, SYSTEM

Each permission has actions: CREATE, READ, UPDATE, DELETE, MANAGE

## Quick Reference

| Role | Access Level | Primary Functions |
|------|-------------|-------------------|
| Municipality Admin | Municipality-wide | School oversight, admin assignment |
| School Admin | School-wide | Complete system control |
| Subject Teacher | Subject-specific | Teaching, grading, attendance |
| Class Teacher | Class-specific | Class coordination, monitoring |
| Department Head | Department-wide | Department management |
| ECA Coordinator | ECA-specific | Activity management |
| Sports Coordinator | Sports-specific | Sports management |
| Student | Personal | View academics, submit work |
| Parent | Child-specific | Monitor child, communicate |
| Librarian | Library | Book management, circulation |
| Accountant | Finance | Fee management, payments |
| Transport Manager | Transport | Vehicle, route, driver management |
| Hostel Warden | Hostel | Room allocation, discipline |
| Non-Teaching Staff | Limited | Self-service, assigned tasks |
