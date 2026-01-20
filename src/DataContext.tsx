import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Employee, Branch, Department, SecurityAlert, AlertSeverity } from './types';
import { supabase } from './supabaseClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface DataContextType {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  alerts: SecurityAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<SecurityAlert[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // البيانات الأولية المشتركة (Single Source of Truth)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
        // Call the single function to get all initial data
        const { data, error } = await supabase.rpc('get_system_initial_data');

        if (error) throw error;

        if (data) {
          // Map Employees
          const mappedEmployees: Employee[] = data.employees.map((e: any) => ({
            id: e.id,
            name: `${e.first_name} ${e.last_name}`,
            title: e.job_title || 'General',
            dep: e.department_name || 'General',
            email: e.email,
            phone: e.phone,
            status: e.status,
            device: e.device_id || 'Not Paired',
            avatarUrl: e.avatar_url,
            basicSalary: e.basic_salary,
            hireDate: e.hire_date,
            documents: [],
            careerHistory: []
          }));
          setEmployees(mappedEmployees);

          // Map Departments
          setDepartments(data.departments.map((d: any) => ({ ...d, managerName: d.manager_id || 'N/A', employeeCount: 0 })));

          // Map Branches
          setBranches(data.branches.map((b: any) => ({ ...b, managerName: b.manager_id || 'N/A', employeeCount: 0, location: { lat: 0, lng: 0 } })));
        }

        // Fetch Notifications
        const { data: notifsData } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (notifsData) setNotifications(notifsData);
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
      }
    };

    fetchSystemData();
  }, []);

  return (
    <DataContext.Provider value={{ employees, setEmployees, branches, setBranches, departments, setDepartments, alerts, setAlerts, notifications, setNotifications }}>
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
