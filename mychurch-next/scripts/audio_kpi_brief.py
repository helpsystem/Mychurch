#!/usr/bin/env python3
import argparse
import json
import os
import sys
from pathlib import Path


DEFAULT_REPORT = Path("Bible/bible_output/audio_capability_report.json")


def normalize_lang(raw: str) -> str:
    v = (raw or "").strip().lower()
    return v if v in {"fa", "en", "both"} else "en"


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


def build_summary_line(prefix: str, total: int, capable: int, with_files: int) -> str:
    return f"{prefix} | versions={total} | capable={capable} | files={with_files}"


def safe_print(text: str) -> None:
    try:
        print(text)
    except UnicodeEncodeError:
        encoding = (getattr(sys.stdout, "encoding", None) or "utf-8")
        fallback = text.encode(encoding, errors="replace").decode(encoding, errors="replace")
        print(fallback)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate compact audio KPI brief")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--output", type=Path, default=Path("Bible/bible_output/audio_kpi_brief.txt"))
    parser.add_argument("--json-output", type=Path, default=Path("Bible/bible_output/audio_kpi_brief.json"))
    parser.add_argument("--lang", type=str, default="", help="Brief language: en | fa | both")
    args = parser.parse_args()

    if not args.report.exists():
        print(f"[FAIL] report not found: {args.report}")
        return 2

    rows = json.loads(args.report.read_text(encoding="utf-8"))
    if not isinstance(rows, list) or not rows:
        print("[FAIL] report is empty or invalid")
        return 2

    total = len(rows)
    capable = sum(1 for r in rows if to_bool(r.get("audio_capable")))
    with_files = sum(1 for r in rows if to_int(r.get("audio_files")) > 0)
    zero_audio = [str(r.get("version_abbr") or r.get("version_id")) for r in rows if to_int(r.get("audio_files")) == 0]

    top = sorted(rows, key=lambda r: to_int(r.get("audio_files")), reverse=True)[:5]
    top_compact = [f"{r.get('version_abbr')}={to_int(r.get('audio_files'))}" for r in top]

    lang = normalize_lang(args.lang or os.getenv("AUDIO_KPI_LANG") or os.getenv("NOTIFY_LANG") or "en")

    one_line_en = build_summary_line("AUDIO KPI PASS", total, capable, with_files)
    one_line_fa = build_summary_line("PASS شاخص صوت", total, capable, with_files)

    if lang == "fa":
        one_line = one_line_fa
    elif lang == "both":
        one_line = one_line_fa + "\n" + one_line_en
    else:
        one_line = one_line_en

    payload = {
        "total_versions": total,
        "audio_capable_versions": capable,
        "versions_with_audio_files_gt_0": with_files,
        "top_versions_by_audio_files": top,
        "top_versions_by_audio_files_compact": top_compact,
        "zero_audio_versions": zero_audio,
        "zero_audio_count": len(zero_audio),
        "lang": lang,
        "one_line_fa": one_line_fa,
        "one_line_en": one_line_en,
        "one_line": one_line,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(one_line + "\n", encoding="utf-8")
    args.json_output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    safe_print(one_line)
    safe_print(f"brief_txt={args.output.as_posix()}")
    safe_print(f"brief_json={args.json_output.as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
