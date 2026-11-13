#!/usr/bin/env python3
"""Classify SU2000 BIN variants without extracting copyrighted geometry.

Read-only; uses original MDF plus TSV with path, logical_block, size_bytes,
is_directory. Outputs aggregate metadata and names of files by layout.
"""
import csv
import json
import struct
import sys
from collections import Counter, defaultdict


def word(data, offset):
    return struct.unpack_from(">I", data, offset)[0]


def classify(data):
    if len(data) < 36 or data[:8] not in (b"BIN 0200", b"BIN 0300"):
        return {"layout": "unknown"}
    version = data[:8].decode("ascii")
    if version == "BIN 0300":
        return {"layout": "0300-separate"}
    if word(data, 12) + 16 != len(data):
        return {"layout": "0200-length-mismatch"}
    kind = word(data, 16)
    first_offset = word(data, 20)
    # Relative section directory starts at absolute byte 16.
    # Offset 36 identifies the common nested record starting at byte 52.
    # Offset 24 identifies a shorter layout whose data begins at byte 40.
    if first_offset == 24:
        return {"layout": "0200-short-header", "kind": kind}
    if first_offset != 36 or len(data) < 80:
        return {"layout": "0200-other-header", "kind": kind,
                "first_offset": first_offset}
    base = 52
    offsets = [word(data, base + 4 * i) for i in range(1, 6)]
    positions = [base + value for value in offsets]
    if positions != sorted(positions) or positions[-1] > len(data):
        return {"layout": "0200-invalid-sections", "kind": kind}
    vertices_at, vertices_end, polygons_at, polygons_end = positions[:4]
    if vertices_at + 4 > vertices_end or polygons_at + 4 > polygons_end:
        return {"layout": "0200-other-sections", "kind": kind}
    vertex_count = word(data, vertices_at)
    if not 0 < vertex_count < 100000 or vertices_at + 4 + 12 * vertex_count != vertices_end:
        return {"layout": "0200-nonstandard-vertices", "kind": kind}
    polygon_count = word(data, polygons_at)
    if polygon_count > 100000:
        return {"layout": "0200-nonstandard-polygons", "kind": kind}
    pos = polygons_at + 4
    triangle_count = quad_count = 0
    for _ in range(polygon_count):
        if pos + 12 > polygons_end:
            return {"layout": "0200-truncated-polygons", "kind": kind}
        n = word(data, pos)
        if n < 3 or n > 64 or pos + 12 + 4 * n > polygons_end:
            return {"layout": "0200-other-polygon-record", "kind": kind}
        if any(index >= vertex_count for index in
               struct.unpack_from(">" + str(n) + "I", data, pos + 12)):
            return {"layout": "0200-out-of-range-index", "kind": kind}
        triangle_count += n == 3
        quad_count += n == 4
        pos += 12 + 4 * n
    if pos != polygons_end:
        return {"layout": "0200-polygon-trailing-bytes", "kind": kind}
    return {"layout": "0200-indexed-polygons", "kind": kind,
            "vertices": vertex_count, "polygons": polygon_count,
            "triangles": triangle_count, "quads": quad_count}


def main(image, manifest):
    counts = Counter()
    names = defaultdict(list)
    totals = Counter()
    with open(image, "rb") as disc, open(manifest, newline="") as listing:
        for row in csv.DictReader(listing, delimiter="\t"):
            if row["is_directory"].lower() == "true" or not row["path"].endswith(".BIN"):
                continue
            disc.seek(int(row["logical_block"]) * 2048)
            data = disc.read(int(row["size_bytes"]))
            finding = classify(data)
            label = finding["layout"]
            counts[label] += 1
            names[label].append(row["path"])
            if label == "0200-indexed-polygons":
                for key in ("vertices", "polygons", "triangles", "quads"):
                    totals[key] += finding[key]
    print(json.dumps({"counts": counts, "totals": totals,
                      "exception_files": {k: v for k, v in names.items()
                                          if k != "0200-indexed-polygons"}}, indent=2))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: classify_su2000_models.py disc.mdf manifest.tsv")
    main(*sys.argv[1:])
