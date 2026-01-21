import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { supabase } from './supabaseClient';

interface AuditLogEntry {
  id: string;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
  user: string;
  role: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  module: string;
  status: 'SUCCESS' | 'FAILURE';
}

const AuditLogView: React.FC = () => {
  const { t, locale } = useLanguage();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (data) {
      setLogs(data.map((log: any) => ({
        id: log.id, action: log.action, user: log.performed_by || 'System', role: 'User',
        timestamp: new Date(log.created_at).toLocaleString('ar-EG'),
        details: JSON.stringify(log.details), ipAddress: log.ip_address || 'N/A',
        userAgent: 'N/A', module: log.target_resource || 'System', status: 'SUCCESS'
      })));
    }
  };

  const actionStats = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.ipAddress.includes(searchQuery);
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    
    let matchesDate = true;
    if (dateRange.start) matchesDate = matchesDate && new Date(log.timestamp) >= new Date(dateRange.start);
    if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(log.timestamp) <= endDate;
    }

    return matchesSearch && matchesAction && matchesStatus && matchesDate;
  });

  const handleExport = () => {
    const headers = ['ID', 'Action', 'User', 'Timestamp', 'Details', 'IP Address', 'Status'];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.action,
        `"${log.user}"`,
        log.timestamp,
        `"${log.details}"`,
        log.ipAddress,
        log.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit_log.csv';
    link.click();
  };

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="${locale === 'ar' ? 'rtl' : 'ltr'}">
          <head>
            <title>${t('auditLogTitle')}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: start; font-size: 12px; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
              .status-success { color: green; }
              .status-failure { color: red; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${t('auditLogTitle')}</h2>
              <p>${new Date().toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>${t('timestamp')}</th>
                  <th>${t('user')}</th>
                  <th>${t('action')}</th>
                  <th>${t('details')}</th>
                  <th>${t('ipAddress')}</th>
                  <th>${t('status')}</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLogs.map(log => `
                  <tr>
                    <td>${log.timestamp}</td>
                    <td>${log.user}</td>
                    <td>${t(log.action.toLowerCase())}</td>
                    <td>${log.details}</td>
                    <td>${log.ipAddress}</td>
                    <td class="${log.status === 'SUCCESS' ? 'status-success' : 'status-failure'}">${t(log.status.toLowerCase())}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'text-blue-600 bg-blue-50';
      case 'LOGOUT': return 'text-slate-500 bg-slate-100';
      case 'CREATE': return 'text-emerald-600 bg-emerald-50';
      case 'UPDATE': return 'text-amber-600 bg-amber-50';
      case 'DELETE': return 'text-rose-600 bg-rose-50';
      default: return 'text-indigo-600 bg-indigo-50';
    }
  };

  const getChartColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'bg-blue-500';
      case 'LOGOUT': return 'bg-slate-500';
      case 'CREATE': return 'bg-emerald-500';
      case 'UPDATE': return 'bg-amber-500';
      case 'DELETE': return 'bg-rose-500';
      default: return 'bg-indigo-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">{t('auditLogTitle')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('auditLogDesc')}</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
          <i className="fas fa-fingerprint"></i>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6">{t('actionDistribution')}</h3>
        <div className="flex items-end gap-4 h-40">
          {Object.entries(actionStats).map(([action, count]) => (
            <div key={action} className="flex-1 flex flex-col items-center gap-2 group">
               <div className="w-full bg-slate-50 rounded-t-xl relative h-full overflow-hidden">
                  <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${getChartColor(action)}`} 
                    style={{ height: `${(count / logs.length) * 100}%` }}
                  ></div>
               </div>
               <span className="text-[10px] font-bold text-slate-500">{t(action.toLowerCase())}</span>
               <span className="text-xs font-black text-slate-800">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div className="flex items-center gap-4 w-full">
                <div className="relative w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder={t('searchAudit')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 pr-10 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${showFilters ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                >
                  <i className="fas fa-filter"></i> تصفية متقدمة
                </button>
              </div>
              
              {showFilters && (
                <div className="flex flex-wrap gap-3 animate-fade-in bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <select
                      value={filterAction}
                      onChange={(e) => setFilterAction(e.target.value)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="ALL">{t('allActions')}</option>
                      <option value="LOGIN">{t('login')}</option>
                      <option value="CREATE">{t('create')}</option>
                      <option value="UPDATE">{t('update')}</option>
                      <option value="DELETE">{t('delete')}</option>
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="ALL">كل الحالات</option>
                      <option value="SUCCESS">ناجح</option>
                      <option value="FAILURE">فاشل</option>
                    </select>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-slate-400">من:</span>
                       <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-slate-400">إلى:</span>
                       <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                    </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={handleExportPdf}
                  className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-[10px] font-black shadow-sm hover:bg-rose-100 transition flex items-center gap-2"
                >
                  <i className="fas fa-file-pdf"></i> {t('exportPdf')}
                </button>
                <button 
                  onClick={handleExport}
                  className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-[10px] font-black shadow-sm hover:bg-emerald-100 transition flex items-center gap-2"
                >
                  <i className="fas fa-file-excel"></i> {t('exportAudit')}
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">{t('timestamp')}</th>
                <th className="px-8 py-5">{t('user')}</th>
                <th className="px-8 py-5">{t('action')}</th>
                <th className="px-8 py-5">{t('details')}</th>
                <th className="px-8 py-5">{t('ipAddress')}</th>
                <th className="px-8 py-5">{t('status')}</th>
                <th className="px-8 py-5">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6 text-xs font-bold text-slate-500" dir="ltr">{log.timestamp}</td>
                  <td className="px-8 py-6 font-bold text-slate-700">{log.user}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${getActionColor(log.action)}`}>
                      {t(log.action.toLowerCase())}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs font-medium text-slate-600">{log.details}</td>
                  <td className="px-8 py-6 text-xs font-mono text-slate-400">{log.ipAddress}</td>
                  <td className="px-8 py-6">
                    <span className={`flex items-center gap-1 text-[9px] font-black uppercase ${log.status === 'SUCCESS' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <i className={`fas ${log.status === 'SUCCESS' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                      {t(log.status.toLowerCase())}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                     <button onClick={() => setSelectedLog(log)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition">
                        <i className="fas fa-eye text-xs"></i>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
           <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                 <h3 className="text-xl font-black text-slate-800">تفاصيل العملية</h3>
                 <button onClick={() => setSelectedLog(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                    <i className="fas fa-times"></i>
                 </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">المستخدم</p>
                    <p className="text-sm font-bold text-slate-800">{selectedLog.user} <span className="text-xs text-slate-500 font-normal">({selectedLog.role})</span></p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">التوقيت</p>
                    <p className="text-sm font-bold text-slate-800" dir="ltr">{selectedLog.timestamp}</p>
                 </div>
                 <div className="space-y-1 col-span-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">التفاصيل</p>
                    <p className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedLog.details}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">IP Address</p>
                    <p className="text-sm font-mono font-bold text-slate-600">{selectedLog.ipAddress}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Module</p>
                    <p className="text-sm font-bold text-indigo-600">{selectedLog.module}</p>
                 </div>
                 <div className="space-y-1 col-span-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">User Agent</p>
                    <p className="text-xs font-mono text-slate-500 break-all">{selectedLog.userAgent}</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogView;