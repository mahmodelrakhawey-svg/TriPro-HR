-- -----------------------------------------------------------------------------
-- إعدادات Row Level Security (RLS) لنظام TriPro HR
-- الهدف: عزل بيانات العملاء (الشركات) عن بعضها البعض
-- -----------------------------------------------------------------------------

-- 1. تفعيل RLS على الجداول الحساسة
-- هذا يمنع أي وصول للبيانات ما لم تكن هناك سياسة تسمح بذلك
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 2. دالة مساعدة لجلب معرف الشركة (org_id) للمستخدم الحالي
-- هذه الدالة تستخدم auth.uid() لجلب org_id من جدول الموظفين
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
  SELECT org_id 
  FROM employees 
  WHERE auth_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. إنشاء السياسات (Policies)

-- >> جدول الموظفين (Employees)
-- السماح للموظفين برؤية زملائهم في نفس الشركة فقط
CREATE POLICY "Employees can view colleagues in same org"
ON employees FOR SELECT
USING (org_id = get_my_org_id());

-- السماح للمدراء فقط بالتعديل (مثال لسياسة تعتمد على الدور)
CREATE POLICY "Admins can update employees in same org"
ON employees FOR UPDATE
USING (
  org_id = get_my_org_id() 
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- >> جدول الحضور (Attendance Logs)
-- قراءة: الموظف يرى سجلات شركته (أو يمكن تقييدها ليراها لنفسه والمدير يرى الكل)
CREATE POLICY "View org attendance logs"
ON attendance_logs FOR SELECT
USING (org_id = get_my_org_id());

-- كتابة: الموظف يسجل حضوره بشرط أن يكون org_id مطابق لشركته
CREATE POLICY "Insert own attendance"
ON attendance_logs FOR INSERT
WITH CHECK (
  org_id = get_my_org_id()
  -- يمكن إضافة شرط إضافي للتأكد أن employee_id يخص المستخدم الحالي
);

-- >> الجداول المالية (Payroll & Bank Accounts)
-- قراءة: فقط المدراء الماليين أو المسؤولين (Admin/Manager)
CREATE POLICY "Admins view payroll"
ON payroll_records FOR SELECT
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- >> البيانات العامة (Departments, Branches)
-- قراءة للجميع في نفس الشركة
CREATE POLICY "View org departments" ON departments FOR SELECT USING (org_id = get_my_org_id());
CREATE POLICY "View org branches" ON branches FOR SELECT USING (org_id = get_my_org_id());

-- ملاحظة: عند إنشاء مستخدم جديد (Sign Up)، قد تحتاج لسياسة خاصة تسمح بالإضافة بدون org_id مبدئياً
-- أو استخدام دالة Supabase Edge Function لإنشاء المستخدم والشركة معاً بصلاحيات service_role.

-- 4. تطبيق التغييرات
-- انسخ هذا الكود وضعه في Supabase Dashboard -> SQL Editor -> Run