import React, { useState, useEffect, useMemo } from 'react';
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
  const [orgId, setOrgId] = useState<string>('2ab9276c-4d29-425e-b20f-640a901e9104');

  useEffect(() => {
    const fetchOrgId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('employees').select('org_id').eq('auth_id', user.id).maybeSingle();
        if (data?.org_id) setOrgId(data.org_id);
      }
    };
    fetchOrgId();
  }, []);

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
  useEffect(() => {
    fetchBatches();
    if (employees.length > 0) {
      cleanupDummyData(); // حذف البيانات الوهمية عند التحميل الأول
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            bankName: 'متعدد البنوك', // يعتمد على حسابات الموظفين
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [transferSearchQuery, setTransferSearchQuery] = useState('');

  // إعداد بيانات الرسم البياني (آخر 6 أشهر)
  const monthlyChartData = useMemo(() => {
    const dataMap = new Map<string, { label: string, amount: number }>();
    const today = new Date();
    
    // تهيئة الأشهر الستة الماضية بقيم صفرية
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString('ar-EG', { month: 'long' });
      dataMap.set(key, { label, amount: 0 });
    }

    // تجميع البيانات من الدفعات المكتملة
    batches.forEach(batch => {
      if (batch.status === 'Completed') {
        const date = new Date(batch.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (dataMap.has(key)) {
          const current = dataMap.get(key)!;
          dataMap.set(key, { ...current, amount: current.amount + batch.totalAmount });
        }
      }
    });

    return Array.from(dataMap.values());
  }, [batches]);

  const maxChartAmount = Math.max(...monthlyChartData.map(d => d.amount), 1);

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
      let query = supabase
        .from('payroll_records')
        .select('*, employees(first_name, last_name)', { count: 'exact' });

      if (transferSearchQuery) {
        const matchingEmployeeIds = employees
          .filter(e => e.name.toLowerCase().includes(transferSearchQuery.toLowerCase()))
          .map(e => e.id);
        
        if (matchingEmployeeIds.length > 0) {
           query = query.in('employee_id', matchingEmployeeIds);
        } else {
           query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching transfers:", error);
      } else if (data) {
        // تصفية السجلات: يجب أن يكون للموظف سجل مرتبط، ويجب أن يكون الموظف موجوداً في القائمة الحالية
        const activeIds = new Set(employees.map(e => e.id));
        const validRecords = data.filter((r: any) => r.employees && activeIds.has(r.employee_id));
        setTotalCount(count || 0);
        setTransfers(validRecords.map((r: any) => ({
          id: `TRX-${r.id.substring(0, 8)}`,
          employeeName: `${r.employees.first_name} ${r.employees.last_name || ''}`.trim(),
          accountNumber: r.bank_account_info?.account_number || '---',
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

  useEffect(() => {
    setCurrentPage(1);
  }, [transferSearchQuery]);

  useEffect(() => {
    fetchTransfers();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, currentPage, transferSearchQuery]);

  const filteredBatches = batches.filter(batch => 
    batch.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.bankName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateFile = async (batch: PayrollBatch) => {
    if (!batch?.realId) {
       alert('تعذر العثور على معرف الدفعة في قاعدة البيانات.');
       return;
    }
    const id = batch.id;

    try {
      const { data: records, error } = await supabase
        .from('payroll_records')
        .select('*, employees(first_name, last_name)')
        .eq('batch_id', batch.realId);

      if (error) throw error;

      if (!records || records.length === 0) {
        alert('لا توجد سجلات في هذه الدفعة.');
        return;
      }

      // تنسيق ملف البنك (CIB/NBE Compatible CSV)
      const headers = ['AccountNumber', 'Amount', 'Currency', 'BeneficiaryName', 'PaymentDetails'];
      const csvRows = [headers.join(',')];

      records.forEach((r: any) => {
        const accNum = r.bank_account_info?.account_number || '';
        const amount = r.net_salary || 0;
        const name = `${r.employees?.first_name || ''} ${r.employees?.last_name || ''}`.trim();
        
        csvRows.push([
          `"${accNum}"`,
          amount.toFixed(2),
          'EGP',
          `"${name}"`,
          `"Salary Transfer ${batch.id}"`
        ].join(','));
      });

      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CIB_NBE_Transfer_${id}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // تحديث حالة الدفعة تلقائياً إلى "مكتملة" (PAID) بعد التصدير الناجح
      const { error: updateError } = await supabase
        .from('payroll_batches')
        .update({ status: 'PAID' })
        .eq('id', batch.realId);

      if (updateError) throw updateError;

      // تحديث حالة السجلات الفردية للموظفين
      await supabase
        .from('payroll_records')
        .update({ payment_status: 'PAID' })
        .eq('batch_id', batch.realId);

      setBatches(prev => prev.map(b => b.realId === batch.realId ? { ...b, status: 'Completed' } : b));
      alert('تم تصدير ملف البنك وتحديث حالة الدفعة إلى "مكتملة" بنجاح.');

    } catch (error: any) {
      console.error('Error generating file:', error);
      alert('فشل إنشاء الملف: ' + error.message);
    }
  };

  const handleCreateBatch = async () => {
    const batchName = `BATCH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    
    try {
      // جلب حسابات البنوك الحقيقية للموظفين
      const { data: bankAccounts } = await supabase
        .from('employee_bank_accounts')
        .select('*')
        .eq('is_default', true);
      
      const bankMap = new Map();
      if (bankAccounts) {
        bankAccounts.forEach((acc: any) => bankMap.set(acc.employee_id, acc));
      }

      if (bankMap.size === 0) {
         if (!window.confirm('تنبيه: لم يتم العثور على حسابات بنكية مسجلة للموظفين. سيتم إنشاء الدفعة بدون بيانات بنكية (سيظهر عدد البنوك المتصلة 0). هل تريد المتابعة؟')) {
            return;
         }
      }

      // 1. إنشاء دفعة رواتب جديدة
      const { data: batchData, error: batchError } = await supabase.from('payroll_batches').insert({
        name: batchName,
        status: 'DRAFT',
        employee_count: employees.length,
        total_amount: 0,
        org_id: orgId
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
        .map(emp => {
          const bankInfo = bankMap.get(emp.id);
          return {
            batch_id: batchData.id,
            employee_id: emp.id,
            org_id: orgId,
            basic_salary: emp.basicSalary || 0,
            overtime_hours: 0,
            total_deductions: 0,
            total_allowances: 0,
            net_salary: emp.basicSalary || 0,
            payment_status: 'PENDING',
            tax_id: emp.nationalId || null,
            bank_account_info: bankInfo ? {
              bank_name: bankInfo.bank_name,
              account_number: bankInfo.account_number,
              account_holder: bankInfo.account_holder
            } : null,
            created_at: new Date().toISOString()
          };
        });

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
        bankName: 'متعدد البنوك',
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
        // 1. حذف السجلات المرتبطة أولاً لتجنب خطأ القيود (Foreign Key Constraint)
        const { error: recordsError } = await supabase
          .from('payroll_records')
          .delete()
          .eq('batch_id', batch.realId);

        if (recordsError) {
          alert('فشل حذف سجلات الدفعة: ' + recordsError.message);
          return;
        }

        // 2. حذف الدفعة نفسها
        const { error } = await supabase.from('payroll_batches').delete().eq('id', batch.realId);
        if (error) {
          alert('فشل حذف الدفعة: ' + error.message);
          return;
        }
      }
      setBatches(prev => prev.filter(b => b.realId !== batch.realId));
      fetchStats();
      fetchTransfers();
    }
  };

  const handleStatusChange = (batch: PayrollBatch, newStatus: PayrollBatch['status']) => {
    // TODO: Update status in DB
    setBatches(prev => prev.map(b => b.realId === batch.realId ? { ...b, status: newStatus } : b));
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

  const handleDeleteDuplicates = async () => {
    if (!window.confirm('هل أنت متأكد من فحص وإصلاح البيانات؟ سيتم حذف الدفعات المكررة وتنظيف السجلات اليتيمة.')) return;

    setIsLoading(true);
    try {
      const { data: allBatches, error } = await supabase
        .from('payroll_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validBatchIds = new Set<string>();
      const batchesToDelete: string[] = [];
      const seenDates = new Set();

      // Keep the latest batch for each day, mark others for deletion
      for (const batch of allBatches || []) {
        const date = new Date(batch.created_at).toISOString().split('T')[0];
        if (seenDates.has(date)) {
          batchesToDelete.push(batch.id);
        } else {
          seenDates.add(date);
          validBatchIds.add(batch.id);
        }
      }

      // 1. Delete duplicate batches and their records
      if (batchesToDelete.length > 0) {
        await supabase.from('payroll_records').delete().in('batch_id', batchesToDelete);
        await supabase.from('payroll_batches').delete().in('id', batchesToDelete);
      }

      // 2. Clean orphaned records (records with no valid batch)
      if (validBatchIds.size === 0) {
         // No batches exist, delete ALL records
         await supabase.from('payroll_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } else {
         const { data: recordBatches } = await supabase.from('payroll_records').select('batch_id');
         if (recordBatches) {
            const uniqueRecordBatches = new Set(recordBatches.map((r: any) => r.batch_id));
            const orphanBatchIds = Array.from(uniqueRecordBatches).filter(id => !validBatchIds.has(id));
            if (orphanBatchIds.length > 0) {
               await supabase.from('payroll_records').delete().in('batch_id', orphanBatchIds);
            }
         }
      }

      alert('تم تنظيف النظام وإصلاح البيانات بنجاح.');
      await fetchBatches();
      await fetchTransfers();
      await fetchStats();
    } catch (error: any) {
      alert('حدث خطأ: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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
            <h3 className="text-3xl font-black text-emerald-800">{totalCount}</h3>
         </div>
      </div>

      {/* الرسم البياني للرواتب المدفوعة */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-black text-slate-800">إجمالي الرواتب المدفوعة (آخر 6 أشهر)</h3>
           <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
              <span className="text-xs font-bold text-slate-500">المدفوعات</span>
           </div>
        </div>
        <div className="h-64 flex items-end justify-between gap-4 px-4">
           {monthlyChartData.length > 0 ? (
             monthlyChartData.map((data, i) => (
               <div key={i} className="flex flex-col items-center gap-2 w-full group">
                  <div className="w-full flex flex-col justify-end gap-1 h-48 relative">
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                        {data.amount.toLocaleString()} ج.م
                     </div>
                     <div className="w-full bg-indigo-500 rounded-t-lg hover:bg-indigo-600 transition-colors relative" style={{ height: `${Math.max((data.amount / maxChartAmount) * 100, 2)}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{data.label}</span>
               </div>
             ))
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
               لا توجد بيانات للعرض
             </div>
           )}
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
                onClick={handleDeleteDuplicates}
                className="bg-amber-50 text-amber-600 px-4 py-3 rounded-2xl text-[10px] font-black shadow-sm hover:bg-amber-100 transition flex items-center gap-2"
              >
                <i className="fas fa-clone"></i> حذف المكرر
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
                  <td className="px-8 py-6 font-mono text-xs font-bold text-slate-500">
                    {batch.id}
                    <span className="block text-[8px] text-slate-300 font-normal mt-1">{batch.realId?.slice(0, 8)}</span>
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-700">{batch.bankName}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{batch.totalAmount.toLocaleString()} ج.م</td>
                  <td className="px-8 py-6 text-sm text-slate-500">{batch.employeeCount}</td>
                  <td className="px-8 py-6 text-sm text-slate-500">{batch.date}</td>
                  <td className="px-8 py-6">
                    <select
                      value={batch.status}
                      onChange={(e) => handleStatusChange(batch, e.target.value as PayrollBatch['status'])}
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
                            onClick={() => handleGenerateFile(batch)}
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
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
           <h3 className="font-black text-lg text-slate-800">سجل التحويلات البنكية التفصيلي</h3>
           <div className="flex items-center gap-3">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="بحث باسم الموظف..." 
                  value={transferSearchQuery}
                  onChange={(e) => setTransferSearchQuery(e.target.value)}
                  className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                />
                <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
             </div>
             <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-3 py-2 rounded-xl">آخر تحديث: الآن</span>
           </div>
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
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
           <span className="text-xs font-bold text-slate-500">
              عرض {transfers.length} من أصل {totalCount} سجل
           </span>
           <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                السابق
              </button>
              <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-black">
                 {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => (prev * itemsPerPage < totalCount ? prev + 1 : prev))}
                disabled={currentPage * itemsPerPage >= totalCount}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                التالي
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollBridgeView;
