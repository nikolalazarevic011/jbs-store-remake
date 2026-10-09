import requests
import time
import os
import sys

# Configuration for JBS Store
STORE_HASH = "okkyzcvfik"
ACCESS_TOKEN = "4mfc9bigszpojp6wipj4ezwctzc2zyx"
import json

with open("config.json", "r") as _f:
    _cfg = json.load(_f)
ZIP_FILE = f"Epic Superstore-{_cfg.get('version', '1.0.25')}.zip"


API_BASE_URL = f"https://api.bigcommerce.com/stores/{STORE_HASH}/v3"
HEADERS = {
    "X-Auth-Token": ACCESS_TOKEN,
    "Accept": "application/json"
}

def upload_theme():
    print(f"[*] Uploading {ZIP_FILE} to BigCommerce store {STORE_HASH}...")
    
    if not os.path.exists(ZIP_FILE):
        print(f"[!] Error: {ZIP_FILE} not found.")
        return

    url = f"{API_BASE_URL}/themes"
    
    with open(ZIP_FILE, 'rb') as f:
        files = {
            'file': (ZIP_FILE, f, 'application/zip')
        }
        response = requests.post(url, headers=HEADERS, files=files)

    if response.status_code == 201:
        data = response.json()
        job_id = data.get('job_id')
        print(f"[+] Upload initiated! Job ID: {job_id}")
        return job_id
    else:
        print(f"[!] Upload failed with status {response.status_code}")
        print(response.text)
        return None

def check_job_status(job_id):
    print(f"[*] Checking status of job {job_id}...")
    url = f"{API_BASE_URL}/themes/jobs/{job_id}"
    
    while True:
        try:
            response = requests.get(url, headers=HEADERS)
            if response.status_code == 200:
                data = response.json().get('data', {})
                status = data.get('status')
                print(f"[*] Current status: {status}")
                
                if status == 'COMPLETED':
                    theme_uuid = data.get('result', {}).get('theme_id')
                    print(f"[+] Theme upload and processing COMPLETED successfully! UUID: {theme_uuid}")
                    return theme_uuid
                elif status == 'FAILED':
                    print("[!] Theme processing FAILED.")
                    print(response.text)
                    return None
            else:
                print(f"[!] Error checking job status: {response.status_code}")
                print(response.text)
                return None
        except Exception as e:
            print(f"[!] Request error: {e}")
            
        time.sleep(5)

def get_variation_uuid(theme_uuid, variation_name_or_id):
    url = f"{API_BASE_URL}/themes/{theme_uuid}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        data = response.json().get('data', {})
        for var in data.get('variations', []):
            if (var.get('name', '').lower() == variation_name_or_id.lower()
                    or var.get('external_id', '').lower() == variation_name_or_id.lower()):
                return var.get('uuid')
    print(f"[!] Variation '{variation_name_or_id}' not found for theme {theme_uuid}")
    return None

def activate_theme(theme_uuid):
    variation_uuid = get_variation_uuid(theme_uuid, "camping_outdoors")
    if not variation_uuid:
        print("[!] Cannot activate theme: variation UUID not found.")
        return False

    print(f"[*] Activating theme {theme_uuid} with variation {variation_uuid}...")
    url = f"{API_BASE_URL}/themes/actions/activate"

    payload = {
        "variation_id": variation_uuid,
        "theme_uuid": theme_uuid,
        # Use the configuration shipped in the uploaded zip rather than
        # whatever the previously active configuration happened to be.
        "which": "original"
    }

    response = requests.post(url, headers=HEADERS, json=payload)

    if response.status_code == 204:
        print("[+] Theme ACTIVATED successfully on JBS store!")
        return True
    else:
        print(f"[!] Activation failed with status {response.status_code}")
        print(response.text)
        return False

if __name__ == "__main__":
    job_id = upload_theme()
    if job_id:
        theme_uuid = check_job_status(job_id)
        if theme_uuid:
            activate_theme(theme_uuid)
