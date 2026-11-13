#!/usr/bin/env python3
"""Validate both known SU2000 BIN 0200 layouts without exporting game assets.

Usage: python3 scripts/verify_su2000_meshes.py disc.mdf manifest.tsv
Only reads the disc and reports aggregate results and rejected file paths.
"""
import csv
import json
import struct
import sys
from collections import Counter

def inspect(data):
    if len(data) < 44 or data[:8] != b"BIN 0200":
        return "other_version"
    word = lambda pos: struct.unpack_from(">I", data, pos)[0]
    if word(12) + 16 != len(data):
        return "length_mismatch"
    first = word(20)
    if first == 36:
        base = 52
        offsets = [word(base + 4 * i) for i in range(1, 6)]
    elif first == 24:
        base = 16
        offsets = [word(pos) for pos in (20, 24, 28, 32, 36)]
    else:
        return "other_header"
    if offsets != sorted(offsets):
        return "nonmonotonic_offsets"
    vertices, vertex_end, polygons, polygon_end = [base + n for n in offsets[:4]]
    if not (0 <= vertices < vertex_end <= polygons < polygon_end <= len(data)):
        return "invalid_sections"
    if vertices + 4 > vertex_end or polygons + 4 > polygon_end:
        return "invalid_sections"
    count = word(vertices)
    faces = word(polygons)
    if count == 0 or count > 100000 or vertices + 4 + 12 * count != vertex_end:
        return "invalid_vertex_section"
    if faces > 100000:
        return "invalid_face_count"
    cursor = polygons + 4
    for _ in range(faces):
        if cursor + 12 > polygon_end:
            return "bad_polygon_record"
        corners = word(cursor)
        if not 3 <= corners <= 64 or cursor + 12 + 4 * corners > polygon_end:
            return "bad_polygon_record"
        indices = struct.unpack_from(">" + str(corners) + "I", data, cursor + 12)
        if max(indices) >= count:
            return "out_of_range_index"
        cursor += 12 + 4 * corners
    return "valid" if cursor == polygon_end else "trailing_polygon_data"

def main(image, manifest):
    counts = Counter()
    failures = {}
    with open(image, "rb") as disc, open(manifest, newline="") as listing:
        for row in csv.DictReader(listing, delimiter="\t"):
            if row["is_directory"].lower() == "true" or not row["path"].endswith(".BIN"):
                continue
            start, size = int(row["logical_block"]) * 2048, int(row["size_bytes"])
            disc.seek(start)
            result = inspect(disc.read(size))
            counts[result] += 1
            if result != "valid":
                failures[row["path"]] = result
    print(json.dumps({"counts": dict(counts), "failures": failures}, indent=2, sort_keys=True))
    return 0 if sum(counts.values()) == 279 and counts["valid"] == 241 else 1

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: verify_su2000_meshes.py disc.mdf manifest.tsv")
    sys.exit(main(*sys.argv[1:]))
