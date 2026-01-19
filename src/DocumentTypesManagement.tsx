import React, { useState } from 'react';
import { DocumentTypeDefinition } from './types';

const DocumentTypesManagement: React.FC = () => {
  const [docTypes, setDocTypes] = useState<DocumentTypeDefinition[]>([
    // يمكنك إضافة حقل templateFile لكل نوع لاحقاً
    { id: 'DT-01', name: 'بطاقة الرقم القومي', isRequired: true, description: 'صورة من الوجهين', issuingAuthority: 'وزارة الداخلية' },
    { id: 'DT-02', name: 'جواز السفر', isRequired: false, description: 'ساري المفعول لمدة 6 أشهر', issuingAuthority: 'مصلحة الجوازات' },
    { id: 'DT-03', name: 'صحيفة الحالة الجنائية', isRequired: true, description: 'حديثة (لا تزيد عن 3 أشهر)', issuingAuthority: 'وزارة الداخلية' },
  ]);

  const [newDocType, setNewDocType] = useState<Partial<DocumentTypeDefinition>>({ name: '', isRequired: false, description: '', issuingAuthority: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDocType, setEditingDocType] = useState<DocumentTypeDefinition | null>(null);

  
  const handleAdd = () => {
    if (newDocType.name) {
      setDocTypes([...docTypes, { ...newDocType, id: `DT-${Date.now()}` } as DocumentTypeDefinition]);
      setNewDocType({ name: '', isRequired: false, description: '', issuingAuthority: '' });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف نوع الوثيقة هذا؟')) {
      setDocTypes(docTypes.filter(dt => dt.id !== id));
    }
  };

  const handleUpdate = () => {
    if (editingDocType) {
      setDocTypes(docTypes.map(dt => dt.id === editingDocType.id ? editingDocType : dt));
      setIsEditModalOpen(false);
      setEditingDocType(null);
    }
  };
  
  const handleTemplateUpload = (id: string, file: File | null) => {
    // TODO: Implement the upload logic to store the file and its URL
    alert(`Uploaded template file for document type with ID: ${id}`);
  };

  const filteredDocTypes = docTypes.filter(dt => 
    dt.name.includes(searchQuery) || 
    (dt.description && dt.description.includes(searchQuery)) ||
    (dt.issuingAuthority && dt.issuingAuthority.includes(searchQuery))
  );

  return (
    <div className="p-10 animate-fade-in space-y-8">
       <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-800">أنواع الوثائق والمستندات</h3>
          <div className="flex items-center gap-4">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="بحث عن وثيقة..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                />
                <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
             </div>
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                <i className="fas fa-file-contract"></i>
             </div>
          </div>
       </div>

       <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 h-fit">
             <h4 className="font-black text-slate-800 mb-4">إضافة نوع وثيقة جديد</h4>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم الوثيقة</label>
                   <input 
                     type="text" 
                     value={newDocType.name}
                     onChange={e => setNewDocType({...newDocType, name: e.target.value})}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">الجهة المصدرة</label>
                   <input 
                     type="text" 
                     value={newDocType.issuingAuthority}
                     onChange={e => setNewDocType({...newDocType, issuingAuthority: e.target.value})}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                 <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">تكلفة الاستخراج (إن وجدت)</label>
                   <input 
                     type="number" 
                     value={newDocType.extractionCost}
                     onChange={e => setNewDocType({...newDocType, extractionCost: parseInt(e.target.value)})}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">الوصف / تعليمات</label>
                   <textarea 
                     value={newDocType.description}
                     onChange={e => setNewDocType({...newDocType, description: e.target.value})}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                   />
                </div>
                <div className="flex items-center gap-3">
                   <input 
                     type="checkbox" 
                     checked={newDocType.isRequired}
                     onChange={e => setNewDocType({...newDocType, isRequired: e.target.checked})}
                     className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                   />
                   <span className="text-xs font-bold text-slate-600">مطلوب إجبارياً</span>
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
             {filteredDocTypes.map(dt => (
                <div key={dt.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-md transition group">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingDocType(dt);
                          setIsEditModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition"
                        title="تعديل"
                      >
                         <i className="fas fa-pen"></i>
                      </button>
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleDelete(dt.id)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition"
                      >
                         <i className="fas fa-trash-can"></i>
                      </button>
                      <div className="text-right">
                         <h5 className="font-black text-slate-800">{dt.name}</h5>
                         <p className="text-[10px] text-slate-500 mt-1">{dt.description || 'لا يوجد وصف'}</p>
                         {dt.isRequired && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg mt-2 inline-block">مطلوب</span>}
                         {dt.issuingAuthority && <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg mt-2 mr-2 inline-block">{dt.issuingAuthority}</span>}
                         {dt.defaultValidityDays && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg mt-2 mr-2 inline-block">صلاحية: {dt.defaultValidityDays} يوم</span>}
                      </div>
                   </div>
                     {/* Template Upload Feature (Incomplete) */}
                    <label className="group cursor-pointer">
                       <input 
                         type="file" 
                         className="hidden" 
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           handleTemplateUpload(dt.id, file || null);
                         }}
                       />
                       <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-lg group-hover:bg-indigo-500 group-hover:text-white transition">
                          <i className="fas fa-upload"></i>
                       </div>
                    </label>


                   <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-lg">
                      <i className="fas fa-file-lines"></i>
                   </div>
                   </div>
                </div>
             ))}
          </div>
       </div>

      {isEditModalOpen && editingDocType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل نوع الوثيقة</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم الوثيقة</label>
                <input 
                  type="text" 
                  value={editingDocType.name}
                  onChange={e => setEditingDocType({...editingDocType, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الجهة المصدرة</label>
                <input 
                  type="text" 
                  value={editingDocType.issuingAuthority}
                  onChange={e => setEditingDocType({...editingDocType, issuingAuthority: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الوصف / تعليمات</label>
                <textarea 
                  value={editingDocType.description}
                  onChange={e => setEditingDocType({...editingDocType, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={editingDocType.isRequired}
                  onChange={e => setEditingDocType({...editingDocType, isRequired: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600">مطلوب إجبارياً</span>
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

export default DocumentTypesManagement;