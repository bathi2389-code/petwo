"""
PETWO QA Automation — Marketplace Admin Console Page Object Model
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class AdminPortalPage(BasePage):
    # Locators
    ADMIN_HEADER = (By.XPATH, "//h1[contains(text(), 'PETWO Admin') or contains(text(), 'Administration')]")
    PENDING_VERIFICATIONS = (By.XPATH, "//*[contains(text(), 'Pending Verification') or contains(text(), 'VCI')]")
    COMMISSIONS_NAV = (By.XPATH, "//a[contains(@href, '/commissions') or contains(text(), 'Commission')]")
    AUDIT_LOGS_NAV = (By.XPATH, "//a[contains(@href, '/audit-logs') or contains(text(), 'Audit')]")

    def verify_admin_dashboard_loaded(self) -> bool:
        return self.is_visible(self.ADMIN_HEADER)
