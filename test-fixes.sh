#!/bin/bash
# اختبار سريع للتحقق من الإصلاحات

echo "🔍 التحقق من الإصلاحات..."
echo ""

# 1. التحقق من FinancialReconciliationView.tsx
echo "1️⃣  التحقق من FinancialReconciliationView.tsx..."
if grep -q "if (!employees || employees.length === 0)" src/FinancialReconciliationView.tsx; then
    echo "✅ تم العثور على فحص الموظفين"
else
    echo "❌ فشل الفحص"
fi

# 2. التحقق من PayrollBridgeView.tsx
echo ""
echo "2️⃣  التحقق من PayrollBridgeView.tsx..."
if grep -q "cleanupDummyData" src/PayrollBridgeView.tsx; then
    echo "✅ تم العثور على دالة حذف البيانات الوهمية"
else
    echo "❌ فشل الفحص"
fi

# 3. التحقق من استخدام basicSalary
echo ""
echo "3️⃣  التحقق من استخدام basicSalary..."
if grep -q "emp.basicSalary" src/FinancialReconciliationView.tsx; then
    echo "✅ تم استخدام basicSalary بشكل صحيح"
else
    echo "❌ فشل الفحص"
fi

# 4. التحقق من البناء
echo ""
echo "4️⃣  فحص البناء..."
if npm run build > /dev/null 2>&1; then
    echo "✅ البناء نجح"
else
    echo "❌ البناء فشل"
fi

echo ""
echo "🎉 انتهى الاختبار السريع"
