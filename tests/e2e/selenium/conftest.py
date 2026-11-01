"""
PETCO QA Automation — PyTest / Selenium Fixtures and Setup
"""
import pytest
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions


@pytest.fixture(scope="session")
def browser_name():
    return os.environ.get("BROWSER", "chrome").lower()


@pytest.fixture(scope="function")
def driver(browser_name):
    driver_instance = None

    if browser_name == "firefox":
        options = FirefoxOptions()
        options.add_argument("--headless")
        driver_instance = webdriver.Firefox(options=options)
    else:
        # Default Chrome / Chromium / Edge
        options = ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        try:
            driver_instance = webdriver.Chrome(options=options)
        except Exception:
            # Fallback to Edge if Chrome binary not found on Windows
            from selenium.webdriver.edge.options import Options as EdgeOptions
            edge_opts = EdgeOptions()
            edge_opts.add_argument("--headless=new")
            driver_instance = webdriver.Edge(options=edge_opts)

    driver_instance.implicitly_wait(5)
    yield driver_instance
    driver_instance.quit()
