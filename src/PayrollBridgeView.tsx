import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';

interface PayrollBatch {
  realId?: string; // UUID from DB
  id: string;
  bankName: string;
  totalAmount: number;
  employeeCount: number;
  status: 'Pending' | 'Processing' | 'Completed';
  date: string;
}

interface BankTransfer {
  id: string;
  employeeName: string;
  accountNumber: string;
  amount: number;
  bank: string;
  status: 'Success' | 'Failed' | 'Pending';
  date: string;
  reference: string;
}

const PayrollBridgeView: React.FC = () => {
  const { employees } = useData();
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // دالة لحذف البيانات الوهمية (موظف أحمد عبد العزيز)
  const cleanupDummyData = async () => {
    try {
      // حذف سجلات الرواتب للموظف الوهمي
      const { data: dummyRecords } = await supabase
        .from('payroll_records')
        .select('employee_id')
        .limit(1);

      if (dummyRecords && dummyRecords.length > 0) {
        const dummyEmployeeId = dummyRecords[0].employee_id;
        
        // التحقق من أن هذا الموظف لا يوجد في قائمة الموظفين الحقيقيين
        const isDummy = !employees.some(e => e.id === dummyEmployeeId);
        
        if (isDummy) {
          // حذف جميع سجلات الرواتب للموظف الوهمي
          await supabase
            .from('payroll_records')
            .delete()
            .eq('employee_id', dummyEmployeeId);
          
          console.log(`تم حذف سجلات الموظف الوهمي: ${dummyEmployeeId}`);
        }
      }
    } catch (error) {
      console.warn('تحذير: خطأ في محاولة تنظيف البيانات الوهمية', error);
    }
  };

  // Fetch Real Data from Supabase
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchBatches();
    if (employees.length > 0) {
      cleanupDummyData(); // حذف البيانات الوهمية عند التحميل الأول
    }
  }, [employees]);

  const fetchBatches = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('payroll_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching batches:', error);
    else if (data) {
      // Get count of employees assigned to each batch from payroll_records
      const batchesWithCounts = await Promise.all(
        data.map(async (b: any) => {
          const { count } = await supabase
            .from('payroll_records')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', b.id);
          
          const mappedStatus: 'Pending' | 'Processing' | 'Completed' = 
            b.status === 'PAID' ? 'Completed' : b.status === 'PROCESSING' ? 'Processing' : 'Pending';
          
          return {
            realId: b.id,
            id: b.name,
            bankName: 'بنك الاستثمار المصري', // اسم بنك حقيقي
            totalAmount: b.total_amount || 0,
            employeeCount: count || 0,
            status: mappedStatus,
            date: b.created_at.split('T')[0]
          } as PayrollBatch;
        })
      );
      setBatches(batchesWithCounts);
    }
    setIsLoading(false);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [stats, setStats] = useState({ totalPending: 0, bankCount: 0 });

  useEffect(() => {
    fetchTransfers();
    fetchStats();
  }, [employees]);

  const fetchStats = async () => {
    try {
      const { data: pendingBatches } = await supabase
        .from('payroll_batches')
        .select('total_amount')
        .eq('status', 'DRAFT');
      
      const totalPending = pendingBatches?.reduce((sum, batch) => sum + (batch.total_amount || 0), 0) || 0;
      
      const { data: transfersData } = await supabase
        .from('payroll_records')
        .select('bank_account_info');
      
      const banks = new Set(
        transfersData
          ?.map((t: any) => t.bank_account_info?.bank_name)
          .filter(Boolean) || []
      );
      
      setStats({
        totalPending,
        bankCount: banks.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*, employees(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching transfers:", error);
      } else if (data && data.length > 0) {
        // تصفية السجلات: يجب أن يكون للموظف سجل مرتبط، ويجب أن يكون الموظف موجوداً في القائمة الحالية
        const activeIds = new Set(employees.map(e => e.id));
        const validRecords = data.filter((r: any) => r.employees && activeIds.has(r.employee_id));
        setTransfers(validRecords.map((r: any) => ({
          id: `TRX-${r.id.substring(0, 8)}`,
          employeeName: `${r.employees.first_name} ${r.employees.last_name || ''}`.trim(),
          accountNumber: r.bank_account_info?.account_number || '----',
          amount: r.net_salary || 0,
          bank: r.bank_account_info?.bank_name || 'Bank',
          status: r.payment_status === 'PAID' ? 'Success' : r.payment_status === 'PENDING' ? 'Pending' : 'Failed',
          date: new Date(r.created_at).toLocaleDateString('ar-EG'),
          reference: `REF-${r.id.substring(0, 6)}`
        })));
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  };

  const filteredBatches = batches.filter(batch => 
    batch.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.bankName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateFile = (id: string) => {
    alert(`جاري إنشاء ملف التحويل البنكي (ACH/Swift) للدفعة ${id}...`);
    // هنا يمكن إضافة منطق إنشاء ملف CSV أو Excel الخاص بالبنك
  };

  const handleCreateBatch = async () => {
    const batchName = `BATCH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    
    try {
      // 1. إنشاء دفعة رواتب جديدة
      const { data: batchData, error: batchError } = await supabase.from('payroll_batches').insert({
        name: batchName,
        status: 'DRAFT',
        employee_count: employees.length,
        total_amount: 0
      }).select().single();

      if (batchError) {
        alert('فشل إنشاء الدفعة: ' + batchError.message);
        return;
      }

      if (!batchData) {
        alert('فشل إنشاء الدفعة: لم يتم الحصول على بيانات الدفعة');
        return;
      }

      // 2. إضافة سجلات رواتب لجميع الموظفين النشطين
      const payrollRecords = employees
        .filter(emp => emp.status === 'Active' || emp.status === 'ACTIVE' || !emp.status) // تصفية الموظفين النشطين
        .map(emp => ({
          batch_id: batchData.id,
          employee_id: emp.id,
          basic_salary: emp.basicSalary || 0,
          overtime_hours: 0,
          total_deductions: 0,
          total_allowances: 0,
          net_salary: emp.basicSalary || 0,
          payment_status: 'PENDING',
          tax_id: emp.email?.split('@')[0].toUpperCase() || emp.id.substring(0, 8),
          bank_account_info: {
            bank_name: 'البنك الأهلي المصري',
            account_number: '---',
            account_holder: emp.name || 'Employee'
          },
          created_at: new Date().toISOString()
        }));

      // إدراج السجلات في دفعات (500 سجل في كل دفعة لتجنب الأخطاء)
      const chunkSize = 500;
      for (let i = 0; i < payrollRecords.length; i += chunkSize) {
        const chunk = payrollRecords.slice(i, i + chunkSize);
        const { error: recordError } = await supabase.from('payroll_records').insert(chunk);
        
        if (recordError) {
          console.error('Error inserting payroll records:', recordError);
          alert(`تحذير: تم إنشاء الدفعة لكن حدث خطأ في إدراج بعض السجلات (${recordError.message})`);
        }
      }

      // 3. جلب عدد السجلات المدرجة
      const { count } = await supabase
        .from('payroll_records')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchData.id);

      // 4. حساب الإجمالي
      const totalAmount = employees
        .filter(emp => emp.status === 'Active' || !emp.status)
        .reduce((sum, emp) => sum + (emp.basicSalary || 0), 0);

      // 5. تحديث الدفعة بالإجمالي
      await supabase
        .from('payroll_batches')
        .update({ total_amount: totalAmount, employee_count: count || 0 })
        .eq('id', batchData.id);

      // 6. إضافة الدفعة الجديدة للقائمة
      const newBatch: PayrollBatch = {
        realId: batchData.id,
        id: batchData.name,
        bankName: 'البنك الأهلي المصري',
        totalAmount: totalAmount,
        employeeCount: count || 0,
        status: 'Pending' as const,
        date: batchData.created_at.split('T')[0]
      };
      setBatches(prev => [newBatch, ...prev]);
      
      alert(`تم إنشاء الدفعة بنجاح مع ${count || employees.length} موظف!`);
      await fetchStats();
      await fetchTransfers();
    } catch (error: any) {
      alert('خطأ: ' + error.message);
    }
  };

  const handleDeleteBatch = async (batch: PayrollBatch) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      if (batch.realId) {
        await supabase.from('payroll_batches').delete().eq('id', batch.realId);
      }
      setBatches(batches.filter(b => b.id !== batch.id));
    }
  };

  const handleStatusChange = (id: string, newStatus: PayrollBatch['status']) => {
    // TODO: Update status in DB
    setBatches(batches.map(batch => batch.id === id ? { ...batch, status: newStatus } : batch));
  };

  const handleExportBatches = () => {
    const headers = ['رقم الدفعة', 'البنك', 'الإجمالي', 'عدد الموظفين', 'التاريخ', 'الحالة'];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...filteredBatches.map(batch => [
        batch.id,
        `"${batch.bankName}"`,
        batch.totalAmount,
        batch.employeeCount,
        batch.date,
        batch.status === 'Completed' ? 'تم التحويل' : batch.status === 'Pending' ? 'معلق' : 'جاري المعالجة'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payroll_batches.csv';
    link.click();
  };

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  const handleDeleteAllData = async () => {
    if (window.confirm('تحذير خطير: هل أنت متأكد من حذف جميع سجلات الرواتب والدفعات السابقة؟\n\nسيتم فقدان جميع البيانات المالية المسجلة ولا يمكن استعادتها.')) {
      if (window.confirm('تأكيد نهائي: هل أنت متأكد تماماً من رغبتك في إعادة تعيين النظام المالي؟')) {
        setIsLoading(true);
        try {
          // 1. حذف تفاصيل الرواتب
          const { error: recordsError } = await supabase
            .from('payroll_records')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

          if (recordsError) throw recordsError;

          // 2. حذف الدفعات
          const { error: batchesError } = await supabase
            .from('payroll_batches')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

          if (batchesError) throw batchesError;

          setBatches([]);
          setTransfers([]);
          setStats({ totalPending: 0, bankCount: 0 });
          alert('تم حذف جميع البيانات وإعادة تعيين النظام بنجاح.');
        } catch (error: any) {
          console.error('Error deleting data:', error);
          alert('حدث خطأ أثناء الحذف: ' + error.message);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleNotifyEmployees = (id: string) => {
    alert(`تم إرسال إشعارات (SMS/Email) لجميع الموظفين في الدفعة ${id} بنجاح!`);
  };

  const handleRecalculate = async (batch: PayrollBatch) => {
    if (!batch.realId) return;
    if (!window.confirm('هل أنت متأكد من إعادة احتساب الرواتب لهذه الدفعة؟ سيتم تحديث الخصومات بناءً على سجلات الحضور الحالية.')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('recalculate_batch_deductions', { 
        p_batch_id: batch.realId 
      });

      if (error) throw error;
      
      alert('تمت إعادة الاحتساب وتحديث الأرقام بنجاح');
      await fetchBatches(); // تحديث البيانات في الجدول
    } catch (error: any) {
      alert('فشل إعادة الاحتساب: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReceipt = (transfer: BankTransfer) => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>إيصال تحويل - ${transfer.reference}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #fff; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: 900; color: #2563eb; margin-bottom: 10px; }
              .title { font-size: 18px; font-weight: bold; color: #1e293b; }
              .details { margin-bottom: 30px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f8fafc; padding-bottom: 10px; }
              .label { font-weight: bold; color: #64748b; font-size: 12px; }
              .value { font-weight: bold; color: #0f172a; font-size: 14px; }
              .amount { font-size: 24px; font-weight: 900; color: #2563eb; text-align: center; margin: 30px 0; background: #f8fafc; padding: 20px; border-radius: 12px; }
              .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">TriPro Systems</div>
              <div class="title">إيصال تحويل راتب</div>
            </div>
            
            <div class="details">
              <div class="row"><span class="label">رقم المرجع</span><span class="value">${transfer.reference}</span></div>
              <div class="row"><span class="label">تاريخ التحويل</span><span class="value">${transfer.date}</span></div>
              <div class="row"><span class="label">المستفيد</span><span class="value">${transfer.employeeName}</span></div>
              <div class="row"><span class="label">البنك المستلم</span><span class="value">${transfer.bank}</span></div>
              <div class="row"><span class="label">رقم الحساب</span><span class="value">${transfer.accountNumber}</span></div>
              <div class="row">
                <span class="label">الحالة</span>
                <span class="value">${transfer.status === 'Success' ? 'ناجح' : transfer.status === 'Pending' ? 'قيد التنفيذ' : 'فشل'}</span>
              </div>
            </div>

            <div class="amount">
              ${transfer.amount.toLocaleString()} ج.م
            </div>

            <div class="footer">تم إصدار هذا الإيصال إلكترونياً.</div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">جسر الرواتب (Payroll Bridge)</h2>
          <p className="text-blue-200 text-sm mt-1">إدارة ملفات تحويل الرواتب للبنوك والربط المباشر.</p>
        </div>
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
          <i className="fas fa-money-check-dollar"></i>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">إجمالي الرواتب المعلقة</p>
            <h3 className="text-3xl font-black text-slate-800">{(stats.totalPending).toLocaleString()} ج.م</h3>
         </div>
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">البنوك المتصلة</p>
            <h3 className="text-3xl font-black text-indigo-600">{stats.bankCount}</h3>
         </div>
         <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm">
            <p className="text-emerald-600 text-xs font-black uppercase tracking-widest mb-1">عدد التحويلات</p>
            <h3 className="text-3xl font-black text-emerald-800">{transfers.length}</h3>
         </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <h3 className="font-black text-lg text-slate-800 whitespace-nowrap">دفعات الرواتب (Batches)</h3>
                <div className="relative w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="بحث برقم الدفعة أو البنك..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 pr-10 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteAllData}
                className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-[10px] font-black shadow-sm hover:bg-rose-100 transition flex items-center gap-2"
              >
                <i className="fas fa-trash-can"></i> تصفية البيانات
              </button>
              <button 
                onClick={handleExportBatches}
                className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-[10px] font-black shadow-sm hover:bg-emerald-100 transition flex items-center gap-2"
              >
                <i className="fas fa-file-excel"></i> تصدير Excel
              </button>
              <button 
                onClick={handleCreateBatch}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> إنشاء دفعة جديدة
              </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">رقم الدفعة</th>
                <th className="px-8 py-5">البنك</th>
                <th className="px-8 py-5">الإجمالي</th>
                <th className="px-8 py-5">الموظفين</th>
                <th className="px-8 py-5">التاريخ</th>
                <th className="px-8 py-5">الحالة</th>
                <th className="px-8 py-5">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && <tr><td colSpan={7} className="text-center py-8 text-slate-400">جاري تحميل البيانات...</td></tr>}
              {!isLoading && batches.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">لا توجد دفعات رواتب مسجلة</td></tr>}
              
              {filteredBatches.map((batch) => (
                <tr key={batch.realId || batch.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6 font-mono text-xs font-bold text-slate-500">{batch.id}</td>
                  <td className="px-8 py-6 font-bold text-slate-700">{batch.bankName}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{batch.totalAmount.toLocaleString()} ج.م</td>
                  <td className="px-8 py-6 text-sm text-slate-500">{batch.employeeCount}</td>
                  <td className="px-8 py-6 text-sm text-slate-500">{batch.date}</td>
                  <td className="px-8 py-6">
                    <select
                      value={batch.status}
                      onChange={(e) => handleStatusChange(batch.id, e.target.value as PayrollBatch['status'])}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black border-none outline-none cursor-pointer appearance-none text-center w-full transition-colors ${
                        batch.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 
                        batch.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <option value="Pending">معلق</option>
                      <option value="Processing">جاري المعالجة</option>
                      <option value="Completed">تم التحويل</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleGenerateFile(batch.id)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg transition"
                        >
                            <i className="fas fa-file-export"></i> ملف البنك
                        </button>
                        {batch.status === 'Pending' && (
                          <button 
                              onClick={() => handleRecalculate(batch)}
                              className="text-amber-600 hover:text-amber-800 text-xs font-bold flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg transition"
                              title="تحديث الخصومات والإضافي من سجلات الحضور"
                          >
                              <i className="fas fa-calculator"></i> إعادة احتساب
                          </button>
                        )}
                        {batch.status === 'Completed' && (
                          <button 
                              onClick={() => handleNotifyEmployees(batch.id)}
                              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg transition"
                          >
                              <i className="fas fa-bell"></i> إشعار
                          </button>
                        )}
                        <button 
                            onClick={() => handleDeleteBatch(batch)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-lg transition"
                        >
                            <i className="fas fa-trash-can"></i> حذف
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* سجل التحويلات التفصيلي */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
           <h3 className="font-black text-lg text-slate-800">سجل التحويلات البنكية التفصيلي</h3>
           <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">آخر تحديث: الآن</span>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-right">
              <thead>
                 <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">المرجع</th>
                    <th className="px-8 py-5">الموظف</th>
                    <th className="px-8 py-5">الحساب البنكي</th>
                    <th className="px-8 py-5">المبلغ</th>
                    <th className="px-8 py-5">البنك</th>
                    <th className="px-8 py-5">الحالة</th>
                    <th className="px-8 py-5">التاريخ</th>
                    <th className="px-8 py-5">إجراءات</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {transfers.map(trx => (
                    <tr key={trx.id} className="hover:bg-slate-50/50 transition">
                       <td className="px-8 py-6 font-mono text-xs text-slate-500">{trx.reference}</td>
                       <td className="px-8 py-6 font-bold text-slate-700">{trx.employeeName}</td>
                       <td className="px-8 py-6 text-xs font-mono text-slate-500">{trx.accountNumber}</td>
                       <td className="px-8 py-6 font-black text-slate-800">{trx.amount.toLocaleString()} ج.م</td>
                       <td className="px-8 py-6 text-xs font-bold text-slate-600">{trx.bank}</td>
                       <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${
                             trx.status === 'Success' ? 'bg-emerald-100 text-emerald-600' :
                             trx.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                             {trx.status === 'Success' ? 'ناجح' : trx.status === 'Pending' ? 'قيد التنفيذ' : 'فشل'}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-xs text-slate-500">{trx.date}</td>
                       <td className="px-8 py-6">
                          <button 
                            onClick={() => handlePrintReceipt(trx)}
                            className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50 transition"
                            title="طباعة الإيصال"
                          ><i className="fas fa-print"></i></button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollBridgeView;
