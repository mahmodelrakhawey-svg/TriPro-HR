import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface ErrorLog {
  id: string;
  created_at: string;
  message: string;
  stack: string;
  url: string;
  user_id: string;
  context: any;
}

const AdminLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-6 text-center">جاري تحميل السجلات...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🛡️ سجل أخطاء النظام (System Logs)</h1>
        <button onClick={fetchLogs} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          تحديث
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التوقيت</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرسالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المسار (URL)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" dir="ltr">
                  {new Date(log.created_at).toLocaleString('en-GB')}
                </td>
                <td className="px-6 py-4 text-sm text-red-600 font-medium">
                  <div className="mb-1">{log.message}</div>
                  {log.stack && (
                    <details className="mt-1 text-xs text-gray-500 cursor-pointer">
                      <summary className="hover:text-gray-700">عرض التفاصيل التقنية</summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded overflow-x-auto text-left" dir="ltr">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 break-all" dir="ltr">
                  {log.url}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.user_id ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{log.user_id.slice(0, 8)}...</span> : 'زائر'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  لا توجد أخطاء مسجلة حتى الآن. النظام يعمل بكفاءة!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLogsView;