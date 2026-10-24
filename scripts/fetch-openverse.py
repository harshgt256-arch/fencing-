#!/usr/bin/env python3
"""Fetch license-clean fence photos from Openverse (api.openverse.org).
Downloads several candidates per fence type for visual selection."""
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

OUT = "/tmp/fence-candidates-ov"

TARGETS = [
    ("wood-privacy", "wood privacy fence backyard"),
    ("vinyl-pvc", "vinyl fence"),
    ("chain-link", "chain link fence"),
    ("aluminum", "black aluminum fence"),
    ("wrought-iron", "wrought iron fence"),
    ("composite", "composite fence boards"),
    ("split-rail", "split rail fence"),
    ("farm-ranch", "farm fence"),
]


def api(url):
    out = subprocess.run(
        ["curl", "-fsSL", "-A", "FencingSiteBuilder/1.0", url],
        capture_output=True,
        timeout=60,
    )
    if out.returncode != 0:
        raise RuntimeError(out.stderr.decode(errors="ignore")[:200])
    return json.loads(out.stdout)


def main():
    os.makedirs(OUT, exist_ok=True)
    index = {}
    errors = []
    for slug, query in TARGETS:
        try:
            data = api(
                "https://api.openverse.org/v1/images/?"
                + urllib.parse.urlencode(
                    {
                        "q": query,
                        "license": "by,by-sa,cc0,pdm",
                        "page_size": 16,
                    }
                )
            )
        except Exception as e:
            errors.append(f"{slug}: api {e}")
            continue
        n = 0
        results = data.get("results", [])
        for res in results:
            if n >= 3:
                break
            if res.get("width", 0) and res.get("width", 0) < 900:
                continue
            if (res.get("license") or "") not in ("by", "by-sa", "cc0", "pdm"):
                continue
            url = res.get("url") or ""
            try:
                dest = os.path.join(OUT, f"{slug}-{n + 1}.jpg")
                ok = subprocess.run(
                    ["curl", "-fsSL", "-A", "FencingSiteBuilder/1.0", url, "-o", dest],
                    timeout=120,
                )
                if ok.returncode != 0:
                    raise RuntimeError("curl download failed")
                size = os.path.getsize(dest)
                if size < 40_000:
                    os.remove(dest)
                    raise ValueError(f"small file {size}")
                index.setdefault(slug, []).append(
                    {
                        "file": dest,
                        "title": res.get("title", ""),
                        "creator": res.get("creator", ""),
                        "license": res.get("license", ""),
                        "license_version": res.get("license_version", ""),
                        "foreign_landing_url": res.get("foreign_landing_url", ""),
                        "attribution": re.sub(r"<[^>]+>", "", res.get("attribution", "") or ""),
                    }
                )
                n += 1
            except Exception as e:
                errors.append(f"{slug}: {e}")
        print(slug, n, "candidates", flush=True)

    with open(os.path.join(OUT, "index.json"), "w") as f:
        json.dump({"index": index, "errors": errors}, f, indent=2)
    for e in errors:
        print("ERR", e)
    missing = [slug for slug, _ in TARGETS if slug not in index]
    print("MISSING:", ",".join(missing) if missing else "none")


if __name__ == "__main__":
    main()
