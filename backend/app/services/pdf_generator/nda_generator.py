"""
NDA PDF Generator — Non-Disclosure and Non-Circumvention Agreement.

Thin wrapper around the HTML + WeasyPrint renderer.
All content and styling is in templates/nda.html.j2.
"""

from datetime import date
from typing import Optional

from .renderer import render_pdf


def generate_nda_pdf(
    client_entity_name: Optional[str] = None,
    client_entity_type: Optional[str] = None,
    client_jurisdiction: Optional[str] = None,
    client_representative: Optional[str] = None,
    client_email: Optional[str] = None,
    effective_date: Optional[date] = None,
    doc_ref: Optional[str] = None,
    output_path: Optional[str] = None,
) -> bytes:
    """Generate the NIHA NDA as a PDF using the NIHA Document Design System."""
    eff_date = effective_date or date.today()
    pdf_bytes = render_pdf("nda", {
        "client_entity_name": client_entity_name or "",
        "client_entity_type": client_entity_type or "",
        "client_jurisdiction": client_jurisdiction or "",
        "client_representative": client_representative or "",
        "client_email": client_email or "",
        "doc_date": eff_date.strftime("%d %B %Y"),
        "doc_ref": doc_ref or f"NIHA-NDA-{eff_date.year}-001",
    })
    if output_path:
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)
    return pdf_bytes
