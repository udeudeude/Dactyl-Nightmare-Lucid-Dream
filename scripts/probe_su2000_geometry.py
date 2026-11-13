#!/usr/bin/env python3
"""Read-only candidate geometry probe for SU2000 BIN 0200 models.
Usage: python3 scripts/probe_su2000_geometry.py dactylsp.mdf dactylsp_manifest.tsv
No original asset bytes are exported.
"""
import csv
import json
import math
import struct
import sys

def probe(data):
    if len(data) < 80 or data[:8] != b"BIN 0200":
        return None
    integer = lambda offset: struct.unpack_from(">I", data, offset)[0]
    if integer(12) + 16 != len(data):
        return None
    offsets = [integer(offset) for offset in range(20, 52, 4)]
    if offsets[0] != 36 or offsets != sorted(offsets) or offsets[-1] >= len(data):
        return None
    count = integer(76)
    if not 0 < count < 100000 or 80 + count * 12 > len(data):
        return None
    coords = [struct.unpack_from(">fff", data, 80 + index * 12)
              for index in range(count)]
    if not all(math.isfinite(value) and abs(value) < 1e8
               for point in coords for value in point):
        return None
    return {
        "candidate_vertex_count": count,
        "candidate_coordinate_bounds": [
            [min(point[axis] for point in coords),
             max(point[axis] for point in coords)]
            for axis in range(3)
        ],
        "block_offsets": offsets,
    }

def main(image, manifest):
    results = []
    rejected = []
    with open(image, "rb") as disc, open(manifest, newline="") as source:
        for entry in csv.DictReader(source, delimiter="\t"):
            if entry["is_directory"].lower() == "true" or not entry["path"].endswith(".BIN"):
                continue
            disc.seek(int(entry["logical_block"]) * 2048)
            data = disc.read(int(entry["size_bytes"]))
            if not data.startswith(b"BIN 0200"):
                continue
            measured = probe(data)
            if measured is None:
                rejected.append(entry["path"])
            else:
                results.append({"path": entry["path"], **measured})
    print(json.dumps({"candidate_models": results, "rejected": rejected}, indent=2))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: probe_su2000_geometry.py image.mdf manifest.tsv")
    main(*sys.argv[1:])
