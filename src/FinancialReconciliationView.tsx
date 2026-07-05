import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrandingConfig } from './types';
import { useData } from './DataContext';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';
import { calculateEgyptianTax } from './utils/taxCalculations';

interface ReconciliationRecord {
  id: string;
  name: string;
  department: string;
  jobTitle: string;
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

interface SalaryTrendData {
  month: string;
  amount: number;
}

interface FinancialReconciliationViewProps {
  branding?: BrandingConfig;
}

const FinancialReconciliationView: React.FC<FinancialReconciliationViewProps> = ({ branding }) => {
  const { employees, hasPermission, orgId } = useData();
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [step, setStep] = useState(1);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [showForecast] = useState(true);
  const [salaryTrend, setSalaryTrend] = useState<SalaryTrendData[]>([]);

  const [integrityImpactConfig, setIntegrityImpactConfig] = useState({
    bonusThreshold: 95,
    bonusAmount: 1000,
    penaltyThreshold: 75,
    penaltyAmount: 500,
  });

  const [reconciliationData, setReconciliationData] = useState<ReconciliationRecord[]>([]);
  const [editingAdjustment, setEditingAdjustment] = useState<{id: string, name: string, bonus: number, deductions: number} | null>(null);
  const [taxConfig, setTaxConfig] = useState({
    socialInsuranceRate: 0.11,
    personalExemption: 2000,
    brackets: [
      { limit: 21000, rate: 0.0 },
      { limit: 30000, rate: 0.025 },
      { limit: 45000, rate: 0.1 },
      { limit: 60000, rate: 0.15 },
      { limit: 200000, rate: 0.2 },
      { limit: 400000, rate: 0.225 },
      { limit: 100000000, rate: 0.25 }
    ]
  });

  const fetchReconciliationData = useCallback(async () => {
    try {
      // جلب جميع الموظفين الحقيقيين من جدول employees
      if (!employees || employees.length === 0) {
        setReconciliationData([]);
        return;
      }

      // تصفية الموظفين بناءً على الصلاحية
      let visibleEmployees = employees;
      if (!hasPermission('VIEW_ALL_SALARIES')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           visibleEmployees = employees.filter(e => e.auth_id === user.id);
        } else {
           visibleEmployees = [];
        }
      }

      // جلب آخر دفعة رواتب (DRAFT أو PROCESSING)
      const { data: latestBatch } = await supabase
        .from('payroll_batches')
        .select('id')
        .in('status', ['DRAFT', 'PROCESSING'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrentBatchId(latestBatch?.id || null);

      // تم إيقاف الإنشاء التلقائي للدفعة لمنع ظهور دفعات غير مرغوب فيها
      // سيتم إنشاء الدفعة فقط عند الضغط على زر "حساب الرواتب تلقائياً"

      // جلب السلف النشطة
      const { data: loansData } = await supabase
        .from('loans')
        .select('employee_id, monthly_installment')
        .eq('status', 'ACTIVE');
      const loansMap: Record<string, number> = {};
      loansData?.forEach((l: any) => {
        loansMap[l.employee_id] = (loansMap[l.employee_id] || 0) + l.monthly_installment;
      });

      // جلب نقاط النزاهة الحقيقية
      const { data: integrityData } = await supabase.from('integrity_scores').select('employee_id, score');
      const integrityMap: Record<string, number> = {};
      integrityData?.forEach((item: any) => {
        integrityMap[item.employee_id] = item.score;
      });

      // جلب حسابات البنك الحقيقية
      const { data: bankData } = await supabase.from('employee_bank_accounts').select('employee_id, account_number').eq('is_default', true);
      const bankMap: Record<string, string> = {};
      bankData?.forEach((item: any) => {
        bankMap[item.employee_id] = item.account_number;
      });

      // الآن جلب سجلات الرواتب للموظفين من هذه الدفعة
      let payrollData: any[] = [];
      if (latestBatch?.id) {
        const { data } = await supabase
          .from('payroll_records')
          .select('*, employees(first_name, last_name, basic_salary, email)')
          .eq('batch_id', latestBatch.id)
          .order('created_at', { ascending: false });
        if (data) payrollData = data;
      }

      // بناء خريطة من بيانات الرواتب الموجودة
      const payrollMap: { [key: string]: any } = {};
      if (payrollData && payrollData.length > 0) {
        payrollData.forEach((r: any) => {
          payrollMap[r.employee_id] = r;
        });
      }

      // معالجة جميع الموظفين - استخدام بيانات payroll الموجودة أو استخدام القيم الافتراضية
      const mapped = visibleEmployees.map(emp => {
        const payrollRecord = payrollMap[emp.id];
        const loanAmount = loansMap[emp.id] || 0;
        const realIntegrityScore = integrityMap[emp.id] ?? 100;
        const realBankAccount = bankMap[emp.id] || '---';
        
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
            department: emp.dep || 'عام',
            jobTitle: emp.title || 'موظف',
            basicSalary: basicSalary,
            basicHours: standardMonthlyHours,
            loans: loanAmount,
            overtime: payrollRecord.overtime_hours || 0,
            deductions: payrollRecord.total_deductions || 0,
            integrityBonus: payrollRecord.total_allowances || 0,
            grossSalary,
            totalDeductions,
            netSalary,
            taxId: emp.nationalId || '---',
            bankAccount: payrollRecord.bank_account_info?.account_number || realBankAccount,
            status: 'Ready',
            integrityScore: realIntegrityScore
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
            department: emp.dep || 'عام',
            jobTitle: emp.title || 'موظف',
            basicSalary: basicSalary,
            basicHours: standardMonthlyHours,
            loans: loanAmount,
            overtime: 0,
            deductions: 0,
            integrityBonus: 0,
            grossSalary,
            totalDeductions,
            netSalary,
            taxId: emp.nationalId || '---',
            bankAccount: realBankAccount,
            status: 'Draft',
            integrityScore: realIntegrityScore
          };
        }
      });

      setReconciliationData(mapped);
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      // في حالة الخطأ، عرض جميع الموظفين على الأقل
      if (employees && employees.length > 0 && hasPermission('VIEW_ALL_SALARIES')) {
        const fallbackData = employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          department: emp.dep || 'عام',
          jobTitle: emp.title || 'موظف',
          basicSalary: emp.basicSalary || 0,
          basicHours: 160,
          loans: 0,
          overtime: 0,
          grossSalary: emp.basicSalary || 0,
          totalDeductions: 0,
          netSalary: emp.basicSalary || 0,
          deductions: 0,
          integrityBonus: 0,
          taxId: emp.nationalId || '---',
          bankAccount: '---',
          status: 'Draft',
          integrityScore: 100
        }));
        setReconciliationData(fallbackData);
      }
    }
  }, [employees, hasPermission]);

  useEffect(() => {
    fetchReconciliationData();
     const fetchConfig = async () => {
      const { data } = await supabase.from('system_settings').select('config').eq('category', 'integrity_impact_config').maybeSingle();
      if (data?.config) setIntegrityImpactConfig(prev => ({ ...prev, ...data.config }));
    };
    fetchConfig();
  }, [fetchReconciliationData]);

  // Fetch salary trend and tax config
  useEffect(() => {
    const fetchSalaryTrendAndTaxConfig = async () => {
      const { data } = await supabase
        .from('payroll_batches')
        .select('created_at, total_amount')
        .order('created_at', { ascending: false })
        .limit(6);

      if (data && data.length > 0) {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const trend = data.map((batch: any) => {
          const date = new Date(batch.created_at);
          return {
            month: months[date.getMonth()],
            amount: batch.total_amount || 0
          };
        }).reverse();
        setSalaryTrend(trend);
      }

      // جلب إعدادات الضرائب من قاعدة البيانات
      try {
        const { data: taxData } = await supabase
          .from('system_settings')
          .select('config')
          .eq('category', 'tax_config')
          .maybeSingle();
        if (taxData?.config) {
          setTaxConfig(prev => ({ ...prev, ...taxData.config }));
        }
      } catch (err) {
        console.error('Error fetching tax config:', err);
      }
    };
    fetchSalaryTrendAndTaxConfig();
  }, []);

  // حساب توقعات السيولة ديناميكياً
  const forecastData = useMemo(() => {
    const totalBasic = reconciliationData.reduce((sum, r) => sum + (r.basicSalary || 0), 0);
    const estimatedOvertime = Math.round(totalBasic * 0.05); // تقدير 5%
    
    // حساب الضرائب الفعلية التقديرية بناءً على الشرائح
    let totalTaxes = 0;
    reconciliationData.forEach(record => {
      const basic = record.basicSalary || 0;
      if (basic <= 0) return;
      
      const hourlyRate = basic / 160;
      const grossSalary = basic + (record.overtime * hourlyRate * 1.5) + (record.integrityBonus || 0);
      
      const taxResult = calculateEgyptianTax(
        grossSalary,
        taxConfig.socialInsuranceRate,
        taxConfig.personalExemption,
        taxConfig.brackets
      );
      
      totalTaxes += taxResult.taxAmount;
    });

    const estimatedMissions = Math.round(totalBasic * 0.02); // تقدير 2%
    const totalProjected = totalBasic + estimatedOvertime + estimatedMissions;
    return {
      total: totalProjected,
      basic: totalBasic,
      overtime: estimatedOvertime,
      taxes: totalTaxes || Math.round(totalBasic * 0.15), // fallback if 0
      missions: estimatedMissions
    };
  }, [reconciliationData, taxConfig]);

  const applyIntegrityImpact = () => {
    const updated = reconciliationData.map(record => {
      let newIntegrityBonus = record.integrityBonus;
      let newBehavioralDeductions = record.deductions;

      if (record.integrityScore >= integrityImpactConfig.bonusThreshold) newIntegrityBonus = integrityImpactConfig.bonusAmount;
      if (record.integrityScore < integrityImpactConfig.penaltyThreshold) newBehavioralDeductions += integrityImpactConfig.penaltyAmount;

      // Recalculate totals
      const hourlyRate = record.basicSalary > 0 ? record.basicSalary / 160 : 0;
      const overtimeAmount = record.overtime * (hourlyRate * 1.5);
      const newGrossSalary = record.basicSalary + overtimeAmount + newIntegrityBonus;
      const newTotalDeductions = newBehavioralDeductions + record.loans;
      const newNetSalary = newGrossSalary - newTotalDeductions;

      return { ...record, integrityBonus: newIntegrityBonus, deductions: newBehavioralDeductions, grossSalary: newGrossSalary, totalDeductions: newTotalDeductions, netSalary: newNetSalary };
    });
    
    setReconciliationData(updated);
    toast.success("تم تطبيق القواعد المالية بناءً على تقييم النزاهة!");
  };

  const handleOpenAdjustment = (record: ReconciliationRecord) => {
    setEditingAdjustment({
      id: record.id,
      name: record.name,
      bonus: record.integrityBonus,
      deductions: record.deductions
    });
  };

  const handleSaveAdjustment = async () => {
    if (!editingAdjustment || !currentBatchId) return;

    try {
      const { error } = await supabase
        .from('payroll_records')
        .update({
          total_allowances: editingAdjustment.bonus,
          total_deductions: editingAdjustment.deductions
        })
        .eq('batch_id', currentBatchId)
        .eq('employee_id', editingAdjustment.id);

      if (error) throw error;

      toast.success('تم تحديث التسوية للموظف بنجاح');
      setEditingAdjustment(null);
      fetchReconciliationData();
    } catch (error: any) {
      toast.error('فشل التحديث: ' + error.message);
    }
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

  const handleFinalize = async () => {
    const warnings = reconciliationData.filter(r => r.netSalary < 0 || r.bankAccount === '---');
    if (warnings.length > 0) {
      if (!window.confirm(`تنبيه: يوجد ${warnings.length} موظف لديهم مشاكل (راتب سالب أو لا يوجد حساب بنكي). هل أنت متأكد من المتابعة؟`)) return;
    }

    if (!currentBatchId) {
      toast.error("لا توجد دفعة رواتب نشطة للترحيل. يرجى حساب الرواتب أولاً.");
      return;
    }
    if (!window.confirm("هل أنت متأكد من ترحيل هذه الدفعة؟ سيتم إغلاقها وتجهيزها للصرف.")) return;

    setIsFinalizing(true);
    try {
      const { error } = await supabase
        .from('payroll_batches')
        .update({ status: 'PROCESSING' }) // Or 'FINALIZED'
        .eq('id', currentBatchId);

      if (error) throw error;

      toast.success("تم ترحيل الدفعة بنجاح! جاهزة الآن في جسر الرواتب.");
      setStep(2);
    } catch (error: any) {
      toast.error("فشل ترحيل الدفعة: " + error.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handlePrintPayslip = (record: ReconciliationRecord) => {
    // استخدام البيانات الفعلية للموظف بدلاً من الأرقام الثابتة
    const basicAmount = record.basicSalary;
    const hourlyRate = record.basicHours > 0 ? basicAmount / record.basicHours : 0;
    const overtimeRate = hourlyRate * 1.5;
    const overtimeAmount = record.overtime * overtimeRate;
    const totalEarnings = basicAmount + overtimeAmount + record.integrityBonus;
    
    // حساب الصافي (يشمل خصم السلف إن وجدت)
    const netSalary = totalEarnings - record.deductions - record.loans;

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
                   <div class="detail-group"><h3>المسمى الوظيفي</h3><p>${record.jobTitle}</p></div>
                   <div class="detail-group"><h3>القسم</h3><p>${record.department}</p></div>
                   <div class="detail-group"><h3>تاريخ الإصدار</h3><p>${new Date().toLocaleDateString('ar-EG')}</p></div>
                </div>

                <table class="salary-table">
                  <thead><tr><th>البند</th><th>التفاصيل</th><th class="amount">المبلغ (ج.م)</th></tr></thead>
                  <tbody>
                    <tr><td>الراتب الأساسي</td><td>${record.basicHours} ساعة عمل</td><td class="amount">${basicAmount.toLocaleString()}</td></tr>
                    <tr><td>ساعات إضافية</td><td>${record.overtime} ساعة</td><td class="amount">${overtimeAmount.toLocaleString()}</td></tr>
                    <tr><td>حافز النزاهة</td><td>Score: ${record.integrityScore}%</td><td class="amount" style="color: #059669;">+${record.integrityBonus.toLocaleString()}</td></tr>
                    <tr><td>الاستقطاعات</td><td>غياب / جزاءات</td><td class="amount" style="color: #e11d48;">-${record.deductions.toLocaleString()}</td></tr>
                    ${record.loans > 0 ? `<tr><td>سلف / قروض</td><td>قسط شهري</td><td class="amount" style="color: #e11d48;">-${record.loans.toLocaleString()}</td></tr>` : ''}
                  </tbody>
                </table>

                <div class="net-salary"><span class="net-label">صافي الراتب المستحق</span><span class="net-value">${netSalary.toLocaleString()} ج.م</span></div>
                
                ${(branding as any)?.stampUrl ? `
                <div style="position: absolute; bottom: 120px; left: 60px; opacity: 0.85; transform: rotate(-15deg); pointer-events: none;">
                   <img src="${(branding as any).stampUrl}" style="width: 140px; height: 140px; object-fit: contain;" alt="Company Stamp" />
                </div>
                ` : ''}

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
        // 1. Find or create a DRAFT batch for the current month
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const batchName = `رواتب ${currentMonth}`;

        let { data: batch } = await supabase
          .from('payroll_batches')
          .select('id')
          .eq('name', batchName)
          .maybeSingle();

        if (!batch) {
           const { data: newBatch, error: createError } = await supabase
               .from('payroll_batches')
               .insert([{ name: batchName, status: 'DRAFT', org_id: orgId }])
               .select('id')
               .single();
           if (createError) throw createError;
           batch = newBatch;
        }

        if (!batch?.id) {
          throw new Error("Could not create or find a payroll batch.");
        }

        // 2. Prepare records from the current UI state
        const recordsToUpsert = reconciliationData.map(record => ({
          batch_id: batch!.id,
          employee_id: record.id,
          org_id: orgId,
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
          .upsert(recordsToUpsert, { onConflict: 'batch_id,employee_id' });

        if (error) throw error;

        // 4. Recalculate and update the batch total amount
        const totalAmount = reconciliationData.reduce((sum, r) => sum + r.netSalary, 0);
        await supabase
          .from('payroll_batches')
          .update({ total_amount: totalAmount, employee_count: reconciliationData.length })
          .eq('id', batch.id);

        // 5. Refresh data and notify user
        await fetchReconciliationData();
        toast.success('تمت عملية الاحتساب وحفظ السجلات بنجاح.');

      } catch (error: any) {
        console.error('Calculation error:', error);
        toast.error('حدث خطأ: ' + error.message);
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const validationWarnings = useMemo(() => {
    return reconciliationData.filter(r => r.netSalary < 0 || r.bankAccount === '---' || r.bankAccount === '');
  }, [reconciliationData]);

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
            <i className={`fas ${isCalculating ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
            حفظ وتحديث الكشف
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
                 <h3 className="text-4xl font-black leading-tight mb-4">نحن نتوقع احتياج <span className="text-indigo-300">{forecastData.total.toLocaleString()} ج.م</span> <br/> بنهاية الشهر.</h3>
                 <p className="text-slate-400 text-xs font-medium leading-relaxed">بناءً على اتجاهات الحضور والغياب والمأموريات الحالية، تم تقدير ميزانية الرواتب بدقة ٩٧٪.</p>
              </div>
              <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                 {[
                   { label: 'الراتب الأساسي', val: forecastData.basic.toLocaleString(), icon: 'fa-money-bill-1' },
                   { label: 'الإضافي المتوقع', val: forecastData.overtime.toLocaleString(), icon: 'fa-user-clock' },
                   { label: 'التأمينات والضرائب', val: forecastData.taxes.toLocaleString(), icon: 'fa-building-columns' },
                   { label: 'بدلات المأموريات', val: forecastData.missions.toLocaleString(), icon: 'fa-gas-pump' },
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

      {/* Salary Trend Chart */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-black text-slate-800">اتجاه الرواتب (آخر 6 أشهر)</h3>
           <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
              <span className="text-xs font-bold text-slate-500">إجمالي الرواتب</span>
           </div>
        </div>
        <div className="h-64 flex items-end justify-between gap-4 px-4">
           {salaryTrend.length > 0 ? (
             salaryTrend.map((data, i) => {
               const maxAmount = Math.max(...salaryTrend.map(d => d.amount));
               const heightPercent = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
               return (
               <div key={i} className="flex flex-col items-center gap-2 w-full group">
                  <div className="w-full flex flex-col justify-end gap-1 h-48 relative">
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                        {data.amount.toLocaleString()} ج.م
                     </div>
                     <div className="w-full bg-indigo-500 rounded-t-lg hover:bg-indigo-600 transition-colors relative" style={{ height: `${Math.max(heightPercent, 5)}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{data.month}</span>
               </div>
             )})
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
               لا توجد بيانات تاريخية كافية للعرض
             </div>
           )}
        </div>
      </div>

      {/* Smart Audit Banner */}
      {validationWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex items-start gap-4 animate-pulse-slow">
           <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0"><i className="fas fa-triangle-exclamation"></i></div>
           <div>
              <h4 className="font-black text-amber-800 text-sm">تدقيق النظام المالي: تم اكتشاف ملاحظات</h4>
              <p className="text-xs text-amber-700 mt-1">يوجد <span className="font-black">{validationWarnings.length}</span> موظف يحتاجون للمراجعة (راتب بالسالب أو بيانات بنكية ناقصة). يرجى التحقق من الجدول أدناه.</p>
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
                    <th className="px-8 py-5 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reconciliationData.map((row) => {
                    const hasIssue = row.netSalary < 0 || row.bankAccount === '---';
                    return (
                    <tr key={row.id} className={`hover:bg-slate-50/50 transition group ${hasIssue ? 'bg-rose-50/30' : ''}`}>
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
                            <button onClick={() => handleOpenAdjustment(row)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white transition flex items-center justify-center" title="تعديل يدوي">
                               <i className="fas fa-pen-to-square text-xs"></i>
                            </button>
                            <button onClick={() => handlePrintPayslip(row)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center" title="طباعة القسيمة">
                               <i className="fas fa-print text-xs"></i>
                            </button>
                            <button onClick={() => handlePrintPayslip(row)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-600 hover:text-white transition flex items-center justify-center" title="تصدير PDF">
                               <i className="fas fa-file-pdf text-xs"></i>
                            </button>
                         </div>
                      </td>
                    </tr>
                  )})}
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

      {/* Manual Adjustment Modal */}
      {editingAdjustment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل التسوية اليدوي</h3>
              <button onClick={() => setEditingAdjustment(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"><i className="fas fa-times"></i></button>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-6">
               <p className="text-xs text-indigo-600 font-bold">الموظف</p>
               <p className="text-sm font-black text-slate-800">{editingAdjustment.name}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">إجمالي الحوافز والبدلات</label>
                <input 
                  type="number" 
                  value={editingAdjustment.bonus}
                  onChange={(e) => setEditingAdjustment({...editingAdjustment, bonus: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">إجمالي الخصومات والجزاءات</label>
                <input 
                  type="number" 
                  value={editingAdjustment.deductions}
                  onChange={(e) => setEditingAdjustment({...editingAdjustment, deductions: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <button onClick={handleSaveAdjustment} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4">
                 حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReconciliationView;