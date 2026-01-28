import React, { useState } from 'react';
import { SecurityAlert } from './types';
import { Notification } from './DataContext';
import { supabase } from './supabaseClient';

interface AlertCenterProps {
  alerts: SecurityAlert[];
  notifications?: Notification[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onRefresh?: () => Promise<void>;
}

const AlertCenter: React.FC<AlertCenterProps> = ({ 
  alerts = [], 
  notifications = [], 
  onResolve, 
  onDelete,
  onMarkRead,
  onDeleteNotification,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'general'>('security');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleLeaveAction = async (notif: Notification, status: 'APPROVED' | 'REJECTED') => {
    if (!notif.related_id) return;

    try {
      const { error } = await supabase
        .from('leaves')
        .update({ status })
        .eq('id', notif.related_id);

      if (error) throw error;

      if (onMarkRead) onMarkRead(notif.id);
      if (onRefresh) await onRefresh();
      
      alert(`تم ${status === 'APPROVED' ? 'الموافقة على' : 'رفض'} الطلب بنجاح.`);
    } catch (error: any) {
      alert('حدث خطأ: ' + error.message);
    }
  };

  const filterByDate = (item: any) => {
    if (!dateRange.start && !dateRange.end) return true;
    
    // استخدام createdAt للتنبيهات (الذي أضفناه) أو created_at للإشعارات
    const itemDateStr = item.createdAt || item.created_at;
    if (!itemDateStr) return true;

    const itemDate = new Date(itemDateStr);
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    if (start && itemDate < start) return false;
    if (end && itemDate > end) return false;

    return true;
  };

  const displayedAlerts = safeAlerts.filter(filterByDate);
  const displayedNotifications = safeNotifications.filter(filterByDate);

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
       <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
             <h2 className="text-2xl font-black text-slate-800">مركز التنبيهات والإشعارات</h2>
             <p className="text-slate-500 text-sm mt-1">متابعة التنبيهات الأمنية والإشعارات العامة.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 px-2">التاريخ:</span>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 transition"
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 transition"
              />
           </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={handleRefresh}
               disabled={isRefreshing}
               className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition shadow-sm"
               title="تحديث البيانات"
             >
               <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
             </button>
             <div className="flex bg-slate-100 p-1.5 rounded-2xl">
             <button 
               onClick={() => setActiveTab('security')}
               className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'security' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-rose-600'}`}
             >
               <i className="fas fa-shield-halved"></i>
               <span>تنبيهات أمنية</span>
               {safeAlerts.filter(a => !a.isResolved).length > 0 && (
                 <span className="bg-white text-rose-500 px-2 py-0.5 rounded-full text-[9px]">{safeAlerts.filter(a => !a.isResolved).length}</span>
               )}
             </button>
             <button 
               onClick={() => setActiveTab('general')}
               className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
             >
               <i className="fas fa-bell"></i>
               <span>إشعارات عامة</span>
               {safeNotifications.filter(n => !n.is_read).length > 0 && (
                 <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-[9px]">{safeNotifications.filter(n => !n.is_read).length}</span>
               )}
             </button>
          </div>
       </div>
       </div>

       {activeTab === 'security' && (
       <div className="space-y-4">
          {displayedAlerts.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-[3rem] border border-slate-100">
                <i className="fas fa-shield-check text-4xl text-emerald-200 mb-4"></i>
                <p className="text-slate-400 font-bold">لا توجد تنبيهات في هذه الفترة</p>
             </div>
          ) : (
             displayedAlerts.map(alert => (
                <div key={alert.id} className={`p-6 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${alert.isResolved ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-rose-100 shadow-sm'}`}>
                   <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${alert.isResolved ? 'bg-slate-200 text-slate-400' : 'bg-rose-100 text-rose-600'}`}>
                         <i className={`fas ${alert.isResolved ? 'fa-check' : 'fa-triangle-exclamation'}`}></i>
                      </div>
                      <div>
                         <h4 className="font-black text-slate-800 text-sm">{alert.type}</h4>
                         <p className="text-xs text-slate-500 mt-1">{alert.description}</p>
                         <div className="flex gap-2 mt-2">
                            <span className="text-[9px] bg-slate-100 px-2 py-1 rounded-lg font-bold text-slate-500">{alert.employeeName}</span>
                            <span className="text-[9px] bg-slate-100 px-2 py-1 rounded-lg font-bold text-slate-500">{alert.timestamp}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      {!alert.isResolved && (
                         <button onClick={() => onResolve(alert.id)} className="px-6 py-2 bg-rose-500 text-white text-[10px] font-black rounded-xl hover:bg-rose-600 transition">
                            معالجة التهديد
                         </button>
                      )}
                      <button 
                        onClick={() => onDelete(alert.id)} 
                        className="w-9 h-9 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition"
                        title="حذف التنبيه"
                      >
                         <i className="fas fa-trash-can text-xs"></i>
                      </button>
                   </div>
                </div>
             ))
          )}
       </div>
       )}

       {activeTab === 'general' && (
         <div className="space-y-4">
            {displayedNotifications.length === 0 ? (
               <div className="text-center py-12 bg-white rounded-[3rem] border border-slate-100">
                  <i className="fas fa-bell-slash text-4xl text-slate-200 mb-4"></i>
                  <p className="text-slate-400 font-bold">لا توجد إشعارات في هذه الفترة</p>
               </div>
            ) : (
               displayedNotifications.map(notif => (
                  <div key={notif.id} className={`p-6 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${notif.is_read ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-indigo-100 shadow-sm'}`}>
                     <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${notif.is_read ? 'bg-slate-200 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>
                           <i className={`fas ${notif.is_read ? 'fa-envelope-open' : 'fa-envelope'}`}></i>
                        </div>
                        <div>
                           <h4 className="font-black text-slate-800 text-sm">{notif.title}</h4>
                           <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                           <div className="flex gap-2 mt-2">
                              <span className="text-[9px] bg-slate-100 px-2 py-1 rounded-lg font-bold text-slate-500">
                                {new Date(notif.created_at).toLocaleDateString('ar-EG')}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        {notif.type === 'LEAVE_REQUEST' && notif.related_id && !notif.is_read && (
                           <div className="flex gap-2 ml-2">
                              <button 
                                onClick={() => handleLeaveAction(notif, 'APPROVED')}
                                className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-xl hover:bg-emerald-600 transition flex items-center gap-1"
                              >
                                <i className="fas fa-check"></i> موافقة
                              </button>
                              <button 
                                onClick={() => handleLeaveAction(notif, 'REJECTED')}
                                className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black rounded-xl hover:bg-rose-600 transition flex items-center gap-1"
                              >
                                <i className="fas fa-times"></i> رفض
                              </button>
                           </div>
                        )}
                        {!notif.is_read && onMarkRead && (
                           <button onClick={() => onMarkRead(notif.id)} className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition">
                              تحديد كمقروء
                           </button>
                        )}
                        {onDeleteNotification && (
                          <button 
                            onClick={() => onDeleteNotification(notif.id)} 
                            className="w-9 h-9 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition"
                            title="حذف الإشعار"
                          >
                             <i className="fas fa-trash-can text-xs"></i>
                          </button>
                        )}
                     </div>
                  </div>
               ))
            )}
         </div>
       )}
    </div>
  );
};

export default AlertCenter;
