import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
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
  refreshData: (background?: boolean) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // البيانات الأولية المشتركة (Single Source of Truth)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const refreshData = useCallback(async (background = false) => {
      if (!background) setIsLoading(true);
      try {
        // 1. Fetch Employees
        const { data: empData, error: empError } = await supabase.from('employees').select('*');
        if (empError) throw empError;

        // 2. Fetch Departments
        const { data: deptData, error: deptError } = await supabase.from('departments').select('*');
        if (deptError) throw deptError;

        // 3. Fetch Branches
        const { data: branchData, error: branchError } = await supabase.from('branches').select('*');
        if (branchError) throw branchError;

        // 4. Fetch Alerts
        const { data: alertsData, error: alertsError } = await supabase
          .from('security_alerts')
          .select('*')
          .order('created_at', { ascending: false });
        if (alertsError) throw alertsError;

        // 5. Fetch Notifications
        const { data: notifsData, error: notifsError } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (notifsError) throw notifsError;

        // Map Departments
        const mappedDepartments: Department[] = (deptData || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          managerName: 'N/A', // Placeholder, requires join
          employeeCount: 0,
          budget: d.budget || 0
        }));
        setDepartments(mappedDepartments);

        // Map Branches
        const mappedBranches: Branch[] = (branchData || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          address: b.location?.address || 'N/A',
          managerName: 'N/A',
          phone: '',
          email: '',
          wifiSsid: b.wifi_config?.ssid || '',
          geofenceRadius: b.location?.radius || 100,
          geofencingEnabled: true,
          location: { lat: b.location?.lat || 30.0, lng: b.location?.lng || 31.0 },
          employeeCount: 0
        }));
        setBranches(mappedBranches);

        // Map Employees
        if (empData) {
          const mappedEmployees: Employee[] = empData.map((e: any) => {
            const dept = mappedDepartments.find(d => d.id === e.department_id);
            return {
              id: e.id,
              name: `${e.first_name} ${e.last_name || ''}`.trim(),
              title: e.job_title || 'General',
              dep: dept ? dept.name : 'General',
              email: e.email,
              phone: e.phone,
              status: e.status,
              device: e.device_id || 'Not Paired',
              avatarUrl: e.avatar_url,
              basicSalary: e.basic_salary,
              hireDate: e.hire_date,
              documents: [],
              careerHistory: []
            };
          });
          setEmployees(mappedEmployees);
        }

        // Map Alerts
        if (alertsData) {
           const mappedAlerts: SecurityAlert[] = alertsData.map((a: any) => {
             const emp = empData?.find((e: any) => e.id === a.employee_id);
             const empName = emp ? `${emp.first_name} ${emp.last_name || ''}`.trim() : 'Unknown';
             
             return {
               id: a.id,
               employeeName: empName,
               companyName: 'TriPro',
               type: a.type,
               description: a.description,
               severity: a.severity as AlertSeverity,
               timestamp: new Date(a.created_at).toLocaleTimeString('ar-EG'),
               isRead: false,
               isResolved: a.is_resolved
             };
           });
           setAlerts(mappedAlerts);
        }

        if (notifsData) setNotifications(notifsData);
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
      } finally {
        if (!background) setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    refreshData();

    const interval = setInterval(() => {
      refreshData(true); // تحديث صامت في الخلفية
    }, 5 * 60 * 1000); // كل 5 دقائق

    return () => clearInterval(interval);
  }, [refreshData]);

  return (
    <DataContext.Provider value={{ employees, setEmployees, branches, setBranches, departments, setDepartments, alerts, setAlerts, notifications, setNotifications, refreshData, isLoading }}>
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
