import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Employee, LeaveRequest } from './types';

const EmployeeProfileView: React.FC = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ phone: '', avatarUrl: '' });
  const [activeTab, setActiveTab] = useState<'details' | 'leaves'>('details');
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    type: 'Annual',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initialize = async () => {
      await fetchCurrentEmployee();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (employee) {
      fetchLeaveHistory(employee.id);
    }
  }, [employee]);

  const fetchLeaveHistory = async (employeeId: string) => {
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false });
    if (data) setLeaves(data);
  };

  const fetchCurrentEmployee = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_id', user.id)
          .limit(1).maybeSingle(); // Use maybeSingle() to handle zero rows gracefully

        if (error) throw error;

        if (data) {
          // Map DB data to Employee type
          const mappedEmployee: Employee = {
            id: data.id,
            name: `${data.first_name} ${data.last_name || ''}`.trim(),
            title: data.job_title || 'N/A',
            dep: 'N/A', // You might want to fetch department name via join if needed
            email: data.email,
            phone: data.phone,
            status: data.status,
            device: data.device_id || 'Not Paired',
            avatarUrl: data.avatar_url,
            basicSalary: data.basic_salary,
            hireDate: data.hire_date,
            documents: [],
            careerHistory: []
          };
          setEmployee(mappedEmployee);
          setEditData({ phone: data.phone || '', avatarUrl: data.avatar_url || '' });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!employee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({ phone: editData.phone, avatar_url: editData.avatarUrl })
        .eq('id', employee.id);

      if (error) throw error;

      alert('تم تحديث الملف الشخصي بنجاح');
      setIsEditModalOpen(false);
      fetchCurrentEmployee(); // Refresh data
    } catch (error: any) {
      alert('فشل التحديث: ' + error.message);
    }
  };

  const handleRequestLeave = async () => {
    if (!employee || !newLeave.start_date || !newLeave.end_date) {
      alert('يرجى ملء تواريخ الإجازة');
      return;
    }

    try {
      const { error } = await supabase.from('leaves').insert({
        employee_id: employee.id,
        type: newLeave.type,
        start_date: newLeave.start_date,
        end_date: newLeave.end_date,
        reason: newLeave.reason,
        status: 'PENDING'
      });
      if (error) throw error;
      alert('تم إرسال طلب الإجازة بنجاح.');
      setIsLeaveModalOpen(false);
      fetchLeaveHistory(employee.id);
    } catch (error: any) {
      alert('فشل إرسال الطلب: ' + error.message);
    }
  };

  const handleEnrollMfa = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (error) throw error;

      setMfaFactorId(data.id);
      setMfaQrCode(data.totp.qr_code);
      setIsMfaModalOpen(true);
    } catch (error: any) {
      alert('فشل بدء إعداد المصادقة الثنائية: ' + error.message);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaFactorId || !mfaCode) return;
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeError) throw challengeError;

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });
      if (verifyError) throw verifyError;

      alert('تم تفعيل المصادقة الثنائية بنجاح!');
      setIsMfaModalOpen(false);
      setMfaCode('');
    } catch (error: any) {
      alert('فشل التحقق من الرمز: ' + error.message);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('كلمتا المرور غير متطابقتين.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });

    if (error) {
      alert('فشل تغيير كلمة المرور: ' + error.message);
    } else {
      alert('تم تغيير كلمة المرور بنجاح.');
      setIsPasswordModalOpen(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to storage bucket. Here we use base64 for demo or assume URL handling
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">جاري تحميل الملف الشخصي...</div>;
  }

  if (!employee) {
    return <div className="p-10 text-center text-rose-500">لم يتم العثور على بيانات الموظف.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex items-center gap-6 flex-row-reverse">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg shrink-0">
            {employee.avatarUrl ? (
              <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-4xl">
                <i className="fas fa-user"></i>
              </div>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black text-slate-800">{employee.name}</h2>
            <p className="text-slate-500 font-bold mt-1">{employee.title}</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
           <button onClick={() => setActiveTab('details')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'details' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>البيانات</button>
           <button onClick={() => setActiveTab('leaves')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'leaves' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>سجل الإجازات</button>
        </div>
      </div>

      {activeTab === 'details' ? (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
        {/* Personal Info */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
           <h3 className="text-lg font-black text-slate-800 border-b border-slate-50 pb-4">البيانات الشخصية</h3>
           <div className="space-y-4">
              <div className="flex justify-between">
                 <span className="text-slate-400 text-xs font-bold">الاسم الكامل</span>
                 <span className="text-slate-800 text-sm font-black">{employee.name}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-slate-400 text-xs font-bold">البريد الإلكتروني</span>
                 <span className="text-slate-800 text-sm font-bold">{employee.email}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-slate-400 text-xs font-bold">رقم الهاتف</span>
                 <span className="text-slate-800 text-sm font-bold" dir="ltr">{employee.phone}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-slate-400 text-xs font-bold">كلمة المرور</span>
                 <button onClick={() => setIsPasswordModalOpen(true)} className="text-xs font-bold text-indigo-600 hover:underline">
                    تغيير كلمة المرور
                 </button>
              </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs font-bold">المصادقة الثنائية (2FA)</span>
                  <button onClick={handleEnrollMfa} className="text-xs font-bold text-emerald-600 hover:underline">
                      تفعيل
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs font-bold">تعديل البيانات</span>
                  <button onClick={() => setIsEditModalOpen(true)} className="text-xs font-bold text-blue-600 hover:underline">
                      تحديث
                  </button>
                </div>
              <div className="flex justify-between">
                 <span className="text-slate-400 text-xs font-bold">تاريخ التعيين</span>
                 <span className="text-slate-800 text-sm font-bold">{employee.hireDate}</span>
              </div>
           </div>
        </div>

        {/* Job & Financial Info */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
           <h3 className="text-lg font-black text-slate-800 border-b border-slate-50 pb-4">البيانات الوظيفية والمالية</h3>
           <div className="space-y-4">
              <div className="flex justify-between">
                 <span className="text-slate-400 text-xs font-bold">المسمى الوظيفي</span>
                 <span className="text-indigo-600 text-sm font-black">{employee.title}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-slate-400 text-xs font-bold">القسم</span>
                 <span className="text-slate-800 text-sm font-bold">{employee.dep}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                 <span className="text-slate-500 text-xs font-bold">الراتب الأساسي</span>
                 <span className="text-emerald-600 text-lg font-black">{employee.basicSalary?.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-slate-400 text-xs font-bold">حالة الموظف</span>
                 <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${employee.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {employee.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
                 </span>
              </div>
           </div>
        </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-800">سجل الإجازات</h3>
              <button onClick={() => setIsLeaveModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2">
                <i className="fas fa-plus"></i> طلب إجازة جديد
              </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">نوع الإجازة</th>
                  <th className="px-8 py-5">تاريخ البدء</th>
                  <th className="px-8 py-5">تاريخ الانتهاء</th>
                  <th className="px-8 py-5">السبب</th>
                  <th className="px-8 py-5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-6 font-bold text-slate-700">{leave.type}</td>
                    <td className="px-8 py-6 text-sm text-slate-500">{leave.start_date}</td>
                    <td className="px-8 py-6 text-sm text-slate-500">{leave.end_date}</td>
                    <td className="px-8 py-6 text-xs text-slate-500 truncate max-w-xs">{leave.reason || '-'}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${
                        leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                        leave.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل الملف الشخصي</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                    {editData.avatarUrl ? (
                      <img src={editData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <i className="fas fa-camera text-3xl text-slate-300"></i>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                    <i className="fas fa-pen text-xs"></i>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">رقم الهاتف</label>
                <input 
                  type="tel" 
                  value={editData.phone}
                  onChange={e => setEditData({...editData, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  dir="ltr"
                />
              </div>

              <button 
                onClick={handleUpdateProfile}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تغيير كلمة المرور</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">كلمة المرور الجديدة</label>
                <input 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">تأكيد كلمة المرور الجديدة</label>
                <input 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button 
                onClick={handleChangePassword}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4"
              >
                تحديث كلمة المرور
              </button>
            </div>
          </div>
        </div>
      )}

      {isMfaModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">إعداد المصادقة الثنائية</h3>
              <button onClick={() => setIsMfaModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-6 text-center">
              <p className="text-xs text-slate-500">امسح رمز QR التالي باستخدام تطبيق المصادقة (مثل Google Authenticator):</p>
              {mfaQrCode && (
                <div className="flex justify-center">
                   <img src={mfaQrCode} alt="QR Code" className="w-48 h-48 border-4 border-slate-100 rounded-xl" />
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">رمز التحقق</label>
                <input 
                  type="text" 
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value)}
                  placeholder="أدخل الرمز المكون من 6 أرقام"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-widest"
                />
              </div>
              <button 
                onClick={handleVerifyMfa}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition"
              >
                تفعيل الحماية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfileView;
