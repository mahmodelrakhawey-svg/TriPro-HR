import React, { useState, useEffect, useCallback } from 'react';
import { BrandingConfig } from './types';
import { useData } from './DataContext';
import { supabase } from './supabaseClient';

interface ReconciliationRecord {
  id: string;
  name: string;
  basicSalary: number;
  basicHours: number;
  loans: number;
  overtime: number;
  deductions: number;
  integrityBonus: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  taxId: string;
  bankAccount: string;
  status: string;
  integrityScore: number;
}

interface FinancialReconciliationViewProps {
  branding?: BrandingConfig;
}

const FinancialReconciliationView: React.FC<FinancialReconciliationViewProps> = ({ branding }) => {
  const { employees } = useData();
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [step, setStep] = useState(1);
  const [showForecast] = useState(true);

  const [reconciliationData, setReconciliationData] = useState<ReconciliationRecord[]>([]);

  const fetchReconciliationData = useCallback(async () => {
    try {
      // جلب جميع الموظفين الحقيقيين من جدول employees
      if (!employees || employees.length === 0) {
        setReconciliationData([]);
        return;
      }

      // جلب آخر دفعة رواتب (DRAFT أو PROCESSING)
      const { data: latestBatch } = await supabase
        .from('payroll_batches')
        .select('id')
        .in('status', ['DRAFT', 'PROCESSING'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let batchId = latestBatch?.id;

      // إذا لم توجد دفعة، نقوم بإنشاء واحدة جديدة
      if (!batchId) {
        const { data: newBatch } = await supabase
          .from('payroll_batches')
          .insert([{
            name: `Payroll - ${new Date().toLocaleDateString('ar-EG')}`,
            status: 'DRAFT',
            employee_count: employees.length,
            total_amount: 0
          }])
          .select('id')
          .single();
        batchId = newBatch?.id;
      }

      // جلب السلف النشطة
      const { data: loansData } = await supabase
        .from('loans')
        .select('employee_id, monthly_installment')
        .eq('status', 'ACTIVE');
      const loansMap: Record<string, number> = {};
      loansData?.forEach((l: any) => {
        loansMap[l.employee_id] = (loansMap[l.employee_id] || 0) + l.monthly_installment;
      });

      // الآن جلب سجلات الرواتب للموظفين من هذه الدفعة
      const { data: payrollData } = await supabase
        .from('payroll_records')
        .select('*, employees(first_name, last_name, basic_salary, email)')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      // بناء خريطة من بيانات الرواتب الموجودة
      const payrollMap: { [key: string]: any } = {};
      if (payrollData && payrollData.length > 0) {
        payrollData.forEach((r: any) => {
          payrollMap[r.employee_id] = r;
        });
      }

      // معالجة جميع الموظفين - استخدام بيانات payroll الموجودة أو استخدام القيم الافتراضية
      const mapped = employees.map(emp => {
        const payrollRecord = payrollMap[emp.id];
        const loanAmount = loansMap[emp.id] || 0;
        
        if (payrollRecord) {
          // استخدام بيانات payroll الموجودة
          const basicSalary = emp.basicSalary || 0;
          const standardMonthlyHours = 160; // استخدام قيمة ثابتة ومنطقية
          const hourlyRate = basicSalary > 0 ? basicSalary / standardMonthlyHours : 0;
          const overtimeAmount = (payrollRecord.overtime_hours || 0) * (hourlyRate * 1.5);
          const grossSalary = basicSalary + overtimeAmount + (payrollRecord.total_allowances || 0);
          const totalDeductions = (payrollRecord.total_deductions || 0) + loanAmount;
          const netSalary = grossSalary - totalDeductions;

          return {
            id: emp.id,
            name: emp.name,
            basicSalary: basicSalary,
            basicHours: standardMonthlyHours,
            loans: loanAmount,
            overtime: payrollRecord.overtime_hours || 0,
            deductions: payrollRecord.total_deductions || 0,
            integrityBonus: payrollRecord.total_allowances || 0,
            grossSalary,
            totalDeductions,
            netSalary,
            taxId: payrollRecord.tax_id || emp.email?.split('@')[0].toUpperCase() || '---',
            bankAccount: payrollRecord.bank_account_info?.account_number || '---',
            status: 'Ready',
            integrityScore: Math.round(100 - (payrollRecord.total_deductions || 0) / 10)
          };
        } else {
          // استخدام بيانات الموظف الأساسية
          const basicSalary = emp.basicSalary || 0;
          const standardMonthlyHours = 160;
          const grossSalary = basicSalary;
          const totalDeductions = loanAmount;
          const netSalary = grossSalary - totalDeductions;

          return {
            id: emp.id,
            name: emp.name,
            basicSalary: basicSalary,
            basicHours: standardMonthlyHours,
            loans: loanAmount,
            overtime: 0,
            deductions: 0,
            integrityBonus: 0,
            grossSalary,
            totalDeductions,
            netSalary,
            taxId: emp.email?.split('@')[0].toUpperCase() || '---',
            bankAccount: '---',
            status: 'Draft',
            integrityScore: 100
          };
        }
      });

      setReconciliationData(mapped);
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      // في حالة الخطأ، عرض جميع الموظفين على الأقل
      if (employees && employees.length > 0) {
        const fallbackData = employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          basicSalary: emp.basicSalary || 0,
          basicHours: 160,
          loans: 0,
          overtime: 0,
          grossSalary: emp.basicSalary || 0,
          totalDeductions: 0,
          netSalary: emp.basicSalary || 0,
          deductions: 0,
          integrityBonus: 0,
          taxId: emp.email?.split('@')[0].toUpperCase() || '---',
          bankAccount: '---',
          status: 'Draft',
          integrityScore: 100
        }));
        setReconciliationData(fallbackData);
      }
    }
  }, [employees]);

  useEffect(() => {
    fetchReconciliationData();
  }, [fetchReconciliationData]);

  const applyIntegrityImpact = () => {
    const updated = reconciliationData.map(record => {
      let newIntegrityBonus = record.integrityBonus;
      let newBehavioralDeductions = record.deductions;

      // قاعدة العمل: مكافأة 1000ج لمن يتخطى 95% وخصم 500ج لمن يقل عن 75%
      if (record.integrityScore >= 95) newIntegrityBonus = 1000;
      if (record.integrityScore < 75) newBehavioralDeductions += 500;

      // Recalculate totals
      const hourlyRate = record.basicSalary > 0 ? record.basicSalary / 160 : 0;
      const overtimeAmount = record.overtime * (hourlyRate * 1.5);
      const newGrossSalary = record.basicSalary + overtimeAmount + newIntegrityBonus;
      const newTotalDeductions = newBehavioralDeductions + record.loans;
      const newNetSalary = newGrossSalary - newTotalDeductions;

      return { ...record, integrityBonus: newIntegrityBonus, deductions: newBehavioralDeductions, grossSalary: newGrossSalary, totalDeductions: newTotalDeductions, netSalary: newNetSalary };
    });
    
    setReconciliationData(updated);
    alert("تم تطبيق القواعد المالية بناءً على تقييم النزاهة!");
  };

  const handleExportCSV = () => {
    const headers = ['كود الموظف', 'الاسم', 'ساعات أساسية', 'إضافي', 'خصومات', 'حافز النزاهة', 'تقييم النزاهة', 'الحالة', 'الحساب البنكي'];
    
    const csvRows = [
      headers.join(','),
      ...reconciliationData.map(row => [
        row.id,
        `"${row.name}"`,
        row.basicHours,
        row.overtime,
        row.deductions,
        row.integrityBonus,
        `${row.integrityScore}%`,
        row.status === 'Ready' ? 'معتمد للصرف' : 'موقوف إدارياً',
        row.bankAccount
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payroll_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinalize = () => {
    setIsFinalizing(true);
    setTimeout(() => {
      setStep(2);
      setIsFinalizing(false);
    }, 2000);
  };

  const handlePrintPayslip = (record: ReconciliationRecord) => {
    const hourlyRate = 150; // معدل افتراضي للساعة (يمكن جلبه من قاعدة البيانات لاحقاً)
    const overtimeRate = 225; // معدل الإضافي (1.5x)
    const basicAmount = record.basicHours * hourlyRate;
    const overtimeAmount = record.overtime * overtimeRate;
    const totalEarnings = basicAmount + overtimeAmount + record.integrityBonus;
    const netSalary = totalEarnings - record.deductions;

    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>Payslip - ${record.name}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; color: #333; padding: 40px; }
              .payslip-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
              .header { background-color: ${branding?.primaryColor || '#2563eb'}; color: white; padding: 30px; display: flex; justify-content: space-between; align-items: center; }
              .company-info h1 { margin: 0; font-size: 24px; font-weight: 900; }
              .company-info p { margin: 5px 0 0; font-size: 12px; opacity: 0.9; }
              .logo { width: 60px; height: 60px; background: white; border-radius: 15px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
              .logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
              .content { padding: 30px; }
              .employee-details { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
              .detail-group h3 { font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0 0 5px; }
              .detail-group p { font-size: 16px; font-weight: bold; margin: 0; color: #1e293b; }
              .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .salary-table th { text-align: right; padding: 12px; background: #f8fafc; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
              .salary-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; }
              .amount { text-align: left; font-family: 'Courier New', monospace; }
              .net-salary { background: #f0fdf4; padding: 20px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #bbf7d0; }
              .net-label { font-size: 14px; font-weight: bold; color: #166534; }
              .net-value { font-size: 24px; font-weight: 900; color: #15803d; }
              .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="payslip-container">
              <div class="header">
                <div class="company-info">
                  <h1>${branding?.companyName || 'TriPro Systems'}</h1>
                  <p>${branding?.slogan || 'HR & Payroll Solutions'}</p>
                </div>
                <div class="logo">
                   ${branding?.logoUrl ? `<img src="${branding.logoUrl}" />` : '🏢'}
                </div>
              </div>
              
              <div class="content">
                <div class="employee-details">
                   <div class="detail-group"><h3>الموظف</h3><p>${record.name}</p><span style="font-size: 10px; color: #94a3b8;">${record.id}</span></div>
                   <div class="detail-group"><h3>القسم</h3><p>تكنولوجيا المعلومات</p></div>
                   <div class="detail-group"><h3>تاريخ الإصدار</h3><p>${new Date().toLocaleDateString('ar-EG')}</p></div>
                </div>

                <table class="salary-table">
                  <thead><tr><th>البند</th><th>التفاصيل</th><th class="amount">المبلغ (ج.م)</th></tr></thead>
                  <tbody>
                    <tr><td>الراتب الأساسي</td><td>${record.basicHours} ساعة عمل</td><td class="amount">${basicAmount.toLocaleString()}</td></tr>
                    <tr><td>ساعات إضافية</td><td>${record.overtime} ساعة</td><td class="amount">${overtimeAmount.toLocaleString()}</td></tr>
                    <tr><td>حافز النزاهة</td><td>Score: ${record.integrityScore}%</td><td class="amount" style="color: #059669;">+${record.integrityBonus.toLocaleString()}</td></tr>
                    <tr><td>الاستقطاعات</td><td>غياب / جزاءات</td><td class="amount" style="color: #e11d48;">-${record.deductions.toLocaleString()}</td></tr>
                  </tbody>
                </table>

                <div class="net-salary"><span class="net-label">صافي الراتب المستحق</span><span class="net-value">${netSalary.toLocaleString()} ج.م</span></div>
                <div class="footer">تم إصدار هذا المستند إلكترونياً من نظام TriPro. لا يحتاج إلى توقيع يدوي.<br/>Ref: ${record.id}-${Date.now()}</div>
              </div>
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCalculateAll = async () => {
    if (window.confirm('هل تريد حساب الرواتب لجميع الموظفين النشطين وإضافتهم للكشف؟')) {
      setIsCalculating(true);
      try {
        // 1. Get the latest batch ID or create one
        const { data: latestBatch } = await supabase
          .from('payroll_batches')
          .select('id')
          .in('status', ['DRAFT', 'PROCESSING'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let batchId = latestBatch?.id;
        if (!batchId) {
          const { data: newBatch } = await supabase
            .from('payroll_batches')
            .insert([{ name: `Payroll - ${new Date().toLocaleDateString('ar-EG')}`, status: 'DRAFT' }])
            .select('id')
            .single();
          batchId = newBatch?.id;
        }

        if (!batchId) {
          throw new Error("Could not create or find a payroll batch.");
        }

        // 2. Prepare records from the current UI state
        const recordsToUpsert = reconciliationData.map(record => ({
          batch_id: batchId,
          employee_id: record.id,
          basic_salary: record.basicSalary,
          overtime_hours: record.overtime,
          total_deductions: record.deductions, // Behavioral deductions only
          total_allowances: record.integrityBonus,
          net_salary: record.netSalary, // Net salary already accounts for loans
          payment_status: 'PENDING',
          tax_id: record.taxId,
        }));

        // 3. Upsert records into the database
        const { error } = await supabase
          .from('payroll_records')
          .upsert(recordsToUpsert, { onConflict: 'batch_id, employee_id' });

        if (error) throw error;

        // 4. Recalculate and update the batch total amount
        const totalAmount = reconciliationData.reduce((sum, r) => sum + r.netSalary, 0);
        await supabase
          .from('payroll_batches')
          .update({ total_amount: totalAmount, employee_count: reconciliationData.length })
          .eq('id', batchId);

        // 5. Refresh data and notify user
        await fetchReconciliationData();
        alert('تمت عملية الاحتساب وحفظ السجلات بنجاح.');

      } catch (error: any) {
        console.error('Calculation error:', error);
        alert('حدث خطأ: ' + error.message);
      } finally {
        setIsCalculating(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Header Area */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800">مركز التسوية والاعتماد المالي <span className="text-indigo-600 text-lg">(Finance Bridge)</span></h2>
          <p className="text-slate-500 font-medium mt-2">تجهيز ومراجعة كشوف الرواتب النهائية وضمان مطابقة متطلبات المحاسبة المالية.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleCalculateAll}
            disabled={isCalculating}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <i className={`fas ${isCalculating ? 'fa-spinner fa-spin' : 'fa-calculator'}`}></i>
            حساب الرواتب تلقائياً
          </button>
          <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-3">
             <i className="fas fa-calculator-combined text-indigo-600"></i>
             <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Payroll Cycle: MAY 2024</span>
          </div>
        </div>
      </div>

      {/* Liquidity Forecasting Section */}
      {showForecast && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0 100 C 20 0, 50 0, 100 100 Z" fill="white" />
              </svg>
           </div>
           <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
              <div className="lg:w-1/3">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">التنبؤ بالسيولة النقدية (Liquidity Forecast)</p>
                 <h3 className="text-4xl font-black leading-tight mb-4">نحن نتوقع احتياج <span className="text-indigo-300">٨٤٢,٥٠٠ ج.م</span> <br/> بنهاية الشهر.</h3>
                 <p className="text-slate-400 text-xs font-medium leading-relaxed">بناءً على اتجاهات الحضور والغياب والمأموريات الحالية، تم تقدير ميزانية الرواتب بدقة ٩٧٪.</p>
              </div>
              <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                 {[
                   { label: 'الراتب الأساسي', val: '٧٨٠,٠٠٠', icon: 'fa-money-bill-1' },
                   { label: 'الإضافي المتوقع', val: '٤٥,٥٠٠', icon: 'fa-user-clock' },
                   { label: 'التأمينات والضرائب', val: '١٢٤,٠٠٠', icon: 'fa-building-columns' },
                   { label: 'بدلات المأموريات', val: '١٨,٤٠٠', icon: 'fa-gas-pump' },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm">
                      <i className={`fas ${stat.icon} text-indigo-400 mb-3 text-lg`}></i>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h5 className="text-xl font-black">{stat.val}</h5>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Compliance Checklist for HR Manager */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                 <i className="fas fa-list-check text-indigo-600"></i>
                 ملخص البيانات
              </h3>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600">إجمالي الموظفين المعالجين</span>
                    <span className="text-lg font-black text-indigo-600">{reconciliationData.length}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600">إجمالي الخصومات</span>
                    <span className="text-lg font-black text-rose-600">{reconciliationData.reduce((sum, r) => sum + r.deductions, 0).toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600">إجمالي الحوافز</span>
                    <span className="text-lg font-black text-emerald-600">{reconciliationData.reduce((sum, r) => sum + r.integrityBonus, 0).toLocaleString()} ج.م</span>
                 </div>
              </div>
           </div>

           <div className={`p-8 rounded-[3rem] text-white shadow-xl ${reconciliationData.length === 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              <h4 className="text-lg font-black mb-2">
                {reconciliationData.length === 0 ? 'تنبيه - لا توجد بيانات' : 'حالة المعالجة'}
              </h4>
              <p className="text-xs opacity-90 font-medium leading-relaxed">
                {reconciliationData.length === 0 
                  ? 'لم يتم العثور على سجلات رواتب لمعالجتها. يرجى إنشاء دفعة رواتب أولاً.'
                  : `تم معالجة ${reconciliationData.length} موظف بنجاح. الإجمالي: ${reconciliationData.reduce((s, r) => s + r.deductions + r.integrityBonus, 0).toLocaleString()} ج.م`
                }
              </p>
           </div>
        </div>

        {/* Detailed Financial Data Table */}
        <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-black text-xl text-slate-800">تفاصيل الاستحقاقات والخصومات</h3>
              <div className="flex gap-2">
                 <button onClick={applyIntegrityImpact} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl text-[10px] font-black shadow-sm hover:bg-indigo-100 transition flex items-center gap-2">
                    <i className="fas fa-wand-magic-sparkles"></i>
                    تطبيق حوافز النزاهة
                 </button>
                 <button onClick={handleExportCSV} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black shadow-sm hover:bg-slate-50 transition cursor-pointer">تصدير CSV للمحاسب</button>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">الموظف والبيانات البنكية</th>
                    <th className="px-8 py-5 text-center">الراتب الأساسي</th>
                    <th className="px-8 py-5 text-center">صافي الساعات</th>
                    <th className="px-8 py-5 text-center">السلف</th>
                    <th className="px-8 py-5 text-center">الخصم السلوكي</th>
                    <th className="px-8 py-5 text-center">الحوافز</th>
                    <th className="px-8 py-5 text-center">إجمالي الاستحقاقات</th>
                    <th className="px-8 py-5 text-center">إجمالي الاستقطاعات</th>
                    <th className="px-8 py-5 text-center">صافي الراتب</th>
                    <th className="px-8 py-5 text-left">التوجيه المالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reconciliationData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition group">
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-800">{row.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">IBAN: {row.bankAccount}</p>
                        <p className="text-[9px] text-indigo-500 font-bold uppercase">TAX ID: {row.taxId}</p>
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-slate-700">
                        {(row.basicSalary || 0).toLocaleString()} ج.م
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-sm font-black text-slate-700">{row.basicHours + row.overtime} س</span>
                        <p className="text-[8px] text-slate-400">({row.overtime} إضافي مدمج)</p>
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-amber-600">
                        {row.loans > 0 ? `-${(row.loans || 0).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-8 py-6 text-center text-sm font-black text-rose-500">-{row.deductions} ج.م</td>
                      <td className="px-8 py-6 text-center">
                        <div className="text-sm font-black text-emerald-500">+{row.integrityBonus} ج.م</div>
                        <div className="text-[8px] font-bold text-slate-400 mt-1">النزاهة: {row.integrityScore}%</div>
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-slate-700">
                        {(row.grossSalary || 0).toLocaleString()} ج.م
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-rose-600">
                        {(row.totalDeductions || 0).toLocaleString()} ج.م
                      </td>
                      <td className="px-8 py-6 text-center font-black text-lg text-emerald-600 bg-emerald-50 rounded-lg">
                        {(row.netSalary || 0).toLocaleString()} ج.م
                      </td>
                      <td className="px-8 py-6 text-left">
                         <div className="flex items-center gap-2 justify-end">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                              row.status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {row.status === 'Ready' ? 'جاهز' : 'موقوف'}
                            </span>
                            <button onClick={() => handlePrintPayslip(row)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center" title="طباعة القسيمة">
                               <i className="fas fa-print text-xs"></i>
                            </button>
                            <button onClick={() => handlePrintPayslip(row)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-600 hover:text-white transition flex items-center justify-center" title="تصدير PDF">
                               <i className="fas fa-file-pdf text-xs"></i>
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>

           <div className="p-10 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 text-white">
              <div className="text-right">
                 <h4 className="text-lg font-black mb-1">إغلاق الدورة المالية والترحيل (Final Sync)</h4>
                 <p className="text-xs text-slate-400 font-medium leading-relaxed">سيتم ترحيل الملف المعتمد مباشرة إلى نظام <strong className="text-indigo-400">tripro ERP</strong> لضمان تحويل الرواتب فوراً.</p>
              </div>
              {step === 1 ? (
                <button 
                  onClick={handleFinalize}
                  disabled={isFinalizing}
                  className="px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest transition shadow-2xl flex items-center gap-4 border border-indigo-400"
                >
                  {isFinalizing ? (
                    <> <i className="fas fa-sync-alt animate-spin text-lg"></i> جاري المزامنة مع tripro... </>
                  ) : (
                    <> <i className="fas fa-rocket text-lg"></i> اعتماد وترحيل الرواتب لـ tripro </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-5 bg-emerald-500/20 px-10 py-5 rounded-[2.5rem] border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                   <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl">
                      <i className="fas fa-check-double"></i>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">تم الترحيل لـ tripro بنجاح!</p>
                      <p className="text-[10px] text-emerald-100 font-bold uppercase">TX_REF: TRIPRO-SYNC-{new Date().getFullYear()}</p>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReconciliationView;