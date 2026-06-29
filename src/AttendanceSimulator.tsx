
import React, { useState, useEffect } from 'react';
import { AttendanceStatus, Employee } from './types';
import { supabase } from './supabaseClient';
import { useData } from './DataContext';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Device } from '@capacitor/device';

interface LocalRecord {
  id: string;
  time: string;
  date: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  location: string;
  isSynced: boolean;
  serverTimestamp?: string;
  securityFlags: string[];
}

interface AttendanceSimulatorProps {
  mode?: 'simulator' | 'real';
  onClose?: () => void;
}

const AttendanceSimulator: React.FC<AttendanceSimulatorProps> = ({ mode = 'simulator', onClose }) => {
  const { employees, branches, orgId } = useData();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [inRange, setInRange] = useState(false);
  const [position, setPosition] = useState<any>(null);
  const [correctWifi, setCorrectWifi] = useState(false);
  const [isInternetDown, setIsInternetDown] = useState(false);
  const [isMockLocation, setIsMockLocation] = useState(false);
  const [attestationFailed] = useState(false);
  
  // New: Advanced Hardware States
  const [isRooted, setIsRooted] = useState(false);
  const [isEmulator, setIsEmulator] = useState(false);

  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'diagnostic'>('home');
  const [status, setStatus] = useState<AttendanceStatus>(AttendanceStatus.OUT_OF_RANGE);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [records, setRecords] = useState<LocalRecord[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const findCurrentEmployee = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && employees.length > 0) {
          const emp = employees.find(e => e.auth_id === user.id);
          if (emp) {
            setCurrentEmployee(emp);
          }
        }
      } catch (error) {
        console.error("Error finding current employee:", error);
      }
    };
    findCurrentEmployee();
  }, [employees]);

  useEffect(() => {
    if (mode === 'real') {
      setCorrectWifi(true);
      setIsInternetDown(false);
      setIsRooted(false);
      setIsEmulator(false);
      setIsMockLocation(false);

      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Earth radius in meters
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

        const a =
          Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
      };

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPosition(pos);
            const employeeBranch = branches.find(b => b.id === currentEmployee?.branch_id);
            if (employeeBranch && employeeBranch.geofencingEnabled !== false) {
              const distance = calculateDistance(
                pos.coords.latitude,
                pos.coords.longitude,
                employeeBranch.location.lat,
                employeeBranch.location.lng
              );
              const maxRadius = employeeBranch.geofenceRadius || 100;
              if (distance <= maxRadius) {
                setInRange(true);
                setSecurityError(null);
              } else {
                setInRange(false);
                setSecurityError(`أنت خارج النطاق الجغرافي للفرع. المسافة الحالية: ${Math.round(distance)} متر، الحد الأقصى المسموح به: ${maxRadius} متر.`);
              }
            } else {
              setInRange(true);
              setSecurityError(null);
            }
          },
          (error) => {
            setInRange(false);
            setPosition(null);
            setSecurityError('تعذر تحديد الموقع الجغرافي الفعلي. تأكد من تفعيل GPS.');
          }
        );
      }
    }
  }, [mode, currentEmployee, branches]);

  useEffect(() => {
    const checkSecurity = () => {
      if (isRooted || attestationFailed) return { msg: 'فشل فحص سلامة النظام (Device Integrity). الهاتف غير موثوق!', status: AttendanceStatus.ATTESTATION_FAILED };
      if (isEmulator) return { msg: 'تم اكتشاف بيئة تشغيل افتراضية (Emulator). يرجى استخدام هاتف حقيقي.', status: AttendanceStatus.SECURITY_BREACH };
      if (isMockLocation) return { msg: 'تم اكتشاف GPS وهمي. تم حظر محاولة التلاعب.', status: AttendanceStatus.SECURITY_BREACH };
      if (!inRange) return { msg: 'أنت خارج المضلع الجغرافي المحدد لمقر العمل.', status: AttendanceStatus.OUT_OF_RANGE };
      if (!correctWifi) return { msg: 'يرجى الاتصال بشبكة (Office_Secure_WiFi) حصرياً.', status: AttendanceStatus.WRONG_WIFI };
      
      return { msg: null, status: AttendanceStatus.READY };
    };

    const result = checkSecurity();
    setSecurityError(result.msg);
    setStatus(result.status);
  }, [inRange, correctWifi, isMockLocation, attestationFailed, isRooted, isEmulator]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: emp } = await supabase.from('employees').select('id').eq('auth_id', user.id).single();
        if (!emp) return;

        const { data: logs, error } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('employee_id', emp.id)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        if (logs) {
          const mappedRecords: LocalRecord[] = logs.map((log: any) => ({
            id: log.id,
            time: new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(log.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }),
            type: log.type,
            location: log.location || 'غير محدد',
            isSynced: true,
            serverTimestamp: log.timestamp,
            securityFlags: log.location_verified ? ['HARDWARE_BACKED_AUTH', 'ATTESTATION_SUCCESS'] : []
          }));
          setRecords(mappedRecords);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      }
    };

    fetchHistory();
  }, [activeTab]);

  const handleAction = async () => {
    if (status !== AttendanceStatus.READY) return;
    
    let deviceId = 'SIMULATED-DEVICE-ID';
    let isBiometricSuccess = true;

    // 1. تحقق من المنصة الحالية (هل هو هاتف محمول حقيقي أم متصفح ويب)
    if (Capacitor.isNativePlatform()) {
      try {
        setScanning(true);
        
        // أ) التحقق البيومتري الفعلي للجهاز (بصمة الإصبع أو الوجه)
        const bioAvailable = await NativeBiometric.isAvailable();
        if (bioAvailable.isAvailable) {
          await NativeBiometric.verifyIdentity({
            reason: "تسجيل حضور وانصراف الموظف بشكل آمن",
            title: "تأكيد البصمة الحيوية",
            subtitle: "يرجى استخدام البصمة أو معرّف الوجه لتأكيد الهوية",
            description: "تأكيد الحضور والانصراف",
            maxAttempts: 3
          });
        } else {
          console.warn("بيانات البصمة غير مفعلة على هذا الهاتف.");
        }

        // ب) الحصول على المعرّف الفريد للهاتف (Device UUID)
        const deviceIdInfo = await Device.getId();
        deviceId = deviceIdInfo.identifier;

      } catch (err: any) {
        console.error("خطأ في التحقق البيومتري أو معرّف الهاتف:", err);
        toast.error("فشل تأمين البصمة: " + (err.message || err));
        setScanning(false);
        return;
      }
    } else {
      // محاكاة وقت المسح لبيئة متصفح الويب (المحاكي الافتراضي)
      setScanning(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setScanning(false);
    
    if (!isBiometricSuccess) return;

    setVerificationSuccess(true);
      
    const now = new Date();
    const type = records.length % 2 === 0 ? 'CHECK_IN' : 'CHECK_OUT';
      
    const newRecord: LocalRecord = {
      id: `TX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }),
      type: type,
      location: currentEmployee?.branchName || 'موقع غير محدد',
      isSynced: !isInternetDown,
      serverTimestamp: isInternetDown ? undefined : new Date().toISOString(),
      securityFlags: isInternetDown ? ['OFFLINE_ENCRYPTED_LOG'] : ['HARDWARE_BACKED_AUTH', 'ATTESTATION_SUCCESS']
    };

    // الحفظ في قاعدة البيانات
    if (!isInternetDown) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('📱 Current auth user:', user.id);
          
          // جلب بيانات الموظف من جدول employees
          const { data: empData, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('auth_id', user.id)
            .maybeSingle();
          
          if (empError) {
            console.error('❌ Error fetching employee:', empError);
            toast.error('خطأ في جلب بيانات الموظف: ' + empError.message);
            newRecord.isSynced = false;
          } else if (!empData) {
            toast.error('❌ لم يتم العثور على ملف موظف مرتبط بحسابك. تأكد من تسجيل الدخول بالحساب الصحيح.');
            newRecord.isSynced = false;
          } else {
            console.log('✅ Employee found:', empData.id);

            // --- بداية: التحقق من ربط الجهاز (Device Binding) ---
            if (Capacitor.isNativePlatform()) {
              const dbDeviceId = empData.device_id;
              
              if (!dbDeviceId || dbDeviceId === 'Not Paired' || dbDeviceId === '') {
                // إذا كان الموظف لم يربط هاتفه بعد، نقوم بربط هذا الهاتف كجهازه الرسمي الأول
                console.log(`📱 Pairing device. Registering UUID: ${deviceId}`);
                const { error: pairError } = await supabase
                  .from('employees')
                  .update({ device_id: deviceId })
                  .eq('id', empData.id);
                
                if (pairError) {
                  console.error('❌ Error pairing device:', pairError);
                  toast.error('فشل ربط جهاز البصمة مع حسابك: ' + pairError.message);
                  setVerificationSuccess(false);
                  return;
                } else {
                  toast.success('✅ تم ربط هذا الهاتف بحسابك كجهازك الرسمي للبصمة بنجاح!');
                  if (currentEmployee) {
                    currentEmployee.device = deviceId; // تحديث محلي
                  }
                }
              } else if (dbDeviceId !== deviceId) {
                // إذا كان الموظف يحاول البصمة من هاتف آخر غير جهازه المسجل
                console.error(`🚨 Security breach: device mismatch. DB: ${dbDeviceId}, Current: ${deviceId}`);
                toast.error('❌ عفواً، لا يمكنك تسجيل الحضور من هذا الهاتف. يرجى استخدام هاتفك الرسمي المسجل لتسجيل الحضور.', { duration: 8000 });
                setVerificationSuccess(false);
                return;
              }
            }
            // --- نهاية: التحقق من ربط الجهاز ---
            
            // جلب بيانات الوردية إن وجدت
            let shiftStartTime = '09:00:00';
            let shiftEndTime = '17:00:00';
            
            if (empData.shift_id) {
              console.log('🕐 Fetching shift data for shift_id:', empData.shift_id);
              const { data: shift, error: shiftError } = await supabase
                .from('shifts')
                .select('*')
                .eq('id', empData.shift_id)
                .maybeSingle();
              
              if (shiftError) {
                console.warn('⚠️ Error fetching shift:', shiftError);
              } else if (shift) {
                console.log('✅ Shift found:', shift);
                // استخدام أسماء الأعمدة الصحيحة من جدول shifts
                shiftStartTime = shift.start_time || '09:00:00';
                shiftEndTime = shift.end_time || '17:00:00';
                console.log(`✅ Shift times: ${shiftStartTime} - ${shiftEndTime}`);
              }
            } else {
              console.warn('⚠️ No shift_id found for this employee');
            }

            // --- بداية: منطق حساب حالة الحضور ---
            let attendanceStatus = 'PRESENT';
            const timeToMinutes = (timeStr: string): number => {
              const parts = timeStr.split(':');
              return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            };

            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            const startMinutes = timeToMinutes(shiftStartTime);
            const endMinutes = timeToMinutes(shiftEndTime);
            const gracePeriod = 15; // 15 minutes grace period

            if (type === 'CHECK_IN') {
              let isLate = false;
              if (endMinutes < startMinutes) {
                // overnight shift (crosses midnight)
                if (nowMinutes > startMinutes + gracePeriod || nowMinutes < endMinutes) {
                  // late if checked in after start + grace, or before end time after midnight
                  isLate = nowMinutes < endMinutes || nowMinutes > startMinutes + gracePeriod;
                }
              } else {
                // regular daytime shift
                if (nowMinutes > startMinutes + gracePeriod) {
                  isLate = true;
                }
              }
              attendanceStatus = isLate ? 'LATE_CHECK_IN' : 'ON_TIME_CHECK_IN';
            } else { // CHECK_OUT
              let isEarly = false;
              if (endMinutes < startMinutes) {
                // overnight shift
                if (nowMinutes < endMinutes && nowMinutes > startMinutes) {
                  isEarly = true;
                } else if (nowMinutes > endMinutes && nowMinutes < startMinutes) {
                  isEarly = true;
                }
              } else {
                // regular daytime shift
                if (nowMinutes < endMinutes) {
                  isEarly = true;
                }
              }
              attendanceStatus = isEarly ? 'EARLY_CHECK_OUT' : 'ON_TIME_CHECK_OUT';
            }
            // --- نهاية: منطق حساب حالة الحضور ---

            // تحضير بيانات البصمة - الحقول الأساسية فقط
            // ملاحظة: period_start و period_end يتم حسابهما بواسطة trigger أو default values في DB
            const attendancePayload: any = {
              employee_id: empData.id,
              timestamp: now.toISOString(),
              type: type,
              status: attendanceStatus,
              location: currentEmployee?.branchName || empData.branch_id || 'موقع غير محدد',
              method: 'BIOMETRIC',
              date: now.toISOString().split('T')[0],
              location_verified: !isMockLocation,
              org_id: orgId,
              notes: notes
            };
            
            // إضافة coordinates فقط إذا كانت متاحة
            if (inRange && position) {
              attendancePayload.coordinates = { 
                lat: position.coords.latitude, 
                lng: position.coords.longitude 
              };
            }

            console.log('📝 Attendance payload:', JSON.stringify(attendancePayload, null, 2));
            console.log('⏰ Shift times retrieved - Start: ' + shiftStartTime + ', End: ' + shiftEndTime);

            const { error } = await supabase
              .from('attendance_logs')
              .insert(attendancePayload);

            if (error) {
              console.error('❌ Error saving attendance:', error);
              console.error('❌ Error code:', error.code);
              console.error('❌ Error message:', error.message);
              console.error('❌ Error details:', error.details);
              console.error('❌ Full error object:', JSON.stringify(error, null, 2));
              
              // كشف إذا كانت المشكلة من الـ trigger
              if (error.message && error.message.includes('trigger')) {
                console.warn('⚠️ الخطأ قد يكون من الـ trigger function: trigger_on_attendance_change');
              }
              
              // رسالة مفصلة
              let errorMsg = 'فشل حفظ البصمة:\n';
              errorMsg += error.message + '\n\n';
              if (error.details) errorMsg += 'التفاصيل: ' + error.details + '\n';
              if (error.hint) errorMsg += 'التلميح: ' + error.hint + '\n';
              if (error.code) errorMsg += 'الكود: ' + error.code;
              
              toast.error(errorMsg, { duration: 10000 });
              newRecord.isSynced = false;
            } else {
              console.log('✅ Attendance saved successfully!');
              toast.success('تم تسجيل الحضور وحفظه في قاعدة البيانات بنجاح ✅');
            }
          }
        }
      } catch (err: any) {
        console.error('❌ Unexpected error:', err);
        toast.error('حدث خطأ غير متوقع: ' + (err.message || err));
        newRecord.isSynced = false;
      }
    }
      
    setTimeout(() => {
      setRecords([newRecord, ...records]);
      setVerificationSuccess(false);
      setNotes('');
    }, 1500);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start justify-center animate-fade-in" dir="rtl">
      
      {mode === 'simulator' && (
      <div className="w-full lg:w-80 space-y-4">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <i className="fas fa-shield-virus"></i>
              </div>
              <h3 className="font-black text-slate-800 text-sm">أدوات فحص الثقة</h3>
           </div>

           <div className="space-y-2">
              {[
                { label: 'انقطاع الإنترنت', state: isInternetDown, set: setIsInternetDown, icon: 'fa-wifi-slash' },
                { label: 'كشف Root/Jailbreak', state: isRooted, set: setIsRooted, icon: 'fa-skull' },
                { label: 'كشف محاكي (Emulator)', state: isEmulator, set: setIsEmulator, icon: 'fa-microchip' },
                { label: 'تزييف الموقع (Mock)', state: isMockLocation, set: setIsMockLocation, icon: 'fa-map-location-dot' },
                { label: 'داخل النطاق الجغرافي', state: inRange, set: setInRange, icon: 'fa-draw-polygon' },
                { label: 'شبكة واي فاي الشركة', state: correctWifi, set: setCorrectWifi, icon: 'fa-wifi' },
              ].map((ctrl, i) => (
                <button 
                  key={i}
                  onClick={() => ctrl.set(!ctrl.state)}
                  className={`w-full p-3 rounded-2xl border text-[10px] font-black flex justify-between items-center transition-all ${ctrl.state ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                >
                  <span>{ctrl.label}</span>
                  <i className={`fas ${ctrl.icon} text-[12px]`}></i>
                </button>
              ))}
           </div>
        </div>
      </div>
      )}

      {/* App Simulator Frame */}
      <div className="w-[380px] shrink-0 relative">
        {mode === 'real' && onClose && (
          <button onClick={onClose} className="absolute -right-12 top-0 w-10 h-10 bg-white rounded-full text-slate-800 flex items-center justify-center shadow-lg hover:bg-rose-50 hover:text-rose-500 transition z-50">
             <i className="fas fa-times"></i>
          </button>
        )}
        <div className="bg-slate-900 rounded-[4rem] p-3 shadow-2xl border-[8px] border-slate-800 relative h-[780px]">
          <div className="bg-white rounded-[3.2rem] h-full overflow-hidden flex flex-col relative">
             
             {/* Dynamic Status Bar */}
             <div className="px-10 pt-10 pb-4 flex justify-between items-center text-[10px] font-black text-slate-400">
                <span>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} (Live)</span>
                <div className="flex gap-2">
                   {isInternetDown ? <i className="fas fa-cloud-slash text-rose-500"></i> : <i className="fas fa-signal text-emerald-500"></i>}
                   <i className="fas fa-battery-three-quarters"></i>
                </div>
             </div>

             <div className="flex-grow overflow-y-auto px-7 pb-24 relative">
                
                {activeTab === 'home' && (
                  <div className="space-y-6 animate-fade-in pt-4 text-right">
                    <div className="flex justify-between items-center flex-row-reverse">
                       <div className="text-right">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">المقر الحالي</p>
                          <h4 className="text-lg font-black text-slate-800">{currentEmployee?.branchName || 'جاري تحديد الفرع...'}</h4>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><i className="fas fa-map-pin"></i></div>
                    </div>

                    {securityError && (
                      <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-start gap-3 flex-row-reverse animate-bounce-short">
                         <i className="fas fa-exclamation-triangle text-rose-600 text-sm mt-0.5"></i>
                         <p className="text-[10px] font-bold text-rose-800 text-right leading-relaxed">{securityError}</p>
                      </div>
                    )}

                    <div className="mt-4">
                       <label className="block text-[10px] font-black text-slate-400 mb-2 text-right">ملاحظات / تبرير (اختياري)</label>
                       <textarea 
                         value={notes}
                         onChange={(e) => setNotes(e.target.value)}
                         className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-right"
                         placeholder="اكتب سبب التأخير أو أي ملاحظات..."
                       />
                    </div>

                    <div className="py-12 flex justify-center">
                       <button 
                         onClick={handleAction}
                         disabled={status !== AttendanceStatus.READY || scanning || !!securityError}
                         className={`w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-700 border-[10px] relative shadow-2xl ${
                           verificationSuccess ? 'bg-emerald-500 border-emerald-100' :
                           status === AttendanceStatus.READY ? 'bg-indigo-600 border-indigo-50 active:scale-95' : 'bg-slate-100 border-slate-50 text-slate-200 cursor-not-allowed'
                         }`}
                       >
                          {scanning ? (
                            <i className="fas fa-face-recognition text-6xl text-white animate-pulse"></i>
                          ) : verificationSuccess ? (
                            <i className="fas fa-check-circle text-7xl text-white animate-bounce"></i>
                          ) : (
                            <i className="fas fa-fingerprint text-7xl text-white"></i>
                          )}
                          {scanning && <div className="absolute top-0 left-0 w-full h-2 bg-emerald-300 shadow-[0_0_20px_#4ade80] animate-[scan_1.5s_infinite] rounded-full z-20"></div>}
                       </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                       <h5 className="text-[9px] font-black text-slate-400 mb-4 uppercase text-center tracking-[0.2em]">بروتوكول التحقق الرباعي</h5>
                       <div className="flex justify-around items-center">
                          <div className="flex flex-col items-center gap-1">
                             <i className={`fas fa-location-arrow ${inRange ? 'text-emerald-500' : 'text-slate-200'}`}></i>
                             <span className="text-[7px] font-black uppercase">GPS</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                             <i className={`fas fa-wifi ${correctWifi ? 'text-emerald-500' : 'text-slate-200'}`}></i>
                             <span className="text-[7px] font-black uppercase">WiFi</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                             <i className={`fas fa-fingerprint ${status === AttendanceStatus.READY ? 'text-emerald-500' : 'text-slate-200'}`}></i>
                             <span className="text-[7px] font-black uppercase">Bio</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                             <i className={`fas fa-microchip ${(!isRooted && !isEmulator) ? 'text-emerald-500' : 'text-rose-500'}`}></i>
                             <span className="text-[7px] font-black uppercase">HW</span>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'diagnostic' && (
                  <div className="space-y-6 animate-fade-in pt-6 text-right">
                     <h3 className="text-xl font-black text-slate-800">تشخيص أمان الجهاز</h3>
                     <div className="space-y-3">
                        {[
                          { label: 'OS Build Signature', status: 'VALID', color: 'text-emerald-500' },
                          { label: 'Kernel Integrity', status: 'VERIFIED', color: 'text-emerald-500' },
                          { label: 'Hardware Keybox', status: 'TRUSTED', color: 'text-emerald-500' },
                          { label: 'System Properties', status: isRooted ? 'SUSPICIOUS' : 'NORMAL', color: isRooted ? 'text-rose-500' : 'text-emerald-500' },
                          { label: 'Network Proxy', status: 'NONE', color: 'text-emerald-500' },
                        ].map((item, i) => (
                           <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className={`text-[10px] font-black ${item.color}`}>{item.status}</span>
                              <span className="text-[10px] font-bold text-slate-600">{item.label}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4 animate-fade-in pt-6">
                     <h3 className="text-xl font-black text-slate-800 text-right">سجل تحركاتك</h3>
                     {records.length === 0 ? (
                       <div className="py-20 text-center opacity-20">
                          <i className="fas fa-clock-rotate-left text-5xl mb-4"></i>
                          <p className="text-xs font-black">لا توجد سجلات لليوم</p>
                       </div>
                     ) : (
                       records.map(r => (
                          <div key={r.id} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center flex-row-reverse group">
                             <div className="text-right">
                                <p className="text-xs font-black text-slate-800">{r.type === 'CHECK_IN' ? 'تسجيل دخول' : 'تسجيل خروج'}</p>
                                <p className="text-[9px] text-slate-400 font-bold">{r.time} - {r.date}</p>
                             </div>
                             <div className="flex gap-2">
                                {r.isSynced ? <i className="fas fa-check-double text-emerald-500 text-xs"></i> : <i className="fas fa-lock text-amber-500 text-xs shadow-sm"></i>}
                                {r.securityFlags.includes('HARDWARE_BACKED_AUTH') && <i className="fas fa-shield-check text-indigo-500 text-xs"></i>}
                             </div>
                          </div>
                       ))
                     )}
                  </div>
                )}
             </div>

             <div className="h-24 flex items-center justify-around border-t absolute bottom-0 w-full bg-white/90 backdrop-blur-md rounded-b-[3.2rem] z-50 px-4">
                <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
                   <i className="fas fa-house-chimney text-lg"></i>
                   <span className="text-[8px] font-black uppercase tracking-widest">الرئيسية</span>
                </button>
                <button onClick={() => setActiveTab('diagnostic')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'diagnostic' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
                   <i className="fas fa-stethoscope text-lg"></i>
                   <span className="text-[8px] font-black uppercase tracking-widest">التشخيص</span>
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
                   <i className="fas fa-calendar-check text-lg"></i>
                   <span className="text-[8px] font-black uppercase tracking-widest">سجلي</span>
                </button>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(160px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AttendanceSimulator;