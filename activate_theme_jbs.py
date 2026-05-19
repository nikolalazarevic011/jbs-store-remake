import requests
import json

STORE_HASH = "okkyzcvfik"
ACCESS_TOKEN = "4mfc9bigszpojp6wipj4ezwctzc2zyx"
HEADERS = {
    "X-Auth-Token": ACCESS_TOKEN,
    "Accept": "application/json",
    "Content-Type": "application/json"
}

def activate_latest_theme():
    # 1. Get all themes
    response = requests.get(f"https://api.bigcommerce.com/stores/{STORE_HASH}/v3/themes", headers=HEADERS)
    if response.status_code != 200:
        print(f"Error fetching themes: {response.status_code}")
        return

    themes = response.json().get('data', [])
    if not themes:
        print("No themes found.")
        return

    # 2. Sort themes by updated_at descending
    themes.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
    
    latest_theme = themes[0]
    print(f"[*] Found latest theme: {latest_theme.get('name')} (UUID: {latest_theme.get('uuid')})")
    
    # 3. Get variations
    variations = latest_theme.get('variations', [])
    if not variations:
        print("No variations found for this theme.")
        return
    
    # Look for 'Camping & Outdoors' or similar
    variation_to_activate = None
    for v in variations:
        if 'Camping' in v.get('name') or 'Outdoor' in v.get('name'):
            variation_to_activate = v
            break
    
    if not variation_to_activate:
        variation_to_activate = variations[0] # Fallback to first one
        
    variation_uuid = variation_to_activate.get('uuid')
    variation_name = variation_to_activate.get('name')
    print(f"[*] Selected variation: {variation_name} (UUID: {variation_uuid})")
    
    # 4. Activate
    activate_url = f"https://api.bigcommerce.com/stores/{STORE_HASH}/v3/themes/actions/activate"
    payload = {
        "variation_id": variation_uuid
    }
    
    response = requests.post(activate_url, headers=HEADERS, json=payload)
    if response.status_code == 204:
        print(f"[+] Successfully activated theme variation '{variation_name}'!")
    else:
        print(f"[!] Activation failed with status {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    activate_latest_theme()
