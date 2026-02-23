"""
NIHA PDF Document Generator Package.

Generates branded, pre-filled PDF documents for the NIHA Carbon Trading Platform.

New documents use the WeasyPrint + Jinja2 pipeline via render_pdf().
Legacy ReportLab generators are lazily imported to avoid hard dependency failures.

Usage (new pipeline):
    from app.services.pdf_generator.renderer import render_pdf
    pdf_bytes = render_pdf("board_resolution", {"doc_ref": "NIHA-BR-2026-001"})

Usage (migrated WeasyPrint generators):
    from app.services.pdf_generator import generate_nda_pdf

Usage (remaining ReportLab generators — requires reportlab installed):
    from app.services.pdf_generator import generate_msa_pdf
"""

from .renderer import render_pdf
from .nda_generator import generate_nda_pdf  # migrated to WeasyPrint

__all__ = [
    "render_pdf",
    "generate_nda_pdf",
]


def __getattr__(name):
    """Lazy-load remaining ReportLab generators only when explicitly accessed."""
    _legacy = {
        "generate_msa_pdf": (".msa_generator", "generate_msa_pdf"),
        "generate_custody_pdf": (".custody_generator", "generate_custody_pdf"),
        "generate_fee_schedule_pdf": (".fee_schedule_generator", "generate_fee_schedule_pdf"),
        "generate_risk_disclosure_pdf": (".risk_disclosure_generator", "generate_risk_disclosure_pdf"),
        "generate_kyc_pdf": (".kyc_generator", "generate_kyc_pdf"),
        "generate_derivatives_pdf": (".derivatives_generator", "generate_derivatives_pdf"),
    }
    if name in _legacy:
        module_path, attr = _legacy[name]
        import importlib
        mod = importlib.import_module(module_path, package=__name__)
        return getattr(mod, attr)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
