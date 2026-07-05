-- =============================================================================
-- ==             ملف تأمين قاعدة البيانات الإضافي لـ TriPro HR                 ==
-- ==             الهدف: سد الثغرات الأمنية وتفعيل RLS وكتابة سياسات الوصول    ==
-- =============================================================================

-- 1. إنشاء جدول محاولات تسجيل الدخول الفاشلة (Failed Logins) إن لم يكن موجوداً
CREATE TABLE IF NOT EXISTS failed_logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  ip_address TEXT,
  reason TEXT,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة عمود org_id لجدول سجل النشاطات (audit_logs) لتمكين العزل بين الشركات
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS org_id UUID;

-- 2. تفعيل Row Level Security (RLS) على الجداول التي تفتقدها
ALTER TABLE failed_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. كتابة سياسات الوصول (Policies)

-- >> جدول الحسابات البنكية للموظفين (employee_bank_accounts)
-- السماح للمدراء والمدراء الماليين بالتحكم الكامل في الحسابات البنكية لنفس المؤسسة
DROP POLICY IF EXISTS "Admins and Managers manage bank accounts" ON employee_bank_accounts;
CREATE POLICY "Admins and Managers manage bank accounts" ON employee_bank_accounts
FOR ALL
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
)
WITH CHECK (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- السماح للموظفين بمشاهدة حساباتهم البنكية الخاصة فقط
DROP POLICY IF EXISTS "Employees view own bank accounts" ON employee_bank_accounts;
CREATE POLICY "Employees view own bank accounts" ON employee_bank_accounts
FOR SELECT
USING (
  employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
);


-- >> جدول الصلاحيات والأدوار (roles)
-- السماح للمدير فقط بالتحكم الكامل
DROP POLICY IF EXISTS "Admins manage roles" ON roles;
CREATE POLICY "Admins manage roles" ON roles
FOR ALL
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);

-- السماح للجميع في نفس الشركة بقراءة الأدوار
DROP POLICY IF EXISTS "Anyone in org can view roles" ON roles;
CREATE POLICY "Anyone in org can view roles" ON roles
FOR SELECT
USING (org_id = get_my_org_id());


-- >> جدول إعدادات النظام (system_settings)
-- السماح للمسؤولين فقط بتعديل إعدادات النظام
DROP POLICY IF EXISTS "Admins manage system_settings" ON system_settings;
CREATE POLICY "Admins manage system_settings" ON system_settings
FOR ALL
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);

-- السماح لأي مستخدم بقراءة الإعدادات الخاصة بشركته
DROP POLICY IF EXISTS "Anyone in org can view system_settings" ON system_settings;
CREATE POLICY "Anyone in org can view system_settings" ON system_settings
FOR SELECT
USING (org_id = get_my_org_id());


-- >> جدول الإعلانات (announcements)
-- السماح للمدراء بإدارة الإعلانات
DROP POLICY IF EXISTS "Admins and Managers manage announcements" ON announcements;
CREATE POLICY "Admins and Managers manage announcements" ON announcements
FOR ALL
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
)
WITH CHECK (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- السماح للموظفين بمشاهدة الإعلانات النشطة
DROP POLICY IF EXISTS "Anyone in org can view announcements" ON announcements;
CREATE POLICY "Anyone in org can view announcements" ON announcements
FOR SELECT
USING (org_id = get_my_org_id());


-- >> جدول سياسات الشركة (company_policies)
-- إدارة سياسات الشركة للمدراء
DROP POLICY IF EXISTS "Admins and Managers manage company_policies" ON company_policies;
CREATE POLICY "Admins and Managers manage company_policies" ON company_policies
FOR ALL
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
)
WITH CHECK (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- قراءة سياسات الشركة للجميع
DROP POLICY IF EXISTS "Anyone in org can view company_policies" ON company_policies;
CREATE POLICY "Anyone in org can view company_policies" ON company_policies
FOR SELECT
USING (org_id = get_my_org_id());


-- >> جدول العطلات الرسمية (holidays)
-- إدارة العطلات الرسمية للمسؤولين
DROP POLICY IF EXISTS "Admins manage holidays" ON holidays;
CREATE POLICY "Admins manage holidays" ON holidays
FOR ALL
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);

-- قراءة العطلات الرسمية للجميع
DROP POLICY IF EXISTS "Anyone in org can view holidays" ON holidays;
CREATE POLICY "Anyone in org can view holidays" ON holidays
FOR SELECT
USING (org_id = get_my_org_id());


-- >> جدول المسميات الوظيفية (job_titles)
DROP POLICY IF EXISTS "Admins manage job_titles" ON job_titles;
CREATE POLICY "Admins manage job_titles" ON job_titles
FOR ALL
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Anyone in org can view job_titles" ON job_titles;
CREATE POLICY "Anyone in org can view job_titles" ON job_titles
FOR SELECT
USING (org_id = get_my_org_id());


-- >> جدول أنواع المستندات (document_types)
DROP POLICY IF EXISTS "Admins manage document_types" ON document_types;
CREATE POLICY "Admins manage document_types" ON document_types
FOR ALL
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Anyone in org can view document_types" ON document_types;
CREATE POLICY "Anyone in org can view document_types" ON document_types
FOR SELECT
USING (org_id = get_my_org_id());


-- >> جدول التنبيهات الأمنية (security_alerts)
-- مشاهدة التنبيهات الأمنية للمدراء والمدراء الأمنيين
DROP POLICY IF EXISTS "Admins and Managers view alerts" ON security_alerts;
CREATE POLICY "Admins and Managers view alerts" ON security_alerts
FOR SELECT
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- السماح لأي عملية إدراج آلية (مثل تسجيل حضور مشبوه)
DROP POLICY IF EXISTS "Anyone can insert alerts" ON security_alerts;
CREATE POLICY "Anyone can insert alerts" ON security_alerts
FOR INSERT
WITH CHECK (true);

-- تعديل التنبيهات (مثل حل التنبيه) للمسؤولين فقط
DROP POLICY IF EXISTS "Admins update security_alerts" ON security_alerts;
CREATE POLICY "Admins update security_alerts" ON security_alerts
FOR UPDATE
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);


-- >> جدول محاولات تسجيل الدخول الفاشلة (failed_logins)
-- السماح للنظام بتسجيل محاولات الدخول الفاشلة بدون تسجيل دخول مسبق
DROP POLICY IF EXISTS "Anyone can log failed logins" ON failed_logins;
CREATE POLICY "Anyone can log failed logins" ON failed_logins
FOR INSERT
WITH CHECK (true);

-- مشاهدة وإدارة محاولات الدخول الفاشلة للمسؤولين فقط
DROP POLICY IF EXISTS "Admins view failed logins" ON failed_logins;
CREATE POLICY "Admins view failed logins" ON failed_logins
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins update failed logins" ON failed_logins;
CREATE POLICY "Admins update failed logins" ON failed_logins
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);


-- >> جدول الإشعارات (notifications)
-- مشاهدة وإدارة الإشعارات الخاصة بالموظف نفسه
DROP POLICY IF EXISTS "Employees view own notifications" ON notifications;
CREATE POLICY "Employees view own notifications" ON notifications
FOR SELECT
USING (
  employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;
CREATE POLICY "Anyone can insert notifications" ON notifications
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Employees manage own notifications" ON notifications;
CREATE POLICY "Employees manage own notifications" ON notifications
FOR ALL
USING (
  employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
)
WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
);


-- >> جدول سجل التدقيق والنشاطات (audit_logs)
-- قراءة سجل النشاطات للمسؤولين والمدراء الماليين
DROP POLICY IF EXISTS "Admins and Managers view audit logs" ON audit_logs;
CREATE POLICY "Admins and Managers view audit logs" ON audit_logs
FOR SELECT
USING (
  org_id = get_my_org_id()
  AND EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- إدراج أحداث سجل النشاطات
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON audit_logs;
CREATE POLICY "Anyone can insert audit logs" ON audit_logs
FOR INSERT
WITH CHECK (true);
