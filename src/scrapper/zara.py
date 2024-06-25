from datetime import datetime
from bs4 import BeautifulSoup
import requests
import json
import sys
import re

def extract_product_info(url):
    try:
        if url is None:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'url parameter is required in request body'})
            }

        site = 'https://www.zara.com'
        sec  = site + '/_sec/verify?provider=interstitial'

        headers = {
            'User-Agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                '(KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
            ),
            'Referer': url,
        }

        r = requests.get(url, headers=headers)

        html = r.content

        # extract `i`, `j` and `bm-verify`
        i = re.search(rb'var i = (\d+)', html)[1]
        j = re.search(rb'var j = i [+] Number[(]"(\d+)" [+] "(\d+)"[)]', html)
        j = j[1] + j[2]

        payload = {
            'bm-verify': re.search(rb'"bm-verify"\s*:\s*"([^"]+)', html)[1].decode(),
            'pow': int(i) + int(j)
        }

        rr = requests.post(sec, cookies=r.cookies, json=payload, headers=headers)

        rrr = requests.get(url, cookies=rr.cookies, headers=headers)

        html = rrr.content

        soup = BeautifulSoup(html, 'html.parser')

        product_script = soup.find('script', {'type': 'application/ld+json'})

        links = {}

        if product_script:
            json_data = product_script.string
            json_array = json.loads(json_data)

            for item in json_array:
                color_name = item["color"]
                image_url = item["image"]
                offer_url = item["offers"]["url"]

                if color_name not in links:
                    links[color_name] = {
                        "image": image_url,
                        "url": offer_url
                    }
        else:
            print("No JSON-LD script tag found")
            raise ValueError("No JSON-LD script tag found")

        script_tags = soup.findAll('script', {'data-compress': 'true', 'type': 'text/javascript'})

        product = {
            "name": "",
            "colors": []
        }

        if script_tags:
            for script_tag in script_tags:
                script_content = script_tag.string

                match = re.search(r'window\.zara\.viewPayload\s*=\s*(\{.*?\});', script_content, re.DOTALL)

                if match:
                    view_payload = match.group(1)
                    try:
                        json_obj = json.loads(view_payload)

                        if "product" in json_obj and "detail" in json_obj["product"]:
                            product["name"] = json_obj["product"]["name"]
                            for color in json_obj["product"]["detail"]["colors"]:
                                color_dict = {
                                    "name": color["name"],
                                    "hexCode": color["hexCode"],
                                    "sizes": []
                                }
                                for size in color["sizes"]:
                                    size_dict = {
                                        "name": size["name"],
                                        "availability": size["availability"],
                                        "oldPrice": size["oldPrice"],
                                        "price": size["price"],
                                        "discountPercentage": size["discountPercentage"]
                                    }
                                    color_dict["sizes"].append(size_dict)
                                product["colors"].append(color_dict)

                    except json.JSONDecodeError as e:
                        print("Failed to parse JSON:", e)
                        raise ValueError("Failed to parse JSON:", e)
                else:
                    continue
        else:
            print("No matching script tag found")
            raise ValueError("No matching script tag found")

        for color in product["colors"]:
            color_name = color["name"]
            if color_name in links:
                color["image"] = links[color_name]["image"]
                color["url"] = links[color_name]["url"]

        return product

    except (requests.RequestException, ValueError, json.JSONDecodeError, KeyError) as e:
        print(f"Error occurred: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python file.py <URL>")
        sys.exit(1)

    url = sys.argv[1]
    product_info = extract_product_info(url)
    if product_info:
        print(json.dumps(product_info, ensure_ascii=False))
    else:
        print("Failed to extract product information.")
