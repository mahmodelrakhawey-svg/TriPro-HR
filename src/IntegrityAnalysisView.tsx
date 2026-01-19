import React, { useState } from 'react';

interface IntegrityRecord {
  id: string;
  name: string;
  department: string;
  score: number;
  violations: number;
  status: 'Excellent' | 'Good' | 'Risk';
}

const IntegrityAnalysisView: React.FC = () => {
  const [records] = useState<IntegrityRecord[]>([
    { id: 'EMP-001', name: 'أحمد الشناوي', department: 'IT', score: 98, violations: 0, status: 'Excellent' },
    { id: 'EMP-002', name: 'سارة فوزي', department: 'HR', score: 95, violations: 0, status: 'Excellent' },
    { id: 'EMP-003', name: 'محمود حسن', department: 'Sales', score: 72, violations: 3, status: 'Risk' },
    { id: 'EMP-004', name: 'خالد إبراهيم', department: 'Sales', score: 88, violations: 1, status: 'Good' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter(record => 
    record.name.includes(searchQuery) || 
    record.id.includes(searchQuery) ||
    record.department.includes(searchQuery)
  );

  const handleExport = () => {
    const headers = ['ID', 'الموظف', 'القسم', 'نقاط النزاهة', 'المخالفات', 'التقييم'];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...records.map(rec => [
        rec.id,
        `"${rec.name}"`,
        rec.department,
        rec.score,
        rec.violations,
        rec.status === 'Excellent' ? 'ممتاز' : rec.status === 'Good' ? 'جيد' : 'خطر'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'integrity_report.csv';
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">تحليل النزاهة والسلوك</h2>
          <p className="text-slate-500 text-sm mt-1">تقييم مصداقية الموظفين بناءً على سجلات الحضور والمخالفات.</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
          <i className="fas fa-scale-balanced"></i>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
         <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100">
            <h3 className="text-emerald-800 font-black text-lg mb-1">92%</h3>
            <p className="text-emerald-600 text-xs font-bold">متوسط النزاهة العام</p>
         </div>
         <div className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100">
            <h3 className="text-rose-800 font-black text-lg mb-1">3</h3>
            <p className="text-rose-600 text-xs font-bold">موظفين في دائرة الخطر</p>
         </div>
         <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100">
            <h3 className="text-blue-800 font-black text-lg mb-1">12</h3>
            <p className="text-blue-600 text-xs font-bold">بلاغ سلوكي هذا الشهر</p>
         </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <h3 className="font-black text-lg text-slate-800 whitespace-nowrap">سجل تقييم الموظفين</h3>
                <div className="relative w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="بحث باسم الموظف..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 pr-10 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
            </div>
            <button 
              onClick={handleExport}
              className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-100 transition flex items-center gap-2"
            >
              <i className="fas fa-file-excel"></i> تصدير Excel
            </button>
         </div>
         <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">الموظف</th>
                <th className="px-8 py-5">القسم</th>
                <th className="px-8 py-5">نقاط النزاهة</th>
                <th className="px-8 py-5">المخالفات</th>
                <th className="px-8 py-5">التقييم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6 font-bold text-slate-700">{record.name}</td>
                  <td className="px-8 py-6 text-sm text-slate-500">{record.department}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-full h-2 w-24">
                            <div className={`h-2 rounded-full ${record.score > 90 ? 'bg-emerald-500' : record.score > 75 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${record.score}%` }}></div>
                        </div>
                        <span className="text-xs font-bold">{record.score}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-700">{record.violations}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${
                      record.status === 'Excellent' ? 'bg-emerald-100 text-emerald-600' : 
                      record.status === 'Good' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {record.status === 'Excellent' ? 'ممتاز' : record.status === 'Good' ? 'جيد' : 'خطر'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IntegrityAnalysisView;