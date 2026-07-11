from pathlib import Path
import re
import ast
from collections import Counter

text = Path('generate_json.py').read_text(encoding='utf-8')
pattern = re.compile(r'{\s*"name": "([^"]+)",\s*"phrases": \[(.*?)\]\s*}', re.S)

categories = []
for m in pattern.finditer(text):
    name = m.group(1)
    phrases_raw = m.group(2)
    phrases = [ast.literal_eval(item.strip()) for item in phrases_raw.split(',\n') if item.strip()]
    categories.append((name, phrases))

print('categories:', len(categories))
for name, phrases in categories:
    print(name, len(phrases))

all_phrases = [phrase for _, phrases in categories for phrase in phrases]
counter = Counter(all_phrases)
dups = [phrase for phrase, count in counter.items() if count > 1]
print('duplicates:', len(dups))
for phrase in dups:
    print(phrase, [name for name, phrases in categories if phrase in phrases])
print('total:', len(all_phrases))
