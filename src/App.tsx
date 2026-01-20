import React, { useState, useEffect, useRef } from 'react';
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
import { SecurityAlert, AlertSeverity, BrandingConfig } from './types';

const AppContent: React.FC = () => {
  const { t, locale, setLocale } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulator' | 'reports' | 'docs' | 'clients' | 'billing' | 'leaves' | 'chat' | 'alerts' | 'integrity' | 'export' | 'finance' | 'branch_budget' | 'setup' | 'sec_ops' | 'payroll_bridge' | 'petty_cash' | 'support' | 'audit_log' | 'roles_permissions' | 'loans' | 'tasks'>('dashboard');
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
  
  const [branding, setBranding] = useState<BrandingConfig>({
    logoUrl: 'https://placehold.co/400x150/2563eb/ffffff?text=TriPro+ERP',
    primaryColor: '#2563eb', // Blue 600 متوافق مع هوية tripro
    slogan: 'المحرك المالي المتكامل',
    companyName: 'TriPro'
  });

  const { alerts, setAlerts, notifications } = useData();

  const unreadAlertsCount = alerts.filter((a: SecurityAlert) => !a.isResolved).length;
  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;
  const totalUnreadCount = unreadAlertsCount + unreadNotifsCount;

  const handleResolveAlert = (id: string) => {
    setAlerts(alerts.map((a: SecurityAlert) => a.id === id ? { ...a, isResolved: true } : a));
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-['Inter']" dir="rtl">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-md text-center animate-fade-in">
           <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-indigo-600 text-3xl shadow-sm">
              {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain" /> : <i className="fas fa-rocket"></i>}
           </div>
           <h1 className="text-2xl font-black text-slate-800 mb-2">{branding.companyName}</h1>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">{branding.slogan}</p>

           <div className="space-y-4 mb-8">
              <input type="text" placeholder="اسم المستخدم" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right" />
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="كلمة المرور" 
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <div className="text-right">
                 <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition">نسيت كلمة المرور؟</button>
              </div>
           </div>

           <button onClick={() => setIsLoggedIn(true)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 hover:scale-[1.02] transition-all mb-8">
              تسجيل الدخول
           </button>

           <div className="border-t border-slate-100 pt-6">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">تحميل تطبيق الموظف</p>
              <a href="/" className="flex items-center justify-center gap-4 w-full py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition group">
                 <i className="fab fa-android text-2xl text-emerald-400 group-hover:scale-110 transition-transform"></i>
                 <div className="text-right">
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Download APK</p>
                    <p className="text-xs font-black">Android Version</p>
                 </div>
              </a>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-right font-['Inter'] transition-colors duration-300`}>
      {/* Header الهوية البصرية لـ tripro */}
      <header className="bg-slate-900 text-white shadow-2xl sticky top-0 z-50 border-b border-white/5">
        <div className="container mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-5 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
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
          
          <nav className="hidden xl:flex items-center space-x-reverse space-x-1 overflow-x-auto no-scrollbar max-w-[70%] py-2">
            {[
              { id: 'dashboard', label: t('dashboard'), icon: 'fa-house-fire' },
              { id: 'reports', label: t('reports'), icon: 'fa-chart-pie' },
              { id: 'integrity', label: t('integrity'), icon: 'fa-scale-balanced' },
              { id: 'clients', label: t('clients'), icon: 'fa-users' },            
              { id: 'sec_ops', label: t('sec_ops'), icon: 'fa-user-shield' },
              { id: 'payroll_bridge', label: t('payroll_bridge'), icon: 'fa-file-invoice-dollar' },
              { id: 'petty_cash', label: t('petty_cash'), icon: 'fa-wallet' },
              { id: 'support', label: t('support'), icon: 'fa-headset' },
              { id: 'audit_log', label: t('auditLog'), icon: 'fa-fingerprint' },
              { id: 'roles_permissions', label: t('rolesPermissions'), icon: 'fa-user-shield' },
              { id: 'docs', label: t('docs'), icon: 'fa-microchip' },
              { id: 'setup', label: t('setup'), icon: 'fa-gears' },
              { id: 'alerts', label: t('alerts'), icon: 'fa-bell', badge: totalUnreadCount },
              { id: 'simulator', label: t('simulator'), icon: 'fa-mobile-vibration' },
              { id: 'finance', label: t('finance'), icon: 'fa-coins' },
              { id: 'loans', label: 'إدارة السلف', icon: 'fa-hand-holding-dollar' },
              { id: 'tasks', label: 'المهام', icon: 'fa-list-check' },
            ].map((item) => {
              if (item.id === 'alerts') {
                return (
                  <div key={item.id} className="relative shrink-0" ref={notifDropdownRef}>
                    <button 
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center space-x-reverse space-x-2 relative ${
                        activeTab === item.id || isNotificationsOpen
                        ? 'bg-white text-slate-900 shadow-xl' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <i className={`fas ${item.icon} text-[10px]`} style={activeTab === item.id || isNotificationsOpen ? {color: branding.primaryColor} : {}}></i>
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-rose-500/50">
                          {item.badge}
                        </span>
                      )}
                    </button>
                    
                    {isNotificationsOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                            <h4 className="font-black text-slate-800 dark:text-white text-xs">الإشعارات</h4>
                            <span className="bg-rose-50 text-rose-600 text-[9px] px-2 py-1 rounded-lg font-bold">{totalUnreadCount} جديد</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {alerts.filter(a => !a.isResolved).length === 0 && notifications.filter(n => !n.is_read).length === 0 && (
                                <div className="p-6 text-center text-slate-400">
                                    <i className="fas fa-bell-slash text-2xl mb-2 opacity-50"></i>
                                    <p className="text-[10px]">لا توجد إشعارات جديدة</p>
                                </div>
                            )}
                            {alerts.filter(a => !a.isResolved).map(alert => (
                                <div key={alert.id} onClick={() => { setActiveTab('alerts'); setIsNotificationsOpen(false); }} className="p-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer flex gap-3 text-right">
                                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 mt-1"><i className="fas fa-triangle-exclamation text-[10px]"></i></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-800 dark:text-white">{alert.type}</p>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{alert.description}</p>
                                        <span className="text-[8px] text-slate-400 mt-1 block">{alert.timestamp}</span>
                                    </div>
                                </div>
                            ))}
                            {notifications.filter(n => !n.is_read).map(notif => (
                                <div key={notif.id} onClick={() => { setActiveTab('alerts'); setIsNotificationsOpen(false); }} className="p-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer flex gap-3 text-right">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0 mt-1"><i className="fas fa-info-circle text-[10px]"></i></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-800 dark:text-white">{notif.title}</p>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                        <span className="text-[8px] text-slate-400 mt-1 block">{new Date(notif.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => { setActiveTab('alerts'); setIsNotificationsOpen(false); }} className="w-full p-3 text-center text-[10px] font-black text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition border-t border-slate-50 dark:border-slate-700">
                            عرض كل التنبيهات
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
              return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
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
          {activeTab === 'dashboard' && <Dashboard />}
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
          {activeTab === 'alerts' && <AlertCenter alerts={alerts} onResolve={handleResolveAlert} />}
          {activeTab === 'audit_log' && <AuditLogView />}
          {activeTab === 'roles_permissions' && <RolesPermissionsView />}
          {activeTab === 'docs' && <ArchitectureView />}
        </div>
      </main>

      <footer className="bg-slate-950 text-slate-500 py-8 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-row-reverse">
             <p className="text-xs font-medium">
               &copy; {new Date().getFullYear()} <span className="text-white font-black tracking-widest uppercase">{branding.companyName}</span> Technology Group.
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
