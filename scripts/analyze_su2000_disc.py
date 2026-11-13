#!/usr/bin/env python3
"""Read-only metadata inspection of Dactyl Nightmare SP disc image.

Requires a TSV manifest with path, logical_block, size_bytes, is_directory.
Does not extract copyrighted asset contents or execute any original software.
"""
import argparse
import csv
import json
import struct
from collections import Counter
from pathlib import Path


def analyze(image, manifest):
    rows = list(csv.DictReader(manifest.open(newline=""), delimiter="\t"))
    result = {"image_size": image.stat().st_size, "manifest_entries": len(rows),
              "models": [], "sounds": [], "animations": [], "errors": []}
    with image.open("rb") as disc:
        for row in rows:
            if row["is_directory"].lower() == "true":
                continue
            path = row["path"]
            start = int(row["logical_block"]) * 2048
            size = int(row["size_bytes"])
            if start < 0 or size < 0 or start + size > result["image_size"]:
                result["errors"].append([path, "out-of-range extent"])
                continue
            if not path.endswith((".BIN", ".WAV", ".ANM")):
                continue
            disc.seek(start)
            head = disc.read(min(size, 128))
            if path.endswith(".BIN"):
                entry = {"path": path, "size": size,
                         "signature": head[:8].decode("ascii", errors="replace")}
                if len(head) >= 24 and head[:8] == b"BIN 0200":
                    version, declared, kind, first = struct.unpack_from(">4I", head, 8)
                    entry.update(declared_size=declared, kind=kind,
                                 first_offset=first, size_matches=declared + 16 == size)
                result["models"].append(entry)
            elif path.endswith(".WAV"):
                entry = {"path": path, "size": size,
                         "riff_wave": head[:4] == b"RIFF" and head[8:12] == b"WAVE"}
                if entry["riff_wave"] and head[12:16] == b"fmt " and len(head) >= 36:
                    codec, channels = struct.unpack_from("<HH", head, 20)
                    rate = struct.unpack_from("<I", head, 24)[0]
                    bits = struct.unpack_from("<H", head, 34)[0]
                    entry.update(codec=codec, channels=channels, sample_rate=rate, bits=bits)
                result["sounds"].append(entry)
            else:
                result["animations"].append(
                    {"path": path, "size": size, "prefix_hex": head[:16].hex()})
    result["model_kinds"] = dict(Counter(str(m.get("kind", "unknown"))
                                         for m in result["models"]))
    result["model_size_match_count"] = sum(
        bool(m.get("size_matches")) for m in result["models"])
    result["wav_rates"] = dict(Counter(str(s.get("sample_rate", "unknown"))
                                       for s in result["sounds"]))
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--output", type=Path, default=Path("measurements.json"))
    args = parser.parse_args()
    data = analyze(args.image, args.manifest)
    args.output.write_text(json.dumps(data, indent=2) + "\n")
    print("Models:", len(data["models"]), "size matches:", data["model_size_match_count"])
    print("WAV:", len(data["sounds"]), "ANM:", len(data["animations"]))
    print("Errors:", len(data["errors"]))


if __name__ == "__main__":
    main()
