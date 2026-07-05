import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BankAccountManagement from './BankAccountManagement';
import toast from 'react-hot-toast';
import { supabase } from './supabaseClient';

// 1. محاكاة DataContext لتوفير بيانات وهمية للموظفين
jest.mock('./DataContext', () => ({
  useData: () => ({
    employees: [
      { id: '1', name: 'محمد أحمد', title: 'مهندس برمجيات', email: 'mohamed@test.com', auth_id: 'test-user-id' },
      { id: '2', name: 'سارة علي', title: 'محاسبة', email: 'sara@test.com' }
    ],
    orgId: 'test-org-id',
  }),
}));

// 2. محاكاة Supabase لتجنب الاتصال بقاعدة البيانات الحقيقية أثناء الاختبار
jest.mock('./supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

// 3. محاكاة مكتبة التنبيهات (Toast)
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('BankAccountManagement Component', () => {
  const mockInsert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });

    // إعادة تعريف المحاكاة لكل اختبار لتلافي مسحها تلقائياً من قبل resetMocks
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { email: 'admin@test.com' } }
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => ({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [
            {
              employee_id: '1',
              bank_name: 'بنك مصر',
              account_number: '123456789012',
              iban: 'EG020009000112345678901234567',
              swift_code: 'BMISGEGCX',
              is_default: true,
              status: 'APPROVED'
            }
          ],
          error: null
        })
      }),
      insert: mockInsert,
      update: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockResolvedValue({ error: null })
    }));
  });

  // اختبار 1: التأكد من ظهور المكون والموظفين بشكل صحيح
  test('renders correctly and displays employees', async () => {
    render(<BankAccountManagement />);
    
    // التحقق من ظهور العنوان
    expect(screen.getByText(/إدارة حسابات البنوك/i)).toBeInTheDocument();
    
    // التحقق من ظهور الموظفين من البيانات الوهمية
    expect(screen.getByText('محمد أحمد')).toBeInTheDocument();
    expect(screen.getByText('سارة علي')).toBeInTheDocument();

    await waitFor(() => {});
  });

  // اختبار 2: التأكد من فتح النافذة عند الضغط على زر الإضافة/التحديث
  test('opens modal when clicking update or add button', async () => {
    render(<BankAccountManagement />);
    
    // الانتظار حتى يتم تحميل البيانات وعرض الحساب البنكي لـ محمد أحمد
    await screen.findByText('بنك مصر');

    // الموظف الثاني "سارة علي" ليس لديها حساب، فيظهر زر الإضافة
    const addButton = screen.getByText('إضافة حساب بنكي');
    fireEvent.click(addButton);
    
    // التحقق من ظهور حقول الإدخال في النافذة المنبثقة
    expect(screen.getByText(/اسم البنك \*/i)).toBeInTheDocument();
    expect(screen.getByText(/رقم الحساب \*/i)).toBeInTheDocument();

    await waitFor(() => {});
  });

  // اختبار 3: التحقق من صحة IBAN (Validation Test)
  test('validates IBAN format before saving', async () => {
    render(<BankAccountManagement />);
    
    // الانتظار حتى يتم تحميل البيانات وعرض الحساب البنكي
    await screen.findByText('بنك مصر');

    const addButton = screen.getByText('إضافة حساب بنكي');
    fireEvent.click(addButton);
    
    // ملء الحقول ببيانات (IBAN خاطئ)
    const bankSelect = screen.getByRole('combobox');
    fireEvent.change(bankSelect, { target: { value: 'البنك الأهلي المصري' } });

    const accInput = screen.getByPlaceholderText(/مثال: 0123/i);
    fireEvent.change(accInput, { target: { value: '123456789' } });

    const ibanInput = screen.getByPlaceholderText(/مثال: EG123/i);
    fireEvent.change(ibanInput, { target: { value: 'INVALID_IBAN_TEXT' } });
    
    // محاولة الحفظ
    const saveButton = screen.getByText(/حفظ البيانات/i);
    fireEvent.click(saveButton);
    
    // التحقق من استدعاء دالة الخطأ في Toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('صيغة IBAN غير صحيحة'));
    });
  });

  // اختبار 4: التحقق من حجب البيانات البنكية الحساسة افتراضياً
  test('masks IBAN and account number by default', async () => {
    render(<BankAccountManagement />);
    
    // الانتظار حتى يتم تحميل البيانات وعرض الحساب البنكي
    await screen.findByText('بنك مصر');

    // التحقق من ظهور القيمة المحجوبة للـ IBAN
    expect(screen.getByText(/EG\*\*/)).toBeInTheDocument();
    
    // رقم الحساب 123456789012 -> ******9012
    expect(screen.getByText(/\*\*\*\*\*\*9012/)).toBeInTheDocument();
    
    // التأكد من عدم ظهور البيانات الأصلية كاملة بصورة صريحة
    expect(screen.queryByText('EG020009000112345678901234567')).not.toBeInTheDocument();
    expect(screen.queryByText('123456789012')).not.toBeInTheDocument();
  });

  // اختبار 5: التحقق من كشف البيانات البنكية عند الضغط على زر العين وتدقيق الحدث أمنياً
  test('reveals bank info on eye click and logs audit event', async () => {
    render(<BankAccountManagement />);
    
    // الانتظار حتى يتم تحميل البيانات وعرض الحساب البنكي
    await screen.findByText('بنك مصر');

    // البحث عن أزرار العين عن طريق العنوان (title="إظهار")
    const eyeButtons = screen.getAllByTitle('إظهار');
    expect(eyeButtons.length).toBe(2); // زر للـ IBAN وزر لرقم الحساب
    
    // الضغط على زر العين للـ IBAN
    fireEvent.click(eyeButtons[0]);
    
    // التأكد من ظهور رقم الـ IBAN الأصلي كامل الحجم بعد انتهاء المهمة غير المتزامنة
    expect(await screen.findByText('EG020009000112345678901234567')).toBeInTheDocument();
    
    // التأكد من استدعاء إدراج حدث التدقيق الأمني في قاعدة البيانات
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'REVEAL_BANK_ACCOUNT_INFO',
        target_resource: 'employee_bank_accounts',
        details: expect.stringContaining('محمد أحمد')
      }));
    });
  });
});
