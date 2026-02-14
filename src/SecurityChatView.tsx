import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './types';
import { useData } from './DataContext';
import { supabase } from './supabaseClient';

const SecurityChatView: React.FC = () => {
  const { employees, orgId } = useData();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const emp = employees.find(e => e.auth_id === user.id);
        setCurrentUser(emp);
      }
    };
    getUser();
  }, [employees]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          text: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          isSecure: msg.is_secure,
          type: msg.type
        })));
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const msg = payload.new;
        setMessages(prev => [...prev, {
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          text: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          isSecure: msg.is_secure,
          type: msg.type
        }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    await supabase.from('chat_messages').insert({
      sender_id: currentUser ? currentUser.id : 'unknown',
      sender_name: currentUser ? currentUser.name : 'مستخدم',
      content: inputText,
      is_secure: true,
      type: 'TEXT',
      org_id: orgId
    });

    setInputText('');
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-160px)] flex flex-col lg:flex-row gap-8 animate-fade-in text-right" dir="rtl">
      
      {/* Sidebar: Active Sessions */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-grow overflow-y-auto">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
             <i className="fas fa-shield-halved text-indigo-600"></i>
             قنوات التواصل الآمن
          </h3>
          <div className="space-y-3">
             <div className="p-4 rounded-[1.5rem] border cursor-pointer transition-all bg-indigo-600 border-indigo-500 text-white shadow-lg">
                  <div className="flex justify-between items-start mb-1">
                     <span className="text-[10px] font-black text-indigo-200">الآن</span>
                     <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-white">غرفة العمليات (SOC)</p>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></div>
                     </div>
                  </div>
                  <p className="text-[10px] truncate text-indigo-100">قناة عامة</p>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
           <div className="flex items-center gap-3 mb-4">
              <i className="fas fa-microchip text-indigo-400"></i>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">بروتوكول التشفير</h4>
           </div>
           <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">AES-256 (GCM)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-black uppercase">Active</span>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 backdrop-blur-md flex justify-between items-center z-10">
           <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition"><i className="fas fa-ellipsis-v"></i></button>
              <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-rose-500 hover:bg-rose-50 transition"><i className="fas fa-triangle-exclamation"></i></button>
           </div>
           <div className="flex items-center gap-4 flex-row-reverse text-right">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><i className="fas fa-headset text-xl"></i></div>
              <div>
                 <h4 className="font-black text-slate-800">غرفة العمليات (SOC)</h4>
                 <div className="flex items-center gap-2 justify-end">
                    <span className="text-[9px] font-black text-emerald-500 uppercase">قناة مشفرة بالكامل</span>
                    <i className="fas fa-lock text-[8px] text-emerald-500"></i>
                 </div>
              </div>
           </div>
        </div>

        {/* Messages Container */}
        <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
           {messages.map((msg) => (
             <div key={msg.id} className={`flex ${msg.senderId === (currentUser?.id || 'unknown') ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                <div className={`max-w-[80%] rounded-[2rem] p-5 shadow-sm relative group ${
                  msg.senderId === (currentUser?.id || 'unknown')
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : msg.type === 'INCIDENT' ? 'bg-rose-50 border border-rose-100 text-rose-800 rounded-bl-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                   <div className="flex justify-between items-center mb-1 gap-4">
                      <span className={`text-[8px] font-black uppercase ${msg.senderId === (currentUser?.id || 'unknown') ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.timestamp}</span>
                      <span className={`text-[10px] font-black ${msg.senderId === (currentUser?.id || 'unknown') ? 'text-white' : 'text-indigo-600'}`}>{msg.senderName}</span>
                   </div>
                   
                   {msg.type === 'INCIDENT' && (
                     <div className="flex items-center gap-3 mb-2 p-2 bg-rose-100/50 rounded-xl border border-rose-200">
                        <i className="fas fa-circle-exclamation text-rose-600"></i>
                        <span className="text-[10px] font-black">بلاغ أمني طارئ</span>
                     </div>
                   )}
                   
                   <p className="text-[13px] font-medium leading-relaxed">{msg.text}</p>
                   
                   {msg.isSecure && (
                     <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] text-emerald-500 shadow-md">
                        <i className="fas fa-shield-check"></i>
                     </div>
                   )}
                </div>
             </div>
           ))}
           <div ref={chatEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="p-6 bg-white border-t border-slate-50 flex items-center gap-4">
           <div className="flex-grow relative">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="اكتب رسالتك المشفرة هنا..."
                className="w-full py-5 px-8 pr-16 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
              />
              <button className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition">
                 <i className="fas fa-paperclip text-lg"></i>
              </button>
           </div>
           <button 
             onClick={handleSendMessage}
             className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
           >
              <i className="fas fa-paper-plane-top text-xl"></i>
           </button>
        </div>

      </div>

    </div>
  );
};

export default SecurityChatView;