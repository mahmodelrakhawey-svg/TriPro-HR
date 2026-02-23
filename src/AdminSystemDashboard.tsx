import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AdminSystemDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    errorCount: 0,
    recentErrors: [] as any[],
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const start = performance.now();

    // 1. إحصائيات المستخدمين (الموظفين)
    const { count: totalUsers } = await supabase.from('employees').select('*', { count: 'exact', head: true });
    
    // 2. إحصائيات الأخطاء (آخر 24 ساعة)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { count: errorCount } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    // 3. آخر الأخطاء المسجلة
    const { data: recentErrors } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const end = performance.now();
    
    setStats({
      totalUsers: totalUsers || 0,
      activeUsers: totalUsers || 0, // يمكن تحسينه لاحقاً باستخدام auth.users
      errorCount: errorCount || 0,
      recentErrors: recentErrors || [],
      avgResponseTime: Math.round(end - start)
    });
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل إحصائيات النظام...</div>;

  return (
    <div className="p-6 space-y-6 font-['Inter']" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800">📊 لوحة تحكم مسؤول النظام (System Health)</h1>
        <button onClick={fetchStats} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-bold">
          <i className="fas fa-sync-alt ml-2"></i> تحديث
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">الموظفين المسجلين</div>
          <div className="text-3xl font-black text-slate-800">{stats.totalUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">أخطاء آخر 24 ساعة</div>
          <div className={`text-3xl font-black ${stats.errorCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {stats.errorCount}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">زمن استجابة الخادم</div>
          <div className="text-3xl font-black text-blue-600">{stats.avgResponseTime} ms</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">حالة النظام</div>
          <div className="text-3xl font-black text-emerald-500 flex items-center gap-2">
            مستقر <i className="fas fa-check-circle text-xl"></i>
          </div>
        </div>
      </div>

      {/* Recent Errors Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">⚠️ آخر الأخطاء المسجلة</h3>
        </div>
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-6 py-4">التوقيت</th>
              <th className="px-6 py-4">الرسالة</th>
              <th className="px-6 py-4">المستخدم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stats.recentErrors.map(err => (
              <tr key={err.id} className="hover:bg-slate-50/80 transition">
                <td className="px-6 py-4 text-xs text-slate-500 font-mono" dir="ltr">
                  {new Date(err.created_at).toLocaleString('en-GB')}
                </td>
                <td className="px-6 py-4 text-sm text-rose-600 font-medium">{err.message}</td>
                <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                  {err.user_id ? <span className="bg-slate-100 px-2 py-1 rounded">{err.user_id.slice(0, 8)}...</span> : 'زائر'}
                </td>
              </tr>
            ))}
            {stats.recentErrors.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                  <div className="text-4xl mb-3">🎉</div>
                  لا توجد أخطاء حديثة، النظام يعمل بكفاءة!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSystemDashboard;