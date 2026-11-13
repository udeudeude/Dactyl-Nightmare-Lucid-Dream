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

## Candidate coordinate decoding (2026-11-13)

A second read-only probe now treats bytes 80 onward in compatible `BIN 0200` models as consecutive **big-endian IEEE 754 32-bit XYZ triples**. Byte 76 is interpreted provisionally as the triple count. This interpretation passed strict length, finite-number, and offset-order checks for **254 of 275** `BIN 0200` files. The other 21 were deliberately rejected rather than forced through the same layout. These checks establish **plausible candidate coordinates, not proven polygon connectivity or world-space units**.

| SU2000 file | Candidate triples | X min/max | Y min/max | Z min/max |
| --- | ---: | --- | --- | --- |
| `DAC/MODELS/DACTYL/DACBOD.BIN` | 42 | -439.55 / 436.03 | -792.62 / 2113.77 | -310.98 / 283.54 |
| `DAC/MODELS/NEWDACTY/DACBOD.BIN` | 49 | -180.42 / 188.25 | -170.78 / 1492.65 | -209.20 / 205.35 |

The two body files are distinct; neither is authenticated as the 1991 1000CS body. See [the committed probe](../scripts/probe_su2000_geometry.py), which prints only candidate counts, block offsets, and numerical bounds. The remaining work is to prove polygon-index structure, coordinate transforms and scaling, then compare against release-labeled 1000CS reference frames. **Do not yet replace game geometry with these candidates.**

## Indexed polygon records identified (2026-11-13)

The first model subrecord begins at absolute byte 52. Its five relative section offsets are stored at bytes 56, 60, 64, 68, 72, measured **relative to byte 52**. For the common layout, the candidate vertex section begins at `52 + u32be(56)`, with a big-endian count followed by 12-byte XYZ float triples. The polygon section begins at `52 + u32be(64)`, with a big-endian polygon count followed by variable-length records:

- `u32be corner_count`
- `u32be packed_attribute` (meaning not yet decoded)
- `u32be reserved_or_material` (meaning not yet decoded)
- `corner_count` consecutive big-endian 32-bit vertex indices

In `RAIL.BIN`, the first polygon has four indices `(4, 0, 11, 3)` and attribute `0x38000000`. In `DACTYL/DACBOD.BIN`, the first polygon has four indices `(14, 15, 25, 24)` and attribute `0x6000000c`. Both index lists are within their model's candidate vertex count; both polygon streams end **exactly** at the declared polygon-section boundary.

The first-block layout was checked against all **275 BIN 0200** files: **237** passed vertex-section size, polygon record boundary, and vertex-index bounds checks, yielding **11,835 candidate vertices and 16,944 indexed polygons**. **38** failed the strict common-layout test, often due to alternative section layouts; this is not evidence of corrupt files. Some models contain multiple subrecords or other structures that need separate decoding. See [read-only polygon validator](../scripts/validate_su2000_polygons.py).

**Scope:** These are authentic structural observations from the 1994 SU2000 disc. Polygon color/material encoding, object transforms, other model layouts and 1991 correspondence remain unresolved. The tool outputs aggregate counts and failures only, not proprietary mesh data.

## Exception classification: outer header variants (2026-11-13)

A separate full-disc read-only scan of the 279 `.BIN` entries identifies **three** outer-header classes by the ASCII version and big-endian word at absolute byte 20:

| Class | Files | Interpretation |
| --- | ---: | --- |
| `BIN 0200`, byte-20 word = 36 | 262 | Common longer header, including the 237 validated indexed-polygon files |
| `BIN 0200`, byte-20 word = 24 | 13 | Shorter header; the previous parser incorrectly treated bytes at 52 as a nested section directory |
| `BIN 0300` | 4 | Different version; all four are in `DAC/MODELS/PEARL/` |

The **13 short-header files** are `360`, `3DSOUND`, `BLA3`, `CPU`, `DACTYL`, `FUTURE`, `NMARE`, `STARF`, `STEALTH`, `STING`, `TUBESECT`, `VEGA`, and `VIRTUAL`, all in `DAC/MODELS/OBJECTS/`. The four `BIN 0300` files are `CLAM`, `PLATC`, `PLATN`, and `STAIRN` in `DAC/MODELS/PEARL/`.

**Correction:** The earlier total of 38 common-layout failures is not one homogeneous exception class. Thirteen have the shorter outer header; **25 still have the common 36-byte header** but fail the strict vertex/polygon checks. This does not establish their internal schemas. See [classifier](../scripts/classify_su2000_models.py). Polygon attributes remain undecoded.

## Short-header polygon decoding: directly validated (2026-11-13)

A second parser now recognizes the `BIN 0200` short-header family. The outer relative-offset directory starts at **absolute byte 16** rather than the common layout's nested record starting at byte 52. The five 32-bit big-endian offsets at absolute bytes **20, 24, 28, 32, 36** are relative to byte 16. The first section contains a big-endian vertex count followed by 12-byte big-endian float triples; the third contains a polygon count followed by variable-length indexed polygon records in the same structure as the common layout.

**Actual read-only results on the uploaded disc:** **12 of 13** short-header models passed exact vertex-section length, polygon record boundaries and index-range validation. These contain **3,082 vertices and 1,509 polygons** (344 triangles and 1,165 quads). The one rejected model is `DAC/MODELS/OBJECTS/STARF.BIN`, which requires further analysis. See [short-header validator](../scripts/validate_su2000_short_models.py).

Examples: `OBJECTS/DACTYL.BIN` has 186 vertices and 103 indexed polygons; `OBJECTS/360.BIN` has 348 vertices and 175 indexed polygons. These filenames identify objects in the later SU2000 edition, not necessarily the 1991 playable bird.

**Updated verified minimum:** 237 common-layout models + 12 short-header models = **249 indexed-polygon models**, with **14,917 candidate vertices** and **18,453 polygons**. These are structural counts, not a proof of correct scale, materials, transforms, or 1991 identity. The four `BIN 0300` files appear to contain nested model-like structures, but no fully validated parser is claimed yet.

## BIN 0300 nested container verification (2026-11-13)

All four `DAC/MODELS/PEARL/*.BIN` files have been inspected directly. Their big-endian integer at byte **36** equals **file size minus 40**, and byte **40** is `65545`. A nested relative-offset table starts at byte **44**; the first value is `36`, with subsequent ascending values that remain within the file when interpreted relative to byte **36**. This is structurally consistent across `CLAM`, `PLATC`, `PLATN`, and `STAIRN`.

This confirms a nested structured payload, **not** complete vertex/polygon decoding. The dedicated [read-only BIN 0300 probe](../scripts/probe_su2000_v0300.py) checks these boundaries without exporting assets. Material attributes and transformations remain unresolved.
