from pathlib import Path
import re
import ast

text = Path('generate_json.py').read_text(encoding='utf-8')
pattern = re.compile(r'\{\s*"name": "([^"]+)",\s*"phrases": \[(.*?)\]\s*\}', re.S)

categories = []
for m in pattern.finditer(text):
    name = m.group(1)
    phrases_raw = m.group(2)
    phrases = [ast.literal_eval(item.strip()) for item in phrases_raw.split(',\n') if item.strip()]
    categories.append((name, phrases))

print('categories:', len(categories))
for name, phrases in categories:
    print(name, len(phrases))

all_phrases = []
for name, phrases in categories:
    for phrase in phrases:
        all_phrases.append((phrase, name))

from collections import Counter, defaultdict
counter = Counter(phrase for phrase, _ in all_phrases)
dups = {phrase: [name for p, name in all_phrases if p == phrase] for phrase, count in counter.items() if count > 1}
print('duplicates:', len(dups))
for phrase, names in sorted(dups.items()):
    print(phrase, names)
