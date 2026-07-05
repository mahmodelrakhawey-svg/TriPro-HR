import { calculateEgyptianTax, TaxBracket } from './taxCalculations';

describe('Egyptian Tax Calculation Utility', () => {
  const defaultBrackets: TaxBracket[] = [
    { limit: 21000, rate: 0.0 },
    { limit: 30000, rate: 0.025 },
    { limit: 45000, rate: 0.1 },
    { limit: 60000, rate: 0.15 },
    { limit: 200000, rate: 0.2 },
    { limit: 400000, rate: 0.225 },
    { limit: 100000000, rate: 0.25 }
  ];

  test('should return zeros for zero or negative gross salary', () => {
    const resultZero = calculateEgyptianTax(0, 0.11, 2000, defaultBrackets);
    expect(resultZero.socialInsuranceAmount).toBe(0);
    expect(resultZero.taxAmount).toBe(0);
    expect(resultZero.taxableIncome).toBe(0);
    expect(resultZero.effectiveRate).toBe(0);

    const resultNegative = calculateEgyptianTax(-5000, 0.11, 2000, defaultBrackets);
    expect(resultNegative.taxAmount).toBe(0);
  });

  test('should exempt salaries below or at the exemption threshold', () => {
    // راتب شهري 2000 ج.م -> سنوي 24000 ج.م.
    // بعد خصم التأمينات الاجتماعية (11%)، يقل الراتب ولا يصل لحد الخضوع للضريبة بعد خصم الإعفاء الشخصي.
    const result = calculateEgyptianTax(2000, 0.11, 2000, defaultBrackets);
    expect(result.socialInsuranceAmount).toBe(220); // 2000 * 0.11
    expect(result.taxAmount).toBe(0);
  });

  test('should calculate progressive tax correctly for a salary in middle brackets (6000 EGP)', () => {
    // تفاصيل الحساب المتوقع لـ 6000 ج.م:
    // التأمينات: 6000 * 0.11 = 660 ج.م
    // الإجمالي الخاضع للضريبة السنوي: (6000 - 660) * 12 = 64080 ج.م
    // بعد خصم الإعفاء الشخصي السنوي: 64080 - 24000 = 40080 ج.م
    // الشرائح:
    // 1. شريحة 0% (حتى 21000): 21000 * 0 = 0 ج.م. متبقي 19080 ج.م
    // 2. شريحة 2.5% (من 21000 إلى 30000): مدى الشريحة 9000 * 0.025 = 225 ج.م. متبقي 10080 ج.م
    // 3. شريحة 10% (من 30000 إلى 45000): متبقي 10080 * 0.10 = 1008 ج.م
    // مجموع الضريبة السنوية: 0 + 225 + 1008 = 1233 ج.م
    // الضريبة الشهرية: 1233 / 12 = 102.75 ج.م (تقرب إلى 103)
    const result = calculateEgyptianTax(6000, 0.11, 2000, defaultBrackets);
    expect(result.socialInsuranceAmount).toBe(660);
    expect(result.taxAmount).toBe(103);
    expect(result.taxableIncome).toBe(Math.round(40080 / 12)); // 3340
  });

  test('should calculate progressive tax correctly for a high salary (30000 EGP)', () => {
    // التأمينات: 30000 * 0.11 = 3300 ج.م
    // إجمالي سنوي: (30000 - 3300) * 12 = 320400 ج.م
    // بعد الإعفاء السنوي: 320400 - 24000 = 296400 ج.م
    // الشرائح:
    // 1. شريحة 0% (21000): 0 ج.م
    // 2. شريحة 2.5% (9000): 225 ج.م
    // 3. شريحة 10% (15000): 1500 ج.م
    // 4. شريحة 15% (15000): 2250 ج.م
    // 5. شريحة 20% (140000): 140000 * 0.20 = 28000 ج.م (المدى من 60ألف لـ 200ألف)
    // 6. شريحة 22.5% (متبقي من 296400 بعد خصم 200000 = 96400): 96400 * 0.225 = 21690 ج.م
    // إجمالي الضرائب السنوية: 0 + 225 + 1500 + 2250 + 28000 + 21690 = 53665 ج.م
    // الضريبة الشهرية: 53665 / 12 = 4472.08 ج.م (تقرب إلى 4472)
    const result = calculateEgyptianTax(30000, 0.11, 2000, defaultBrackets);
    expect(result.socialInsuranceAmount).toBe(3300);
    expect(result.taxAmount).toBe(4472);
  });
});
