import React, { useState } from 'react';
import { BranchBudget } from './types';

const BranchBudgetManagement: React.FC = () => {
  const [branches] = useState<BranchBudget[]>([
    {
      id: 'BR-01',
      name: 'فرع القاهرة (التجمع الخامس)',
      allocated: 450000,
      spent: 412000,
      employeeCount: 120,
      status: 'WITHIN',
      breakdown: { base: 350000, ot: 45000, bonuses: 22000, penalties: 5000 }
    },
    {
      id: 'BR-02',
      name: 'فرع الإسكندرية (سموحة)',
      allocated: 220000,
      spent: 238000,
      employeeCount: 65,
      status: 'EXCEEDED',
      breakdown: { base: 180000, ot: 52000, bonuses: 8000, penalties: 2000 }
    },
    {
      id: 'BR-03',
      name: 'فرع المنصورة',
      allocated: 150000,
      spent: 142000,
      employeeCount: 40,
      status: 'WARNING',
      breakdown: { base: 120000, ot: 15000, bonuses: 10000, penalties: 3000 }
    }
  ]);

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Header Area */}
      <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
           <i className="fas fa-chart-line text-[20rem] -mr-20 -mt-20"></i>
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div>
            <h2 className="text-4xl font-black mb-4 leading-tight">مركز التحكم في ميزانيات الفروع</h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
              راقب استهلاك الميزانية لحظة بلحظة لكل فرع. قارن بين التكاليف التشغيلية وحلل أسباب الانحراف المالي لضمان الكفاءة القصوى.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
             <div className="bg-white/10 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">إجمالي الميزانية المرصودة</p>
                <h4 className="text-3xl font-black">٨٢٠,٠٠٠ <span className="text-sm">ج.م</span></h4>
             </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Branch Cards Grid */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-2xl font-black text-slate-800">تحليل فروع الشركة</h3>
              <div className="flex gap-2">
                 <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-50 transition shadow-sm">تعديل المخصصات</button>
                 <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg">إضافة فرع جديد</button>
              </div>
           </div>

           <div className="grid md:grid-cols-1 gap-6">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                   {branch.status === 'EXCEEDED' && (
                     <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                   )}
                   <div className="flex flex-col lg:flex-row justify-between gap-8">
                      <div className="space-y-4 lg:w-1/3">
                         <div className="flex items-center gap-4 flex-row-reverse">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                               <i className="fas fa-building-circle-check text-xl"></i>
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-slate-800">{branch.name}</h4>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{branch.employeeCount} موظف نشط</p>
                            </div>
                         </div>
                         
                         <div className="pt-4 border-t border-slate-50">
                            <div className="flex justify-between items-center flex-row-reverse mb-2">
                               <span className="text-[10px] font-black text-slate-400">استهلاك الميزانية</span>
                               <span className={`text-xs font-black ${branch.status === 'EXCEEDED' ? 'text-rose-500' : branch.status === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {Math.round((branch.spent / branch.allocated) * 100)}%
                               </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                className={`h-full transition-all duration-1000 ${branch.status === 'EXCEEDED' ? 'bg-rose-500' : branch.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min((branch.spent / branch.allocated) * 100, 100)}%` }}
                               ></div>
                            </div>
                         </div>
                      </div>

                      <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4 py-4 px-6 bg-slate-50/50 rounded-[2.5rem]">
                         <div className="text-center border-l border-slate-100 last:border-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">الراتب الأساسي</p>
                            <p className="text-sm font-black text-slate-700">{branch.breakdown.base.toLocaleString()}</p>
                         </div>
                         <div className="text-center border-l border-slate-100 last:border-0">
                            <p className="text-[9px] font-black text-rose-400 uppercase mb-1">إضافي (OT)</p>
                            <p className="text-sm font-black text-rose-500">{branch.breakdown.ot.toLocaleString()}</p>
                         </div>
                         <div className="text-center border-l border-slate-100 last:border-0">
                            <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">الحوافز</p>
                            <p className="text-sm font-black text-emerald-500">{branch.breakdown.bonuses.toLocaleString()}</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">الميزانية الكلية</p>
                            <p className="text-sm font-black text-indigo-600">{branch.allocated.toLocaleString()}</p>
                         </div>
                      </div>

                      <div className="flex lg:flex-col justify-center gap-2">
                         <button className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition shadow-sm">
                            <i className="fas fa-eye"></i>
                         </button>
                         <button className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-600 hover:border-rose-200 transition shadow-sm">
                            <i className="fas fa-file-pdf"></i>
                         </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Financial Insights Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden">
              <i className="fas fa-lightbulb absolute -bottom-6 -left-6 text-7xl opacity-20"></i>
              <h3 className="text-xl font-black mb-6">توصيات توفير التكلفة</h3>
              <div className="space-y-6">
                 <div className="flex gap-4 flex-row-reverse text-right">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                       <i className="fas fa-clock text-amber-300"></i>
                    </div>
                    <div>
                       <h5 className="text-sm font-black mb-1 text-indigo-100">تحجيم الـ OT في سموحة</h5>
                       <p className="text-[10px] font-medium leading-relaxed text-indigo-200">فرع الإسكندرية تخطى ميزانية الإضافي بـ ٤٢٪. نقترح تعديل جدول الورديات لتقليل الاعتماد على الساعات الإضافية.</p>
                    </div>
                 </div>
                 <div className="flex gap-4 flex-row-reverse text-right">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                       <i className="fas fa-users-gear text-emerald-300"></i>
                    </div>
                    <div>
                       <h5 className="text-sm font-black mb-1 text-indigo-100">كفاءة فرع القاهرة</h5>
                       <p className="text-[10px] font-medium leading-relaxed text-indigo-200">أداء فرع القاهرة هو الأكثر استقراراً. يمكن نقل "أفضل ممارسات الإدارة" المتبعة هناك إلى فرع المنصورة.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BranchBudgetManagement;