"""
PETCO QA Automation Framework — Selenium Base Page Object Model
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.common.exceptions import TimeoutException


class BasePage:
    def __init__(self, driver: WebDriver, timeout: int = 10):
        self.driver = driver
        self.timeout = timeout
        self.wait = WebDriverWait(driver, timeout)

    def open(self, url: str):
        self.driver.get(url)
        return self

    def find(self, locator: tuple):
        return self.wait.until(EC.presence_of_element_located(locator))

    def find_visible(self, locator: tuple):
        return self.wait.until(EC.visibility_of_element_located(locator))

    def click(self, locator: tuple):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()
        return self

    def type(self, locator: tuple, text: str):
        element = self.find_visible(locator)
        element.clear()
        element.send_keys(text)
        return self

    def get_text(self, locator: tuple) -> str:
        return self.find_visible(locator).text

    def is_visible(self, locator: tuple) -> bool:
        try:
            self.find_visible(locator)
            return True
        except TimeoutException:
            return False

    def get_title(self) -> str:
        return self.driver.title
