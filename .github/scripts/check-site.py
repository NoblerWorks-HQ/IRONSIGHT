#!/usr/bin/env python3
"""Validate the static landing page in site/ before it ships.

The Pages deploy has no build step, so nothing else would catch a renamed
screenshot, a malformed JSON-LD block, a sitemap that points at the wrong host,
or an IndexNow key that no longer matches its verification file. This runs on
every pull request and blocks the deploy on main.

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


class Refs(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[str] = []
        self.ids: set[str] = set()
        self.canonical = ""
        self.ld: list[str] = []
        self.imgs_missing_alt = 0
        self._in_ld = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for k in ("href", "src"):
            if a.get(k):
                self.refs.append(a[k])
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href", "")
        if tag == "img" and "alt" not in a:
            self.imgs_missing_alt += 1
        if tag == "script" and a.get("type") == "application/ld+json":
            self._in_ld = True

    def handle_endtag(self, tag):
        if tag == "script":
            self._in_ld = False

    def handle_data(self, data):
        if self._in_ld:
            self.ld.append(data)


for page in sorted(SITE.glob("*.html")):
    p = Refs()
    p.feed(page.read_text(encoding="utf-8"))
    for ref in p.refs:
        u = urlparse(ref)
        if u.scheme or ref.startswith(("mailto:", "/")) or not ref:
            continue
        if ref == "#":
            continue
        if ref.startswith("#"):
            if ref[1:] not in p.ids:
                fail(f"{page.name}: anchor {ref} has no matching id")
        elif not (SITE / u.path).exists():
            fail(f"{page.name}: {ref} does not exist in site/")
    if p.imgs_missing_alt:
        fail(f"{page.name}: {p.imgs_missing_alt} <img> without alt")
    for block in p.ld:
        try:
            json.loads(block)
        except ValueError as e:
            fail(f"{page.name}: JSON-LD does not parse ({e})")

home = SITE / "index.html"
p = Refs()
p.feed(home.read_text(encoding="utf-8"))
if not p.canonical:
    fail("index.html: missing canonical link")
if not p.ld:
    fail("index.html: missing JSON-LD")

sitemap = (SITE / "sitemap.xml").read_text(encoding="utf-8")
locs = re.findall(r"<loc>([^<]+)</loc>", sitemap)
if p.canonical not in locs:
    fail(f"sitemap.xml does not list the canonical URL {p.canonical}")

key = (REPO / ".github" / "indexnow-key.txt").read_text(encoding="utf-8").strip()
key_file = SITE / f"{key}.txt"
if not key_file.exists() or key_file.read_text(encoding="utf-8").strip() != key:
    fail("IndexNow key file missing from site/ or does not match .github/indexnow-key.txt")

for f in ("robots.txt", "404.html", "favicon.svg"):
    if not (SITE / f).exists():
        fail(f"site/{f} is missing")

if errors:
    print("\n".join(f"::error::{e}" for e in errors))
    sys.exit(1)
print(f"site OK ({len(list(SITE.glob('*.html')))} pages checked)")
