import contextlib
import io
import json
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import requests

from data_pipeline import fetch_open_meteo as pipeline


def forecast(fields):
    return {
        "timezone": "Australia/Melbourne",
        "hourly": {
            "time": ["2026-10-06T09:00", "2026-10-06T10:00"],
            **{field: [12, 15] for field in fields},
        },
    }


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        folder = Path(self.temporary.name)
        self.raw = folder / "raw.json"
        self.public = folder / "public.json"
        self.status = folder / "status.json"
        self.previous = {
            "fetched_at": "2026-10-05T00:00:00+00:00",
            "locations": [],
        }
        self.original_bytes = json.dumps(self.previous).encode()
        self.public.write_bytes(self.original_bytes)
        self.raw.write_bytes(self.original_bytes)
        self.patches = [
            patch.object(pipeline, "RAW_OUTPUT_FILE", self.raw),
            patch.object(pipeline, "PUBLIC_OUTPUT_FILE", self.public),
            patch.object(pipeline, "STATUS_OUTPUT_FILE", self.status),
            patch.object(pipeline.time, "sleep"),
            patch.dict(os.environ, {"WEATHER_ACTIVITIES_API_URL": ""}),
        ]
        for item in self.patches:
            item.start()
        self.addCleanup(self.temporary.cleanup)
        for item in self.patches:
            self.addCleanup(item.stop)

    def run_pipeline(self):
        # Normal pipeline runs still print progress.
        with contextlib.redirect_stdout(io.StringIO()):
            return pipeline.main()

    def test_success_replaces_both_snapshots(self):
        with patch.object(pipeline, "load_activity_locations", return_value=[
            {"suburb": "Clayton", "latitude": -37.92, "longitude": 145.12},
        ]), patch.object(pipeline, "request_json", side_effect=[
            forecast(("temperature_2m", "precipitation_probability", "uv_index")),
            forecast(("pm2_5", "pm10", "us_aqi")),
        ]):
            self.assertTrue(self.run_pipeline())
        self.assertNotEqual(self.public.read_bytes(), self.original_bytes)
        self.assertEqual(self.public.read_bytes(), self.raw.read_bytes())
        data = json.loads(self.public.read_text())
        self.assertEqual(data["available_count"], 1)
        self.assertEqual(data["air_quality_available_count"], 1)
        status = json.loads(self.status.read_text())
        self.assertEqual(status["status"], "ok")
        self.assertEqual(status["last_success_at"], data["fetched_at"])

    def test_weather_timeout_keeps_old_files_byte_for_byte(self):
        with patch.object(pipeline, "load_activity_locations", return_value=[
            {"suburb": "Clayton", "latitude": -37.92, "longitude": 145.12},
        ]), patch.object(pipeline, "request_json", side_effect=requests.Timeout()):
            self.assertFalse(self.run_pipeline())
        self.assert_old_snapshot_kept()

    def test_air_quality_failure_keeps_successful_weather_out_of_snapshot(self):
        with patch.object(pipeline, "load_activity_locations", return_value=[
            {"suburb": "Clayton", "latitude": -37.92, "longitude": 145.12},
        ]), patch.object(pipeline, "request_json", side_effect=[
            forecast(("temperature_2m", "precipitation_probability", "uv_index")),
            requests.ConnectionError("AQI offline"),
        ]):
            self.assertFalse(self.run_pipeline())
        self.assert_old_snapshot_kept()

    def assert_old_snapshot_kept(self):
        self.assertEqual(self.public.read_bytes(), self.original_bytes)
        self.assertEqual(self.raw.read_bytes(), self.original_bytes)
        status = json.loads(self.status.read_text())
        self.assertEqual(status["status"], "failed")
        self.assertEqual(status["last_success_at"], self.previous["fetched_at"])

    def test_empty_activity_list_does_not_erase_data(self):
        with patch.object(pipeline, "load_activity_locations", return_value=[]):
            self.assertFalse(self.run_pipeline())
        self.assert_old_snapshot_kept()

    def test_missing_database_keeps_old_files(self):
        with patch.object(pipeline, "DATABASE_FILE", Path(self.temporary.name) / "missing.db"):
            self.assertFalse(self.run_pipeline())
        self.assert_old_snapshot_kept()

    def test_geocoding_failure_keeps_old_files(self):
        with patch.object(pipeline, "load_activity_locations", return_value=[
            {"suburb": "Clayton", "latitude": None, "longitude": None},
        ]), patch.object(pipeline, "request_json", side_effect=requests.Timeout()):
            self.assertFalse(self.run_pipeline())
        self.assert_old_snapshot_kept()

    def test_invalid_json_keeps_old_files(self):
        with patch.object(pipeline, "load_activity_locations", return_value=[
            {"suburb": "Clayton", "latitude": -37.92, "longitude": 145.12},
        ]), patch.object(pipeline.requests, "get", return_value=Mock(
            status_code=200, json=Mock(side_effect=ValueError("Invalid JSON")),
        )):
            self.assertFalse(self.run_pipeline())
        self.assert_old_snapshot_kept()

    def test_network_failure_retries_then_succeeds(self):
        response = Mock(status_code=200)
        response.json.return_value = {"ok": True}
        with patch.object(pipeline.requests, "get", side_effect=[
            requests.Timeout(),
            response,
        ]) as get:
            self.assertEqual(
                pipeline.request_json("https://example.test"),
                {"ok": True},
            )
        self.assertEqual(get.call_count, 2)

    def test_invalid_hourly_arrays_are_rejected(self):
        fields = ("temperature_2m", "precipitation_probability", "uv_index")
        for mutation in (
            "short",
            "invalid_time",
            "wrong_timezone",
            "negative_uv",
            "high_rain",
            "all_null",
            "nan",
        ):
            data = forecast(fields)
            if mutation == "short":
                data["hourly"]["uv_index"] = [2]
            elif mutation == "invalid_time":
                data["hourly"]["time"][0] = None
            elif mutation == "wrong_timezone":
                data["timezone"] = "UTC"
            elif mutation == "negative_uv":
                data["hourly"]["uv_index"][0] = -1
            elif mutation == "high_rain":
                data["hourly"]["precipitation_probability"][0] = 101
            elif mutation == "all_null":
                data["hourly"]["uv_index"] = [None, None]
            else:
                data["hourly"]["uv_index"][0] = float("nan")
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                pipeline.validate_hourly(data, fields)

    def test_air_quality_trailing_nulls_are_valid(self):
        fields = ("pm2_5", "pm10", "us_aqi")
        data = forecast(fields)
        for field in fields:
            data["hourly"][field][-1] = None
        pipeline.validate_hourly(data, fields)

    def test_atomic_write_does_not_erase_original_on_invalid_data(self):
        with self.assertRaises(ValueError):
            pipeline.write_json_atomic(self.public, {"value": float("nan")})
        self.assertEqual(self.public.read_bytes(), self.original_bytes)
        self.assertEqual(list(self.public.parent.glob("*.tmp")), [])

    def test_live_activities_group_locations_without_writing_database(self):
        activities = [
            {"suburb": " Clayton ", "latitude": -38, "longitude": 145},
            {"suburb": "Clayton", "latitude": -37, "longitude": 146},
            {"suburb": "Oakleigh", "latitude": None, "longitude": None},
        ]
        with patch.dict(os.environ, {
            "WEATHER_ACTIVITIES_API_URL": "https://example.test/api/activities",
        }), patch.object(pipeline, "request_json", return_value=activities), \
                patch.object(pipeline.sqlite3, "connect") as connect:
            locations = pipeline.load_activity_locations()
        self.assertEqual(len(locations), 2)
        self.assertEqual(locations[0]["latitude"], -37.5)
        self.assertEqual(locations[1]["latitude"], None)
        connect.assert_not_called()

    def test_sqlite_locations_remain_read_only(self):
        database = Path(self.temporary.name) / "activities.db"

        with contextlib.closing(sqlite3.connect(database)) as connection:
            with connection:
                connection.execute(
                    "CREATE TABLE activities (suburb TEXT, latitude REAL, longitude REAL)"
                )
                connection.executemany(
                    "INSERT INTO activities VALUES (?, ?, ?)",
                    [
                        ("Clayton", -38, 145),
                        ("Clayton", -37, 146),
                        ("", None, None),
                    ],
                )

        before = database.read_bytes()

        with patch.object(pipeline, "DATABASE_FILE", database):
            locations = pipeline.load_activity_locations()

        self.assertEqual(len(locations), 1)
        self.assertEqual(locations[0]["latitude"], -37.5)
        self.assertEqual(before, database.read_bytes())


if __name__ == "__main__":
    unittest.main()