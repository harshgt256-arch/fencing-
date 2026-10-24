#!/usr/bin/env python3
"""Second pass: better queries for wood-privacy, composite, aluminum, chain-link."""
import json
import os
import re
import subprocess

OUT = "/tmp/fence-candidates-ov"
TARGETS = [
    ("wood-privacy-b", "cedar fence backyard"),
    ("wood-privacy-b", "wooden privacy fence"),
    ("wood-privacy-b", "backyard fence house"),
    ("composite-b", "trex fence"),
    ("composite-b", "wood plastic composite fence"),
    ("composite-b", "modern horizontal fence wood"),
    ("aluminum-b", "aluminium picket fence"),
    ("aluminum-b", "pool fence pickets"),
    ("aluminum-b", "black picket fence"),
    ("chain-link-b", "chainlink fence park"),
    ("chain-link-b", "baseball field fence"),
    ("chain-link-b", "chain link fence gate"),
]


def api(url):
    out = subprocess.run(["curl", "-fsSL", "-A", "FencingSiteBuilder/1.0", url],
                         capture_output=True, timeout=60)
    if out.returncode != 0:
        raise RuntimeError(out.stderr.decode(errors="ignore")[:200])
    return json.loads(out.stdout)


def main():
    index = {}
    errors = []
    for slug_group, query in TARGETS:
        if slug_group in index and len(index[slug_group]) >= 3:
            continue
        try:
            data = api("https://api.openverse.org/v1/images/?"
                       + __import__("urllib.parse", fromlist=[""]).urlencode(
                           {"q": query, "license": "by,by-sa,cc0,pdm", "page_size": 16}))
        except Exception as e:
            errors.append(f"{slug_group}: {e}")
            continue
        existing = len(index.get(slug_group, []))
        for res in data.get("results", []):
            if existing >= 4:
                break
            if res.get("width", 0) and res.get("width", 0) < 900:
                continue
            if (res.get("license") or "") not in ("by", "by-sa", "cc0", "pdm"):
                continue
            n = existing + 1
            dest = os.path.join(OUT, f"{slug_group}-{n}.jpg")
            url = res.get("url") or ""
            ok = subprocess.run(["curl", "-fsSL", "-A", "FencingSiteBuilder/1.0", url,
                                 "-o", dest], timeout=120)
            if ok.returncode != 0:
                errors.append(f"{slug_group}: dl {url[:60]}")
                continue
            size = os.path.getsize(dest)
            if size < 40_000:
                os.remove(dest)
                continue
            index.setdefault(slug_group, []).append({
                "file": dest,
                "title": res.get("title", ""),
                "creator": res.get("creator", ""),
                "license": res.get("license", ""),
                "foreign_landing_url": res.get("foreign_landing_url", ""),
                "attribution": re.sub(r"<[^>]+>", "", res.get("attribution", "") or ""),
                "query": query,
            })
            existing = len(index[slug_group])
    with open(os.path.join(OUT, "index2.json"), "w") as f:
        json.dump({"index": index, "errors": errors}, f, indent=2)
    print({k: len(v) for k, v in index.items()})


if __name__ == "__main__":
    main()
