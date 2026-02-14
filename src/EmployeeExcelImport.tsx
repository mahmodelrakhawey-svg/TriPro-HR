import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';
import { Toaster, toast } from 'react-hot-toast';

const EmployeeExcelImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { departments, branches, shifts, orgId } = useData();

  const handleDownloadTemplate = () => {
    const headers = [
      'الاسم الأول', 'اسم العائلة', 'البريد الإلكتروني', 'رقم الهاتف', 'رقم الهوية',
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

  const confirmAction = (message: string) => {
    return new Promise<boolean>((resolve) => {
      toast((t) => (
        <div dir="rtl" className="flex flex-col gap-3">
          <p className="text-sm font-bold text-slate-700">{message}</p>
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
              className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
            >
              تخطي
            </button>
            <button 
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
            >
              تحديث
            </button>
          </div>
        </div>
      ), { duration: Infinity, position: 'top-center', style: { minWidth: '300px' } });
    });
  };

  // Helper function to map and validate Excel data
  const mapAndValidateRows = (data: any[]): any[] => {
    const processExcelDate = (val: any): string => {
      if (!val) return new Date().toISOString().split('T')[0];
      
      let date: Date;
      if (typeof val === 'number') {
        // Excel serial date (days since Dec 30, 1899)
        // تحويل رقم إكسيل التسلسلي إلى تاريخ جافاسكريبت
        date = new Date(Math.round((val - 25569) * 86400 * 1000));
      } else {
        date = new Date(val);
      }

      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    };

    return data.map((row: any) => {
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
        national_id: row['رقم الهوية'] || row['National ID'] || null,
        job_title: row['المسمى الوظيفي'] || row['Job Title'] || row['Position'],
        basic_salary: parseFloat(row['الراتب الأساسي'] || row['Basic Salary'] || '0') || 0,
        hire_date: processExcelDate(row['تاريخ التعيين'] || row['Hire Date']),
        department_id: department?.id || null,
        branch_id: branch?.id || null,
        shift_id: shift?.id || null,
        status: 'ACTIVE',
        role: 'employee',
        org_id: orgId,
        // auth_id: null // سيتم ربطه لاحقاً عند تسجيل الدخول
      };
    });
  };

  // Helper function to handle database operations
  const saveToDatabase = async (employeesToInsert: any[]) => {
    setProgress(60); // البيانات جاهزة

    // تنظيف البيانات وإزالة التكرار من الملف نفسه لتجنب أخطاء الإدخال
    const uniqueEmployees: any[] = [];
    const seenEmails = new Set();
    
    for (const emp of employeesToInsert) {
        if (emp.email) {
            const emailKey = String(emp.email).toLowerCase().trim();
            if (seenEmails.has(emailKey)) continue; // تخطي المكرر في الملف
            seenEmails.add(emailKey);
            emp.email = emailKey; // توحيد الصيغة
        }
        uniqueEmployees.push(emp);
    }

    // التحقق من التكرار قبل الإدخال
    const emailsToCheck = uniqueEmployees.map((e: any) => e.email).filter((email: any) => email);
    const { data: existingData, error: checkError } = await supabase
        .from('employees')
        .select('email')
        .in('email', emailsToCheck);

    if (checkError) throw checkError;
    
    setProgress(70); // تم التحقق من التكرار

    const existingEmails = new Set(existingData?.map((e: any) => e.email));
    const newRecords: any[] = [];
    const existingRecords: any[] = [];

    for (const emp of uniqueEmployees) {
        if (emp.email && existingEmails.has(emp.email)) {
            existingRecords.push(emp);
        } else {
            newRecords.push(emp);
        }
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    if (newRecords.length > 0) {
        const { error } = await supabase.from('employees').insert(newRecords);
        if (error) throw error;
        insertedCount = newRecords.length;
    }
    setProgress(85); // تم إدخال السجلات الجديدة

    if (existingRecords.length > 0) {
        const shouldUpdate = await confirmAction(
            `وجدنا ${existingRecords.length} موظف مسجل مسبقاً. هل تريد تحديث بياناتهم بالبيانات الجديدة؟`
        );
        if (shouldUpdate) {
            const { error } = await supabase.from('employees').upsert(existingRecords, { onConflict: 'email' });
            if (error) throw error;
            updatedCount = existingRecords.length;
        } else {
            skippedCount = existingRecords.length;
        }
    }
    return { insertedCount, updatedCount, skippedCount, existingEmails };
  };

  // Helper function to call the invite edge function
  const sendInvitations = async (emails: string[]) => {
    if (emails.length === 0) return;
    try {
      const { error } = await supabase.functions.invoke('invite-employees', {
        body: { emails },
      });
      if (error) throw error;
      toast.success(`✉️ تم إرسال ${emails.length} دعوة للموظفين الجدد.`);
    } catch (error: any) {
      toast.error('فشل إرسال بعض الدعوات: ' + error.message);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setProgress(0);
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
        const excelData = XLSX.utils.sheet_to_json(ws);

        setProgress(50); // تم تحليل ملف الإكسيل

        const employeesToInsert = mapAndValidateRows(excelData);

        if (employeesToInsert.length === 0) {
            toast.error('الملف فارغ أو لا يحتوي على بيانات صالحة');
            setLoading(false);
            return;
        }
        
        const { insertedCount, updatedCount, skippedCount, existingEmails } = await saveToDatabase(employeesToInsert);

        // Send invitations to newly inserted employees
        const newEmails = employeesToInsert.filter((e: any) => e.email && !existingEmails.has(e.email)).map((e: any) => e.email);
        await sendInvitations(newEmails);
        setProgress(100); // اكتملت العملية

        let resultMessage = '';
        if (insertedCount > 0) resultMessage += `✅ تم إضافة ${insertedCount} موظف جديد.\n`;
        if (updatedCount > 0) resultMessage += `🔄 تم تحديث ${updatedCount} موظف.\n`;
        if (skippedCount > 0) resultMessage += `⚠️ تم تخطي ${skippedCount} موظف (مسجل مسبقاً).`;
        
        toast.success(resultMessage || 'لم يتم إجراء أي تغييرات.', { duration: 5000 });
        
      } catch (error: any) {
        console.error('Error importing employees:', error);
        toast.error('حدث خطأ أثناء الاستيراد: ' + (error.message || error));
      } finally {
        setLoading(false);
        setProgress(0);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  return (
    <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 text-right" dir="rtl">
      <Toaster />
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
        {!selectedFile && !loading && (
            <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
        )}
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
            ) : selectedFile ? (
                <div className="flex flex-col items-center gap-4 z-20 relative animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                        <i className="fas fa-file-csv"></i>
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800 dir-ltr">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button 
                            onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                        >
                            إلغاء
                        </button>
                        <button 
                            onClick={processFile}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-lg flex items-center gap-2"
                        >
                            <i className="fas fa-cloud-upload-alt"></i>
                            بدء المعالجة
                        </button>
                    </div>
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
