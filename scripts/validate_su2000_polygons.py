#!/usr/bin/env python3
"""Read-only validator of candidate SU2000 BIN 0200 indexed polygon records.

Input is the original MDF and TSV manifest (path,logical_block,size_bytes,is_directory).
Outputs aggregate statistics and per-model validation failures, never asset geometry.
"""
import csv
import json
import struct
import sys
from collections import Counter


def u32(data, offset):
    return struct.unpack_from(">I", data, offset)[0]


def inspect(data):
    if data[:8] != b"BIN 0200" or len(data) < 80:
        raise ValueError("not BIN 0200")
    if u32(data, 12) + 16 != len(data):
        raise ValueError("length mismatch")
    base = 52
    offsets = [u32(data, base + 4 * i) for i in range(1, 6)]
    if offsets != sorted(offsets):
        raise ValueError("unordered section offsets")
    vertices_at, vertex_end, faces_at, faces_end = (
        base + offsets[i] for i in range(4)
    )
    if not (base <= vertices_at < vertex_end <= faces_at < faces_end <= len(data)):
        raise ValueError("invalid section boundaries")
    vertex_count = u32(data, vertices_at)
    face_count = u32(data, faces_at)
    if not 0 < vertex_count <= 100000 or vertices_at + 4 + 12 * vertex_count != vertex_end:
        raise ValueError("candidate vertex section mismatch")
    if face_count > 100000:
        raise ValueError("face count unreasonable")
    pos = faces_at + 4
    triangles = quads = other = 0
    for _ in range(face_count):
        if pos + 12 > faces_end:
            raise ValueError("truncated polygon")
        corners = u32(data, pos)
        if not 3 <= corners <= 64 or pos + 12 + 4 * corners > faces_end:
            raise ValueError("invalid polygon length")
        indices = struct.unpack_from(">" + str(corners) + "I", data, pos + 12)
        if any(index >= vertex_count for index in indices):
            raise ValueError("polygon references missing vertex")
        triangles += corners == 3
        quads += corners == 4
        other += corners not in (3, 4)
        pos += 12 + 4 * corners
    if pos != faces_end:
        raise ValueError("polygon section has trailing data")
    return dict(vertices=vertex_count, polygons=face_count,
                triangles=triangles, quads=quads, other=other)


def main(image, manifest):
    stats = Counter()
    rejected = []
    with open(image, "rb") as disc, open(manifest, newline="") as index:
        for entry in csv.DictReader(index, delimiter="\t"):
            if entry["is_directory"].lower() == "true" or not entry["path"].endswith(".BIN"):
                continue
            disc.seek(int(entry["logical_block"]) * 2048)
            data = disc.read(int(entry["size_bytes"]))
            if not data.startswith(b"BIN 0200"):
                continue
            try:
                result = inspect(data)
                stats["validated_models"] += 1
                stats.update(result)
            except (ValueError, struct.error) as exc:
                rejected.append({"path": entry["path"], "reason": str(exc)})
    print(json.dumps({"totals": dict(stats), "rejected": rejected}, indent=2))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: validate_su2000_polygons.py disc.mdf manifest.tsv")
    main(*sys.argv[1:])
