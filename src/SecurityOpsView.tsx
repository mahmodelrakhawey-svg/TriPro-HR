import React, { useState, useEffect } from 'react';

interface Threat {
  id: string;
  source: string;
  destination: string;
  type: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const SecurityOpsView: React.FC = () => {
  const [threats, setThreats] = useState<Threat[]>([
    { id: 'T-101', source: '192.168.1.55 (Cairo)', destination: 'Server-A', type: 'DDoS Attempt', timestamp: 'Now', severity: 'CRITICAL' },
    { id: 'T-102', source: '10.0.0.12 (Alex)', destination: 'Database', type: 'SQL Injection', timestamp: '1m ago', severity: 'HIGH' },
    { id: 'T-103', source: 'Unknown (Proxy)', destination: 'Auth Gateway', type: 'Brute Force', timestamp: '3m ago', severity: 'MEDIUM' },
  ]);

  // Simulate incoming threats
  useEffect(() => {
    const interval = setInterval(() => {
      const newThreat: Threat = {
        id: `T-${Date.now()}`,
        source: `IP-${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        destination: 'Firewall',
        type: ['Port Scan', 'Malware', 'Phishing', 'DDoS'][Math.floor(Math.random() * 4)],
        timestamp: 'Now',
        severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)] as any
      };
      setThreats(prev => [newThreat, ...prev].slice(0, 7));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-black">مركز العمليات الأمنية (SOC)</h2>
          <p className="text-slate-400 text-sm mt-1">مراقبة البنية التحتية والتهديدات السيبرانية في الوقت الفعلي.</p>
        </div>
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl relative z-10">
          <i className="fas fa-shield-halved"></i>
        </div>
         {/* Background decoration */}
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute right-10 -top-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
            <div className="absolute left-10 -bottom-10 w-64 h-64 bg-rose-500 rounded-full blur-3xl"></div>
         </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'الهجمات المحظورة', val: '14,205', color: 'text-emerald-400', icon: 'fa-shield-virus' },
           { label: 'التهديدات النشطة', val: '3', color: 'text-rose-500 animate-pulse', icon: 'fa-triangle-exclamation' },
           { label: 'حالة الجدار الناري', val: 'Online', color: 'text-blue-400', icon: 'fa-server' },
           { label: 'تحديثات الأمان', val: 'Up to date', color: 'text-slate-300', icon: 'fa-rotate' },
         ].map((stat, i) => (
           <div key={i} className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 shadow-lg">
              <div className="flex justify-between items-start mb-2">
                 <i className={`fas ${stat.icon} text-slate-600 text-xl`}></i>
                 <span className={`text-xl font-black ${stat.color}`}>{stat.val}</span>
              </div>
              <p className="text-slate-400 text-xs font-bold">{stat.label}</p>
           </div>
         ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
         {/* Map Section */}
         <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-6 right-8 z-10">
               <h3 className="text-white font-black text-lg">خريطة التهديدات العالمية</h3>
               <div className="flex gap-2 mt-2">
                  <span className="flex items-center gap-1 text-[9px] text-slate-400"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> Critical</span>
                  <span className="flex items-center gap-1 text-[9px] text-slate-400"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> Warning</span>
               </div>
            </div>
            
            {/* Simulated Map Background */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-cover bg-center bg-no-repeat filter invert"></div>
            
            {/* Animated Dots (Simulated Locations) */}
            <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
            
            {/* Connection Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
               <path d="M 200 200 Q 400 100 600 300" stroke="#f43f5e" strokeWidth="2" fill="none" className="animate-[dash_2s_linear_infinite]" strokeDasharray="10" />
               <path d="M 600 300 Q 500 500 300 400" stroke="#6366f1" strokeWidth="1" fill="none" />
            </svg>
         </div>

         {/* Live Feed */}
         <div className="bg-slate-800 rounded-[3rem] border border-slate-700 shadow-xl p-6 flex flex-col">
            <h3 className="text-white font-black text-lg mb-4 px-2">سجل الأحداث اللحظي</h3>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
               {threats.map(threat => (
                 <div key={threat.id} className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600/50 flex items-start gap-3">
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                      threat.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 
                      threat.severity === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-grow">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black text-slate-200">{threat.type}</span>
                          <span className="text-[9px] font-mono text-slate-500">{threat.timestamp}</span>
                       </div>
                       <p className="text-[10px] text-slate-400 font-mono mb-1">Src: {threat.source}</p>
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${
                          threat.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 
                          threat.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                       }`}>{threat.severity}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569; 
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default SecurityOpsView;