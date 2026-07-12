/**
 * 🧪 راهنمای تست سیستم Leitner Box
 * 
 * برای بررسی کامل منطق Leitner Box
 */

// ============================================================================
// ۱. تست در DevTools Console
// ============================================================================

/*
قدم ۱: باز کردن DevTools
- F12 یا Ctrl+Shift+I

قدم ۲: رفتن به Console tab

قدم ۳: چک کردن داده های ذخیره شده
*/

// کد برای Console:
const savedData = JSON.parse(localStorage.getItem('ielts-collocation-leitner-state-v2'));
console.log('📊 وضعیت ذخیره شده:', savedData);
console.log('📚 دسته ها:', Object.keys(savedData.categoryStates));
console.log('📅 تاریخ آخرین Streak:', savedData.lastStreakDate);

// ============================================================================
// ۲. تست ۱: بررسی ۱۰ کارت جدید روزانه
// ============================================================================

/*
انتظار:
- هر روز ۱۰ کارت جدید در Box 1
- تمام کارت ها دارای createdAt = امروز
- تمام کارت ها دارای box = 1
- تمام کارت ها دارای nextReviewDate = امروز
*/

const today = new Date().toISOString().split('T')[0];
const econ = savedData.categoryStates['اقتصاد'];
const todayCards = Object.values(econ.cards).filter(card => card.createdAt === today);

console.log(`\n✅ تست ۱: ۱۰ کارت جدید روزانه`);
console.log(`کارت های امروز: ${todayCards.length} (انتظار: 10)`);
console.log(`تمام Box 1؟ ${todayCards.every(c => c.box === 1)}`);
console.log(`تمام nextReviewDate = امروز؟ ${todayCards.every(c => c.nextReviewDate === today)}`);

// ============================================================================
// ۳. تست ۲: بررسی استقلالیت دسته ها
// ============================================================================

/*
انتظار:
- هر دسته کارت های خودش را دارد
- دسته ها با هم تأثیر ندارند
*/

console.log(`\n✅ تست ۲: استقلالیت دسته ها`);
Object.entries(savedData.categoryStates).forEach(([category, state]) => {
  const cardsInCategory = Object.values(state.cards).length;
  const newCards = Object.values(state.cards).filter(c => c.createdAt === today).length;
  console.log(`${category}: ${cardsInCategory} کارت (${newCards} جدید امروز)`);
});

// ============================================================================
// ۴. تست ۳: بررسی توزیع جعبه ها
// ============================================================================

/*
انتظار:
- Box 1: کارت های جدید (به علاوه کارت های صحیح نشده)
- Box 2-5: کارت های در حال پیشرفت
- مجموع: همه کارت های دسته
*/

console.log(`\n✅ تست ۳: توزیع جعبه ها (دسته اقتصاد)`);
for (let box = 1; box <= 5; box++) {
  const boxCards = Object.values(econ.cards).filter(c => c.box === box);
  console.log(`جعبه ${box}: ${boxCards.length} کارت`);
}

const totalCards = Object.values(econ.cards).length;
console.log(`مجموع: ${totalCards} کارت`);

// ============================================================================
// ۵. تست ۴: بررسی فاصله مراجعه Box 2
// ============================================================================

/*
انتظار:
- کارت های Box 2 باید nextReviewDate = فردا باشند
- نه امروز، نه روز دیگر
*/

console.log(`\n✅ تست ۴: فاصله مراجعه Box 2`);
const box2Cards = Object.values(econ.cards).filter(c => c.box === 2);
console.log(`تعداد کارت های Box 2: ${box2Cards.length}`);

if (box2Cards.length > 0) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const correctSchedule = box2Cards.every(c => c.nextReviewDate === tomorrowStr);
  console.log(`تمام Box 2 برای فردا؟ ${correctSchedule}`);
  
  box2Cards.slice(0, 3).forEach(card => {
    console.log(`  - کارت ${card.id}: nextReviewDate = ${card.nextReviewDate}`);
  });
}

// ============================================================================
// ۶. تست ۵: بررسی ذخیره سازی
// ============================================================================

/*
انتظار:
- داده ها در localStorage ذخیره شده اند
- می توان صفحه را refresh کرد و داده ها برگردند
*/

console.log(`\n✅ تست ۵: ذخیره سازی`);
const storageSize = new Blob([localStorage.getItem('ielts-collocation-leitner-state-v2')]).size;
console.log(`حجم ذخیره شده: ${(storageSize / 1024).toFixed(2)} KB`);
console.log(`Streak: ${savedData.streak} روز`);
console.log(`آخرین تاریخ Streak: ${savedData.lastStreakDate}`);

// ============================================================================
// ۷. تست ۶: شمارش کارت های آماده مرور
// ============================================================================

/*
انتظار:
- کارت هایی که nextReviewDate <= امروز جاهز هستند
- بیشتر جدیدها را نشمارید
*/

console.log(`\n✅ تست ۶: کارت های آماده مرور`);
const readyCards = Object.values(econ.cards).filter(card => {
  return card.nextReviewDate <= today && card.createdAt !== today;
});
console.log(`کارت های آماده (غیر جدید): ${readyCards.length}`);

const totalReady = Object.values(econ.cards).filter(c => c.nextReviewDate <= today).length;
console.log(`کارت های آماده (شامل جدید): ${totalReady}`);

// ============================================================================
// ۸. تست ۷: محاکاه یک مراجعه
// ============================================================================

/*
انتظار:
- کارت از Box 1 → Box 2 حرکت کند (صحیح)
- یا Box 1 باقی بماند (غلط)
- یا نیمی فاصله (سخت)
*/

console.log(`\n✅ تست ۷: نتایج مراجعه (از history)`);
const history = savedData.reviewHistory.filter(h => h.category === 'اقتصاد').slice(0, 5);
history.forEach(entry => {
  console.log(`کارت ${entry.cardId}: ${entry.response} - ساعت ${entry.timestamp}`);
});

// ============================================================================
// ۹. تست ۸: بررسی کاملیت داده
// ============================================================================

/*
انتظار:
- تمام کارت ها دارای تمام فیلدها باشند
- هیچ کارتی null یا undefined نباشد
*/

console.log(`\n✅ تست ۸: تحقق داده ها`);
let isValid = true;
Object.entries(econ.cards).forEach(([id, card]) => {
  if (!card.id || !card.box || !card.createdAt || !card.nextReviewDate || card.reviewCount === undefined) {
    console.warn(`⚠️  کارت ${id} داده ناقصی دارد!`);
    isValid = false;
  }
});

if (isValid) {
  console.log(`✅ تمام کارت ها داده کامل دارند!`);
}

// ============================================================================
// ۱۰. تست ۹: آماده سازی برای محاکاه روز بعدی
// ============================================================================

console.log(`\n✅ تست ۹: چیزهایی برای بررسی در روز بعدی`);
console.log(`۱. اگر ۱۰ کارت جدید اضافه شدند؟`);
console.log(`۲. آیا کارت های Box 2 ظاهر شدند؟`);
console.log(`۳. آیا کارت های نیمه تکمیل شده Box 1 ظاهر شدند؟`);
console.log(`۴. آیا Streak افزایش یافت (اگر مرور کردند)؟`);
console.log(`۵. آیا localStorage همچنان داده ها دارد؟`);

// ============================================================================
// ۱۱. فرمان های مفید برای Console
// ============================================================================

console.log(`\n💡 فرمان های Console مفید:`);
console.log(`
// ریست کردن تمام داده ها:
localStorage.removeItem('ielts-collocation-leitner-state-v2');

// دیدن تمام دسته ها:
Object.keys(JSON.parse(localStorage.getItem('ielts-collocation-leitner-state-v2')).categoryStates)

// شمارش کل کارت ها:
Object.values(JSON.parse(localStorage.getItem('ielts-collocation-leitner-state-v2')).categoryStates)
  .reduce((sum, cat) => sum + Object.keys(cat.cards).length, 0)

// صادر کردن داده ها:
copy(JSON.parse(localStorage.getItem('ielts-collocation-leitner-state-v2')))
`);

// ============================================================================
// ۱۲. نقاط مهم چک کردن
// ============================================================================

console.log(`\n🔍 نقاط مهم برای بررسی:`);
console.log(`
✅ داده های صحیح:
- هر کارت یک ID منحصر به فرد دارد
- createdAt YYYY-MM-DD فرمت است
- nextReviewDate >= createdAt است
- reviewCount >= 0 است
- box بین 1-5 است
- category نام معتبر دسته است

⚠️  مشکلات احتمالی:
- کارت ها نباید nextReviewDate < createdAt داشته باشند
- کارت نباید دو بار در یک روز Box تغییر دهند
- nextReviewDate نباید در گذشته بسیار بعیدی باشد
`);

console.log(`\n✨ تست کامل! نتایج را بررسی کنید.`);
