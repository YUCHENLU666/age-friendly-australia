import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import requests

from data_pipeline import fetch_open_meteo as pipeline


def forecast(fields, value=12):
    return {
        "timezone": "Australia/Melbourne",
        "hourly": {
            "time": ["2026-10-07T09:00"],
            **{field: [value] for field in fields},
        },
    }


WEATHER = ("temperature_2m", "precipitation_probability", "uv_index")
AIR_QUALITY = ("pm2_5", "pm10", "us_aqi")


class PartialRefreshTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)

        folder = Path(self.temporary.name)
        self.public = folder / "public.json"
        self.raw = folder / "raw.json"
        self.status = folder / "status.json"
        self.old_time = "2026-10-05T00:00:00+00:00"

        self.previous = {
            "fetched_at": "2026-10-06T00:00:00+00:00",
            "locations": [{
                "suburb": "Carlton",
                "weather_available": True,
                "weather": forecast(WEATHER, 5),
                "air_quality_available": True,
                "air_quality": forecast(AIR_QUALITY, 5),
                "fetched_at": self.old_time,
            }],
        }

        self.original = json.dumps(self.previous).encode()
        self.public.write_bytes(self.original)
        self.raw.write_bytes(self.original)

        self.locations = [
            {"suburb": "Carlton", "latitude": -37.8, "longitude": 144.97},
            {"suburb": "Clayton", "latitude": -37.92, "longitude": 145.12},
        ]

        for item in [
            patch.object(pipeline, "PUBLIC_OUTPUT_FILE", self.public),
            patch.object(pipeline, "RAW_OUTPUT_FILE", self.raw),
            patch.object(pipeline, "STATUS_OUTPUT_FILE", self.status),
            patch.object(
                pipeline,
                "load_activity_locations",
                return_value=self.locations,
            ),
            patch.object(pipeline.time, "sleep"),
            patch.dict(os.environ, {"WEATHER_ACTIVITIES_API_URL": ""}),
        ]:
            item.start()
            self.addCleanup(item.stop)

    def run_pipeline(self, responses):
        with patch.object(
            pipeline,
            "request_json",
            side_effect=responses,
        ) as request:
            with contextlib.redirect_stdout(io.StringIO()):
                result = pipeline.main()

        return result, request.call_count

    def assert_partial(self):
        self.assertEqual(self.public.read_bytes(), self.raw.read_bytes())

        data = json.loads(self.public.read_text())
        status = json.loads(self.status.read_text())

        self.assertEqual(data["refreshed_count"], 1)
        self.assertEqual(status["status"], "partial")
        self.assertEqual(status["failed_suburbs"], ["Carlton"])

        carlton, clayton = data["locations"]

        self.assertEqual(
            carlton["weather"],
            self.previous["locations"][0]["weather"],
        )
        self.assertEqual(
            carlton["air_quality"],
            self.previous["locations"][0]["air_quality"],
        )
        self.assertEqual(carlton["fetched_at"], self.old_time)
        self.assertEqual(carlton["refresh_status"], "failed")
        self.assertEqual(clayton["refresh_status"], "ok")
        self.assertNotEqual(clayton["fetched_at"], self.old_time)

    def test_weather_failure_does_not_stop_next_suburb(self):
        result, count = self.run_pipeline([
            requests.Timeout("Carlton timeout"),
            forecast(WEATHER),
            forecast(AIR_QUALITY),
        ])

        self.assertTrue(result)
        self.assertEqual(count, 3)
        self.assert_partial()

    def test_aqi_failure_retains_pair_and_continues(self):
        result, count = self.run_pipeline([
            forecast(WEATHER),
            requests.Timeout("AQI timeout"),
            forecast(WEATHER),
            forecast(AIR_QUALITY),
        ])

        self.assertTrue(result)
        self.assertEqual(count, 4)
        self.assert_partial()

    def test_geocoding_failure_does_not_stop_next_suburb(self):
        self.locations[0]["latitude"] = None
        self.locations[0]["longitude"] = None

        result, _ = self.run_pipeline([
            requests.Timeout("Geocoding timeout"),
            forecast(WEATHER),
            forecast(AIR_QUALITY),
        ])

        self.assertTrue(result)
        self.assert_partial()

    def test_no_previous_record_is_unavailable(self):
        self.public.write_text(json.dumps({"locations": []}))

        result, _ = self.run_pipeline([
            requests.Timeout(),
            forecast(WEATHER),
            forecast(AIR_QUALITY),
        ])

        self.assertTrue(result)

        carlton = json.loads(self.public.read_text())["locations"][0]

        self.assertIsNone(carlton["weather"])
        self.assertIsNone(carlton["air_quality"])
        self.assertIsNone(carlton["fetched_at"])
        self.assertFalse(carlton["weather_available"])
        self.assertEqual(carlton["refresh_status"], "failed")

    def test_all_failures_keep_original_json(self):
        result, count = self.run_pipeline([
            requests.Timeout(),
            requests.Timeout(),
        ])

        self.assertFalse(result)
        self.assertEqual(count, 2)
        self.assertEqual(self.public.read_bytes(), self.original)
        self.assertEqual(self.raw.read_bytes(), self.original)
        self.assertEqual(
            json.loads(self.status.read_text())["status"],
            "failed",
        )

    def test_legacy_record_keeps_original_snapshot_time(self):
        previous = json.loads(json.dumps(self.previous))
        del previous["locations"][0]["fetched_at"]

        result = pipeline.keep_previous_location(
            "Carlton",
            previous,
            "Timeout",
        )

        self.assertEqual(result["fetched_at"], previous["fetched_at"])
        self.assertNotIn("refresh_status", previous["locations"][0])

    def test_time_limit_keeps_remaining_records_without_more_requests(self):
        self.locations.reverse()

        with patch.object(
            pipeline.time,
            "monotonic",
            side_effect=[0, 0, 1081],
        ):
            result, count = self.run_pipeline([
                forecast(WEATHER),
                forecast(AIR_QUALITY),
            ])

        self.assertTrue(result)
        self.assertEqual(count, 2)

        data = json.loads(self.public.read_text())

        self.assertEqual(data["failed_suburbs"], ["Carlton"])
        self.assertEqual(data["locations"][1]["fetched_at"], self.old_time)


if __name__ == "__main__":
    unittest.main()