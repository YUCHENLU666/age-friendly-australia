import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv


# Find the project folder
project_folder = Path(__file__).resolve().parents[1]

# Load the API key
load_dotenv(project_folder / ".env")
api_key = os.getenv("EPA_API_KEY")

if not api_key:
    print("EPA_API_KEY was not found.")
    raise SystemExit(1)


# EPA API details
url = "https://gateway.api.epa.vic.gov.au/environmentMonitoring/v1/sites/"

headers = {
    "Accept": "application/json",
    "User-Agent": "age-friendly-australia/1.0",
    "X-API-Key": api_key
}

params = {
    "environmentalSegment": "air"
}


# Get the EPA data
try:
    response = requests.get(
        url,
        headers=headers,
        params=params,
        timeout=30
    )
except requests.RequestException as error:
    print("Could not connect to the EPA API.")
    print(error)
    raise SystemExit

print("Status code:", response.status_code)

if response.status_code != 200:
    print("Failed to get EPA air quality data.")
    print(response.text[:1000])
    raise SystemExit(1)


# Convert the response to JSON
try:
    data = response.json()
except ValueError:
    print("The EPA response was not valid JSON.")
    raise SystemExit(1)

records = data.get("records", [])

if not isinstance(records, list):
    print("The EPA response does not contain a valid records list.")
    raise SystemExit(1)


# Add simple source information
output_data = {
    "source": "EPA Victoria Environment Monitoring API",
    "sourceUrl": response.url,
    "collectedAtUTC": datetime.now(timezone.utc).isoformat(),
    **data
}


# Save the full response
output_folder = project_folder / "data" / "raw"
output_folder.mkdir(parents=True, exist_ok=True)

output_file = output_folder / "epa_air_quality.json"

with open(output_file, "w", encoding="utf-8") as file:
    json.dump(output_data, file, indent=2, ensure_ascii=False)


print("Records reported by EPA:", data.get("totalRecords"))
print("Records downloaded:", len(records))
print("EPA data saved to:", output_file)