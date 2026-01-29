import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const ManagerRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. الحصول على هوية الموظف الحالي (المدير)
      const { data: currentEmp } = await supabase
        .from('employees')
        .select('id, role')
        .eq('auth_id', user.id)
        .single();

      if (!currentEmp) return;

      // 2. جلب الإجازات المعلقة للموظفين الذين يديرهم هذا المدير
      // نستخدم Inner Join للتأكد من أن الموظف يتبع هذا المدير
      let query = supabase
        .from('leaves')
        .select('*, employees!inner(id, first_name, last_name, job_title, avatar_url, manager_id)')
        .order('created_at', { ascending: false });

      // إذا لم يكن أدمن، فلتر الطلبات لتظهر فقط للموظفين التابعين له
      if (currentEmp.role !== 'admin') {
        query = query.eq('employees.manager_id', currentEmp.id);
      }

      if (filterStatus === 'PENDING') {
        query = query.eq('status', 'PENDING');
      } else if (filterStatus === 'COMPLETED') {
        query = query.in('status', ['APPROVED', 'REJECTED']);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setRequests(data.map((r: any) => ({
          id: r.id,
          type: r.type,
          startDate: r.start_date,
          endDate: r.end_date,
          reason: r.reason,
          status: r.status,
          employeeName: `${r.employees.first_name} ${r.employees.last_name || ''}`,
          employeeTitle: r.employees.job_title,
          avatarUrl: r.employees.avatar_url,
          requestDate: new Date(r.created_at).toLocaleDateString('ar-EG')
        })));
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('leaves')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // إرسال إشعار للموظف (اختياري - يمكن إضافته هنا)
      
      alert(`تم ${status === 'APPROVED' ? 'الموافقة على' : 'رفض'} الطلب بنجاح.`);
      fetchRequests(); // تحديث القائمة
    } catch (error: any) {
      alert('حدث خطأ: ' + error.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">طلباتي المعلقة</h2>
          <p className="text-slate-500 text-sm mt-1">مراجعة واعتماد طلبات الإجازة (للمديرين والأدمن).</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
          <i className="fas fa-inbox"></i>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
           <div className="flex items-center gap-4">
             <h3 className="font-black text-lg text-slate-800">قائمة الطلبات ({requests.length})</h3>
             <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setFilterStatus('PENDING')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${filterStatus === 'PENDING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>معلقة</button>
                <button onClick={() => setFilterStatus('COMPLETED')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${filterStatus === 'COMPLETED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>مكتملة</button>
                <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${filterStatus === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>الكل</button>
             </div>
           </div>
           <button onClick={fetchRequests} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-xl transition">
             <i className="fas fa-sync-alt"></i>
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">الموظف</th>
                <th className="px-8 py-5">نوع الطلب</th>
                <th className="px-8 py-5">التاريخ</th>
                <th className="px-8 py-5">المدة</th>
                <th className="px-8 py-5">السبب</th>
                <th className="px-8 py-5">الحالة</th>
                <th className="px-8 py-5">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">جاري التحميل...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">لا توجد طلبات للعرض</td></tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                           {req.avatarUrl ? (
                             <img src={req.avatarUrl} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <i className="fas fa-user text-slate-400"></i>
                           )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{req.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{req.employeeTitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black">إجازة {req.type}</span>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>{req.startDate}</span>
                        <i className="fas fa-arrow-left text-[10px] text-slate-300"></i>
                        <span>{req.endDate}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-600">
                       {Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} أيام
                    </td>
                    <td className="px-8 py-6 text-xs text-slate-500 max-w-xs truncate" title={req.reason}>{req.reason || '-'}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                        req.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {req.status === 'APPROVED' ? 'مقبول' : req.status === 'REJECTED' ? 'مرفوض' : 'معلق'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {req.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(req.id, 'APPROVED')}
                          className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-100 transition flex items-center gap-2"
                        >
                          <i className="fas fa-check"></i> موافقة
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'REJECTED')}
                          className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-rose-100 transition flex items-center gap-2"
                        >
                          <i className="fas fa-times"></i> رفض
                        </button>
                      </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold">تم اتخاذ الإجراء</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerRequestsView;
