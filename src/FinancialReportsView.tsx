import React, { useState, useEffect, useCallback } from 'react';
import { useData } from './DataContext';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

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

const FinancialReportsView: React.FC = () => {
  const { employees, hasPermission } = useData();
  const [reportType, setReportType] = useState<'payroll' | 'tax' | 'budget' | 'cash_flow' | 'compliance'>('payroll');
  const [payrollReports, setPayrollReports] = useState<PayrollReport[]>([]);
  const [taxReports, setTaxReports] = useState<TaxReport[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis[]>([]);

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

      // حساب الضرائب لجميع الموظفين (سواء تم الدفع لهم أم لا - كتقدير)
      const taxData = visibleEmployees.map(emp => {
        const record = latestRecordsMap.get(emp.id);
        // استخدام الراتب من السجل إذا وجد (فعلي)، وإلا استخدام الراتب الأساسي للموظف (تقديري)
        const grossSalary = record ? (record.basic_salary || 0) : (emp.basicSalary || 0);
        
        const taxableIncome = Math.max(0, grossSalary - 2000); // حد الإعفاء
        const taxRate = 0.1; // نسبة الضريبة 10%
        const taxAmount = Math.round(taxableIncome * taxRate);

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          grossSalary,
          taxableIncome,
          taxAmount,
          taxRate: (taxRate * 100)
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

      // This would typically fetch from a budget table
      // For now, we'll create a basic analysis
      const departments = new Set(visibleEmployees.map(e => e.dep || 'General'));
      
      const analysis: BudgetAnalysis[] = Array.from(departments).map((dept) => {
        const deptEmployees = visibleEmployees.filter(e => e.dep === dept);
        const budgeted = deptEmployees.reduce((sum, e) => sum + (e.basicSalary || 0), 0);
        const spent = budgeted * 0.92; // Assuming 92% spent
        const variance = budgeted - spent;
        const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

        return {
          department: dept as string,
          budgeted,
          spent: Math.round(spent),
          variance: Math.round(variance),
          variancePercent: Math.round(variancePercent * 100) / 100,
          status: variancePercent > 5 ? 'OK' : variancePercent > 0 ? 'WARNING' : 'EXCEEDED'
        };
      });

      setBudgetAnalysis(analysis);
    } catch (error) {
      console.error('Error fetching budget analysis:', error);
      toast.error('خطأ في جلب تحليل الميزانية');
    }
  }, [employees, hasPermission]);

  useEffect(() => {
    if (reportType === 'payroll') fetchPayrollReports();
    else if (reportType === 'tax') fetchTaxReports();
    else if (reportType === 'budget') fetchBudgetAnalysis();
  }, [reportType, fetchPayrollReports, fetchTaxReports, fetchBudgetAnalysis]);

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
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
              <p className="text-xs text-emerald-600 font-black mb-2">متوسط معدل الضريبة</p>
              <p className="text-2xl font-black text-emerald-600">
                {((taxReports.reduce((sum, r) => sum + r.taxRate, 0) / taxReports.length)).toFixed(1)}%
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
