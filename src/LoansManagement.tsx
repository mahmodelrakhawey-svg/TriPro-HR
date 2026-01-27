import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';

interface Loan {
  id: string;
  employee_id: string;
  employee_name?: string;
  total_amount: number;
  monthly_installment: number;
  remaining_amount: number;
  start_date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  reason: string;
}

const LoansManagement: React.FC = () => {
  const { employees } = useData();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newLoan, setNewLoan] = useState({
    employee_id: '',
    total_amount: 0,
    monthly_installment: 0,
    start_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching loans:', error);
    } else if (data) {
      const formattedLoans = data.map((loan: any) => {
        const employee = employees.find(e => e.id === loan.employee_id);
        return {
          ...loan,
          employee_name: employee ? employee.name : 'موظف غير معروف'
        };
      });
      setLoans(formattedLoans);
    }
    setIsLoading(false);
  }, [employees]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleAddLoan = async () => {
    if (!newLoan.employee_id || newLoan.total_amount <= 0 || newLoan.monthly_installment <= 0) {
      // TODO: Replace with a toast notification
      console.error('يرجى ملء جميع البيانات بشكل صحيح');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from('loans').insert({
      org_id: '00000000-0000-0000-0000-000000000000', // Default Org
      employee_id: newLoan.employee_id,
      total_amount: newLoan.total_amount,
      monthly_installment: newLoan.monthly_installment,
      remaining_amount: newLoan.total_amount,
      start_date: newLoan.start_date,
      status: 'ACTIVE',
      reason: newLoan.reason
    });

    if (error) {
      console.error('فشل إضافة السلفة: ' + error.message);
    } else {
      console.log('تم إضافة السلفة بنجاح');
      setIsModalOpen(false);
      fetchLoans();
      setNewLoan({
        employee_id: '',
        total_amount: 0,
        monthly_installment: 0,
        start_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'ACTIVE' | 'REJECTED') => {
    if (!window.confirm(`هل أنت متأكد من ${newStatus === 'ACTIVE' ? 'قبول' : 'رفض'} هذا الطلب؟`)) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('loans')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('فشل تحديث الحالة: ' + error.message);
    } else {
      fetchLoans();
    }
    setIsLoading(false);
  };

  const totalLoaned = loans.reduce((sum, l) => sum + l.total_amount, 0);
  const totalRemaining = loans.reduce((sum, l) => sum + l.remaining_amount, 0);
  const activeLoansCount = loans.filter(l => l.status === 'ACTIVE').length;

  const filteredLoans = loans.filter(loan => 
    (loan.employee_name && loan.employee_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (loan.reason && loan.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة السلف (Loans)</h2>
          <p className="text-slate-500 text-sm mt-1">متابعة سلف الموظفين والأقساط المتبقية.</p>
        </div>
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
          <i className="fas fa-hand-holding-dollar"></i>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
         <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-lg">
            <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">إجمالي السلف النشطة</p>
            <h3 className="text-3xl font-black">{totalRemaining.toLocaleString()} ج.م</h3>
            <p className="text-[10px] mt-2 opacity-80">من أصل {totalLoaned.toLocaleString()} ج.م</p>
         </div>
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">عدد المستفيدين</p>
            <h3 className="text-3xl font-black text-slate-800">{activeLoansCount}</h3>
         </div>
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">نسبة السداد</p>
            <h3 className="text-3xl font-black text-emerald-600">
                {totalLoaned > 0 ? Math.round(((totalLoaned - totalRemaining) / totalLoaned) * 100) : 0}%
            </h3>
         </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-800">سجل السلف</h3>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2">
              <i className="fas fa-plus"></i> إضافة سلفة جديدة
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">الموظف</th>
                <th className="px-8 py-5">المبلغ الكلي</th>
                <th className="px-8 py-5">القسط الشهري</th>
                <th className="px-8 py-5">المتبقي</th>
                <th className="px-8 py-5">التقدم</th>
                <th className="px-8 py-5">الحالة</th>
                <th className="px-8 py-5">تاريخ البدء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && <tr><td colSpan={7} className="text-center py-8 text-slate-400">جاري تحميل البيانات...</td></tr>}
              {!isLoading && loans.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">لا توجد سلف مسجلة</td></tr>}
              {filteredLoans.map((loan) => {
                const progress = Math.round(((loan.total_amount - loan.remaining_amount) / loan.total_amount) * 100);
                return (
                <tr key={loan.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6 font-bold text-slate-700">{loan.employee_name}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{loan.total_amount.toLocaleString()} ج.م</td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600">{loan.monthly_installment.toLocaleString()} ج.م</td>
                  <td className="px-8 py-6 text-sm font-bold text-rose-600">{loan.remaining_amount.toLocaleString()} ج.م</td>
                  <td className="px-8 py-6 w-48">
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-1"><div className="bg-indigo-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
                    <span className="text-[9px] font-bold text-slate-400">{progress}% تم السداد</span>
                  </td>
                  <td className="px-8 py-6">
                    {loan.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(loan.id, 'ACTIVE')}
                          className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black hover:bg-emerald-100 transition"
                        >
                          قبول
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(loan.id, 'REJECTED')}
                          className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black hover:bg-rose-100 transition"
                        >
                          رفض
                        </button>
                      </div>
                    ) : (
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${loan.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : loan.status === 'ACTIVE' ? 'bg-blue-100 text-blue-600' : loan.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{loan.status === 'ACTIVE' ? 'نشطة' : loan.status === 'COMPLETED' ? 'خالصة' : loan.status === 'REJECTED' ? 'مرفوضة' : 'ملغاة'}</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-xs text-slate-500">{loan.start_date}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-800">تسجيل سلفة جديدة</h3><button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"><i className="fas fa-times"></i></button></div>
            <div className="space-y-4">
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">الموظف</label><select value={newLoan.employee_id} onChange={e => setNewLoan({...newLoan, employee_id: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"><option value="">اختر الموظف...</option>{employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}</select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-black text-slate-400 uppercase mb-2">مبلغ السلفة</label><input type="number" value={newLoan.total_amount} onChange={e => setNewLoan({...newLoan, total_amount: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"/></div><div><label className="block text-xs font-black text-slate-400 uppercase mb-2">القسط الشهري</label><input type="number" value={newLoan.monthly_installment} onChange={e => setNewLoan({...newLoan, monthly_installment: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"/></div></div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ البدء</label><input type="date" value={newLoan.start_date} onChange={e => setNewLoan({...newLoan, start_date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"/></div>
              <div><label className="block text-xs font-black text-slate-400 uppercase mb-2">سبب السلفة / ملاحظات</label><textarea value={newLoan.reason} onChange={e => setNewLoan({...newLoan, reason: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"/></div>
              <button onClick={handleAddLoan} disabled={isLoading} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4 disabled:opacity-70">{isLoading ? 'جاري الحفظ...' : 'حفظ السلفة'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansManagement;
