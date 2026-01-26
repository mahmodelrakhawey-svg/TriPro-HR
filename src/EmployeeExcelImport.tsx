import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';

const EmployeeExcelImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { departments, branches, shifts } = useData();

  const handleDownloadTemplate = () => {
    const headers = [
      'الاسم الأول', 'اسم العائلة', 'البريد الإلكتروني', 'رقم الهاتف', 
      'المسمى الوظيفي', 'القسم', 'الفرع', 'الوردية', 
      'الراتب الأساسي', 'تاريخ التعيين'
    ];
    // Create a worksheet from an array of arrays
    const worksheetData = [headers];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نموذج الموظفين');
    XLSX.writeFile(wb, 'Employee_Import_Template.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setLoading(true);
    setProgress(0);
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 30); // القراءة تمثل 30% من العملية
        setProgress(percent);
      }
    };

    reader.onload = async (evt) => {
      try {
        setProgress(40); // بدء المعالجة
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0]; // قراءة الورقة الأولى
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        setProgress(50); // تم تحليل ملف الإكسيل

        // تجهيز البيانات لتطابق أسماء الأعمدة في قاعدة بيانات Supabase
        const employeesToInsert = data.map((row: any) => {
          // محاولة العثور على المعرفات بناءً على الأسماء أو المعرفات المباشرة
          const deptName = row['القسم'] || row['Department'];
          const branchName = row['الفرع'] || row['Branch'];
          const shiftName = row['الوردية'] || row['Shift'];

          const department = departments.find(d => d.name === deptName || d.id === row['Department ID']);
          const branch = branches.find(b => b.name === branchName || b.id === row['Branch ID']);
          const shift = shifts.find(s => s.name === shiftName || s.id === row['Shift ID']);

          return {
            first_name: row['الاسم الأول'] || row['First Name'],
            last_name: row['اسم العائلة'] || row['Last Name'],
            email: row['البريد الإلكتروني'] || row['Email'],
            phone: row['رقم الهاتف'] || row['Phone'],
            job_title: row['المسمى الوظيفي'] || row['Job Title'] || row['Position'],
            basic_salary: row['الراتب الأساسي'] || row['Basic Salary'] || 0,
            hire_date: row['تاريخ التعيين'] || row['Hire Date'] || new Date().toISOString().split('T')[0],
            department_id: department?.id || null,
            branch_id: branch?.id || null,
            shift_id: shift?.id || null,
            status: 'ACTIVE',
            role: 'employee',
            org_id: '2ab9276c-4d29-425e-b20f-640a901e9104', // استخدام معرف المؤسسة من البيانات
            // auth_id: null // سيتم ربطه لاحقاً عند تسجيل الدخول
          };
        });

        if (employeesToInsert.length === 0) {
            alert('الملف فارغ أو لا يحتوي على بيانات صالحة');
            setLoading(false);
            return;
        }

        setProgress(60); // البيانات جاهزة

        // التحقق من التكرار قبل الإدخال
        const emailsToCheck = employeesToInsert.map((e: any) => e.email).filter((email: any) => email);
        
        const { data: existingData, error: checkError } = await supabase
            .from('employees')
            .select('email')
            .in('email', emailsToCheck);

        if (checkError) throw checkError;
        
        setProgress(70); // تم التحقق من التكرار

        const existingEmails = new Set(existingData?.map((e: any) => e.email));
        
        const newRecords = [];
        const existingRecords = [];

        for (const emp of employeesToInsert) {
            if (emp.email && existingEmails.has(emp.email)) {
                existingRecords.push(emp);
            } else {
                newRecords.push(emp);
            }
        }

        let insertedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        // 1. إدخال الموظفين الجدد
        if (newRecords.length > 0) {
            const { error } = await supabase.from('employees').insert(newRecords);
            if (error) throw error;
            insertedCount = newRecords.length;
        }
        setProgress(85); // تم إدخال السجلات الجديدة

        // 2. التعامل مع الموظفين الموجودين
        if (existingRecords.length > 0) {
            const shouldUpdate = window.confirm(
                `وجدنا ${existingRecords.length} موظف مسجل مسبقاً.\nهل تريد تحديث بياناتهم بالبيانات الجديدة؟\n(موافق = تحديث، إلغاء = تخطي)`
            );

            if (shouldUpdate) {
                const { error } = await supabase
                    .from('employees')
                    .upsert(existingRecords, { onConflict: 'email' });
                
                if (error) throw error;
                updatedCount = existingRecords.length;
            } else {
                skippedCount = existingRecords.length;
            }
        }
        setProgress(100); // اكتملت العملية

        let resultMessage = '';
        if (insertedCount > 0) resultMessage += `✅ تم إضافة ${insertedCount} موظف جديد.\n`;
        if (updatedCount > 0) resultMessage += `🔄 تم تحديث ${updatedCount} موظف.\n`;
        if (skippedCount > 0) resultMessage += `⚠️ تم تخطي ${skippedCount} موظف (مسجل مسبقاً).`;
        
        alert(resultMessage || 'لم يتم إجراء أي تغييرات.');
        
      } catch (error: any) {
        console.error('Error importing employees:', error);
        alert('حدث خطأ أثناء الاستيراد: ' + (error.message || error));
      } finally {
        setLoading(false);
        setProgress(0);
        // تفريغ حقل الإدخال للسماح برفع نفس الملف مرة أخرى إذا لزم الأمر
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 text-right" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h3 className="text-xl font-black text-slate-800">استيراد الموظفين (Excel)</h3>
            <p className="text-slate-500 text-sm mt-1">رفع بيانات الموظفين دفعة واحدة لتحديث قاعدة البيانات.</p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
            <i className="fas fa-file-excel"></i>
        </div>
      </div>
      
      <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-slate-50 transition-colors">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="space-y-2">
            {loading ? (
                <div className="flex flex-col items-center text-indigo-600 w-full max-w-xs mx-auto">
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <span className="font-bold text-xs">جاري المعالجة... {progress}%</span>
                </div>
            ) : (
                <>
                    <i className="fas fa-cloud-upload-alt text-4xl text-slate-300 mb-2"></i>
                    <p className="text-sm font-bold text-slate-600">اضغط هنا لاختيار ملف Excel</p>
                    <p className="text-xs text-slate-400">(.xlsx, .xls, .csv)</p>
                </>
            )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-black text-blue-800">تعليمات الملف:</h4>
          <button 
              onClick={handleDownloadTemplate}
              className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-blue-200 transition flex items-center gap-2"
          >
              <i className="fas fa-download"></i>
              تحميل النموذج
          </button>
        </div>
        <p className="text-[10px] text-blue-600 leading-relaxed mt-2">
            يرجى التأكد من أن الصف الأول في ملف Excel يحتوي على العناوين التالية: <br/>
            <span className="font-bold">الاسم الأول، اسم العائلة، البريد الإلكتروني، رقم الهاتف، المسمى الوظيفي، القسم، الفرع، الوردية، الراتب الأساسي، تاريخ التعيين</span>
        </p>
      </div>
    </div>
  );
};

export default EmployeeExcelImport;
