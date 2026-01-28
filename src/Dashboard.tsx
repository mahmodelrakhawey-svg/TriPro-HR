import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { useData } from './DataContext';
import { SecurityAlert, Employee } from './types';
import AttendanceSimulator from './AttendanceSimulator';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

interface AttendanceStats {
  [key: string]: { present: number; absent: number; late: number };
}

interface FinancialData {
  month: string;
  salaries: number;
  operational: number;
  bonuses: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { employees, alerts, announcements, departments } = useData();
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({});
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [missionsCount, setMissionsCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevAnnouncementsRef = useRef<string[]>([]);
  const [showRealAttendance, setShowRealAttendance] = useState(false);

  // Calculate real department distribution
  const deptDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    employees.forEach(emp => {
      const dept = emp.dep || 'غير محدد';
      distribution[dept] = (distribution[dept] || 0) + 1;
    });
    return distribution;
  }, [employees]);

  // Calculate real financial data from payroll
  useEffect(() => {
    const fetchFinancialData = async () => {
      const { data, error } = await supabase
        .from('payroll_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (data && data.length > 0) {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const transformedData = data.map((batch, idx) => {
            const date = new Date(batch.created_at);
            return {
              month: months[date.getMonth()] || `شهر ${date.getMonth() + 1}`,
              salaries: Math.round((batch.total_amount || 0) * 0.7 / 10000), // Scaling for chart
              operational: Math.round((batch.total_amount || 0) * 0.2 / 10000),
              bonuses: Math.round((batch.total_amount || 0) * 0.1 / 10000)
            };
        }).reverse();
        setFinancialData(transformedData);
      } else {
        setFinancialData([]);
      }
    };
    fetchFinancialData();
  }, []);

  // Fetch attendance statistics
  useEffect(() => {
    const fetchAttendanceStats = async () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data } = await supabase
        .from('attendance_logs')
        .select('date, status, type')
        .gte('date', sixDaysAgo);
      
      if (data) {
        const stats: AttendanceStats = {};
        // Days mapping for getDay() which returns 0 for Sunday
        const dayNamesMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        
        dayNamesMap.forEach(day => {
          stats[day] = { present: 0, absent: 0, late: 0 };
        });
        
        data.forEach(log => {
          const date = new Date(log.date);
          const dayIndex = date.getDay();
          const dayName = dayNamesMap[dayIndex];
          if (stats[dayName]) {
            if (log.status === 'PRESENT') stats[dayName].present++;
            else if (log.status === 'ABSENT') stats[dayName].absent++;
            else if (log.status === 'LATE') stats[dayName].late++;
          }
        });
        setAttendanceStats(stats);
      }
    };
    fetchAttendanceStats();
  }, []);

  // Fetch missions count
  useEffect(() => {
    const fetchMissionsCount = async () => {
      const { count } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true });
      setMissionsCount(count || 0);
    };
    fetchMissionsCount();
  }, []);

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
      window.location.reload(); // Simple reload to refresh all data context
    }, 1000);
  };

  const attendancePercentage = useMemo(() => {
    let totalPresent = 0;
    let totalLogs = 0;
    Object.values(attendanceStats).forEach(stat => {
      totalPresent += stat.present;
      totalLogs += stat.present + stat.absent + stat.late;
    });
    // If no logs, return 0 or a default placeholder if preferred
    return totalLogs > 0 ? Math.round((totalPresent / totalLogs) * 100) : 0;
  }, [attendanceStats]);

  const handleExportDeptData = () => {
    const data = Object.entries(deptDistribution).map(([dept, count]) => ({
      'القسم': dept,
      'عدد الموظفين': count,
      'النسبة المئوية': employees.length > 0 ? `${Math.round((count / employees.length) * 100)}%` : '0%'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "توزيع الأقسام");
    XLSX.writeFile(wb, "department_distribution.xlsx");
  };

  const recentEmployees = employees.slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Admin Simulator Shortcut Box */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-[3.5rem] text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden border border-white/10">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <i className="fas fa-fingerprint text-[15rem] -ml-20 -mt-20"></i>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
             <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Admin Tools</span>
             <i className="fas fa-wand-magic-sparkles text-yellow-300"></i>
          </div>
          <h3 className="text-2xl font-black">تسجيل الحضور الفعلي (Live Attendance)</h3>
          <p className="text-indigo-100 text-sm mt-2 max-w-xl leading-relaxed">
            يمكنك الآن تسجيل الحضور والانصراف فعلياً باستخدام GPS والبصمة الرقمية مباشرة من لوحة التحكم.
          </p>
        </div>
        <button 
          onClick={() => setShowRealAttendance(true)}
          className="relative z-10 bg-white text-indigo-600 px-8 py-4 rounded-2xl text-xs font-black shadow-lg hover:bg-indigo-50 transition flex items-center gap-3 group"
        >
          <i className="fas fa-fingerprint text-lg group-hover:scale-110 transition-transform"></i>
          <span>تسجيل الحضور الآن</span>
        </button>
      </div>

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
                <span>لا توجد إعلانات هامة في الوقت الحالي.</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: t('employees'), value: employees.length.toString(), icon: 'fa-users', color: 'bg-blue-600' },
          { title: t('attendance'), value: `${attendancePercentage}%`, icon: 'fa-check-circle', color: 'bg-emerald-500' },
          { title: t('missions'), value: missionsCount.toString(), icon: 'fa-plane', color: 'bg-amber-500' },
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
              {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day, i) => {
                const dayStats = attendanceStats[day] || { present: 0, absent: 0, late: 0 };
                const total = dayStats.present + dayStats.absent + dayStats.late;
                const percentage = total > 0 ? Math.round((dayStats.present / total) * 100) : 0;
                return (
                  <div key={i} className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-xl relative group">
                     <div 
                       className="absolute bottom-0 left-0 w-full bg-indigo-500 rounded-t-xl transition-all duration-1000 group-hover:bg-indigo-600" 
                       style={{ height: `${Math.max(percentage, 5)}%` }}
                     >
                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                         حضور: {dayStats.present}
                       </div>
                     </div>
                  </div>
                );
              })}
           </div>
           <div className="flex justify-between px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2">
              <span>السبت</span><span>الأحد</span><span>الاثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span>
           </div>
        </div>

        {/* Department Distribution (Pie Chart) */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm h-80 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
           <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 self-start w-full px-4">{t('departmentDistribution')}</h3>
           
           <div className="flex items-center gap-8 w-full justify-center flex-wrap">
              {/* Dynamic Pie Chart using Conic Gradient */}
              {Object.keys(deptDistribution).length > 0 ? (
                <>
                  <div className="w-40 h-40 rounded-full relative shrink-0 shadow-inner" style={(() => {
                    const depts = Object.entries(deptDistribution);
                    const total = depts.reduce((sum, [, count]) => sum + count, 0);
                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
                    let conic = 'conic-gradient(';
                    let cumulative = 0;
                    depts.forEach(([, count], idx) => {
                      const percent = (count / total) * 100;
                      const color = colors[idx % colors.length];
                      conic += `${color} ${cumulative}% ${cumulative + percent}%`;
                      cumulative += percent;
                      if (idx < depts.length - 1) conic += ', ';
                    });
                    conic += ')';
                    return { background: conic };
                  })()}>
                     <div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center shadow-sm transition-colors">
                        <span className="text-[10px] font-black text-slate-400">{t('total')}</span>
                        <span className="text-slate-800 dark:text-white text-xl font-black">{employees.length}</span>
                     </div>
                  </div>

                  {/* Dynamic Legend */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                     {Object.entries(deptDistribution).map(([dept, count], i) => {
                       const total = employees.length;
                       const percent = Math.round((count / total) * 100);
                       const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-teal-500'];
                       return (
                         <div key={dept} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`}></div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">{dept}: {count} ({percent}%)</span>
                         </div>
                       );
                     })}
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-sm font-bold">لا توجد بيانات موظفين للعرض</div>
              )}
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
              <option>{new Date().getFullYear()}</option>
           </select>
        </div>
        
        <div className="h-64 flex items-end justify-between gap-4 px-4">
           {financialData.length > 0 ? (
             financialData.map((data, i) => (
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
           ))
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
               لا توجد بيانات مالية مسجلة لهذا العام
             </div>
           )}
        </div>
        
        <div className="flex justify-center gap-6 mt-6 border-t border-slate-50 dark:border-slate-700 pt-6">
           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div><span className="text-xs font-bold text-slate-500 dark:text-slate-400">الرواتب</span></div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-xs font-bold text-slate-500 dark:text-slate-400">تشغيلية</span></div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div><span className="text-xs font-bold text-slate-500 dark:text-slate-400">مكافآت</span></div>
        </div>
      </div>

      {/* Department Distribution (Bar Chart) - New Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-black text-slate-800 dark:text-white">توزيع الموظفين حسب القسم (تفصيلي)</h3>
           <button 
             onClick={handleExportDeptData}
             className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-100 transition flex items-center gap-2"
           >
             <i className="fas fa-file-excel"></i> تصدير Excel
           </button>
        </div>
        <div className="space-y-5">
          {Object.entries(deptDistribution).sort(([,a], [,b]) => b - a).map(([dept, count], index) => {
            const total = employees.length;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-cyan-500'];
            
            return (
              <div key={dept} className="relative">
                <div className="flex justify-between items-center mb-2 text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{dept}</span>
                  <span className="text-slate-500">{count} موظف ({Math.round(percentage)}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colors[index % colors.length]} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest Employees Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-6 px-2">
           <h3 className="text-xl font-black text-slate-800 dark:text-white">{t('latestEmployees')}</h3>
           <button className="text-indigo-600 text-xs font-bold hover:underline">{t('viewAll')}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {recentEmployees.length > 0 ? recentEmployees.map((emp: Employee) => (
             <div key={emp.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-500 transition group">
                <img src={emp.avatarUrl || 'https://i.pravatar.cc/150?img=3'} alt={emp.name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                   <h4 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{emp.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400">{emp.title}</p>
                   <p className="text-[9px] font-medium text-slate-300 mt-1">{emp.hireDate || '2024-01-01'}</p>
                </div>
             </div>
           )) : (
             <div className="col-span-4 text-center text-slate-400 font-bold py-4">لا يوجد موظفين مسجلين</div>
           )}
        </div>
      </div>

      {showRealAttendance && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-fade-in">
           <AttendanceSimulator mode="real" onClose={() => setShowRealAttendance(false)} />
        </div>
      )}

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