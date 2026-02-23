#!/usr/bin/env python3
"""
Convert all .docx files in documents/ to PDF using LibreOffice headless.

Run from repo root:
    python3 backend/scripts/generate_static_docs.py

Requires LibreOffice installed at /Applications/LibreOffice.app (macOS).
Output PDFs go to documents/ — same directory as source .docx files.
"""
import subprocess
import sys
from pathlib import Path

DOCS_DIR = Path(__file__).parent.parent.parent / "documents"
SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"


def main():
    docx_files = sorted(DOCS_DIR.glob("*.docx"))
    if not docx_files:
        print(f"ERROR: No .docx files found in {DOCS_DIR}")
        sys.exit(1)

    print(f"Converting {len(docx_files)} files → {DOCS_DIR}\n")

    result = subprocess.run(
        [
            SOFFICE,
            "--headless",
            "--convert-to", "pdf",
            "--outdir", str(DOCS_DIR),
            *[str(f) for f in docx_files],
        ],
        capture_output=True,
        text=True,
    )

    if result.stdout:
        print(result.stdout)
    if result.returncode != 0:
        print(f"ERROR:\n{result.stderr}")
        sys.exit(1)

    # Verify output
    pdf_files = sorted(DOCS_DIR.glob("NIHA_*.pdf"))
    print(f"\n{len(pdf_files)} PDFs generated:")
    for f in pdf_files:
        print(f"  ✓ {f.name} ({f.stat().st_size // 1024}KB)")

    if len(pdf_files) < len(docx_files):
        missing = len(docx_files) - len(pdf_files)
        print(f"\nWARNING: {missing} files may have failed to convert")
        sys.exit(1)

    print(f"\nDone. {len(pdf_files)} PDFs ready in documents/")


if __name__ == "__main__":
    main()
