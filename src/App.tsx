import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useLanguage } from './LanguageContext';
import { DataProvider, useData } from './DataContext';
import { SecurityAlert, BrandingConfig } from './types';
import { initAnalytics, logPageView } from './services/analytics';

// Lazy load components for performance optimization (Code Splitting)
const Dashboard = React.lazy(() => import('./Dashboard'));
const ArchitectureView = React.lazy(() => import('./ArchitectureView'));
const AttendanceSimulator = React.lazy(() => import('./AttendanceSimulator'));
const ReportsView = React.lazy(() => import('./ReportsView'));
const ClientManagement = React.lazy(() => import('./ClientManagement'));
const BillingManagement = React.lazy(() => import('./BillingManagement'));
const LeavesMissionsView = React.lazy(() => import('./LeavesMissionsView'));
const SecurityChatView = React.lazy(() => import('./SecurityChatView'));
const AlertCenter = React.lazy(() => import('./AlertCenter'));
const IntegrityAnalysisView = React.lazy(() => import('./IntegrityAnalysisView'));
const ExportGuideView = React.lazy(() => import('./ExportGuideView'));
const FinancialReconciliationView = React.lazy(() => import('./FinancialReconciliationView'));
const BranchBudgetManagement = React.lazy(() => import('./BranchBudgetManagement'));
const SystemSetupView = React.lazy(() => import('./SystemSetupView'));
const SecurityOpsView = React.lazy(() => import('./SecurityOpsView'));
const PayrollBridgeView = React.lazy(() => import('./PayrollBridgeView'));
const PettyCashManagement = React.lazy(() => import('./PettyCashManagement'));
const SupportView = React.lazy(() => import('./SupportView'));
const AuditLogView = React.lazy(() => import('./AuditLogView'));
const AuditLogsView = React.lazy(() => import('./AuditLogsView'));
const RolesPermissionsView = React.lazy(() => import('./RolesPermissionsView'));
const AdminLogsView = React.lazy(() => import('./AdminLogsView'));
const LoansManagement = React.lazy(() => import('./LoansManagement'));
const TasksBoard = React.lazy(() => import('./TasksBoard'));
const EmployeeProfileView = React.lazy(() => import('./EmployeeProfileView'));
const BankAccountManagement = React.lazy(() => import('./BankAccountManagement'));
const FinancialReportsView = React.lazy(() => import('./FinancialReportsView'));
const ManagerRequestsView = React.lazy(() => import('./ManagerRequestsView'));
const TenantRegistration = React.lazy(() => import('./TenantRegistration'));
const AdminSystemDashboard = React.lazy(() => import('./AdminSystemDashboard'));

interface PasswordSetupProps {
  branding: BrandingConfig;
}

// قائمة التبويبات المسموحة لكل دور - هذا هو المصدر الوحيد للصلاحيات
const allowedTabs = {
  admin: ['dashboard', 'simulator', 'reports', 'docs', 'clients', 'billing', 'leaves', 'chat', 'alerts', 'integrity', 'export', 'finance', 'branch_budget', 'setup', 'sec_ops', 'payroll_bridge', 'petty_cash', 'support', 'audit_log', 'audit_logs_view', 'roles_permissions', 'loans', 'tasks', 'profile', 'manager_requests', 'bank_accounts', 'financial_reports', 'error_logs', 'sys_admin'],
  manager: ['dashboard', 'simulator', 'reports', 'leaves', 'loans', 'tasks', 'profile', 'manager_requests', 'alerts', 'support'],
  employee: ['dashboard', 'simulator', 'support', 'loans', 'tasks', 'profile', 'alerts']
};

const PasswordSetup: React.FC<PasswordSetupProps> = ({ branding }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetPassword = async () => {
    if (password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError('فشل تحديث كلمة المرور: ' + updateError.message);
      setLoading(false);
    } else {
      // The onAuthStateChange listener will handle the redirection automatically.
      alert('تم تعيين كلمة المرور بنجاح! سيتم توجيهك الآن.');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100" dir="rtl">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-right">
        <div className="text-center mb-6">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.companyName} className="mx-auto h-12" />
          ) : (
            <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto flex items-center justify-center">
              <i className="fas fa-building text-2xl text-indigo-500"></i>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center">تعيين كلمة المرور</h2>
        <p className="text-slate-600 mb-6">مرحباً بك في نظام TriPro! يرجى تعيين كلمة مرور جديدة لحسابك للمتابعة.</p>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الجديدة</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:border-indigo-500" style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">تأكيد كلمة المرور</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:border-indigo-500" style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties} />
          </div>
          <button onClick={handleSetPassword} disabled={loading} className="w-full py-3 px-4 text-white rounded-md font-bold hover:opacity-90 disabled:opacity-50 transition" style={{ backgroundColor: branding.primaryColor }}>
            {loading ? 'جاري الحفظ...' : 'حفظ ومتابعة'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { t, locale, setLocale } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulator' | 'reports' | 'docs' | 'clients' | 'billing' | 'leaves' | 'chat' | 'alerts' | 'integrity' | 'export' | 'finance' | 'branch_budget' | 'setup' | 'sec_ops' | 'payroll_bridge' | 'petty_cash' | 'support' | 'audit_log' | 'audit_logs_view' | 'roles_permissions' | 'loans' | 'tasks' | 'profile' | 'bank_accounts' | 'financial_reports' | 'manager_requests' | 'error_logs' | 'sys_admin'>('simulator');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [isTenantRegister, setIsTenantRegister] = useState(false);

  // Initialize Analytics once
  useEffect(() => { initAnalytics(); }, []);

  useEffect(() => {
    const initializeSession = async (session: any) => {
      const user = session.user;

      // Check if this is a first-time login from an invitation
      // A new user's created_at and updated_at are identical.
      if (user && user.created_at === user.updated_at) {
        // 1. Link the auth_id to the employee record
        await supabase
          .from('employees')
          .update({ auth_id: user.id })
          .eq('email', user.email)
          .is('auth_id', null);

        // 2. Show the password setup screen
        setNeedsPasswordSetup(true);
        setIsLoggedIn(true); // User is logged in but needs to set password
        return;
      }

      // This is a regular login for a returning user
      setNeedsPasswordSetup(false);

      const { data: employee } = await supabase.from('employees').select('role').eq('auth_id', user.id).maybeSingle();
      const assignedRole = (employee?.role === 'admin') ? 'admin' : (employee?.role === 'manager' ? 'manager' : 'employee');
      
      setUserRole(assignedRole);
      setIsLoggedIn(true);
      setActiveTab('dashboard');
    };

    // 1. التحقق من وجود جلسة عند تحميل الصفحة لأول مرة
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) initializeSession(session);
    });

    // 2. الاستماع لأي تغيير في حالة الدخول (دخول، خروج، تحديث)
    // هذا الكود مهم جداً لأنه يجعل الشاشات المفتوحة تتواصل مع بعضها
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // تم تسجيل الدخول في هذه الشاشة أو شاشة أخرى
        initializeSession(session);
      } else {
        // تم تسجيل الخروج
        setIsLoggedIn(false);
        setNeedsPasswordSetup(false);
        setUserRole('admin'); // إعادة للوضع الافتراضي
      }
    });

    // 3. إلغاء الاشتراك عند إغلاق المكون
    return () => subscription.unsubscribe();
  }, []);

  // حارس أمان: يتأكد أن التبويب المفتوح مسموح به للدور الحالي
  useEffect(() => {
    if (isLoggedIn) {
      const isTabAllowed = (allowedTabs[userRole] || allowedTabs.employee).includes(activeTab);
      if (!isTabAllowed) {
        setActiveTab('dashboard');
      }
    }
  }, [isLoggedIn, userRole, activeTab]);

  // Track page views when tab changes
  useEffect(() => {
    if (isLoggedIn) logPageView(activeTab);
  }, [activeTab, isLoggedIn]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  
  const [branding, setBranding] = useState<BrandingConfig>({
    logoUrl: '',
    primaryColor: '#2563eb', // Blue 600 متوافق مع هوية tripro
    slogan: 'المحرك المالي المتكامل',
    companyName: 'TriPro'
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('config')
          .eq('category', 'branding')
          .maybeSingle();
        
        if (data?.config) {
          setBranding(prev => ({ ...prev, ...data.config }));
        }
      } catch (error) {
        console.error('Error fetching branding:', error);
      }
    };
    fetchBranding();
  }, []);

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

  if (isLoggedIn && needsPasswordSetup) {
    return <PasswordSetup branding={branding} />;
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
    if (!agreedToPolicy) {
      alert('عفواً، يجب الموافقة على سياسة الخصوصية وشروط الاستخدام للمتابعة.');
      return;
    }

    if (!email || !password) {
      alert('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('تم إنشاء الحساب! يرجى مراجعة البريد الإلكتروني للتفعيل.');
      } else {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (user) {
          // استخدام limit(1) بدلاً من single() لتجنب الخطأ 406 في حال وجود تكرار في البيانات
          const { data: employee } = await supabase.from('employees').select('role').eq('auth_id', user.id).maybeSingle();
          const assignedRole = (employee?.role === 'admin') ? 'admin' : (employee?.role === 'manager' ? 'manager' : 'employee');
          
          // تسجيل الموافقة في سجل النشاطات لغرض التقارير
          if (agreedToPolicy) {
            supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'AGREED_TO_PRIVACY_POLICY',
              table_name: 'legal_policies',
              created_at: new Date().toISOString(),
              new_data: { version: '1.0', timestamp: new Date().toISOString() }
            }).then(({ error }) => {
              if (error) console.error('Error logging policy agreement:', error);
            });
          }

          setUserRole(assignedRole);
          setIsLoggedIn(true);
          setActiveTab('dashboard');

          // Request Notification Permission
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }
      }
    } catch (error: any) {
      // تسجيل محاولة تسجيل الدخول الفاشلة أمنياً
      try {
        const simulatedIp = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
        await supabase.from('failed_logins').insert({
          username: email,
          ip_address: simulatedIp,
          reason: error.message || 'Incorrect password or email',
          is_blocked: false
        });
      } catch (logErr) {
        console.error('Failed to log failed login attempt:', logErr);
      }
      alert('فشل الدخول: ' + error.message);
    }
  };

  const handleTabChange = (tabId: string) => {
    const isAllowed = (allowedTabs[userRole] || allowedTabs.employee).includes(tabId);
    if (isAllowed) {
      setActiveTab(tabId as any);
    } else {
      // هذا الجزء لا يجب أن يتم الوصول إليه إذا كانت الواجهة تعمل بشكل صحيح
      // لكنه حماية إضافية
      console.error(`Forbidden: Role '${userRole}' attempted to access tab '${tabId}'.`);
    }
  };

  if (isTenantRegister) {
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
        <TenantRegistration onBack={() => setIsTenantRegister(false)} />
      </React.Suspense>
    );
  }

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

           {/* Social Logins (Visual) */}
           <div className="space-y-3 mb-8">
              <button 
                type="button"
                onClick={() => alert('تسجيل الدخول عبر GitHub متاح عند ربط المؤسسة بخوادم الـ SSO السحابية.')} 
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-3 transition border border-white/5"
              >
                 <i className="fab fa-github text-lg"></i>
                 <span>المتابعة باستخدام GitHub</span>
              </button>
              <button 
                type="button"
                onClick={() => alert('تسجيل الدخول عبر Bitbucket متاح عند ربط المؤسسة بخوادم الـ SSO السحابية.')} 
                className="w-full py-3 bg-[#171515] hover:bg-opacity-80 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-3 transition border border-white/5"
              >
                 <i className="fab fa-bitbucket text-lg text-blue-500"></i>
                 <span>المتابعة باستخدام Bitbucket</span>
              </button>
           </div>

           <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                 <span className="px-4 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest backdrop-blur-xl">أو</span>
              </div>
           </div>

           <div className="space-y-5 mb-8">
              {isSignUp && (
                <div className="relative group">
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <i className="fas fa-id-card"></i>
                   </div>
                   <input 
                     type="text" 
                     placeholder="الاسم بالكامل" 
                     className="w-full py-4 pr-12 pl-4 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-right placeholder:text-slate-600" 
                   />
                </div>
              )}

              <div className="relative group">
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <i className="fas fa-user"></i>
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
                    <i className="fas fa-lock"></i>
                 </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="كلمة المرور" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-4 pr-12 pl-12 bg-slate-800/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-right placeholder:text-slate-600" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
           </div>

           <div className="flex items-center gap-3 mb-6 px-1" dir="rtl">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="privacy-policy"
                  checked={agreedToPolicy}
                  onChange={(e) => setAgreedToPolicy(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-600 bg-slate-800/50 checked:border-indigo-500 checked:bg-indigo-500 transition-all focus:ring-2 focus:ring-indigo-500/50"
                />
                <i className="fas fa-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
              </div>
              
              <label htmlFor="privacy-policy" className="text-xs font-medium text-slate-400 cursor-pointer select-none">
                أوافق على <button type="button" onClick={() => alert('سياسة الخصوصية:\n\nنحن نلتزم بحماية بياناتك الشخصية والمالية وفقاً للقوانين المصرية.\nيتم استخدام البيانات فقط لأغراض العمل والرواتب.\n\nللمزيد يرجى مراجعة إدارة الموارد البشرية.')} className="text-indigo-400 hover:text-indigo-300 underline transition-colors">سياسة الخصوصية</button> وشروط الاستخدام
              </label>
           </div>

           <button 
             onClick={handleLogin} 
             className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-900/20 hover:shadow-indigo-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all mb-6 flex items-center justify-center gap-2"
           >
              <span>{isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}</span>
              <i className="fas fa-arrow-left"></i>
           </button>

           <div className="text-center space-y-3">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-bold text-slate-400 hover:text-white transition"
              >
                {isSignUp ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'موظف جديد؟ تفعيل الحساب'}
              </button>
              <button 
                onClick={() => setIsTenantRegister(true)}
                className="block w-full text-xs font-black text-emerald-500 hover:text-emerald-400 transition uppercase tracking-wider"
              >
                تسجيل شركة جديدة
              </button>
           </div>
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
              { id: 'dashboard', label: t('dashboard'), icon: 'fa-house-fire', roles: ['admin', 'manager'] },
              { id: 'leaves', label: 'الإجازات والمأموريات', icon: 'fa-umbrella-beach', roles: ['admin', 'manager'] },
              { id: 'manager_requests', label: 'اعتماد الطلبات', icon: 'fa-inbox', roles: ['admin', 'manager'] },
              { id: 'reports', label: t('reports'), icon: 'fa-chart-pie', roles: ['admin', 'manager'] },
              { id: 'finance', label: t('finance'), icon: 'fa-coins', roles: ['admin'] },
              { id: 'financial_reports', label: 'التقارير المالية المتقدمة', icon: 'fa-chart-line', roles: ['admin'] },
              { id: 'payroll_bridge', label: t('payroll_bridge'), icon: 'fa-file-invoice-dollar', roles: ['admin'] },
              { id: 'loans', label: 'إدارة السلف', icon: 'fa-hand-holding-dollar', roles: ['admin', 'manager', 'employee'] },
              { id: 'petty_cash', label: t('petty_cash'), icon: 'fa-wallet', roles: ['admin'] },
              { id: 'bank_accounts', label: 'إدارة حسابات البنوك', icon: 'fa-bank', roles: ['admin'] },
              { id: 'branch_budget', label: 'ميزانيات الفروع', icon: 'fa-chart-pie', roles: ['admin'] },
              { id: 'clients', label: t('clients'), icon: 'fa-users', roles: ['admin'] },            
              { id: 'billing', label: 'الفواتير والاشتراكات', icon: 'fa-receipt', roles: ['admin'] },
              { id: 'tasks', label: 'المهام', icon: 'fa-list-check', roles: ['admin', 'manager', 'employee'] },
              { id: 'simulator', label: t('simulator'), icon: 'fa-mobile-vibration', roles: ['admin', 'manager', 'employee'] },
              { id: 'profile', label: 'الملف الشخصي', icon: 'fa-id-card', roles: ['admin', 'manager', 'employee'] },
              { id: 'integrity', label: t('integrity'), icon: 'fa-scale-balanced', roles: ['admin'] },
              { id: 'sec_ops', label: t('sec_ops'), icon: 'fa-user-shield', roles: ['admin'] },
              { id: 'alerts', label: t('alerts'), icon: 'fa-bell', badge: totalUnreadCount, roles: ['admin', 'manager'] },
              { id: 'support', label: t('support'), icon: 'fa-headset', roles: ['admin', 'manager', 'employee'] },
              { id: 'audit_logs_view', label: 'سجل النشاطات', icon: 'fa-list-ul', roles: ['admin'] },
              { id: 'error_logs', label: 'سجل الأخطاء', icon: 'fa-bug', roles: ['admin'] },
              { id: 'sys_admin', label: 'لوحة النظام', icon: 'fa-server', roles: ['admin'] },
              { id: 'roles_permissions', label: t('rolesPermissions'), icon: 'fa-user-shield', roles: ['admin'] },
              { id: 'export', label: 'دليل التصدير والربط', icon: 'fa-file-export', roles: ['admin'] },
              { id: 'docs', label: t('docs'), icon: 'fa-microchip', roles: ['admin'] },
            ].filter((item) => item.roles.includes(userRole)).map((item) => (
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
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-rose-500/50">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
            <button 
              onClick={async () => {
                if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                  await supabase.auth.signOut();
                  setIsLoggedIn(false);
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
      <main className="flex-grow container mx-auto px-6 py-12 min-h-[calc(100vh-12rem)]">
        <React.Suspense fallback={
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-bold animate-pulse">جاري تحميل النظام...</p>
          </div>
        }>
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
          {activeTab === 'billing' && <BillingManagement />}
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
          {activeTab === 'audit_logs_view' && <AuditLogsView />}
          {activeTab === 'error_logs' && <AdminLogsView />}
          {activeTab === 'sys_admin' && <AdminSystemDashboard />}
          {activeTab === 'roles_permissions' && <RolesPermissionsView />}
          {activeTab === 'docs' && <ArchitectureView />}
          {activeTab === 'profile' && <EmployeeProfileView />}
          {activeTab === 'manager_requests' && <ManagerRequestsView />}
        </div>
        </React.Suspense>
      </main>

      <footer className="bg-slate-950 text-slate-500 py-8 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-row-reverse">
             <p className="text-xs font-medium">
               &copy; {new Date().getFullYear()} <span className="text-white font-black tracking-widest uppercase">{branding.companyName}</span> Technology Group.
               <span className="mx-2 text-slate-700">|</span>
               <span className="text-[10px] font-mono text-emerald-500" title="رقم الإصدار الحالي">v1.1.0 (Latest)</span>
             </p>
          </div>
          <div className="flex space-x-reverse space-x-6 text-[10px] font-black uppercase tracking-widest">
            <button onClick={() => handleTabChange('docs')} className="hover:text-white transition cursor-pointer">System Architecture</button>
            <button onClick={() => handleTabChange('finance')} className="hover:text-white transition cursor-pointer">Financial Vault</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const MissingConfig: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-6 font-['Inter']" dir="rtl">
    <div className="max-w-lg text-center">
      <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">
        <i className="fas fa-plug-circle-xmark"></i>
      </div>
      <h1 className="text-2xl font-black mb-3 text-slate-800">إعدادات الاتصال مفقودة</h1>
      <p className="text-slate-500 mb-8 leading-relaxed font-medium">
        لم يتم العثور على بيانات الربط مع قاعدة البيانات (Supabase).<br/>
        لحل المشكلة، يرجى إنشاء ملف <code className="bg-slate-200 px-2 py-1 rounded text-rose-600 font-mono text-sm mx-1 font-bold">.env</code> في المجلد الرئيسي للمشروع وإضافة البيانات التالية:
      </p>
      <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl text-left text-xs font-mono mb-8 overflow-x-auto border border-slate-800 shadow-inner" dir="ltr">
        <p className="mb-2"><span className="text-purple-400">REACT_APP_SUPABASE_URL</span>=https://your-project.supabase.co</p>
        <p><span className="text-purple-400">REACT_APP_SUPABASE_ANON_KEY</span>=your-anon-key</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30"
      >
        تحديث الصفحة
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const isConfigured = process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!isConfigured) {
    return <MissingConfig />;
  }

  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
