-- =============================================================================
-- ==             تحسين أداء قاعدة البيانات (Database Optimization)            ==
-- ==             الهدف: تسريع عمليات البحث والفلترة                       ==
-- =============================================================================

-- 1. فهارس لجدول الموظفين (للبحث السريع حسب الشركة والقسم والفرع)
CREATE INDEX IF NOT EXISTS idx_employees_org_id ON employees(org_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);

-- 2. فهارس لسجلات الحضور (للبحث السريع بالتاريخ والموظف)
-- هذا مهم جداً للتقارير الشهرية
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_org_date ON attendance_logs(org_id, date);

-- 3. فهارس للرواتب (للبحث السريع بدفعة الرواتب)
CREATE INDEX IF NOT EXISTS idx_payroll_records_batch_id ON payroll_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);

-- 4. فهارس للحسابات البنكية (للبحث السريع عن حساب الموظف)
CREATE INDEX IF NOT EXISTS idx_bank_accounts_employee_id ON employee_bank_accounts(employee_id);

-- 5. فهارس للمهام والسلف (تحسينات إضافية)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_loans_employee_id ON loans(employee_id);

-- تم الانتهاء. تشغيل هذا الملف لن يؤثر على البيانات الموجودة، فقط سيسرع الوصول إليها.