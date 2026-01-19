import React, { useState, useRef } from 'react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  receiptUrl?: string;
}

const PettyCashManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 'EXP-001', description: 'شراء أحبار طابعة', amount: 1500, date: '2024-05-20', category: 'Office Supplies', status: 'Approved', requestedBy: 'أحمد الشناوي' },
    { id: 'EXP-002', description: 'ضيافة اجتماع عملاء', amount: 450, date: '2024-05-21', category: 'Hospitality', status: 'Pending', requestedBy: 'سارة فوزي' },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'General',
    requestedBy: '',
    receiptUrl: ''
  });

  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('يرجى رفع ملف صورة صحيح.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewExpense({ ...newExpense, receiptUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExpense = () => {
    if (newExpense.description && newExpense.amount) {
      const expense: Expense = {
        id: `EXP-${Date.now()}`,
        description: newExpense.description!,
        amount: newExpense.amount!,
        date: newExpense.date!,
        category: newExpense.category!,
        status: 'Pending',
        requestedBy: newExpense.requestedBy || 'محاسب النظام',
        receiptUrl: newExpense.receiptUrl
      };
      setExpenses([expense, ...expenses]);
      setIsAddModalOpen(false);
      setNewExpense({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'General', requestedBy: '', receiptUrl: '' });
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'الوصف', 'المبلغ', 'التاريخ', 'الفئة', 'طالب الصرف', 'الحالة'];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...expenses.map(expense => [
        expense.id,
        `"${expense.description}"`,
        expense.amount,
        expense.date,
        expense.category,
        `"${expense.requestedBy}"`,
        expense.status === 'Approved' ? 'معتمد' : expense.status === 'Pending' ? 'معلق' : 'مرفوض'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'petty_cash_report.csv';
    link.click();
  };

  const handleViewReceipt = (url: string) => {
    setViewReceiptUrl(url);
  };

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">المصروفات النثرية (Petty Cash)</h2>
          <p className="text-slate-500 text-sm mt-1">تتبع المصروفات اليومية الصغيرة والعهد.</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
          <i className="fas fa-wallet"></i>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
         <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-lg">
            <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">إجمالي المصروفات</p>
            <h3 className="text-3xl font-black">{totalSpent.toLocaleString()} ج.م</h3>
         </div>
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">عدد الطلبات المعلقة</p>
            <h3 className="text-3xl font-black text-slate-800">{expenses.filter(e => e.status === 'Pending').length}</h3>
         </div>
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">رصيد العهدة المتاح</p>
            <h3 className="text-3xl font-black text-emerald-600">5,000 ج.م</h3>
         </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-800">سجل المصروفات</h3>
            <div className="flex gap-3">
              <button 
                onClick={handleExport}
                className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-[10px] font-black shadow-sm hover:bg-emerald-100 transition flex items-center gap-2"
              >
                <i className="fas fa-file-excel"></i> تصدير Excel
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> تسجيل مصروف
              </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">الوصف</th>
                <th className="px-8 py-5">المبلغ</th>
                <th className="px-8 py-5">التاريخ</th>
                <th className="px-8 py-5">الفئة</th>
                <th className="px-8 py-5">طالب الصرف</th>
                <th className="px-8 py-5">الإيصال</th>
                <th className="px-8 py-5">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6 font-bold text-slate-700">{expense.description}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{expense.amount.toLocaleString()} ج.م</td>
                  <td className="px-8 py-6 text-sm text-slate-500">{expense.date}</td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500">{expense.category}</td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500">{expense.requestedBy}</td>
                  <td className="px-8 py-6">
                    {expense.receiptUrl ? (
                        <button onClick={() => handleViewReceipt(expense.receiptUrl!)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1">
                            <i className="fas fa-image"></i> عرض
                        </button>
                    ) : (
                        <span className="text-slate-300 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${
                      expense.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 
                      expense.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {expense.status === 'Approved' ? 'معتمد' : expense.status === 'Pending' ? 'معلق' : 'مرفوض'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تسجيل مصروف جديد</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">وصف المصروف</label>
                <input type="text" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">المبلغ (ج.م)</label>
                <input type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">التاريخ</label>
                <input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الفئة</label>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="General">عام</option>
                  <option value="Office Supplies">أدوات مكتبية</option>
                  <option value="Hospitality">ضيافة</option>
                  <option value="Maintenance">صيانة</option>
                  <option value="Transport">انتقالات</option>
                </select>
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">صورة الإيصال</label>
                <div className="flex items-center gap-4">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-grow py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-100 transition flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-camera"></i> {newExpense.receiptUrl ? 'تغيير الصورة' : 'رفع صورة الإيصال'}
                    </button>
                    {newExpense.receiptUrl && (
                        <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden shrink-0 relative group">
                            <img src={newExpense.receiptUrl} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setNewExpense({...newExpense, receiptUrl: ''})}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}
                </div>
              </div>

              <button onClick={handleAddExpense} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4">حفظ المصروف</button>
            </div>
          </div>
        </div>
      )}

      {viewReceiptUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setViewReceiptUrl(null)}>
           <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setViewReceiptUrl(null)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white transition"
              >
                 <i className="fas fa-times text-2xl"></i>
              </button>
              <img src={viewReceiptUrl} alt="Receipt Full" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain bg-white" />
           </div>
        </div>
      )}
    </div>
  );
};

export default PettyCashManagement;
