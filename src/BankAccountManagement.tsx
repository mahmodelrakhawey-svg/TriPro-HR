import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';
import { Employee } from './types';
import toast from 'react-hot-toast';

interface BankAccount {
  employee_id: string;
  iban: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  branch_code?: string;
  swift_code?: string;
  is_default: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const BankAccountManagement: React.FC = () => {
  const { employees, orgId } = useData();
  const [bankAccounts, setBankAccounts] = useState<{ [key: string]: BankAccount }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<BankAccount>({
    employee_id: '',
    iban: '',
    bank_name: '',
    account_holder: '',
    account_number: '',
    branch_code: '',
    swift_code: '',
    is_default: true,
    status: 'PENDING'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [revealedAccounts, setRevealedAccounts] = useState<Record<string, boolean>>({});

  const toggleReveal = async (employeeId: string, employeeName: string, type: 'iban' | 'account_number', currentValue: string) => {
    const key = `${employeeId}_${type}`;
    const isCurrentlyRevealed = !!revealedAccounts[key];
    
    if (!isCurrentlyRevealed) {
      // تسجيل الحدث أمنياً في سجل النشاطات (Audit Logs)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentUser = employees.find(e => e.auth_id === user?.id);
        const performedBy = currentUser ? currentUser.name : 'System Admin';
        
        await supabase.from('audit_logs').insert({
          action: 'REVEAL_BANK_ACCOUNT_INFO',
          performed_by: performedBy,
          target_resource: 'employee_bank_accounts',
          details: `كشف المسؤول عن ${type === 'iban' ? 'رقم IBAN' : 'رقم حساب'} الموظف: ${employeeName} (معرف الموظف: ${employeeId})`,
          org_id: orgId
        });
      } catch (err) {
        console.error('Failed to log reveal event to audit_logs:', err);
      }
    }
    
    setRevealedAccounts(prev => ({
      ...prev,
      [key]: !isCurrentlyRevealed
    }));
  };

  const maskValue = (val: string, type: 'iban' | 'account_number') => {
    if (!val) return '';
    const clean = val.replace(/\s/g, '');
    if (type === 'iban') {
      if (clean.length < 8) return 'EG** ***';
      const visibleStart = clean.substring(0, 2);
      const visibleEnd = clean.substring(clean.length - 4);
      return `${visibleStart}** **** **** **** **** **** ${visibleEnd}`;
    } else {
      if (clean.length < 5) return '*****';
      const visibleEnd = clean.substring(clean.length - 4);
      return `******${visibleEnd}`;
    }
  };

  const egyptianBanks = [
    'البنك الأهلي المصري',
    'بنك مصر',
    'بنك القاهرة',
    'بنك الإسكندرية',
    'بنك فيصل الإسلامي',
    'بنك التنمية والائتمان الزراعي',
    'بنك الاستثمار العربي',
    'بنك عودة',
    'البنك المصري لتسويق الأوراق المالية',
    'البنك الإسلامي للتنمية'
  ];

  // Fetch existing bank accounts
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      let query = supabase
        .from('employee_bank_accounts')
        .select('*')
        .order('is_default', { ascending: false });

      if (orgId) {
        query = query.eq('org_id', orgId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const accountsMap: { [key: string]: BankAccount } = {};
      if (data) {
        data.forEach(account => {
          accountsMap[account.employee_id] = account;
        });
      }
      setBankAccounts(accountsMap);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('فشل في جلب حسابات البنك');
    }
  };

  const validateIBAN = (iban: string): boolean => {
    // IBAN format: EG + 2 digits + 25 characters (Total 29 chars for Egypt)
    const ibanRegex = /^EG\d{2}[A-Z0-9]{25}$/;
    return ibanRegex.test(iban.toUpperCase().replace(/\s/g, ''));
  };

  const validateSwift = (swift: string, bankName: string): { isValid: boolean; message?: string } => {
    const cleanSwift = swift.toUpperCase().replace(/\s/g, '');
    // SWIFT format: 4 letters (bank) + 2 letters (country) + 2 alphanumeric (location) + optional 3 alphanumeric (branch)
    const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    
    if (!swiftRegex.test(cleanSwift)) {
      return { isValid: false, message: 'صيغة SWIFT غير صحيحة. يجب أن يكون 8 أو 11 خانة (مثال: NBEGEGCX)' };
    }

    const bankPrefixes: { [key: string]: string } = {
      'البنك الأهلي المصري': 'NBEG',
      'بنك مصر': 'BMIS',
      'بنك القاهرة': 'BCAI',
      'بنك الإسكندرية': 'ALEX',
      'بنك فيصل الإسلامي': 'FIEG',
      'بنك الاستثمار العربي': 'AIBA',
      'بنك عودة': 'AUDI',
    };

    const expectedPrefix = bankPrefixes[bankName];
    if (expectedPrefix && !cleanSwift.startsWith(expectedPrefix)) {
      return { isValid: false, message: `كود SWIFT لا يتطابق مع ${bankName}. يجب أن يبدأ بـ ${expectedPrefix}` };
    }

    return { isValid: true };
  };

  const handleOpenModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    const existing = bankAccounts[employee.id];
    if (existing) {
      setFormData(existing);
    } else {
      setFormData({
        employee_id: employee.id,
        iban: '',
        bank_name: '',
        account_holder: employee.name || '',
        account_number: '',
        branch_code: '',
        swift_code: '',
        is_default: true,
        status: 'PENDING'
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!selectedEmployee) return;

    // Validation
    if (!formData.iban || !formData.bank_name || !formData.account_number) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (!validateIBAN(formData.iban)) {
      toast.error('صيغة IBAN غير صحيحة. يجب أن يتكون من 29 حرفاً/رقماً ويبدأ بـ EG');
      return;
    }

    if (formData.swift_code) {
      const swiftValidation = validateSwift(formData.swift_code, formData.bank_name);
      if (!swiftValidation.isValid) {
        toast.error(swiftValidation.message || 'كود SWIFT غير صحيح');
        return;
      }
    }

    setIsLoading(true);
    try {
      const existing = bankAccounts[selectedEmployee.id];

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('employee_bank_accounts')
          .update({ ...formData, status: 'PENDING' }) // Reset to PENDING on update
          .eq('employee_id', selectedEmployee.id);

        if (error) throw error;
        toast.success('تم تحديث حساب البنك بنجاح');
      } else {
        // Insert new
        const { error } = await supabase
          .from('employee_bank_accounts')
          .insert([{ ...formData, status: 'PENDING', org_id: orgId }]);

        if (error) throw error;
        toast.success('تم إضافة حساب البنك بنجاح');
      }

      await fetchBankAccounts();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      toast.error('خطأ: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedEmployee) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('employee_bank_accounts')
        .update({ status })
        .eq('employee_id', selectedEmployee.id);
      if (error) throw error;
      toast.success(`تم ${status === 'APPROVED' ? 'اعتماد' : 'رفض'} الحساب بنجاح`);
      await fetchBankAccounts();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error('فشل تحديث الحالة: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateIBAN = (bankCode: string) => {
    // Generate a dummy IBAN for testing (format: EG + 2 digits + 25 digits)
    const checkDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const branchCode = '0010'; // Example branch code
    const accountNumber = Math.floor(Math.random() * 1e16).toString().padStart(17, '0'); // 17 digits for account
    const iban = `EG${checkDigits}${bankCode}${branchCode}${accountNumber}`;
    setFormData({ ...formData, iban });
    toast.success('تم إنشاء IBAN افتراضي');
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 to-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
        <h2 className="text-4xl font-black mb-3">إدارة حسابات البنوك</h2>
        <p className="text-slate-300 font-medium max-w-2xl">
          أضف أو حدّث معلومات الحسابات البنكية (IBAN) لجميع الموظفين لتسهيل تحويلات الرواتب الآلية.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative">
          <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="ابحث عن موظف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
          />
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(employee => {
          const bankInfo = bankAccounts[employee.id];
          const hasAccount = !!bankInfo;

          return (
            <div
              key={employee.id}
              className={`p-6 rounded-2xl border-2 transition-all hover:shadow-lg cursor-pointer ${
                hasAccount
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
              }`}
              onClick={() => handleOpenModal(employee)}
            >
              {/* Employee Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black">
                  {employee.name?.charAt(0) || 'M'}
                </div>
                <div className="flex-grow">
                  <h3 className="font-black text-slate-800">{employee.name}</h3>
                  <p className="text-xs text-slate-500">{employee.title}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                {hasAccount ? (
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 text-white text-xs font-black rounded-full ${
                      bankInfo.status === 'APPROVED' ? 'bg-emerald-500' : bankInfo.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}>
                      <i className={`fas ${bankInfo.status === 'APPROVED' ? 'fa-check-circle' : bankInfo.status === 'REJECTED' ? 'fa-times-circle' : 'fa-clock'}`}></i>
                      {bankInfo.status === 'APPROVED' ? 'معتمد' : bankInfo.status === 'REJECTED' ? 'مرفوض' : 'قيد المراجعة'}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500 text-white text-xs font-black rounded-full">
                    <i className="fas fa-exclamation-circle"></i>
                    بدون حساب
                  </span>
                )}
              </div>

              {/* Bank Info */}
              {hasAccount && bankInfo && (
                <div className="space-y-2 text-xs border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">البنك:</span>
                    <span className="font-black text-slate-800">{bankInfo.bank_name}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-600">IBAN:</span>
                    <div className="flex items-center gap-1 font-mono text-slate-800 truncate">
                      <span>{revealedAccounts[`${employee.id}_iban`] ? bankInfo.iban : maskValue(bankInfo.iban, 'iban')}</span>
                      <button 
                        onClick={() => toggleReveal(employee.id, employee.name, 'iban', bankInfo.iban)}
                        className="text-slate-400 hover:text-indigo-600 focus:outline-none px-1"
                        title={revealedAccounts[`${employee.id}_iban`] ? "إخفاء" : "إظهار"}
                      >
                        <i className={`fas ${revealedAccounts[`${employee.id}_iban`] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-600">الحساب:</span>
                    <div className="flex items-center gap-1 font-mono text-slate-800">
                      <span>{revealedAccounts[`${employee.id}_account_number`] ? bankInfo.account_number : maskValue(bankInfo.account_number, 'account_number')}</span>
                      <button 
                        onClick={() => toggleReveal(employee.id, employee.name, 'account_number', bankInfo.account_number)}
                        className="text-slate-400 hover:text-indigo-600 focus:outline-none px-1"
                        title={revealedAccounts[`${employee.id}_account_number`] ? "إخفاء" : "إظهار"}
                      >
                        <i className={`fas ${revealedAccounts[`${employee.id}_account_number`] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition">
                {hasAccount ? 'تحديث الحساب' : 'إضافة حساب بنكي'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-800">إضافة حساب بنكي</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Employee Info */}
            <div className="bg-indigo-50 p-4 rounded-xl mb-6 border border-indigo-200">
              <p className="text-xs text-indigo-600 mb-1">الموظف</p>
              <p className="font-black text-slate-800">{selectedEmployee.name}</p>
              <p className="text-xs text-slate-600">{selectedEmployee.email}</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4" dir="rtl">
              {/* Bank Name */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">اسم البنك *</label>
                <select
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">اختر البنك</option>
                  {egyptianBanks.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">رقم الحساب *</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="مثال: 0123456789"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* IBAN */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  IBAN (رقم الحساب الدولي) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                    placeholder="مثال: EG1234567890123456789012345678"
                    className="flex-grow p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateIBAN('0090')}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition font-black text-xs"
                  >
                    توليد
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">يجب أن يبدأ بـ EG متبوعاً بـ 29 حرف/رقم</p>
              </div>

              {/* Account Holder */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">اسم صاحب الحساب</label>
                <input
                  type="text"
                  value={formData.account_holder}
                  onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                  placeholder="كما هو مسجل بالبنك"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Swift Code */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">رمز SWIFT (اختياري)</label>
                <input
                  type="text"
                  value={formData.swift_code || ''}
                  onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                  placeholder="مثال: NBEGEGCA"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              {/* Branch Code */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">رمز الفرع (اختياري)</label>
                <input
                  type="text"
                  value={formData.branch_code || ''}
                  onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                  placeholder="رمز فرع البنك"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Default Account */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <label className="text-sm font-black text-slate-700 cursor-pointer">
                  حساب افتراضي للتحويلات
                </label>
              </div>

              {/* Approval Actions (Only for existing accounts) */}
              {bankAccounts[selectedEmployee.id] && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleUpdateStatus('APPROVED')}
                    className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition"
                  >
                    اعتماد الحساب
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition"
                  >
                    رفض الحساب
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-black hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveAccount}
                disabled={isLoading}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
          <p className="text-xs text-emerald-600 font-black mb-1">موظفين بحساب بنكي</p>
          <p className="text-3xl font-black text-emerald-600">
            {Object.keys(bankAccounts).length} / {employees.length}
          </p>
        </div>
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
          <p className="text-xs text-amber-600 font-black mb-1">بدون حساب</p>
          <p className="text-3xl font-black text-amber-600">
            {employees.length - Object.keys(bankAccounts).length}
          </p>
        </div>
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
          <p className="text-xs text-indigo-600 font-black mb-1">نسبة الإكمال</p>
          <p className="text-3xl font-black text-indigo-600">
            {Math.round((Object.keys(bankAccounts).length / employees.length) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default BankAccountManagement;
