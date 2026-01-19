import React from 'react';

const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">هيكلة النظام و API</h2>
          <p className="text-slate-400 text-sm mt-1">المخطط الهندسي وتوثيق الواجهات البرمجية.</p>
        </div>
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
          <i className="fas fa-network-wired"></i>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
         <h3 className="text-xl font-black text-slate-800 mb-8">مخطط البنية التحتية (System Architecture)</h3>
         
         <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
            {/* Connecting Lines (Visual only) */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 hidden md:block"></div>

            {/* Client Side */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm w-full md:w-64 text-center relative z-10">
               <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  <i className="fas fa-laptop-code"></i>
               </div>
               <h4 className="font-black text-slate-800">Frontend (Client)</h4>
               <p className="text-xs text-slate-500 mt-2">React.js + TypeScript</p>
               <p className="text-[10px] text-slate-400 mt-1">Tailwind CSS</p>
            </div>

            {/* API Gateway */}
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-lg w-full md:w-64 text-center relative z-10 text-white">
               <div className="w-16 h-16 bg-white/10 text-emerald-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  <i className="fas fa-server"></i>
               </div>
               <h4 className="font-black">API Gateway</h4>
               <p className="text-xs text-slate-400 mt-2">Node.js / Express</p>
               <p className="text-[10px] text-slate-500 mt-1">JWT Auth & Rate Limiting</p>
            </div>

            {/* Database */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm w-full md:w-64 text-center relative z-10">
               <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  <i className="fas fa-database"></i>
               </div>
               <h4 className="font-black text-slate-800">Database</h4>
               <p className="text-xs text-slate-500 mt-2">PostgreSQL / Supabase</p>
               <p className="text-[10px] text-slate-400 mt-1">Real-time Replication</p>
            </div>
         </div>
      </div>

      {/* API Documentation */}
      <div className="grid lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
               <i className="fas fa-code text-indigo-600"></i>
               نقاط الاتصال الرئيسية (Endpoints)
            </h3>
            <div className="space-y-4">
               {[
                 { method: 'POST', path: '/api/v1/auth/login', desc: 'تسجيل دخول الموظف واستلام Token' },
                 { method: 'GET', path: '/api/v1/employees', desc: 'جلب قائمة الموظفين (يدعم التصفية)' },
                 { method: 'POST', path: '/api/v1/attendance/check-in', desc: 'تسجيل حضور مع الموقع الجغرافي' },
                 { method: 'GET', path: '/api/v1/payroll/calculate', desc: 'حساب الرواتب الشهرية' },
               ].map((api, i) => (
                 <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${api.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{api.method}</span>
                       <span className="text-xs font-mono font-bold text-slate-700">{api.path}</span>
                    </div>
                    <p className="text-xs text-slate-500 mr-1">{api.desc}</p>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
               <i className="fas fa-shield-alt text-emerald-400"></i>
               معايير الأمان (Security Standards)
            </h3>
            <ul className="space-y-4">
               <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                  <div>
                     <h5 className="font-bold text-sm">تشفير البيانات (Encryption)</h5>
                     <p className="text-xs text-slate-400 mt-1">جميع البيانات الحساسة مشفرة باستخدام AES-256 في قاعدة البيانات.</p>
                  </div>
               </li>
               <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                  <div>
                     <h5 className="font-bold text-sm">المصادقة (Authentication)</h5>
                     <p className="text-xs text-slate-400 mt-1">استخدام JWT (JSON Web Tokens) مع صلاحية قصيرة وتجديد تلقائي.</p>
                  </div>
               </li>
               <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                  <div>
                     <h5 className="font-bold text-sm">الحماية من الهجمات</h5>
                     <p className="text-xs text-slate-400 mt-1">Rate Limiting, DDoS Protection, SQL Injection Prevention.</p>
                  </div>
               </li>
            </ul>
            
            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
               <p className="text-[10px] font-mono text-emerald-300 mb-2">// Example Response Structure</p>
               <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto">
{`{
  "status": "success",
  "data": {
    "id": "EMP-101",
    "role": "ADMIN",
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
}`}
               </pre>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ArchitectureView;