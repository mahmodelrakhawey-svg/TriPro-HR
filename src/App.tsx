import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { useLanguage } from './LanguageContext';
import { DataProvider, useData } from './DataContext';
import Dashboard from './Dashboard';
import ArchitectureView from './ArchitectureView';
import AttendanceSimulator from './AttendanceSimulator';
import ReportsView from './ReportsView';
import ClientManagement from './ClientManagement';
import BillingManagement from './BillingManagement';
import LeavesMissionsView from './LeavesMissionsView';
import SecurityChatView from './SecurityChatView';
import AlertCenter from './AlertCenter';
import IntegrityAnalysisView from './IntegrityAnalysisView';
import ExportGuideView from './ExportGuideView';
import FinancialReconciliationView from './FinancialReconciliationView';
import BranchBudgetManagement from './BranchBudgetManagement';
import SystemSetupView from './SystemSetupView';
import SecurityOpsView from './SecurityOpsView';
import PayrollBridgeView from './PayrollBridgeView';
import PettyCashManagement from './PettyCashManagement';
import SupportView from './SupportView';
import AuditLogView from './AuditLogView';
import RolesPermissionsView from './RolesPermissionsView';
import LoansManagement from './LoansManagement';
import TasksBoard from './TasksBoard';
import EmployeeProfileView from './EmployeeProfileView';
import BankAccountManagement from './BankAccountManagement';
import FinancialReportsView from './FinancialReportsView';
import { SecurityAlert, AlertSeverity, BrandingConfig } from './types';

const AppContent: React.FC = () => {
  const { t, locale, setLocale } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'forgot_password' | 'update_password'>('login');
  const [userRole, setUserRole] = useState<'admin' | 'employee' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulator' | 'reports' | 'docs' | 'clients' | 'billing' | 'leaves' | 'chat' | 'alerts' | 'integrity' | 'export' | 'finance' | 'branch_budget' | 'setup' | 'sec_ops' | 'payroll_bridge' | 'petty_cash' | 'support' | 'audit_log' | 'roles_permissions' | 'loans' | 'tasks' | 'profile' | 'bank_accounts' | 'financial_reports'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    const savedEmail = localStorage.getItem('tripro_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('update_password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchBranding = async () => {
      // Assuming a single row for branding settings
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('id', 1) // Assuming a fixed ID for the single settings row
        .single();

      if (error) {
        console.error('Error fetching branding, using defaults:', error.message);
      } else if (data) {
        setBranding({
          logoUrl: data.logo_url,
          primaryColor: data.primary_color,
          slogan: data.slogan,
          companyName: data.company_name,
          crNumber: data.cr_number,
          taxId: data.tax_id,
          address: data.address,
          phone: data.phone,
          stampUrl: data.stamp_url,
        } as any);
      }
    };
    fetchBranding();
  }, []);

  const [branding, setBranding] = useState<BrandingConfig>({
    logoUrl: 'https://placehold.co/400x150/2563eb/ffffff?text=TriPro+ERP',
    primaryColor: '#2563eb', // Blue 600 متوافق مع هوية tripro
    slogan: 'المحرك المالي المتكامل',
    companyName: 'TriPro'
  });

  const { alerts, setAlerts, notifications, setNotifications, isLoading, refreshData } = useData();

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-['Inter']" dir="rtl">
         <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
         <p className="text-slate-500 font-bold text-sm animate-pulse">جاري تحميل بيانات النظام...</p>
      </div>
    );
  }

  const unreadAlertsCount = safeAlerts.filter((a: SecurityAlert) => !a.isResolved).length;
  const unreadNotifsCount = safeNotifications.filter(n => !n.is_read).length;
  const totalUnreadCount = unreadAlertsCount + unreadNotifsCount;

  const handleResolveAlert = async (id: string) => {
    setAlerts(safeAlerts.map((a: SecurityAlert) => a.id === id ? { ...a, isResolved: true } : a));
    const { error } = await supabase.from('security_alerts').update({ is_resolved: true }).eq('id', id);
    if (error) {
      console.error('Error resolving alert:', error);
      setAlerts(safeAlerts.map((a: SecurityAlert) => a.id === id ? { ...a, isResolved: false } : a));
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التنبيه نهائياً؟')) {
      const { error } = await supabase.from('security_alerts').delete().eq('id', id);
      if (error) {
        alert('فشل الحذف: ' + error.message);
      } else {
        setAlerts(safeAlerts.filter(a => a.id !== id));
      }
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications(safeNotifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) console.error('Error marking notification read:', error);
  };

  const handleDeleteNotification = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      setNotifications(safeNotifications.filter(n => n.id !== id));
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) console.error('Error deleting notification:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (user) {
        if (rememberMe) {
          localStorage.setItem('tripro_email', email);
        } else {
          localStorage.removeItem('tripro_email');
        }

        const { data: empData } = await supabase.from('employees').select('role').eq('auth_id', user.id).single();
        const assignedRole = empData?.role === 'admin' ? 'admin' : 'employee';
        
        setUserRole(assignedRole);
        setIsLoggedIn(true);
        setActiveTab(assignedRole === 'employee' ? 'simulator' : 'dashboard');
      }
    } catch (error: any) {
      alert('فشل الدخول: ' + error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      alert('يرجى إدخال البريد الإلكتروني لإعادة التعيين.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href,
      });
      if (error) throw error;
      alert('تم إرسال رابط إعادة تعيين كلمة المرور. يرجى مراجعة بريدك الإلكتروني.');
      setAuthView('login');
    } catch (error: any) {
      alert('فشل إرسال الرابط: ' + error.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      alert('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
      setNewPassword('');
      setAuthView('login');
    } catch (error: any) {
      alert('فشل تحديث كلمة المرور: ' + error.message);
    }
  };

  // قائمة التبويبات المسموحة لكل دور
  const allowedTabs = {
    admin: ['dashboard', 'simulator', 'reports', 'docs', 'clients', 'billing', 'leaves', 'chat', 'alerts', 'integrity', 'export', 'finance', 'branch_budget', 'setup', 'sec_ops', 'payroll_bridge', 'petty_cash', 'support', 'audit_log', 'roles_permissions', 'loans', 'tasks', 'profile', 'bank_accounts', 'financial_reports'],
    employee: ['simulator', 'support', 'loans', 'tasks', 'profile']
  };

  const handleTabChange = (tabId: string) => {
    if (userRole === 'admin') {
      setActiveTab(tabId as any);
    } else {
      // التحقق للموظف
      if (allowedTabs.employee.includes(tabId)) {
        setActiveTab(tabId as any);
      } else {
        alert('عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة.');
        // إعادة توجيه للصفحة الافتراضية للموظف إذا حاول الوصول لصفحة ممنوعة
        setActiveTab('simulator');
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 font-['Inter'] relative overflow-hidden" dir="rtl">
        {/* Dark Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black"></div>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/10 w-full max-w-md text-center animate-fade-in relative z-10">
           {/* Logo */}
           <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white text-4xl shadow-lg shadow-indigo-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo" className="w-14 h-14 object-contain" /> : <i className="fas fa-rocket"></i>}
           </div>
           
           <h1 className="text-3xl font-black text-white mb-2 tracking-tight">{branding.companyName}</h1>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-8">{branding.slogan}</p>

           <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                 <span className="px-4 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest backdrop-blur-xl">أو</span>
              </div>
           </div>

           {authView === 'login' && (
             <>
               <div className="space-y-5 mb-6">
                  <div className="relative group">
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        <i className="fas fa-envelope"></i>
                     </div>
                     <input 
                       type="email" 
                       placeholder="البريد الإلكتروني" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="w-full py-4 pr-12 pl-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-right placeholder:text-slate-600" 
                     />
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        <i className="fas fa-key"></i>
                     </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="كلمة المرور / PIN" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-4 pr-12 pl-12 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-right placeholder:text-slate-600" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition"
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between mb-6 px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <input 
                       type="checkbox" 
                       checked={rememberMe}
                       onChange={(e) => setRememberMe(e.target.checked)}
                       className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                     />
                     <span className="text-xs font-bold text-slate-400 group-hover:text-slate-300 transition">تذكرني</span>
                  </label>
                  <button onClick={() => setAuthView('forgot_password')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">نسيت الرمز؟</button>
               </div>

               <button
                 onClick={handleLogin}
                 className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-900/20 hover:shadow-indigo-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all mb-6 flex items-center justify-center gap-2"
               >
                 <span>تسجيل الدخول</span>
                 <i className="fas fa-arrow-left" />
               </button>
             </>
           )}

           {authView === 'forgot_password' && (
             <div className="animate-fade-in">
               <p className="text-slate-300 text-sm mb-6">أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.</p>
               <div className="relative group mb-6">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                     <i className="fas fa-envelope"></i>
                  </div>
                  <input 
                    type="email" 
                    placeholder="البريد الإلكتروني" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-4 pr-12 pl-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-right placeholder:text-slate-600" 
                  />
               </div>
               <button 
                 onClick={handlePasswordReset} 
                 className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-sm shadow-xl"
               >
                 إرسال رابط إعادة التعيين
               </button>
               <button onClick={() => setAuthView('login')} className="text-xs font-bold text-slate-400 hover:text-white transition mt-6">
                 العودة لتسجيل الدخول
               </button>
             </div>
           )}

           {authView === 'update_password' && (
             <div className="animate-fade-in">
               <p className="text-slate-300 text-sm mb-6">لقد قمت بطلب إعادة تعيين كلمة المرور. يرجى إدخال كلمة المرور الجديدة.</p>
               <div className="relative group mb-6">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                     <i className="fas fa-key"></i>
                  </div>
                  <input 
                    type="password" 
                    placeholder="كلمة المرور الجديدة" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full py-4 pr-12 pl-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-right placeholder:text-slate-600" 
                  />
               </div>
               <button 
                 onClick={handleUpdatePassword} 
                 className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl font-black text-sm shadow-xl"
               >
                 تحديث كلمة المرور
               </button>
             </div>
           )}

        </div>
        
        <div className="absolute bottom-6 text-[10px] font-bold text-slate-600">
           &copy; {new Date().getFullYear()} TriPro Systems. All rights reserved.
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-right font-['Inter'] transition-colors duration-300`}>
      {/* Header الهوية البصرية لـ tripro */}
      <header className="bg-slate-900 text-white shadow-2xl sticky top-0 z-50 border-b border-white/5">
        <div className="container mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-5 cursor-pointer group" onClick={() => handleTabChange('dashboard')}>
            <div className="relative">
               <div 
                 style={{ backgroundColor: branding.logoUrl ? 'transparent' : branding.primaryColor }}
                 className="w-20 h-12 rounded-lg flex items-center justify-center group-hover:rotate-1 transition-transform duration-500 overflow-hidden"
               >
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <i className="fas fa-rocket text-2xl text-white"></i>
                  )}
               </div>
               <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none uppercase">
                {branding.companyName} <span style={{ color: branding.primaryColor }}>Attendance</span>
              </h1>
              <p className="text-[8px] uppercase tracking-[0.3em] text-slate-500 font-bold mt-1">{branding.slogan}</p>
            </div>
          </div>
          
          <nav className="flex items-center space-x-reverse space-x-1 overflow-x-auto no-scrollbar max-w-[70%] py-2">
            {[
              { id: 'dashboard', label: t('dashboard'), icon: 'fa-house-fire', roles: ['admin'] },
              { id: 'reports', label: t('reports'), icon: 'fa-chart-pie', roles: ['admin'] },
              { id: 'integrity', label: t('integrity'), icon: 'fa-scale-balanced', roles: ['admin'] },
              { id: 'clients', label: t('clients'), icon: 'fa-users', roles: ['admin'] },            
              { id: 'sec_ops', label: t('sec_ops'), icon: 'fa-user-shield', roles: ['admin'] },
              { id: 'payroll_bridge', label: t('payroll_bridge'), icon: 'fa-file-invoice-dollar', roles: ['admin'] },
              { id: 'petty_cash', label: t('petty_cash'), icon: 'fa-wallet', roles: ['admin'] },
              { id: 'support', label: t('support'), icon: 'fa-headset', roles: ['admin', 'employee'] },
              { id: 'audit_log', label: t('auditLog'), icon: 'fa-fingerprint', roles: ['admin'] },
              { id: 'roles_permissions', label: t('rolesPermissions'), icon: 'fa-user-shield', roles: ['admin'] },
              { id: 'docs', label: t('docs'), icon: 'fa-microchip', roles: ['admin'] },
              { id: 'setup', label: t('setup'), icon: 'fa-gears', roles: ['admin'] },
              { id: 'alerts', label: t('alerts'), icon: 'fa-bell', badge: totalUnreadCount, roles: ['admin'] },
              { id: 'simulator', label: t('simulator'), icon: 'fa-mobile-vibration', roles: ['admin', 'employee'] },
              { id: 'finance', label: t('finance'), icon: 'fa-coins', roles: ['admin'] },
              { id: 'loans', label: 'إدارة السلف', icon: 'fa-hand-holding-dollar', roles: ['admin', 'employee'] },
              { id: 'bank_accounts', label: 'إدارة حسابات البنوك', icon: 'fa-bank', roles: ['admin'] },
              { id: 'financial_reports', label: 'التقارير المالية المتقدمة', icon: 'fa-chart-line', roles: ['admin'] },
              { id: 'tasks', label: 'المهام', icon: 'fa-list-check', roles: ['admin', 'employee'] },
              { id: 'profile', label: 'الملف الشخصي', icon: 'fa-id-card', roles: ['admin', 'employee'] },
            ]
            .filter(item => item.roles.includes(userRole!))
            .map((item) => {
              return (
              <button 
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center space-x-reverse space-x-2 relative shrink-0 ${
                  activeTab === item.id 
                  ? 'bg-white text-slate-900 shadow-xl' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <i className={`fas ${item.icon} text-[10px]`} style={activeTab === item.id ? {color: branding.primaryColor} : {}}></i>
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-rose-500/50">
                    {item.badge}
                  </span>
                )}
              </button>
            )})}
            <button 
              onClick={() => {
                if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                  supabase.auth.signOut();
                  setIsLoggedIn(false);
                  setUserRole(null);
                }
              }}
              className="px-4 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center space-x-reverse space-x-2 relative shrink-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
            >
              <i className="fas fa-sign-out-alt text-[10px]"></i>
              <span>تسجيل الخروج</span>
            </button>
          </nav>

          <div className="flex items-center space-x-reverse space-x-4">
        <button 
          onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition font-black text-xs"
          title="تغيير اللغة"
        >
          {locale === 'ar' ? 'EN' : 'AR'}
        </button>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
          title={isDarkMode ? t('lightMode') : t('darkMode')}
        >
           <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg">
               <i className="fas fa-user-tie text-slate-400 text-sm"></i>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && <Dashboard onNavigate={handleTabChange} />}
          {activeTab === 'setup' && <SystemSetupView branding={branding} setBranding={setBranding} />}
          {activeTab === 'sec_ops' && <SecurityOpsView />}
          {activeTab === 'payroll_bridge' && <PayrollBridgeView />}
          {activeTab === 'petty_cash' && <PettyCashManagement />}
          {activeTab === 'support' && <SupportView />}
          {activeTab === 'audit_log' && <AuditLogView />}
          {activeTab === 'roles_permissions' && <RolesPermissionsView />}
          {activeTab === 'clients' && <ClientManagement />}
          {activeTab === 'billing' && <BillingManagement branding={branding} />}
          {activeTab === 'simulator' && <AttendanceSimulator />}
          {activeTab === 'leaves' && <LeavesMissionsView />}
          {activeTab === 'chat' && <SecurityChatView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'integrity' && <IntegrityAnalysisView />}
          {activeTab === 'export' && <ExportGuideView />}
          {activeTab === 'finance' && <FinancialReconciliationView branding={branding} />}
          {activeTab === 'loans' && <LoansManagement />}
          {activeTab === 'tasks' && <TasksBoard />}
          {activeTab === 'branch_budget' && <BranchBudgetManagement />}
          {activeTab === 'bank_accounts' && <BankAccountManagement />}
          {activeTab === 'financial_reports' && <FinancialReportsView />}
          {activeTab === 'alerts' && (
            <AlertCenter 
              alerts={safeAlerts} 
              notifications={safeNotifications}
              onResolve={handleResolveAlert} 
              onDelete={handleDeleteAlert}
              onMarkRead={handleMarkNotificationRead}
              onDeleteNotification={handleDeleteNotification}
              onRefresh={() => refreshData(true)}
            />
          )}
          {activeTab === 'audit_log' && <AuditLogView />}
          {activeTab === 'roles_permissions' && <RolesPermissionsView />}
          {activeTab === 'docs' && <ArchitectureView />}
          {activeTab === 'profile' && <EmployeeProfileView />}
        </div>
      </main>

      <footer className="bg-slate-950 text-slate-500 py-8 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-row-reverse">
             <p className="text-xs font-medium">
               &copy; {new Date().getFullYear()} <span className="text-white font-black tracking-widest uppercase">{branding.companyName}</span> Technology Group.
               {(branding as any).crNumber && <span className="mx-2 text-slate-500">| C.R: {(branding as any).crNumber}</span>}
               {(branding as any).taxId && <span className="mx-2 text-slate-500">| Tax ID: {(branding as any).taxId}</span>}
               {(branding as any).phone && <span className="mx-2 text-slate-500">| Tel: {(branding as any).phone}</span>}
               {(branding as any).address && <span className="mx-2 text-slate-500">| {(branding as any).address}</span>}
               <span className="mx-2 text-slate-700">|</span>
               <span className="text-[10px] font-mono text-emerald-500" title="رقم الإصدار الحالي">v1.1.0 (Latest)</span>
             </p>
          </div>
          <div className="flex space-x-reverse space-x-6 text-[10px] font-black uppercase tracking-widest">
            <a href="/" className="hover:text-white transition">System Architecture</a>
            <a href="/" className="hover:text-white transition">Financial Vault</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
