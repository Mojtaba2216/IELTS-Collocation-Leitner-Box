## 🎓 نظام Leitner Box - مرجع کامل

سیستم Leitner Box برای یادگیری کارآمد کالوکیشن‌های IELTS بازنویسی شده است.

---

## 📚 راهنماها

### 🚀 **برای شروع:**
👉 [QUICK_START.fa.md](QUICK_START.fa.md) - شروع سریع (5 دقیقه)

### 🔧 **برای توسعه‌دهندگان:**
👉 [LEITNER_BOX_FIXES.md](LEITNER_BOX_FIXES.md) - توضیح مشاکل و حل‌ها

### 📊 **برای درک الگوریتم:**
👉 [SCHEDULING_DIAGRAM.fa.md](SCHEDULING_DIAGRAM.fa.md) - نمودارها و مثال‌های تفصیلی

### 📝 **خلاصه تغییرات:**
👉 [CHANGES_SUMMARY.fa.md](CHANGES_SUMMARY.fa.md) - فایل‌های اصلاح شده و چرا

### ✅ **تحقق:**
👉 [VERIFICATION_CHECKLIST.fa.md](VERIFICATION_CHECKLIST.fa.md) - لیست کامل اصلاح‌ها

### 🧪 **تست:**
👉 [TEST_CONSOLE_COMMANDS.js](TEST_CONSOLE_COMMANDS.js) - فرمان‌های Console برای تست

---

## 🎯 مشاکل حل شده

| # | مشکل | حل |
|---|------|-----|
| 1 | بعضی جعبه‌ها کمتر از 10 کارت دارند | ✅ دقیقاً 10 کارت روزانه برای هر دسته |
| 2 | کارت‌های روز قبل در روز بعد ظاهر نمی‌شوند | ✅ محاسبه صحیح `nextReviewDate` |
| 3 | فواصل جعبه اشتباه | ✅ Box intervals: 0, 1, 3, 7, 14 روز |
| 4 | دسته‌ها بر یکدیگر تأثیر می‌گذارند | ✅ استقلالیت کامل هر دسته |
| 5 | داده‌ها ذخیره نمی‌شوند | ✅ localStorage حفظ می‌کند |
| 6 | نام فیلدها نامشخص | ✅ فیلدهای واضح و منسجم |

---

## 📁 فایل‌های تغییر یافته

```
src/
├─ types.ts                          ✏️ ساختار داده اصلاح شد
├─ App.tsx                           ✏️ فیلدهای کارت اصلاح شدند
└─ utils/
   ├─ leitnerAlgorithm.ts            ✏️ الگوریتم کامل بازنویسی
   ├─ leitnerAlgorithm.test.ts       ✨ فایل تست جدید
   └─ storage.ts                     ✏️ اعتبارسنجی بهبود شد

/
├─ LEITNER_BOX_FIXES.md             ✨ توثیق کامل
├─ QUICK_START.fa.md                ✨ راهنمای سریع
├─ SCHEDULING_DIAGRAM.fa.md         ✨ نمودارها
├─ CHANGES_SUMMARY.fa.md            ✨ خلاصه تغییرات
├─ VERIFICATION_CHECKLIST.fa.md     ✨ لیست بررسی
└─ TEST_CONSOLE_COMMANDS.js         ✨ فرمان‌های تست
```

---

## 🧩 ساختار داده (اصلاح شده)

```typescript
ReviewCardState {
  id: number;              // معرف کارت
  category: string;        // ✅ جدید: فئة کارت
  box: 1 | 2 | 3 | 4 | 5; // صندوق فعلی
  createdAt: string;       // تاریخ اضافه شدن
  nextReviewDate: string;  // ✅ جدید: تاریخ مراجعه بعدی
  lastReviewedDate: string;// ✅ جدید: آخرین مراجعه
  reviewCount: number;     // تعداد مرات مراجعه
}
```

---

## 📅 جدول Box

```
Box 1: 0 روز (مراجعه امروز)
Box 2: 1 روز بعد
Box 3: 3 روز بعد
Box 4: 7 روز بعد
Box 5: 14 روز بعد (تسلط کامل)
```

---

## ⚡ نحوه کار

### روز اول:
```
صبح: 10 کارت جدید → Box 1
بعد مرور: 
  ✅ صحیح → Box 2 (فردا)
  😐 سخت → Box 1 (بعد از 12 ساعت)
  ❌ غلط → Box 1 (امروز)
```

### روز دوم:
```
صبح:
  - 10 کارت جدید → Box 1 ✨
  - 5 کارت از Box 2 (آماده امروز)
  = مجموع: 15 کارت

ترتیب مرور:
  1. کارت‌های آماده (Box 2)
  2. کارت‌های جدید (Box 1)
```

---

## 🧪 تست سریع

### Console:
```javascript
// چک کردن کارت‌های جدید امروز
const data = JSON.parse(localStorage.getItem('ielts-collocation-leitner-state-v2'));
const today = new Date().toISOString().split('T')[0];
const newCards = Object.values(data.categoryStates['اقتصاد'].cards)
  .filter(c => c.createdAt === today).length;
console.log(`کارت‌های جدید: ${newCards}`); // باید 10 باشد
```

### محاکاه روز:
```typescript
import { simulateNextDay } from './src/utils/leitnerAlgorithm';

simulateNextDay(); // یک روز جلو ببرید
// اکنون ببینید:
// - 10 کارت جدید؟
// - کارت‌های Box 2 از دیروز؟
```

---

## 📱 صفحات

### صفحه خانه
- نمایش: کارت جدید (10) + آماده مرور
- توزیع جعبه‌ها (1-5)
- انتخاب دسته

### صفحه مرور
- کارت‌های آماده ابتدا
- کارت‌های جدید بعداً
- ثبت پاسخ (✅/😐/❌)

### صفحه دسته‌ها
- تمام دسته‌ها
- توزیع جعبه برای هر دسته
- شروع مرور

---

## ✨ ویژگی‌های جدید

- ✅ **استقلالیت کامل** - هر دسته حالت خودش را دارد
- ✅ **۱۰ کارت روزانه** - دقیق و منظم
- ✅ **محاکاه روز** - برای تست (simulateNextDay)
- ✅ **ذخیره دائم** - localStorage
- ✅ **توثیق کامل** - راهنماها و مثال‌ها

---

## 🛠️ نصب و اجرا

```bash
# نصب وابستگی‌ها:
npm install

# اجرای توسعه:
npm run dev

# ساخت برای تولید:
npm run build
```

---

## 📞 سؤالات متداول

### Q: چگونه بفهمم کارت‌ها درست کار می‌کنند؟
A: [SCHEDULING_DIAGRAM.fa.md](SCHEDULING_DIAGRAM.fa.md) و [TEST_CONSOLE_COMMANDS.js](TEST_CONSOLE_COMMANDS.js) را ببینید.

### Q: اگر داده‌های قدیمی دارم چه کار کنم؟
A: storage.ts به طور خودکار مهاجر می‌کند. البته بهتر است اطلاعات قدیمی را ریست کنید.

### Q: چگونه یک دسته جدید اضافه کنم؟
A: دسته‌ها از collocations.json خوانده می‌شوند. App.tsx به طور خودکار پیدا می‌کند.

### Q: آیا می‌توانم فواصل Box را تغییر دهم؟
A: بله، BOX_INTERVALS را در leitnerAlgorithm.ts تغییر دهید.

### Q: داده‌ها کجا ذخیره می‌شوند؟
A: localStorage در کلید `ielts-collocation-leitner-state-v2`

---

## 🎯 اگام بعدی

1. **بررسی**: [VERIFICATION_CHECKLIST.fa.md](VERIFICATION_CHECKLIST.fa.md)
2. **درک**: [SCHEDULING_DIAGRAM.fa.md](SCHEDULING_DIAGRAM.fa.md)
3. **تست**: [TEST_CONSOLE_COMMANDS.js](TEST_CONSOLE_COMMANDS.js)
4. **اجرا**: `npm run dev`

---

## ✅ وضعیت

- ✅ کد: کامل و تست شده
- ✅ توثیق: کامل
- ✅ فیلدهای داده: صحیح
- ✅ الگوریتم: اصلاح شده
- ✅ ذخیره سازی: کار می‌کند
- ✅ بدون خطای compile

---

**🚀 سیستم آماده است!**

شروع کنید: `npm run dev`
