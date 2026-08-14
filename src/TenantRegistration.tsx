import React, { useState } from 'react';
import { supabase } from './supabaseClient';

interface TenantRegistrationProps {
  onBack: () => void;
}

const TenantRegistration: React.FC<TenantRegistrationProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('كلمتا المرور غير متطابقتين');
      return;
    }
    if (formData.password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      // 1. تسجيل المستخدم في Supabase Auth
      // نرسل بيانات الشركة كـ metadata ليتم معالجتها بواسطة Database Triggers (إن وجدت)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.adminName.trim(),
            company_name: formData.companyName.trim(),
            phone: formData.phone.trim(),
            role: 'admin', // تعيين الدور كمدير للنظام
            is_tenant_owner: true
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // إنشاء معرّف فريد للشركة الجديدة (Multi-Tenant Isolation)
        const orgId = crypto.randomUUID();
        const nameParts = formData.adminName.trim().split(' ');
        const firstName = nameParts[0] || 'مدير';
        const lastName = nameParts.slice(1).join(' ') || 'الشركة';

        try {
          // 0. تسجيل المنظمة أولاً في جدول organizations
          await supabase.from('organizations').upsert({
            id: orgId,
            name: formData.companyName.trim()
          });

          // 1. إنشاء سجل الموظف كمسؤول للنظام (Admin)
          await supabase.from('employees').insert({
            auth_id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            email: cleanEmail,
            phone: formData.phone.trim(),
            job_title: 'مدير عام / مؤسس',
            role: 'admin',
            status: 'ACTIVE',
            basic_salary: 0,
            hire_date: new Date().toISOString().split('T')[0],
            org_id: orgId
          });

          // 2. إنشاء فرع رئيسي افتراضي للشركة
          await supabase.from('branches').insert({
            name: 'الفرع الرئيسي',
            location: {
              address: formData.companyName.trim(),
              lat: 30.0444,
              lng: 31.2357,
              radius: 100,
              geofencingEnabled: true
            },
            org_id: orgId
          });

          // 3. إنشاء قسم الإدارة العامة افتراضياً
          await supabase.from('departments').insert({
            name: 'الإدارة العامة',
            budget: 0,
            org_id: orgId
          });
        } catch (dbError) {
          console.warn('Initial setup records will be created on first login if blocked by session state:', dbError);
        }

        alert('تم تسجيل حساب الشركة وتعيينك مديراً للنظام بنجاح! يمكنك الآن تسجيل الدخول.');
        onBack();
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMsg = error.message || 'حدث خطأ غير متوقع';
      if (errorMsg.includes('invalid') || errorMsg.includes('Email address')) {
        errorMsg = 'البريد الإلكتروني غير صالح أو تم رفضه من قبل خادم المصادقة (تأكد من كتابة بريد إلكتروني حقيقي وصحيح بدون مسافات).';
      } else if (errorMsg.includes('already registered') || errorMsg.includes('User already registered')) {
        errorMsg = 'هذا البريد الإلكتروني مسجل بالفعل! يرجى استخدام بريد آخر أو تسجيل الدخول.';
      }
      alert('فشل التسجيل: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-['Inter'] relative overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black"></div>
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/10 w-full max-w-lg relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-white text-3xl shadow-lg shadow-emerald-500/30">
            <i className="fas fa-building"></i>
          </div>
          <h2 className="text-2xl font-black text-white">تسجيل شركة جديدة</h2>
          <p className="text-slate-400 text-xs font-bold mt-2">ابدأ رحلتك مع TriPro HR</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2">اسم الشركة</label>
            <input 
              type="text" 
              required
              value={formData.companyName}
              onChange={e => setFormData({...formData, companyName: e.target.value})}
              className="w-full py-3 px-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="اسم المؤسسة الرسمي"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">اسم المسؤول</label>
              <input 
                type="text" 
                required
                value={formData.adminName}
                onChange={e => setFormData({...formData, adminName: e.target.value})}
                className="w-full py-3 px-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                placeholder="الاسم بالكامل"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">رقم الهاتف</label>
              <input 
                type="tel" 
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full py-3 px-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-right"
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2">البريد الإلكتروني (Admin)</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full py-3 px-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-right"
              placeholder="admin@company.com"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">كلمة المرور</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full py-3 px-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                placeholder="******"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">تأكيد كلمة المرور</label>
              <input 
                type="password" 
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full py-3 px-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                placeholder="******"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>جاري التسجيل...</>
            ) : (
              <>
                <span>إنشاء حساب الشركة</span>
                <i className="fas fa-arrow-left"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={onBack}
            className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fas fa-chevron-right"></i>
            <span>العودة لتسجيل الدخول</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantRegistration;
