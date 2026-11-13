# Dactyl SP BIN 0200 format: reproducible preliminary analysis

Date: 2026-11-13. Source: user-provided original 1994 `dactylsp.mdf` (SHA-256 `48c8da58e2560cb46e0d920fe683f98ac1fa92cba69c345f73a29626814faca3`). **This is SU2000, not authenticated 1991 1000CS geometry.** Do not commit original binary assets.

## Direct byte observations

Read-only ISO 9660 access: logical block size 2048; file bytes begin at `logical_block * 2048` (verified for the supplied image). The first eight bytes of sampled model files are ASCII `BIN 0200`. Big-endian 32-bit values at offsets 8, 12, 16 and 20 are plausible; interpreting the same values as little-endian gives implausible magnitudes.

| File | Header 8 | Header 12 | Header 16 | Header 20 | First apparent offset at 24 |
|---|---:|---:|---:|---:|---:|
| DAC/MODELS/DACTYL/DACBOD.BIN | 12 | 40416 | 65544 | 36 | 5024 |
| DAC/MODELS/DACTYL/DACHEAD.BIN | 12 | 140676 | 65545 | 36 | 17616 |
| DAC/MODELS/NEWDACTY/DACBOD.BIN | 12 | 28068 | 65545 | 36 | 3540 |
| DAC/MODELS/NEWDACTY/DACHEAD.BIN | 12 | 52644 | 65545 | 36 | 6612 |
| DAC/MODELS/OBJECTS/PLAT25.BIN | 12 | 47972 | 65545 | 36 | 6028 |
| DAC/MODELS/OBJECTS/RAIL.BIN | 12 | 5700 | 65545 | 36 | 744 |
| DAC/MODELS/OBJECTS/STAIR.BIN | 12 | 22596 | 65545 | 36 | 2856 |
| DAC/MODELS/OBJECTS/STAIRS.BIN | 12 | 27972 | 65545 | 36 | 3528 |

The next six 32-bit fields increase by a fixed stride in sampled files (e.g., STAIR: 2856, 5676, 8496, 11316, 14136, 16956, 19776), suggesting repeated blocks or an offset table. **Their semantics, coordinate units, vertices and polygon indices remain unproven.** No geometry has been extracted.

## Reproduction

Given a trusted, locally stored image and the accompanying manifest, use a read-only Python standard-library script:

```python
import csv, struct
image = 'dactylsp.mdf'
manifest = 'dactylsp_manifest.tsv'
rows = list(csv.DictReader(open(manifest), delimiter='\t'))
with open(image, 'rb') as disc:
    for row in rows:
        if row['path'].endswith('.BIN') and any(
            s in row['path'] for s in ('STAIR.BIN', 'DACBOD.BIN', 'PLAT25.BIN')
        ):
            disc.seek(int(row['logical_block']) * 2048)
            header = disc.read(56)
            assert header[:8] == b'BIN 0200'
            fields = struct.unpack('>12I', header[8:56])
            print(row['path'], fields)
```

Do not execute any recovered executable. Before making geometry claims, validate block boundaries against file lengths across **all** models, identify polygon records with independent cross-checks, and compare against authenticated 1000CS screenshots. Keep extracted assets outside the public repository.

## Full-corpus validation (2026-11-13)

A read-only pass over the uploaded 245,588,112-byte MDF and the 835-file manifest checked **all 279 .BIN models**, **149 .WAV sounds**, and **34 .ANM animations**. All file extents fell within the image.

- **275 models** have ASCII `BIN 0200` signatures. For **all 275**, the big-endian 32-bit integer at byte offset 12 equals **filesystem file length minus 16 bytes**. This is now a corpus-validated length field, not merely a plausible value.
- **Four models** instead begin with `BIN 0300`: `DAC/MODELS/PEARL/CLAM.BIN`, `PLATC.BIN`, `PLATN.BIN`, and `STAIRN.BIN`. They require separate format handling.
- The 275 `BIN 0200` files have big-endian values at byte offset 16 distributed as follows: **246 = 65545**, **8 = 65544**, **8 = 65542**, **12 = 9**, **1 = 10**. These values are **not yet proven to be object types or vertex counts**.
- All 149 WAV files have uncompressed PCM format code 1, **mono, 8-bit**; **145** have a 22,050 Hz sample rate, and **four** have 11,025 Hz.
- The sampled animation headers begin with readable ASCII `ANIM ` followed by text-like fields; `DACFLY.ANM` starts `ANIM 4 24 10 20.` and `WALK.ANM` starts `ANIM 1 24 16 20.`. These are observations, **not yet decoded frame timing**.

**Important correction to the initial interpretation:** apparent offsets at byte 24 and following may be part of a repeated record directory. Their interpretation as vertex or polygon data remains unverified. Do not convert them directly into geometry. The full manifest is available in the user-supplied analysis session, but has not been published to GitHub.

### Reproduction command

The read-only tool `scripts/analyze_su2000_disc.py` takes the MDF and a tab-separated manifest with `path`, `logical_block`, `size_bytes`, `is_directory`. It emits only metadata and checks that each file lies inside the image:

```sh
python3 scripts/analyze_su2000_disc.py dactylsp.mdf dactylsp_manifest.tsv --output measurements.json
```

Do not commit the original disc image, extracted proprietary meshes, or audio.
