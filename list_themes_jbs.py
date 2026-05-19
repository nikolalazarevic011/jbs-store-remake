import requests
import json

STORE_HASH = "okkyzcvfik"
ACCESS_TOKEN = "4mfc9bigszpojp6wipj4ezwctzc2zyx"
HEADERS = {
    "X-Auth-Token": ACCESS_TOKEN,
    "Accept": "application/json"
}

response = requests.get(f"https://api.bigcommerce.com/stores/{STORE_HASH}/v3/themes", headers=HEADERS)
if response.status_code == 200:
    print(json.dumps(response.json(), indent=2))
else:
    print(f"Error: {response.status_code}")
    print(response.text)
