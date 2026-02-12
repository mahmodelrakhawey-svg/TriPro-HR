/**
 * src/generate-users.ts
 * 
 * سكربت لإنشاء حسابات مستخدمين للموظفين تلقائياً.
 * التشغيل: npx ts-node --project tsconfig.script.json src/generate-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// !!! هام: استبدل هذه القيم ببيانات مشروعك من Supabase !!!
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fihrpscnvmpgquistuit.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '""""';

// التحقق من صحة المفتاح - يجب أن يكون مفتاح الخدمة السري
if (SUPABASE_SERVICE_KEY.startsWith('sb_publishable') || SUPABASE_SERVICE_KEY.includes('public')) {
  console.error('🛑 خطأ فادح: أنت تستخدم مفتاحاً خاطئاً. يرجى استخدام مفتاح "service_role" السري.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface UserInsert {
  employee_id: string;
  username?: string;
  password_hash?: string;
  status?: string;
  role?: string;
  created_at?: string;
}

interface ReportItem {
  EmployeeCode: string;
  Username: string;
  InitialPIN: string;
  Status: string;
}

async function generateUserAccounts() {
  console.log('🚀 بدء عملية إنشاء حسابات الموظفين...');
  const report: ReportItem[] = [];
  const usersToInsert: UserInsert[] = [];

  try {
    // 1. جلب جميع الموظفين
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, email, national_id');

    if (empError || !employees) throw new Error(`فشل جلب الموظفين: ${empError?.message}`);

    // 2. جلب المستخدمين الحاليين لمنع التكرار
    const { data: existingUsers, error: userError } = await supabase
      .from('users')
      .select('employee_id, username');

    if (userError) throw new Error(`فشل جلب المستخدمين الحاليين: ${userError.message}`);

    const existingEmployeeIds = new Set(existingUsers?.map(u => u.employee_id));
    const existingUsernames = new Set(existingUsers?.map(u => u.username));

    console.log(`📊 تم العثور على ${employees.length} موظف و ${existingUsers?.length || 0} مستخدم حالي.`);

    // 3. معالجة البيانات
    for (const emp of employees) {
      if (existingEmployeeIds.has(emp.id)) {
        continue; // تخطي من لديه حساب
      }

      // تحديد Username (استخدام national_id أو جزء من المعرف)
      const employeeCode = emp.national_id || emp.id.substring(0, 8).toUpperCase();
      const username = employeeCode;

      if (existingUsernames.has(username)) {
        console.warn(`⚠️ تخطي: اسم المستخدم ${username} مكرر.`);
        continue;
      }

      // إنشاء PIN عشوائي
      const plainPin = Math.floor(1000 + Math.random() * 9000).toString();
      const passwordHash = crypto.createHash('sha256').update(plainPin + 'salt').digest('hex');

      usersToInsert.push({
        employee_id: emp.id,
        username: username,
        password_hash: passwordHash,
        status: 'INACTIVE',
        role: 'USER',
        created_at: new Date().toISOString()
      });

      report.push({
        EmployeeCode: employeeCode,
        Username: username,
        InitialPIN: plainPin,
        Status: 'Ready to Insert'
      });
    }

    // 4. الحفظ في قاعدة البيانات
    if (usersToInsert.length > 0) {
      console.log(`💾 جاري حفظ ${usersToInsert.length} حساب جديد...`);
      const { error: insertError } = await supabase.from('users').insert(usersToInsert);

      if (insertError) throw new Error(`فشل الحفظ: ${insertError.message}`);

      // 5. تحديث حالة الموظفين إلى ACTIVE
      const employeeIds = usersToInsert.map(u => u.employee_id);
      const { error: updateError } = await supabase
        .from('employees')
        .update({ status: 'ACTIVE' })
        .in('id', employeeIds);

      if (updateError) {
        console.warn(`⚠️ تحذير: تم إنشاء المستخدمين ولكن فشل تحديث حالة الموظفين: ${updateError.message}`);
      } else {
        console.log(`✅ تم تحديث حالة ${employeeIds.length} موظف إلى ACTIVE.`);
      }

      const reportFile = path.join(__dirname, `users_report_${Date.now()}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`📄 تم حفظ التقرير (يحتوي على كلمات المرور) في: ${reportFile}`);
    } else {
      console.log('ℹ️ لا يوجد موظفين جدد لإضافتهم.');
    }

  } catch (error: any) {
    console.error('🔥 خطأ:', error.message);
  }
}

generateUserAccounts();