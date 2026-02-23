-- -----------------------------------------------------------------------------
-- نظام تسجيل الأخطاء الداخلي (Internal Error Logging)
-- بديل مجاني لـ Sentry يعتمد على Supabase
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
CREATE POLICY "Anyone can log errors" ON error_logs FOR INSERT WITH CHECK (true);

-- السماح للمسؤولين فقط برؤية سجل الأخطاء
CREATE POLICY "Admins view errors" ON error_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);