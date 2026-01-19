import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { LanguageProvider } from './LanguageContext';

// Mock DataContext لتجنب استدعاء Supabase أثناء الاختبار
jest.mock('./DataContext', () => ({
  DataProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useData: () => ({
    alerts: [],
    setAlerts: jest.fn(),
  }),
}));

test('renders login screen initially', () => {
  render(<LanguageProvider><App /></LanguageProvider>);
  const loginButton = screen.getByText(/تسجيل الدخول/i);
  expect(loginButton).toBeInTheDocument();
});
