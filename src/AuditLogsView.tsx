import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  old_data: any;
  new_data: any;
  created_at: string;
  user_id: string;
}

const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    // جلب آخر 50 عملية
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching audit logs:', error);
    } else {
      setLogs(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">سجل النشاطات (Audit Logs)</h2>
          <p className="text-slate-500 text-sm mt-1">مراقبة جميع التغييرات التي تحدث في النظام</p>
        </div>
        <button 
          onClick={fetchLogs} 
          className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition"
        >
          <i className="fas fa-sync-alt ml-2"></i> تحديث
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black">
              <tr>
                <th className="px-6 py-4">التوقيت</th>
                <th className="px-6 py-4">نوع العملية</th>
                <th className="px-6 py-4">الجدول المتأثر</th>
                <th className="px-6 py-4">التفاصيل (JSON)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 text-sm font-bold text-slate-600" dir="ltr">
                    {new Date(log.created_at).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                      log.action === 'INSERT' ? 'bg-emerald-100 text-emerald-600' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{log.table_name}</td>
                  <td className="px-6 py-4 text-left" dir="ltr">
                    <details className="group">
                      <summary className="cursor-pointer text-[10px] font-black text-indigo-600 hover:text-indigo-800 select-none list-none flex items-center gap-1 w-fit">
                        <span>عرض البيانات</span>
                        <i className="fas fa-chevron-down transition-transform group-open:rotate-180 text-[8px]"></i>
                      </summary>
                      <div className="mt-2 max-w-xs max-h-60 overflow-auto bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-mono text-slate-600 whitespace-pre shadow-inner">
                        {JSON.stringify(log.new_data || log.old_data, null, 2)}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">لا توجد سجلات حتى الآن</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsView;