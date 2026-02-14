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
      // 1. تسجيل المستخدم في Supabase Auth
      // نرسل بيانات الشركة كـ metadata ليتم معالجتها بواسطة Database Triggers (إن وجدت)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.adminName,
            company_name: formData.companyName,
            phone: formData.phone,
            role: 'admin', // تعيين الدور كمدير للنظام
            is_tenant_owner: true
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // هنا يمكن إضافة منطق إضافي لإنشاء سجل في جدول employees إذا لم يكن هناك Trigger
        // ولكن يفضل الاعتماد على Trigger في قاعدة البيانات عند إنشاء مستخدم جديد
        
        alert('تم تسجيل حساب الشركة بنجاح! يرجى مراجعة البريد الإلكتروني لتفعيل الحساب.');
        onBack();
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      alert('فشل التسجيل: ' + error.message);
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
