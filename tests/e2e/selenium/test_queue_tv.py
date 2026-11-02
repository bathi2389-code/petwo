"""
PETWO QA E2E — In-Clinic Reception TV Display Suite
"""
import pytest
from pages.queue_tv_page import QueueTvPage


def test_reception_tv_screen_renders_for_hyderabad_clinic(driver):
    location_id = "loc-banjara-hills-01"
    tv_url = f"http://localhost:3000/queue/{location_id}"
    page = QueueTvPage(driver)
    page.open(tv_url)

    # Verify TV display is active
    assert page.is_visible(page.BRANDING_HEADER) or page.is_visible(page.NOW_SERVING_CARD)
