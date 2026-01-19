import React, { useState } from 'react';
import { CompanyPolicy } from './types';

const CompanyPoliciesManagement: React.FC = () => {
  const [policies, setPolicies] = useState<CompanyPolicy[]>([
    { id: 'CP-01', title: 'سياسة الحضور والانصراف', content: 'يجب على جميع الموظفين تسجيل الحضور قبل الساعة 9:00 صباحاً...', lastUpdated: '2024-01-15' },
    { id: 'CP-02', title: 'سياسة الإجازات', content: 'يستحق الموظف 21 يوماً إجازة سنوية...', lastUpdated: '2023-12-01' },
  ]);

  const [newPolicy, setNewPolicy] = useState<Partial<CompanyPolicy>>({ title: '', content: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CompanyPolicy | null>(null);

  const handleAdd = () => {
    if (newPolicy.title && newPolicy.content) {
      setPolicies([...policies, { ...newPolicy, id: `CP-${Date.now()}`, lastUpdated: new Date().toLocaleDateString('en-CA') } as CompanyPolicy]);
      setNewPolicy({ title: '', content: '' });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه السياسة؟')) {
      setPolicies(policies.filter(policy => policy.id !== id));
    }
  };

  const handleUpdate = () => {
    if (editingPolicy) {
      setPolicies(policies.map(p => p.id === editingPolicy.id ? { ...editingPolicy, lastUpdated: new Date().toLocaleDateString('en-CA') } : p));
      setIsEditModalOpen(false);
      setEditingPolicy(null);
    }
  };

  return (
    <div className="p-10 animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-800">سياسات الشركة</h3>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
          <i className="fas fa-briefcase"></i>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 h-fit">
          <h4 className="font-black text-slate-800 mb-4">إضافة سياسة جديدة</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">عنوان السياسة</label>
              <input
                type="text"
                value={newPolicy.title}
                onChange={e => setNewPolicy({ ...newPolicy, title: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">محتوى السياسة</label>
              <textarea
                value={newPolicy.content}
                onChange={e => setNewPolicy({ ...newPolicy, content: e.target.value })}
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
          {policies.map(policy => (
            <div key={policy.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-md transition group">
              <div className="text-right">
                <h5 className="font-black text-slate-800">{policy.title}</h5>
                <p className="text-[10px] text-slate-500 mt-1 truncate">{policy.content}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-2">آخر تحديث: {policy.lastUpdated}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setEditingPolicy(policy);
                    setIsEditModalOpen(true);
                  }}
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition"
                  title="تعديل"
                >
                  <i className="fas fa-pen"></i>
                </button>
                <button
                  onClick={() => handleDelete(policy.id)}
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition"
                >
                  <i className="fas fa-trash-can"></i>
                </button>
                 <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-lg">
                  <i className="fas fa-file-lines"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditModalOpen && editingPolicy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل السياسة</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">عنوان السياسة</label>
                <input
                  type="text"
                  value={editingPolicy.title}
                  onChange={e => setEditingPolicy({ ...editingPolicy, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">محتوى السياسة</label>
                <textarea
                  value={editingPolicy.content}
                  onChange={e => setEditingPolicy({ ...editingPolicy, content: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-48 resize-none"
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

export default CompanyPoliciesManagement;