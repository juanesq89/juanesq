# Noto Serif KR 500, subset to the Hangul syllables used in headings (h1-h3, lede, pull quotes, hub card titles, related links).
# Re-run after adding guides whose headings use new Hangul:  python tools/gen-serif-kr-subset.py
# Glyphs not in the subset fall back to Pretendard (sans) — nothing breaks, it just looks like before.
import glob, re, html, urllib.parse, urllib.request, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
chars = set()
def add(t): chars.update(c for c in html.unescape(t) if '가' <= c <= '힣')
files = glob.glob(os.path.join(ROOT, 'guide', '**', '*.html'), recursive=True) + [os.path.join(ROOT, p) for p in ('index.html', 'es/index.html', 'pt/index.html', 'about/index.html', 'privacy.html')]
for f in files:
    s = open(f, encoding='utf-8').read()
    for _, m in re.findall(r'<(h1|h2|h3)[^>]*>(.*?)</\1>', s, re.S): add(m)
    for m in re.findall(r'<span class="rg-cat">.*?</span>(.*?)</a>', s, re.S): add(m)
    for cls in ('article-lede', 'pullquote', 'card-title'):
        for m in re.findall(r'class="' + cls + r'">(.*?)</(?:p|h2)>', s, re.S): add(m)
text = ''.join(sorted(chars))
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'}
css = urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500&text=' + urllib.parse.quote(text), headers=UA)).read().decode()
url = re.search(r'url\((https[^)]+)\)', css).group(1)
data = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()
open(os.path.join(ROOT, 'fonts', 'noto-serif-kr-500-sub.woff2'), 'wb').write(data)
print(len(text), 'syllables,', len(data), 'bytes')
