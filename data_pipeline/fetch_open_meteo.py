import json
import sqlite3
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


# ======================================================
# Check coordinates
# ======================================================

def valid_coordinates(latitude, longitude):
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
        response = requests.get(
            geocoding_url,
            params=geocoding_params,
            timeout=30,
        )

        response.raise_for_status()

        results = (
            response
            .json()
            .get(
                "results",
                [],
            )
        )

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

    except requests.RequestException as error:
        print(
            f"Geocoding failed for "
            f"{suburb}: {error}"
        )

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
        weather_response = requests.get(
            weather_url,
            params=weather_params,
            timeout=60,
        )

        weather_response.raise_for_status()

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
                weather_response.json(),
        }

    except requests.RequestException as error:
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
        air_quality_response = requests.get(
            air_quality_url,
            params=air_quality_params,
            timeout=30,
        )

        air_quality_response.raise_for_status()

        print(
            f"Air quality collected for "
            f"{suburb}"
        )

        return {
            "air_quality_available": True,
            "air_quality_reason": None,
            "air_quality":
                air_quality_response.json(),
        }

    except requests.RequestException as error:
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

def main():
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

        # ----------------------------------------------
        # Get air quality
        # ----------------------------------------------

        air_quality_result = fetch_air_quality(
            suburb,
            latitude,
            longitude,
        )

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

        "locations":
            weather_results,
    }

    # ==================================================
    # 5. Save raw output
    # ==================================================

    RAW_OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        RAW_OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            output_data,
            file,
            indent=2,
            ensure_ascii=False,
        )

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

    PUBLIC_OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        PUBLIC_OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            output_data,
            file,
            indent=2,
            ensure_ascii=False,
        )

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


# ======================================================
# Run
# ======================================================

if __name__ == "__main__":
    main()