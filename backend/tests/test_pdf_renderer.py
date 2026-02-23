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
