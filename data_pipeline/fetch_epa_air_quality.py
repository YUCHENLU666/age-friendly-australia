import os
from pathlib import Path

import requests
from dotenv import load_dotenv


project_folder = Path(__file__).resolve().parents[1]
load_dotenv(project_folder / ".env")

api_key = os.getenv("EPA_API_KEY")

if not api_key:
    print("EPA_API_KEY was not found.")
    raise SystemExit

url = "https://gateway.api.epa.vic.gov.au/environmentMonitoring/v1/sites/"

headers = {
    "Accept": "application/json",
    "User-Agent": "age-friendly-australia/1.0",
    "X-API-Key": api_key
}

params = {
    "environmentalSegment": "air"
}

response = requests.get(
    url,
    headers=headers,
    params=params,
    timeout=30
)

print("Requested URL:", response.url)
print("Status code:", response.status_code)
print(response.text[:1000])