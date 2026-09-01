import json
from pathlib import Path


# Find the project folder
project_folder = Path(__file__).resolve().parents[1]

# Set the input file paths
weather_file = (
    project_folder
    / "data"
    / "raw"
    / "melbourne_suburb_weather.json"
)

epa_file = (
    project_folder
    / "data"
    / "raw"
    / "epa_air_quality.json"
)


# Load one JSON file
def load_json(file_path):
    if not file_path.exists():
        print("File not found:", file_path)
        raise SystemExit(1)

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except json.JSONDecodeError:
        print("Invalid JSON file:", file_path)
        raise SystemExit(1)
    except OSError as error:
        print("Could not read file:", file_path)
        print(error)
        raise SystemExit(1)


# Load the input data
weather_data = load_json(weather_file)
epa_data = load_json(epa_file)


# Check the main data lists
weather_locations = weather_data.get("locations")
epa_sites = epa_data.get("records")

if not isinstance(weather_locations, list):
    print("Weather locations list was not found.")
    raise SystemExit(1)

if not isinstance(epa_sites, list):
    print("EPA records list was not found.")
    raise SystemExit(1)


# Show the loaded data
print("Weather locations loaded:", len(weather_locations))
print("EPA sites loaded:", len(epa_sites))
print("Input files loaded successfully.")