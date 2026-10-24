#!/usr/bin/env python3
"""Fetch one representative, license-safe fence photo per fencing type
from Wikimedia Commons, saving image + attribution metadata locally."""
import json
import os
import sys
import urllib.parse
import urllib.request

import certifi  # installed? fallback below

try:
    import ssl
    import certifi
    ctx = ssl.create_default_context(cafile=certifi.where())
except Exception:
    ctx = ssl.create_default_context()

OUT_DIR = "public/images/fences"
SIZES = 1600

TARGETS = [
    ("wood-privacy", "wooden privacy fence"),
    ("vinyl-pvc", "vinyl fence PVC"),
    ("chain-link", "chain-link fence"),
    ("aluminum", "ornamental aluminium fence"),
    ("wrought-iron", "wrought iron fence"),
    ("composite", "composite fencing"),
    ("split-rail", "split rail fence"),
    ("farm-ranch", "ranch fence paddock"),
]


def api(params):
    base = "https://commons.wikimedia.org/w/api.php"
    params.update({
        "format": "json",
        "formatversion": "2",
        "origin": "*",
    })
    url = base + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "FencingSiteBuilder/1.0 (educational scaffolding task)"})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return json.load(r)


def search_pages(query, limit=10):
    data = api({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrlimit": limit,
        "gsrnamespace": 6,
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata|mime",
        "iiurlwidth": SIZES,
    })
    return list((data.get("query") or {}).get("pages") or [])


def pick(pages):
    for page in pages:
        info = (page.get("imageinfo") or [{}])[0]
        if info.get("mime") not in ("image/jpeg",):
            continue
        if info.get("width", 0) < 1200:
            continue
        thumb = info.get("thumburl") or info.get("url")
        meta = info.get("extmetadata") or {}
        lic = (meta.get("LicenseShortName") or {}).get("value", "")
        # accept any CC/PD license; avoid weird cases
        if not lic or ("Non" in lic and "-nd" not in lic and "cc" in lic.lower()):
            continue
        return page, thumb, info
    return None, None, None


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    attributions = {}
    for slug, query in TARGETS:
        pages = search_pages(query)
        page, thumb, info = pick(pages)
        if not page:
            print(f"MISS {slug}: no candidate", flush=True)
            continue
        dest = os.path.join(OUT_DIR, f"{slug}.jpg")
        try:
            req = urllib.request.Request(thumb, headers={"User-Agent": "FencingSiteBuilder/1.0"})
            with urllib.request.urlopen(req, context=ctx, timeout=60) as resp, open(dest, "wb") as f:
                f.write(resp.read())
        except Exception as e:
            print(f"MISS {slug}: download failed {e}", flush=True)
            continue
        meta = info.get("extmetadata") or {}
        artist = (meta.get("Artist") or {}).get("value", "Unknown author")
        # strip html tags crudely
        import re
        artist = re.sub(r"<[^>]+>", "", artist).strip()
        attributions[slug] = {
            "title": page.get("title", ""),
            "page": f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(page.get('title', '').replace('File:', 'File:'))}",
            "author": artist,
            "license": (meta.get("LicenseShortName") or {}).get("value", ""),
            "source": {"url": thumb},
        }
        print(f"OK {slug}: {page.get('title')}", flush=True)
    with open("data/fence-photo-credits.json", "w") as f:
        json.dump(attributions, f, indent=2)
    print(f"saved {len(attributions)} attributions", flush=True)
    missing = [slug for slug, _ in TARGETS if slug not in attributions]
    if missing:
        print("MISSING:", ",".join(missing), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    main()
