import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { CompanyPolicy } from './types';

const CompanyPoliciesManagement: React.FC = () => {
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);

  const [newPolicy, setNewPolicy] = useState<Partial<CompanyPolicy>>({ title: '', content: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CompanyPolicy | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    const { data } = await supabase.from('company_policies').select('*').order('created_at', { ascending: false });
    if (data) {
      setPolicies(data.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        lastUpdated: new Date(p.created_at).toLocaleDateString('en-CA')
      })));
    }
  };

  const handleAdd = async () => {
    if (newPolicy.title && newPolicy.content) {
      const { error } = await supabase.from('company_policies').insert({
        title: newPolicy.title,
        content: newPolicy.content
      });
      if (!error) {
        fetchPolicies();
        setNewPolicy({ title: '', content: '' });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه السياسة؟')) {
      const { error } = await supabase.from('company_policies').delete().eq('id', id);
      if (!error) fetchPolicies();
    }
  };

  const handleUpdate = async () => {
    if (editingPolicy) {
      const { error } = await supabase.from('company_policies').update({
        title: editingPolicy.title,
        content: editingPolicy.content
      }).eq('id', editingPolicy.id);
      if (!error) {
        fetchPolicies();
        setIsEditModalOpen(false);
        setEditingPolicy(null);
      }
    }
  };

  const handlePrintPolicy = (policy: CompanyPolicy) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>سياسة الشركة - ${policy.title}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #fff; color: #333; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
              .company-name { font-size: 24px; font-weight: 900; color: #2563eb; margin-bottom: 5px; }
              .doc-type { font-size: 14px; color: #64748b; font-weight: bold; }
              .policy-title { font-size: 22px; font-weight: bold; color: #1e293b; margin-bottom: 20px; text-align: center; }
              .content { font-size: 14px; text-align: justify; white-space: pre-wrap; }
              .meta { margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
              .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">TriPro Systems</div>
              <div class="doc-type">وثيقة سياسة رسمية</div>
            </div>
            
            <div class="policy-title">${policy.title}</div>
            
            <div class="content">
              ${policy.content}
            </div>

            <div class="meta">
              <div>رقم المرجع: ${policy.id}</div>
              <div>تاريخ آخر تحديث: ${policy.lastUpdated}</div>
            </div>

            <div class="footer">
              هذه الوثيقة سارية ومعتمدة من إدارة الموارد البشرية.
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
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
                  onClick={() => handlePrintPolicy(policy)}
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition"
                  title="طباعة"
                >
                  <i className="fas fa-print"></i>
                </button>
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