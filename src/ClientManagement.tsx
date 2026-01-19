import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';

// تعريف شكل بيانات العميل
interface Client {
  id: string;
  name: string;
  contractValue: number;
  status: 'Active' | 'Pending' | 'Ended';
  renewalDate: string;
  startDate: string;
  contractType: 'Annual' | 'Monthly';
  logoUrl?: string;
}

const ClientManagement: React.FC = () => {
  const { t } = useLanguage();
  // بيانات تجريبية للعملاء
  const [clients, setClients] = useState<Client[]>([
    { id: 'CL-101', name: 'البنك الأهلي المصري', contractValue: 150000, status: 'Active', renewalDate: '2024-12-01', startDate: '2023-12-01', contractType: 'Annual', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/National_Bank_of_Egypt_Logo.svg/1200px-National_Bank_of_Egypt_Logo.svg.png' },
    { id: 'CL-102', name: 'شركة فودافون', contractValue: 85000, status: 'Active', renewalDate: '2024-10-15', startDate: '2023-10-15', contractType: 'Annual', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vodafone_icon.svg/1024px-Vodafone_icon.svg.png' },
    { id: 'CL-103', name: 'مستشفى دار الفؤاد', contractValue: 120000, status: 'Pending', renewalDate: '2024-06-30', startDate: '2024-01-01', contractType: 'Monthly' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    contractValue: 0,
    status: 'Active',
    renewalDate: '',
    startDate: '',
    contractType: 'Annual',
    logoUrl: ''
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = clients
    .filter(client => client.name.includes(searchQuery))
    .sort((a, b) => {
      const dateA = new Date(a.renewalDate).getTime();
      const dateB = new Date(b.renewalDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const totalContractsValue = clients.reduce((sum, client) => sum + client.contractValue, 0);
  const activeClientsCount = clients.filter(client => client.status === 'Active').length;

  const expiringContractsCount = clients.filter(client => {
    if (client.status !== 'Active') return false;
    const daysUntilExpiry = Math.ceil((new Date(client.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  }).length;

  const handleAddClient = () => {
    if (newClient.name && newClient.contractValue && newClient.renewalDate && newClient.startDate) {
      const client: Client = {
        id: `CL-${Date.now()}`,
        name: newClient.name!,
        contractValue: newClient.contractValue!,
        status: newClient.status as 'Active' | 'Pending' | 'Ended' || 'Active',
        renewalDate: newClient.renewalDate!,
        startDate: newClient.startDate!,
        contractType: newClient.contractType as 'Annual' | 'Monthly' || 'Annual',
        logoUrl: newClient.logoUrl
      };
      setClients([...clients, client]);
      setIsAddModalOpen(false);
      setNewClient({ name: '', contractValue: 0, status: 'Active', renewalDate: '', startDate: '', contractType: 'Annual', logoUrl: '' });
    } else {
      alert(t('fillAllFields'));
    }
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm(t('deleteConfirmation'))) {
      setClients(clients.filter(client => client.id !== id));
    }
  };

  const handleUpdateClient = () => {
    if (editingClient && editingClient.name && editingClient.contractValue && editingClient.renewalDate && editingClient.startDate) {
      setClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
      setIsEditModalOpen(false);
      setEditingClient(null);
    } else {
      alert(t('fillAllFields'));
    }
  };

  const handlePrintStatement = (client: Client) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>كشف حساب - ${client.name}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #fff; color: #333; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 40px; }
              .logo { font-size: 24px; font-weight: 900; color: #2563eb; }
              .doc-title { font-size: 18px; font-weight: bold; color: #1e293b; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
              .box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
              .label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; display: block; }
              .value { font-size: 14px; font-weight: bold; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              th { text-align: right; padding: 15px; background: #f1f5f9; font-size: 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0; }
              td { padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
              .total-section { display: flex; justify-content: flex-end; }
              .total-box { width: 300px; background: #f8fafc; padding: 20px; border-radius: 12px; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
              .total-row.final { border-top: 2px solid #e2e8f0; padding-top: 10px; font-weight: 900; font-size: 16px; color: #2563eb; }
              .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">TriPro Systems</div>
              <div class="doc-title">كشف حساب عميل</div>
            </div>

            <div class="grid">
              <div class="box">
                <span class="label">بيانات العميل</span>
                <div class="value">${client.name}</div>
                <div style="margin-top: 5px; font-size: 12px; color: #64748b;">رقم العميل: ${client.id}</div>
              </div>
              <div class="box">
                <span class="label">تفاصيل الفاتورة</span>
                <div class="value">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
                <div style="margin-top: 5px; font-size: 12px; color: #64748b;">تاريخ التجديد القادم: ${client.renewalDate}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>وصف الخدمة</th>
                  <th>الحالة</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>اشتراك نظام إدارة الموارد البشرية (سنوي)</td>
                  <td><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">${client.status === 'Active' ? 'نشط' : 'معلق'}</span></td>
                  <td>${client.contractValue.toLocaleString()} ج.م</td>
                </tr>
                <tr>
                  <td>نوع التعاقد: ${client.contractType === 'Annual' ? 'سنوي' : 'شهري'}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-box">
                <div class="total-row">
                  <span>المجموع الفرعي</span>
                  <span>${client.contractValue.toLocaleString()} ج.م</span>
                </div>
                <div class="total-row">
                  <span>الضريبة (14%)</span>
                  <span>${(client.contractValue * 0.14).toLocaleString()} ج.م</span>
                </div>
                <div class="total-row final">
                  <span>الإجمالي المستحق</span>
                  <span>${(client.contractValue * 1.14).toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>

            <div class="footer">
              تم استخراج هذا المستند آلياً من نظام TriPro للمحاسبة والموارد البشرية. لا يحتاج إلى توقيع.
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleExportClients = () => {
    const headers = ['ID', 'اسم العميل', 'قيمة العقد', 'تاريخ التجديد', 'الحالة'];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...filteredClients.map(client => [
        client.id,
        `"${client.name}"`,
        client.contractValue,
        client.renewalDate,
        client.status === 'Active' ? 'نشط' : client.status === 'Pending' ? 'معلق' : 'منتهي'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clients_list.csv';
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* العنوان العلوي */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">{t('clientManagementTitle')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('clientManagementDesc')}</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
          <i className="fas fa-users"></i>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute -left-6 -bottom-6 text-indigo-500 opacity-30">
               <i className="fas fa-file-invoice-dollar text-9xl"></i>
            </div>
            <div className="relative z-10">
               <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">{t('totalContractsValue')}</p>
               <h3 className="text-4xl font-black">{totalContractsValue.toLocaleString()} <span className="text-lg">{t('currency')}</span></h3>
            </div>
         </div>

         <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute -left-6 -bottom-6 text-emerald-400 opacity-30">
               <i className="fas fa-users text-9xl"></i>
            </div>
            <div className="relative z-10">
               <p className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-2">{t('activeClients')}</p>
               <h3 className="text-4xl font-black">{activeClientsCount} <span className="text-lg">{t('clientCount')}</span></h3>
            </div>
         </div>
      </div>

      {expiringContractsCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl shrink-0">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
          <div>
            <h4 className="font-black text-amber-800 text-sm">{t('contractRenewalAlert')}</h4>
            <p className="text-amber-600 text-xs font-bold mt-1">
              {t('expiringContractsWarning').replace('{count}', expiringContractsCount.toString())}
            </p>
          </div>
        </div>
      )}

      {/* جدول العملاء */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <h3 className="font-black text-lg text-slate-800 whitespace-nowrap">{t('contractsList')}</h3>
                <div className="relative w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder={t('searchClientPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 pr-10 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleExportClients}
                className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-[10px] font-black shadow-sm hover:bg-emerald-100 transition flex items-center gap-2"
              >
                <i className="fas fa-file-excel"></i> {t('exportExcel')}
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> {t('addNewClient')}
              </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">{t('clientName')}</th>
                <th className="px-8 py-5">{t('contractValue')}</th>
                <th 
                  className="px-8 py-5 cursor-pointer hover:text-indigo-600 transition select-none"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center gap-2">
                     {t('renewalDate')}
                     <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  </div>
                </th>
                <th className="px-8 py-5">{t('status')}</th>
                <th className="px-8 py-5">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6 font-bold text-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                            {client.logoUrl ? (
                                <img src={client.logoUrl} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-slate-400 font-black text-xs">{client.name.charAt(0)}</span>
                            )}
                        </div>
                        {client.name}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-indigo-600">{client.contractValue.toLocaleString()} {t('currency')}</div>
                    <div className="text-[9px] text-slate-400 font-bold mt-1">{client.contractType === 'Annual' ? 'سنوي' : 'شهري'}</div>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-500">{client.renewalDate}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${
                      client.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 
                      client.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {client.status === 'Active' ? t('active') : client.status === 'Pending' ? t('pending') : t('ended')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePrintStatement(client)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg transition"
                      >
                        <i className="fas fa-print"></i> {t('printStatement')}
                      </button>
                      <button 
                        onClick={() => { setEditingClient(client); setIsEditModalOpen(true); }}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg transition"
                      >
                        <i className="fas fa-pen"></i> {t('edit')}
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-lg transition"
                      >
                        <i className="fas fa-trash-can"></i> {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal إضافة عميل */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">{t('addNewClient')}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('clientName')}</label>
                <input 
                  type="text" 
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('logoUrl')}</label>
                <input 
                  type="text" 
                  value={newClient.logoUrl || ''}
                  onChange={e => setNewClient({...newClient, logoUrl: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                  dir="ltr"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('contractValue')} ({t('currency')})</label>
                <input 
                  type="number" 
                  value={newClient.contractValue}
                  onChange={e => setNewClient({...newClient, contractValue: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ بدء العقد</label>
                <input 
                  type="date" 
                  value={newClient.startDate}
                  onChange={e => setNewClient({...newClient, startDate: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">نوع العقد</label>
                <select 
                  value={newClient.contractType}
                  onChange={e => setNewClient({...newClient, contractType: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Annual">سنوي</option>
                  <option value="Monthly">شهري</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('renewalDate')}</label>
                <input 
                  type="date" 
                  value={newClient.renewalDate}
                  onChange={e => setNewClient({...newClient, renewalDate: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('status')}</label>
                <select 
                  value={newClient.status}
                  onChange={e => setNewClient({...newClient, status: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Active">{t('active')}</option>
                  <option value="Pending">{t('pending')}</option>
                  <option value="Ended">{t('ended')}</option>
                </select>
              </div>
              <button 
                onClick={handleAddClient}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4"
              >
                {t('saveClient')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal تعديل عميل */}
      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">{t('editClientData')}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('clientName')}</label>
                <input 
                  type="text" 
                  value={editingClient.name}
                  onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('logoUrl')}</label>
                <input 
                  type="text" 
                  value={editingClient.logoUrl || ''}
                  onChange={e => setEditingClient({...editingClient, logoUrl: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('contractValue')} ({t('currency')})</label>
                <input 
                  type="number" 
                  value={editingClient.contractValue}
                  onChange={e => setEditingClient({...editingClient, contractValue: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ بدء العقد</label>
                <input 
                  type="date" 
                  value={editingClient.startDate}
                  onChange={e => setEditingClient({...editingClient, startDate: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">نوع العقد</label>
                <select 
                  value={editingClient.contractType}
                  onChange={e => setEditingClient({...editingClient, contractType: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Annual">سنوي</option>
                  <option value="Monthly">شهري</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('renewalDate')}</label>
                <input 
                  type="date" 
                  value={editingClient.renewalDate}
                  onChange={e => setEditingClient({...editingClient, renewalDate: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{t('status')}</label>
                <select 
                  value={editingClient.status}
                  onChange={e => setEditingClient({...editingClient, status: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Active">{t('active')}</option>
                  <option value="Pending">{t('pending')}</option>
                  <option value="Ended">{t('ended')}</option>
                </select>
              </div>
              <button 
                onClick={handleUpdateClient}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4"
              >
                {t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;