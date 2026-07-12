# 🐛 راهنمای عیب‌یابی Leitner Box

---

## 🔍 چگونه بررسی کنید که سیستم درست کار می‌کند

### مرحله ۱: بررسی کارت‌های جدید
```javascript
// Console:
const data = JSON.parse(localStorage.getItem('ielts-collocation-leitner-state-v2'));
const today = new Date().toISOString().split('T')[0];
const econ = data.categoryStates['اقتصاد'];

// کارت‌های جدید امروز:
const newToday = Object.values(econ.cards)
  .filter(c => c.createdAt === today && c.box === 1);

console.log(`✓ کارت‌های جدید امروز: ${newToday.length}`);
// انتظار: 10
```

### مرحله ۲: بررسی Box 2 فردا
```javascript
// فردا:
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const box2Tomorrow = Object.values(econ.cards)
  .filter(c => c.box === 2 && c.nextReviewDate === tomorrowStr);

console.log(`✓ جعبه 2 فردا: ${box2Tomorrow.length}`);
// اگر امروز 5 کارت صحیح بود، باید 5 باشد
```

### مرحله ۳: بررسی استقلالیت دسته‌ها
```javascript
// هر دسته باید مستقل باشد:
Object.entries(data.categoryStates).forEach(([cat, state]) => {
  const totalCards = Object.keys(state.cards).length;
  const box1 = Object.values(state.cards).filter(c => c.box === 1).length;
  console.log(`${cat}: کل=${totalCards}, box1=${box1}`);
});
```

### مرحله ۴: بررسی ذخیره‌سازی
```javascript
// localStorage اصلاً ذخیره شده؟
const stored = localStorage.getItem('ielts-collocation-leitner-state-v2');
console.log(`✓ ذخیره شده: ${stored ? 'بله' : 'خیر'}`);
console.log(`✓ حجم: ${new Blob([stored]).size} bytes`);
```

---

## ⚠️ مشاکل و حل‌های آنها

### مشکل ۱: کارت‌های جدید کمتر از 10
```
دلیل:
□ کارت‌های دسته تمام شدند
□ روز قبل 10 کارت معرفی شدند

حل:
1. چک کنید: کارت‌های موجود > 10
2. اگر کم است، کارت‌های بیشتری اضافه کنید
3. یا: collocations.json را بررسی کنید
```

### مشکل ۲: کارت‌های دیروز امروز ظاهر نمی‌شوند
```
دلیل:
□ nextReviewDate اشتباه است
□ createdAt امروز است (نباید باشد)
□ box اشتباه است

حل:
// چک کنید:
const oldCards = Object.values(econ.cards)
  .filter(c => c.createdAt !== today && c.nextReviewDate <= today);
console.log(`آماده مرور: ${oldCards.length}`);
```

### مشکل ۳: دسته‌ها بر یکدیگر تأثیر می‌گذارند
```
دلیل:
□ category فیلد ندارد
□ داده‌های قدیمی (migration)

حل:
// داده‌های قدیمی حذف کنید:
localStorage.removeItem('ielts-collocation-leitner-state-v2');
// و صفحه refresh کنید
```

### مشکل ۴: کارت‌های بیشتر از 10 در Box 1
```
دلیل:
□ کارت‌های غلط بازگشت می‌آیند
□ نباید در شمارش 10 جدید حساب شوند

حل:
// آنها در داخل 10 هستند یا خارج؟
const newToday = Object.values(econ.cards)
  .filter(c => c.createdAt === today);
console.log(newToday.length); // باید 10

const allBox1 = Object.values(econ.cards)
  .filter(c => c.box === 1 && c.nextReviewDate <= today);
console.log(allBox1.length); // می‌تواند بیشتر از 10 باشد
```

### مشکل ۵: reviewCount اشتباه است
```
دلیل:
□ updateState نشد
□ localStorage save نشد

حل:
// بعد از پاسخ:
const card = econ.cards[cardId];
console.log(`reviewCount: ${card.reviewCount}`);
// باید 1+ بیشتر باشد
```

---

## 🧪 اسکریپت تست کامل

```javascript
// کپی و paste کنید در Console:

console.log('🧪 تست سیستم Leitner Box\n');

const data = JSON.parse(localStorage.getItem('ielts-collocation-leitner-state-v2'));
const today = new Date().toISOString().split('T')[0];

// تست ۱: کارت‌های جدید
console.log('✅ تست ۱: کارت‌های جدید');
Object.entries(data.categoryStates).forEach(([cat, state]) => {
  const newCards = Object.values(state.cards)
    .filter(c => c.createdAt === today && c.box === 1).length;
  console.log(`  ${cat}: ${newCards}/10`);
});

// تست ۲: صحت Box
console.log('\n✅ تست ۲: توزیع جعبه');
const econ = data.categoryStates['اقتصاد'];
for (let i = 1; i <= 5; i++) {
  const count = Object.values(econ.cards)
    .filter(c => c.box === i).length;
  console.log(`  جعبه ${i}: ${count}`);
}

// تست ۳: nextReviewDate
console.log('\n✅ تست ۳: تاریخ مراجعه بعدی');
const nextReviewDates = {};
Object.values(econ.cards).forEach(c => {
  nextReviewDates[c.nextReviewDate] = (nextReviewDates[c.nextReviewDate] || 0) + 1;
});
Object.entries(nextReviewDates)
  .sort()
  .forEach(([date, count]) => {
    console.log(`  ${date}: ${count} کارت`);
  });

// تست ۴: localStorage
console.log('\n✅ تست ۴: ذخیره‌سازی');
const size = new Blob([localStorage.getItem('ielts-collocation-leitner-state-v2')]).size;
console.log(`  حجم: ${(size / 1024).toFixed(2)} KB`);
console.log(`  streak: ${data.streak} روز`);

// تست ۵: استقلالیت
console.log('\n✅ تست ۵: استقلالیت دسته‌ها');
const categories = Object.keys(data.categoryStates).length;
console.log(`  تعداد دسته‌ها: ${categories}`);
const totalCards = Object.values(data.categoryStates)
  .reduce((sum, state) => sum + Object.keys(state.cards).length, 0);
console.log(`  کل کارت‌ها: ${totalCards}`);

console.log('\n✨ تست کامل شد!');
```

---

## 📱 تست با صفحات

### صفحه خانه:
- [ ] کارت جدید = 10
- [ ] آماده مرور = N
- [ ] مجموع = 10+N
- [ ] توزیع جعبه‌ها صحیح

### صفحه مرور:
- [ ] کارت‌های آماده ابتدا
- [ ] کارت‌های جدید بعداً
- [ ] پاسخ‌ها ثبت می‌شوند
- [ ] Box تغییر می‌کند

### صفحه دسته‌ها:
- [ ] تمام دسته‌ها نمایش می‌شوند
- [ ] توزیع برای هر دسته
- [ ] شروع مرور کار می‌کند

---

## 🔧 اصلاح مشاکل

### اگر کارت‌های نو ظاهر نمی‌شوند:
```javascript
// صفحه refresh کنید
location.reload();

// یا: داده قدیمی حذف کنید
localStorage.removeItem('ielts-collocation-leitner-state-v2');
```

### اگر Box اشتباه است:
```typescript
// leitnerAlgorithm.ts میں بررسی کنید:
const BOX_INTERVALS = {
  1: 0,   // ✓
  2: 1,   // ✓
  3: 3,   // ✓
  4: 7,   // ✓
  5: 14   // ✓
};
```

### اگر reviewCount اپدیت نمی‌شود:
```typescript
// App.tsx میں بررسی کنید:
// applyReviewResponse باید reviewCount++ کند
const nextCardState = applyReviewResponse(
  currentCardState,
  response,
  reviewedAt,
  today
);
// nextCardState.reviewCount باید +1 باشد
```

---

## 📊 سریع فیکس

| مشکل | فیکس |
|------|------|
| کارت نو نمی‌آید | `localStorage.clear()` + refresh |
| دسته‌ها مخلوط | کارت‌ها دارای `category` باشند |
| Box غلط | BOX_INTERVALS درست باشد |
| nextReviewDate غلط | فاصله‌ها درست حساب شوند |
| ذخیره نمی‌شود | `window.localStorage` به درستی؟ |

---

## ✅ نشانه‌های سلامت سیستم

```javascript
// اگر اینها true باشند، سیستم خوب است:

// ۱. هر روز 10 کارت جدید
newCards === 10

// ۲. Box 2 هر روز آماده
box2.length > 0

// ۳. createdAt صحیح
card.createdAt === today || card.createdAt < today

// ۴. nextReviewDate منطقی
card.nextReviewDate >= card.createdAt

// ۵. دسته‌ها مستقل
econ.cards !== env.cards

// ۶. localStorage کار می‌کند
localStorage.length > 0
```

---

**🎯 عیب‌یابی تمام شد! سیستم آماده است.** ✅
