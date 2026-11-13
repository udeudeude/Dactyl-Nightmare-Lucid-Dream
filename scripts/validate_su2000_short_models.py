#!/usr/bin/env python3
"""Read-only validator for the shorter BIN 0200 record layout.

Accepts original MDF and TSV manifest (path, logical_block, size_bytes,
is_directory). Prints only aggregate counts and validation failures.
"""
import csv
import json
import struct
import sys
from collections import Counter


def inspect(data):
    if len(data) < 44 or data[:8] != b"BIN 0200":
        return None
    u = lambda offset: struct.unpack_from(">I", data, offset)[0]
    if u(20) != 24 or u(12) + 16 != len(data):
        return None
    starts = [16 + u(offset) for offset in (20, 24, 28, 32, 36)]
    if starts != sorted(starts) or starts[-1] > len(data):
        raise ValueError("section boundaries invalid")
    vertices, vertex_end, polygons, polygon_end, _ = starts
    count = u(vertices)
    if not 0 < count < 100000 or vertices + 4 + 12 * count != vertex_end:
        raise ValueError("vertex section invalid")
    faces = u(polygons)
    if faces > 100000:
        raise ValueError("polygon count invalid")
    pos = polygons + 4
    totals = Counter(vertices=count, polygons=faces)
    for _ in range(faces):
        if pos + 12 > polygon_end:
            raise ValueError("truncated polygon")
        corners = u(pos)
        if not 3 <= corners <= 64 or pos + 12 + 4 * corners > polygon_end:
            raise ValueError("polygon record invalid")
        indices = struct.unpack_from(">" + str(corners) + "I", data, pos + 12)
        if any(index >= count for index in indices):
            raise ValueError("polygon index out of range")
        totals["triangles" if corners == 3 else "quads" if corners == 4
               else "other_polygons"] += 1
        pos += 12 + 4 * corners
    if pos != polygon_end:
        raise ValueError("polygon trailing bytes")
    return totals


def main(image, manifest):
    totals = Counter()
    failures = []
    with open(image, "rb") as disc, open(manifest, newline="") as listing:
        for row in csv.DictReader(listing, delimiter="\t"):
            if row["is_directory"].lower() == "true" or not row["path"].endswith(".BIN"):
                continue
            disc.seek(int(row["logical_block"]) * 2048)
            data = disc.read(int(row["size_bytes"]))
            if not data.startswith(b"BIN 0200") or len(data) < 24:
                continue
            if struct.unpack_from(">I", data, 20)[0] != 24:
                continue
            try:
                measured = inspect(data)
                totals.update(measured)
                totals["models"] += 1
            except (ValueError, struct.error) as exc:
                failures.append({"path": row["path"], "reason": str(exc)})
    print(json.dumps({"totals": totals, "exceptions": failures}, indent=2))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: validate_su2000_short_models.py disc.mdf manifest.tsv")
    main(*sys.argv[1:])
