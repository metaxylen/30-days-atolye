# Report: session resources (`atolye/content/resources.json`)

Date: 2026-11-02. Brief: `atolye/docs/briefs/resources.md`.

## Summary

- 225 items across all 30 days, 6-8 per day (minimum 4, maximum 8 as the brief requires).
- 201 items are tied to an original `##`/`###` heading of their day; 24 are whole-day items (no `section`).
  Every `section` value was checked programmatically against the headings extracted from `readme.md` (Day 1) and
  `NN_Day_*/NN_*.md` (Days 2-30), skipping fenced code blocks. Headings are copied raw, exactly as the cards use them
  (for example `Python *datetime*`, `Escape character(\\) in RegEx`, `Arithmetic Operators:`).
- Kinds: article 14, docs 118, interactive 13, practice 16, video 64.
- Languages: en 198, tr 27.
- No emoji in any title or explanation; one YouTube title contained an emoji and it was replaced with " - ".

### Turkish source per course part

| Part | Days | Turkish items |
|---|---|---|
| temeller | 1-7 | Day 1: Python3 Dersleri 1 - Başlıyoruz (Python 3'ü Windows'a kurmak) (YouTube - Yazılım Bilimi)<br>Day 1: Python Öğreticisi: Python'a Resmi Olmayan Bir Giriş (docs.python.org (Türkçe))<br>Day 2: Python3 Dersleri 6 - Değişkenler (YouTube - Yazılım Bilimi)<br>Day 3: Python3 Dersleri 2 - Matematik işlemleri (YouTube - Yazılım Bilimi)<br>Day 4: Python3 Dersleri 5 - String İşlemleri (YouTube - Yazılım Bilimi)<br>Day 5: Python3 Dersleri 7 - Listeler (YouTube - Yazılım Bilimi)<br>Day 6: Veri Yapıları: Veri Grupları ve Diziler (docs.python.org (Türkçe))<br>Day 7: Veri Yapıları: Kümeler (docs.python.org (Türkçe)) |
| akis | 8-12 | Day 8: Python3 Dersleri 22 - Sözlükler( Dictionary) (YouTube - Yazılım Bilimi)<br>Day 9: Python3 Dersleri 9 - Koşullu Durumlar (if-elif-else) (YouTube - Yazılım Bilimi)<br>Day 10: Python3 Dersleri 11 - While Döngüsü (YouTube - Yazılım Bilimi)<br>Day 11: Python3 Dersleri 17 - Fonksiyonlarda Return (YouTube - Yazılım Bilimi)<br>Day 12: Python3 Dersleri 23 - Modüller (YouTube - Yazılım Bilimi) |
| fonksiyonel | 13-18 | Day 13: Veri Yapıları: Liste Kavramaları (docs.python.org (Türkçe))<br>Day 15: Hatalar ve Özel Durumlar (docs.python.org (Türkçe))<br>Day 17: Python3 Dersleri 25 - Bekle! Orda Hata Var (try ve except) (YouTube - Yazılım Bilimi) |
| nesneler | 19-23 | Day 19: Python3 Dersleri 27 - Dosya Açmak ve Yazmak (YouTube - Yazılım Bilimi)<br>Day 20: Python Dersleri 24 - Internetten Resim İndirme( Modül Örneği ) (YouTube - Yazılım Bilimi)<br>Day 21: Python3 Dersleri 36 - NTP - Yapıcı Fonksiyon (init fonksiyonu) (YouTube - Yazılım Bilimi)<br>Day 22: Python3 Dersleri 41 - Internetten Bilgi Çekmek 1 (Requests ve BeautifulSoup) (YouTube - Yazılım Bilimi)<br>Day 23: Sanal Ortamlar ve Paketler (docs.python.org (Türkçe)) |
| veri | 24-30 | Day 24: Yeni Başlayanlar İçin NumPy - Ders 10 - İstatistik Fonksiyonları, Broadcasting (YouTube - Arin Yazılım)<br>Day 25: Pandas DataFrame - Python Pandas Dersleri (YouTube - Tirendaz Akademi)<br>Day 26: Flask Mini Seri 1 - Flask Web Framework Nedir - Python Web Geliştirme (YouTube - Yazılım Bilimi)<br>Day 28: Python3 Dersleri 47 \| Json ile Döviz Uygulaması Yapımı \| Programlama ve Yazılım Dersleri (YouTube - Yazılım Bilimi)<br>Day 29: Flask Mini Seri 5 - Get Ve Post Request , Form İşlemleri - Python Web Geliştirme (YouTube - Yazılım Bilimi)<br>Day 30: Sırada Ne Var? (docs.python.org (Türkçe)) |

Turkish sources used: the official Turkish translation of the Python tutorial (docs.python.org/tr/3), the
"Python3 Dersleri" and "Flask Mini Seri" playlists by Yazılım Bilimi (Mustafa Murat Coşkun), "Yeni Başlayanlar İçin NumPy"
by Arin Yazılım and "Python Pandas Dersleri" by Tirendaz Akademi. The playlists were taken from the community list
https://github.com/ibrahimirdem/turkce-python-kaynaklari and their video IDs and titles were read from the public
YouTube playlist pages, then each video was verified individually (below).

## Items per day

| Day | Items | Section-tied | Whole-day | Turkish |
|---|---|---|---|---|
| 1 | 8 | 7 | 1 | 2 |
| 2 | 7 | 7 | 0 | 1 |
| 3 | 7 | 7 | 0 | 1 |
| 4 | 8 | 8 | 0 | 1 |
| 5 | 8 | 7 | 1 | 1 |
| 6 | 7 | 6 | 1 | 1 |
| 7 | 6 | 5 | 1 | 1 |
| 8 | 7 | 6 | 1 | 1 |
| 9 | 6 | 4 | 2 | 1 |
| 10 | 8 | 7 | 1 | 1 |
| 11 | 8 | 7 | 1 | 1 |
| 12 | 8 | 8 | 0 | 1 |
| 13 | 7 | 6 | 1 | 1 |
| 14 | 8 | 8 | 0 | 0 |
| 15 | 7 | 7 | 0 | 1 |
| 16 | 7 | 6 | 1 | 0 |
| 17 | 8 | 8 | 0 | 1 |
| 18 | 8 | 8 | 0 | 0 |
| 19 | 8 | 8 | 0 | 1 |
| 20 | 8 | 8 | 0 | 1 |
| 21 | 8 | 7 | 1 | 1 |
| 22 | 7 | 5 | 2 | 1 |
| 23 | 7 | 4 | 3 | 1 |
| 24 | 8 | 8 | 0 | 1 |
| 25 | 8 | 8 | 0 | 1 |
| 26 | 8 | 8 | 0 | 1 |
| 27 | 8 | 8 | 0 | 0 |
| 28 | 7 | 7 | 0 | 1 |
| 29 | 8 | 8 | 0 | 1 |
| 30 | 7 | 0 | 7 | 1 |

## How every URL was verified

A script (kept outside the repository) fetched every URL with plain `curl -sL` (follow redirects, default user agent,
40 s timeout) and recorded the final HTTP status and the page `<title>`. An item was kept only if:

1. the final status was 200;
2. the page title contained the expected keyword for that resource (the full title is listed below);
3. for URLs with a `#fragment` (except Python Tutor), the page HTML really contains an element with that `id`/`name`;
4. the final URL equals the URL in the file (no redirect); URLs that redirected were replaced by their final address
   and re-checked.

YouTube videos were checked with `https://www.youtube.com/oembed?url=<video-url>&format=json`: status 200 and the
returned title. The `title` field of every video item is the oEmbed title (whitespace collapsed). `minutes` for videos
is the real length read from the public watch page (`lengthSeconds`), rounded; for pages it is a reading estimate.

Python Tutor links carry the example code in the URL fragment (`#code=...&mode=display&py=311`). The fragment is not
sent to the server, so only the page itself (200, title "Python Tutor code visualizer") could be fetched. The
parameter names `code`, `mode`, `py` and the value `311` were confirmed by reading Python Tutor's own
`build/visualize.bundle.js` (it reads them with `bbq.getState(...)` and maps `py311` to `311` when it builds share links).
The links were not opened in a browser (the brief forbids browsers).

The whole run was repeated from an empty cache after the last edit: 225 of 225 items passed.

## Verification table

| Day | URL | Status | Title returned |
|---|---|---|---|
| 1 | https://www.youtube.com/watch?v=YYXdXT2l-Gg | oEmbed 200 | Python Tutorial for Beginners 1: Install and Setup for Mac and Windows |
| 1 | https://www.youtube.com/watch?v=R75Oo--O5Q4 | oEmbed 200 | Python3 Dersleri 1 -  Başlıyoruz (Python 3'ü Windows'a kurmak) |
| 1 | https://docs.python.org/3/tutorial/interpreter.html#using-the-python-interpreter | 200 (anchor found) | 2. Using the Python Interpreter — Python 3.15.2 documentation |
| 1 | https://code.visualstudio.com/docs/python/python-tutorial | 200 | Getting Started with Python in VS Code |
| 1 | https://docs.python.org/3/reference/lexical_analysis.html#indentation | 200 (anchor found) | 2. Lexical analysis — Python 3.15.2 documentation |
| 1 | https://peps.python.org/pep-0008/#comments | 200 (anchor found) | PEP 8 – Style Guide for Python Code \| peps.python.org |
| 1 | https://docs.python.org/tr/3/tutorial/introduction.html | 200 | 3. Python’a Resmi Olmayan Bir Giriş — Python 3.15.2 belgelendirmesi |
| 1 | https://exercism.org/tracks/python/exercises/hello-world | 200 | Hello World in Python on Exercism |
| 2 | https://docs.python.org/3/builtins/functions.html | 200 | Built-in functions — Python 3.15.2 documentation |
| 2 | https://www.youtube.com/watch?v=VdIAecXie3M | oEmbed 200 | Python3 Dersleri 6 - Değişkenler |
| 2 | https://pythontutor.com/visualize.html#code=x%20%3D%2010%0Ay%20%3D%20x%0Ax%20%3D%20x%20%2B%205%0Aprint%28x%2C%20y%29&... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 2 | https://docs.python.org/3/builtins/functions.html#int | 200 (anchor found) | Built-in functions — Python 3.15.2 documentation |
| 2 | https://www.youtube.com/watch?v=khKv-8q7YmY | oEmbed 200 | Python Tutorial for Beginners 3: Integers and Floats - Working with Numeric Data |
| 2 | https://docs.python.org/3/tutorial/floatingpoint.html | 200 | 15. Floating-Point Arithmetic: Issues and Limitations — Python 3.15.2 documentation |
| 2 | https://exercism.org/tracks/python/exercises/currency-exchange | 200 | Currency Exchange in Python on Exercism |
| 3 | https://docs.python.org/3/builtins/stdtypes.html#truth-value-testing | 200 (anchor found) | Built-in Types — Python 3.15.2 documentation |
| 3 | https://docs.python.org/3/reference/expressions.html#operator-precedence | 200 (anchor found) | 6. Expressions — Python 3.15.2 documentation |
| 3 | https://docs.python.org/3/reference/simple_stmts.html#augmented-assignment-statements | 200 (anchor found) | 7. Simple statements — Python 3.15.2 documentation |
| 3 | https://www.youtube.com/watch?v=jpMsdvfuAA0 | oEmbed 200 | Python3 Dersleri 2 - Matematik işlemleri |
| 3 | https://docs.python.org/3/builtins/stdtypes.html#comparisons | 200 (anchor found) | Built-in Types — Python 3.15.2 documentation |
| 3 | https://docs.python.org/3/builtins/stdtypes.html#boolean-operations-and-or-not | 200 (anchor found) | Built-in Types — Python 3.15.2 documentation |
| 3 | https://exercism.org/tracks/python/exercises/ghost-gobble-arcade-game | 200 | Ghost Gobble Arcade Game in Python on Exercism |
| 4 | https://www.youtube.com/watch?v=k9TUPpGqYTo | oEmbed 200 | Python Tutorial for Beginners 2: Strings - Working with Textual Data |
| 4 | https://docs.python.org/3/reference/lexical_analysis.html#escape-sequences | 200 (anchor found) | 2. Lexical analysis — Python 3.15.2 documentation |
| 4 | https://www.youtube.com/watch?v=nghuHvKLhJA | oEmbed 200 | Python Quick Tip: F-Strings - How to Use Them and Advanced String Formatting |
| 4 | https://docs.python.org/3/library/string.html#format-specification-mini-language | 200 (anchor found) | string — Common string operations — Python 3.15.2 documentation |
| 4 | https://docs.python.org/3/tutorial/introduction.html#text | 200 (anchor found) | 3. An Informal Introduction to Python — Python 3.15.2 documentation |
| 4 | https://docs.python.org/3/builtins/stdtypes.html#string-methods | 200 (anchor found) | Built-in Types — Python 3.15.2 documentation |
| 4 | https://www.youtube.com/watch?v=c8vdnPSqVEw | oEmbed 200 | Python3 Dersleri 5 - String İşlemleri |
| 4 | https://exercism.org/tracks/python/exercises/little-sisters-vocab | 200 | Little Sister's Vocabulary in Python on Exercism |
| 5 | https://www.youtube.com/watch?v=W8KRzm-HUcc | oEmbed 200 | Python Tutorial for Beginners 4: Lists, Tuples, and Sets |
| 5 | https://www.youtube.com/watch?v=A6FR4UcrBQw | oEmbed 200 | Python3 Dersleri 7 - Listeler |
| 5 | https://www.youtube.com/watch?v=ajrtAuDg3yw | oEmbed 200 | Python Tutorial: Slicing Lists and Strings |
| 5 | https://docs.python.org/3/tutorial/datastructures.html#more-on-lists | 200 (anchor found) | 5. Data Structures — Python 3.15.2 documentation |
| 5 | https://pythontutor.com/visualize.html#code=a%20%3D%20%5B1%2C%202%2C%203%5D%0Ab%20%3D%20a%0Ac%20%3D%20a.copy%28%29%0A... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 5 | https://docs.python.org/3/howto/sorting.html | 200 | Sorting Techniques — Python 3.15.2 documentation |
| 5 | https://www.youtube.com/watch?v=D3JvDWO-BY4 | oEmbed 200 | Python Tutorial: Sorting Lists, Tuples, and Objects |
| 5 | https://exercism.org/tracks/python/exercises/card-games | 200 | Card Games in Python on Exercism |
| 6 | https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences | 200 (anchor found) | 5. Data Structures — Python 3.15.2 documentation |
| 6 | https://docs.python.org/tr/3/tutorial/datastructures.html#tuples-and-sequences | 200 (anchor found) | 5. Veri Yapıları — Python 3.15.2 belgelendirmesi |
| 6 | https://pythontutor.com/visualize.html#code=t%20%3D%20%281%2C%20%5B2%2C%203%5D%29%0At%5B1%5D.append%284%29%0Aprint%28... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 6 | https://docs.python.org/3/faq/design.html#why-are-there-separate-tuple-and-list-data-types | 200 (anchor found) | Design and History FAQ — Python 3.15.2 documentation |
| 6 | https://docs.python.org/3/builtins/stdtypes.html#common-sequence-operations | 200 (anchor found) | Built-in Types — Python 3.15.2 documentation |
| 6 | https://www.youtube.com/watch?v=GfxJYp9_nJA | oEmbed 200 | Python Tutorial: Namedtuple - When and why should you use namedtuples? |
| 6 | https://exercism.org/tracks/python/exercises/tisbury-treasure-hunt | 200 | Tisbury Treasure Hunt in Python on Exercism |
| 7 | https://www.youtube.com/watch?v=r3R3h5ly_8g | oEmbed 200 | Python Tutorial: Sets - Set Methods and Operations to Solve Common Problems |
| 7 | https://docs.python.org/3/tutorial/datastructures.html#sets | 200 (anchor found) | 5. Data Structures — Python 3.15.2 documentation |
| 7 | https://docs.python.org/tr/3/tutorial/datastructures.html#sets | 200 (anchor found) | 5. Veri Yapıları — Python 3.15.2 belgelendirmesi |
| 7 | https://docs.python.org/3/builtins/stdtypes.html#set-types-set-frozenset | 200 (anchor found) | Built-in Types — Python 3.15.2 documentation |
| 7 | https://wiki.python.org/python/language/TimeComplexity.html | 200 | Time Complexity - Python Wiki |
| 7 | https://exercism.org/tracks/python/exercises/cater-waiter | 200 | Cater Waiter in Python on Exercism |
| 8 | https://www.youtube.com/watch?v=daefaLgNkw0 | oEmbed 200 | Python Tutorial for Beginners 5: Dictionaries - Working with Key-Value Pairs |
| 8 | https://www.youtube.com/watch?v=iW6_F77ut0w | oEmbed 200 | Python3 Dersleri 22 - Sözlükler( Dictionary) |
| 8 | https://docs.python.org/3/tutorial/datastructures.html#dictionaries | 200 (anchor found) | 5. Data Structures — Python 3.15.2 documentation |
| 8 | https://docs.python.org/3/builtins/stdtypes.html#typesmapping | 200 (anchor found) | Built-in Types — Python 3.15.2 documentation |
| 8 | https://docs.python.org/3/builtins/stdtypes.html#dict-views | 200 (anchor found) | Built-in Types — Python 3.15.2 documentation |
| 8 | https://pythontutor.com/visualize.html#code=a%20%3D%20%7B%27ad%27%3A%20%27Ali%27%2C%20%27notlar%27%3A%20%5B90%5D%7D%0... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 8 | https://exercism.org/tracks/python/exercises/inventory-management | 200 | Inventory Management in Python on Exercism |
| 9 | https://docs.python.org/3/tutorial/controlflow.html#if-statements | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 9 | https://www.youtube.com/watch?v=DZwmZ8Usvnk | oEmbed 200 | Python Tutorial for Beginners 6: Conditionals and Booleans - If, Else, and Elif Statements |
| 9 | https://www.youtube.com/watch?v=4H8dKkw22pg | oEmbed 200 | Python3 Dersleri 9 -  Koşullu Durumlar (if-elif-else) |
| 9 | https://docs.python.org/3/reference/expressions.html#conditional-expressions | 200 (anchor found) | 6. Expressions — Python 3.15.2 documentation |
| 9 | https://docs.python.org/3/tutorial/controlflow.html#match-statements | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 9 | https://exercism.org/tracks/python/exercises/meltdown-mitigation | 200 | Meltdown Mitigation in Python on Exercism |
| 10 | https://www.youtube.com/watch?v=6iF8Xb7Z3wQ | oEmbed 200 | Python Tutorial for Beginners 7: Loops and Iterations - For/While Loops |
| 10 | https://www.youtube.com/watch?v=sypVHnan25U | oEmbed 200 | Python3 Dersleri 11 - While Döngüsü |
| 10 | https://docs.python.org/3/tutorial/controlflow.html#for-statements | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 10 | https://docs.python.org/3/tutorial/controlflow.html#the-range-function | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 10 | https://pythontutor.com/visualize.html#code=for%20i%20in%20range%281%2C%204%29%3A%0A%20%20%20%20for%20j%20in%20range%... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 10 | https://www.youtube.com/watch?v=Dh-0lAyc3Bc | oEmbed 200 | Python Tutorial: Else Clauses on Loops |
| 10 | https://docs.python.org/3/tutorial/controlflow.html#pass-statements | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 10 | https://exercism.org/tracks/python/exercises/making-the-grade | 200 | Making the Grade in Python on Exercism |
| 11 | https://www.youtube.com/watch?v=9Os0o3wzS_I | oEmbed 200 | Python Tutorial for Beginners 8: Functions |
| 11 | https://docs.python.org/3/tutorial/controlflow.html#defining-functions | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 11 | https://pythontutor.com/visualize.html#code=def%20kdv_ekle%28fiyat%2C%20oran%3D0.2%29%3A%0A%20%20%20%20toplam%20%3D%2... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 11 | https://www.youtube.com/watch?v=uylnvvBbazU | oEmbed 200 | Python3 Dersleri 17 - Fonksiyonlarda Return |
| 11 | https://docs.python.org/3/tutorial/controlflow.html#keyword-arguments | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 11 | https://docs.python.org/3/tutorial/controlflow.html#default-argument-values | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 11 | https://docs.python.org/3/tutorial/controlflow.html#arbitrary-argument-lists | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 11 | https://exercism.org/tracks/python/exercises/guidos-gorgeous-lasagna | 200 | Guido's Gorgeous Lasagna in Python on Exercism |
| 12 | https://docs.python.org/3/tutorial/modules.html | 200 | 6. Modules — Python 3.15.2 documentation |
| 12 | https://www.youtube.com/watch?v=eCJzBsbDhpk | oEmbed 200 | Python3 Dersleri  23  -  Modüller |
| 12 | https://www.youtube.com/watch?v=CqvZ3vGoGs0 | oEmbed 200 | Python Tutorial for Beginners 9: Import Modules and Exploring The Standard Library |
| 12 | https://www.youtube.com/watch?v=sugvnHA7ElY | oEmbed 200 | Python Tutorial: if __name__ == '__main__' |
| 12 | https://www.youtube.com/watch?v=tJxcKyFMTGo | oEmbed 200 | Python Tutorial: OS Module - Use Underlying Operating System Functionality |
| 12 | https://docs.python.org/3/library/statistics.html | 200 | statistics — Mathematical statistics functions — Python 3.15.2 documentation |
| 12 | https://docs.python.org/3/library/math.html | 200 | math — Mathematical functions — Python 3.15.2 documentation |
| 12 | https://www.youtube.com/watch?v=KzqSDvzOFNA | oEmbed 200 | Python Tutorial: Generate Random Numbers and Data Using the random Module |
| 13 | https://www.youtube.com/watch?v=3dt4OGnU5sM | oEmbed 200 | Python Tutorial: Comprehensions - How they work and why you should be using them |
| 13 | https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions | 200 (anchor found) | 5. Data Structures — Python 3.15.2 documentation |
| 13 | https://docs.python.org/tr/3/tutorial/datastructures.html#list-comprehensions | 200 (anchor found) | 5. Veri Yapıları — Python 3.15.2 belgelendirmesi |
| 13 | https://pythontutor.com/visualize.html#code=kareler%20%3D%20%5Bn%20%2A%20n%20for%20n%20in%20range%286%29%20if%20n%20%... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 13 | https://docs.python.org/3/tutorial/controlflow.html#lambda-expressions | 200 (anchor found) | 4. More Control Flow Tools — Python 3.15.2 documentation |
| 13 | https://docs.python.org/3/howto/sorting.html#key-functions | 200 (anchor found) | Sorting Techniques — Python 3.15.2 documentation |
| 13 | https://exercism.org/tracks/python/exercises/sum-of-multiples | 200 | Sum of Multiples in Python on Exercism |
| 14 | https://www.youtube.com/watch?v=QVdf0LgmICw | oEmbed 200 | Python Tutorial: Variable Scope - Understanding the LEGB rule and global/nonlocal statements |
| 14 | https://pythontutor.com/visualize.html#code=def%20sayac%28%29%3A%0A%20%20%20%20n%20%3D%200%0A%20%20%20%20def%20arttir... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 14 | https://www.youtube.com/watch?v=FsAPt_9Bf3U | oEmbed 200 | Python Tutorial: Decorators - Dynamically Alter The Functionality Of Your Functions |
| 14 | https://www.youtube.com/watch?v=KlBPCzcQNU8 | oEmbed 200 | Python Tutorial: Decorators With Arguments |
| 14 | https://docs.python.org/3/library/functools.html#functools.wraps | 200 (anchor found) | functools — Higher-order functions and operations on callable objects — Python 3.15.2 documentation |
| 14 | https://docs.python.org/3/builtins/functions.html#map | 200 (anchor found) | Built-in functions — Python 3.15.2 documentation |
| 14 | https://docs.python.org/3/library/functools.html#functools.reduce | 200 (anchor found) | functools — Higher-order functions and operations on callable objects — Python 3.15.2 documentation |
| 14 | https://docs.python.org/3/howto/functional.html | 200 | Functional Programming HOWTO — Python 3.15.2 documentation |
| 15 | https://docs.python.org/3/builtins/exceptions.html#exception-hierarchy | 200 (anchor found) | Built-in Exceptions — Python 3.15.2 documentation |
| 15 | https://docs.python.org/tr/3/tutorial/errors.html | 200 | 8. Hatalar ve Özel Durumlar — Python 3.15.2 belgelendirmesi |
| 15 | https://docs.python.org/3/tutorial/errors.html#syntax-errors | 200 (anchor found) | 8. Errors and Exceptions — Python 3.15.2 documentation |
| 15 | https://pythontutor.com/visualize.html#code=notlar%20%3D%20%5B80%2C%2095%2C%2070%5D%0Afor%20i%20in%20range%284%29%3A%... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 15 | https://docs.python.org/3/builtins/exceptions.html#ModuleNotFoundError | 200 (anchor found) | Built-in Exceptions — Python 3.15.2 documentation |
| 15 | https://docs.python.org/3/builtins/exceptions.html#KeyError | 200 (anchor found) | Built-in Exceptions — Python 3.15.2 documentation |
| 15 | https://www.youtube.com/watch?v=x3v9zMX1s4s | oEmbed 200 | Python Tutorial: Duck Typing and Asking Forgiveness, Not Permission (EAFP) |
| 16 | https://www.youtube.com/watch?v=eirjjyP2qcQ | oEmbed 200 | Python Tutorial: Datetime Module - How to work with Dates, Times, Timedeltas, and Timezones |
| 16 | https://docs.python.org/3/library/datetime.html#format-codes | 200 (anchor found) | datetime — Basic date and time types — Python 3.15.2 documentation |
| 16 | https://docs.python.org/3/library/datetime.html#datetime.datetime.strptime | 200 (anchor found) | datetime — Basic date and time types — Python 3.15.2 documentation |
| 16 | https://docs.python.org/3/library/datetime.html#date-objects | 200 (anchor found) | datetime — Basic date and time types — Python 3.15.2 documentation |
| 16 | https://docs.python.org/3/library/datetime.html#timedelta-objects | 200 (anchor found) | datetime — Basic date and time types — Python 3.15.2 documentation |
| 16 | https://www.youtube.com/watch?v=k8asfUbWbI4 | oEmbed 200 | Python Tutorial: Calculate Number of Days, Weeks, or Months to Reach Specific Goals |
| 16 | https://exercism.org/tracks/python/exercises/gigasecond | 200 | Gigasecond in Python on Exercism |
| 17 | https://docs.python.org/3/tutorial/errors.html#handling-exceptions | 200 (anchor found) | 8. Errors and Exceptions — Python 3.15.2 documentation |
| 17 | https://www.youtube.com/watch?v=NIWwJbo-9_8 | oEmbed 200 | Python Tutorial: Using Try/Except Blocks for Error Handling |
| 17 | https://www.youtube.com/watch?v=EU8zBEzDNEY | oEmbed 200 | Python3 Dersleri 25 - Bekle! Orda Hata Var (try ve except) |
| 17 | https://pythontutor.com/visualize.html#code=def%20bol%28a%2C%20b%29%3A%0A%20%20%20%20try%3A%0A%20%20%20%20%20%20%20%2... | 200 | Python Tutor code visualizer: Visualize code in Python, JavaScript, C, C++, and Java |
| 17 | https://peps.python.org/pep-0448/ | 200 | PEP 448 – Additional Unpacking Generalizations \| peps.python.org |
| 17 | https://docs.python.org/3/tutorial/datastructures.html#looping-techniques | 200 (anchor found) | 5. Data Structures — Python 3.15.2 documentation |
| 17 | https://docs.python.org/3/builtins/functions.html#zip | 200 (anchor found) | Built-in functions — Python 3.15.2 documentation |
| 17 | https://exercism.org/tracks/python/exercises/locomotive-engineer | 200 | Locomotive Engineer in Python on Exercism |
| 18 | https://docs.python.org/3/howto/regex.html | 200 | Regular expression HOWTO — Python 3.15.2 documentation |
| 18 | https://www.youtube.com/watch?v=K8L6KVGG-7o | oEmbed 200 | Python Tutorial: re Module - How to Write and Match Regular Expressions (Regex) |
| 18 | https://docs.python.org/3/library/re.html#module-contents | 200 (anchor found) | re — Regular expression operations — Python 3.15.2 documentation |
| 18 | https://docs.python.org/3/library/re.html#re.split | 200 (anchor found) | re — Regular expression operations — Python 3.15.2 documentation |
| 18 | https://docs.python.org/3/library/re.html#regular-expression-syntax | 200 (anchor found) | re — Regular expression operations — Python 3.15.2 documentation |
| 18 | https://regex101.com/ | 200 | regex101: Online Regex Tester, Builder, Converter & Debugger |
| 18 | https://docs.python.org/3/howto/regex.html#the-backslash-plague | 200 (anchor found) | Regular expression HOWTO — Python 3.15.2 documentation |
| 18 | https://regexone.com/ | 200 | RegexOne - Learn Regular Expressions - Lesson 1: An Introduction, and the ABCs |
| 19 | https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files | 200 (anchor found) | 7. Input and output — Python 3.15.2 documentation |
| 19 | https://www.youtube.com/watch?v=Uh2ebFW8OYM | oEmbed 200 | Python Tutorial: File Objects - Reading and Writing to Files |
| 19 | https://www.youtube.com/watch?v=_8vmI2_bIOE | oEmbed 200 | Python3 Dersleri 27 - Dosya Açmak ve Yazmak |
| 19 | https://docs.python.org/3/library/pathlib.html#pathlib.Path.unlink | 200 (anchor found) | pathlib — Object-oriented filesystem paths — Python 3.15.2 documentation |
| 19 | https://docs.python.org/3/tutorial/inputoutput.html#saving-structured-data-with-json | 200 (anchor found) | 7. Input and output — Python 3.15.2 documentation |
| 19 | https://www.youtube.com/watch?v=9N6a-VLBa2I | oEmbed 200 | Python Tutorial: Working with JSON Data using the json Module |
| 19 | https://www.youtube.com/watch?v=q5uM4VKywbA | oEmbed 200 | Python Tutorial: CSV Module - How to Read, Parse, and Write CSV Files |
| 19 | https://docs.python.org/3/library/csv.html | 200 | csv — CSV file reading and writing — Python 3.15.2 documentation |
| 20 | https://www.youtube.com/watch?v=U2ZN104hIcc | oEmbed 200 | Python Tutorial: pip - An in-depth look at the package management system |
| 20 | https://packaging.python.org/en/latest/tutorials/installing-packages/ | 200 | Installing Packages - Python Packaging User Guide |
| 20 | https://pip.pypa.io/en/stable/cli/pip_uninstall/ | 200 | pip uninstall - pip documentation v26.3 |
| 20 | https://pip.pypa.io/en/stable/cli/pip_freeze/ | 200 | pip freeze - pip documentation v26.3 |
| 20 | https://requests.readthedocs.io/en/latest/user/quickstart/ | 200 | Quickstart — Requests 2.34.2 documentation |
| 20 | https://www.youtube.com/watch?v=0VqeE_YJ5Q8 | oEmbed 200 | Python Dersleri 24 - Internetten Resim İndirme( Modül Örneği ) |
| 20 | https://docs.python.org/3/tutorial/modules.html#packages | 200 (anchor found) | 6. Modules — Python 3.15.2 documentation |
| 20 | https://packaging.python.org/en/latest/tutorials/packaging-projects/ | 200 | Packaging Python Projects - Python Packaging User Guide |
| 21 | https://docs.python.org/3/tutorial/classes.html#a-first-look-at-classes | 200 (anchor found) | 9. Classes — Python 3.15.2 documentation |
| 21 | https://www.youtube.com/watch?v=ZDa-Z5JzLYM | oEmbed 200 | Python OOP Tutorial 1: Classes and Instances |
| 21 | https://www.youtube.com/watch?v=BE4Kua9PCCQ | oEmbed 200 | Python3 Dersleri 36  - NTP - Yapıcı Fonksiyon (init fonksiyonu) |
| 21 | https://www.youtube.com/watch?v=BJ-VvGyQxho | oEmbed 200 | Python OOP Tutorial 2: Class Variables |
| 21 | https://www.youtube.com/watch?v=3ohzBxoFHAY | oEmbed 200 | Python OOP Tutorial 5: Special (Magic/Dunder) Methods |
| 21 | https://docs.python.org/3/tutorial/classes.html#inheritance | 200 (anchor found) | 9. Classes — Python 3.15.2 documentation |
| 21 | https://www.youtube.com/watch?v=RSl87lqOXDE | oEmbed 200 | Python OOP Tutorial 4: Inheritance - Creating Subclasses |
| 21 | https://exercism.org/tracks/python/exercises/ellens-alien-game | 200 | Ellen's Alien Game in Python on Exercism |
| 22 | https://www.youtube.com/watch?v=ng2o98k983k | oEmbed 200 | Python Tutorial: Web Scraping with BeautifulSoup and Requests |
| 22 | https://www.youtube.com/watch?v=WthFJcmGLhY | oEmbed 200 | Python3 Dersleri 41 - Internetten Bilgi Çekmek 1 (Requests ve BeautifulSoup) |
| 22 | https://www.crummy.com/software/BeautifulSoup/bs4/doc/#quick-start | 200 (anchor found) | Beautiful Soup Documentation — Beautiful Soup 4.14.3 documentation |
| 22 | https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model | 200 | Document Object Model (DOM) - Web APIs \| MDN |
| 22 | https://developers.google.com/search/docs/crawling-indexing/robots/intro | 200 | Robots.txt Introduction and Guide \| Google Search Central  \|  Documentation  \|  Google for Developers |
| 22 | https://docs.python.org/3/library/urllib.robotparser.html | 200 | urllib.robotparser — Parser for robots.txt — Python 3.15.2 documentation |
| 22 | https://requests.readthedocs.io/en/latest/user/quickstart/ | 200 | Quickstart — Requests 2.34.2 documentation |
| 23 | https://docs.python.org/3/tutorial/venv.html | 200 | 12. Virtual Environments and Packages — Python 3.15.2 documentation |
| 23 | https://docs.python.org/tr/3/tutorial/venv.html | 200 | 12. Sanal Ortamlar ve Paketler — Python 3.15.2 belgelendirmesi |
| 23 | https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/ | 200 | Install packages in a virtual environment using pip and venv - Python Packaging User Guide |
| 23 | https://www.youtube.com/watch?v=N5vscPTWKOk | oEmbed 200 | Python Tutorial: virtualenv and why you should use virtual environments |
| 23 | https://docs.python.org/3/library/venv.html | 200 | venv — Creation of virtual environments — Python 3.15.2 documentation |
| 23 | https://www.youtube.com/watch?v=cY2NXB_Tqq0 | oEmbed 200 | Python Tutorial: How I Manage Multiple Projects, Virtual Environments, and Environment Variables |
| 23 | https://pip.pypa.io/en/stable/user_guide/#requirements-files | 200 (anchor found) | User Guide - pip documentation v26.3 |
| 24 | https://seeing-theory.brown.edu/ | 200 | Seeing Theory |
| 24 | https://numpy.org/doc/stable/user/absolute_beginners.html | 200 | NumPy: the absolute basics for beginners — NumPy v2.5 Manual |
| 24 | https://numpy.org/doc/stable/user/basics.creation.html | 200 | Array creation — NumPy v2.5 Manual |
| 24 | https://numpy.org/doc/stable/user/basics.indexing.html | 200 | Indexing on ndarrays — NumPy v2.5 Manual |
| 24 | https://numpy.org/doc/stable/user/basics.broadcasting.html | 200 | Broadcasting — NumPy v2.5 Manual |
| 24 | https://www.youtube.com/watch?v=4EzoBDduKFo | oEmbed 200 | Yeni Başlayanlar İçin NumPy - Ders 10 - İstatistik Fonksiyonları, Broadcasting |
| 24 | https://numpy.org/doc/stable/reference/routines.statistics.html | 200 | Statistics — NumPy v2.5 Manual |
| 24 | https://numpy.org/doc/stable/reference/random/index.html | 200 | Random sampling — NumPy v2.5 Manual |
| 25 | https://pandas.pydata.org/docs/user_guide/10min.html | 200 | 10 minutes to pandas — pandas 3.1.0 documentation |
| 25 | https://www.youtube.com/watch?v=ZyhVh-qRZPA | oEmbed 200 | Python Pandas Tutorial (Part 1): Getting Started with Data Analysis - Installation and Loading Data |
| 25 | https://pandas.pydata.org/docs/user_guide/dsintro.html#series | 200 (anchor found) | Intro to data structures — pandas 3.1.0 documentation |
| 25 | https://pandas.pydata.org/docs/user_guide/dsintro.html#dataframe | 200 (anchor found) | Intro to data structures — pandas 3.1.0 documentation |
| 25 | https://www.youtube.com/watch?v=pHKiEk59n-s | oEmbed 200 | Pandas DataFrame 🐼 Python Pandas Dersleri |
| 25 | https://pandas.pydata.org/docs/getting_started/intro_tutorials/02_read_write.html | 200 | How do I read and write tabular data? — pandas 3.1.0 documentation |
| 25 | https://pandas.pydata.org/docs/getting_started/intro_tutorials/05_add_columns.html | 200 | How to create new columns derived from existing columns — pandas 3.1.0 documentation |
| 25 | https://pandas.pydata.org/docs/user_guide/indexing.html#boolean-indexing | 200 (anchor found) | Indexing and selecting data — pandas 3.1.0 documentation |
| 26 | https://flask.palletsprojects.com/en/stable/quickstart/#a-minimal-application | 200 (anchor found) | Quickstart — Flask Documentation (3.1.x) |
| 26 | https://www.youtube.com/watch?v=pNqtDpcPJm0 | oEmbed 200 | Flask Mini Seri 1 - Flask Web Framework Nedir - Python Web Geliştirme |
| 26 | https://www.youtube.com/watch?v=MwZwr5Tvyxo | oEmbed 200 | Python Flask Tutorial: Full-Featured Web App Part 1 - Getting Started |
| 26 | https://flask.palletsprojects.com/en/stable/quickstart/#routing | 200 (anchor found) | Quickstart — Flask Documentation (3.1.x) |
| 26 | https://www.youtube.com/watch?v=QnDWIZuWYW0 | oEmbed 200 | Python Flask Tutorial: Full-Featured Web App Part 2 - Templates |
| 26 | https://flask.palletsprojects.com/en/stable/quickstart/#url-building | 200 (anchor found) | Quickstart — Flask Documentation (3.1.x) |
| 26 | https://jinja.palletsprojects.com/en/stable/templates/#template-inheritance | 200 (anchor found) | Template Designer Documentation — Jinja Documentation (3.1.x) |
| 26 | https://flask.palletsprojects.com/en/stable/deploying/ | 200 | Deploying to Production — Flask Documentation (3.1.x) |
| 27 | https://www.mongodb.com/docs/manual/reference/sql-comparison/ | 200 | SQL to MongoDB Mapping Chart - Database Manual - MongoDB Docs |
| 27 | https://www.mongodb.com/docs/manual/reference/connection-string/ | 200 | Connection Strings - Database Manual - MongoDB Docs |
| 27 | https://www.mongodb.com/docs/languages/python/pymongo-driver/current/get-started/ | 200 | Get Started with PyMongo - PyMongo Driver - MongoDB Docs |
| 27 | https://www.mongodb.com/docs/languages/python/pymongo-driver/current/crud/insert/ | 200 | Insert Documents - PyMongo Driver - MongoDB Docs |
| 27 | https://www.mongodb.com/docs/languages/python/pymongo-driver/current/crud/query/find/ | 200 | Find Documents - PyMongo Driver - MongoDB Docs |
| 27 | https://www.mongodb.com/docs/manual/reference/mql/query-predicates/ | 200 | Query Predicates - Database Manual - MongoDB Docs |
| 27 | https://www.mongodb.com/docs/languages/python/pymongo-driver/current/crud/update/ | 200 | Update Documents - PyMongo Driver - MongoDB Docs |
| 27 | https://www.mongodb.com/docs/languages/python/pymongo-driver/current/crud/delete/ | 200 | Delete Documents - PyMongo Driver - MongoDB Docs |
| 28 | https://www.youtube.com/watch?v=tb8gHvYlCFs | oEmbed 200 | Python Requests Tutorial: Request Web Pages, Download Images, POST Data, Read JSON, and More |
| 28 | https://www.youtube.com/watch?v=dmgeY79DvV8 | oEmbed 200 | Python3 Dersleri 47  \| Json ile Döviz Uygulaması Yapımı \| Programlama ve Yazılım Dersleri |
| 28 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview | 200 | Overview of HTTP - HTTP \| MDN |
| 28 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages | 200 | HTTP messages - HTTP \| MDN |
| 28 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status | 200 | HTTP response status codes - HTTP \| MDN |
| 28 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers | 200 | HTTP headers - HTTP \| MDN |
| 28 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods | 200 | HTTP request methods - HTTP \| MDN |
| 29 | https://flask.palletsprojects.com/en/stable/quickstart/#apis-with-json | 200 (anchor found) | Quickstart — Flask Documentation (3.1.x) |
| 29 | https://developer.mozilla.org/en-US/docs/Glossary/REST | 200 | REST - Glossary \| MDN |
| 29 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/GET | 200 | GET request method - HTTP \| MDN |
| 29 | https://www.mongodb.com/docs/manual/reference/method/objectid/ | 200 | ObjectId() (mongosh method) - Database Manual - MongoDB Docs |
| 29 | https://flask.palletsprojects.com/en/stable/quickstart/#the-request-object | 200 (anchor found) | Quickstart — Flask Documentation (3.1.x) |
| 29 | https://www.youtube.com/watch?v=D5zrAk9mlF8 | oEmbed 200 | Flask Mini Seri 5 -   Get Ve Post Request , Form İşlemleri - Python Web Geliştirme |
| 29 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PUT | 200 | PUT request method - HTTP \| MDN |
| 29 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/DELETE | 200 | DELETE request method - HTTP \| MDN |
| 30 | https://docs.python.org/3/tutorial/whatnow.html | 200 | 13. What Now? — Python 3.15.2 documentation |
| 30 | https://docs.python.org/tr/3/tutorial/whatnow.html | 200 | 13. Sırada Ne Var? — Python 3.15.2 belgelendirmesi |
| 30 | https://peps.python.org/pep-0008/ | 200 | PEP 8 – Style Guide for Python Code \| peps.python.org |
| 30 | https://peps.python.org/pep-0020/ | 200 | PEP 20 – The Zen of Python \| peps.python.org |
| 30 | https://exercism.org/tracks/python | 200 | Python on Exercism |
| 30 | https://www.youtube.com/watch?v=6tNS--WetLI | oEmbed 200 | Python Tutorial: Unit Testing Your Code with the unittest Module |
| 30 | https://www.youtube.com/watch?v=DEwgZNC-KyE | oEmbed 200 | Preparing for a Python Interview: 10 Things You Should Know |

## Dropped or changed

| Candidate | Result | Decision |
|---|---|---|
| Real Python articles (e.g. https://realpython.com/python-lists-tuples/) | 403, Cloudflare "Just a moment..." challenge page | Dropped: cannot be verified with a plain fetch. Changing the user agent to get past the bot check was not done on purpose. Real Python is a good source; a human can add articles after checking them in a browser. |
| w3schools (https://www.w3schools.com/python/) | 403 | Dropped (also lower quality than the official docs). |
| strftime.org cheat sheet | 403 | Dropped; Day 16 keeps the official format-code table instead. |
| yazbel.com / python-istihza.yazbel.com (Turkish) | no response (connection failed) | Dropped; the official Turkish tutorial covers the same need. |
| https://wiki.python.org/moin/TimeComplexity | 200 but a JavaScript redirect page without a title | Replaced by its new address https://wiki.python.org/python/language/TimeComplexity.html (200, "Time Complexity - Python Wiki"). |
| docs.python.org/3/library/functions.html, stdtypes.html, exceptions.html | redirect to `/3/builtins/...` (Python 3.15 docs layout) | Replaced by the final `/3/builtins/...` URLs; anchors re-checked on the final page. |
| stdtypes `#mapping-types-dict` | anchor no longer exists (the section is now `mapping-types-dict-frozendict`) | Replaced by the stable label `#typesmapping`. |
| MDN `Web/API/Document_Object_Model/Introduction` | redirects to `Web/API/Document_Object_Model` | Replaced by the final URL and its real title "Document Object Model (DOM)". |
| MongoDB `manual/reference/operator/query/` and `method/ObjectId/` | redirect | Replaced by `manual/reference/mql/query-predicates/` and `method/objectid/`. |
| Turkish tutorial titles | first guesses did not match the translation | Titles set from the real Turkish headings ("Veri Grupları ve Diziler", "Hatalar ve Özel Durumlar", "Sırada Ne Var?"). |

## Notes for the app

- Nothing in `atolye/src/` reads `resources.json` yet; this session only adds the data file (the brief allows only this
  file and the report). The schema is exactly the brief's: `version`, `days` keyed by day number as a string, items with
  optional `section` and `kind`, `title`, `source`, `url`, `lang`, `minutes`, `why`, `why_tr`.
- Several items can share a `section`; whole-day items should be shown for every card of that day.
- Not verified: whether each YouTube video allows embedding (oEmbed 200 only proves it exists and is public), and how the
  pages render in a browser. Links can rot; re-running a status check before a release is cheap.
