export const AttendanceStatus = {
  IN_RANGE: 'IN_RANGE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  WRONG_WIFI: 'WRONG_WIFI',
  OUTSIDE_HOURS: 'OUTSIDE_HOURS',
  READY: 'READY',
  SECURITY_BREACH: 'SECURITY_BREACH',
  ATTESTATION_FAILED: 'ATTESTATION_FAILED'
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export const AlertSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];

export const LeaveStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LeaveStatus = typeof LeaveStatus[keyof typeof LeaveStatus];

export interface BrandingConfig {
  logoUrl: string;
  primaryColor: string;
  slogan: string;
  companyName: string;
}

export interface SecurityAlert {
  id: string;
  employeeName: string;
  companyName: string;
  type: string;
  description: string;
  severity: AlertSeverity;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
  aiInsight?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  managerName?: string;
  phone?: string;
  email?: string;
  wifiSsid: string;
  wifiBssid?: string;
  wifiEncryption?: string;
  geofenceRadius: number;
  geofencingEnabled?: boolean;
  employeeCount?: number;
  location: { lat: number; lng: number };
  polygonPoints?: { lat: number; lng: number }[];
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
  isOvernight: boolean;
  maxOvertimeHours?: number;
  minWorkHours?: number;
}

export interface MissionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  destination: string;
  location: { lat: number; lng: number; radius: number };
  date: string;
  startTime?: string;
  endTime?: string;
  status: LeaveStatus | 'IN_PROGRESS' | 'COMPLETED';
  requireQrVerification?: boolean;
  notes?: string;
}

export interface EmployeeDocument {
  id: string;
  type: 'ID' | 'PASSPORT' | 'WORK_PERMIT' | 'HEALTH_CERT';
  expiryDate: string;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  fileUrl?: string;
}

export interface IntegrityRecord {
  employeeId: string;
  employeeName: string;
  score: number;
  lastAssessment: string;
  deductions: { reason: string; points: number; date: string }[];
  bonusImpact: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended: boolean;
}

export interface Transaction {
  id: string;
  companyName: string;
  amount: number;
  date: string;
  status: string;
  method: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSecure: boolean;
  type: string;
  metadata?: any;
}

export interface BranchBudget {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  employeeCount: number;
  status: string;
  breakdown: {
    base: number;
    ot: number;
    bonuses: number;
    penalties: number;
  };
}

export interface Department {
  id: string;
  name: string;
  managerName: string;
  employeeCount: number;
  budget?: number;
}

export interface CareerEvent {
  id: string;
  date: string;
  type: 'Promotion' | 'Salary Increase' | 'Transfer' | 'Hiring' | 'Award' | 'Warning';
  title: string;
  details: string;
  change?: string;
}

export interface Employee {
  id: string;
  name: string;
  title: string;
  dep: string;
  device: string;
  status: string;
  avatarUrl?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  basicSalary?: number;
  hireDate?: string;
  documents?: EmployeeDocument[];
  careerHistory?: CareerEvent[];
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
}

export interface JobTitle {
  id: string;
  title: string;
  department?: string;
  description?: string;
}

export interface DocumentTypeDefinition {
  id: string;
  name: string;
  isRequired: boolean;
  description?: string;
  issuingAuthority?: string;
  defaultValidityDays?: number;
  extractionCost?: number;
}
export interface CompanyPolicy {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}
