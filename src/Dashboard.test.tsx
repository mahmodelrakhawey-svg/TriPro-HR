import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { LanguageProvider } from './LanguageContext';

// Mock DataContext to provide test data
jest.mock('./DataContext', () => ({
  useData: () => ({
    employees: [{ id: '1', name: 'Test Employee', title: 'Dev', hireDate: '2024-01-01' }],
    alerts: [],
  }),
}));

test('renders dashboard stats correctly', () => {
  render(
    <LanguageProvider>
      <Dashboard />
    </LanguageProvider>
  );

  // التحقق من ظهور العنوان الرئيسي (باللغة العربية الافتراضية)
  expect(screen.getByText(/لوحة التحكم الرئيسية/i)).toBeInTheDocument();
  // التحقق من ظهور عدد الموظفين (1 حسب البيانات الوهمية أعلاه)
  // قد يظهر الرقم 1 في أكثر من مكان، لذا نستخدم getAllByText
  expect(screen.getAllByText('1')[0]).toBeInTheDocument();
});