"""Quantitative analysis of author's writing style."""
import json
import re
from collections import Counter

with open(r"c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python\data\author_texts_for_analysis.json", "r", encoding="utf-8") as f:
    data = json.load(f)

posts = data["posts"]
texts = [p["text"] for p in posts if p.get("text")]

# --- Post length stats ---
lengths_chars = [len(t) for t in texts]
lengths_words = [len(t.split()) for t in texts]
avg_chars = sum(lengths_chars) / len(lengths_chars)
avg_words = sum(lengths_words) / len(lengths_words)
sorted_chars = sorted(lengths_chars)
median_chars = sorted_chars[len(sorted_chars)//2]
sorted_words = sorted(lengths_words)
median_words = sorted_words[len(sorted_words)//2]

print(f"=== POST LENGTH ===")
print(f"Total posts: {len(texts)}")
print(f"Avg chars: {avg_chars:.0f}, median: {median_chars}")
print(f"Avg words: {avg_words:.0f}, median: {median_words}")
print(f"Min words: {min(lengths_words)}, Max words: {max(lengths_words)}")

# Length distribution
short = sum(1 for w in lengths_words if w < 30)
medium = sum(1 for w in lengths_words if 30 <= w < 100)
long = sum(1 for w in lengths_words if 100 <= w < 300)
very_long = sum(1 for w in lengths_words if w >= 300)
print(f"Short (<30w): {short} ({short/len(texts)*100:.1f}%)")
print(f"Medium (30-100w): {medium} ({medium/len(texts)*100:.1f}%)")
print(f"Long (100-300w): {long} ({long/len(texts)*100:.1f}%)")
print(f"Very long (300+w): {very_long} ({very_long/len(texts)*100:.1f}%)")

# --- "День XXX" pattern ---
day_pattern = re.compile(r'^День\s+\d+', re.MULTILINE)
day_posts = sum(1 for t in texts if day_pattern.search(t))
print(f"\n=== DAY PATTERN ===")
print(f"Posts starting with 'День N': {day_posts} ({day_posts/len(texts)*100:.1f}%)")

# --- Opening patterns ---
print(f"\n=== OPENING PATTERNS ===")
openers = Counter()
for t in texts:
    first_line = t.strip().split('\n')[0].strip()
    if re.match(r'^День\s+\d+', first_line):
        openers["День N."] += 1
    elif first_line.startswith("ПЕРЕПОСТ"):
        openers["ПЕРЕПОСТ"] += 1
    elif first_line.startswith("#"):
        openers["Хэштег"] += 1
    elif re.match(r'^[🔻🔥✌💡😁🤤⚡👉]', first_line):
        openers["Эмодзи"] += 1
    elif first_line.endswith("?"):
        openers["Вопрос"] += 1
    else:
        openers["Другое"] += 1
for k, v in openers.most_common():
    print(f"  {k}: {v} ({v/len(texts)*100:.1f}%)")

# --- Closing patterns ---
print(f"\n=== CLOSING PATTERNS ===")
closers = Counter()
for t in texts:
    last_lines = t.strip().split('\n')
    last = last_lines[-1].strip() if last_lines else ""
    if re.search(r'[?？]$', last) or re.search(r'[?？]\)?$', last):
        closers["Вопрос"] += 1
    elif re.search(r'P\.?\s*[Ss]\.?', last) or re.search(r'P\.?\s*[Ss]\.?', t):
        closers["P.S."] += 1
    elif re.search(r'[)）]+$', last):
        closers["Смайл )"] += 1
    elif re.search(r'[!]+$', last):
        closers["Восклицание"] += 1
    elif re.search(r'[😁😅🤣😀😃😎🔥💪]', last):
        closers["Эмодзи"] += 1
    else:
        closers["Другое"] += 1
for k, v in closers.most_common(8):
    print(f"  {k}: {v} ({v/len(texts)*100:.1f}%)")

# --- Word frequencies (excluding stop words) ---
STOP_WORDS = set("и в на не с что это как по я а то но из за для у к до о он она мы вы они от же бы так его её их мне мной нам им ей ему нас вас нет да было будет были есть уже ещё еще все всё всех этом этой этого себя себе тут там где когда если чего чем кто которые которых который которая которое где тоже очень просто может можно чтобы потому более или при после про между каждый каждая каждого нашей наших нашим ваших вашей того чуть теперь все моей моих моим даже только всегда потом тоже также нашу вашу тот этот мой ваш наш свой один два три четыре пять раз лет году года через перед ведь будто словно".split())

all_words = []
for t in texts:
    words = re.findall(r'[а-яёА-ЯЁ]+', t.lower())
    all_words.extend(w for w in words if w not in STOP_WORDS and len(w) > 2)

word_freq = Counter(all_words)
print(f"\n=== TOP 30 WORDS ===")
for w, c in word_freq.most_common(30):
    print(f"  {w}: {c}")

# --- Bigrams ---
bigrams = Counter()
for t in texts:
    words = re.findall(r'[а-яёА-ЯЁ]+', t.lower())
    filtered = [w for w in words if w not in STOP_WORDS and len(w) > 2]
    for i in range(len(filtered) - 1):
        bigrams[(filtered[i], filtered[i+1])] += 1

print(f"\n=== TOP 15 BIGRAMS ===")
for (w1, w2), c in bigrams.most_common(15):
    print(f"  {w1} {w2}: {c}")

# --- Emoji usage ---
emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F900-\U0001F9FF\U00002702-\U000027B0\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF\U00002600-\U000026FF\U0000FE00-\U0000FE0F\U0001F1E0-\U0001F1FF]')
emoji_counter = Counter()
posts_with_emoji = 0
for t in texts:
    emojis = emoji_pattern.findall(t)
    if emojis:
        posts_with_emoji += 1
        emoji_counter.update(emojis)

print(f"\n=== EMOJI ===")
print(f"Posts with emoji: {posts_with_emoji} ({posts_with_emoji/len(texts)*100:.1f}%)")
print(f"Top emoji: {emoji_counter.most_common(15)}")

# --- Punctuation patterns ---
paren_smile = sum(1 for t in texts if re.search(r'\)+', t))
double_paren = sum(1 for t in texts if re.search(r'\)\)', t))
excl = sum(1 for t in texts if '!' in t)
question = sum(1 for t in texts if '?' in t)
ellipsis = sum(1 for t in texts if '...' in t)
dash_long = sum(1 for t in texts if ' - ' in t or '—' in t)
quotes = sum(1 for t in texts if '"' in t or '«' in t)
ps_count = sum(1 for t in texts if re.search(r'P\.?\s*[Ss]\.?', t))

print(f"\n=== PUNCTUATION ===")
print(f"Posts with ): {paren_smile} ({paren_smile/len(texts)*100:.1f}%)")
print(f"Posts with )): {double_paren} ({double_paren/len(texts)*100:.1f}%)")
print(f"Posts with !: {excl} ({excl/len(texts)*100:.1f}%)")
print(f"Posts with ?: {question} ({question/len(texts)*100:.1f}%)")
print(f"Posts with ...: {ellipsis} ({ellipsis/len(texts)*100:.1f}%)")
print(f"Posts with dash: {dash_long} ({dash_long/len(texts)*100:.1f}%)")
print(f"Posts with quotes: {quotes} ({quotes/len(texts)*100:.1f}%)")
print(f"Posts with P.S.: {ps_count} ({ps_count/len(texts)*100:.1f}%)")

# --- Signature phrases ---
print(f"\n=== SIGNATURE PHRASES ===")
patterns_to_check = [
    ("Делай SMM", r'[Дд]елай\s+SMM'),
    ("ппц", r'ппц'),
    ("прикольно", r'прикольн'),
    ("инсайт", r'инсайт'),
    ("кстати", r'[Кк]стати'),
    ("карл", r'[Кк]арл'),
    ("кайф", r'кайф'),
    ("прям", r'прям'),
    ("бабок/бабки", r'бабк|бабок'),
    ("балин/блин", r'блин'),
    ("смекаете", r'смекаете'),
    ("операционка", r'операционк'),
    ("нищу/ниша", r'ниш[аеу]'),
    ("компетенци", r'компетенци'),
    ("созвон", r'созвон'),
    ("чилл/чил", r'чил'),
    ("нейронк", r'нейронк'),
    ("гребенюк", r'[Гг]ребенюк'),
    ("стоицизм", r'стоицизм'),
    ("НСП", r'НСП'),
    ("GPT/гпт", r'GPT|гпт'),
    ("курс/доллар", r'курс|доллар'),
    ("мазахизм/мазохизм", r'маз[ао]хизм'),
    ("выручка", r'[Вв]ыручк'),
    ("масштаб", r'масштаб'),
    ("рука лицо/фейспалм", r'рука\s+лицо|фейс'),
]
for name, pat in patterns_to_check:
    count = sum(1 for t in texts if re.search(pat, t))
    if count > 2:
        print(f"  {name}: {count} posts")

# --- Typical typo/error patterns ---
print(f"\n=== TYPOS/ERRORS ===")
typo_patterns = [
    ("аппонент (вм. оппонент)", r'аппонент'),
    ("медетативный", r'медетатив'),
    ("безпрерывн", r'безпрерывн'),
    ("валатильн", r'валатильн'),
    ("экспериемент", r'эксперем'),
    ("корпаратив", r'корпаратив'),
    ("ничинаешь", r'ничинаешь'),
    ("нараьотать", r'нараьотать'),
    ("кратчайшие→кротчайшие", r'кротч'),
]
for name, pat in typo_patterns:
    count = sum(1 for t in texts if re.search(pat, t))
    if count > 0:
        print(f"  {name}: {count}")

# --- Avg sentences per post ---
sent_counts = []
for t in texts:
    sents = re.split(r'[.!?]+', t)
    sents = [s.strip() for s in sents if s.strip()]
    sent_counts.append(len(sents))
avg_sents = sum(sent_counts) / len(sent_counts)
print(f"\n=== SENTENCES ===")
print(f"Avg sentences per post: {avg_sents:.1f}")

# --- Years distribution ---
print(f"\n=== POSTS BY YEAR ===")
year_counter = Counter()
for p in posts:
    year = p["date"][:4]
    year_counter[year] += 1
for y in sorted(year_counter.keys()):
    print(f"  {y}: {year_counter[y]}")

# --- Attachments ---
print(f"\n=== ATTACHMENTS ===")
attach_counter = Counter()
for p in posts:
    a = p.get("attachments", "нет")
    if a:
        for part in a.split(", "):
            attach_counter[part.split(" ")[0]] += 1
    else:
        attach_counter["нет"] += 1
for k, v in attach_counter.most_common(10):
    print(f"  {k}: {v}")

# --- Avg paragraph count ---
para_counts = []
for t in texts:
    paras = [p.strip() for p in t.split('\n') if p.strip()]
    para_counts.append(len(paras))
avg_paras = sum(para_counts) / len(para_counts)
print(f"\n=== PARAGRAPHS ===")
print(f"Avg paragraphs per post: {avg_paras:.1f}")

print("\n=== DONE ===")
