import React, { useState } from 'react';
import { SubscriptionPlan } from './types';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  paymentMethod?: string;
}

const BillingManagement: React.FC = () => {
  const plans: SubscriptionPlan[] = [
    { id: 'p1', name: 'الباقة البرونزية', price: 950, features: ['حضور وانصراف أساسي', 'تقارير شهرية', 'دعم عبر البريد'], recommended: false },
    { id: 'p2', name: 'الباقة الفضية', price: 2500, features: ['لوحة تحكم المحاسب', 'تنبيهات الغش الذكية', 'تعدد الفروع (حتى 3)'], recommended: true },
    { id: 'p3', name: 'الباقة الماسية', price: 6000, features: ['دعم فني 24/7', 'ربط مباشر مع Payroll', 'عدد غير محدود من الفروع'], recommended: false },
  ];

  const [invoices] = useState<Invoice[]>([
    { id: '1', invoiceNumber: 'INV-2024-001', clientName: 'مجموعة طلعت مصطفى', amount: 6000, issueDate: '2024-03-01', dueDate: '2024-03-15', status: 'Paid', paymentMethod: 'Bank Transfer' },
    { id: '2', invoiceNumber: 'INV-2024-002', clientName: 'سلسلة مطاعم بازوكا', amount: 2500, issueDate: '2024-03-05', dueDate: '2024-03-20', status: 'Paid', paymentMethod: 'Credit Card' },
    { id: '3', invoiceNumber: 'INV-2024-003', clientName: 'أوراسكوم للإنشاءات', amount: 950, issueDate: '2024-03-10', dueDate: '2024-03-25', status: 'Unpaid' },
    { id: '4', invoiceNumber: 'INV-2024-004', clientName: 'مكتبة الاستقلال', amount: 950, issueDate: '2024-02-01', dueDate: '2024-02-15', status: 'Overdue' }
  ]);

  const handleDownloadInvoice = (invoiceNumber: string) => {
    alert(`جاري تحميل الفاتورة ${invoiceNumber} بصيغة PDF...`);
  };

  return (
    <div className="space-y-12 animate-fade-in" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">التمويل والاشتراكات</h2>
          <p className="text-slate-500 font-medium">إدارة تدفقاتك النقدية وبوابات الدفع في مصر</p>
        </div>
        <div className="flex space-x-reverse space-x-3">
           <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex items-center">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-2"></div>
             <span className="text-[10px] font-black text-emerald-700 uppercase">بوابة الدفع نشطة (EGP)</span>
           </div>
        </div>
      </div>

      {/* عرض خطط الأسعار للمشترين */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative p-8 rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${plan.recommended ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 text-slate-800'}`}>
            {plan.recommended && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">الأكثر طلباً بمصر</span>
            )}
            <h3 className="text-xl font-black mb-2">{plan.name}</h3>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-black">{plan.price.toLocaleString()}</span>
              <span className={`text-xs font-bold mr-1 ${plan.recommended ? 'text-indigo-200' : 'text-slate-400'}`}>ج.م / شهرياً</span>
            </div>
            <ul className="space-y-4 mb-10">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start text-sm">
                  <i className={`fas fa-check-circle ml-3 mt-1 ${plan.recommended ? 'text-indigo-300' : 'text-emerald-500'}`}></i>
                  <span className={plan.recommended ? 'text-indigo-50' : 'text-slate-600 font-medium'}>{feature}</span>
                </li>
              ))}
            </ul>
            <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-lg ${plan.recommended ? 'bg-white text-indigo-600 hover:bg-slate-50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
              اشترك الآن
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* سجل المعاملات الأخيرة */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden order-2 lg:order-1">
           <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-800">سجل الفواتير والمدفوعات</h3>
              <button className="text-indigo-600 text-[10px] font-black uppercase hover:underline">مشاهدة الكشف الكامل</button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">رقم الفاتورة</th>
                    <th className="px-8 py-5">الشركة</th>
                    <th className="px-8 py-5">المبلغ</th>
                    <th className="px-8 py-5">الحالة</th>
                    <th className="px-8 py-5">تاريخ الاستحقاق</th>
                    <th className="px-8 py-5 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {invoices.map((inv) => (
                     <tr key={inv.id} className="hover:bg-slate-50 transition">
                       <td className="px-8 py-6 font-mono text-xs text-slate-400">{inv.invoiceNumber}</td>
                       <td className="px-8 py-6 font-bold text-slate-700">{inv.clientName}</td>
                       <td className="px-8 py-6 font-black text-slate-800">{inv.amount.toLocaleString()} ج.م</td>
                       <td className="px-8 py-6">
                         <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                           inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                           inv.status === 'Unpaid' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                         }`}>
                           {inv.status === 'Paid' ? 'مدفوعة' : inv.status === 'Unpaid' ? 'غير مدفوعة' : 'متأخرة'}
                         </span>
                       </td>
                       <td className="px-8 py-6 text-xs text-slate-400 font-medium">{inv.dueDate}</td>
                       <td className="px-8 py-6 text-left">
                          <button onClick={() => handleDownloadInvoice(inv.invoiceNumber)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition">
                             <i className="fas fa-download"></i>
                          </button>
                       </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>

        {/* بوابات الدفع المتاحة */}
        <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
           <h3 className="font-black text-slate-800 flex items-center">
             <i className="fas fa-server ml-3 text-indigo-500"></i> إعدادات الدفع (Egypt Local)
           </h3>
           <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-300 transition">
                 <div className="flex items-center space-x-reverse space-x-4">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                     <i className="fas fa-credit-card text-xl"></i>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-black text-slate-800">Fawry / Paymob</p>
                     <p className="text-[10px] text-emerald-500 font-bold">متصل (مدفوعات محلية)</p>
                   </div>
                 </div>
                 <i className="fas fa-chevron-left text-slate-200 group-hover:text-indigo-400 transition"></i>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-300 transition">
                 <div className="flex items-center space-x-reverse space-x-4">
                   <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
                     <i className="fas fa-university text-xl"></i>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-black text-slate-800">تحويل بنكي (CIB/QNB)</p>
                     <p className="text-[10px] text-slate-400 font-bold">يدوي</p>
                   </div>
                 </div>
                 <i className="fas fa-cog text-slate-200 group-hover:text-indigo-400 transition"></i>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BillingManagement;