from datetime import datetime
from bs4 import BeautifulSoup
import requests
import json
import sys

def extract_product_info(url):
    try:
        initial_response = requests.get(url)
        initial_response.raise_for_status()

        response = requests.get(url)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        product_price = None
        product_name = None
        current_utc_datetime = datetime.utcnow().isoformat()

        for script_tag in soup.find_all('script'):
            script_content = script_tag.string
            if script_content and script_content.strip():
                try:
                    json_data = json.loads(script_content)
                    if "offers" in json_data and "price" in json_data["offers"]:
                        product_price = json_data["offers"]["price"]
                    if "name" in json_data:
                        product_name = json_data["name"]
                        break
                except json.JSONDecodeError:
                    continue

        if product_price is not None and product_name is not None:
            return {
                "name": product_name,
                "url": url,
                "price": product_price,
                "created": current_utc_datetime
            }
        else:
            raise ValueError("Price or Name parameters not found in any script tag.")
    except (requests.RequestException, ValueError) as e:
        print(f"Error occurred: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python file.py <URL>")
        sys.exit(1)

    url = sys.argv[1]
    product_info = extract_product_info(url)
    if product_info:
        print(json.dumps(product_info))
    else:
        print("Failed to extract product information.")
