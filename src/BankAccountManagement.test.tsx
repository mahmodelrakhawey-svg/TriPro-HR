import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BankAccountManagement from './BankAccountManagement';
import toast from 'react-hot-toast';

// 1. محاكاة DataContext لتوفير بيانات وهمية للموظفين
jest.mock('./DataContext', () => ({
  useData: () => ({
    employees: [
      { id: '1', name: 'محمد أحمد', title: 'مهندس برمجيات', email: 'mohamed@test.com' },
      { id: '2', name: 'سارة علي', title: 'محاسبة', email: 'sara@test.com' }
    ],
    orgId: 'test-org-id',
  }),
}));

// 2. محاكاة Supabase لتجنب الاتصال بقاعدة البيانات الحقيقية أثناء الاختبار
jest.mock('./supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => Promise.resolve({ error: null }),
      delete: () => Promise.resolve({ error: null }),
    }),
  },
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
  // اختبار 1: التأكد من ظهور المكون والموظفين بشكل صحيح
  test('renders correctly and displays employees', async () => {
    render(<BankAccountManagement />);
    
    // التحقق من ظهور العنوان
    expect(screen.getByText(/إدارة حسابات البنوك/i)).toBeInTheDocument();
    
    // التحقق من ظهور الموظفين من البيانات الوهمية
    expect(screen.getByText('محمد أحمد')).toBeInTheDocument();
    expect(screen.getByText('سارة علي')).toBeInTheDocument();

    // الانتظار لتجنب تحذيرات act بسبب تحديث الحالة غير المتزامن
    await waitFor(() => {});
  });

  // اختبار 2: التأكد من فتح النافذة عند الضغط على زر الإضافة
  test('opens modal when clicking add account button', async () => {
    render(<BankAccountManagement />);
    
    // البحث عن زر الإضافة لأول موظف والضغط عليه
    const addButtons = screen.getAllByText(/إضافة حساب بنكي/i);
    fireEvent.click(addButtons[0]);
    
    // التحقق من ظهور حقول الإدخال في النافذة المنبثقة
    expect(screen.getByText(/اسم البنك \*/i)).toBeInTheDocument();
    expect(screen.getByText(/رقم الحساب \*/i)).toBeInTheDocument();

    await waitFor(() => {});
  });

  // اختبار 3: التحقق من صحة IBAN (Validation Test)
  test('validates IBAN format before saving', async () => {
    render(<BankAccountManagement />);
    
    // فتح المودال
    const addButtons = screen.getAllByText(/إضافة حساب بنكي/i);
    fireEvent.click(addButtons[0]);
    
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
});
