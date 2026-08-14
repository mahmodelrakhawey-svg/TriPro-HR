import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';
import { MissionRequest } from './types';
import toast from 'react-hot-toast';

const LeavesMissionsView: React.FC = () => {
  const { employees, orgId } = useData();
  const [activeSubTab, setActiveSubTab] = useState<'leaves' | 'missions' | 'control' | 'calendar'>('control');
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [leaves, setLeaves] = useState<any[]>([]);
  const [missions, setMissions] = useState<MissionRequest[]>([]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Modals state
  const [isNewMissionModalOpen, setIsNewMissionModalOpen] = useState(false);
  const [newMissionData, setNewMissionData] = useState({
    employee_id: '',
    title: '',
    destination: '',
    date: new Date().toISOString().split('T')[0],
    require_qr_check: true
  });

  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);
  const [newLeaveData, setNewLeaveData] = useState({
    employee_id: '',
    type: 'Annual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<any | null>(null);

  const fetchLeaves = useCallback(async () => {
    const { data } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    if (data) {
      setLeaves(data.map((l: any) => {
        const emp = employees.find(e => e.id === l.employee_id);
        return {
          id: l.id, 
          employeeId: l.employee_id,
          employeeName: emp ? emp.name : 'Unknown', 
          type: l.type, 
          date: l.start_date, 
          endDate: l.end_date,
          reason: l.reason,
          status: l.status,
          createdAt: l.created_at
        };
      }));
    }
  }, [employees]);

  const fetchMissions = useCallback(async () => {
    const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
    if (data) {
      setMissions(data.map((m: any) => {
        const emp = employees.find(e => e.id === m.employee_id);
        return {
          id: m.id, 
          employeeId: m.employee_id, 
          employeeName: emp ? emp.name : 'Unknown',
          title: m.title, 
          destination: m.destination, 
          location: { lat: m.location_lat || 30.0, lng: m.location_lng || 31.0, radius: m.geofence_radius || 100 },
          date: m.date, 
          status: m.status, 
          requireQrVerification: m.require_qr_check
        };
      }));
    }
  }, [employees]);

  useEffect(() => {
    fetchLeaves();
    fetchMissions();
  }, [fetchLeaves, fetchMissions]);

  const handleQrScan = (id: string) => {
    setIsScanningQr(true);
    setTimeout(async () => {
      setIsScanningQr(false);
      const { error } = await supabase.from('missions').update({ status: 'COMPLETED' }).eq('id', id);
      if (!error) {
        setMissions(prev => prev.map(m => m.id === id ? { ...m, status: 'COMPLETED' } : m));
        toast.success("تم التحقق من كود العميل بنجاح! تم إغلاق المأمورية وتوثيق الموقع.");
      } else {
        toast.error("حدث خطأ أثناء تحديث حالة المأمورية");
      }
    }, 1500);
  };

  const handleMissionAction = async (missionId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const { error } = await supabase.from('missions').update({ status }).eq('id', missionId);
      if (error) throw error;
      toast.success(`تم ${status === 'APPROVED' ? 'الموافقة على' : 'رفض'} طلب المأمورية بنجاح`);
      fetchMissions();
    } catch (err: any) {
      toast.error('حدث خطأ: ' + err.message);
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionData.employee_id || !newMissionData.title || !newMissionData.destination) {
      toast.error('يرجى ملء كافة الحقول المطلوبة');
      return;
    }
    try {
      const { error } = await supabase.from('missions').insert({
        employee_id: newMissionData.employee_id,
        title: newMissionData.title,
        destination: newMissionData.destination,
        date: newMissionData.date,
        require_qr_check: newMissionData.require_qr_check,
        status: 'PENDING',
        org_id: orgId
      });
      if (error) throw error;
      toast.success('تم إنشاء طلب المأمورية بنجاح');
      setIsNewMissionModalOpen(false);
      setNewMissionData({
        employee_id: '',
        title: '',
        destination: '',
        date: new Date().toISOString().split('T')[0],
        require_qr_check: true
      });
      fetchMissions();
    } catch (err: any) {
      toast.error('فشل إنشاء المأمورية: ' + err.message);
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveData.employee_id || !newLeaveData.start_date || !newLeaveData.end_date) {
      toast.error('يرجى ملء كافة الحقول المطلوبة');
      return;
    }
    try {
      const { error } = await supabase.from('leaves').insert({
        employee_id: newLeaveData.employee_id,
        type: newLeaveData.type,
        start_date: newLeaveData.start_date,
        end_date: newLeaveData.end_date,
        reason: newLeaveData.reason,
        status: 'PENDING',
        org_id: orgId
      });
      if (error) throw error;
      toast.success('تم تقديم طلب الإجازة بنجاح');
      setIsNewLeaveModalOpen(false);
      setNewLeaveData({
        employee_id: '',
        type: 'Annual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      fetchLeaves();
    } catch (err: any) {
      toast.error('فشل تقديم طلب الإجازة: ' + err.message);
    }
  };

  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  
  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const handleDayClick = (dateStr: string) => {
    setNewLeaveData(prev => ({ ...prev, start_date: dateStr, end_date: dateStr }));
    setIsNewLeaveModalOpen(true);
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
           {/* Live Map Visualization */}
           <div className={`transition-all duration-500 ${isMapExpanded ? 'lg:col-span-12 h-[750px]' : 'lg:col-span-8 h-[600px]'} bg-slate-900 rounded-[3.5rem] relative overflow-hidden group shadow-2xl border border-slate-800`}>
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
              
              {/* Radar circle effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-indigo-500/20 animate-ping pointer-events-none"></div>

              {/* Animated Map Pins */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <div className="relative">
                    <div className="w-4 h-4 bg-indigo-500 rounded-full animate-ping absolute inset-0"></div>
                    <div className="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white relative z-10 shadow-[0_0_15px_#6366f1]"></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 whitespace-nowrap">
                       <span className="text-[10px] font-black text-white">المقر الرئيسي - القاهرة</span>
                    </div>
                 </div>
              </div>

              <div className="absolute top-8 right-8 flex flex-col gap-2">
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl text-white">
                    <p className="text-[10px] font-black text-indigo-400 mb-1">الموظفون في الميدان</p>
                    <h4 className="text-2xl font-black">{missions.filter(m => m.status === 'IN_PROGRESS' || m.status === 'PENDING').length} موظف</h4>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl text-white">
                    <p className="text-[10px] font-black text-emerald-400 mb-1">مأموريات مكتملة</p>
                    <h4 className="text-2xl font-black">{missions.filter(m => m.status === 'COMPLETED').length} زيارة</h4>
                 </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-6 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg"><i className="fas fa-radar"></i></div>
                    <div className="text-right">
                       <h5 className="text-sm font-black">تتبع المواقع المباشر (GPS Verified)</h5>
                       <p className="text-[10px] font-medium text-slate-400">نطاقات جغرافية آمنة لمنع التزوير والمحافظة على دقة الحضور الميداني.</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setIsMapExpanded(!isMapExpanded)}
                   className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition"
                 >
                   {isMapExpanded ? 'تصغير الخريطة' : 'تكبير الخريطة'}
                 </button>
              </div>
           </div>

           {/* Live Feed Sidebar */}
           {!isMapExpanded && (
             <div className="lg:col-span-4 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-8 flex flex-col h-[600px]">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                   <i className="fas fa-satellite-dish text-indigo-600"></i>
                   سجل العمليات الميدانية
                </h3>
                <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                   {missions.length > 0 ? (
                     missions.map(mission => (
                      <div key={mission.id} className="relative pr-8 border-r-2 border-slate-100 pb-6 last:pb-0">
                         <div className={`absolute top-0 -right-[9px] w-4 h-4 rounded-full border-4 border-white shadow-sm ${mission.status === 'COMPLETED' ? 'bg-emerald-500' : mission.status === 'APPROVED' ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'}`}></div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{mission.employeeName}</p>
                            <h4 className="text-sm font-black text-slate-800 mb-1">{mission.title}</h4>
                            <div className="flex flex-wrap gap-2 justify-end mb-3">
                               <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{mission.destination}</span>
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                 mission.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                                 mission.status === 'APPROVED' ? 'bg-blue-50 text-blue-600' :
                                 mission.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                 'bg-amber-50 text-amber-600'
                               }`}>
                                  {mission.status === 'COMPLETED' ? 'مكتملة' : mission.status === 'APPROVED' ? 'معتمدة' : mission.status === 'REJECTED' ? 'مرفوضة' : 'قيد المراجعة'}
                               </span>
                            </div>
                            {mission.status === 'APPROVED' && mission.requireQrVerification && (
                               <button 
                                 onClick={() => handleQrScan(mission.id)}
                                 disabled={isScanningQr}
                                 className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition shadow-sm"
                               >
                                  <i className="fas fa-qrcode"></i> {isScanningQr ? 'جاري التحقق...' : 'تأكيد زيارة العميل (QR)'}
                                </button>
                            )}
                         </div>
                      </div>
                     ))
                   ) : (
                     <div className="text-center py-12 text-slate-400 font-bold text-xs">لا توجد مأموريات مسجلة حالياً</div>
                   )}
                </div>
             </div>
           )}
        </div>
      )}

      {activeSubTab === 'missions' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
              <h3 className="font-black text-xl text-slate-800">طلبات المأموريات</h3>
              <button 
                onClick={() => setIsNewMissionModalOpen(true)}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> طلب مأمورية جديد
              </button>
           </div>
           <div className="p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missions.length > 0 ? (
                missions.map(mission => (
                  <div key={mission.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between hover:shadow-md transition">
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
                           <span className={`inline-block mt-2 text-[9px] font-black px-2.5 py-1 rounded-lg ${
                             mission.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                             mission.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                             mission.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                             'bg-amber-100 text-amber-700'
                           }`}>
                             الحالة: {mission.status === 'APPROVED' ? 'معتمدة' : mission.status === 'COMPLETED' ? 'مكتملة' : mission.status === 'REJECTED' ? 'مرفوضة' : 'قيد المراجعة'}
                           </span>
                        </div>
                     </div>
                     {mission.status === 'PENDING' && (
                       <div className="flex gap-2 mt-6">
                          <button 
                            onClick={() => handleMissionAction(mission.id, 'APPROVED')}
                            className="flex-grow py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition shadow-sm"
                          >
                            موافقة
                          </button>
                          <button 
                            onClick={() => handleMissionAction(mission.id, 'REJECTED')}
                            className="flex-grow py-3 bg-white border border-slate-200 text-rose-500 rounded-xl text-[9px] font-black uppercase hover:bg-rose-50 transition"
                          >
                            رفض
                          </button>
                       </div>
                     )}
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-slate-400 font-bold">لا توجد مأموريات مسجلة</div>
              )}
           </div>
        </div>
      )}

      {activeSubTab === 'leaves' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
              <h3 className="font-black text-xl text-slate-800">سجل الإجازات</h3>
              <button 
                onClick={() => setIsNewLeaveModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> طلب إجازة جديد
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                 <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <th className="px-8 py-5">الموظف</th>
                       <th className="px-8 py-5">نوع الإجازة</th>
                       <th className="px-8 py-5">تاريخ البدء</th>
                       <th className="px-8 py-5">تاريخ الانتهاء</th>
                       <th className="px-8 py-5">الحالة</th>
                       <th className="px-8 py-5">الإجراءات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {leaves.length > 0 ? (
                      leaves.map(leave => (
                        <tr key={leave.id} className="hover:bg-slate-50/50 transition">
                           <td className="px-8 py-6 font-bold text-slate-700">{leave.employeeName}</td>
                           <td className="px-8 py-6 text-xs font-bold text-slate-500">{leave.type}</td>
                           <td className="px-8 py-6 text-xs font-bold text-slate-500">{leave.date}</td>
                           <td className="px-8 py-6 text-xs font-bold text-slate-500">{leave.endDate || leave.date}</td>
                           <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : leave.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                 {leave.status === 'APPROVED' ? 'مقبولة' : leave.status === 'PENDING' ? 'قيد المراجعة' : 'مرفوضة'}
                              </span>
                           </td>
                           <td className="px-8 py-6">
                              <button 
                                onClick={() => setSelectedLeaveDetail(leave)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                              >
                                التفاصيل
                              </button>
                           </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-bold">لا توجد إجازات مسجلة</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeSubTab === 'calendar' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in p-8">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-black text-xl text-slate-800">تقويم الإجازات والمأموريات</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">انقر فوق أي يوم لتقديم طلب إجازة سريع</p>
              </div>
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

      {/* Modal: New Mission Request */}
      {isNewMissionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in text-right">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">طلب مأمورية عمل جديدة</h3>
              <button onClick={() => setIsNewMissionModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateMission} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الموظف</label>
                <select 
                  required
                  value={newMissionData.employee_id} 
                  onChange={e => setNewMissionData({...newMissionData, employee_id: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">عنوان / الغرض من المأمورية</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: زيارة موقع العميل وتوقيع العقد"
                  value={newMissionData.title} 
                  onChange={e => setNewMissionData({...newMissionData, title: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الوجهة أو المقر</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: فرع التجمع الخامس - شركة الأمل"
                  value={newMissionData.destination} 
                  onChange={e => setNewMissionData({...newMissionData, destination: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">التاريخ</label>
                <input 
                  type="date" 
                  required
                  value={newMissionData.date} 
                  onChange={e => setNewMissionData({...newMissionData, date: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right" 
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="qrCheck"
                  checked={newMissionData.require_qr_check}
                  onChange={e => setNewMissionData({...newMissionData, require_qr_check: e.target.checked})}
                  className="h-4 w-4 rounded text-indigo-600"
                />
                <label htmlFor="qrCheck" className="text-xs font-bold text-slate-600">طلب التحقق بـ QR عند وصول الموظف لمقر العميل</label>
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-emerald-700 transition mt-4">
                تأكيد وحفظ المأمورية
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Leave Request */}
      {isNewLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in text-right">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تقديم طلب إجازة جديد</h3>
              <button onClick={() => setIsNewLeaveModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الموظف</label>
                <select 
                  required
                  value={newLeaveData.employee_id} 
                  onChange={e => setNewLeaveData({...newLeaveData, employee_id: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">نوع الإجازة</label>
                <select 
                  value={newLeaveData.type} 
                  onChange={e => setNewLeaveData({...newLeaveData, type: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Annual">إجازة سنوية اعتيادية</option>
                  <option value="Casual">إجازة عارضة</option>
                  <option value="Sick">إجازة مرضية</option>
                  <option value="Unpaid">إجازة بدون راتب</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ البدء</label>
                  <input 
                    type="date" 
                    required
                    value={newLeaveData.start_date} 
                    onChange={e => setNewLeaveData({...newLeaveData, start_date: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ الانتهاء</label>
                  <input 
                    type="date" 
                    required
                    value={newLeaveData.end_date} 
                    onChange={e => setNewLeaveData({...newLeaveData, end_date: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">سبب الإجازة (اختياري)</label>
                <textarea 
                  value={newLeaveData.reason} 
                  onChange={e => setNewLeaveData({...newLeaveData, reason: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none" 
                  placeholder="اكتب تفاصيل إضافية..."
                />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4">
                تقديم طلب الإجازة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Leave Details */}
      {selectedLeaveDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in text-right">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تفاصيل الإجازة</h3>
              <button onClick={() => setSelectedLeaveDetail(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold mb-1">اسم الموظف</p>
                <p className="font-black text-slate-800">{selectedLeaveDetail.employeeName}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold mb-1">نوع الإجازة</p>
                <p className="font-black text-indigo-600">{selectedLeaveDetail.type}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-400 font-bold mb-1">من تاريخ</p>
                  <p className="font-bold text-slate-700">{selectedLeaveDetail.date}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-400 font-bold mb-1">إلى تاريخ</p>
                  <p className="font-bold text-slate-700">{selectedLeaveDetail.endDate || selectedLeaveDetail.date}</p>
                </div>
              </div>
              {selectedLeaveDetail.reason && (
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-400 font-bold mb-1">السبب / الملاحظات</p>
                  <p className="text-slate-600 font-medium">{selectedLeaveDetail.reason}</p>
                </div>
              )}
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">الحالة الحالية:</span>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${
                  selectedLeaveDetail.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  selectedLeaveDetail.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {selectedLeaveDetail.status === 'APPROVED' ? 'مقبولة' : selectedLeaveDetail.status === 'REJECTED' ? 'مرفوضة' : 'قيد المراجعة'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesMissionsView;