import React, { useState, useRef, useEffect } from 'react';

const SupportView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ticket' | 'chat'>('ticket');
  const [ticket, setTicket] = useState({ subject: '', message: '', priority: 'Normal' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'support', text: 'مرحباً بك في الدعم الفني لـ TriPro. كيف يمكننا مساعدتك اليوم؟', time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // محاكاة إرسال البيانات للخادم
    setTimeout(() => {
      setIsSubmitting(false);
      alert('تم إرسال طلب الدعم بنجاح! سيتم التواصل معك قريباً.');
      setTicket({ subject: '', message: '', priority: 'Normal' });
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMsg = { 
        id: Date.now(), 
        sender: 'user', 
        text: chatInput, 
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
        const supportMsg = { 
            id: Date.now() + 1, 
            sender: 'support', 
            text: 'شكراً لرسالتك. جاري تحويلك لأحد ممثلي خدمة العملاء المتاحين...', 
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) 
        };
        setChatMessages(prev => [...prev, supportMsg]);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">الدعم الفني والمساعدة</h2>
          <p className="text-slate-500 text-sm mt-1">تواصل مباشرة مع فريق تطوير TriPro لحل المشكلات التقنية.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
           <button onClick={() => setActiveTab('ticket')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'ticket' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>تذكرة دعم</button>
           <button onClick={() => setActiveTab('chat')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>محادثة مباشرة</button>
        </div>
      </div>

      {activeTab === 'ticket' ? (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-black text-slate-800 mb-6">فتح تذكرة دعم جديدة</h3>
           <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase mb-2">عنوان المشكلة</label>
                 <input 
                   type="text" 
                   required
                   value={ticket.subject}
                   onChange={e => setTicket({...ticket, subject: e.target.value})}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                   placeholder="مثال: مشكلة في تصدير الرواتب"
                 />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase mb-2">الأولوية</label>
                 <select 
                   value={ticket.priority}
                   onChange={e => setTicket({...ticket, priority: e.target.value})}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                 >
                    <option value="Low">منخفضة</option>
                    <option value="Normal">عادية</option>
                    <option value="High">عالية</option>
                    <option value="Critical">حرجة (توقف النظام)</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase mb-2">تفاصيل المشكلة</label>
                 <textarea 
                   required
                   value={ticket.message}
                   onChange={e => setTicket({...ticket, message: e.target.value})}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                   placeholder="يرجى وصف المشكلة بالتفصيل..."
                 />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? 'جاري الإرسال...' : <><i className="fas fa-paper-plane"></i> إرسال التذكرة</>}
              </button>
           </form>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
              <h3 className="text-lg font-black mb-4">معلومات الاتصال المباشر</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><i className="fas fa-phone"></i></div>
                    <div className="text-right">
                       <p className="text-[10px] text-slate-400 font-bold uppercase">الخط الساخن</p>
                       <p className="text-sm font-black" dir="ltr">+20 100 000 0000</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><i className="fas fa-envelope"></i></div>
                    <div className="text-right">
                       <p className="text-[10px] text-slate-400 font-bold uppercase">البريد الإلكتروني</p>
                       <p className="text-sm font-black">support@tripro.com</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-4">الأسئلة الشائعة</h3>
              <div className="space-y-3">
                 <details className="group">
                    <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-sm text-slate-700">
                       <span>كيف يمكنني إعادة تعيين كلمة المرور؟</span>
                       <span className="transition group-open:rotate-180"><i className="fas fa-chevron-down text-xs"></i></span>
                    </summary>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">يمكنك إعادة تعيين كلمة المرور من خلال صفحة تسجيل الدخول بالضغط على "نسيت كلمة المرور" أو من خلال مدير النظام.</p>
                 </details>
                 <div className="h-px bg-slate-100"></div>
                 <details className="group">
                    <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-sm text-slate-700">
                       <span>لماذا لا تظهر بصمة الموظف؟</span>
                       <span className="transition group-open:rotate-180"><i className="fas fa-chevron-down text-xs"></i></span>
                    </summary>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">تأكد من أن الموظف متصل بشبكة WiFi الخاصة بالشركة وأن خدمة الموقع (GPS) مفعلة.</p>
                 </details>
              </div>
           </div>
        </div>
      </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden h-[600px] flex flex-col relative">
           <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg"><i className="fas fa-headset text-xl"></i></div>
                 <div>
                    <h4 className="font-black text-slate-800">الدعم المباشر</h4>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                       <span className="text-[10px] font-bold text-slate-400">متاح الآن</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-slate-50/30">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                   <div className={`max-w-[80%] rounded-[2rem] p-5 shadow-sm relative ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'}`}>
                      <p className="text-xs font-bold leading-relaxed">{msg.text}</p>
                      <span className={`text-[9px] font-black mt-2 block ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.time}</span>
                   </div>
                </div>
              ))}
              <div ref={chatEndRef} />
           </div>

           <div className="p-6 bg-white border-t border-slate-50 flex items-center gap-4">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="اكتب رسالتك هنا..."
                className="flex-grow py-4 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button onClick={handleSendMessage} className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition"><i className="fas fa-paper-plane"></i></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupportView;