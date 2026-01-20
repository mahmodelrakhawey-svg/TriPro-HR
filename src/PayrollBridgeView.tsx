import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface PayrollBatch {
  realId?: string; // UUID from DB
  id: string;
  bankName: string;
  totalAmount: number;
  employeeCount: number;
  status: 'Pending' | 'Processing' | 'Completed';
  date: string;
}

interface BankTransfer {
  id: string;
  employeeName: string;
  accountNumber: string;
  amount: number;
  bank: string;
  status: 'Success' | 'Failed' | 'Pending';
  date: string;
  reference: string;
}

const PayrollBridgeView: React.FC = () => {
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Real Data from Supabase
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('payroll_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching batches:', error);
    else if (data) {
      setBatches(data.map((b: any) => ({
        realId: b.id,
        id: b.name, // Display Name
        bankName: 'CIB Egypt', // Default for now, can be added to DB later
        totalAmount: b.total_amount || 0,
        employeeCount: b.employee_count || 0,
        status: b.status === 'PAID' ? 'Completed' : b.status === 'PROCESSING' ? 'Processing' : 'Pending',
        date: b.payment_date || b.period_end || b.created_at.split('T')[0]
      })));
    }
    setIsLoading(false);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const [transfers] = useState<BankTransfer[]>([
    { id: 'TRX-001', employeeName: 'أحمد الشناوي', accountNumber: 'EG1234567890', amount: 15000, bank: 'CIB', status: 'Success', date: '2024-05-25', reference: 'REF-998877' },
    { id: 'TRX-002', employeeName: 'سارة فوزي', accountNumber: 'EG0987654321', amount: 12500, bank: 'QNB', status: 'Pending', date: '2024-05-25', reference: 'REF-998878' },
    { id: 'TRX-003', employeeName: 'كريم محمود', accountNumber: 'EG1122334455', amount: 8000, bank: 'CIB', status: 'Failed', date: '2024-05-24', reference: 'REF-998879' },
  ]);

  const filteredBatches = batches.filter(batch => 
    batch.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.bankName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateFile = (id: string) => {
    alert(`جاري إنشاء ملف التحويل البنكي (ACH/Swift) للدفعة ${id}...`);
    // هنا يمكن إضافة منطق إنشاء ملف CSV أو Excel الخاص بالبنك
  };

  const handleCreateBatch = async () => {
    const batchName = `BATCH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];
    
    // Insert into Supabase
    const { data, error } = await supabase.from('payroll_batches').insert({
      name: batchName,
      period_start: today,
      period_end: today,
      org_id: '00000000-0000-0000-0000-000000000000', // Default Company ID
      status: 'DRAFT'
    }).select().single();

    if (error) {
      alert('فشل إنشاء الدفعة: ' + error.message);
    } else if (data) {
      // ننتظر قليلاً لضمان انتهاء التريجر من العمل ثم نجلب الدفعة المحدثة
      setTimeout(async () => {
        const { data: updatedBatch } = await supabase
          .from('payroll_batches')
          .select('*')
          .eq('id', data.id)
          .single();
          
        if (updatedBatch) {
          const newBatch: PayrollBatch = {
            realId: updatedBatch.id,
            id: updatedBatch.name,
            bankName: 'CIB Egypt',
            totalAmount: updatedBatch.total_amount || 0,
            employeeCount: updatedBatch.employee_count || 0,
            status: 'Pending',
            date: updatedBatch.period_start
          };
          setBatches(prev => [newBatch, ...prev]);
        }
      }, 1000); // تأخير بسيط للسماح لقاعدة البيانات بالمعالجة
    }
  };

  const handleDeleteBatch = async (batch: PayrollBatch) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      if (batch.realId) {
        await supabase.from('payroll_batches').delete().eq('id', batch.realId);
      }
      setBatches(batches.filter(b => b.id !== batch.id));
    }
  };

  const handleStatusChange = (id: string, newStatus: PayrollBatch['status']) => {
    // TODO: Update status in DB
    setBatches(batches.map(batch => batch.id === id ? { ...batch, status: newStatus } : batch));
  };

  const handleExportBatches = () => {
    const headers = ['رقم الدفعة', 'البنك', 'الإجمالي', 'عدد الموظفين', 'التاريخ', 'الحالة'];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...filteredBatches.map(batch => [
        batch.id,
        `"${batch.bankName}"`,
        batch.totalAmount,
        batch.employeeCount,
        batch.date,
        batch.status === 'Completed' ? 'تم التحويل' : batch.status === 'Pending' ? 'معلق' : 'جاري المعالجة'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payroll_batches.csv';
    link.click();
  };

  const handleNotifyEmployees = (id: string) => {
    alert(`تم إرسال إشعارات (SMS/Email) لجميع الموظفين في الدفعة ${id} بنجاح!`);
  };

  const handleRecalculate = async (batch: PayrollBatch) => {
    if (!batch.realId) return;
    if (!window.confirm('هل أنت متأكد من إعادة احتساب الرواتب لهذه الدفعة؟ سيتم تحديث الخصومات بناءً على سجلات الحضور الحالية.')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('recalculate_batch_deductions', { 
        p_batch_id: batch.realId 
      });

      if (error) throw error;
      
      alert('تمت إعادة الاحتساب وتحديث الأرقام بنجاح');
      await fetchBatches(); // تحديث البيانات في الجدول
    } catch (error: any) {
      alert('فشل إعادة الاحتساب: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">جسر الرواتب (Payroll Bridge)</h2>
          <p className="text-blue-200 text-sm mt-1">إدارة ملفات تحويل الرواتب للبنوك والربط المباشر.</p>
        </div>
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
          <i className="fas fa-money-check-dollar"></i>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">إجمالي الرواتب المعلقة</p>
            <h3 className="text-3xl font-black text-slate-800">450,000 ج.م</h3>
         </div>
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">البنوك المتصلة</p>
            <h3 className="text-3xl font-black text-indigo-600">2</h3>
         </div>
         <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm">
            <p className="text-emerald-600 text-xs font-black uppercase tracking-widest mb-1">حالة النظام</p>
            <h3 className="text-3xl font-black text-emerald-800">جاهز للتحويل</h3>
         </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <h3 className="font-black text-lg text-slate-800 whitespace-nowrap">دفعات الرواتب (Batches)</h3>
                <div className="relative w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="بحث برقم الدفعة أو البنك..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 pr-10 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleExportBatches}
                className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-[10px] font-black shadow-sm hover:bg-emerald-100 transition flex items-center gap-2"
              >
                <i className="fas fa-file-excel"></i> تصدير Excel
              </button>
              <button 
                onClick={handleCreateBatch}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> إنشاء دفعة جديدة
              </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">رقم الدفعة</th>
                <th className="px-8 py-5">البنك</th>
                <th className="px-8 py-5">الإجمالي</th>
                <th className="px-8 py-5">الموظفين</th>
                <th className="px-8 py-5">التاريخ</th>
                <th className="px-8 py-5">الحالة</th>
                <th className="px-8 py-5">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && <tr><td colSpan={7} className="text-center py-8 text-slate-400">جاري تحميل البيانات...</td></tr>}
              {!isLoading && batches.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">لا توجد دفعات رواتب مسجلة</td></tr>}
              
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6 font-mono text-xs font-bold text-slate-500">{batch.id}</td>
                  <td className="px-8 py-6 font-bold text-slate-700">{batch.bankName}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{batch.totalAmount.toLocaleString()} ج.م</td>
                  <td className="px-8 py-6 text-sm text-slate-500">{batch.employeeCount}</td>
                  <td className="px-8 py-6 text-sm text-slate-500">{batch.date}</td>
                  <td className="px-8 py-6">
                    <select
                      value={batch.status}
                      onChange={(e) => handleStatusChange(batch.id, e.target.value as PayrollBatch['status'])}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black border-none outline-none cursor-pointer appearance-none text-center w-full transition-colors ${
                        batch.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 
                        batch.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <option value="Pending">معلق</option>
                      <option value="Processing">جاري المعالجة</option>
                      <option value="Completed">تم التحويل</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleGenerateFile(batch.id)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg transition"
                        >
                            <i className="fas fa-file-export"></i> ملف البنك
                        </button>
                        {batch.status === 'Pending' && (
                          <button 
                              onClick={() => handleRecalculate(batch)}
                              className="text-amber-600 hover:text-amber-800 text-xs font-bold flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg transition"
                              title="تحديث الخصومات والإضافي من سجلات الحضور"
                          >
                              <i className="fas fa-calculator"></i> إعادة احتساب
                          </button>
                        )}
                        {batch.status === 'Completed' && (
                          <button 
                              onClick={() => handleNotifyEmployees(batch.id)}
                              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg transition"
                          >
                              <i className="fas fa-bell"></i> إشعار
                          </button>
                        )}
                        <button 
                            onClick={() => handleDeleteBatch(batch)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-lg transition"
                        >
                            <i className="fas fa-trash-can"></i> حذف
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* سجل التحويلات التفصيلي */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
           <h3 className="font-black text-lg text-slate-800">سجل التحويلات البنكية التفصيلي</h3>
           <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">آخر تحديث: الآن</span>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-right">
              <thead>
                 <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">المرجع</th>
                    <th className="px-8 py-5">الموظف</th>
                    <th className="px-8 py-5">الحساب البنكي</th>
                    <th className="px-8 py-5">المبلغ</th>
                    <th className="px-8 py-5">البنك</th>
                    <th className="px-8 py-5">الحالة</th>
                    <th className="px-8 py-5">التاريخ</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {transfers.map(trx => (
                    <tr key={trx.id} className="hover:bg-slate-50/50 transition">
                       <td className="px-8 py-6 font-mono text-xs text-slate-500">{trx.reference}</td>
                       <td className="px-8 py-6 font-bold text-slate-700">{trx.employeeName}</td>
                       <td className="px-8 py-6 text-xs font-mono text-slate-500">{trx.accountNumber}</td>
                       <td className="px-8 py-6 font-black text-slate-800">{trx.amount.toLocaleString()} ج.م</td>
                       <td className="px-8 py-6 text-xs font-bold text-slate-600">{trx.bank}</td>
                       <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${
                             trx.status === 'Success' ? 'bg-emerald-100 text-emerald-600' :
                             trx.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                             {trx.status === 'Success' ? 'ناجح' : trx.status === 'Pending' ? 'قيد التنفيذ' : 'فشل'}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-xs text-slate-500">{trx.date}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollBridgeView;
