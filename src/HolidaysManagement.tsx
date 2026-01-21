import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Holiday } from './types';

const HolidaysManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  
  const [newHoliday, setNewHoliday] = useState<Partial<Holiday>>({ name: '', date: '', isRecurring: true });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    const { data } = await supabase.from('holidays').select('*').order('date', { ascending: true });
    if (data) {
      setHolidays(data.map((h: any) => ({ ...h, isRecurring: h.is_recurring })));
    }
  };

  const handleAdd = async () => {
    if (newHoliday.name && newHoliday.date) {
      const { error } = await supabase.from('holidays').insert({
        name: newHoliday.name,
        date: newHoliday.date,
        is_recurring: newHoliday.isRecurring
      });
      if (!error) {
        fetchHolidays();
        setNewHoliday({ name: '', date: '', isRecurring: true });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه العطلة؟')) {
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      if (!error) fetchHolidays();
    }
  };

  const handleUpdate = async () => {
    if (editingHoliday) {
      const { error } = await supabase.from('holidays').update({
        name: editingHoliday.name,
        date: editingHoliday.date,
        is_recurring: editingHoliday.isRecurring
      }).eq('id', editingHoliday.id);
      if (!error) fetchHolidays();
      setIsEditModalOpen(false);
    }
  };

  return (
    <div className="p-10 animate-fade-in space-y-8">
       <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-800">العطلات الرسمية والمناسبات</h3>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
             <i className="fas fa-umbrella-beach"></i>
          </div>
       </div>

       <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 h-fit">
             <h4 className="font-black text-slate-800 mb-4">إضافة عطلة جديدة</h4>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم المناسبة</label>
                   <input 
                     type="text" 
                     value={newHoliday.name}
                     onChange={e => setNewHoliday({...newHoliday, name: e.target.value})}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">التاريخ</label>
                   <input 
                     type="date" 
                     value={newHoliday.date}
                     onChange={e => setNewHoliday({...newHoliday, date: e.target.value})}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                   />
                </div>
                <div className="flex items-center gap-3">
                   <input 
                     type="checkbox" 
                     checked={newHoliday.isRecurring}
                     onChange={e => setNewHoliday({...newHoliday, isRecurring: e.target.checked})}
                     className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                   />
                   <span className="text-xs font-bold text-slate-600">تتكرر سنوياً</span>
                </div>
                <button 
                  onClick={handleAdd}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg hover:bg-indigo-700 transition"
                >
                   إضافة للقائمة
                </button>
             </div>
          </div>

          <div className="md:col-span-8 space-y-4">
             {holidays.map(holiday => (
                <div key={holiday.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-md transition group">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingHoliday(holiday);
                          setIsEditModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition"
                        title="تعديل"
                      >
                         <i className="fas fa-pen"></i>
                      </button>
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleDelete(holiday.id)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition"
                      >
                         <i className="fas fa-trash-can"></i>
                      </button>
                      <div className="text-right">
                         <h5 className="font-black text-slate-800">{holiday.name}</h5>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{holiday.date}</span>
                            {holiday.isRecurring && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">سنوية</span>}
                         </div>
                      </div>
                   </div>
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-lg">
                      <i className="fas fa-calendar-day"></i>
                   </div>
                   </div>
                </div>
             ))}
          </div>
       </div>

      {isEditModalOpen && editingHoliday && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل العطلة</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم المناسبة</label>
                <input 
                  type="text" 
                  value={editingHoliday.name}
                  onChange={e => setEditingHoliday({...editingHoliday, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">التاريخ</label>
                <input 
                  type="date" 
                  value={editingHoliday.date}
                  onChange={e => setEditingHoliday({...editingHoliday, date: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={editingHoliday.isRecurring}
                  onChange={e => setEditingHoliday({...editingHoliday, isRecurring: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600">تتكرر سنوياً</span>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition">إلغاء</button>
                <button onClick={handleUpdate} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition">حفظ التعديلات</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidaysManagement;