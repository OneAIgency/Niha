"""
Unit tests for price_scraper.XPath extraction.
Run from backend container: pytest tests/test_price_scraper.py -v
"""


from app.services.price_scraper import PriceScraper


class TestExtractViaXpath:
    """Tests for PriceScraper._extract_via_xpath."""

    def test_extracts_price_from_table_cell(self):
        """XPath targeting table cell returns parsed price."""
        html = """
        <html><body><table>
            <tr><td>Label</td><td>100</td></tr>
            <tr><td>Other</td><td>50.5</td></tr>
            <tr><td>EU Carbon</td><td>71.25</td></tr>
        </table></body></html>
        """
        scraper = PriceScraper()
        # tr[4] = 4th tr (1-indexed in XPath), td[2] = 2nd cell
        xpath = "/html/body/table/tr[3]/td[2]"
        result = scraper._extract_via_xpath(html, xpath)
        assert result == 71.25

    def test_extracts_price_with_whitespace(self):
        """Price with surrounding whitespace is parsed correctly."""
        html = '<html><body><div id="price">  78.90  </div></body></html>'
        scraper = PriceScraper()
        result = scraper._extract_via_xpath(html, "//div[@id='price']")
        assert result == 78.90

    def test_extracts_price_with_currency_symbol(self):
        """Price with € symbol is parsed (strip removes it)."""
        html = '<html><body><span>€83.50</span></body></html>'
        scraper = PriceScraper()
        result = scraper._extract_via_xpath(html, "//span")
        assert result == 83.50

    def test_returns_none_for_empty_content(self):
        """Empty content returns None."""
        scraper = PriceScraper()
        assert scraper._extract_via_xpath("", "//div") is None

    def test_returns_none_for_empty_xpath(self):
        """Empty or whitespace-only xpath returns None."""
        scraper = PriceScraper()
        html = "<html><body><div>75</div></body></html>"
        assert scraper._extract_via_xpath(html, "") is None
        assert scraper._extract_via_xpath(html, "   ") is None

    def test_returns_none_for_no_match(self):
        """XPath that matches no element returns None."""
        html = "<html><body><div>75</div></body></html>"
        scraper = PriceScraper()
        result = scraper._extract_via_xpath(html, "//span[@id='missing']")
        assert result is None

    def test_returns_none_for_invalid_html(self):
        """Malformed HTML raises internally; we catch and return None."""
        scraper = PriceScraper()
        result = scraper._extract_via_xpath("<html><broken", "//div")
        assert result is None
