import React, { useState } from 'react';
import { JobTitle } from './types';

const JobTitlesManagement: React.FC = () => {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([
    { id: 'JT-01', title: 'Senior Developer', department: 'IT', description: 'Lead development team' },
    { id: 'JT-02', title: 'HR Manager', department: 'HR', description: 'Manage HR operations' },
    { id: 'JT-03', title: 'Sales Representative', department: 'Sales', description: 'Handle client accounts' },
  ]);

  const [newJobTitle, setNewJobTitle] = useState<Partial<JobTitle>>({ title: '', department: '', description: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null);

  const handleAdd = () => {
    if (newJobTitle.title) {
      setJobTitles([...jobTitles, { ...newJobTitle, id: `JT-${Date.now()}` } as JobTitle]);
      setNewJobTitle({ title: '', department: '', description: '' });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المسمى الوظيفي؟')) {
      setJobTitles(jobTitles.filter(jt => jt.id !== id));
    }
  };

  const handleUpdate = () => {
    if (editingJobTitle) {
      setJobTitles(jobTitles.map(jt => jt.id === editingJobTitle.id ? editingJobTitle : jt));
      setIsEditModalOpen(false);
      setEditingJobTitle(null);
    }
  };

  return (
    <div className="p-10 animate-fade-in space-y-8">
       <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-800">المسميات الوظيفية</h3>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
             <i className="fas fa-briefcase"></i>
          </div>
       </div>

       <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 h-fit">
             <h4 className="font-black text-slate-800 mb-4">إضافة مسمى جديد</h4>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">المسمى الوظيفي</label>
                   <input 
                     type="text" 
                     value={newJobTitle.title}
                     onChange={e => setNewJobTitle({...newJobTitle, title: e.target.value})}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">القسم (اختياري)</label>
                   <input 
                     type="text" 
                     value={newJobTitle.department}
                     onChange={e => setNewJobTitle({...newJobTitle, department: e.target.value})}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">الوصف</label>
                   <textarea 
                     value={newJobTitle.description}
                     onChange={e => setNewJobTitle({...newJobTitle, description: e.target.value})}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                   />
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
             {jobTitles.map(jt => (
                <div key={jt.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-md transition group">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingJobTitle(jt);
                          setIsEditModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition"
                        title="تعديل"
                      >
                         <i className="fas fa-pen"></i>
                      </button>
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleDelete(jt.id)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition"
                      >
                         <i className="fas fa-trash-can"></i>
                      </button>
                      <div className="text-right">
                         <h5 className="font-black text-slate-800">{jt.title}</h5>
                         <p className="text-[10px] text-slate-500 mt-1">{jt.description || 'لا يوجد وصف'}</p>
                         {jt.department && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg mt-2 inline-block">{jt.department}</span>}
                      </div>
                   </div>
                   <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-lg">
                      <i className="fas fa-id-badge"></i>
                   </div>
                   </div>
                </div>
             ))}
          </div>
       </div>

      {isEditModalOpen && editingJobTitle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل المسمى الوظيفي</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">المسمى الوظيفي</label>
                <input 
                  type="text" 
                  value={editingJobTitle.title}
                  onChange={e => setEditingJobTitle({...editingJobTitle, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">القسم (اختياري)</label>
                <input 
                  type="text" 
                  value={editingJobTitle.department}
                  onChange={e => setEditingJobTitle({...editingJobTitle, department: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الوصف</label>
                <textarea 
                  value={editingJobTitle.description}
                  onChange={e => setEditingJobTitle({...editingJobTitle, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                />
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

export default JobTitlesManagement;