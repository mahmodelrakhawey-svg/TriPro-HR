import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Employee, Branch, Department, SecurityAlert, AlertSeverity } from './types';
import { supabase } from './supabaseClient';

interface DataContextType {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  alerts: SecurityAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<SecurityAlert[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // البيانات الأولية المشتركة (Single Source of Truth)
  const [employees, setEmployees] = useState<Employee[]>([
    { 
      id: 'e1', 
      name: 'أحمد الشناوي', 
      title: 'Senior Developer', 
      dep: 'IT', 
      avatarUrl: 'https://i.pravatar.cc/150?img=11',
      device: 'iPhone 13 PRO', 
      email: 'ahmed.shenawy@example.com',
      status: 'ACTIVE',
      documents: [
        { id: 'd1', type: 'ID', expiryDate: '2025-12-30', status: 'VALID' },
        { id: 'd2', type: 'WORK_PERMIT', expiryDate: '2024-06-15', status: 'EXPIRING_SOON' }
      ],
      careerHistory: [
        { id: 'c1', date: '2022-01-15', type: 'Hiring', title: 'تعيين جديد', details: 'تم التعيين بوظيفة Junior Developer', change: '8000 EGP' },
        { id: 'c2', date: '2023-06-01', type: 'Promotion', title: 'ترقية', details: 'ترقية إلى Senior Developer', change: 'Senior' },
        { id: 'c3', date: '2024-01-01', type: 'Salary Increase', title: 'زيادة سنوية', details: 'تعديل الراتب السنوي', change: '15000 -> 18000 EGP' }
      ]
    },
    { 
      id: 'e2', 
      name: 'سارة فوزي', 
      title: 'HR Manager', 
      dep: 'HR', 
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
      device: 'Samsung S22', 
      email: 'sara.fawzy@example.com',
      status: 'ACTIVE',
      documents: [
        { id: 'd3', type: 'ID', expiryDate: '2024-02-10', status: 'EXPIRED' }
      ],
      careerHistory: [
        { id: 'c4', date: '2021-03-10', type: 'Hiring', title: 'تعيين', details: 'مدير موارد بشرية', change: '12000 EGP' }
      ]
    },
  ]);

  const [branches, setBranches] = useState<Branch[]>([
    { id: 'BR-01', name: 'فرع القاهرة (المقر الرئيسي)', managerName: 'محمد علي', address: 'التجمع الخامس، القاهرة', wifiSsid: 'TMG_Office_5G', wifiBssid: '00:14:22:01:23:45', wifiEncryption: 'WPA3', geofenceRadius: 100, geofencingEnabled: true, employeeCount: 45, location: { lat: 30.0, lng: 31.0 } },
    { id: 'BR-02', name: 'فرع الإسكندرية', managerName: 'محمود حسن', address: 'سموحة، الإسكندرية', wifiSsid: 'TMG_Alex_Wifi', wifiBssid: '00:14:22:01:99:88', wifiEncryption: 'WPA2', geofenceRadius: 150, geofencingEnabled: false, employeeCount: 22, location: { lat: 31.0, lng: 29.0 } },
  ]);

  const [departments, setDepartments] = useState<Department[]>([
    { id: 'DEP-01', name: 'الموارد البشرية (HR)', managerName: 'سارة فوزي', employeeCount: 5 },
    { id: 'DEP-02', name: 'تكنولوجيا المعلومات (IT)', managerName: 'أحمد الشناوي', employeeCount: 12 },
    { id: 'DEP-03', name: 'المبيعات', managerName: 'خالد إبراهيم', employeeCount: 20 },
  ]);

  const [alerts, setAlerts] = useState<SecurityAlert[]>([
    {
      id: 'A1',
      employeeName: 'هاني رمزي',
      companyName: 'بازوكا مصر',
      type: 'Mock Location',
      description: 'تم رصد محاولة تزييف موقع جغرافي باستخدام تطبيق (Fake GPS Pro)',
      severity: AlertSeverity.CRITICAL,
      timestamp: 'منذ ٥ دقائق',
      isRead: false,
      isResolved: false
    },
    {
      id: 'A2',
      employeeName: 'إيمان علي',
      companyName: 'مجموعة طلعت مستطفى',
      type: 'VPN Detected',
      description: 'اتصال غير آمن عبر سيرفر VPN في هولندا',
      severity: AlertSeverity.HIGH,
      timestamp: 'منذ ١٢ دقيقة',
      isRead: false,
      isResolved: false
    }
  ]);

  // Fetch Real Data from Supabase
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        // 1. Fetch Employees
        // نفترض أنك قمت بإنشاء الجداول كما في التصميم السابق
        const { data: dbEmployees, error } = await supabase
          .from('employees')
          .select(`
            *,
            departments ( name ),
            job_titles ( title )
          `);

        if (!error && dbEmployees && dbEmployees.length > 0) {
          const mappedEmployees: Employee[] = dbEmployees.map((e: any) => ({
            id: e.id,
            name: `${e.first_name} ${e.last_name}`,
            title: e.job_titles?.title || 'General',
            dep: e.departments?.name || 'General',
            email: e.email,
            phone: e.phone,
            status: e.status,
            device: e.device_id || 'Not Paired',
            avatarUrl: e.avatar_url,
            basicSalary: e.basic_salary,
            hireDate: e.hire_date,
            documents: [], // يمكن جلبها باستعلام منفصل لاحقاً
            careerHistory: []
          }));
          setEmployees(mappedEmployees);
        }
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
      }
    };

    fetchSystemData();
  }, []);

  return (
    <DataContext.Provider value={{ employees, setEmployees, branches, setBranches, departments, setDepartments, alerts, setAlerts }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
