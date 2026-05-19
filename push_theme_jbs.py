import requests
import time
import os
import sys

# Configuration for JBS Store
STORE_HASH = "okkyzcvfik"
ACCESS_TOKEN = "4mfc9bigszpojp6wipj4ezwctzc2zyx"
ZIP_FILE = "Epic Superstore-1.0.18.zip"

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
                    print("[+] Theme upload and processing COMPLETED successfully!")
                    return True
                elif status == 'FAILED':
                    print("[!] Theme processing FAILED.")
                    print(response.text)
                    return False
            else:
                print(f"[!] Error checking job status: {response.status_code}")
                print(response.text)
                return False
        except Exception as e:
            print(f"[!] Request error: {e}")
            
        time.sleep(5)

if __name__ == "__main__":
    job_id = upload_theme()
    if job_id:
        check_job_status(job_id)
