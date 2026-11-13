#!/usr/bin/env python3
"""Generate the full ISO 9660 file manifest from the original SU2000 MDF.

Read-only, standard library only. Does not export game contents.
Usage: python3 scripts/manifest_su2000_disc.py dactylsp.mdf > dactylsp_manifest.tsv
"""
import csv
import struct
import sys

SECTOR = 2048

def entries(disc, sector, size, parent="", seen=None):
    if seen is None:
        seen = set()
    if (sector, size) in seen:
        return
    seen.add((sector, size))
    disc.seek(sector * SECTOR)
    data = disc.read(size)
    offset = 0
    while offset < len(data):
        length = data[offset]
        if not length:
            offset = (offset // SECTOR + 1) * SECTOR
            continue
        if offset + length > len(data) or length < 34:
            raise ValueError("Invalid ISO directory record")
        rec = data[offset:offset + length]
        extent = struct.unpack_from("<I", rec, 2)[0]
        byte_size = struct.unpack_from("<I", rec, 10)[0]
        is_dir = bool(rec[25] & 2)
        name_len = rec[32]
        name = rec[33:33 + name_len].decode("ascii", "replace")
        offset += length
        if name in ("\x00", "\x01"):
            continue
        name = name.split(";")[0]
        path = parent + "/" + name if parent else name
        yield path, extent, byte_size, is_dir
        if is_dir:
            yield from entries(disc, extent, byte_size, path, seen)

def main(image):
    with open(image, "rb") as disc:
        disc.seek(16 * SECTOR)
        descriptor = disc.read(SECTOR)
        if descriptor[1:6] != b"CD001" or descriptor[0] != 1:
            raise ValueError("Missing ISO 9660 primary volume descriptor")
        root = descriptor[156:]
        sector = struct.unpack_from("<I", root, 2)[0]
        size = struct.unpack_from("<I", root, 10)[0]
        writer = csv.writer(sys.stdout, delimiter="\t", lineterminator="\n")
        writer.writerow(("path", "logical_block", "size_bytes", "is_directory"))
        for row in entries(disc, sector, size):
            writer.writerow(row)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: manifest_su2000_disc.py disc.mdf")
    main(sys.argv[1])
