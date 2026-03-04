import json, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('../author_texts_for_analysis.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

posts = data['posts']
posts.sort(key=lambda p: p.get('date', ''))

# Search for keywords
keywords = sys.argv[1].lower().split(',') if len(sys.argv) > 1 else ['ценност']

found = []
for p in posts:
    txt = p.get('text', '').lower()
    if any(k in txt for k in keywords):
        found.append(p)

print(f"Found {len(found)} posts matching {keywords}")
for p in found[:25]:
    txt = p.get('text', '')[:1000]
    print(f"\n[{p.get('date','')}]")
    print(txt)
    print('---END---')
