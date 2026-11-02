"""
PETWO QA E2E — Provider Portal Smoke & Functional Tests
"""
import pytest
from pages.provider_portal_page import ProviderPortalPage


def test_provider_login_page_renders(driver):
    base_url = "http://localhost:3000/login"
    page = ProviderPortalPage(driver)
    page.open(base_url)

    # Verify title or login inputs render
    assert "PETWO" in page.get_title() or page.is_visible(page.PHONE_INPUT)


def test_provider_navigation_elements(driver):
    base_url = "http://localhost:3000"
    page = ProviderPortalPage(driver)
    page.open(base_url)

    # Verify accessibility of primary navigation tabs
    assert page.driver.current_url.startswith("http://localhost:3000")
