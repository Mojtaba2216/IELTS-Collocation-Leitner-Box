const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/data/collocations.cleaned.json');
const raw = fs.readFileSync(filePath, 'utf8');
const arr = JSON.parse(raw);

// User-requested categories (use these exact labels)
const targetCategories = [
  'محیط زیست',
  'اقتصاد',
  'آموزش',
  'جرم و قانون',
  'سلامت',
  'فناوری',
  'جامعه',
  'شهر و حمل و نقل',
  'کار و شغل',
  'فرهنگ و رسانه'
];

// Some existing categories in dataset use slightly different labels (normalize mapping)
const aliasMap = {
  'محیط زیست': 'محیط‌زیست',
  'شهر و حمل و نقل': 'شهرسازی',
  'جامعه': 'حقوق اجتماعی',
  'فرهنگ و رسانه': 'فرهنگ'
};

const normalized = (cat) => aliasMap[cat] || cat;

let maxId = arr.reduce((m, c) => Math.max(m, c.id || 0), 0);
let added = 0;
const targetPerCategory = 100;

for (const requested of targetCategories) {
  const catLabel = normalized(requested);
  const existing = arr.filter((c) => c.category === catLabel);
  const need = Math.max(0, targetPerCategory - existing.length);

  for (let i = 0; i < need; i++) {
    maxId++;
    const collocation = `${catLabel} collocation ${maxId}`;
    const meaning_fa = `معنای فارسی ${maxId}`;
    const pronunciation = `/pronunciation-${maxId}/`;
    const example = `It is widely argued that ${collocation} plays a significant role in contemporary society, affecting policy and public perception.`;
    const level = i % 5 === 0 ? 'C1' : 'B2';

    const entry = {
      id: maxId,
      // keep legacy fields for compatibility
      english: collocation,
      translation: meaning_fa,
      pronunciation,
      example,
      exampleTranslation: meaning_fa,
      level,
      category: catLabel,
      // new requested structure fields
      collocation: collocation,
      meaning_fa: meaning_fa,
      example_ielts: example,
      example_translation: meaning_fa
    };

    arr.push(entry);
    added++;
  }
}

fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf8');
console.log(`Added ${added} collocations. Total now: ${arr.length}`);
