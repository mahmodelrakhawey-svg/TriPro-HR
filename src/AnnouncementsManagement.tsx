import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Announcement } from './types';
import { useData } from './DataContext';

const AnnouncementsManagement: React.FC = () => {
  const { refreshData } = useData();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({ content: '', is_active: true, expires_at: '', priority: 'NORMAL' });
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching announcements:', error);
    } else {
      setAnnouncements(data);
    }
  };

  const handleAddAnnouncement = async () => {
    if (newAnnouncement.content) {
      const { error } = await supabase.from('announcements').insert({
        content: newAnnouncement.content,
        is_active: newAnnouncement.is_active,
        expires_at: newAnnouncement.expires_at || null,
        priority: newAnnouncement.priority || 'NORMAL'
      });
      if (error) {
        alert('فشل إضافة الإعلان: ' + error.message);
      } else {
        fetchAnnouncements();
        refreshData(); // تحديث الشريط المتحرك فوراً
        setNewAnnouncement({ content: '', is_active: true, expires_at: '', priority: 'NORMAL' });
      }
    } else {
      alert('يرجى إدخال محتوى الإعلان.');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) {
        alert('فشل حذف الإعلان: ' + error.message);
      } else {
        fetchAnnouncements();
        refreshData(); // تحديث الشريط المتحرك فوراً
      }
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (editingAnnouncement && editingAnnouncement.content) {
      const { error } = await supabase.from('announcements').update({
        content: editingAnnouncement.content,
        is_active: editingAnnouncement.is_active,
        expires_at: editingAnnouncement.expires_at || null,
        priority: editingAnnouncement.priority || 'NORMAL'
      }).eq('id', editingAnnouncement.id);
      if (error) {
        alert('فشل تحديث الإعلان: ' + error.message);
      } else {
        fetchAnnouncements();
        refreshData(); // تحديث الشريط المتحرك فوراً
        setIsEditModalOpen(false);
        setEditingAnnouncement(null);
      }
    } else {
      alert('يرجى إدخال محتوى الإعلان.');
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    const { error } = await supabase.from('announcements').update({
      is_active: !announcement.is_active
    }).eq('id', announcement.id);
    if (error) {
      alert('فشل تغيير حالة الإعلان: ' + error.message);
    } else {
      fetchAnnouncements();
      refreshData(); // تحديث الشريط المتحرك فوراً
    }
  };

  return (
    <div className="p-10 animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-800">إدارة الإعلانات</h3>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
          <i className="fas fa-bullhorn"></i>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 h-fit">
          <h4 className="font-black text-slate-800 mb-4">إضافة إعلان جديد</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">محتوى الإعلان</label>
              <textarea
                value={newAnnouncement.content}
                onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                placeholder="اكتب محتوى الإعلان هنا..."
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">الأهمية</label>
              <select
                value={newAnnouncement.priority || 'NORMAL'}
                onChange={e => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as 'NORMAL' | 'URGENT' })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="NORMAL">عادي</option>
                <option value="URGENT">عاجل / هام</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ الانتهاء (اختياري)</label>
              <input
                type="date"
                value={newAnnouncement.expires_at || ''}
                onChange={e => setNewAnnouncement({ ...newAnnouncement, expires_at: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={newAnnouncement.is_active}
                onChange={e => setNewAnnouncement({ ...newAnnouncement, is_active: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-600">إعلان نشط</span>
            </div>
            <button
              onClick={handleAddAnnouncement}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg hover:bg-indigo-700 transition"
            >
              إضافة الإعلان
            </button>
          </div>
        </div>

        <div className="md:col-span-8 space-y-4">
          {announcements.map(ann => (
            <div key={ann.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-md transition group">
              <div className="text-right flex-grow">
                <p className="text-sm font-black text-slate-800">{ann.content}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-2">
                  {ann.is_active ? (
                    <span className="text-emerald-600">نشط</span>
                  ) : (
                    <span className="text-rose-600">غير نشط</span>
                  )}
                  {' - '}
                  تاريخ الإنشاء: {new Date(ann.created_at).toLocaleDateString()}
                  {ann.priority === 'URGENT' && <span className="text-rose-500 font-black mr-2"> (عاجل)</span>}
                  {ann.expires_at && ` - ينتهي في: ${new Date(ann.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(ann)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition ${ann.is_active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  title={ann.is_active ? 'تعطيل الإعلان' : 'تفعيل الإعلان'}
                >
                  {ann.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
                <button
                  onClick={() => { setEditingAnnouncement(ann); setIsEditModalOpen(true); }}
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition"
                  title="تعديل"
                >
                  <i className="fas fa-pen"></i>
                </button>
                <button
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition"
                  title="حذف"
                >
                  <i className="fas fa-trash-can"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditModalOpen && editingAnnouncement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل الإعلان</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">محتوى الإعلان</label>
                <textarea
                  value={editingAnnouncement.content}
                  onChange={e => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الأهمية</label>
                <select
                  value={editingAnnouncement.priority || 'NORMAL'}
                  onChange={e => setEditingAnnouncement({ ...editingAnnouncement, priority: e.target.value as 'NORMAL' | 'URGENT' })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="NORMAL">عادي</option>
                  <option value="URGENT">عاجل / هام</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ الانتهاء (اختياري)</label>
                <input
                  type="date"
                  value={editingAnnouncement.expires_at ? new Date(editingAnnouncement.expires_at).toISOString().split('T')[0] : ''}
                  onChange={e => setEditingAnnouncement({ ...editingAnnouncement, expires_at: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editingAnnouncement.is_active}
                  onChange={e => setEditingAnnouncement({ ...editingAnnouncement, is_active: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600">إعلان نشط</span>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition">إلغاء</button>
                <button onClick={handleUpdateAnnouncement} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition">حفظ التعديلات</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManagement;