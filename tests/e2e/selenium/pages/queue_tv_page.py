"""
PETWO QA Automation — In-Clinic Reception TV Waiting Room Page Object Model
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class QueueTvPage(BasePage):
    # Locators
    BRANDING_HEADER = (By.XPATH, "//header//*[contains(text(), 'PETWO') or contains(text(), 'In-Clinic')]")
    NOW_SERVING_CARD = (By.XPATH, "//*[contains(text(), 'NOW SERVING') or contains(text(), 'Serving')]")
    TOKEN_NUMBER = (By.XPATH, "//*[contains(text(), 'Token') or contains(text(), 'A-')]")
    UP_NEXT_SECTION = (By.XPATH, "//*[contains(text(), 'UP NEXT') or contains(text(), 'Upcoming')]")
    ANNOUNCEMENT_BANNER = (By.XPATH, "//*[contains(text(), 'Hyderabad') or contains(text(), 'Emergency')]")

    def verify_reception_tv_elements_loaded(self) -> bool:
        return (
            self.is_visible(self.NOW_SERVING_CARD)
            and self.is_visible(self.UP_NEXT_SECTION)
        )
