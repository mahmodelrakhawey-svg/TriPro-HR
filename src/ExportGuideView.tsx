
import React, { useState, useEffect } from 'react';

interface SyncRecord {
  id: string;
  employee: string;
  hours: number;
  integrity: number;
  status: 'READY' | 'SYNCING' | 'COMPLETED' | 'FAILED';
}

const ExportGuideView: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedERP, setSelectedERP] = useState<'tripro' | 'SAP' | 'Odoo' | 'Oracle'>('tripro');
  const [syncLogs, setSyncLogs] = useState<SyncRecord[]>([
    { id: 'REC-001', employee: 'أحمد الشناوي', hours: 172, integrity: 98, status: 'READY' },
    { id: 'REC-002', employee: 'سارة فوزي', hours: 162, integrity: 85, status: 'READY' },
    { id: 'REC-003', employee: 'كريم أشرف', hours: 180, integrity: 100, status: 'READY' },
  ]);

  const handlePushToERP = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // محاكاة مزامنة كل سجل على حدة
    let currentRecordIndex = 0;
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            setSyncLogs(prevLogs => prevLogs.map(log => ({ ...log, status: 'COMPLETED' })));
          }, 1000);
          return 100;
        }
        
        // تحديث حالة السجلات بصرياً أثناء التقدم
        if (prev % 30 === 0 && currentRecordIndex < syncLogs.length) {
            setSyncLogs(prevLogs => {
                const newLogs = [...prevLogs];
                newLogs[currentRecordIndex].status = 'SYNCING';
                return newLogs;
            });
            currentRecordIndex++;
        }
        
        return prev + 5;
      });
    }, 150);
  };

  return (
    <div className="space-y-10 animate-fade-in text-right" dir="rtl">
      {/* Hero Section with TriPro Branding */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
           <i className="fas fa-network-wired text-[25rem] -mr-32 -mt-32"></i>
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6 bg-blue-500/20 w-fit px-4 py-1 rounded-full border border-blue-400/30">
               <i className="fas fa-plug-circle-check text-blue-400 text-xs"></i>
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">tripro ERP Direct Connector v2.4</span>
            </div>
            <h2 className="text-4xl font-black mb-4 leading-tight">جسر البيانات المحاسبي <br/><span className="text-blue-400">Financial Sync Bridge</span></h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              يقوم هذا المحرك بمطابقة سجلات الحضور البيومترية مع دليل الحسابات في <strong className="text-white">tripro</strong>. يتم احتساب الرواتب والبدلات والمكافآت بناءً على "درجة النزاهة" المسجلة لكل موظف.
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-xl w-full lg:w-96 shadow-inner">
             <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                   <i className="fas fa-rocket"></i>
                </div>
                <div className="text-center">
                   <h4 className="text-xl font-black">حالة الربط البرمجي</h4>
                   <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Connected to tripro Cloud API</p>
                </div>
                <div className="w-full h-px bg-white/10"></div>
                <div className="grid grid-cols-2 gap-4 w-full">
                   <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase">دورة الرواتب</p>
                      <p className="text-sm font-black">مايو ٢٠٢٤</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase">السجلات الجاهزة</p>
                      <p className="text-sm font-black text-blue-400">{syncLogs.filter(l => l.status === 'READY').length}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Sync List & Mapping */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                 <h3 className="font-black text-xl text-slate-800">السجلات الجاهزة للترحيل المالي</h3>
                 <div className="flex gap-2">
                    <span className="text-[10px] font-black text-slate-400">آخر مزامنة: منذ ساعتين</span>
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-right">
                    <thead>
                       <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-8 py-5">الموظف (Reference)</th>
                          <th className="px-8 py-5 text-center">ساعات العمل</th>
                          <th className="px-8 py-5 text-center">معامل النزاهة</th>
                          <th className="px-8 py-5 text-left">حالة المزامنة</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {syncLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition">
                             <td className="px-8 py-6">
                                <p className="text-sm font-black text-slate-800">{log.employee}</p>
                                <p className="text-[9px] font-mono text-blue-600">{log.id}</p>
                             </td>
                             <td className="px-8 py-6 text-center font-bold text-slate-600">{log.hours} س</td>
                             <td className="px-8 py-6 text-center">
                                <span className="text-xs font-black text-emerald-600">{log.integrity}%</span>
                             </td>
                             <td className="px-8 py-6 text-left">
                                {log.status === 'READY' && <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase">جاهز</span>}
                                {log.status === 'SYNCING' && <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase animate-pulse">جاري الدفع...</span>}
                                {log.status === 'COMPLETED' && <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 justify-end"><i className="fas fa-check-double"></i> تم الترحيل</span>}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              
              <div className="p-8 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <i className="fas fa-info-circle text-blue-600"></i>
                    <p className="text-xs text-blue-800 font-medium">سيتم إنشاء قيد استحقاق في tripro لكل سجل أعلاه.</p>
                 </div>
                 <button className="text-blue-600 text-[10px] font-black uppercase hover:underline">مراجعة قواعد البيانات (Mapping)</button>
              </div>
           </div>

           {/* Technical Documentation Section */}
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                 <i className="fas fa-code text-blue-600"></i>
                 دليل مطوري tripro (Developer API)
              </h3>
              <div className="space-y-4">
                 <div className="p-6 bg-slate-900 rounded-[2.5rem] text-left font-mono text-[10px] text-blue-300 relative group">
                    <button className="absolute top-4 right-4 text-white/20 group-hover:text-white transition"><i className="fas fa-copy"></i></button>
                    <pre>
{`// Example API Call to Push Attendance
const syncToTriPro = async (data) => {
  const response = await fetch('https://api.tripro.erp/v1/payroll/sync', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_SECURE_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      batch_id: "BATCH_MAY_2024",
      records: data.map(r => ({
        emp_id: r.id,
        total_hours: r.hours,
        integrity_multiplier: r.integrity / 100
      }))
    })
  });
  return response.json();
};`}
                    </pre>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium px-4 leading-relaxed italic">
                    * ملاحظة: تأكد من تفعيل "Webhook" الحضور في إعدادات نظام tripro ERP لاستقبال التحديثات اللحظية.
                 </p>
              </div>
           </div>
        </div>

        {/* Sync Controls Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-4xl mb-6 shadow-inner transition-all duration-700 ${isExporting ? 'bg-blue-600 text-white animate-spin-slow shadow-[0_0_30px_rgba(37,99,235,0.3)]' : 'bg-slate-50 text-slate-300'}`}>
                 <i className={`fas ${isExporting ? 'fa-sync-alt' : 'fa-cloud-arrow-up'}`}></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">بدء مزامنة البيانات</h3>
              <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed px-4">
                سيتم تشفير البيانات وترحيلها مباشرة من <span className="font-bold text-blue-600">Supabase</span> إلى ميزانية الرواتب في tripro.
              </p>
              
              <div className="w-full space-y-4 px-2">
                 {isExporting ? (
                   <div className="space-y-4 w-full animate-fade-in">
                      <div className="flex justify-between items-center flex-row-reverse text-[10px] font-black text-slate-400">
                         <span>جاري الاتصال بقاعدة بيانات tripro...</span>
                         <span className="text-blue-600 font-mono">{exportProgress}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                         <div className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_10px_#2563eb] rounded-full" style={{ width: `${exportProgress}%` }}></div>
                      </div>
                      <p className="text-[9px] font-black text-blue-500 animate-pulse tracking-widest uppercase">Encryption: AES-256 Active</p>
                   </div>
                 ) : (
                   <button 
                    onClick={handlePushToERP}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all group flex items-center justify-center gap-3 border border-white/5"
                   >
                     <span>اعتماد وترحيل الدفعة</span>
                     <i className="fas fa-paper-plane group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"></i>
                   </button>
                 )}
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
              <h4 className="text-sm font-black text-blue-400 mb-4 flex items-center gap-2">
                 <i className="fas fa-shield-check"></i>
                 بروتوكول الأمان السحابي
              </h4>
              <ul className="space-y-3">
                 {[
                   'التشفير من طرف لطرف (E2EE)',
                   'مصادقة OAuth 2.0 مع tripro',
                   'حذف البيانات المؤقتة بعد المزامنة',
                   'سجل تدقيق كامل (Audit Log)'
                 ].map((item, i) => (
                   <li key={i} className="flex items-center gap-3 text-[10px] font-medium text-slate-400 flex-row-reverse">
                      <i className="fas fa-check-circle text-blue-500"></i>
                      <span>{item}</span>
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ExportGuideView;