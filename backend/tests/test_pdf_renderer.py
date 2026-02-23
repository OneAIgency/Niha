"""Tests for the HTML + WeasyPrint PDF renderer."""
import pytest
from app.services.pdf_generator.renderer import render_pdf


def test_render_pdf_returns_valid_pdf():
    """render_pdf should return bytes starting with PDF magic number."""
    result = render_pdf("board_resolution", {})
    assert isinstance(result, bytes), "Expected bytes output"
    assert result[:4] == b"%PDF", f"Expected PDF magic number, got: {result[:20]}"
    assert len(result) > 5_000, f"PDF too small ({len(result)} bytes) — likely empty or broken"


def test_render_pdf_with_doc_ref():
    """doc_ref context variable is accepted without errors."""
    result = render_pdf("board_resolution", {"doc_ref": "NIHA-BR-2026-001"})
    assert result[:4] == b"%PDF"
    assert len(result) > 5_000


def test_render_pdf_with_explicit_doc_date():
    """Explicit doc_date overrides the default today() value without errors."""
    result = render_pdf("board_resolution", {"doc_date": "01 January 2026"})
    assert result[:4] == b"%PDF"
    assert len(result) > 5_000


from app.services.pdf_generator.nda_generator import generate_nda_pdf


def test_nda_generator_returns_pdf():
    """NDA generator produces a valid PDF."""
    result = generate_nda_pdf(
        client_entity_name="Test Corp Ltd",
        client_representative="John Smith",
        client_email="john@testcorp.com",
    )
    assert result[:4] == b"%PDF"
    assert len(result) > 10_000


def test_nda_generator_with_all_params():
    """NDA generator accepts all optional parameters."""
    from datetime import date
    result = generate_nda_pdf(
        client_entity_name="Acme Corp",
        client_entity_type="Limited Company",
        client_jurisdiction="Hong Kong SAR",
        client_representative="Jane Doe",
        client_email="jane@acme.com",
        effective_date=date(2026, 1, 1),
        doc_ref="NIHA-NDA-2026-TEST",
    )
    assert result[:4] == b"%PDF"
    assert len(result) > 10_000


def test_nda_generator_signature_preserved():
    """Function signature must remain identical for API compatibility."""
    import inspect
    sig = inspect.signature(generate_nda_pdf)
    params = list(sig.parameters.keys())
    expected = ["client_entity_name", "client_entity_type", "client_jurisdiction",
                "client_representative", "client_email", "effective_date",
                "doc_ref", "output_path"]
    assert params == expected, f"Signature changed — got {params}, expected {expected}"
