import React, { useState } from 'react';
import { useData } from './DataContext';
import { Employee } from './types';

const ReportsView: React.FC = () => {
  const { employees, shifts } = useData();
  const [reportType, setReportType] = useState<'attendance' | 'payroll' | 'performance' | 'custom' | 'shifts'>('attendance');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const availableFields = [
    { id: 'name', label: 'اسم الموظف' },
    { id: 'department', label: 'القسم' },
    { id: 'checkIn', label: 'وقت الحضور' },
    { id: 'checkOut', label: 'وقت الانصراف' },
    { id: 'overtime', label: 'ساعات الإضافي' },
    { id: 'deductions', label: 'الخصومات' },
    { id: 'status', label: 'الحالة' },
    { id: 'date', label: 'التاريخ' },
  ];

  // Mock data for charts/tables
  const attendanceData = [
    { day: 'الأحد', present: 45, absent: 2, late: 3 },
    { day: 'الإثنين', present: 48, absent: 0, late: 2 },
    { day: 'الثلاثاء', present: 46, absent: 1, late: 3 },
    { day: 'الأربعاء', present: 47, absent: 1, late: 2 },
    { day: 'الخميس', present: 44, absent: 3, late: 3 },
  ];

  const deptPerformance = [
    { name: 'المبيعات', score: 82, color: 'bg-indigo-500' },
    { name: 'التقنية', score: 94, color: 'bg-emerald-500' },
    { name: 'الموارد البشرية', score: 88, color: 'bg-amber-500' },
    { name: 'التسويق', score: 76, color: 'bg-rose-500' },
    { name: 'العمليات', score: 85, color: 'bg-blue-500' },
  ];

  const topEmployees = [
    { id: 1, name: 'أحمد الشناوي', role: 'Senior Developer', score: 98, dept: 'IT', avatar: 'https://i.pravatar.cc/150?img=11' },
    { id: 2, name: 'سارة فوزي', role: 'HR Manager', score: 96, dept: 'HR', avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: 3, name: 'كريم محمود', role: 'Sales Executive', score: 94, dept: 'Sales', avatar: 'https://i.pravatar.cc/150?img=12' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const toggleField = (id: string) => {
    if (selectedFields.includes(id)) {
      setSelectedFields(selectedFields.filter(f => f !== id));
    } else {
      setSelectedFields([...selectedFields, id]);
    }
  };

  // Logic for Shift Report
  const employeesWithoutShift = employees.filter((emp: any) => !emp.shift_id);
  const employeesWithShift = employees.filter((emp: any) => emp.shift_id);

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Header */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">التقارير والتحليلات</h2>
          <p className="text-slate-500 text-sm mt-1">مركز البيانات لاتخاذ القرارات الاستراتيجية.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 px-2">الفترة:</span>
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

           <button 
             onClick={handlePrint}
             className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:bg-slate-800 transition"
             title="طباعة التقرير"
           >
             <i className="fas fa-print"></i>
           </button>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar max-w-[300px] md:max-w-none">
           {['attendance', 'payroll', 'performance', 'shifts', 'custom'].map((type) => (
             <button
               key={type}
               onClick={() => setReportType(type as any)}
               className={`px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                 reportType === type ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'
               }`}
             >
               {type === 'attendance' ? 'الحضور' : type === 'payroll' ? 'الرواتب' : type === 'performance' ? 'الأداء' : type === 'shifts' ? 'الورديات' : 'مخصص'}
             </button>
           ))}
        </div>
        </div>
      </div>

      {reportType === 'shifts' && (
        <div className="space-y-8 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-users"></i></div>
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 mb-1">{employees.length}</h3>
                 <p className="text-slate-400 text-xs font-bold">إجمالي الموظفين</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-user-check"></i></div>
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 mb-1">{employeesWithShift.length}</h3>
                 <p className="text-slate-400 text-xs font-bold">موظفين معينين في ورديات</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-user-xmark"></i></div>
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 mb-1">{employeesWithoutShift.length}</h3>
                 <p className="text-slate-400 text-xs font-bold">موظفين بدون وردية (Unassigned)</p>
              </div>
           </div>

           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="font-black text-lg text-slate-800">قائمة الموظفين غير المعينين في ورديات</h3>
                 <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black">{employeesWithoutShift.length} موظف</span>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-right">
                    <thead>
                       <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-8 py-5">الموظف</th>
                          <th className="px-8 py-5">القسم</th>
                          <th className="px-8 py-5">المسمى الوظيفي</th>
                          <th className="px-8 py-5">الحالة</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {employeesWithoutShift.length === 0 ? (
                          <tr>
                             <td colSpan={4} className="text-center py-8 text-slate-400 text-xs font-bold">جميع الموظفين لديهم ورديات معينة. ممتاز!</td>
                          </tr>
                       ) : (
                          employeesWithoutShift.map((emp: Employee) => (
                             <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-8 py-6 font-bold text-slate-700 flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                      {emp.avatarUrl ? <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" /> : <i className="fas fa-user text-slate-400 text-xs"></i>}
                                   </div>
                                   {emp.name}
                                </td>
                                <td className="px-8 py-6 text-xs font-bold text-slate-500">{emp.dep}</td>
                                <td className="px-8 py-6 text-xs font-bold text-slate-500">{emp.title}</td>
                                <td className="px-8 py-6">
                                   <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[9px] font-black">بدون وردية</span>
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {reportType === 'custom' ? (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800">منشئ التقارير المخصص</h3>
                <button className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition">
                    <i className="fas fa-rotate-right ml-2"></i> إعادة تعيين
                </button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-10">
                <div>
                    <h4 className="font-bold text-slate-700 mb-4 text-sm">1. اختر الحقول للعرض</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {availableFields.map(field => (
                            <label key={field.id} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${selectedFields.includes(field.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}>
                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${selectedFields.includes(field.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                    {selectedFields.includes(field.id) && <i className="fas fa-check text-white text-[10px]"></i>}
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={selectedFields.includes(field.id)}
                                    onChange={() => toggleField(field.id)}
                                    className="hidden"
                                />
                                <span className={`text-xs font-bold ${selectedFields.includes(field.id) ? 'text-indigo-700' : 'text-slate-600'}`}>{field.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-slate-700 mb-4 text-sm">2. تصفية البيانات</h4>
                        <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">القسم</label>
                                <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-indigo-500">
                                    <option>الكل</option>
                                    <option>IT</option>
                                    <option>HR</option>
                                    <option>Sales</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">الحالة الوظيفية</label>
                                <select className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-indigo-500">
                                    <option>نشط</option>
                                    <option>إجازة</option>
                                    <option>مستقيل</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white text-center shadow-xl shadow-indigo-200">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl backdrop-blur-sm">
                            <i className="fas fa-wand-magic-sparkles"></i>
                        </div>
                        <h4 className="font-black text-lg mb-2">جاهز للإنشاء</h4>
                        <p className="text-indigo-100 text-xs mb-6">تم تحديد {selectedFields.length} عمود للتقرير.</p>
                        <button 
                            disabled={selectedFields.length === 0}
                            className="w-full py-4 bg-white text-indigo-600 rounded-xl font-black text-sm hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            توليد التقرير
                        </button>
                    </div>
                </div>
            </div>
        </div>
      ) : reportType === 'performance' ? (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-chart-line"></i></div>
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg">+5%</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">92%</h3>
                    <p className="text-slate-400 text-xs font-bold">متوسط الأداء العام</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-trophy"></i></div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">التقنية</h3>
                    <p className="text-slate-400 text-xs font-bold">القسم الأعلى أداءً</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-star"></i></div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">4.8/5</h3>
                    <p className="text-slate-400 text-xs font-bold">رضا الموظفين</p>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-slate-800">تحليل الأداء المقارن بين الأقسام</h3>
                    <div className="flex gap-2">
                        <button className="bg-white border border-slate-200 text-slate-500 px-3 py-2 rounded-xl text-[10px] font-black hover:text-indigo-600 transition">
                            <i className="fas fa-download"></i> PDF
                        </button>
                        <select className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer">
                            <option>الربع الحالي</option>
                            <option>الربع السابق</option>
                        </select>
                    </div>
                </div>
                
                <div className="space-y-6">
                    {deptPerformance.map((dept, i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-700">{dept.name}</span>
                                <span className="text-slate-500">{dept.score}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${dept.color} transition-all duration-1000`} style={{ width: `${dept.score}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
               <h3 className="text-xl font-black text-slate-800 mb-6">أفضل الموظفين أداءً (Top Performers)</h3>
               <div className="grid md:grid-cols-3 gap-6">
                  {topEmployees.map(emp => (
                     <div key={emp.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition group cursor-pointer">
                        <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                           <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition">{emp.name}</h4>
                           <p className="text-[10px] text-slate-500 font-bold">{emp.role}</p>
                           <div className="flex items-center gap-1 mt-1">
                              <i className="fas fa-star text-amber-400 text-[10px]"></i>
                              <span className="text-[10px] font-black text-slate-700">{emp.score}%</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
        </div>
      ) : reportType === 'attendance' || reportType === 'payroll' ? (
      <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
                  <i className="fas fa-users"></i>
               </div>
               <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg">+12%</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-1">94%</h3>
            <p className="text-slate-400 text-xs font-bold">معدل الالتزام بالحضور</p>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl">
                  <i className="fas fa-clock"></i>
               </div>
               <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-1 rounded-lg">-5%</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-1">142</h3>
            <p className="text-slate-400 text-xs font-bold">ساعات تأخير هذا الشهر</p>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl">
                  <i className="fas fa-coins"></i>
               </div>
               <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-lg">مستقر</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-1">450K</h3>
            <p className="text-slate-400 text-xs font-bold">إجمالي الرواتب المتوقعة</p>
         </div>
      </div>

      {/* Chart Section (CSS Based) */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
         <h3 className="text-xl font-black text-slate-800 mb-8">تحليل الحضور الأسبوعي</h3>
         <div className="flex items-end justify-between h-64 gap-4">
            {attendanceData.map((data, index) => (
               <div key={index} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                  <div className="relative w-full flex items-end justify-center gap-1 h-full">
                     <div className="w-3 bg-indigo-200 rounded-t-lg transition-all group-hover:bg-indigo-300" style={{ height: `${(data.present / 50) * 100}%` }}></div>
                     <div className="w-3 bg-rose-200 rounded-t-lg transition-all group-hover:bg-rose-300" style={{ height: `${(data.absent / 50) * 100}%` }}></div>
                     <div className="w-3 bg-amber-200 rounded-t-lg transition-all group-hover:bg-amber-300" style={{ height: `${(data.late / 50) * 100}%` }}></div>
                     
                     {/* Tooltip */}
                     <div className="absolute -top-12 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        حضور: {data.present} | غياب: {data.absent}
                     </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{data.day}</span>
               </div>
            ))}
         </div>
         <div className="flex justify-center gap-6 mt-8">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-200 rounded-full"></div><span className="text-xs font-bold text-slate-500">حضور</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-200 rounded-full"></div><span className="text-xs font-bold text-slate-500">غياب</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-200 rounded-full"></div><span className="text-xs font-bold text-slate-500">تأخير</span></div>
         </div>
      </div>
      </>
      ) : null}

      {/* Quick Actions */}
      {reportType !== 'custom' && reportType !== 'shifts' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-lg cursor-pointer hover:bg-indigo-700 transition">
            <div>
               <h4 className="text-lg font-black">تقرير الرواتب الشهري</h4>
               <p className="text-indigo-200 text-xs mt-1">تصدير بصيغة Excel للمراجعة المالية</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
               <i className="fas fa-file-invoice-dollar"></i>
            </div>
         </div>
         <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-lg cursor-pointer hover:bg-slate-800 transition">
            <div>
               <h4 className="text-lg font-black">سجل المخالفات والجزاءات</h4>
               <p className="text-slate-400 text-xs mt-1">تصدير بصيغة PDF للإدارة القانونية</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
               <i className="fas fa-gavel"></i>
            </div>
         </div>
      </div>
      )}
    </div>
  );
};

export default ReportsView;
