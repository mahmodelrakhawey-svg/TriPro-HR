import React from 'react';
import { SecurityAlert } from './types';

interface AlertCenterProps {
  alerts: SecurityAlert[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}

const AlertCenter: React.FC<AlertCenterProps> = ({ alerts = [], onResolve, onDelete }) => {
  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
       <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-black text-slate-800">مركز التنبيهات الأمنية</h2>
             <p className="text-slate-500 text-sm mt-1">مراقبة التهديدات والمخاطر النشطة.</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-xl">
             <i className="fas fa-bell"></i>
          </div>
       </div>

       <div className="space-y-4">
          {alerts.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-[3rem] border border-slate-100">
                <i className="fas fa-shield-check text-4xl text-emerald-200 mb-4"></i>
                <p className="text-slate-400 font-bold">النظام آمن بالكامل</p>
             </div>
          ) : (
             alerts.map(alert => (
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
    </div>
  );
};

export default AlertCenter;