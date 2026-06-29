import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Employee, Branch, Department, SecurityAlert, AlertSeverity, Announcement, Shift } from './types';
import { supabase } from './supabaseClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
}

interface DataContextType {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  alerts: SecurityAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<SecurityAlert[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  refreshData: (background?: boolean) => Promise<void>;
  isLoading: boolean;
  userPermissions: string[];
  hasPermission: (permission: string) => boolean;
  orgId: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // البيانات الأولية المشتركة (Single Source of Truth)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  const refreshData = useCallback(async (background = false) => {
      if (!background) setIsLoading(true);
      
      // ملاحظة للأداء: تم تحويل طلبات جلب البيانات المتعددة من متسلسلة إلى متوازية
      // باستخدام Promise.all لتقليل وقت التحميل الأولي للتطبيق بشكل كبير.

      try {
        // 0. Fetch User Permissions
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: emp } = await supabase.from('employees').select('role, org_id').eq('auth_id', user.id).maybeSingle();
          if (emp?.role) {
            if (emp.org_id) setOrgId(emp.org_id);
            if (emp.role === 'admin') {
              setUserPermissions(['ALL_ACCESS']);
            } else {
              const { data: roleData } = await supabase.from('roles').select('permissions').eq('name', emp.role).maybeSingle();
              setUserPermissions(roleData?.permissions || []);
            }
          }
        }

        // تنفيذ جميع طلبات جلب البيانات بشكل متوازٍ
        const [
          { data: empData, error: empError },
          { data: deptData, error: deptError },
          { data: branchData, error: branchError },
          { data: shiftsData, error: shiftsError },
          { data: alertsData, error: alertsError },
          { data: notifsData, error: notifsError },
          { data: announcementsData, error: announcementsError }
        ] = await Promise.all([
          supabase.from('employees').select('*'),
          supabase.from('departments').select('*'),
          supabase.from('branches').select('*'),
          supabase.from('shifts').select('*'),
          supabase.from('security_alerts').select('*').order('created_at', { ascending: false }),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }),
          supabase.from('announcements').select('*').eq('is_active', true)
        ]);

        // التحقق من الأخطاء بعد اكتمال جميع الطلبات
        if (empError) throw new Error(`Employees Error: ${empError.message}`);
        if (deptError) throw new Error(`Departments Error: ${deptError.message}`);
        if (branchError) throw new Error(`Branches Error: ${branchError.message}`);
        if (shiftsError) throw new Error(`Shifts Error: ${shiftsError.message}`);
        if (alertsError) throw new Error(`Alerts Error: ${alertsError.message}`);
        if (notifsError) throw new Error(`Notifications Error: ${notifsError.message}`);
        if (announcementsError) console.warn('Announcements fetch warning:', announcementsError.message);

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
          geofencingEnabled: b.location?.geofencingEnabled !== false,
          location: { lat: b.location?.lat || 30.0, lng: b.location?.lng || 31.0 },
          employeeCount: 0
        }));
        setBranches(mappedBranches);

        if (shiftsData) setShifts(shiftsData);

        // Map Employees
        if (empData) {
          const mappedEmployees: Employee[] = empData.map((e: any) => {
            const dept = mappedDepartments.find(d => d.id === e.department_id);
            const branch = mappedBranches.find(b => b.id === e.branch_id);
            return {
              id: e.id,
              name: `${e.first_name} ${e.last_name || ''}`.trim(),
              title: e.job_title || 'General',
              dep: dept ? dept.name : 'General',
              branchName: branch ? branch.name : 'غير محدد',
              email: e.email,
              phone: e.phone,
              status: e.status,
              device: e.device_id || 'Not Paired',
              avatarUrl: e.avatar_url,
              basicSalary: e.basic_salary,
              hireDate: e.hire_date,
              nationalId: e.national_id,
              documents: [],
              careerHistory: [],
              role: e.role,
              auth_id: e.auth_id,
              shift_id: e.shift_id, // Ensure this column exists in your DB or is handled
              branch_id: e.branch_id,
              manager_id: e.manager_id
            } as any;
          });
          setEmployees(mappedEmployees);
        }

        // Map Alerts
        if (alertsData) {
           const mappedAlerts: SecurityAlert[] = alertsData.map((a: any) => {
             const emp = empData?.find((e: any) => e.id === a.employee_id);
             const empName = emp ? `${emp.first_name} ${emp.last_name || ''}`.trim() : 'Unknown';
             
             let timestampStr = 'N/A';
             try {
               timestampStr = a.created_at ? new Date(a.created_at).toLocaleTimeString('ar-EG') : 'N/A';
             } catch (e) {
               console.error('Invalid date in alert:', a);
             }

             return {
               id: a.id,
               employeeName: empName,
               companyName: 'TriPro',
               type: a.type,
               description: a.description,
               severity: a.severity as AlertSeverity,
               timestamp: timestampStr,
               isRead: false,
               isResolved: a.is_resolved,
               createdAt: a.created_at // إضافة تاريخ الإنشاء للفلترة
             } as any;
           });
           setAlerts(mappedAlerts);
        }

        if (notifsData) setNotifications(notifsData);
        
        if (announcementsData) {
          const now = new Date();
          const validAnnouncements = announcementsData.filter((a: any) => {
            return !a.expires_at || new Date(a.expires_at) > now;
          });
          setAnnouncements(validAnnouncements);
        }

      } catch (err) {
        console.error('Error connecting to Supabase:', err);
      } finally {
        if (!background) setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    refreshData();

    // Realtime Subscription for Notifications
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          
          // Play Alert Sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});

          // Show Browser Notification
          if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
            new window.Notification(newNotif.title, { body: newNotif.message });
          }
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      refreshData(true); // تحديث صامت في الخلفية
    }, 5 * 60 * 1000); // كل 5 دقائق

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  const hasPermission = (permission: string) => {
    if (userPermissions.includes('ALL_ACCESS')) return true;
    return userPermissions.includes(permission);
  };

  return (
    <DataContext.Provider value={{ employees, setEmployees, branches, setBranches, departments, setDepartments, shifts, setShifts, alerts, setAlerts, notifications, setNotifications, announcements, setAnnouncements, refreshData, isLoading, userPermissions, hasPermission, orgId }}>
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
