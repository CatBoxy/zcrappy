import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import sys
import os
from datetime import datetime

chrome_options = Options()

chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

service = Service(executable_path="/usr/local/bin/chromedriver/chromedriver")
driver = webdriver.Chrome(service=service, options=chrome_options)

url = sys.argv[1]

driver.get(url)

WebDriverWait(driver, 5).until(
  EC.presence_of_element_located((By.CLASS_NAME, "andes-money-amount__fraction"))
)

price_element = driver.find_element(By.CLASS_NAME, "andes-money-amount__fraction")
title_element = driver.find_element(By.CLASS_NAME, "ui-pdp-title")

time.sleep(5)

file_name = os.path.basename(__file__)
current_utc_datetime = datetime.utcnow().isoformat()

data = {
    "name": title_element.text,
    "url": url,
    "price": price_element.text,
    "created": current_utc_datetime
}

print(json.dumps(data))

driver.quit()
