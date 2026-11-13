# Dactyl Nightmare SP: original-disc forensic inspection

Date: 2026-11-13. Source: user-supplied `dactylsp.mdf` and `dactylsp.mds` associated with Internet Archive item https://archive.org/details/DactylNightmareSP .

## Integrity
- MDF: 245,588,112 bytes; SHA-256 `48c8da58e2560cb46e0d920fe683f98ac1fa92cba69c345f73a29626814faca3`
- MDS: 1,216 bytes; SHA-256 `2b951ea6a565b057f5c82cf359a29179c524eeddd6453b896c610a505dbffb98`
- MDF has a readable ISO 9660 filesystem at 2048-byte logical blocks; primary volume descriptor at block 16. No executables were run.
- 835 files in 22 directories (857 entries including directories). Extensions: 279 `.BIN`, 242 `.VST`, 149 `.WAV`, 68 `.TEX`, 34 `.ANM`, and other formats.

## Verified examples
- `DAC/DACC.EXE` (580,597 bytes), `ETS/ETS.EXE` (551,620), `SP/SP.EXE` (401,652); `DAC.EXE` was not found in the directory listing.
- `DAC/MODELS/DACTYL/` and `DAC/MODELS/NEWDACTY/` contain bird body, head, neck, wing and foot model resources.
- `DAC/MODELS/OBJECTS/` includes `STAIR.BIN`, `STAIRS.BIN`, `STAIRAIL.BIN`, `PLAT25.BIN`, `PLAT50.BIN`, `RAIL.BIN` and `PORTAL1.BIN`.
- `DAC/ANIMATE/` includes `DACFLY.ANM`, `DACDOWN.ANM`, `DACPERCH.ANM`, `DACROLL.ANM`, `FALL.ANM`, `FIRE.ANM` and `WALK.ANM`.
- `DAC/SOUNDS/` includes `DACTLOOP.WAV`, `FLAP3.WAV`, `FOOTLEFT.WAV`, `FOOTRITE.WAV`, `GAMEEND.WAV` and `DN_INSTR.WAV`; representative headers contain `RIFF` and `WAVE`.
- Representative `.BIN` files begin with `BIN 0200`. See [format notes](SU2000_BIN_FORMAT_NOTES.md) for directly observed header values.

## Limitations
The disc is the later SU2000 Dactyl Nightmare SP release, not proof of original 1991 1000CS asset geometry. The proprietary disc and extracted files are intentionally excluded from GitHub. A full 835-file tab-separated manifest and readable inventory were generated in the analysis environment, but **are not yet committed to GitHub**. Their original image is the authoritative source; do not treat this report as a complete manifest.

Next: verify model block schema across the corpus, extract non-proprietary measurements, and compare against revision-labeled original 1000CS references.
