# Municipality Admin Role - Complete Capabilities

## 🔐 Login Credentials

**Username:** `municipalityadmin`  
**Password:** `Municipality@123`  
**Email:** `municipality.admin@school.edu.np`  
**Role:** Municipality_Admin

---

## Role Overview

**Role Code:** `Municipality_Admin`  
**Access Level:** Municipality-wide  
**Primary Purpose:** Oversee multiple schools within a municipality, assign school administrators, monitor school performance

---

## Core Responsibilities

- Manage multiple schools within the municipality
- Assign and manage school administrators
- Monitor school performance and statistics
- View consolidated reports across all schools
- Ensure compliance with municipal education policies

---

## Complete Capabilities

### 1. MUNICIPALITY DASHBOARD

**Full Access**

#### Dashboard Features
- ✅ View total schools count
- ✅ View total students across all schools
- ✅ View total staff across all schools
- ✅ View active schools count
- ✅ View inactive schools count
- ✅ View municipality statistics
- ✅ View recent activities across schools
- ✅ Quick access to school management

---

### 2. SCHOOL MANAGEMENT MODULE

**Full Access (MANAGE permission)**

#### School Operations
- ✅ Create new schools
- ✅ View all schools in municipality
- ✅ Update school information
- ✅ Activate/deactivate schools
- ✅ View school details
- ✅ View school statistics
- ✅ Filter schools by status
- ✅ Search schools by name/code

#### School Configuration
- ✅ View school configurations
- ✅ Monitor school settings
- ✅ Ensure compliance with standards

---

### 3. SCHOOL ADMIN MANAGEMENT

**Full Access**

#### Admin Assignment
- ✅ Assign school administrators to schools
- ✅ View all school administrators
- ✅ Update admin assignments
- ✅ Remove admin assignments
- ✅ View admin activity logs
- ✅ Monitor admin performance

#### User Management
- ✅ Create school admin accounts
- ✅ Reset school admin passwords
- ✅ Deactivate school admin accounts
- ✅ View admin login history

---

### 4. REPORTING & ANALYTICS

**Read-Only Access**

#### Municipality Reports
- ✅ View consolidated student reports
- ✅ View consolidated staff reports
- ✅ View attendance statistics across schools
- ✅ View financial summaries
- ✅ View exam performance across schools
- ✅ Export reports to PDF/Excel
- ✅ View comparative school performance

#### Analytics Dashboard
- ✅ School performance metrics
- ✅ Enrollment trends
- ✅ Staff distribution
- ✅ Financial health indicators
- ✅ Attendance patterns
- ✅ Academic performance trends

---

### 5. COMMUNICATION MODULE

**Limited Access**

#### Communication Features
- ✅ Send announcements to all schools
- ✅ Send messages to school administrators
- ✅ View communication history
- ✅ Create municipality-wide notices
- ✅ View message delivery status

---

### 6. CALENDAR MODULE

**Read Access**

#### Calendar Features
- ✅ View municipality calendar
- ✅ View school-specific calendars
- ✅ View holidays and events
- ✅ View academic year schedules

---

### 7. AUDIT & COMPLIANCE

**Full Access**

#### Audit Operations
- ✅ View audit logs for all schools
- ✅ Monitor system usage
- ✅ Track administrative actions
- ✅ View compliance reports
- ✅ Export audit data

---

## Dashboard Widgets

When Municipality Admin logs in, they see:

### Main Dashboard
- 📊 Total schools count
- 📊 Total students (all schools)
- 📊 Total staff (all schools)
- 📊 Active schools percentage
- 📊 Recent school activities
- 📊 School performance summary
- 📊 Pending admin assignments
- 📊 System health status

### Quick Actions
- ➕ Add new school
- ➕ Assign school admin
- 📊 View reports
- 📧 Send announcement
- 🔍 Search schools

---

## Permissions Summary

### Municipality Admin Has:

- ✅ **MANAGE** permission for: Schools, School Admins
- ✅ **READ** permission for: All school data, Reports, Analytics
- ✅ **CREATE** permission for: Schools, School Admin accounts, Announcements
- ✅ **UPDATE** permission for: School information, Admin assignments
- ✅ **DELETE** permission for: School records (soft delete), Admin assignments

### What Municipality Admin CANNOT Do:

- ❌ Access individual school's detailed operations (delegated to School Admin)
- ❌ Directly manage students/staff (done by School Admin)
- ❌ Modify school-specific academic settings
- ❌ Process school-specific financial transactions
- ❌ Access other municipalities' data
- ❌ Modify system-wide settings

---

## API Endpoints Available

**Total Endpoints:** 25+

### By Category:
- Municipality Dashboard: 3 endpoints
- School Management: 8 endpoints
- School Admin Management: 6 endpoints
- Reports: 5 endpoints
- Communication: 3 endpoints

---

## Security Features

### Authentication
- JWT-based authentication
- Municipality-specific access control
- Session management
- Multi-factor authentication support

### Authorization
- Municipality-level data isolation
- Role-based access control
- Audit trail for all actions
- IP-based access restrictions

---

## Workflow Examples

### Adding a New School

1. Navigate to Schools section
2. Click "Add School"
3. Fill in school details:
   - School name (English & Nepali)
   - School code
   - Address
   - Contact information
   - Email
4. Submit form
5. School is created and appears in school list

### Assigning School Administrator

1. Navigate to School Admins section
2. Click "Assign Admin"
3. Select school from dropdown
4. Enter admin details:
   - Username
   - Email
   - Password
   - Contact information
5. Submit form
6. Admin account is created and assigned to school
7. Admin receives login credentials

---

## Best Practices

### School Management
- Regularly review school performance metrics
- Ensure all schools have assigned administrators
- Monitor inactive schools and take action
- Keep school information up-to-date

### Admin Management
- Assign qualified administrators to schools
- Monitor admin activity and performance
- Provide training and support to admins
- Regularly review admin access logs

### Reporting
- Generate monthly performance reports
- Compare school performance metrics
- Identify schools needing support
- Share insights with stakeholders

---

## Support & Resources

### Getting Help
- Contact system administrator
- View user documentation
- Access training materials
- Submit support tickets

### Training Resources
- Municipality admin user guide
- Video tutorials
- Best practices documentation
- FAQ section
