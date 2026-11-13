#!/usr/bin/env python3
"""Read-only structural check for SU2000 BIN 0300 PEARL containers."""
import csv
import json
import struct
import sys

def u32(data, offset):
    return struct.unpack_from(">I", data, offset)[0]

def inspect(data):
    if data[:8] != b"BIN 0300" or len(data) < 76:
        raise ValueError("not a BIN 0300 container")
    if u32(data, 36) + 40 != len(data):
        raise ValueError("nested payload length mismatch")
    kind = u32(data, 40)
    offsets = [u32(data, offset) for offset in range(44, 73, 4)]
    if offsets[0] != 36 or offsets != sorted(offsets):
        raise ValueError("unexpected nested offset table")
    if 36 + offsets[-1] > len(data):
        raise ValueError("nested section outside file")
    return {"nested_kind": kind, "nested_offsets": offsets,
            "length_verified": True, "offsets_verified": True}

def main(image, manifest):
    findings = []
    with open(image, "rb") as disc, open(manifest, newline="") as listing:
        for row in csv.DictReader(listing, delimiter="\t"):
            if row["is_directory"].lower() == "true" or not row["path"].endswith(".BIN"):
                continue
            disc.seek(int(row["logical_block"]) * 2048)
            data = disc.read(int(row["size_bytes"]))
            if data[:8] != b"BIN 0300":
                continue
            try:
                result = inspect(data)
            except ValueError as exc:
                result = {"error": str(exc)}
            findings.append({"path": row["path"], **result})
    print(json.dumps(findings, indent=2))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: probe_su2000_v0300.py disc.mdf manifest.tsv")
    main(*sys.argv[1:])
