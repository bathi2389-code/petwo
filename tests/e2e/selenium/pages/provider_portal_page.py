"""
PETCO QA Automation — Provider Portal Page Object Model
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class ProviderPortalPage(BasePage):
    # Locators
    PHONE_INPUT = (By.CSS_SELECTOR, "input[type='tel'], input[name='phone']")
    OTP_INPUT = (By.CSS_SELECTOR, "input[type='text'], input[name='otp']")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    DASHBOARD_TITLE = (By.XPATH, "//h1[contains(text(), 'Provider Dashboard') or contains(text(), 'Overview')]")
    SERVICES_NAV = (By.XPATH, "//a[contains(@href, '/services') or contains(text(), 'Services')]")
    BOOKINGS_NAV = (By.XPATH, "//a[contains(@href, '/bookings') or contains(text(), 'Bookings')]")
    EARNINGS_NAV = (By.XPATH, "//a[contains(@href, '/earnings') or contains(text(), 'Earnings')]")

    def login_with_otp(self, phone: str, otp: str = "123456"):
        self.type(self.PHONE_INPUT, phone)
        self.click(self.SUBMIT_BUTTON)
        # If OTP field appears
        if self.is_visible(self.OTP_INPUT):
            self.type(self.OTP_INPUT, otp)
            self.click(self.SUBMIT_BUTTON)
        return self

    def navigate_to_services(self):
        self.click(self.SERVICES_NAV)
        return self

    def navigate_to_bookings(self):
        self.click(self.BOOKINGS_NAV)
        return self

    def navigate_to_earnings(self):
        self.click(self.EARNINGS_NAV)
        return self
