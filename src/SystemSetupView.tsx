import React, { useState, useRef } from 'react';
import { Shift, Department, Employee, Branch, BrandingConfig, CareerEvent, EmployeeDocument } from './types';
import { useData } from './DataContext';
import HolidaysManagement from './HolidaysManagement';
import JobTitlesManagement from './JobTitlesManagement';
import CompanyPoliciesManagement from './CompanyPoliciesManagement';
import DocumentTypesManagement from './DocumentTypesManagement';

type SetupTab = 'company' | 'branches' | 'departments' | 'shifts' | 'employees' | 'documents' | 'branding' | 'attendance' | 'holidays' | 'job_titles' | 'doc_types' | 'notifications' | 'policies' | 'security' | 'backup';

interface SystemSetupViewProps {
  branding: BrandingConfig;
  setBranding: React.Dispatch<React.SetStateAction<BrandingConfig>>;
}

const SystemSetupView: React.FC<SystemSetupViewProps> = ({ branding, setBranding }) => {
  const { employees, setEmployees, branches, setBranches, departments, setDepartments } = useData();
  const [activeSubTab, setActiveSubTab] = useState<SetupTab>('branding');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [branchSortOption, setBranchSortOption] = useState<'name' | 'employees'>('name');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [docFilterStatus, setDocFilterStatus] = useState<'ALL' | 'VALID' | 'EXPIRING' | 'EXPIRED'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const branchImportRef = useRef<HTMLInputElement>(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEditShiftModalOpen, setIsEditShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [newShift, setNewShift] = useState<Partial<Shift> & { type?: string }>({
    name: '',
    startTime: '',
    endTime: '',
    gracePeriod: 15,
    isOvernight: false,
    maxOvertimeHours: 4,
    minWorkHours: 8,
    type: 'FIXED'
  });
  const [isDeleteDeptModalOpen, setIsDeleteDeptModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [branchToToggleGeofence, setBranchToToggleGeofence] = useState<Branch | null>(null);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false);
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [selectedCareerEmployee, setSelectedCareerEmployee] = useState<Employee | null>(null);
  const [newCareerEvent, setNewCareerEvent] = useState<Partial<CareerEvent>>({
    type: 'Salary Increase',
    date: new Date().toISOString().split('T')[0],
    title: '',
    details: ''
  });
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [newBranch, setNewBranch] = useState<Partial<Branch>>({
    name: '',
    address: '',
    managerName: '',
    phone: '',
    email: '',
    wifiSsid: '',
    geofenceRadius: 100,
    geofencingEnabled: true,
    location: { lat: 30.0, lng: 31.0 }
  });
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({
    name: '',
    managerName: '',
    employeeCount: 0,
    budget: 0
  });
  const [isEditDepartmentModalOpen, setIsEditDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    title: '',
    dep: '',
    avatarUrl: '',
    birthDate: '',
    email: '',
    phone: ''
  });
  const [companyInfo, setCompanyInfo] = useState({
    crNumber: '123456789',
    taxId: '987-654-321',
    address: 'القاهرة، مصر',
    phone: '+201000000000',
    email: 'info@tripro.com',
    website: 'www.tripro.com'
  });

  const defaultAttendanceConfig = {
    defaultStartTime: '09:00',
    defaultEndTime: '17:00',
    lateTolerance: 15,
    earlyDepartureTolerance: 15,
    weeklyHolidays: ['الجمعة', 'السبت'],
    maxOvertimeHours: 4,
    maxMonthlyLateMinutes: 60,
    weeklyWorkDays: 5,
    maxAnnualLeaves: 21
  };

  const handleResetAttendanceConfig = () => {
    setAttendanceConfig(defaultAttendanceConfig);
  };
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    systemAnnouncements: true,
    securityAlerts: true
  });

  const [docAlertSettings, setDocAlertSettings] = useState({
    thresholdDays: 30,
    notifyEmployee: true,
    notifyHr: true
  });
  const [isDocSettingsModalOpen, setIsDocSettingsModalOpen] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (!passwordData.currentPassword || !passwordData.newPassword) {
       alert('يرجى ملء جميع الحقول');
       return;
    }
    // Simulate API call
    alert('تم تغيير كلمة المرور بنجاح');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const [backups, setBackups] = useState([
    { id: 'BK-001', date: '2024-05-20 10:00', size: '15 MB', type: 'Auto' },
    { id: 'BK-002', date: '2024-05-15 18:30', size: '14.8 MB', type: 'Manual' },
  ]);

  const [autoBackupSettings, setAutoBackupSettings] = useState({
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retentionDays: 30
  });

  const handleCreateBackup = () => {
    const newBackup = {
      id: `BK-${Date.now()}`,
      date: new Date().toLocaleString('en-GB'),
      size: '15.2 MB',
      type: 'Manual'
    };
    setBackups([newBackup, ...backups]);
    alert('تم إنشاء نسخة احتياطية جديدة بنجاح');
  };

  const handleRestoreBackup = (id: string) => {
    if (window.confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية.')) {
       alert(`تم استعادة النسخة ${id} بنجاح`);
    }
  };

  const [attendanceConfig, setAttendanceConfig] = useState({
    defaultStartTime: '09:00',
    defaultEndTime: '17:00',
    lateTolerance: 15,
    earlyDepartureTolerance: 15,
    weeklyHolidays: ['الجمعة', 'السبت'],
    maxOvertimeHours: 4,
    maxMonthlyLateMinutes: 60,
    weeklyWorkDays: 5,
    maxAnnualLeaves: 21
  });

  const [shifts, setShifts] = useState<Shift[]>([
    { id: 'SH-01', name: 'الوردية الصباحية', startTime: '09:00', endTime: '17:00', gracePeriod: 15, isOvernight: false },
    { id: 'SH-02', name: 'الوردية المسائية', startTime: '17:00', endTime: '01:00', gracePeriod: 15, isOvernight: true },
  ]);

  const handleBrandingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBranding({ ...branding, [name]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding({ ...branding, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const daysOfWeek = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  const toggleHoliday = (day: string) => {
    if (attendanceConfig.weeklyHolidays.includes(day)) {
      setAttendanceConfig({
        ...attendanceConfig,
        weeklyHolidays: attendanceConfig.weeklyHolidays.filter(d => d !== day)
      });
    } else {
      setAttendanceConfig({
        ...attendanceConfig,
        weeklyHolidays: [...attendanceConfig.weeklyHolidays, day]
      });
    }
  };

  const toggleBranchGeofencing = (id: string) => {
    const branch = branches.find((b: Branch) => b.id === id);
    if (branch) {
      setBranchToToggleGeofence(branch);
      setIsGeofenceModalOpen(true);
    }
  };

  const confirmToggleGeofence = () => {
    if (branchToToggleGeofence) {
      setBranches(branches.map((b: Branch) => b.id === branchToToggleGeofence.id ? { ...b, geofencingEnabled: !b.geofencingEnabled } : b));
      setIsGeofenceModalOpen(false);
      setBranchToToggleGeofence(null);
    }
  };

  const handleSave = () => {
    alert("تم حفظ إعدادات النظام وتحديث البيانات بنجاح!");
  };

  const handleDeleteBranch = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
      setBranches(branches.filter((b: Branch) => b.id !== id));
    }
  };

  const handleDeleteShift = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الوردية؟')) {
      setShifts(shifts.filter(s => s.id !== id));
    }
  };

  const handleUpdateShift = () => {
    if (editingShift) {
      setShifts(shifts.map(s => s.id === editingShift.id ? editingShift : s));
      setIsEditShiftModalOpen(false);
      setEditingShift(null);
    }
  };

  const handleAddShift = () => {
    if (newShift.name && newShift.startTime && newShift.endTime) {
      setShifts([...shifts, {
        id: `SH-${Date.now()}`,
        name: newShift.name!,
        startTime: newShift.startTime!,
        endTime: newShift.endTime!,
        gracePeriod: newShift.gracePeriod || 15,
        isOvernight: newShift.isOvernight || false,
        maxOvertimeHours: newShift.maxOvertimeHours,
        minWorkHours: newShift.minWorkHours,
        type: newShift.type || 'FIXED'
      } as Shift]);
      setIsAddShiftModalOpen(false);
      setNewShift({ name: '', startTime: '', endTime: '', gracePeriod: 15, isOvernight: false, maxOvertimeHours: 4, minWorkHours: 8, type: 'FIXED' });
    } else {
      alert('يرجى إدخال البيانات الأساسية للوردية');
    }
  };

  const handleDuplicateShift = (id: string) => {
    const shiftToDuplicate = shifts.find(s => s.id === id);
    if (shiftToDuplicate) {
      setShifts([...shifts, {
        ...shiftToDuplicate,
        id: `SH-${Date.now()}`,
        name: `${shiftToDuplicate.name} (نسخة)`,
      }]);
    }
  };

  const handleDeleteDepartment = (id: string) => {
    setDeptToDelete(id);
    setIsDeleteDeptModalOpen(true);
  };

  const confirmDeleteDepartment = () => {
    if (deptToDelete) {
      setDepartments(departments.filter((d: Department) => d.id !== deptToDelete));
      setIsDeleteDeptModalOpen(false);
      setDeptToDelete(null);
    }
  };

  const handleAddBranch = () => {
    if (newBranch.name && newBranch.address) {
      setBranches([...branches, {
        ...newBranch,
        id: `BR-${Date.now()}`,
        employeeCount: 0
      } as Branch]);
      setIsAddBranchModalOpen(false);
      setNewBranch({ name: '', address: '', managerName: '', phone: '', email: '', wifiSsid: '', geofenceRadius: 100, geofencingEnabled: true, location: { lat: 30.0, lng: 31.0 } });
    } else {
      alert('يرجى إدخال اسم الفرع والعنوان');
    }
  };

  const handleUpdateBranch = () => {
    if (editingBranch && editingBranch.name && editingBranch.address) {
      setBranches(branches.map((b: Branch) => b.id === editingBranch.id ? editingBranch : b));
      setIsEditBranchModalOpen(false);
      setEditingBranch(null);
    } else {
      alert('يرجى إدخال اسم الفرع والعنوان');
    }
  };

  const handleAddDepartment = () => {
    if (newDepartment.name && newDepartment.managerName) {
      setDepartments([...departments, {
        ...newDepartment,
        id: `DEP-${Date.now()}`,
        employeeCount: 0
      } as Department]);
      setIsAddDepartmentModalOpen(false);
      setNewDepartment({ name: '', managerName: '', employeeCount: 0, budget: 0 });
    } else {
      alert('يرجى إدخال اسم القسم واسم المدير');
    }
  };

  const handleExportDepartments = () => {
    const headers = ['ID', 'اسم القسم', 'مدير القسم', 'عدد الموظفين', 'الميزانية'];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...departments.map((dept: Department) => [
        dept.id,
        `"${dept.name}"`,
        `"${dept.managerName || ''}"`,
        dept.employeeCount,
        dept.budget || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'departments_list.csv';
    link.click();
  };

  const handleUpdateDepartment = () => {
    if (editingDepartment && editingDepartment.name && editingDepartment.managerName) {
      setDepartments(departments.map((d: Department) => d.id === editingDepartment.id ? editingDepartment : d));
      setIsEditDepartmentModalOpen(false);
      setEditingDepartment(null);
    } else {
      alert('يرجى إدخال اسم القسم واسم المدير');
    }
  };

  const handleAddEmployee = () => {
    if (newEmployee.name && newEmployee.title && newEmployee.dep) {
      setEmployees([...employees, {
        id: `e${Date.now()}`,
        name: newEmployee.name!,
        title: newEmployee.title!,
        dep: newEmployee.dep!,
        device: 'Not Paired',
        status: 'ACTIVE',
        avatarUrl: newEmployee.avatarUrl,
        birthDate: newEmployee.birthDate,
        email: newEmployee.email,
        basicSalary: newEmployee.basicSalary,
        phone: newEmployee.phone,
        hireDate: newEmployee.hireDate,
        documents: []
      } as Employee]);
      setIsAddEmployeeModalOpen(false);
      setNewEmployee({ name: '', title: '', dep: '', avatarUrl: '', birthDate: '', email: '', phone: '' });
    } else {
      alert('يرجى إدخال البيانات الأساسية للموظف');
    }
  };

  const handleUpdateEmployee = () => {
    if (editingEmployee && editingEmployee.name && editingEmployee.title && editingEmployee.dep) {
      setEmployees(employees.map((emp: Employee) => emp.id === editingEmployee.id ? editingEmployee : emp));
      setIsEditEmployeeModalOpen(false);
      setEditingEmployee(null);
    } else {
      alert('يرجى إدخال البيانات الأساسية للموظف');
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      setEmployees(employees.filter((e: Employee) => e.id !== id));
    }
  };

  const uniqueDepts = Array.from(new Set(employees.map((e: Employee) => e.dep).filter(Boolean))) as string[];

  const filteredEmployees = employees.filter((emp: Employee) => 
    (emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.dep.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.phone && emp.phone.includes(searchQuery))) &&
    (selectedDept ? emp.dep === selectedDept : true) &&
    (statusFilter === 'ALL' ? true : emp.status === statusFilter)
  );

  const filteredBranches = branches
    .filter((branch: Branch) => 
      branch.name.includes(branchSearchQuery) || 
      branch.address.includes(branchSearchQuery)
    )
    .sort((a: Branch, b: Branch) => {
      if (branchSortOption === 'employees') {
        return (b.employeeCount || 0) - (a.employeeCount || 0);
      }
      return a.name.localeCompare(b.name);
    });

  const filteredShifts = shifts.filter(shift => {
    if (shiftFilter === 'all') return true;
    if (shiftFilter === 'morning') return !shift.isOvernight;
    if (shiftFilter === 'evening') return shift.isOvernight;
    return true;
  });

  const filteredDepartments = departments.filter((dept: Department) => 
    dept.name.includes(deptSearchQuery) || 
    dept.managerName.includes(deptSearchQuery)
  );

  const handleExportEmployees = () => {
    const headers = ['ID', 'الاسم', 'المسمى الوظيفي', 'القسم', 'الجهاز', 'الحالة'];
    const csvContent = [
      '\uFEFF' + headers.join(','), // إضافة BOM لدعم اللغة العربية في Excel
      ...filteredEmployees.map((emp: Employee) => [
        emp.id,
        `"${emp.name}"`,
        `"${emp.title}"`,
        emp.dep,
        emp.device,
        emp.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employees_list.csv';
    link.click();
  };

  const handlePrintAllEmployeeCards = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      const cardsHtml = filteredEmployees.map((emp: Employee) => `
        <div class="card">
          <div class="header">
            <div class="company-name">${branding.companyName}</div>
            <div class="slogan">${branding.slogan}</div>
          </div>
          <div class="avatar">👤</div>
          <div class="info">
            <div class="name">${emp.name}</div>
            <div class="role">${emp.title}</div>
            
            <div class="details">
              <div class="detail-row">
                <span class="value">${emp.dep}</span>
                <span class="label">القسم:</span>
              </div>
              <div class="detail-row">
                <span class="value">${emp.id}</span>
                <span class="label">الرقم الوظيفي:</span>
              </div>
            </div>

            <div class="qr-container">
               <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${emp.id}" class="qr-code" width="60" height="60" alt="Scan Me" />
            </div>
          </div>
        </div>
      `).join('');

      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>بطاقات الموظفين - طباعة مجمعة</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff; padding: 20px; }
              .cards-container { display: grid; grid-template-columns: repeat(auto-fill, 250px); gap: 20px; justify-content: center; }
              .card { background: white; width: 250px; border-radius: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e2e8f0; text-align: center; page-break-inside: avoid; margin-bottom: 20px; }
              .header { background-color: ${branding.primaryColor}; padding: 10px; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .company-name { font-weight: 900; font-size: 14px; margin-bottom: 2px; }
              .slogan { font-size: 8px; opacity: 0.9; }
              .avatar { width: 50px; height: 50px; background-color: white; border-radius: 50%; margin: -25px auto 5px; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #cbd5e1; }
              .info { padding: 0 15px 15px; }
              .name { font-weight: 900; font-size: 16px; color: #1e293b; margin-bottom: 2px; }
              .role { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
              .details { text-align: right; background: #f8fafc; padding: 8px; border-radius: 8px; font-size: 10px; color: #475569; }
              .detail-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
              .qr-container { margin-top: 10px; display: flex; justify-content: center; }
              .qr-code { border: 2px solid white; border-radius: 5px; }
              @media print {
                body { background-color: white; }
                .card { box-shadow: none; border: 1px solid #ccc; }
              }
            </style>
          </head>
          <body>
            <div class="cards-container">
              ${cardsHtml}
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleExportBranches = () => {
    const headers = ['ID', 'اسم الفرع', 'المدير المسؤول', 'العنوان', 'WiFi SSID', 'نطاق جغرافي'];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...branches.map((branch: Branch) => [
        branch.id,
        `"${branch.name}"`,
        `"${branch.managerName || ''}"`,
        `"${branch.address}"`,
        branch.wifiSsid,
        branch.geofenceRadius
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'branches_list.csv';
    link.click();
  };

  const handleImportBranches = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(1); // Skip header
        
        const newBranches: Branch[] = rows
          .filter(row => row.trim() !== '')
          .map((row, index) => {
            const cols = row.split(',');
            return {
              id: `BR-IMP-${Date.now()}-${index}`,
              name: cols[0]?.trim().replace(/"/g, '') || 'New Branch',
              managerName: cols[1]?.trim().replace(/"/g, '') || '',
              address: cols[2]?.trim().replace(/"/g, '') || '',
              wifiSsid: cols[3]?.trim() || 'Default_WiFi',
              geofenceRadius: parseInt(cols[4]?.trim()) || 100,
              geofencingEnabled: true,
              location: { lat: 30.0, lng: 31.0 } // Default location
            };
          });

        setBranches([...branches, ...newBranches]);
        alert(`تم استيراد ${newBranches.length} فرع بنجاح!`);
      };
      reader.readAsText(file);
    }
    // Reset input
    if (branchImportRef.current) branchImportRef.current.value = '';
  };

  const handlePrintEmployeeCard = (emp: Employee) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>بطاقة موظف - ${emp.name}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px; display: flex; justify-content: center; }
              .card { background: white; width: 300px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; text-align: center; }
              .header { background-color: ${branding.primaryColor}; padding: 20px; color: white; }
              .company-name { font-weight: 900; font-size: 18px; margin-bottom: 5px; }
              .slogan { font-size: 10px; opacity: 0.8; letter-spacing: 1px; }
              .avatar { width: 80px; height: 80px; background-color: white; border-radius: 50%; margin: -40px auto 10px; border: 4px solid white; display: flex; align-items: center; justify-content: center; font-size: 30px; color: #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .info { padding: 0 20px 20px; }
              .name { font-weight: 900; font-size: 20px; color: #1e293b; margin-bottom: 5px; }
              .role { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
              .details { text-align: right; background: #f8fafc; padding: 15px; border-radius: 10px; font-size: 12px; color: #475569; }
              .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .detail-row:last-child { margin-bottom: 0; }
              .label { font-weight: bold; }
              .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; }
              .qr-container { margin-top: 15px; display: flex; justify-content: center; }
              .qr-code { border: 4px solid white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <div class="company-name">${branding.companyName}</div>
                <div class="slogan">${branding.slogan}</div>
              </div>
              <div class="avatar">👤</div>
              <div class="info">
                <div class="name">${emp.name}</div>
                <div class="role">${emp.title}</div>
                
                <div class="details">
                  <div class="detail-row">
                    <span class="value">${emp.dep}</span>
                    <span class="label">القسم:</span>
                  </div>
                  <div class="detail-row">
                    <span class="value">${emp.id}</span>
                    <span class="label">الرقم الوظيفي:</span>
                  </div>
                  <div class="detail-row">
                    <span class="value">${emp.status}</span>
                    <span class="label">الحالة:</span>
                  </div>
                  ${emp.birthDate ? `
                  <div class="detail-row">
                    <span class="value">${emp.birthDate}</span>
                    <span class="label">تاريخ الميلاد:</span>
                  </div>` : ''}
                </div>

                <div class="qr-container">
                   <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${emp.id}" class="qr-code" width="80" height="80" alt="Scan Me" />
                </div>

                <div class="footer">
                  تم الاستخراج من نظام TriPro
                </div>
              </div>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getDocCategory = (type: string) => {
    if (['ID', 'PASSPORT'].includes(type)) return 'هوية شخصية';
    if (['WORK_PERMIT'].includes(type)) return 'تصاريح عمل';
    if (['HEALTH_CERT'].includes(type)) return 'شهادات صحية';
    return 'أخرى';
  };

  const handleSendReminders = () => {
    alert('تم إرسال تنبيهات تجديد الوثائق للموظفين المعنيين عبر البريد الإلكتروني و SMS.');
  };

  const handleOpenCareer = (emp: Employee) => {
    setSelectedCareerEmployee(emp);
    setIsCareerModalOpen(true);
  };

  const handleAddCareerEvent = () => {
    if (selectedCareerEmployee && newCareerEvent.title && newCareerEvent.date) {
      const event: CareerEvent = {
        ...newCareerEvent,
        id: `CE-${Date.now()}`
      } as CareerEvent;
      
      const updatedEmp = {
          ...selectedCareerEmployee,
          careerHistory: [event, ...(selectedCareerEmployee.careerHistory || [])]
      };

      setEmployees(employees.map((e: Employee) => e.id === updatedEmp.id ? updatedEmp : e));
      setSelectedCareerEmployee(updatedEmp);
      setNewCareerEvent({ type: 'Salary Increase', date: new Date().toISOString().split('T')[0], title: '', details: '' });
    }
  };

  const calculateDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8 animate-fade-in text-right pb-24" dir="rtl">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 overflow-x-auto">
        <div>
          <h2 className="text-3xl font-black text-slate-800">إعدادات هيكل النظام</h2>
          <p className="text-slate-500 font-medium mt-1">قم بتهيئة الشركة، الفروع، والورديات قبل بدء التشغيل.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'branding', label: 'الهوية البصرية', icon: 'fa-palette' },
            { id: 'company', label: 'الشركة', icon: 'fa-building' },
            { id: 'branches', label: 'الفروع', icon: 'fa-map-location-dot' },
            { id: 'departments', label: 'الأقسام', icon: 'fa-sitemap' },
            { id: 'job_titles', label: 'المسميات', icon: 'fa-briefcase' },
            { id: 'shifts', label: 'الورديات', icon: 'fa-clock' },
            { id: 'attendance', label: 'الحضور', icon: 'fa-calendar-check' },
            { id: 'holidays', label: 'العطلات', icon: 'fa-umbrella-beach' },
            { id: 'doc_types', label: 'أنواع الوثائق', icon: 'fa-file-contract' },
            { id: 'notifications', label: 'الإشعارات', icon: 'fa-bell' },
            { id: 'employees', label: 'الموظفين', icon: 'fa-users' },
            { id: 'documents', label: 'الوثائق', icon: 'fa-file-shield' },
            { id: 'policies', label: 'السياسات', icon: 'fa-file-contract' },
            { id: 'security', label: 'الأمان', icon: 'fa-shield-halved' },
            { id: 'backup', label: 'النسخ الاحتياطي', icon: 'fa-database' }
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SetupTab)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${
                activeSubTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-indigo-600'
              }`}
            >
              <i className={`fas ${tab.icon} text-[10px]`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        {activeSubTab === 'branding' && (
          <div className="p-12 animate-fade-in space-y-10">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-800 mb-2">تخصيص هوية tripro</h3>
                <p className="text-slate-500 font-medium">قم بتعديل المظهر العام للنظام ليتطابق مع علامتك التجارية.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">رابط اللوجو (Logo URL)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        name="logoUrl"
                        value={branding.logoUrl}
                        onChange={handleBrandingChange}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition font-black text-xs flex items-center justify-center"
                        title="رفع صورة من الجهاز"
                      >
                        <i className="fas fa-cloud-arrow-up text-lg"></i>
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 italic font-medium">يفضل استخدام صيغة PNG أو SVG بخلفية شفافة.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">اللون الأساسي (Primary Color)</label>
                    <div className="flex gap-4">
                      <input 
                        type="color" 
                        name="primaryColor"
                        value={branding.primaryColor}
                        onChange={handleBrandingChange}
                        className="w-16 h-14 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer p-1"
                      />
                      <input 
                        type="text" 
                        name="primaryColor"
                        value={branding.primaryColor}
                        onChange={handleBrandingChange}
                        className="flex-grow px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">اسم الشركة (System Name)</label>
                    <input 
                      type="text" 
                      name="companyName"
                      value={branding.companyName}
                      onChange={handleBrandingChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">الشعار النصي (Slogan)</label>
                    <input 
                      type="text" 
                      name="slogan"
                      value={branding.slogan}
                      onChange={handleBrandingChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/5 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
                 <div className="text-right">
                    <h4 className="text-lg font-black mb-1">معاينة الهوية الحالية</h4>
                    <p className="text-xs text-slate-400 font-medium">هكذا سيظهر نظامك للموظفين والمديرين.</p>
                 </div>
                 <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: branding.primaryColor }}>
                       {branding.logoUrl ? (
                         <img src={branding.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                       ) : (
                         <i className="fas fa-rocket text-white"></i>
                       )}
                    </div>
                    <div className="text-right">
                       <h5 className="text-sm font-black uppercase">{branding.companyName} <span style={{ color: branding.primaryColor }}>Attendance</span></h5>
                       <p className="text-[9px] text-slate-500 font-bold tracking-widest">{branding.slogan}</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'company' && (
          <div className="p-10 animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">بيانات الشركة الرسمية</h3>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => alert('تم تفعيل وضع التعديل')}
                     className="bg-white border border-slate-200 text-slate-500 px-5 py-3 rounded-2xl text-[10px] font-black hover:text-indigo-600 hover:border-indigo-200 transition shadow-sm flex items-center gap-2"
                   >
                      <i className="fas fa-pen"></i> تعديل
                   </button>
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                      <i className="fas fa-building"></i>
                   </div>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">رقم السجل التجاري</label>
                   <input 
                     type="text" 
                     value={companyInfo.crNumber}
                     onChange={(e) => setCompanyInfo({...companyInfo, crNumber: e.target.value})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">رقم البطاقة الضريبية</label>
                   <input 
                     type="text" 
                     value={companyInfo.taxId}
                     onChange={(e) => setCompanyInfo({...companyInfo, taxId: e.target.value})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">العنوان الرسمي</label>
                   <input 
                     type="text" 
                     value={companyInfo.address}
                     onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">هاتف الشركة</label>
                   <input 
                     type="text" 
                     value={companyInfo.phone}
                     onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">البريد الإلكتروني</label>
                   <input 
                     type="email" 
                     value={companyInfo.email}
                     onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">الموقع الإلكتروني</label>
                   <input 
                     type="text" 
                     value={companyInfo.website}
                     onChange={(e) => setCompanyInfo({...companyInfo, website: e.target.value})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-left"
                     dir="ltr"
                   />
                </div>
             </div>
          </div>
        )}

        {activeSubTab === 'branches' && (
          <div className="p-10 animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">إدارة الفروع والمواقع</h3>
                <div className="flex gap-3">
                   <input 
                     type="file" 
                     ref={branchImportRef}
                     className="hidden"
                     accept=".csv"
                     onChange={handleImportBranches}
                   />
                   <button 
                     onClick={() => branchImportRef.current?.click()}
                     className="bg-slate-100 text-slate-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition flex items-center gap-2"
                   >
                     <i className="fas fa-file-import"></i> استيراد CSV
                   </button>
                   <button 
                     onClick={handleExportBranches}
                     className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase border border-emerald-100 hover:bg-emerald-100 transition flex items-center gap-2"
                   >
                     <i className="fas fa-file-excel"></i> تصدير Excel
                   </button>
                   <button 
                     onClick={() => setIsAddBranchModalOpen(true)}
                     className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                   >
                      <i className="fas fa-plus-circle"></i> إضافة فرع جديد
                   </button>
                </div>
             </div>
             <div className="flex gap-4">
                <div className="relative flex-grow">
                   <input 
                     type="text" 
                     placeholder="بحث عن فرع (الاسم أو العنوان)..." 
                     value={branchSearchQuery}
                     onChange={(e) => setBranchSearchQuery(e.target.value)}
                     className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                   <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
                <div className="relative shrink-0">
                   <select
                     value={branchSortOption}
                     onChange={(e) => setBranchSortOption(e.target.value as 'name' | 'employees')}
                     className="appearance-none pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                   >
                      <option value="name">ترتيب حسب الاسم</option>
                      <option value="employees">ترتيب حسب عدد الموظفين</option>
                   </select>
                   <i className="fas fa-sort absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                </div>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
                {filteredBranches.map((branch: Branch) => (
                  <div key={branch.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group relative">
                     <div className="flex justify-between items-start mb-4 flex-row-reverse">
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleDeleteBranch(branch.id)}
                             className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition shadow-sm"
                             title="حذف الفرع"
                           >
                              <i className="fas fa-trash-can"></i>
                           </button>
                           <button 
                             onClick={() => {
                               setEditingBranch(branch);
                               setIsEditBranchModalOpen(true);
                             }}
                             className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition shadow-sm"
                             title="تعديل الفرع"
                           >
                              <i className="fas fa-pen"></i>
                           </button>
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                              <i className="fas fa-map-pin"></i>
                           </div>
                        </div>
                        <div className="text-right">
                           <h4 className="text-sm font-black text-slate-800">{branch.name}</h4>
                           <p className="text-[10px] text-slate-400 font-bold mt-1">{branch.address}</p>
                           {branch.employeeCount && <p className="text-[9px] text-slate-500 font-bold mt-1"><i className="fas fa-users ml-1"></i> {branch.employeeCount} موظف</p>}
                           {branch.phone && <p className="text-[9px] text-slate-500 font-bold mt-1"><i className="fas fa-phone ml-1"></i> {branch.phone}</p>}
                           {branch.email && <p className="text-[9px] text-slate-500 font-bold mt-1"><i className="fas fa-envelope ml-1"></i> {branch.email}</p>}
                           {branch.managerName && <p className="text-[9px] text-indigo-500 font-bold mt-1"><i className="fas fa-user-tie ml-1"></i> المدير: {branch.managerName}</p>}
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200/50 items-center justify-between">
                        <div className="flex gap-3">
                           <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600">
                              <i className="fas fa-wifi"></i> <span>{branch.wifiSsid}</span>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600">
                              <i className="fas fa-bullseye"></i> <span>نطاق {branch.geofenceRadius} متر</span>
                           </div>
                        </div>
                        <button 
                           onClick={() => toggleBranchGeofencing(branch.id)}
                           className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${branch.geofencingEnabled ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                        >
                           <span className="text-[9px] font-black">{branch.geofencingEnabled ? 'Geofencing مفعل' : 'Geofencing معطل'}</span>
                           <i className={`fas ${branch.geofencingEnabled ? 'fa-toggle-on text-lg' : 'fa-toggle-off text-lg'}`}></i>
                        </button>
                     </div>
                 </div>
                ))}
             </div>
          </div>
        )}
        {activeSubTab === 'departments' && (
          <div className="p-10 animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">الهيكل التنظيمي والأقسام</h3>
                <div className="flex gap-3">
                   <button 
                     onClick={handleExportDepartments}
                     className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase border border-emerald-100 hover:bg-emerald-100 transition flex items-center gap-2"
                   >
                     <i className="fas fa-file-excel"></i> تصدير CSV
                   </button>
                <button 
                  onClick={() => setIsAddDepartmentModalOpen(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                   <i className="fas fa-plus-circle"></i> إضافة قسم جديد
                </button>
                </div>
             </div>
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="بحث عن قسم أو مدير..." 
                  value={deptSearchQuery}
                  onChange={(e) => setDeptSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
             </div>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.map((dept: Department) => (
                  <div key={dept.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group relative hover:border-indigo-200 transition-all">
                     <div className="flex justify-between items-start mb-4 flex-row-reverse">
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleDeleteDepartment(dept.id)}
                             className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition shadow-sm"
                             title="حذف القسم"
                           >
                              <i className="fas fa-trash-can text-[10px]"></i>
                           </button>
                           <button 
                             onClick={() => {
                               setEditingDepartment(dept);
                               setIsEditDepartmentModalOpen(true);
                             }}
                             className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition shadow-sm"
                             title="تعديل القسم"
                           >
                              <i className="fas fa-pen text-[10px]"></i>
                           </button>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm text-xl">
                           <i className="fas fa-sitemap"></i>
                        </div>
                     </div>
                     
                     <div className="text-right space-y-2">
                        <h4 className="text-sm font-black text-slate-800">{dept.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">مدير القسم: <span className="text-indigo-600">{dept.managerName}</span></p>
                     </div>

                     <div className="mt-6 pt-4 border-t border-slate-200/50 flex justify-between items-center flex-row-reverse">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">عدد الموظفين</span>
                        <span className="bg-white px-3 py-1 rounded-lg text-[10px] font-black text-slate-700 shadow-sm border border-slate-100">{dept.employeeCount}</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeSubTab === 'shifts' && (
          <div className="p-10 animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">إدارة الورديات وجداول العمل</h3>
                <div className="flex gap-3">
                   <select
                     value={shiftFilter}
                     onChange={(e) => setShiftFilter(e.target.value as 'all' | 'morning' | 'evening')}
                     className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                   >
                     <option value="all">كل الورديات</option>
                     <option value="morning">ورديات صباحية</option>
                     <option value="evening">ورديات مسائية/ليلية</option>
                   </select>
                   <button 
                     onClick={() => setIsAddShiftModalOpen(true)}
                     className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                   >
                      <i className="fas fa-plus-circle"></i> إضافة وردية جديدة
                   </button>
                </div>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
                {filteredShifts.map((shift) => (
                  <div key={shift.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group relative">
                     <div className="flex justify-between items-start mb-4 flex-row-reverse">
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleDeleteShift(shift.id)}
                             className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition shadow-sm"
                             title="حذف الوردية"
                           >
                              <i className="fas fa-trash-can text-xs"></i>
                           </button>
                           <button 
                             onClick={() => {
                               setEditingShift(shift);
                               setIsEditShiftModalOpen(true);
                             }}
                             className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition shadow-sm"
                             title="تعديل الوردية"
                           >
                              <i className="fas fa-pen text-xs"></i>
                           </button>
                           <button 
                             onClick={() => handleDuplicateShift(shift.id)}
                             className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition shadow-sm"
                             title="تكرار الوردية"
                           >
                              <i className="fas fa-copy text-xs"></i>
                           </button>
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                              <i className="fas fa-clock"></i>
                           </div>
                        </div>
                        <div className="text-right">
                           <h4 className="text-sm font-black text-slate-800">{shift.name}</h4>
                           <div className="flex items-center gap-2 mt-1 justify-end">
                              <span className="text-[10px] font-black text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-100">{shift.startTime} - {shift.endTime}</span>
                              {(shift as any).type === 'VARIABLE' && <span className="text-[8px] font-black text-purple-500 bg-purple-50 px-2 py-1 rounded-lg">وردية متغيرة</span>}
                              {shift.isOvernight && <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">وردية ليلية</span>}
                           </div>
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200/50 justify-end">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                           <span>فترة سماح: {shift.gracePeriod} دقيقة</span>
                           <i className="fas fa-hourglass-half text-amber-500"></i>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeSubTab === 'attendance' && (
          <div className="p-10 animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">إعدادات الحضور والانصراف</h3>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                   <i className="fas fa-calendar-check"></i>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">وقت الحضور الافتراضي</label>
                   <input 
                     type="time" 
                     value={attendanceConfig.defaultStartTime}
                     onChange={(e) => setAttendanceConfig({...attendanceConfig, defaultStartTime: e.target.value})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">وقت الانصراف الافتراضي</label>
                   <input 
                     type="time" 
                     value={attendanceConfig.defaultEndTime}
                     onChange={(e) => setAttendanceConfig({...attendanceConfig, defaultEndTime: e.target.value})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">سماحية التأخير (دقائق)</label>
                   <input 
                     type="number" 
                     value={attendanceConfig.lateTolerance}
                     onChange={(e) => setAttendanceConfig({...attendanceConfig, lateTolerance: parseInt(e.target.value)})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">سماحية الانصراف المبكر (دقائق)</label>
                   <input 
                     type="number" 
                     value={attendanceConfig.earlyDepartureTolerance}
                     onChange={(e) => setAttendanceConfig({...attendanceConfig, earlyDepartureTolerance: parseInt(e.target.value)})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">الحد الأقصى للساعات الإضافية</label>
                   <input 
                     type="number" 
                     value={attendanceConfig.maxOvertimeHours}
                     onChange={(e) => setAttendanceConfig({...attendanceConfig, maxOvertimeHours: parseInt(e.target.value)})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">الحد الأقصى للتأخير الشهري (دقائق)</label>
                   <input 
                     type="number" 
                     value={attendanceConfig.maxMonthlyLateMinutes}
                     onChange={(e) => setAttendanceConfig({...attendanceConfig, maxMonthlyLateMinutes: parseInt(e.target.value)})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">عدد أيام العمل الأسبوعية</label>
                   <input 
                     type="number" 
                     value={attendanceConfig.weeklyWorkDays}
                     onChange={(e) => setAttendanceConfig({...attendanceConfig, weeklyWorkDays: parseInt(e.target.value)})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">الحد الأقصى للإجازات السنوية</label>
                   <input 
                     type="number" 
                     value={attendanceConfig.maxAnnualLeaves}
                     onChange={(e) => setAttendanceConfig({...attendanceConfig, maxAnnualLeaves: parseInt(e.target.value)})}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <button 
                  onClick={handleResetAttendanceConfig}
                  className="bg-slate-100 text-slate-500 px-5 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition shadow-sm"
                >
                  إعادة تعيين
                </button>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">أيام العطلة الأسبوعية</label>
                   <div className="flex flex-wrap gap-3">
                      {daysOfWeek.map(day => (
                        <button
                          key={day}
                          onClick={() => toggleHoliday(day)}
                          className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${
                            attendanceConfig.weeklyHolidays.includes(day)
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeSubTab === 'holidays' && (
          <HolidaysManagement />
        )}

        {activeSubTab === 'policies' && (
          <CompanyPoliciesManagement />
        )}
        {activeSubTab === 'job_titles' && (
          <JobTitlesManagement />
        )}

        {activeSubTab === 'doc_types' && (
          <DocumentTypesManagement />
        )}

        {activeSubTab === 'documents' && (
          <div className="p-10 animate-fade-in space-y-10">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h3 className="text-2xl font-black text-slate-800">خزنة الوثائق والامتثال</h3>
                   <p className="text-sm text-slate-400 font-medium">مراقبة تواريخ انتهاء الهوية وتصاريح العمل لمنع المخالفات القانونية.</p>
                </div>
                <div className="flex gap-3 items-center">
                   <button 
                     onClick={() => setIsDocSettingsModalOpen(true)}
                     className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center justify-center"
                     title="إعدادات التنبيهات"
                   >
                      <i className="fas fa-gear"></i>
                   </button>
                   <button 
                     onClick={handleSendReminders}
                     className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
                   >
                     <i className="fas fa-bell"></i> إرسال تنبيهات التجديد
                   </button>
                </div>
             </div>

             {/* Smart Alert Banner */}
             <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0"><i className="fas fa-triangle-exclamation"></i></div>
                <div>
                   <h4 className="font-black text-amber-800 text-sm">نظام التنبيه الذكي نشط</h4>
                   <p className="text-xs text-amber-700 mt-1">سيتم إرسال تنبيهات تلقائية للموظفين قبل <span className="font-black">{docAlertSettings.thresholdDays} يوماً</span> من انتهاء صلاحية الوثائق.</p>
                </div>
             </div>

             {/* Filters & Stats */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'الكل', val: 'ALL', count: employees.reduce((acc: number, e: Employee) => acc + (e.documents?.length || 0), 0), color: 'bg-slate-100 text-slate-600' },
                  { label: 'سارية', val: 'VALID', count: employees.reduce((acc: number, e: Employee) => acc + (e.documents?.filter((d: EmployeeDocument) => d.status === 'VALID').length || 0), 0), color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'تنتهي قريباً', val: 'EXPIRING', count: employees.reduce((acc: number, e: Employee) => acc + (e.documents?.filter((d: EmployeeDocument) => d.status === 'EXPIRING_SOON').length || 0), 0), color: 'bg-amber-50 text-amber-600' },
                  { label: 'منتهية', val: 'EXPIRED', count: employees.reduce((acc: number, e: Employee) => acc + (e.documents?.filter((d: EmployeeDocument) => d.status === 'EXPIRED').length || 0), 0), color: 'bg-rose-50 text-rose-600' },
                ].map((stat: any) => (
                  <button 
                    key={stat.val}
                    onClick={() => setDocFilterStatus(stat.val as any)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${docFilterStatus === stat.val ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-100 hover:border-indigo-200'} ${stat.color}`}
                  >
                     <span className="text-2xl font-black">{stat.count}</span>
                     <span className="text-[10px] font-bold uppercase">{stat.label}</span>
                  </button>
                ))}
             </div>

             <div className="space-y-4">
                {employees.map((emp: Employee) => {
                   const empDocs = emp.documents?.filter((doc: EmployeeDocument) => {
                      if (docFilterStatus === 'ALL') return true;
                      if (docFilterStatus === 'VALID') return doc.status === 'VALID';
                      if (docFilterStatus === 'EXPIRING') return doc.status === 'EXPIRING_SOON';
                      if (docFilterStatus === 'EXPIRED') return doc.status === 'EXPIRED';
                      return true;
                   }) || [];

                   if (empDocs.length === 0) return null;

                   return (
                   <div key={emp.id} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:border-indigo-200 transition-all">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                         <div className="flex items-center gap-5 flex-row-reverse text-right shrink-0">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-xl text-slate-400 shadow-sm overflow-hidden border-2 border-white ring-2 ring-slate-100">
                               {emp.avatarUrl ? (
                                 <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                               ) : (
                                 <i className="fas fa-user-id"></i>
                               )}
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-slate-800">{emp.name}</h4>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.title}</p>
                            </div>
                         </div>

                         <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                            {empDocs.map((doc: EmployeeDocument) => (
                               <div key={doc.id} className={`p-4 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
                                 doc.status === 'EXPIRED' ? 'bg-rose-50 border-rose-100' : 
                                 doc.status === 'EXPIRING_SOON' ? 'bg-amber-50 border-amber-100 shadow-sm animate-pulse-slow' : 'bg-white border-slate-100 shadow-sm'
                               }`}>
                                  {/* Smart Classification Badge */}
                                  <div className="absolute top-0 left-0 bg-slate-200/50 px-2 py-1 rounded-br-xl text-[8px] font-black text-slate-500">
                                     {getDocCategory(doc.type)}
                                  </div>

                                  <div className="flex justify-between items-center mb-2 flex-row-reverse mt-2">
                                     <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{doc.type}</span>
                                     <i className={`fas ${doc.status === 'VALID' ? 'fa-check-circle text-emerald-500' : 'fa-clock text-slate-400'} text-xs`}></i>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-[10px] font-black text-slate-800">
                                        تنتهي في: {doc.expiryDate}
                                        <span className="block text-[9px] text-slate-400 font-normal mt-0.5">({calculateDaysRemaining(doc.expiryDate)} يوم متبقي)</span>
                                     </p>
                                     <p className={`text-[8px] font-black mt-1 ${doc.status === 'EXPIRED' ? 'text-rose-600' : doc.status === 'EXPIRING_SOON' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {doc.status === 'EXPIRED' ? 'منتهية الصلاحية!' : doc.status === 'EXPIRING_SOON' ? 'تنبيه: اقترب الانتهاء' : 'صالحة'}
                                     </p>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                )})}
             </div>

             {isDocSettingsModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                   <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-black text-slate-800">إعدادات التنبيهات الذكية</h3>
                         <button onClick={() => setIsDocSettingsModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"><i className="fas fa-times"></i></button>
                      </div>
                      <div className="space-y-6">
                         <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2">فترة التنبيه المبكر (أيام)</label>
                            <input 
                              type="number" 
                              value={docAlertSettings.thresholdDays}
                              onChange={(e) => setDocAlertSettings({...docAlertSettings, thresholdDays: parseInt(e.target.value)})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                         </div>
                         <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <input type="checkbox" checked={docAlertSettings.notifyEmployee} onChange={(e) => setDocAlertSettings({...docAlertSettings, notifyEmployee: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                               <span className="text-xs font-bold text-slate-700">تنبيه الموظف تلقائياً (Email/SMS)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <input type="checkbox" checked={docAlertSettings.notifyHr} onChange={(e) => setDocAlertSettings({...docAlertSettings, notifyHr: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                               <span className="text-xs font-bold text-slate-700">تنبيه مدير الموارد البشرية</span>
                            </label>
                         </div>
                         <button onClick={() => setIsDocSettingsModalOpen(false)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition">
                            حفظ الإعدادات
                         </button>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {activeSubTab === 'notifications' && (
          <div className="p-10 animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">إعدادات الإشعارات والتنبيهات</h3>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                   <i className="fas fa-bell"></i>
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                   <h4 className="font-black text-slate-800 mb-4">قنوات الإشعار</h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-600">تنبيهات البريد الإلكتروني</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notificationSettings.emailAlerts} onChange={() => setNotificationSettings({...notificationSettings, emailAlerts: !notificationSettings.emailAlerts})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                         </label>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-600">رسائل SMS</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notificationSettings.smsAlerts} onChange={() => setNotificationSettings({...notificationSettings, smsAlerts: !notificationSettings.smsAlerts})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                         </label>
                      </div>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-600">إشعارات التطبيق (Push)</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={notificationSettings.pushNotifications} onChange={() => setNotificationSettings({...notificationSettings, pushNotifications: !notificationSettings.pushNotifications})} className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                   <h4 className="font-black text-slate-800 mb-4">أنواع التنبيهات</h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-600">إعلانات النظام</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notificationSettings.systemAnnouncements} onChange={() => setNotificationSettings({...notificationSettings, systemAnnouncements: !notificationSettings.systemAnnouncements})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                         </label>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-600">تنبيهات الأمان</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notificationSettings.securityAlerts} onChange={() => setNotificationSettings({...notificationSettings, securityAlerts: !notificationSettings.securityAlerts})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                         </label>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeSubTab === 'security' && (
          <div className="p-10 animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">إعدادات الأمان وتغيير كلمة المرور</h3>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                   <i className="fas fa-shield-halved"></i>
                </div>
             </div>

             <div className="max-w-2xl bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                <div className="space-y-6">
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">كلمة المرور الحالية</label>
                      <input 
                        type="password" 
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">كلمة المرور الجديدة</label>
                      <input 
                        type="password" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">تأكيد كلمة المرور الجديدة</label>
                      <input 
                        type="password" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                   </div>
                   <button 
                     onClick={handleChangePassword}
                     className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4"
                   >
                      تحديث كلمة المرور
                   </button>
                </div>
             </div>
          </div>
        )}

        {activeSubTab === 'backup' && (
          <div className="p-10 animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <div>
                   <h3 className="text-2xl font-black text-slate-800">النسخ الاحتياطي والاستعادة</h3>
                   <p className="text-sm text-slate-400 font-medium">إدارة نسخ قاعدة البيانات للحفاظ على أمان المعلومات.</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                   <i className="fas fa-database"></i>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${autoBackupSettings.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                         <i className="fas fa-clock-rotate-left"></i>
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-slate-800">النسخ الاحتياطي التلقائي</h4>
                         <p className="text-xs text-slate-500 font-medium">جدولة النظام لإنشاء نسخ احتياطية دورية دون تدخل.</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoBackupSettings.enabled} 
                        onChange={() => setAutoBackupSettings({...autoBackupSettings, enabled: !autoBackupSettings.enabled})} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                   </label>
                </div>
                
                {autoBackupSettings.enabled && (
                  <div className="grid md:grid-cols-3 gap-6 animate-fade-in pt-4 border-t border-slate-50">
                     <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">التكرار (Frequency)</label>
                        <select 
                          value={autoBackupSettings.frequency}
                          onChange={(e) => setAutoBackupSettings({...autoBackupSettings, frequency: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                           <option value="daily">يومياً (Daily)</option>
                           <option value="weekly">أسبوعياً (Weekly)</option>
                           <option value="monthly">شهرياً (Monthly)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">وقت التنفيذ</label>
                        <input 
                          type="time" 
                          value={autoBackupSettings.time}
                          onChange={(e) => setAutoBackupSettings({...autoBackupSettings, time: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">الاحتفاظ بالنسخ (أيام)</label>
                        <input 
                          type="number" 
                          value={autoBackupSettings.retentionDays}
                          onChange={(e) => setAutoBackupSettings({...autoBackupSettings, retentionDays: parseInt(e.target.value)})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>
                  </div>
                )}
             </div>

             <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h4 className="text-lg font-black text-slate-800 mb-2">إنشاء نسخة احتياطية فورية</h4>
                   <p className="text-xs text-slate-500 font-medium">سيتم حفظ جميع بيانات الموظفين، الحضور، والرواتب في ملف مشفر.</p>
                </div>
                <button 
                  onClick={handleCreateBackup}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition flex items-center gap-3"
                >
                   <i className="fas fa-cloud-arrow-down text-lg"></i>
                   إنشاء نسخة الآن
                </button>
             </div>

             <div className="space-y-4">
                <h4 className="font-black text-slate-800 px-2">سجل النسخ الاحتياطية</h4>
                {backups.map(backup => (
                   <div key={backup.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex justify-between items-center hover:shadow-md transition">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
                            <i className="fas fa-check-circle"></i>
                         </div>
                         <div>
                            <h5 className="font-black text-slate-800 text-sm">{backup.id}</h5>
                            <div className="flex gap-3 mt-1">
                               <span className="text-[10px] font-bold text-slate-400">{backup.date}</span>
                               <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 rounded-lg">{backup.type}</span>
                               <span className="text-[10px] font-bold text-slate-500">{backup.size}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="تحميل">
                            <i className="fas fa-download"></i>
                         </button>
                         <button 
                           onClick={() => handleRestoreBackup(backup.id)}
                           className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition" 
                           title="استعادة"
                         >
                            <i className="fas fa-rotate-left"></i>
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {activeSubTab === 'employees' && (
          <div className="p-10 animate-fade-in space-y-10">
             <div className="flex justify-between items-center">
                <div>
                   <h3 className="text-2xl font-black text-slate-800">إدارة الموظفين</h3>
                   <p className="text-sm text-slate-400 font-medium">إدارة ملفات الموظفين، الوثائق، وسجلات الحضور.</p>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                     onClick={() => setIsAddEmployeeModalOpen(true)}
                     className="bg-indigo-600 text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
                   >
                     <i className="fas fa-plus"></i> إضافة موظف
                   </button>
                   <button 
                     onClick={handleExportEmployees}
                     className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase border border-emerald-100 hover:bg-emerald-100 transition flex items-center gap-2"
                   >
                     <i className="fas fa-file-excel"></i> تصدير Excel
                   </button>
                   <button 
                     onClick={handlePrintAllEmployeeCards}
                     className="bg-blue-50 text-blue-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase border border-blue-100 hover:bg-blue-100 transition flex items-center gap-2"
                   >
                     <i className="fas fa-id-card"></i> طباعة الكل
                   </button>
                   <div className="hidden md:flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                          className="appearance-none pl-4 pr-9 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer min-w-[120px]"
                        >
                          <option value="">كل الأقسام</option>
                          {uniqueDepts.map((dept: string) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                        <i className="fas fa-sitemap absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
                      </div>
                      <div className="relative">
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="appearance-none pl-4 pr-9 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer min-w-[120px]"
                        >
                          <option value="ALL">كل الحالات</option>
                          <option value="ACTIVE">نشط</option>
                          <option value="INACTIVE">غير نشط</option>
                        </select>
                        <i className="fas fa-filter absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
                      </div>
                   </div>
                   <div className="relative">
                      <input 
                        type="text" 
                        placeholder="بحث عن موظف..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                      />
                      <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                   </div>
                   <div className="bg-rose-50 px-4 py-3 rounded-2xl text-rose-600 text-[10px] font-black uppercase border border-rose-100 hidden md:block">١ وثيقة منتهية</div>
                   <div className="bg-blue-50 px-4 py-3 rounded-2xl text-blue-600 text-[10px] font-black uppercase border border-blue-100 hidden md:block">
                      إجمالي الموظفين: {employees.length}
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                {filteredEmployees.map((emp: Employee) => {
                   const empDocs = emp.documents?.filter((doc: EmployeeDocument) => {
                      if (docFilterStatus === 'ALL') return true;
                      if (docFilterStatus === 'VALID') return doc.status === 'VALID';
                      if (docFilterStatus === 'EXPIRING') return doc.status === 'EXPIRING_SOON';
                      if (docFilterStatus === 'EXPIRED') return doc.status === 'EXPIRED';
                      return true;
                   }) || [];
                   return (
                   <div key={emp.id} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:border-indigo-200 transition-all">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                         <div className="flex items-center gap-5 flex-row-reverse text-right shrink-0">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-xl text-slate-400 group-hover:border-indigo-600 transition-all shadow-sm overflow-hidden border-2 border-white ring-2 ring-slate-100">
                               {emp.avatarUrl ? (
                                 <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                               ) : (
                                 <i className="fas fa-user-id"></i>
                               )}
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-slate-800">{emp.name}</h4>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.title} | {emp.dep}</p>
                               <div className="flex gap-3 mt-2">
                                  <button 
                                    onClick={() => handlePrintEmployeeCard(emp)}
                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                                  >
                                     <i className="fas fa-print"></i> طباعة البطاقة
                                  </button>
                                  <a 
                                    href={`mailto:${emp.email}`}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                                  >
                                     <i className="fas fa-paper-plane"></i> إرسال بريد
                                  </a>
                                  <button 
                                    onClick={() => handleOpenCareer(emp)}
                                    className="text-[10px] font-bold text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors"
                                  >
                                     <i className="fas fa-timeline"></i> المسار الوظيفي
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setEditingEmployee(emp);
                                      setIsEditEmployeeModalOpen(true);
                                    }}
                                    className="text-[10px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                  >
                                     <i className="fas fa-pen"></i> تعديل
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteEmployee(emp.id)}
                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
                                  >
                                     <i className="fas fa-trash-can"></i> حذف
                                  </button>
                               </div>
                            </div>
                         </div>

                         <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                            {empDocs.map((doc: EmployeeDocument) => (
                               <div key={doc.id} className={`p-4 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
                                 doc.status === 'EXPIRED' ? 'bg-rose-50 border-rose-100' : 
                                 doc.status === 'EXPIRING_SOON' ? 'bg-amber-50 border-amber-100 shadow-sm animate-pulse-slow' : 'bg-white border-slate-100 shadow-sm'
                               }`}>
                                  {/* Smart Classification Badge */}
                                  <div className="absolute top-0 left-0 bg-slate-200/50 px-2 py-1 rounded-br-xl text-[8px] font-black text-slate-500">
                                     {getDocCategory(doc.type)}
                                  </div>

                                  <div className="flex justify-between items-center mb-2 flex-row-reverse mt-2">
                                     <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{doc.type}</span>
                                     <i className={`fas ${doc.status === 'VALID' ? 'fa-check-circle text-emerald-500' : 'fa-clock text-slate-400'} text-xs`}></i>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-[10px] font-black text-slate-800">
                                        تنتهي في: {doc.expiryDate}
                                        <span className="block text-[9px] text-slate-400 font-normal mt-0.5">({calculateDaysRemaining(doc.expiryDate)} يوم متبقي)</span>
                                     </p>
                                     <p className={`text-[8px] font-black mt-1 ${doc.status === 'EXPIRED' ? 'text-rose-600' : doc.status === 'EXPIRING_SOON' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {doc.status === 'EXPIRED' ? 'منتهية الصلاحية!' : doc.status === 'EXPIRING_SOON' ? 'تنبيه: اقترب الانتهاء' : 'صالحة'}
                                     </p>
                                  </div>
                               </div>
                            ))}
                            <button className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 flex flex-col items-center justify-center gap-1 hover:border-indigo-300 hover:text-indigo-600 transition group/btn">
                               <i className="fas fa-plus-circle text-lg group-hover/btn:scale-110 transition"></i>
                               <span className="text-[9px] font-black uppercase">إضافة وثيقة</span>
                            </button>
                         </div>
                      </div>
                   </div>
                )})}
             </div>

        {isDocSettingsModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
             <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black text-slate-800">إعدادات التنبيهات الذكية</h3>
                   <button onClick={() => setIsDocSettingsModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"><i className="fas fa-times"></i></button>
                </div>
                <div className="space-y-6">
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">فترة التنبيه المبكر (أيام)</label>
                      <input 
                        type="number" 
                        value={docAlertSettings.thresholdDays}
                        onChange={(e) => setDocAlertSettings({...docAlertSettings, thresholdDays: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <input type="checkbox" checked={docAlertSettings.notifyEmployee} onChange={(e) => setDocAlertSettings({...docAlertSettings, notifyEmployee: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                         <span className="text-xs font-bold text-slate-700">تنبيه الموظف تلقائياً (Email/SMS)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <input type="checkbox" checked={docAlertSettings.notifyHr} onChange={(e) => setDocAlertSettings({...docAlertSettings, notifyHr: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                         <span className="text-xs font-bold text-slate-700">تنبيه مدير الموارد البشرية</span>
                      </label>
                   </div>
                   <button onClick={() => setIsDocSettingsModalOpen(false)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition">
                      حفظ الإعدادات
                   </button>
                </div>
             </div>
          </div>
        )}
          </div>
        )}
      </div>

      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">إضافة موظف جديد</h3>
              <button onClick={() => setIsAddEmployeeModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم الموظف</label>
                <input 
                  type="text" 
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={newEmployee.email}
                    onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">رقم الهاتف</label>
                  <input 
                    type="tel" 
                    value={newEmployee.phone}
                    onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">المسمى الوظيفي</label>
                  <input 
                    type="text" 
                    value={newEmployee.title}
                    onChange={e => setNewEmployee({...newEmployee, title: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">القسم</label>
                  <input 
                    type="text" 
                    value={newEmployee.dep}
                    onChange={e => setNewEmployee({...newEmployee, dep: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ الميلاد</label>
                  <input 
                    type="date" 
                    value={newEmployee.birthDate || ''}
                    onChange={e => setNewEmployee({...newEmployee, birthDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">تاريخ التعيين</label>
                  <input 
                    type="date" 
                    value={newEmployee.hireDate || ''}
                    onChange={e => setNewEmployee({...newEmployee, hireDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  />
                </div>
                 <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">الراتب الأساسي</label>
                  <input 
                    type="number" 
                    value={newEmployee.basicSalary}
                    onChange={e => setNewEmployee({...newEmployee, basicSalary: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setIsAddEmployeeModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleAddEmployee}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition"
                >
                  حفظ وإضافة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditEmployeeModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل بيانات الموظف</h3>
              <button onClick={() => setIsEditEmployeeModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم الموظف</label>
                <input 
                  type="text" 
                  value={editingEmployee.name}
                  onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={editingEmployee.email || ''}
                    onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">رقم الهاتف</label>
                  <input 
                    type="tel" 
                    value={editingEmployee.phone || ''}
                    onChange={e => setEditingEmployee({...editingEmployee, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">المسمى الوظيفي</label>
                  <input 
                    type="text" 
                    value={editingEmployee.title}
                    onChange={e => setEditingEmployee({...editingEmployee, title: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">القسم</label>
                  <input 
                    type="text" 
                    value={editingEmployee.dep}
                    onChange={e => setEditingEmployee({...editingEmployee, dep: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setIsEditEmployeeModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleUpdateEmployee}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCareerModalOpen && selectedCareerEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl animate-fade-in h-[80vh] flex flex-col">
             <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                   <h3 className="text-xl font-black text-slate-800">المسار الوظيفي (Career Timeline)</h3>
                   <p className="text-xs text-slate-500 font-bold mt-1">{selectedCareerEmployee.name} - {selectedCareerEmployee.title}</p>
                </div>
                <button onClick={() => setIsCareerModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"><i className="fas fa-times"></i></button>
             </div>

             <div className="flex-grow overflow-y-auto px-4 custom-scrollbar">
                <div className="relative border-r-2 border-slate-100 mr-4 space-y-8 py-4">
                   {((selectedCareerEmployee as any).careerHistory || []).map((event: CareerEvent) => (
                      <div key={event.id} className="relative pr-8">
                         <div className={`absolute top-0 -right-[9px] w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                            event.type === 'Promotion' ? 'bg-indigo-500' :
                            event.type === 'Salary Increase' ? 'bg-emerald-500' :
                            event.type === 'Warning' ? 'bg-rose-500' : 'bg-slate-400'
                         }`}></div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition group">
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">{event.date}</span>
                               <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                                  event.type === 'Promotion' ? 'bg-indigo-100 text-indigo-600' :
                                  event.type === 'Salary Increase' ? 'bg-emerald-100 text-emerald-600' :
                                  event.type === 'Warning' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                               }`}>{event.type}</span>
                            </div>
                            <h4 className="text-sm font-black text-slate-800 mb-1">{event.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{event.details}</p>
                            {event.change && (
                               <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center gap-2">
                                  <i className="fas fa-arrow-trend-up text-emerald-500 text-xs"></i>
                                  <span className="text-xs font-bold text-slate-700">{event.change}</span>
                               </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="mt-6 pt-6 border-t border-slate-100 shrink-0">
                <h4 className="text-sm font-black text-slate-800 mb-4">إضافة حدث جديد</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <select 
                     value={newCareerEvent.type}
                     onChange={e => setNewCareerEvent({...newCareerEvent, type: e.target.value as any})}
                     className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                   >
                      <option value="Salary Increase">زيادة راتب</option>
                      <option value="Promotion">ترقية</option>
                      <option value="Transfer">نقل</option>
                      <option value="Award">مكافأة</option>
                      <option value="Warning">إنذار</option>
                   </select>
                   <input type="date" value={newCareerEvent.date} onChange={e => setNewCareerEvent({...newCareerEvent, date: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                   <input type="text" placeholder="العنوان (مثال: ترقية استثنائية)" value={newCareerEvent.title} onChange={e => setNewCareerEvent({...newCareerEvent, title: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                   <input type="text" placeholder="التغيير (مثال: +2000 ج.م)" value={newCareerEvent.change} onChange={e => setNewCareerEvent({...newCareerEvent, change: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                   <textarea placeholder="التفاصيل..." value={newCareerEvent.details} onChange={e => setNewCareerEvent({...newCareerEvent, details: e.target.value})} className="col-span-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none h-20 resize-none" />
                </div>
                <button onClick={handleAddCareerEvent} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg hover:bg-indigo-700 transition">إضافة للسجل</button>
             </div>
          </div>
        </div>
      )}

      {isAddBranchModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">إضافة فرع جديد</h3>
              <button onClick={() => setIsAddBranchModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم الفرع</label>
                <input type="text" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">العنوان</label>
                <input type="text" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">المدير المسؤول</label>
                <input type="text" value={newBranch.managerName} onChange={e => setNewBranch({...newBranch, managerName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">البريد الإلكتروني</label>
                  <input type="email" value={newBranch.email} onChange={e => setNewBranch({...newBranch, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">رقم الهاتف</label>
                  <input type="tel" value={newBranch.phone} onChange={e => setNewBranch({...newBranch, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">WiFi SSID</label>
                  <input type="text" value={newBranch.wifiSsid} onChange={e => setNewBranch({...newBranch, wifiSsid: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">نطاق جغرافي (متر)</label>
                  <input type="number" value={newBranch.geofenceRadius} onChange={e => setNewBranch({...newBranch, geofenceRadius: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <button onClick={handleAddBranch} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4">إضافة الفرع</button>
            </div>
          </div>
        </div>
      )}

      {isEditBranchModalOpen && editingBranch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل بيانات الفرع</h3>
              <button onClick={() => setIsEditBranchModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم الفرع</label>
                <input type="text" value={editingBranch.name} onChange={e => setEditingBranch({...editingBranch, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">العنوان</label>
                <input type="text" value={editingBranch.address} onChange={e => setEditingBranch({...editingBranch, address: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">المدير المسؤول</label>
                <input type="text" value={editingBranch.managerName || ''} onChange={e => setEditingBranch({...editingBranch, managerName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">البريد الإلكتروني</label>
                  <input type="email" value={editingBranch.email || ''} onChange={e => setEditingBranch({...editingBranch, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">رقم الهاتف</label>
                  <input type="tel" value={editingBranch.phone || ''} onChange={e => setEditingBranch({...editingBranch, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">WiFi SSID</label>
                  <input type="text" value={editingBranch.wifiSsid} onChange={e => setEditingBranch({...editingBranch, wifiSsid: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">نطاق جغرافي (متر)</label>
                  <input type="number" value={editingBranch.geofenceRadius} onChange={e => setEditingBranch({...editingBranch, geofenceRadius: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setIsEditBranchModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button onClick={handleUpdateBranch} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition">حفظ التعديلات</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditBranchModalOpen && editingBranch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل بيانات الفرع</h3>
              <button onClick={() => setIsEditBranchModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم الفرع</label>
                <input type="text" value={editingBranch.name} onChange={e => setEditingBranch({...editingBranch, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">العنوان</label>
                <input type="text" value={editingBranch.address} onChange={e => setEditingBranch({...editingBranch, address: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">المدير المسؤول</label>
                <input type="text" value={editingBranch.managerName || ''} onChange={e => setEditingBranch({...editingBranch, managerName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">البريد الإلكتروني</label>
                  <input type="email" value={editingBranch.email || ''} onChange={e => setEditingBranch({...editingBranch, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">رقم الهاتف</label>
                  <input type="tel" value={editingBranch.phone || ''} onChange={e => setEditingBranch({...editingBranch, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-right" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">WiFi SSID</label>
                  <input type="text" value={editingBranch.wifiSsid} onChange={e => setEditingBranch({...editingBranch, wifiSsid: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">نطاق جغرافي (متر)</label>
                  <input type="number" value={editingBranch.geofenceRadius} onChange={e => setEditingBranch({...editingBranch, geofenceRadius: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setIsEditBranchModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button onClick={handleUpdateBranch} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition">حفظ التعديلات</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddDepartmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">إضافة قسم جديد</h3>
              <button onClick={() => setIsAddDepartmentModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم القسم</label>
                <input type="text" value={newDepartment.name} onChange={e => setNewDepartment({...newDepartment, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">مدير القسم</label>
                <input type="text" value={newDepartment.managerName} onChange={e => setNewDepartment({...newDepartment, managerName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الميزانية السنوية</label>
                <input type="number" value={newDepartment.budget} onChange={e => setNewDepartment({...newDepartment, budget: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button onClick={handleAddDepartment} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4">إضافة القسم</button>
            </div>
          </div>
        </div>
      )}

      {isEditDepartmentModalOpen && editingDepartment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل بيانات القسم</h3>
              <button onClick={() => setIsEditDepartmentModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم القسم</label>
                <input type="text" value={editingDepartment.name} onChange={e => setEditingDepartment({...editingDepartment, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">مدير القسم</label>
                <input type="text" value={editingDepartment.managerName} onChange={e => setEditingDepartment({...editingDepartment, managerName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">الميزانية السنوية</label>
                <input type="number" value={editingDepartment.budget || ''} onChange={e => setEditingDepartment({...editingDepartment, budget: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setIsEditDepartmentModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button onClick={handleUpdateDepartment} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition">حفظ التعديلات</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddShiftModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">إضافة وردية جديدة</h3>
              <button onClick={() => setIsAddShiftModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم الوردية</label>
                <input 
                  type="text" 
                  value={newShift.name}
                  onChange={e => setNewShift({...newShift, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">نوع الوردية</label>
                <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-100">
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="shiftType"
                        checked={newShift.type !== 'VARIABLE'}
                        onChange={() => setNewShift({...newShift, type: 'FIXED'})}
                        className="w-4 h-4 text-indigo-600 accent-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-700">ثابتة (Fixed)</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="shiftType"
                        checked={newShift.type === 'VARIABLE'}
                        onChange={() => setNewShift({...newShift, type: 'VARIABLE'})}
                        className="w-4 h-4 text-indigo-600 accent-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-700">متغيرة (Flexible)</span>
                   </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{newShift.type === 'VARIABLE' ? 'بداية النافذة' : 'وقت البدء'}</label>
                  <input 
                    type="time" 
                    value={newShift.startTime}
                    onChange={e => setNewShift({...newShift, startTime: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{newShift.type === 'VARIABLE' ? 'نهاية النافذة' : 'وقت الانتهاء'}</label>
                  <input 
                    type="time" 
                    value={newShift.endTime}
                    onChange={e => setNewShift({...newShift, endTime: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                   <label className="block text-xs font-black text-slate-400 uppercase mb-2">فترة السماح (دقيقة)</label>
                   <input 
                     type="number" 
                     value={newShift.gracePeriod}
                     onChange={e => setNewShift({...newShift, gracePeriod: parseInt(e.target.value)})}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">الحد الأقصى للإضافي (س)</label>
                  <input 
                    type="number" 
                    value={newShift.maxOvertimeHours}
                    onChange={e => setNewShift({...newShift, maxOvertimeHours: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{newShift.type === 'VARIABLE' ? 'ساعات العمل المطلوبة' : 'الحد الأدنى (س)'}</label>
                  <input 
                    type="number" 
                    value={newShift.minWorkHours}
                    onChange={e => setNewShift({...newShift, minWorkHours: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <input 
                   type="checkbox" 
                   checked={newShift.isOvernight}
                   onChange={e => setNewShift({...newShift, isOvernight: e.target.checked})}
                   className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                 />
                 <span className="text-sm font-bold text-slate-700">وردية ليلية (تمتد لليوم التالي)</span>
              </div>
              
              <button 
                onClick={handleAddShift}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition mt-4"
              >
                إضافة الوردية
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditShiftModalOpen && editingShift && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">تعديل بيانات الوردية</h3>
              <button onClick={() => setIsEditShiftModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">اسم الوردية</label>
                <input 
                  type="text" 
                  value={editingShift.name}
                  onChange={e => setEditingShift({...editingShift, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">نوع الوردية</label>
                <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-100">
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="editShiftType"
                        checked={(editingShift as any).type !== 'VARIABLE'}
                        onChange={() => setEditingShift({...editingShift, type: 'FIXED'} as any)}
                        className="w-4 h-4 text-indigo-600 accent-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-700">ثابتة (Fixed)</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="editShiftType"
                        checked={(editingShift as any).type === 'VARIABLE'}
                        onChange={() => setEditingShift({...editingShift, type: 'VARIABLE'} as any)}
                        className="w-4 h-4 text-indigo-600 accent-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-700">متغيرة (Flexible)</span>
                   </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{(editingShift as any).type === 'VARIABLE' ? 'بداية النافذة' : 'وقت البدء'}</label>
                  <input 
                    type="time" 
                    value={editingShift.startTime}
                    onChange={e => setEditingShift({...editingShift, startTime: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{(editingShift as any).type === 'VARIABLE' ? 'نهاية النافذة' : 'وقت الانتهاء'}</label>
                  <input 
                    type="time" 
                    value={editingShift.endTime}
                    onChange={e => setEditingShift({...editingShift, endTime: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">الحد الأقصى للإضافي (ساعات)</label>
                  <input 
                    type="number" 
                    value={editingShift.maxOvertimeHours || ''}
                    onChange={e => setEditingShift({...editingShift, maxOvertimeHours: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="اتركه فارغاً لاستخدام الإعداد العام"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{(editingShift as any).type === 'VARIABLE' ? 'ساعات العمل المطلوبة' : 'الحد الأدنى (س)'}</label>
                  <input 
                    type="number" 
                    value={editingShift.minWorkHours || ''}
                    onChange={e => setEditingShift({...editingShift, minWorkHours: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <input 
                   type="checkbox" 
                   checked={editingShift.isOvernight}
                   onChange={e => setEditingShift({...editingShift, isOvernight: e.target.checked})}
                   className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                 />
                 <span className="text-sm font-bold text-slate-700">وردية ليلية (تمتد لليوم التالي)</span>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setIsEditShiftModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleUpdateShift}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGeofenceModalOpen && branchToToggleGeofence && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 text-2xl">
               <i className="fas fa-bullseye"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">تأكيد تغيير حالة Geofencing</h3>
            <p className="text-sm text-slate-500 font-medium mb-8">
              هل أنت متأكد من {branchToToggleGeofence.geofencingEnabled ? 'تعطيل' : 'تفعيل'} البصمة الجغرافية لفرع "{branchToToggleGeofence.name}"؟
            </p>
            <div className="flex gap-3">
               <button 
                 onClick={() => setIsGeofenceModalOpen(false)}
                 className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs hover:bg-slate-200 transition"
               >
                 إلغاء
               </button>
               <button 
                 onClick={confirmToggleGeofence}
                 className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg hover:bg-indigo-700 transition"
               >
                 تأكيد
               </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteDeptModalOpen && deptToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 text-2xl">
               <i className="fas fa-triangle-exclamation"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">تأكيد حذف القسم</h3>
            <p className="text-sm text-slate-500 font-medium mb-8">
              هل أنت متأكد من رغبتك في حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
               <button 
                 onClick={() => setIsDeleteDeptModalOpen(false)}
                 className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs hover:bg-slate-200 transition"
               >
                 إلغاء
               </button>
               <button 
                 onClick={confirmDeleteDepartment}
                 className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-xs shadow-lg hover:bg-rose-700 transition"
               >
                 حذف نهائي
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-8 left-8 z-50">
        <button 
          onClick={handleSave}
          className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-3 border-4 border-white"
        >
          <i className="fas fa-save text-lg"></i>
          <span>حفظ وتطبيق التغييرات</span>
        </button>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SystemSetupView;