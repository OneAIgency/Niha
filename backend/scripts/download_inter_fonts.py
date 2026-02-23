#!/usr/bin/env python3
"""Download Inter font woff2 files for local PDF rendering."""
import urllib.request
from pathlib import Path

FONTS_DIR = Path(__file__).parent.parent / "app/services/pdf_generator/styles/fonts"
FONTS_DIR.mkdir(parents=True, exist_ok=True)

# Inter static subset (Latin) woff2 files — from Google Fonts static CDN
# These are the stable, versioned static URLs for Inter v3/v4
FONTS = {
    "Inter-Light.woff2": "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
    "Inter-Regular.woff2": "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
    "Inter-Medium.woff2": "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2",
    "Inter-SemiBold.woff2": "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2",
}

# Alternative: download from fontsource CDN
FONTS_ALT = {
    "Inter-Light.woff2": "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-300-normal.woff2",
    "Inter-Regular.woff2": "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-400-normal.woff2",
    "Inter-Medium.woff2": "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-500-normal.woff2",
    "Inter-SemiBold.woff2": "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-600-normal.woff2",
}

for filename, url in FONTS.items():
    dest = FONTS_DIR / filename
    if dest.exists():
        print(f"  skip (exists): {filename}")
        continue
    print(f"  downloading: {filename} ...", end=" ", flush=True)
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"ok ({dest.stat().st_size // 1024}KB)")
    except Exception as e:
        print(f"FAILED: {e}")
        # Try alternative CDN
        alt_url = FONTS_ALT.get(filename)
        if alt_url:
            print(f"  trying alternative CDN for {filename} ...", end=" ", flush=True)
            try:
                urllib.request.urlretrieve(alt_url, dest)
                print(f"ok ({dest.stat().st_size // 1024}KB)")
            except Exception as e2:
                print(f"FAILED: {e2}")

print("Done.")
