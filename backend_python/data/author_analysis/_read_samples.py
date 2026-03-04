import json, random, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('../author_texts_for_analysis.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

posts = data['posts']
posts.sort(key=lambda p: p.get('date', ''))

period = sys.argv[1] if len(sys.argv) > 1 else 'early'

groups = {
    'early': [p for p in posts if p.get('date','')[:4] in ('2017','2018')],
    'mid1': [p for p in posts if p.get('date','')[:4] in ('2019','2020')],
    'mid2': [p for p in posts if p.get('date','')[:4] in ('2021','2022')],
    'late': [p for p in posts if p.get('date','')[:4] in ('2023','2024')],
}

random.seed(42)
group = groups.get(period, groups['early'])
sample = random.sample(group, min(30, len(group)))

for p in sample:
    txt = p.get('text', '')[:1200]
    print(f"[{p.get('date','')}]")
    print(txt)
    print('---END---')
