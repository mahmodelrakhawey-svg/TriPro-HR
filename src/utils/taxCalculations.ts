export interface TaxBracket {
  limit: number;
  rate: number;
}

export interface TaxCalculationResult {
  socialInsuranceAmount: number;
  taxableIncome: number; // الشهري الخاضع للضريبة
  taxAmount: number;     // قيمة الضريبة الشهرية
  effectiveRate: number; // النسبة الفعلية (مثال: 5.4)
}

/**
 * دالة مشتركة لحساب ضريبة الدخل والتأمينات الاجتماعية المصرية للرواتب الشهرية.
 * متوافقة مع هيكل الشرائح الضريبية التدريجية وقانون الضرائب المصري.
 */
export function calculateEgyptianTax(
  grossSalary: number,
  socialInsuranceRate: number,
  personalExemption: number,
  brackets: TaxBracket[]
): TaxCalculationResult {
  if (grossSalary <= 0) {
    return {
      socialInsuranceAmount: 0,
      taxableIncome: 0,
      taxAmount: 0,
      effectiveRate: 0,
    };
  }

  // 1. حساب حصة الموظف في التأمينات الاجتماعية (تقديري من إجمالي الراتب)
  const socialInsuranceAmount = Math.round(grossSalary * socialInsuranceRate);
  
  // 2. وعاء الضريبة السنوي (بعد خصم التأمينات الاجتماعية)
  const annualGross = Math.max(0, (grossSalary - socialInsuranceAmount) * 12);
  
  // 3. خصم حد الإعفاء الشخصي السنوي للموظف
  const annualTaxable = Math.max(0, annualGross - (personalExemption * 12));

  let taxAccumulator = 0;
  let previousLimit = 0;
  let remainingIncome = annualTaxable;

  // 4. الحساب التدريجي للشرائح الضريبية
  for (const bracket of brackets) {
    const bracketRange = bracket.limit - previousLimit;
    if (bracketRange <= 0) continue;

    if (remainingIncome > bracketRange) {
      taxAccumulator += bracketRange * bracket.rate;
      remainingIncome -= bracketRange;
    } else {
      taxAccumulator += remainingIncome * bracket.rate;
      remainingIncome = 0;
      break;
    }
    previousLimit = bracket.limit;
  }

  // 5. الشريحة الأخيرة (ما زاد عن آخر حد معلن)
  if (remainingIncome > 0) {
    const lastBracket = brackets[brackets.length - 1];
    taxAccumulator += remainingIncome * (lastBracket ? lastBracket.rate : 0.25);
  }

  // 6. تحويل الأرقام السنوية لشهرية وتدويرها
  const taxAmount = Math.round(taxAccumulator / 12);
  const effectiveRate = grossSalary > 0 ? Math.round((taxAmount / grossSalary) * 1000) / 10 : 0;
  const taxableIncome = Math.round(annualTaxable / 12);

  return {
    socialInsuranceAmount,
    taxableIncome,
    taxAmount,
    effectiveRate,
  };
}
