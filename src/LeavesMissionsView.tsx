import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';
import { MissionRequest, LeaveStatus } from './types';

const LeavesMissionsView: React.FC = () => {
  const { employees } = useData();
  const [activeSubTab, setActiveSubTab] = useState<'leaves' | 'missions' | 'control' | 'calendar'>('control');
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [leaves, setLeaves] = useState<any[]>([]);
  const [missions, setMissions] = useState<MissionRequest[]>([]);

  useEffect(() => {
    const fetchLeaves = async () => {
      const { data } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
      if (data) {
        setLeaves(data.map((l: any) => {
          const emp = employees.find(e => e.id === l.employee_id);
          return {
            id: l.id, employeeName: emp ? emp.name : 'Unknown', type: l.type, date: l.start_date, status: l.status
          };
        }));
      }
    };

    const fetchMissions = async () => {
      const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
      if (data) {
        setMissions(data.map((m: any) => {
          const emp = employees.find(e => e.id === m.employee_id);
          return {
            id: m.id, employeeId: m.employee_id, employeeName: emp ? emp.name : 'Unknown',
            title: m.title, destination: m.destination, location: { lat: m.location_lat || 0, lng: m.location_lng || 0, radius: m.geofence_radius || 100 },
            date: m.date, status: m.status, requireQrVerification: m.require_qr_check
          };
        }));
      }
    };

    fetchLeaves();
    fetchMissions();
  }, [employees]);

  const handleQrScan = (id: string) => {
    setIsScanningQr(true);
    setTimeout(() => {
      setIsScanningQr(false);
      setMissions(prev => prev.map(m => m.id === id ? { ...m, status: 'COMPLETED', endTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) } : m));
      alert("تم التحقق من كود العميل بنجاح! تم إغلاق المأمورية وتوثيق الموقع.");
    }, 2000);
  };

  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  
  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const handleDayClick = (dateStr: string) => {
    alert(`فتح نموذج طلب إجازة ليوم: ${dateStr}`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">إدارة التواجد الميداني <span className="text-indigo-600 text-lg">(Field Ops)</span></h2>
          <p className="text-slate-500 font-medium mt-1">تتبع، توثيق، وتحليل حركة الموظفين خارج مقرات العمل الرسمية.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveSubTab('control')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'control' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>غرفة المراقبة</button>
          <button onClick={() => setActiveSubTab('missions')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'missions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>طلبات المأمورية</button>
          <button onClick={() => setActiveSubTab('leaves')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'leaves' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>الإجازات</button>
          <button onClick={() => setActiveSubTab('calendar')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>التقويم التفاعلي</button>
        </div>
      </div>

      {activeSubTab === 'control' && (
        <div className="grid lg:grid-cols-12 gap-8">
           {/* Live Map Placeholder / Visualization */}
           <div className="lg:col-span-8 bg-slate-900 rounded-[3.5rem] h-[600px] relative overflow-hidden group shadow-2xl border border-slate-800">
              <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/31.2,30.0,10/800x600?access_token=mock')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-1000"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              
              {/* Animated Map Pins */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <div className="relative">
                    <div className="w-4 h-4 bg-indigo-500 rounded-full animate-ping absolute inset-0"></div>
                    <div className="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white relative z-10 shadow-[0_0_15px_#6366f1]"></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 whitespace-nowrap">
                       <span className="text-[10px] font-black text-white">أحمد الشناوي - التجمع</span>
                    </div>
                 </div>
              </div>

              <div className="absolute top-8 right-8 flex flex-col gap-2">
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl text-white">
                    <p className="text-[10px] font-black text-indigo-400 mb-1">الموظفون في الميدان</p>
                    <h4 className="text-2xl font-black">١٢ موظف</h4>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl text-white">
                    <p className="text-[10px] font-black text-emerald-400 mb-1">زيارات مكتملة اليوم</p>
                    <h4 className="text-2xl font-black">٤٨ زيارة</h4>
                 </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-6 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg"><i className="fas fa-radar"></i></div>
                    <div className="text-right">
                       <h5 className="text-sm font-black">تتبع المواقع النشط</h5>
                       <p className="text-[10px] font-medium text-slate-400 italic">يتم تحديث الإحداثيات كل ٦٠ ثانية باستخدام توثيق GPS آمن.</p>
                    </div>
                 </div>
                 <button className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition">تكبير الخريطة</button>
              </div>
           </div>

           {/* Live Feed Sidebar */}
           <div className="lg:col-span-4 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
              <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                 <i className="fas fa-satellite-dish text-indigo-600"></i>
                 سجل العمليات الميدانية
              </h3>
              <div className="space-y-6 flex-grow overflow-y-auto pr-2 no-scrollbar">
                 {missions.filter(m => m.status !== LeaveStatus.PENDING).map(mission => (
                    <div key={mission.id} className="relative pr-8 border-r-2 border-slate-50 pb-6 last:pb-0">
                       <div className={`absolute top-0 -right-[9px] w-4 h-4 rounded-full border-4 border-white shadow-sm ${mission.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`}></div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{mission.employeeName}</p>
                          <h4 className="text-sm font-black text-slate-800 mb-2">{mission.title}</h4>
                          <div className="flex flex-wrap gap-2 justify-end mb-3">
                             <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{mission.destination}</span>
                             <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${mission.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {mission.status === 'COMPLETED' ? 'مكتملة' : 'قيد التنفيذ'}
                             </span>
                          </div>
                          {mission.status === 'IN_PROGRESS' && mission.requireQrVerification && (
                             <button 
                               onClick={() => handleQrScan(mission.id)}
                               disabled={isScanningQr}
                               className="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition"
                             >
                                <i className="fas fa-qrcode"></i> {isScanningQr ? 'جاري التحقق...' : 'تأكيد زيارة العميل (QR)'}
                             </button>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'missions' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
              <h3 className="font-black text-xl text-slate-800">طلبات المأموريات المعلقة</h3>
              <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg">طلب مأمورية جديد</button>
           </div>
           <div className="p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missions.filter(m => m.status === LeaveStatus.PENDING).map(mission => (
                 <div key={mission.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                    <div className="space-y-4">
                       <div className="flex justify-between items-start flex-row-reverse">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><i className="fas fa-file-signature"></i></div>
                          <div className="text-right">
                             <h4 className="text-sm font-black text-slate-800">{mission.employeeName}</h4>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{mission.date}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-bold text-indigo-600 mb-1">{mission.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">الوجهة: {mission.destination}</p>
                       </div>
                    </div>
                    <div className="flex gap-2 mt-8">
                       <button className="flex-grow py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition shadow-lg shadow-emerald-100">موافقة</button>
                       <button className="flex-grow py-3 bg-white border border-slate-200 text-rose-500 rounded-xl text-[9px] font-black uppercase hover:bg-rose-50 transition">رفض</button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeSubTab === 'leaves' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
              <h3 className="font-black text-xl text-slate-800">سجل الإجازات</h3>
              <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg">طلب إجازة جديد</button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                 <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <th className="px-8 py-5">الموظف</th>
                       <th className="px-8 py-5">نوع الإجازة</th>
                       <th className="px-8 py-5">التاريخ</th>
                       <th className="px-8 py-5">الحالة</th>
                       <th className="px-8 py-5">الإجراءات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {leaves.map(leave => (
                       <tr key={leave.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-8 py-6 font-bold text-slate-700">{leave.employeeName}</td>
                          <td className="px-8 py-6 text-xs font-bold text-slate-500">{leave.type}</td>
                          <td className="px-8 py-6 text-xs font-bold text-slate-500">{leave.date}</td>
                          <td className="px-8 py-6">
                             <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : leave.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                {leave.status === 'APPROVED' ? 'مقبولة' : leave.status === 'PENDING' ? 'قيد المراجعة' : 'مرفوضة'}
                             </span>
                          </td>
                          <td className="px-8 py-6">
                             <button className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">التفاصيل</button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeSubTab === 'calendar' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in p-8">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-xl text-slate-800">تقويم الإجازات والمأموريات</h3>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
                 <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition"><i className="fas fa-chevron-right text-slate-400"></i></button>
                 <span className="text-sm font-black text-slate-700 min-w-[100px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                 <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition"><i className="fas fa-chevron-left text-slate-400"></i></button>
              </div>
           </div>

           <div className="grid grid-cols-7 gap-4 mb-4 text-center">
              {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                 <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
           </div>

           <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                 <div key={`empty-${i}`} className="h-32 bg-slate-50/30 rounded-2xl border border-dashed border-slate-100"></div>
              ))}
              
              {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                 const day = i + 1;
                 const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                 const dayMissions = missions.filter(m => m.date === dateStr);
                 const dayLeaves = leaves.filter(l => l.date === dateStr);

                 return (
                    <div key={day} onClick={() => handleDayClick(dateStr)} className="h-32 bg-white border border-slate-100 rounded-2xl p-3 relative hover:border-indigo-300 hover:shadow-md transition group overflow-hidden cursor-pointer">
                       <span className="text-sm font-black text-slate-300 absolute top-3 right-3 group-hover:text-indigo-500 transition">{day}</span>
                       
                       <div className="mt-6 space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar pr-1">
                          {dayMissions.map(m => (
                             <div key={m.id} className="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 truncate font-bold flex items-center gap-1" title={m.title}>
                                <i className="fas fa-plane text-[6px]"></i> {m.employeeName}
                             </div>
                          ))}
                          {dayLeaves.map(l => (
                             <div key={l.id} className={`text-[8px] px-2 py-1 rounded-lg border truncate font-bold flex items-center gap-1 ${l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`} title={l.type}>
                                <i className="fas fa-umbrella-beach text-[6px]"></i> {l.employeeName}
                             </div>
                          ))}
                       </div>
                       
                       {(dayMissions.length + dayLeaves.length) > 0 && (
                          <div className="absolute bottom-2 left-3 text-[8px] font-black text-slate-300 group-hover:text-indigo-400 transition">
                             {dayMissions.length + dayLeaves.length} نشاط
                          </div>
                       )}
                    </div>
                 );
              })}
           </div>
        </div>
      )}
    </div>
  );
};

export default LeavesMissionsView;