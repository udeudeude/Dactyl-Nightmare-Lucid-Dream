#!/usr/bin/env python3
"""Read-only survey of packed polygon attributes in the 1994 SU2000 disc.

No proprietary mesh coordinates, indices, or sounds are written to output.
Requires an MDF and tab-separated manifest with path, logical_block,
size_bytes, is_directory. Uses strict checks; rejects ambiguous layouts.
"""
import csv
import json
import struct
import sys
from collections import Counter


def parse(data):
    if len(data) < 44 or data[:8] != b"BIN 0200":
        return None, "unsupported_version"
    u32 = lambda at: struct.unpack_from(">I", data, at)[0]
    if u32(12) + 16 != len(data):
        return None, "bad_length"
    first = u32(20)
    if first == 36:
        base = 52
        offsets = [u32(base + i * 4) for i in range(1, 6)]
    elif first == 24:
        base = 16
        offsets = [u32(i) for i in (20, 24, 28, 32, 36)]
    else:
        return None, "unsupported_header"
    if offsets != sorted(offsets):
        return None, "unordered_sections"
    v, ve, f, fe = [base + x for x in offsets[:4]]
    if not (0 <= v < ve <= f < fe <= len(data)) or v + 4 > ve or f + 4 > fe:
        return None, "bad_sections"
    n, face_count = u32(v), u32(f)
    if not (0 < n <= 100000 and v + 4 + 12 * n == ve and face_count <= 100000):
        return None, "bad_counts"
    cursor = f + 4
    attributes = Counter()
    secondary = Counter()
    for _ in range(face_count):
        if cursor + 12 > fe:
            return None, "truncated_polygon"
        corners = u32(cursor)
        end = cursor + 12 + 4 * corners
        if not (3 <= corners <= 64 and end <= fe):
            return None, "bad_polygon"
        indices = struct.unpack_from(">" + str(corners) + "I", data, cursor + 12)
        if max(indices) >= n:
            return None, "bad_index"
        attributes[u32(cursor + 4)] += 1
        secondary[u32(cursor + 8)] += 1
        cursor = end
    if cursor != fe:
        return None, "trailing_bytes"
    return (attributes, secondary, face_count), None


def survey(image, manifest):
    models = 0
    faces = 0
    attributes = Counter()
    secondary = Counter()
    failures = Counter()
    with open(image, "rb") as disc, open(manifest, newline="") as listing:
        for row in csv.DictReader(listing, delimiter="\t"):
            if row["is_directory"].lower() == "true" or not row["path"].endswith(".BIN"):
                continue
            start, length = int(row["logical_block"]) * 2048, int(row["size_bytes"])
            disc.seek(start)
            result, error = parse(disc.read(length))
            if error:
                failures[error] += 1
                continue
            a, b, n = result
            models += 1
            faces += n
            attributes.update(a)
            secondary.update(b)
    return {"validated_models": models, "validated_polygons": faces,
            "attribute_histogram": {f"0x{k:08x}": v for k, v in sorted(attributes.items())},
            "secondary_histogram": {str(k): v for k, v in sorted(secondary.items())},
            "rejections": dict(sorted(failures.items()))}


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: survey_su2000_materials.py disc.mdf manifest.tsv")
    result = survey(*sys.argv[1:])
    print(json.dumps(result, indent=2))
    if result["validated_models"] != 241 or result["validated_polygons"] != 18342:
        raise SystemExit("Disc baseline mismatch; review inputs and format assumptions")


if __name__ == "__main__":
    main()
