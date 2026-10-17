#!/usr/bin/env python3
"""Validate the static site in site/ before it ships.

The Pages deploy has no build step, so nothing else would catch a renamed
image, a broken link, malformed JSON-LD, a page missing from the sitemap, or an
IndexNow key that no longer matches its verification file. This runs on every
pull request and blocks the deploy on main.

SEO rules enforced per page (404.html is exempt): one <h1>, a <title> of at most
65 characters, a meta description of 70 to 160 characters, a canonical URL that
matches its sitemap entry, og:image and twitter:card, and valid JSON-LD.

Exit 0 if clean, 1 if any check failed.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parents[2]
SITE = REPO / "site"
errors: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[str] = []
        self.ids: set[str] = set()
        self.canonical = ""
        self.ld: list[str] = []
        self.meta: dict[str, str] = {}
        self.title = ""
        self.h1 = 0
        self.imgs_missing_alt = 0
        self._in_ld = False
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for k in ("href", "src"):
            if a.get(k):
                self.refs.append(a[k])
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href", "")
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.meta[key] = a.get("content", "")
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self._in_title = True
        if tag == "img" and "alt" not in a:
            self.imgs_missing_alt += 1
        if tag == "script" and a.get("type") == "application/ld+json":
            self._in_ld = True

    def handle_endtag(self, tag):
        if tag == "script":
            self._in_ld = False
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_ld:
            self.ld.append(data)
        if self._in_title:
            self.title += data


pages = sorted(SITE.rglob("*.html"))
parsed: dict[Path, Page] = {}
for page in pages:
    rel = page.relative_to(SITE)
    p = Page()
    p.feed(page.read_text(encoding="utf-8"))
    parsed[page] = p
    for ref in p.refs:
        u = urlparse(ref)
        if u.scheme or ref.startswith(("mailto:", "/")) or ref in ("", "#"):
            continue
        if ref.startswith("#"):
            if ref[1:] not in p.ids:
                fail(f"{rel}: anchor {ref} has no matching id")
            continue
        target = (page.parent / u.path).resolve()
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            fail(f"{rel}: {ref} does not exist in site/")
    if p.imgs_missing_alt:
        fail(f"{rel}: {p.imgs_missing_alt} <img> without alt")
    for block in p.ld:
        try:
            json.loads(block)
        except ValueError as e:
            fail(f"{rel}: JSON-LD does not parse ({e})")
    if page.name == "404.html":
        continue
    if not p.ld:
        fail(f"{rel}: missing JSON-LD")
    if p.h1 != 1:
        fail(f"{rel}: expected exactly one <h1>, found {p.h1}")
    title = p.title.strip()
    if not title or len(title) > 65:
        fail(f"{rel}: <title> is empty or over 65 characters ({len(title)})")
    desc = p.meta.get("description", "")
    if not 70 <= len(desc) <= 160:
        fail(f"{rel}: meta description must be 70-160 characters (is {len(desc)})")
    for key in ("og:title", "og:description", "og:image", "twitter:card"):
        if not p.meta.get(key):
            fail(f"{rel}: missing <meta {key}>")
    if not p.canonical:
        fail(f"{rel}: missing canonical link")

sitemap = (SITE / "sitemap.xml").read_text(encoding="utf-8")
locs = set(re.findall(r"<loc>([^<]+)</loc>", sitemap))
canon = {p.canonical for pg, p in parsed.items() if pg.name != "404.html"}
for missing in sorted(canon - locs):
    fail(f"sitemap.xml does not list {missing}")
for extra in sorted(locs - canon):
    fail(f"sitemap.xml lists {extra}, which is not a page's canonical URL")

key = (REPO / ".github" / "indexnow-key.txt").read_text(encoding="utf-8").strip()
key_file = SITE / f"{key}.txt"
if not key_file.exists() or key_file.read_text(encoding="utf-8").strip() != key:
    fail("IndexNow key file missing from site/ or does not match .github/indexnow-key.txt")

for f in ("robots.txt", "404.html", "favicon.svg", "style.css", "llms.txt"):
    if not (SITE / f).exists():
        fail(f"site/{f} is missing")

if errors:
    print("\n".join(f"::error::{e}" for e in errors))
    sys.exit(1)
print(f"site OK ({len(pages)} pages checked, {len(locs)} in sitemap)")
