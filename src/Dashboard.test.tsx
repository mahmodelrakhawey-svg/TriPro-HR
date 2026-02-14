import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { LanguageProvider } from './LanguageContext';

// Mock DataContext to provide test data
jest.mock('./DataContext', () => ({
  useData: () => ({
    employees: [{ id: '1', name: 'Test Employee', title: 'Dev', hireDate: '2024-01-01' }],
    alerts: [],
    branches: [], // تمت الإضافة لمنع الانهيار
    announcements: [], // تمت الإضافة
    notifications: [], // تمت الإضافة
  }),
}));

test('renders dashboard stats correctly', () => {
  render(
    <LanguageProvider>
      <Dashboard />
    </LanguageProvider>
  );

  expect(screen.getByText(/لوحة التحكم الرئيسية/i)).toBeInTheDocument();
  expect(screen.getAllByText('1')[0]).toBeInTheDocument();
});
