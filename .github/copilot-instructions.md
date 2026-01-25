# Copilot Instructions for TriPro HR System

## Overview
The TriPro HR System is a comprehensive Human Resource Management System (HRMS) tailored for the Egyptian and Arab markets, fully supporting Arabic language and local financial systems. This document provides essential guidance for AI coding agents to navigate and contribute effectively to the codebase.

## Architecture

### Core Components
- **HR Management**: Manages employee records, organizational structure, and compliance documentation.
- **Attendance Tracking**: Implements geofencing for attendance, supporting various shift types with real-time synchronization to payroll.
- **Payroll and Finance**: Integrates with local banking systems for payroll processing and expense management.

### Database Structure (Supabase PostgreSQL)

#### Key Tables
1. **employees**
   - Columns: id, first_name, last_name, email, phone, job_title, department_id, manager_id, hire_date, status, basic_salary, org_id, auth_id, role, branch_id, shift_id
   - Primary Key: id (UUID)
   - Foreign Keys: shift_id → shifts.id, branch_id → branches.id, manager_id → employees.id

2. **attendance_logs**
   - Columns: id, employee_id, timestamp, type (CHECK_IN/CHECK_OUT), status, location, method, date, location_verified, coordinates (JSONB), period_start, period_end, mission_id
   - Primary Key: id (UUID)
   - Foreign Key: employee_id → employees.id
   - **Triggers**: `on_attendance_update` (AFTER INSERT/UPDATE/DELETE) → calls `sync_attendance_to_payroll()`

3. **shifts**
   - Columns: id, name, start_time, end_time, grace_period_minutes, is_overnight, type (FIXED/VARIABLE/OVERNIGHT), settings (JSON), org_id
   - Primary Key: id (UUID)

4. **payroll_batches**
   - Columns: id, name, total_amount, status (DRAFT/PROCESSING/COMPLETED), created_at, org_id, employee_count
   - Primary Key: id (UUID)
   - **Note**: Does NOT have period_start/period_end columns - these were removed from schema

5. **payroll_records**
   - Columns: batch_id, employee_id, deductions_breakdown (JSONB), and others
   - Used by `sync_attendance_to_payroll()` to store absence deductions

### Database Functions

#### sync_attendance_to_payroll(p_employee_id uuid, p_date date)
**Purpose**: Synchronize attendance data to payroll when attendance is recorded
**Logic**:
1. Finds the latest DRAFT payroll batch
2. Calculates daily rate (basic_salary / 30)
3. Counts absent days for the given date
4. Updates payroll_records with deduction breakdown
**Important**: This function is triggered automatically after each attendance insert/update/delete

### Data Flow
```
User marks attendance (CHECK_IN/CHECK_OUT)
    ↓
attendance_logs INSERT triggered
    ↓
on_attendance_update trigger fires (AFTER INSERT)
    ↓
sync_attendance_to_payroll() executes
    ↓
Updates payroll_records with absence deductions
```

## Developer Workflows

### Building the Project
```bash
npm run build
```
This compiles the TypeScript files and prepares the application for deployment.

### Testing
```bash
npm test
```
Ensure to write tests that cover both unit and integration scenarios.

### Debugging
- **React Components**: Use Chrome DevTools (F12) and React Developer Tools extension
- **Supabase Issues**: Check logs in Supabase Dashboard → Logs
- **Triggers/Functions**: Use Supabase SQL Editor to test functions directly
- **Attendance Module**: Open F12 Console to see detailed logging from `AttendanceSimulator.tsx`

### Common Supabase Issues & Solutions

#### Attendance Save Failures
**Problem**: "column X does not exist" error when saving attendance
**Root Cause**: Mismatch between application payload fields and database schema or triggers trying to use non-existent columns
**Solution**:
1. Check database schema using Information Schema queries
2. Verify trigger functions are using correct column names
3. Only send fields that actually exist in the table
4. Example: `period_start`/`period_end` may not be in all tables - check schema first

#### Trigger Function Issues
**Problem**: Silent failures or unexpected behavior after record insert/update
**Solution**:
1. Find triggers: `SELECT * FROM information_schema.triggers WHERE event_object_table = 'table_name'`
2. Get function code: `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'function_name'`
3. Review the logic - triggers may reference columns that don't exist
4. Test the function directly in SQL Editor before relying on it

## Project-Specific Conventions

### File Structure
- `src/`: Contains all React components and application logic
  - `AttendanceSimulator.tsx`: Attendance tracking with geofencing (main module)
  - `DataContext.tsx`: Global state management for employees, branches, departments, shifts
  - `types.ts`: TypeScript interfaces and type definitions
  - `supabaseClient.ts`: Supabase initialization
- `android/`: Android-specific configurations and Gradle files
- `public/`: Static assets and HTML files

### Naming Conventions
- **Components**: PascalCase (e.g., `AttendanceSimulator.tsx`)
- **Functions**: camelCase (e.g., `handleAction()`, `fetchHistory()`)
- **Database columns**: snake_case (e.g., `location_verified`, `period_start`)
- **Types**: PascalCase (e.g., `AttendanceStatus`, `Employee`)

### Styling
- **Framework**: Tailwind CSS with utility-first approach
- **Direction**: Full RTL support for Arabic with `dir="rtl"` attributes
- **Theme**: Indigo primary color (#4F46E5), slate neutrals, with semantic color system

### State Management
- **Global State**: React Context (DataContext) for shared data (employees, branches, shifts, alerts)
- **Local State**: useState for component-specific state
- **Data Fetching**: Direct Supabase queries with error handling

### Attendance Simulator Module
The `AttendanceSimulator.tsx` component is central to attendance tracking:
- **Modes**: 'simulator' (for testing) and 'real' (production GPS)
- **Security Checks**:
  - Geofencing validation (polygon/radius based)
  - WiFi SSID verification
  - Device integrity checks (root/emulator detection)
  - Mock location detection
- **Data Sent to Database**:
  ```typescript
  {
    employee_id: UUID,
    timestamp: ISO string,
    type: 'CHECK_IN' | 'CHECK_OUT',
    status: 'PRESENT',
    location: string,
    method: 'BIOMETRIC',
    date: YYYY-MM-DD,
    location_verified: boolean,
    coordinates: { lat, lng } (optional),
    // period_start/period_end NOT sent - trigger handles them
  }
  ```

## Integration Points

### External Dependencies
- `@capacitor/core`: For cross-platform mobile builds
- `@supabase/supabase-js`: Database and authentication
- `react`: Frontend framework
- `tailwindcss`: Styling

### Cross-Component Communication
- **DataContext**: Central hub for employee, branch, and shift data
- **Supabase Auth**: User authentication and session management
- **Triggers**: Automatic synchronization between attendance and payroll modules

### Critical Relationships
- Employees → Shifts (via shift_id) → Shift times (start_time, end_time)
- Attendance → Employees → Payroll batches (via sync function)
- Attendance records trigger automatic payroll calculations

## Key Examples from Codebase

### Attendance Recording Flow
File: [src/AttendanceSimulator.tsx](src/AttendanceSimulator.tsx#L136-L250)
Shows how to:
1. Fetch current user authentication
2. Look up associated employee record
3. Retrieve employee's shift information
4. Prepare attendance payload with minimal required fields
5. Handle trigger-related errors gracefully

### State Management Pattern
File: [src/DataContext.tsx](src/DataContext.tsx)
Demonstrates:
1. Central state for employees, branches, departments, shifts
2. Async data fetching with error handling
3. Refresh mechanism for background updates
4. Shared context for all components

## Testing Checklist

Before deploying attendance features:
1. ✅ Verify employee has valid `shift_id` linked
2. ✅ Check that referenced shift exists with start_time/end_time
3. ✅ Ensure payroll_batches table has at least one DRAFT batch
4. ✅ Test trigger function directly: `SELECT * FROM sync_attendance_to_payroll('emp_uuid'::uuid, CURRENT_DATE)`
5. ✅ Check RLS policies allow authenticated users to insert into attendance_logs
6. ✅ Review Console logs (F12) for detailed error messages

## Troubleshooting Workflow

**Problem**: Attendance won't save
1. Open F12 Console and look for detailed error messages
2. Check if error mentions column names (indicates schema mismatch)
3. Verify the Supabase schema using Information Schema queries
4. Check if triggers are causing the issue
5. Review trigger function code for logic errors
6. Test the function directly in SQL Editor
7. Only send fields that exist in the schema

**Problem**: Data inconsistency between modules
1. Check if triggers are executing (enable query logging in Supabase)
2. Verify function logic with sample data
3. Review foreign key constraints
4. Check RLS policies for permission issues

## Deployment Notes

- Arabic RTL support is fully integrated - no additional configuration needed
- Attendance module uses geofencing which requires GPS on mobile devices
- Payroll synchronization happens automatically via triggers
- Ensure all database functions are deployed before running the application
- Test trigger functions thoroughly before production deployment

## Conclusion

This document serves as a foundational guide for AI coding agents working on the TriPro HR System. Key areas to focus:
1. Database schema and trigger functions (critical for understanding failures)
2. Attendance module architecture and data flow
3. State management through DataContext
4. Error handling and logging patterns
5. Supabase-specific issues and solutions

For questions about the database layer, always start by checking the actual schema and trigger definitions rather than assuming column names.
