"""
Reusable BigCommerce theme deploy for the JBS store.

Bumps the theme version, bundles with the Stencil CLI, uploads the zip to the
store, waits for the theme job, and optionally activates the new version.

Credentials are read from secrets.stencil.json (git-ignored). The store hash
defaults to the JBS store and can be overridden with --store-hash or the
BIGCOMMERCE_STORE_HASH environment variable.

Usage:
    python deploy_theme.py --dry-run                 # show the plan, change nothing
    python deploy_theme.py --bump patch              # bundle + upload (no activate)
    python deploy_theme.py --bump patch --activate   # bundle + upload + activate
    python deploy_theme.py --no-bump --activate      # deploy current version as-is

    python deploy_theme.py --bump minor --activate --variation "Camping"
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import requests

THEME_ROOT = Path(__file__).resolve().parent
CONFIG_JSON = THEME_ROOT / 'config.json'
PACKAGE_JSON = THEME_ROOT / 'package.json'
SECRETS_JSON = THEME_ROOT / 'secrets.stencil.json'

DEFAULT_STORE_HASH = 'okkyzcvfik'
API_BASE = 'https://api.bigcommerce.com/stores/{store}/v3'


def load_secrets():
    if not SECRETS_JSON.exists():
        sys.exit(f"ERROR: {SECRETS_JSON.name} not found. Copy secrets.stencil.example.json and fill it in.")
    with open(SECRETS_JSON, encoding='utf-8') as fh:
        data = json.load(fh)
    token = data.get('accessToken')
    if not token or token == 'YOUR_ACCESS_TOKEN':
        sys.exit("ERROR: secrets.stencil.json has no usable accessToken.")
    return data


def read_json(path):
    with open(path, encoding='utf-8') as fh:
        return json.load(fh)


def write_json(path, data):
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, indent=2)
        fh.write('\n')


def bump_version(current, part):
    match = re.fullmatch(r'(\d+)\.(\d+)\.(\d+)', current)
    if not match:
        sys.exit(f"ERROR: cannot parse version '{current}' (expected x.y.z).")
    major, minor, patch = (int(x) for x in match.groups())
    if part == 'major':
        major, minor, patch = major + 1, 0, 0
    elif part == 'minor':
        minor, patch = minor + 1, 0
    else:
        patch += 1
    return f"{major}.{minor}.{patch}"


def plan_version(bump):
    config = read_json(CONFIG_JSON)
    current = config.get('version')
    new = current if bump == 'none' else bump_version(current, bump)
    return current, new, config


def zip_name(name, version):
    return f"{name}-{version}.zip"


def bundle(zip_path):
    print(f"[*] Bundling theme with Stencil CLI -> {zip_path.name} ...")
    stencil = 'stencil.cmd' if os.name == 'nt' else 'stencil'
    result = subprocess.run(
        [stencil, 'bundle'],
        cwd=THEME_ROOT,
        capture_output=True,
        text=True,
        shell=False,
    )
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(f"ERROR: stencil bundle failed (exit {result.returncode}).")
    if not zip_path.exists():
        sys.exit(f"ERROR: expected bundle not found at {zip_path}.")
    print(f"[+] Bundle ready: {zip_path.name} ({zip_path.stat().st_size // 1024} KB)")


def upload(zip_path, store_hash, token):
    print(f"[*] Uploading {zip_path.name} to store {store_hash} ...")
    url = API_BASE.format(store=store_hash) + '/themes'
    headers = {'X-Auth-Token': token, 'Accept': 'application/json'}
    with open(zip_path, 'rb') as fh:
        response = requests.post(url, headers=headers, files={'file': (zip_path.name, fh, 'application/zip')})
    if response.status_code != 201:
        sys.exit(f"ERROR: upload failed {response.status_code}: {response.text[:300]}")
    job_id = response.json().get('job_id')
    print(f"[+] Upload accepted. Job ID: {job_id}")
    return job_id


def wait_for_job(job_id, store_hash, token):
    print(f"[*] Waiting for theme job {job_id} ...")
    url = API_BASE.format(store=store_hash) + f'/themes/jobs/{job_id}'
    headers = {'X-Auth-Token': token, 'Accept': 'application/json'}
    while True:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            sys.exit(f"ERROR: job status failed {response.status_code}: {response.text[:300]}")
        status = response.json().get('data', {}).get('status')
        print(f"    status: {status}")
        if status == 'COMPLETED':
            return
        if status == 'FAILED':
            sys.exit("ERROR: theme processing FAILED.")
        time.sleep(5)


def activate(store_hash, token, variation_hint):
    url = API_BASE.format(store=store_hash) + '/themes'
    headers = {'X-Auth-Token': token, 'Accept': 'application/json'}
    themes = requests.get(url, headers=headers).json().get('data', [])
    if not themes:
        sys.exit("ERROR: no themes found to activate.")
    themes.sort(key=lambda t: t.get('updated_at', ''), reverse=True)
    latest = themes[0]
    variations = latest.get('variations', [])
    if not variations:
        sys.exit("ERROR: latest theme has no variations.")
    chosen = None
    if variation_hint:
        chosen = next((v for v in variations if variation_hint.lower() in v.get('name', '').lower()), None)
    if not chosen:
        chosen = variations[0]
    print(f"[*] Activating theme '{latest.get('name')}' variation '{chosen.get('name')}' ...")
    activate_url = API_BASE.format(store=store_hash) + '/themes/actions/activate'
    response = requests.post(activate_url, headers={**headers, 'Content-Type': 'application/json'},
                             json={'variation_id': chosen.get('uuid')})
    if response.status_code == 204:
        print("[+] Theme activated.")
    else:
        sys.exit(f"ERROR: activation failed {response.status_code}: {response.text[:300]}")


def main():
    parser = argparse.ArgumentParser(description="Bump, bundle, upload and activate the JBS theme.")
    parser.add_argument('--dry-run', action='store_true', help="Show the plan and change nothing.")
    parser.add_argument('--bump', choices=['patch', 'minor', 'major', 'none'], default='patch',
                        help="Version bump to apply before bundling (default: patch).")
    parser.add_argument('--activate', action='store_true', help="Activate the uploaded theme.")
    parser.add_argument('--variation', default=None, help="Substring to pick the variation to activate.")
    parser.add_argument('--store-hash', default=os.getenv('BIGCOMMERCE_STORE_HASH', DEFAULT_STORE_HASH))
    parser.add_argument('--skip-bundle', action='store_true', help="Upload an existing zip instead of bundling.")
    args = parser.parse_args()

    current, new, config = plan_version(args.bump)
    name = config.get('name', 'Theme')
    zip_path = THEME_ROOT / zip_name(name, new)
    secrets = load_secrets()
    token = secrets['accessToken']

    print("=" * 78)
    print(f"JBS theme deploy  |  store {args.store_hash}  |  {'DRY-RUN' if args.dry_run else 'APPLY'}")
    print("=" * 78)
    print(f"  Theme name:     {name}")
    print(f"  Version:        {current} -> {new}  (bump={args.bump})")
    print(f"  Bundle zip:     {zip_path.name}")
    print(f"  Activate:       {args.activate}")
    print(f"  Writes:         config.json, package.json" if args.bump != 'none' else "  Writes:         (none)")

    if args.dry_run:
        print("\nDRY-RUN complete. No version bump, no bundle, no upload.")
        return

    if args.bump != 'none':
        config['version'] = new
        write_json(CONFIG_JSON, config)
        package = read_json(PACKAGE_JSON)
        package['version'] = new
        write_json(PACKAGE_JSON, package)
        print(f"[+] Version bumped to {new} in config.json and package.json.")

    if not args.skip_bundle:
        bundle(zip_path)

    job_id = upload(zip_path, args.store_hash, token)
    wait_for_job(job_id, args.store_hash, token)

    if args.activate:
        activate(args.store_hash, token, args.variation)

    print("\n[+] Deploy complete.")


if __name__ == '__main__':
    main()
