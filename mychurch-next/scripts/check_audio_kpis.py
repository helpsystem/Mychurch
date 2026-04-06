#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path


DEFAULT_REPORT = Path("Bible/bible_output/audio_capability_report.json")
DEFAULT_MUST_HAVE = ["NIV", "NLT", "NKJV", "KJV", "BSB", "NMV"]


def load_report(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Report not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Audio report must be a JSON list")
    if not data:
        raise ValueError("Audio report is empty")
    return data


def to_bool(v) -> bool:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.strip().lower() in {"1", "true", "yes", "y"}
    return bool(v)


def to_int(v) -> int:
    try:
        return int(v)
    except (TypeError, ValueError):
        return 0


def index_by_abbr(rows: list[dict]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for row in rows:
        abbr = str(row.get("version_abbr", "")).strip().upper()
        if abbr:
            out[abbr] = row
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Pre-deploy audio KPI gate")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT, help="Path to audio capability report JSON")
    parser.add_argument("--min-total", type=int, default=1, help="Minimum number of versions expected in report")
    parser.add_argument("--min-audio-capable", type=int, default=1, help="Minimum number of audio_capable versions")
    parser.add_argument(
        "--must-have",
        type=str,
        default=",".join(DEFAULT_MUST_HAVE),
        help="Comma-separated version abbreviations that must have audio_files > 0",
    )
    parser.add_argument(
        "--allow-silent-capable",
        action="store_true",
        help="Allow rows with audio_capable=true and audio_files=0",
    )
    args = parser.parse_args()

    try:
        rows = load_report(args.report)
    except Exception as exc:
        print(f"[FAIL] {exc}")
        return 2

    total = len(rows)
    capable = sum(1 for r in rows if to_bool(r.get("audio_capable")))
    with_files = sum(1 for r in rows if to_int(r.get("audio_files")) > 0)

    errors: list[str] = []

    if total < args.min_total:
        errors.append(f"total versions {total} < min_total {args.min_total}")
    if capable < args.min_audio_capable:
        errors.append(f"audio_capable versions {capable} < min_audio_capable {args.min_audio_capable}")

    if not args.allow_silent_capable:
        silent_capable = [
            (r.get("version_abbr"), to_int(r.get("audio_files")))
            for r in rows
            if to_bool(r.get("audio_capable")) and to_int(r.get("audio_files")) == 0
        ]
        if silent_capable:
            errors.append(f"audio_capable but no files: {silent_capable}")

    by_abbr = index_by_abbr(rows)
    must_have = [x.strip().upper() for x in (args.must_have or "").split(",") if x.strip()]
    missing_audio = []
    for abbr in must_have:
        row = by_abbr.get(abbr)
        if row is None:
            errors.append(f"missing must-have version in report: {abbr}")
            continue
        if to_int(row.get("audio_files")) <= 0:
            missing_audio.append(abbr)
    if missing_audio:
        errors.append(f"must-have versions without audio files: {missing_audio}")

    print("Audio KPI summary:")
    print(f"  total_versions={total}")
    print(f"  audio_capable_versions={capable}")
    print(f"  versions_with_audio_files={with_files}")

    if errors:
        print("[FAIL] Audio KPI gate failed:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("[PASS] Audio KPI gate passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
