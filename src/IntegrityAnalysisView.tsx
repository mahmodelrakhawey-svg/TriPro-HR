import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { supabase } from './supabaseClient';

interface IntegrityRecord {
  id: string;
  name: string;
  department: string;
  score: number;
  violations: number;
  status: 'Excellent' | 'Good' | 'Risk';
}

const IntegrityAnalysisView: React.FC = () => {
  const { employees, alerts } = useData();
  const [records, setRecords] = useState<IntegrityRecord[]>([]);

  useEffect(() => {
    fetchIntegrityData();
  }, [employees, alerts]);

  const fetchIntegrityData = async () => {
    // جلب النقاط المحفوظة من قاعدة البيانات
    const { data: storedScores } = await supabase.from('integrity_scores').select('*');

    if (employees.length > 0) {
      const mappedRecords: IntegrityRecord[] = employees.map(emp => {
        const stored = storedScores?.find((s: any) => s.employee_id === emp.id);
        
        // إذا وجدت بيانات محفوظة استخدمها، وإلا احسبها افتراضياً
        if (stored) {
           return {
             id: emp.id, name: emp.name, department: emp.dep,
             score: stored.score, violations: stored.violations_count, status: stored.status as any
           };
        } else {
           const safeAlerts = Array.isArray(alerts) ? alerts : [];
           const empViolations = safeAlerts.filter(a => a.employeeName === emp.name).length;
           const score = Math.max(0, 100 - (empViolations * 10));
           let status: 'Excellent' | 'Good' | 'Risk' = 'Excellent';
           if (score < 90) status = 'Good';
           if (score < 70) status = 'Risk';
           return { id: emp.id, name: emp.name, department: emp.dep, score, violations: empViolations, status };
        }
      });
      setRecords(mappedRecords);
    }
  };

  const handleRecalculateAndSave = async () => {
    if (!employees.length) return;
    const updates = employees.map(emp => {
        const safeAlerts = Array.isArray(alerts) ? alerts : [];
        const empViolations = safeAlerts.filter(a => a.employeeName === emp.name).length;
        const score = Math.max(0, 100 - (empViolations * 10));
        let status = 'Excellent';
        if (score < 90) status = 'Good';
        if (score < 70) status = 'Risk';
        return { employee_id: emp.id, score, violations_count: empViolations, status };
    });

    const { error } = await supabase.from('integrity_scores').upsert(updates, { onConflict: 'employee_id' });
    if (error) {
        alert('فشل الحفظ: ' + error.message);
    } else {
        alert('تم تحديث وحفظ سجلات النزاهة في قاعدة البيانات بنجاح.');
        fetchIntegrityData();
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter(record => 
    record.name.includes(searchQuery) || 
    record.id.includes(searchQuery) ||
    record.department.includes(searchQuery)
  );

  const excellentCount = records.filter(r => r.status === 'Excellent').length;
  const goodCount = records.filter(r => r.status === 'Good').length;
  const riskCount = records.filter(r => r.status === 'Risk').length;
  const totalCount = records.length || 1;
  const excellentPercentage = (excellentCount / totalCount) * 100;
  const goodPercentage = (goodCount / totalCount) * 100;
  const riskPercentage = (riskCount / totalCount) * 100;

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

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-around gap-8">
        <div className="text-right">
           <h3 className="text-xl font-black text-slate-800 mb-2">توزيع تصنيفات النزاهة</h3>
           <p className="text-slate-500 text-sm">نظرة عامة على مستويات المخاطر بين الموظفين.</p>
        </div>
        
        <div className="flex items-center gap-8">
            <div className="w-40 h-40 rounded-full relative shadow-inner shrink-0" style={{
                background: `conic-gradient(
                    #10b981 0% ${excellentPercentage}%, 
                    #3b82f6 ${excellentPercentage}% ${excellentPercentage + goodPercentage}%, 
                    #f43f5e ${excellentPercentage + goodPercentage}% 100%
                )`
            }}>
                <div className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black text-slate-400">الإجمالي</span>
                    <span className="text-slate-800 text-xl font-black">{records.length}</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-slate-600">ممتاز ({Math.round(excellentPercentage)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-bold text-slate-600">جيد ({Math.round(goodPercentage)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span className="text-xs font-bold text-slate-600">خطر ({Math.round(riskPercentage)}%)</span>
                </div>
            </div>
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
            <button onClick={handleRecalculateAndSave} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg">
              <i className="fas fa-sync-alt"></i> تحديث وحفظ النقاط
            </button>
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