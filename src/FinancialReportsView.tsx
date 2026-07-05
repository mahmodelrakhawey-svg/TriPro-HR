import React, { useState, useEffect, useCallback } from 'react';
import { useData } from './DataContext';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';
import { calculateEgyptianTax } from './utils/taxCalculations';

interface PayrollReport {
  month: string;
  totalAmount: number;
  employeeCount: number;
  avgSalary: number;
  maxSalary: number;
  minSalary: number;
  deductions: number;
  bonuses: number;
  status: string;
}

interface TaxReport {
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  socialInsurance: number;
  taxableIncome: number;
  taxAmount: number;
  taxRate: number;
}

interface BudgetAnalysis {
  department: string;
  budgeted: number;
  spent: number;
  variance: number;
  variancePercent: number;
  status: 'OK' | 'WARNING' | 'EXCEEDED';
}

interface VarianceReport {
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  previousSalary: number;
  difference: number;
  percentageChange: number;
}

const FinancialReportsView: React.FC = () => {
  const { employees, hasPermission } = useData();
  const [reportType, setReportType] = useState<'payroll' | 'tax' | 'budget' | 'cash_flow' | 'compliance' | 'variance'>('payroll');
  const [payrollReports, setPayrollReports] = useState<PayrollReport[]>([]);
  const [taxReports, setTaxReports] = useState<TaxReport[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis[]>([]);
  const [varianceReports, setVarianceReports] = useState<VarianceReport[]>([]);
  const [varianceSearchQuery, setVarianceSearchQuery] = useState('');

  // Fetch payroll reports
  const fetchPayrollReports = useCallback(async () => {
    try {
      // تحديد الموظفين المسموح برؤيتهم
      let visibleEmployeeIds: string[] | null = null;
      if (!hasPermission('VIEW_ALL_SALARIES')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           const userEmp = employees.find(e => e.auth_id === user.id);
           visibleEmployeeIds = userEmp ? [userEmp.id] : [];
        } else {
           visibleEmployeeIds = [];
        }
      }

      const { data: batches } = await supabase
        .from('payroll_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);

      if (batches && batches.length > 0) {
        const reports = await Promise.all(
          batches.map(async (batch) => {
            let query = supabase
              .from('payroll_records')
              .select('*')
              .eq('batch_id', batch.id);

            if (visibleEmployeeIds !== null) {
               if (visibleEmployeeIds.length === 0) return null;
               query = query.in('employee_id', visibleEmployeeIds);
            }
            const { data: records } = await query;

            if (records && records.length > 0) {
              const totalAmount = records.reduce((sum, r) => sum + (r.net_salary || 0), 0);
              const salaries = records.map(r => r.basic_salary || 0);
              
              return {
                month: new Date(batch.created_at).toLocaleDateString('ar-EG'),
                totalAmount,
                employeeCount: records.length,
                avgSalary: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
                maxSalary: Math.max(...salaries),
                minSalary: Math.min(...salaries),
                deductions: records.reduce((sum, r) => sum + (r.total_deductions || 0), 0),
                bonuses: records.reduce((sum, r) => sum + (r.total_allowances || 0), 0),
                status: batch.status
              };
            }
            return null;
          })
        );

        setPayrollReports(reports.filter((r): r is PayrollReport => r !== null));
      }
    } catch (error) {
      console.error('Error fetching payroll reports:', error);
      toast.error('خطأ في جلب تقارير الرواتب');
    }
  }, [employees, hasPermission]);

  // Fetch tax reports
  const fetchTaxReports = useCallback(async () => {
    try {
      let visibleEmployees = employees;
      if (!hasPermission('VIEW_ALL_SALARIES')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           visibleEmployees = employees.filter(e => e.auth_id === user.id);
        } else {
           visibleEmployees = [];
        }
      }

      // جلب آخر سجلات الرواتب لمعرفة المبالغ المدفوعة فعلياً
      const { data: records } = await supabase
        .from('payroll_records')
        .select('*')
        .order('created_at', { ascending: false });

      const latestRecordsMap = new Map();
      if (records) {
        records.forEach((r: any) => {
          if (!latestRecordsMap.has(r.employee_id)) {
            latestRecordsMap.set(r.employee_id, r);
          }
        });
      }

      // جلب إعدادات الضرائب من قاعدة البيانات
      const { data: taxConfigData } = await supabase
        .from('system_settings')
        .select('config')
        .eq('category', 'tax_config')
        .maybeSingle();

      const taxConfig = {
        socialInsuranceRate: taxConfigData?.config?.socialInsuranceRate || 0.11,
        personalExemption: taxConfigData?.config?.personalExemption || 2000,
        brackets: taxConfigData?.config?.brackets || [
          { limit: 21000, rate: 0.0 },
          { limit: 30000, rate: 0.025 },
          { limit: 45000, rate: 0.1 },
          { limit: 60000, rate: 0.15 },
          { limit: 200000, rate: 0.2 },
          { limit: 400000, rate: 0.225 },
          { limit: 100000000, rate: 0.25 }
        ]
      };

      // حساب الضرائب لجميع الموظفين (سواء تم الدفع لهم أم لا - كتقدير)
      const taxData = visibleEmployees.map(emp => {
        const record = latestRecordsMap.get(emp.id);
        // استخدام الراتب من السجل إذا وجد (فعلي)، وإلا استخدام الراتب الأساسي للموظف (تقديري)
        const grossSalary = record ? (record.basic_salary || 0) : (emp.basicSalary || 0);
        
        const taxResult = calculateEgyptianTax(
          grossSalary,
          taxConfig.socialInsuranceRate,
          taxConfig.personalExemption,
          taxConfig.brackets
        );

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          grossSalary,
          socialInsurance: taxResult.socialInsuranceAmount,
          taxableIncome: taxResult.taxableIncome,
          taxAmount: taxResult.taxAmount,
          taxRate: taxResult.effectiveRate
        };
      });

      setTaxReports(taxData);
    } catch (error) {
      console.error('Error fetching tax reports:', error);
      toast.error('خطأ في جلب تقارير الضرائب');
    }
  }, [employees, hasPermission]);

  // Fetch budget analysis
  const fetchBudgetAnalysis = useCallback(async () => {
    try {
      let visibleEmployees = employees;
      if (!hasPermission('VIEW_ALL_SALARIES')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           visibleEmployees = employees.filter(e => e.auth_id === user.id);
        } else {
           visibleEmployees = [];
        }
      }

      // جلب المصروفات الفعلية من آخر دفعة رواتب مدفوعة
      const { data: latestBatch } = await supabase
        .from('payroll_batches')
        .select('id')
        .eq('status', 'PAID')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let departmentSpending: Record<string, number> = {};
      
      if (latestBatch) {
        const { data: records } = await supabase
          .from('payroll_records')
          .select('employee_id, net_salary')
          .eq('batch_id', latestBatch.id);
          
        if (records) {
           records.forEach((r: any) => {
             const emp = visibleEmployees.find(e => e.id === r.employee_id);
             if (emp && emp.dep) {
               departmentSpending[emp.dep] = (departmentSpending[emp.dep] || 0) + (r.net_salary || 0);
             }
           });
        }
      }

      const departments = new Set(visibleEmployees.map(e => e.dep || 'General'));
      
      const analysis: BudgetAnalysis[] = Array.from(departments).map((dept) => {
        const deptEmployees = visibleEmployees.filter(e => e.dep === dept);
        const budgeted = deptEmployees.reduce((sum, e) => sum + (e.basicSalary || 0), 0);
        
        // استخدام المصروف الفعلي إذا وجد، وإلا 0 (مما يعني لم يتم الصرف بعد)
        const spent = departmentSpending[dept as string] || 0;
        
        const variance = budgeted - spent;
        const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

        // الحالة تعتمد على المقارنة الحقيقية
        let status: 'OK' | 'WARNING' | 'EXCEEDED' = 'OK';
        if (spent > budgeted) status = 'EXCEEDED';
        else if (spent > budgeted * 0.9) status = 'WARNING';

        return {
          department: dept as string,
          budgeted,
          spent: Math.round(spent),
          variance: Math.round(variance),
          variancePercent: Math.round(variancePercent * 100) / 100,
          status
        };
      });

      setBudgetAnalysis(analysis);
    } catch (error) {
      console.error('Error fetching budget analysis:', error);
      toast.error('خطأ في جلب تحليل الميزانية');
    }
  }, [employees, hasPermission]);

  // Fetch variance reports (مقارنة الرواتب)
  const fetchVarianceReports = useCallback(async () => {
    try {
      // تحديد الموظفين المسموح برؤيتهم
      let visibleEmployeeIds: string[] | null = null;
      if (!hasPermission('VIEW_ALL_SALARIES')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           const userEmp = employees.find(e => e.auth_id === user.id);
           visibleEmployeeIds = userEmp ? [userEmp.id] : [];
        } else {
           visibleEmployeeIds = [];
        }
      }

      // جلب آخر دفعتين
      const { data: batches } = await supabase
        .from('payroll_batches')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      if (!batches || batches.length < 2) {
        toast.error('لا توجد بيانات كافية للمقارنة (يجب توفر دفعتين على الأقل)');
        setVarianceReports([]);
        return;
      }

      const currentBatch = batches[0];
      const previousBatch = batches[1];

      // جلب سجلات الدفعة الحالية
      let currentQuery = supabase
        .from('payroll_records')
        .select('employee_id, net_salary, employees(first_name, last_name)')
        .eq('batch_id', currentBatch.id);

      if (visibleEmployeeIds !== null) {
         if (visibleEmployeeIds.length === 0) {
             setVarianceReports([]);
             return;
         }
         currentQuery = currentQuery.in('employee_id', visibleEmployeeIds);
      }
      const { data: currentRecords } = await currentQuery;

      // جلب سجلات الدفعة السابقة
      const { data: previousRecords } = await supabase
        .from('payroll_records')
        .select('employee_id, net_salary')
        .eq('batch_id', previousBatch.id);

      if (!currentRecords || !previousRecords) return;

      const prevMap = new Map();
      previousRecords.forEach((r: any) => prevMap.set(r.employee_id, r.net_salary || 0));

      const varianceData: VarianceReport[] = currentRecords.map((curr: any) => {
        const prevSalary = prevMap.get(curr.employee_id) || 0;
        const currentSalary = curr.net_salary || 0;
        const difference = currentSalary - prevSalary;
        const percentageChange = prevSalary !== 0 ? (difference / prevSalary) * 100 : 0;

        return {
          employeeId: curr.employee_id,
          employeeName: `${curr.employees?.first_name || ''} ${curr.employees?.last_name || ''}`.trim(),
          currentSalary,
          previousSalary: prevSalary,
          difference,
          percentageChange
        };
      });

      setVarianceReports(varianceData);
    } catch (error) {
      console.error('Error fetching variance reports:', error);
      toast.error('خطأ في جلب تقرير المقارنة');
    }
  }, [employees, hasPermission]);

  useEffect(() => {
    if (reportType === 'payroll') fetchPayrollReports();
    else if (reportType === 'tax') fetchTaxReports();
    else if (reportType === 'budget') fetchBudgetAnalysis();
    else if (reportType === 'variance') fetchVarianceReports();
  }, [reportType, fetchPayrollReports, fetchTaxReports, fetchBudgetAnalysis, fetchVarianceReports]);

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('تم تصدير التقرير بنجاح');
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 to-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
        <h2 className="text-4xl font-black mb-3">التقارير المالية المتقدمة</h2>
        <p className="text-slate-300 font-medium max-w-2xl">
          تقارير شاملة للمدير المالي: الرواتب، الضرائب، الميزانيات، التدفق النقدي، والالتزام القانوني.
        </p>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
        <div className="flex gap-3 justify-start">
          {[
            { id: 'payroll', label: '📊 تقارير الرواتب', icon: 'fa-money-bill' },
            { id: 'tax', label: '💰 الضرائب والخصومات', icon: 'fa-percent' },
            { id: 'variance', label: '⚖️ مقارنة الرواتب', icon: 'fa-scale-balanced' },
            { id: 'budget', label: '📈 تحليل الميزانية', icon: 'fa-chart-line' },
            { id: 'cash_flow', label: '💳 التدفق النقدي', icon: 'fa-water' },
            { id: 'compliance', label: '✅ الالتزام القانوني', icon: 'fa-shield' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-black text-sm whitespace-nowrap transition-all ${
                reportType === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className={`fas ${tab.icon} ml-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Based on Report Type */}
      {reportType === 'payroll' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {payrollReports.length > 0 && (
              <>
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
                  <p className="text-xs text-indigo-600 font-black mb-2">إجمالي الرواتب المدفوعة</p>
                  <p className="text-2xl font-black text-indigo-600">
                    {payrollReports.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString()} ج.م
                  </p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-black mb-2">متوسط الراتب</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {Math.round(payrollReports.reduce((sum, r) => sum + r.avgSalary, 0) / payrollReports.length).toLocaleString()} ج.م
                  </p>
                </div>
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200">
                  <p className="text-xs text-rose-600 font-black mb-2">إجمالي الخصومات</p>
                  <p className="text-2xl font-black text-rose-600">
                    {payrollReports.reduce((sum, r) => sum + r.deductions, 0).toLocaleString()} ج.م
                  </p>
                </div>
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                  <p className="text-xs text-amber-600 font-black mb-2">إجمالي الحوافز</p>
                  <p className="text-2xl font-black text-amber-600">
                    {payrollReports.reduce((sum, r) => sum + r.bonuses, 0).toLocaleString()} ج.م
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-800">تفاصيل دفعات الرواتب</h3>
              <button
                onClick={() => exportToCSV(payrollReports, 'payroll_report.csv')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition"
              >
                <i className="fas fa-download ml-2"></i>تصدير
              </button>
            </div>
            <div className="overflow-x-auto">
              {/* Variance Search Filter */}
              <div className="p-4 border-b border-slate-50">
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="بحث باسم الموظف..."
                    value={varianceSearchQuery}
                    onChange={(e) => setVarianceSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
              </div>

              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    <th className="px-6 py-4">الشهر</th>
                    <th className="px-6 py-4">عدد الموظفين</th>
                    <th className="px-6 py-4">إجمالي الرواتب</th>
                    <th className="px-6 py-4">متوسط الراتب</th>
                    <th className="px-6 py-4">الخصومات</th>
                    <th className="px-6 py-4">الحوافز</th>
                    <th className="px-6 py-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payrollReports.map((report, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{report.month}</td>
                      <td className="px-6 py-4 text-slate-600">{report.employeeCount}</td>
                      <td className="px-6 py-4 font-black text-indigo-600">{report.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">{report.avgSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 text-rose-600 font-black">-{report.deductions.toLocaleString()}</td>
                      <td className="px-6 py-4 text-emerald-600 font-black">+{report.bonuses.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                          report.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                          report.status === 'PROCESSING' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'tax' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
              <p className="text-xs text-indigo-600 font-black mb-2">إجمالي الضرائب</p>
              <p className="text-2xl font-black text-indigo-600">
                {taxReports.reduce((sum, r) => sum + r.taxAmount, 0).toLocaleString()} ج.م
              </p>
            </div>
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
              <p className="text-xs text-amber-600 font-black mb-2">إجمالي التأمينات (حصة الموظف)</p>
              <p className="text-2xl font-black text-amber-600">
                {taxReports.reduce((sum, r) => sum + r.socialInsurance, 0).toLocaleString()} ج.م
              </p>
            </div>
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200">
              <p className="text-xs text-rose-600 font-black mb-2">عدد الموظفين الخاضعين للضريبة</p>
              <p className="text-2xl font-black text-rose-600">
                {taxReports.length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-800">تفاصيل الضرائب والخصومات</h3>
              <button
                onClick={() => exportToCSV(taxReports, 'tax_report.csv')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition"
              >
                <i className="fas fa-download ml-2"></i>تصدير
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    <th className="px-6 py-4">الموظف</th>
                    <th className="px-6 py-4">الراتب الإجمالي</th>
                    <th className="px-6 py-4">التأمينات الاجتماعية</th>
                    <th className="px-6 py-4">الدخل الخاضع للضريبة</th>
                    <th className="px-6 py-4">معدل الضريبة</th>
                    <th className="px-6 py-4">مبلغ الضريبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {taxReports.slice(0, 20).map((report, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{report.employeeName}</td>
                      <td className="px-6 py-4 text-indigo-600 font-black">{report.grossSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 text-amber-600 font-bold">-{report.socialInsurance.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">{report.taxableIncome.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">{report.taxRate}%</td>
                      <td className="px-6 py-4 text-rose-600 font-black">{report.taxAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'variance' && (
        <div className="space-y-6">
          {/* Variance Distribution Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6">توزيع فروقات الرواتب</h3>
            <div className="flex items-end justify-around h-40 px-10 gap-8">
              {[
                { label: 'زيادة', count: varianceReports.filter(r => r.difference > 0).length, color: 'bg-emerald-500' },
                { label: 'ثبات', count: varianceReports.filter(r => r.difference === 0).length, color: 'bg-slate-400' },
                { label: 'نقصان', count: varianceReports.filter(r => r.difference < 0).length, color: 'bg-rose-500' }
              ].map((stat, idx) => {
                const total = varianceReports.length || 1;
                const height = Math.max((stat.count / total) * 100, 5); // Min height 5%
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-24 group">
                    <div className="relative w-full h-32 bg-slate-50 rounded-xl flex items-end justify-center overflow-hidden">
                       <div className={`w-full ${stat.color} rounded-t-xl transition-all duration-1000`} style={{ height: `${height}%` }}></div>
                       <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {stat.count} موظف
                       </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{stat.label}</span>
                    <span className="text-[10px] font-black text-slate-400">({Math.round((stat.count / total) * 100)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-slate-800">تقرير مقارنة الرواتب (Variance Report)</h3>
                <p className="text-xs text-slate-500 mt-1">مقارنة بين الشهر الحالي والشهر السابق</p>
              </div>
              <button
                onClick={() => exportToCSV(varianceReports, 'variance_report.csv')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition"
              >
                <i className="fas fa-download ml-2"></i>تصدير
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    <th className="px-6 py-4">الموظف</th>
                    <th className="px-6 py-4">راتب الشهر السابق</th>
                    <th className="px-6 py-4">راتب الشهر الحالي</th>
                    <th className="px-6 py-4">الفرق</th>
                    <th className="px-6 py-4">نسبة التغيير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {varianceReports
                    .filter(r => r.employeeName.toLowerCase().includes(varianceSearchQuery.toLowerCase()))
                    .map((report, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{report.employeeName}</td>
                      <td className="px-6 py-4 text-slate-600">{report.previousSalary.toLocaleString()} ج.م</td>
                      <td className="px-6 py-4 text-slate-800 font-bold">{report.currentSalary.toLocaleString()} ج.م</td>
                      <td className={`px-6 py-4 font-black ${report.difference > 0 ? 'text-emerald-600' : report.difference < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {report.difference > 0 ? '+' : ''}{report.difference.toLocaleString()} ج.م
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                          report.percentageChange > 0 ? 'bg-emerald-100 text-emerald-600' :
                          report.percentageChange < 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {report.percentageChange.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'budget' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
              <p className="text-xs text-emerald-600 font-black mb-2">إجمالي الميزانية</p>
              <p className="text-2xl font-black text-emerald-600">
                {budgetAnalysis.reduce((sum, b) => sum + b.budgeted, 0).toLocaleString()} ج.م
              </p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
              <p className="text-xs text-indigo-600 font-black mb-2">المبلغ المصروف</p>
              <p className="text-2xl font-black text-indigo-600">
                {budgetAnalysis.reduce((sum, b) => sum + b.spent, 0).toLocaleString()} ج.م
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {budgetAnalysis.map((dept, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-slate-800">{dept.department}</h4>
                    <p className="text-xs text-slate-500 mt-1">الفرق: {dept.variance.toLocaleString()} ج.م ({dept.variancePercent}%)</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                    dept.status === 'OK' ? 'bg-emerald-100 text-emerald-600' :
                    dept.status === 'WARNING' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {dept.status === 'OK' ? 'متوازن' : dept.status === 'WARNING' ? 'تحذير' : 'متجاوز'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-grow">
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${Math.min((dept.spent / dept.budgeted) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800">{Math.round((dept.spent / dept.budgeted) * 100)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black mb-1">الميزانية</p>
                    <p className="font-black text-slate-800">{dept.budgeted.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black mb-1">المصروف</p>
                    <p className="font-black text-indigo-600">{dept.spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black mb-1">المتبقي</p>
                    <p className="font-black text-emerald-600">{(dept.budgeted - dept.spent).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(reportType === 'cash_flow' || reportType === 'compliance') && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm text-center">
          <i className="fas fa-construction text-6xl text-slate-300 mb-4"></i>
          <h3 className="text-2xl font-black text-slate-800 mb-2">قريباً</h3>
          <p className="text-slate-500">سيتم إضافة تقارير التدفق النقدي والالتزام القانوني قريباً</p>
        </div>
      )}
    </div>
  );
};

export default FinancialReportsView;
