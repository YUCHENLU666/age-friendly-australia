import json
import math
import os
import sqlite3
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

import requests


# ======================================================
# Project paths
# ======================================================

# Project root:
# age-friendly-australia/
PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Current Iteration 2 SQLite database
DATABASE_FILE = (
    PROJECT_ROOT
    / "age-friendly-database"
    / "age-friendly.db"
)

# Raw pipeline output
RAW_OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "melbourne_suburb_weather.json"
)

# File actually used by WeatherCard.vue
PUBLIC_OUTPUT_FILE = (
    PROJECT_ROOT
    / "public"
    / "data"
    / "melbourne_suburb_weather.json"
)

# Refresh status is separate: failed requests never replace the forecast.
STATUS_OUTPUT_FILE = PUBLIC_OUTPUT_FILE.with_name("weather_refresh_status.json")
MAX_ATTEMPTS = 3


# ======================================================
# Safe API requests and output files
# ======================================================

def request_json(url, params=None, validate=None):
    for attempt in range(MAX_ATTEMPTS):
        response = None
        try:
            response = requests.get(url, params=params, timeout=(10, 30))
            response.raise_for_status()
            data = response.json()
            if validate is not None:
                validate(data)
            return data
        except (requests.RequestException, ValueError):
            if attempt == MAX_ATTEMPTS - 1:
                raise
            # Retry temporary network failures, not invalid API parameters.
            if response is not None and response.status_code in (400, 401, 403, 404):
                raise
            time.sleep(2 ** (attempt + 1))


def validate_hourly(data, fields):
    if not isinstance(data, dict) or data.get("error"):
        raise ValueError("Invalid forecast response")
    if data.get("timezone") != "Australia/Melbourne":
        raise ValueError("Forecast timezone is not Australia/Melbourne")
    hourly = data.get("hourly")
    times = hourly.get("time") if isinstance(hourly, dict) else None
    if not isinstance(times, list) or not times:
        raise ValueError("Hourly timestamps are missing")
    for timestamp in times:
        if not isinstance(timestamp, str):
            raise ValueError("Invalid hourly timestamp")
        parsed = datetime.fromisoformat(timestamp)
        if parsed.tzinfo is not None or parsed.minute or parsed.second:
            raise ValueError("Invalid local hourly timestamp")
    if times != sorted(times):
        raise ValueError("Hourly timestamps are out of order")
    for field in fields:
        values = hourly.get(field)
        if not isinstance(values, list) or len(values) != len(times):
            raise ValueError(f"Invalid hourly array: {field}")
        # Nulls can occur beyond the air-quality model's forecast horizon.
        numbers = [value for value in values if value is not None]
        if not numbers:
            raise ValueError(f"No forecast values for {field}")
        for value in numbers:
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                raise ValueError(f"Invalid numeric value for {field}")
            if field != "temperature_2m" and value < 0:
                raise ValueError(f"Negative forecast value for {field}")
            if field == "precipitation_probability" and value > 100:
                raise ValueError("Rain probability exceeds 100")


def write_json_atomic(output_file, data):
    output_file.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=output_file.parent,
            prefix=output_file.name + ".", suffix=".tmp", delete=False,
        ) as file:
            temporary_path = Path(file.name)
            json.dump(data, file, indent=2, ensure_ascii=False, allow_nan=False)
        os.replace(temporary_path, output_file)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def read_previous_snapshot():
    try:
        with open(PUBLIC_OUTPUT_FILE, encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


# ======================================================
# Check coordinates
# ======================================================

def valid_coordinates(latitude, longitude):
    if isinstance(latitude, bool) or isinstance(longitude, bool):
        return False
    try:
        latitude = float(latitude)
        longitude = float(longitude)

        return (
            -90 <= latitude <= 90
            and -180 <= longitude <= 180
            and not (
                latitude == 0
                and longitude == 0
            )
        )

    except (TypeError, ValueError):
        return False


# ======================================================
# Read current activity locations from SQLite
# ======================================================
#
# OLD VERSION:
#
# data/sample/EP1_sample_events_dataset.csv
#
# NEW VERSION:
#
# age-friendly-database/age-friendly.db
#        ↓
# activities table
#
# This means weather locations now match the current
# Eventfinda activity data used by Iteration 2.
# ======================================================

def load_activity_locations():
    # Optional: read the live activities API when its database updates on Render.
    # This only reads activities; it never changes the activity database.
    activities_url = os.environ.get("WEATHER_ACTIVITIES_API_URL", "").strip()
    if activities_url:
        activities = request_json(activities_url)
        if not isinstance(activities, list) or not activities:
            raise ValueError("Activities API did not return a non-empty list")
        grouped = {}
        for activity in activities:
            if not isinstance(activity, dict):
                raise ValueError("Invalid activity record")
            suburb = str(activity.get("suburb") or "").strip()
            if not suburb:
                continue
            coordinates = grouped.setdefault(suburb, [])
            latitude = activity.get("latitude")
            longitude = activity.get("longitude")
            if valid_coordinates(latitude, longitude):
                coordinates.append((float(latitude), float(longitude)))
        return [
            {
                "suburb": suburb,
                "latitude": sum(point[0] for point in points) / len(points) if points else None,
                "longitude": sum(point[1] for point in points) / len(points) if points else None,
            }
            for suburb, points in sorted(grouped.items(), key=lambda item: item[0].casefold())
        ]

    if not DATABASE_FILE.exists():
        raise FileNotFoundError(
            f"Database not found: {DATABASE_FILE}"
        )

    connection = sqlite3.connect(
        DATABASE_FILE
    )

    try:
        cursor = connection.cursor()

        rows = cursor.execute(
            """
            SELECT
                TRIM(suburb) AS suburb,

                AVG(
                    CASE
                        WHEN latitude IS NOT NULL
                             AND TRIM(
                                 CAST(
                                     latitude AS TEXT
                                 )
                             ) != ''
                        THEN CAST(
                            latitude AS REAL
                        )
                    END
                ) AS latitude,

                AVG(
                    CASE
                        WHEN longitude IS NOT NULL
                             AND TRIM(
                                 CAST(
                                     longitude AS TEXT
                                 )
                             ) != ''
                        THEN CAST(
                            longitude AS REAL
                        )
                    END
                ) AS longitude

            FROM activities

            WHERE
                suburb IS NOT NULL
                AND TRIM(suburb) != ''

            GROUP BY
                TRIM(suburb)

            ORDER BY
                suburb COLLATE NOCASE
            """
        ).fetchall()

        locations = []

        for row in rows:
            locations.append(
                {
                    "suburb": row[0],
                    "latitude": row[1],
                    "longitude": row[2],
                }
            )

        return locations

    finally:
        connection.close()


# ======================================================
# Find coordinates using Open-Meteo geocoding
# ======================================================
#
# This is used only when the Eventfinda/SQLite record
# does not already provide usable latitude/longitude.
# ======================================================

def geocode_suburb(suburb):
    print(
        f"Geocoding {suburb}..."
    )

    geocoding_url = (
        "https://geocoding-api.open-meteo.com"
        "/v1/search"
    )

    geocoding_params = {
        "name": suburb,
        "count": 10,
        "language": "en",
        "format": "json",
        "countryCode": "AU",
    }

    try:
        data = request_json(geocoding_url, geocoding_params)
        if not isinstance(data, dict) or data.get("error"):
            raise ValueError("Invalid geocoding response")
        results = data.get("results", [])
        if not isinstance(results, list) or any(not isinstance(item, dict) for item in results):
            raise ValueError("Invalid geocoding locations")

        # Prefer Victorian locations
        for item in results:
            if (
                item.get("admin1")
                == "Victoria"
            ):
                return (
                    item.get(
                        "latitude"
                    ),
                    item.get(
                        "longitude"
                    ),
                )

        print(
            f"No Victorian location found "
            f"for {suburb}"
        )

    except (requests.RequestException, ValueError) as error:
        print(
            f"Geocoding failed for "
            f"{suburb}: {error}"
        )
        raise RuntimeError(f"Geocoding request failed for {suburb}") from error

    return None, None


# ======================================================
# Get Open-Meteo weather
# ======================================================

def fetch_weather(
    suburb,
    latitude,
    longitude,
):
    weather_url = (
        "https://api.open-meteo.com"
        "/v1/forecast"
    )

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

        "timezone":
            "Australia/Melbourne",

        "temperature_unit":
            "celsius",

        "wind_speed_unit":
            "kmh",

        "forecast_days": 7,
    }

    try:
        weather_data = request_json(
            weather_url,
            weather_params,
            validate=lambda data: validate_hourly(
                data, ("temperature_2m", "precipitation_probability", "uv_index"),
            ),
        )

        print(
            f"Weather collected for "
            f"{suburb}"
        )

        return {
            "suburb": suburb,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "weather_available": True,
            "reason": None,
            "weather":
                weather_data,
        }

    except (requests.RequestException, ValueError) as error:
        print(
            f"Weather request failed "
            f"for {suburb}: {error}"
        )

        return {
            "suburb": suburb,
            "latitude": latitude,
            "longitude": longitude,
            "weather_available": False,
            "reason":
                "Weather request failed",
            "weather": None,
        }


# ======================================================
# Get Open-Meteo air quality
# ======================================================

def fetch_air_quality(
    suburb,
    latitude,
    longitude,
):
    air_quality_url = (
        "https://air-quality-api.open-meteo.com"
        "/v1/air-quality"
    )

    air_quality_params = {
        "latitude": latitude,
        "longitude": longitude,

        "hourly": (
            "pm2_5,"
            "pm10,"
            "us_aqi"
        ),

        "timezone":
            "Australia/Melbourne",

        "forecast_days": 7,
    }

    try:
        air_quality_data = request_json(
            air_quality_url,
            air_quality_params,
            validate=lambda data: validate_hourly(data, ("pm2_5", "pm10", "us_aqi")),
        )

        print(
            f"Air quality collected for "
            f"{suburb}"
        )

        return {
            "air_quality_available": True,
            "air_quality_reason": None,
            "air_quality":
                air_quality_data,
        }

    except (requests.RequestException, ValueError) as error:
        print(
            f"Air quality request failed "
            f"for {suburb}: {error}"
        )

        return {
            "air_quality_available": False,
            "air_quality_reason":
                "Air quality request failed",
            "air_quality": None,
        }


# ======================================================
# Main weather pipeline
# ======================================================

def refresh_data():
    print(
        "----------------------------------------"
    )

    print(
        "Age-Friendly Australia "
        "Weather Pipeline"
    )

    print(
        "----------------------------------------"
    )

    print(
        f"Database: {DATABASE_FILE}"
    )

    # --------------------------------------------------
    # 1. Read all current activity suburbs
    # --------------------------------------------------

    locations = (
        load_activity_locations()
    )
    if not locations:
        raise ValueError("No activity locations found; keeping the previous JSON")

    print(
        f"Found {len(locations)} "
        f"unique activity suburbs."
    )

    print(
        "----------------------------------------"
    )

    weather_results = []

    # --------------------------------------------------
    # 2. Fetch weather for each suburb
    # --------------------------------------------------

    for index, location in enumerate(
        locations,
        start=1,
    ):
        suburb = (
            location[
                "suburb"
            ]
            .strip()
        )

        latitude = location[
            "latitude"
        ]

        longitude = location[
            "longitude"
        ]

        print(
            f"[{index}/{len(locations)}] "
            f"{suburb}"
        )

        # ----------------------------------------------
        # Broad LGA records do not represent an exact
        # suburb location.
        # ----------------------------------------------

        if "LGA" in suburb.upper():
            weather_results.append(
                {
                    "suburb": suburb,
                    "latitude": None,
                    "longitude": None,
                    "weather_available":
                        False,
                    "reason":
                        "Exact location not provided",
                    "weather": None,
                    "air_quality_available":
                        False,
                    "air_quality_reason":
                        "Exact location not provided",
                    "air_quality": None,
                }
            )

            print(
                f"Weather unavailable "
                f"for broad location: "
                f"{suburb}"
            )

            continue

        # ----------------------------------------------
        # Prefer coordinates already available from
        # Eventfinda / SQLite.
        # ----------------------------------------------

        if valid_coordinates(
            latitude,
            longitude,
        ):
            print(
                f"Using activity coordinates "
                f"for {suburb}"
            )

        else:
            # ------------------------------------------
            # If coordinates are missing, try
            # Open-Meteo geocoding.
            # ------------------------------------------

            latitude, longitude = (
                geocode_suburb(
                    suburb
                )
            )

        # ----------------------------------------------
        # Still no coordinates
        # ----------------------------------------------

        if not valid_coordinates(
            latitude,
            longitude,
        ):
            weather_results.append(
                {
                    "suburb": suburb,
                    "latitude": None,
                    "longitude": None,
                    "weather_available":
                        False,
                    "reason":
                        "Location could not be matched",
                    "weather": None,
                    "air_quality_available":
                        False,
                    "air_quality_reason":
                        "Location could not be matched",
                    "air_quality": None,
                }
            )

            print(
                f"No usable coordinates "
                f"for {suburb}"
            )

            continue

        # ----------------------------------------------
        # Get weather
        # ----------------------------------------------

        weather_result = fetch_weather(
            suburb,
            latitude,
            longitude,
        )
        if not weather_result["weather_available"]:
            raise RuntimeError(f"Weather request failed for {suburb}; keeping the previous JSON")

        # ----------------------------------------------
        # Get air quality
        # ----------------------------------------------

        air_quality_result = fetch_air_quality(
            suburb,
            latitude,
            longitude,
        )
        if not air_quality_result["air_quality_available"]:
            raise RuntimeError(f"Air quality request failed for {suburb}; keeping the previous JSON")

        # Add air quality to the weather result.
        weather_result.update(
            air_quality_result
        )

        weather_results.append(
            weather_result
        )

        # Avoid sending requests too quickly.
        time.sleep(0.1)

    # ==================================================
    # 3. Calculate summary
    # ==================================================

    available_count = sum(
        1
        for item in weather_results
        if item[
            "weather_available"
        ]
    )

    unavailable_count = (
        len(weather_results)
        - available_count
    )
    if available_count == 0:
        raise ValueError("No valid forecasts collected; keeping the previous JSON")

    # ==================================================
    # 4. Build output JSON
    # ==================================================

    output_data = {
        "source":
            (
                "Open-Meteo Weather "
                "and Air Quality APIs"
            ),

        "coverage":
            (
                "Current suburbs in the "
                "SQLite activities table"
            ),

        "fetched_at":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "location_count":
            len(
                weather_results
            ),

        "available_count":
            available_count,

        "unavailable_count":
            unavailable_count,

        "air_quality_available_count": sum(
            1 for item in weather_results if item["air_quality_available"]
        ),

        "locations":
            weather_results,
    }

    # ==================================================
    # 5. Save raw output
    # ==================================================

    write_json_atomic(RAW_OUTPUT_FILE, output_data)

    # ==================================================
    # 6. Save frontend production copy
    # ==================================================
    #
    # WeatherCard.vue reads:
    #
    # /data/melbourne_suburb_weather.json
    #
    # Therefore this file must exist inside:
    #
    # public/data/
    # ==================================================

    write_json_atomic(PUBLIC_OUTPUT_FILE, output_data)

    # ==================================================
    # Complete
    # ==================================================

    print(
        "----------------------------------------"
    )

    print(
        "Weather pipeline completed."
    )

    print(
        f"Total locations: "
        f"{len(weather_results)}"
    )

    print(
        f"Weather available: "
        f"{available_count}"
    )

    print(
        f"Weather unavailable: "
        f"{unavailable_count}"
    )

    print(
        "----------------------------------------"
    )

    print(
        "Raw weather output:"
    )

    print(
        RAW_OUTPUT_FILE
    )

    print(
        "Frontend weather output:"
    )

    print(
        PUBLIC_OUTPUT_FILE
    )

    print(
        "----------------------------------------"
    )
    return output_data


def main():
    previous = read_previous_snapshot()
    attempted_at = datetime.now(timezone.utc).isoformat()
    try:
        output_data = refresh_data()
    except (requests.RequestException, ValueError, RuntimeError, OSError, sqlite3.Error) as error:
        print(f"Refresh failed: {error}")
        print("Previous weather JSON has been kept.")
        write_json_atomic(STATUS_OUTPUT_FILE, {
            "status": "failed",
            "last_attempt_at": attempted_at,
            "last_success_at": previous.get("fetched_at"),
            "message": str(error),
        })
        return False

    write_json_atomic(STATUS_OUTPUT_FILE, {
        "status": "ok",
        "last_attempt_at": datetime.now(timezone.utc).isoformat(),
        "last_success_at": output_data["fetched_at"],
        "message": "Weather and air quality updated successfully.",
    })
    return True


# ======================================================
# Run
# ======================================================

if __name__ == "__main__":
    raise SystemExit(0 if main() else 1)