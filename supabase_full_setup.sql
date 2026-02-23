-- =============================================================================
-- ==             ملف الإعداد الكامل لقاعدة بيانات TriPro HR                   ==
-- ==             ينفذ هذا الملف مرة واحدة فقط في SQL Editor                  ==
-- =============================================================================

-- -----------------------------------------------------------------------------
-- الجزء الأول: إعدادات Row Level Security (RLS) لعزل بيانات العملاء
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
DROP POLICY IF EXISTS "Employees can view colleagues in same org" ON employees;
CREATE POLICY "Employees can view colleagues in same org"
ON employees FOR SELECT
USING (org_id = get_my_org_id());

-- السماح للمدراء فقط بالتعديل (مثال لسياسة تعتمد على الدور)
DROP POLICY IF EXISTS "Admins can update employees in same org" ON employees;
CREATE POLICY "Admins can update employees in same org"
ON employees FOR UPDATE
USING (
  org_id = get_my_org_id() 
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- >> جدول الحضور (Attendance Logs)
-- قراءة: الموظف يرى سجلات شركته
DROP POLICY IF EXISTS "View org attendance logs" ON attendance_logs;
CREATE POLICY "View org attendance logs"
ON attendance_logs FOR SELECT
USING (org_id = get_my_org_id());

-- كتابة: الموظف يسجل حضوره بشرط أن يكون org_id مطابق لشركته
DROP POLICY IF EXISTS "Insert own attendance" ON attendance_logs;
CREATE POLICY "Insert own attendance"
ON attendance_logs FOR INSERT
WITH CHECK (
  org_id = get_my_org_id()
);

-- >> الجداول المالية (Payroll & Bank Accounts)
-- قراءة: فقط المدراء الماليين أو المسؤولين (Admin/Manager)
DROP POLICY IF EXISTS "Admins view payroll" ON payroll_records;
CREATE POLICY "Admins view payroll"
ON payroll_records FOR SELECT
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- >> البيانات العامة (Departments, Branches)
-- قراءة للجميع في نفس الشركة
DROP POLICY IF EXISTS "View org departments" ON departments;
CREATE POLICY "View org departments" ON departments FOR SELECT USING (org_id = get_my_org_id());
DROP POLICY IF EXISTS "View org branches" ON branches;
CREATE POLICY "View org branches" ON branches FOR SELECT USING (org_id = get_my_org_id());


-- -----------------------------------------------------------------------------
-- الجزء الثاني: نظام تسجيل الأخطاء الداخلي (Internal Error Logging)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- من واجه الخطأ؟
  message TEXT,                           -- رسالة الخطأ
  stack TEXT,                             -- تفاصيل الكود (Stack Trace)
  context JSONB,                          -- معلومات إضافية (المكان، المتصفح)
  url TEXT,                               -- في أي صفحة حدث؟
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل الحماية
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- السماح للجميع (حتى الزوار) بتسجيل الأخطاء (Insert Only)
DROP POLICY IF EXISTS "Anyone can log errors" ON error_logs;
CREATE POLICY "Anyone can log errors" ON error_logs FOR INSERT WITH CHECK (true);

-- السماح للمسؤولين فقط برؤية سجل الأخطاء
DROP POLICY IF EXISTS "Admins view errors" ON error_logs;
CREATE POLICY "Admins view errors" ON error_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);

-- =============================================================================
-- ==                       انتهى الإعداد، النظام جاهز الآن                     ==
-- =============================================================================