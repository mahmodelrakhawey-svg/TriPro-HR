import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './LanguageContext';
import { useData } from './DataContext';
import { SecurityAlert, Employee } from './types';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { employees, alerts, announcements } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevAnnouncementsRef = useRef<string[]>([]);

  useEffect(() => {
    if (announcements.length > 0) {
      // Check for new urgent announcements
      const newUrgent = announcements.find(a => 
        !prevAnnouncementsRef.current.includes(a.id) && 
        a.priority === 'URGENT'
      );

      // Play sound if there is a new urgent announcement and it's not the initial load
      if (prevAnnouncementsRef.current.length > 0 && newUrgent) {
         const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
         audio.play().catch(e => console.error("Audio play failed", e));
      }

      prevAnnouncementsRef.current = announcements.map(a => a.id);
    }
  }, [announcements]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate a data fetch
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const recentEmployees = employees.slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center transition-colors">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">{t('mainDashboardTitle')}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">{t('mainDashboardSlogan')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('refreshData')}
          >
            <i className={`fas fa-sync-alt text-xl ${isRefreshing ? 'animate-spin' : ''}`}></i>
          </button>
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl">
            <i className="fas fa-chart-pie"></i>
          </div>
        </div>
      </div>

      {/* News Ticker */}
      <div className="bg-slate-800 dark:bg-slate-700 text-white p-2.5 rounded-full overflow-hidden shadow-lg">
        <div className="flex items-center gap-3">
          <span className="bg-rose-500 text-white text-[9px] font-black px-4 py-1.5 rounded-full shrink-0">عاجل</span>
          <div className="w-full overflow-hidden">
            <p className="animate-marquee whitespace-nowrap text-sm font-bold text-slate-300">
              {announcements.length > 0 ? (
                announcements.map((ann, index) => (
                  <span key={ann.id} className={ann.priority === 'URGENT' ? 'text-rose-400' : ''}>
                    {ann.priority === 'URGENT' && <i className="fas fa-circle-exclamation ml-2"></i>}
                    {ann.content} 
                    {index < announcements.length - 1 && <span className="mx-4 text-slate-500">•</span>} 
                  </span>
                ))
              ) : (
                <span> .قريبا ان شاء الله سيتم رفع فيديوهات الشرح على صفحه الفيس بوك الخاص بالبرنامج   .</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: t('employees'), value: employees.length.toString(), icon: 'fa-users', color: 'bg-blue-600' },
          { title: t('attendance'), value: '94%', icon: 'fa-check-circle', color: 'bg-emerald-500' },
          { title: t('missions'), value: '32', icon: 'fa-plane', color: 'bg-amber-500' },
          { title: t('warnings'), value: (Array.isArray(alerts) ? alerts : []).filter((a: SecurityAlert) => !a.isResolved).length.toString(), icon: 'fa-bell', color: 'bg-rose-500' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.color} p-8 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden group`}>
             <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
             <i className={`fas ${stat.icon} text-3xl mb-4 opacity-80`}></i>
             <h3 className="text-4xl font-black mb-1">{stat.value}</h3>
             <p className="text-xs font-bold opacity-70 uppercase tracking-widest">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for Charts */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Weekly Attendance Chart (Simple Bar Chart) */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm h-80 flex flex-col transition-colors">
           <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 px-2">{t('weeklyAttendanceChart')}</h3>
           <div className="flex items-end justify-between flex-grow gap-2 px-4 pb-2">
              {[65, 80, 45, 90, 75, 50, 85].map((h, i) => (
                <div key={i} className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-xl relative group">
                   <div 
                     className="absolute bottom-0 left-0 w-full bg-indigo-500 rounded-t-xl transition-all duration-1000 group-hover:bg-indigo-600" 
                     style={{ height: `${h}%` }}
                   ></div>
                </div>
              ))}
           </div>
           <div className="flex justify-between px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2">
              <span>السبت</span><span>الأحد</span><span>الاثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span>
           </div>
        </div>

        {/* Department Distribution (Pie Chart) */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm h-80 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
           <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 self-start w-full px-4">{t('departmentDistribution')}</h3>
           
           <div className="flex items-center gap-8 w-full justify-center">
              {/* Pie Chart using Conic Gradient */}
              <div className="w-40 h-40 rounded-full relative shrink-0 shadow-inner" style={{
                background: 'conic-gradient(#6366f1 0% 35%, #10b981 35% 60%, #f59e0b 60% 85%, #f43f5e 85% 100%)'
              }}>
                 <div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center shadow-sm transition-colors">
                    <span className="text-[10px] font-black text-slate-400">{t('total')}</span>
                    <span className="text-slate-800 dark:text-white text-xl font-black">{employees.length}</span>
                 </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                 {[
                   { label: `${t('sales')} (35%)`, color: 'bg-indigo-500' },
                   { label: `${t('tech')} (25%)`, color: 'bg-emerald-500' },
                   { label: `${t('hr')} (25%)`, color: 'bg-amber-500' },
                   { label: `${t('ops')} (15%)`, color: 'bg-rose-500' }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Financial Charts Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-8 px-2">
           <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">تحليل المصاريف الشهرية</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-1">مقارنة الرواتب، المكافآت، والمصروفات التشغيلية</p>
           </div>
           <select className="bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer">
              <option>2024</option>
              <option>2023</option>
           </select>
        </div>
        
        <div className="h-64 flex items-end justify-between gap-4 px-4">
           {[
             { month: 'يناير', salaries: 45, operational: 20, bonuses: 10 },
             { month: 'فبراير', salaries: 46, operational: 22, bonuses: 12 },
             { month: 'مارس', salaries: 45, operational: 18, bonuses: 8 },
             { month: 'أبريل', salaries: 48, operational: 25, bonuses: 15 },
             { month: 'مايو', salaries: 50, operational: 24, bonuses: 18 },
             { month: 'يونيو', salaries: 49, operational: 23, bonuses: 14 },
           ].map((data, i) => (
             <div key={i} className="flex flex-col items-center gap-2 w-full group">
                <div className="w-full flex flex-col justify-end gap-1 h-48 relative">
                   {/* Tooltip */}
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                      إجمالي: {(data.salaries + data.operational + data.bonuses) * 10000} ج.م
                   </div>
                   
                   <div className="w-full bg-indigo-500 rounded-t-sm hover:bg-indigo-600 transition-colors relative" style={{ height: `${data.salaries}%` }}></div>
                   <div className="w-full bg-emerald-500 rounded-sm hover:bg-emerald-600 transition-colors" style={{ height: `${data.operational}%` }}></div>
                   <div className="w-full bg-amber-500 rounded-b-lg hover:bg-amber-600 transition-colors" style={{ height: `${data.bonuses}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{data.month}</span>
             </div>
           ))}
        </div>
        
        <div className="flex justify-center gap-6 mt-6 border-t border-slate-50 dark:border-slate-700 pt-6">
           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div><span className="text-xs font-bold text-slate-500 dark:text-slate-400">الرواتب</span></div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-xs font-bold text-slate-500 dark:text-slate-400">تشغيلية</span></div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div><span className="text-xs font-bold text-slate-500 dark:text-slate-400">مكافآت</span></div>
        </div>
      </div>

      {/* Latest Employees Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-6 px-2">
           <h3 className="text-xl font-black text-slate-800 dark:text-white">{t('latestEmployees')}</h3>
           <button className="text-indigo-600 text-xs font-bold hover:underline">{t('viewAll')}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {recentEmployees.map((emp: Employee) => (
             <div key={emp.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-500 transition group">
                <img src={emp.avatarUrl || 'https://i.pravatar.cc/150?img=3'} alt={emp.name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                   <h4 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{emp.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400">{emp.title}</p>
                   <p className="text-[9px] font-medium text-slate-300 mt-1">{emp.hireDate || '2024-01-01'}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-150%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;