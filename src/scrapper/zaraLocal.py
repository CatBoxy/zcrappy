from bs4 import BeautifulSoup
from datetime import datetime
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import sys
import re
from itertools import cycle

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
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.6',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www.zara.com/ar/',
            'Sec-CH-UA': '"Brave";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Linux"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'Sec-GPC': '1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        }

        current_utc_datetime = datetime.utcnow().isoformat()

        for _ in range(9):
            session = requests.Session()
            retries = Retry(total=5, backoff_factor=2, status_forcelist=[500, 502, 503, 504])
            adapter = HTTPAdapter(max_retries=retries)
            session.mount('http://', adapter)
            session.mount('https://', adapter)


            r = session.get(url, headers=headers, timeout=20)
            r.raise_for_status()
            html = r.content
            # extract `i`, `j` and `bm-verify`
            i = re.search(rb'var i = (\d+)', html)[1]
            j = re.search(rb'var j = i [+] Number[(]"(\d+)" [+] "(\d+)"[)]', html)
            j = j[1] + j[2]
            payload = {
                'bm-verify': re.search(rb'"bm-verify"\s*:\s*"([^"]+)', html)[1].decode(),
                'pow': int(i) + int(j)
            }
            rr = session.post(sec, cookies=r.cookies, json=payload, headers=headers)
            rrr = session.get(url, cookies=rr.cookies, headers=headers)
            finalHtml = rrr.content
            soup = BeautifulSoup(finalHtml, 'html.parser')
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
                # print("No JSON-LD script tag found")
                raise ValueError("No JSON-LD script tag found")
            script_tags = soup.findAll('script', {'data-compress': 'true', 'type': 'text/javascript'})
            product = {
                "name": "",
                "created": current_utc_datetime,
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
                                        "created": current_utc_datetime,
                                        "hexCode": color["hexCode"],
                                        "sizes": []
                                    }
                                    for size in color["sizes"]:
                                        size_dict = {
                                            "created": current_utc_datetime
                                        }
                                        if "name" in size and size["name"] is not None:
                                            size_dict["name"] = size["name"]
                                        if "availability" in size and size["availability"] is not None:
                                            size_dict["availability"] = size["availability"]
                                        if "oldPrice" in size and size["oldPrice"] is not None:
                                            size_dict["oldPrice"] = size["oldPrice"]
                                        if "price" in size and size["price"] is not None:
                                            size_dict["price"] = size["price"]
                                        if "discountPercentage" in size and size["discountPercentage"] is not None:
                                            size_dict["discountPercentage"] = size["discountPercentage"]
                                        if "futurePrice" in size and size["futurePrice"] is not None:
                                            size_dict["futurePrice"] = {}
                                            if "price" in size["futurePrice"] and size["futurePrice"]["price"] is not None:
                                                size_dict["futurePrice"]["price"] = size["futurePrice"]["price"]
                                            if "discountPercentage" in size["futurePrice"] and size["futurePrice"]["discountPercentage"] is not None:
                                                size_dict["futurePrice"]["discountPercentage"] = size["futurePrice"]["discountPercentage"]
                                            if "description" in size["futurePrice"] and size["futurePrice"]["description"] is not None:
                                                size_dict["futurePrice"]["description"] = size["futurePrice"]["description"]
                                        color_dict["sizes"].append(size_dict)
                                    product["colors"].append(color_dict)
                        except json.JSONDecodeError as e:
                            # print("Failed to parse JSON:", e)
                            raise ValueError("Failed to parse JSON:", e)
                    else:
                        continue
            else:
                # print("No matching script tag found")
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
