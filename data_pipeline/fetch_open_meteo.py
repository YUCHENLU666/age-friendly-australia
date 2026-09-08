import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import requests


input_file = Path("data/sample/EP1_sample_events_dataset.csv")

# Read activity data
with open(input_file, "r", encoding="utf-8-sig") as file:
    reader = csv.reader(file)
    columns = [column.strip() for column in next(reader)]
    activities = []

    for line_number, row in enumerate(reader, start=2):
        if len(row) < len(columns):
            print(f"Skipped incomplete row {line_number}")
            continue

        # Keep extra commas in source_note
        if len(row) > len(columns):
            row = row[:len(columns) - 1] + [
                ",".join(row[len(columns) - 1:])
            ]
            print(f"Fixed extra comma in row {line_number}")

        row = [value.strip() for value in row]
        activities.append(dict(zip(columns, row)))

# Find all suburbs
suburbs = sorted({
    activity.get("suburb", "").strip()
    for activity in activities
    if activity.get("suburb", "").strip()
})

print("Suburbs found:")
print(suburbs)

weather_results = []

for suburb in suburbs:
    # An LGA is not an exact activity location
    if "LGA" in suburb.upper():
        weather_results.append({
            "suburb": suburb,
            "latitude": None,
            "longitude": None,
            "weather_available": False,
            "reason": "Exact location not provided",
            "weather": None
        })

        print(f"Weather not available for {suburb}")
        continue

    # Find the suburb coordinates
    geocoding_url = "https://geocoding-api.open-meteo.com/v1/search"

    geocoding_params = {
        "name": suburb,
        "count": 10,
        "language": "en",
        "format": "json",
        "countryCode": "AU"
    }

    geocoding_response = requests.get(
        geocoding_url,
        params=geocoding_params,
        timeout=30
    )

    if geocoding_response.status_code != 200:
        weather_results.append({
            "suburb": suburb,
            "latitude": None,
            "longitude": None,
            "weather_available": False,
            "reason": "Geocoding request failed",
            "weather": None
        })

        print(f"Failed to find {suburb}")
        continue

    locations = geocoding_response.json().get("results", [])

    # Select the location in Victoria
    location = None

    for item in locations:
        if item.get("admin1") == "Victoria":
            location = item
            break

    if location is None:
        weather_results.append({
            "suburb": suburb,
            "latitude": None,
            "longitude": None,
            "weather_available": False,
            "reason": "Location could not be matched",
            "weather": None
        })

        print(f"No Victorian location found for {suburb}")
        continue

    latitude = location["latitude"]
    longitude = location["longitude"]

    # Get weather and UV data
    weather_url = "https://api.open-meteo.com/v1/forecast"

    weather_params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": (
            "temperature_2m,"
            "apparent_temperature,"
            "precipitation_probability,"
            "weather_code,"
            "wind_speed_10m,"
            "uv_index"
        ),
        "timezone": "Australia/Melbourne",
        "temperature_unit": "celsius",
        "wind_speed_unit": "kmh",
        "forecast_days": 7
    }

    weather_response = requests.get(
        weather_url,
        params=weather_params,
        timeout=30
    )

    if weather_response.status_code == 200:
        weather_results.append({
            "suburb": suburb,
            "latitude": latitude,
            "longitude": longitude,
            "weather_available": True,
            "reason": None,
            "weather": weather_response.json()
        })

        print(f"Weather collected for {suburb}")

    else:
        weather_results.append({
            "suburb": suburb,
            "latitude": latitude,
            "longitude": longitude,
            "weather_available": False,
            "reason": "Weather request failed",
            "weather": None
        })

        print(f"Failed to get weather for {suburb}")

# Create output folder
output_folder = Path("data/raw")
output_folder.mkdir(parents=True, exist_ok=True)

# Save weather data
output_file = output_folder / "melbourne_suburb_weather.json"

output_data = {
    "source": "Open-Meteo",
    "coverage": "Suburbs in the activity dataset",
    "fetched_at": datetime.now(timezone.utc).isoformat(),
    "locations": weather_results
}

with open(output_file, "w", encoding="utf-8") as file:
    json.dump(output_data, file, indent=2, ensure_ascii=False)

print(f"Weather data saved to: {output_file}")