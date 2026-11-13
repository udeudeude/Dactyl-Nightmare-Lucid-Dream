# Virtuality SU2000 preservation leads (research, 2026-11-13)

This is an evidence-graded research register, **not** an assertion that 1994 assets are identical to the 1991 1000CS release. No proprietary binaries or assets have been copied into this repository.

## Highest-priority lead: MallVR

- Project: https://github.com/gainesphere-studios/MallVR
- Its public project description claims high-level emulation of original SU2000 software in DOSBox-X, including Dactyl Nightmare, with online play. This is a *developer claim*, not yet independently reproduced here. **Critical distinction (checked against the developer's current download page): MallVR's 1000-series Dactyl Nightmare is explicitly a footage-based playable placeholder, not emulation of recovered 1991 code.** Its playable original-software Dactyl refers to the later 2000-series release. The developer says a 1000-series hard-drive dump is still missing. See https://gainesphere.com/pages/mallvr-download .
- Investigate: exact Dactyl release/revision, provenance of game software, whether original geometry/audio can be inspected, whether gameplay can be captured reproducibly, and whether nonredistributable assets can be analyzed locally.
- Ask the maintainers for a technical interview or permission to compare screenshots, game timings, collision layout, bird movement, HUD, weapon and avatars. Ask separately for evidence about the 1000CS; do not treat the footage-derived placeholder as primary evidence. Do not imply their game files are open source.

## Physical-machine preservation: SkullSpace

- https://wiki.skullspace.ca/index.php/Virtuality_SU2000
- The preservation write-up says the group backed up a machine hard drive and discs for Dactyl Nightmare, Zone Hunter and Missile Command.
- Verify which Dactyl edition, whether backups survive, what can legally be shared, and whether photographs or recorded gameplay can be obtained.

## Emulator and hardware references

- https://github.com/ErrorDanOfficial/su2000-vr-emulator
- Published compatibility table explicitly lists **Dactyl Nightmare: No Progress** (as checked 2026-11-13). Do not treat the project's sample folder listing as proof of complete Dactyl binaries or playable emulation.
- https://github.com/mamedev/mame/blob/master/src/mame/misc/su2000.cpp
- MAME's preliminary SU2000 driver lists Dactyl Nightmare SP and notes that games have independent firmware for two Motorola 88110 processors. This architecture is the **later SU2000**, not proof of the 1991 1000CS architecture.

## Unverified claims from external lead

A proposed Internet Archive Alcohol 120% MDF/MDS image of *Dactyl Nightmare SP*, allegedly containing DACC.EXE, SP.EXE, ETS.EXE, geometry and audio but lacking DAC.EXE, was described without an exact item URL or manifest. Searches performed 2026-11-13 did not establish the item or file inventory. **Do not claim these files or extraction scripts exist until an exact archive item and hashes are recorded.**

Likewise, claims about original 1991 magneto-optical distribution, original programmer attribution, and 1994-to-1991 mesh identity require independent primary evidence.

## Reproducible next steps

1. Identify a lawful, authentic Dactyl software source; record original source URL, edition, date, filenames, sizes and SHA-256 checksums. Do not execute untrusted arcade binaries on a host system.
2. If a disc image is obtained, inspect it read-only and inventory the filesystem without running executables. Preserve raw image and derived file hashes separately.
3. Identify asset formats from signatures, file references and non-executing analysis; do not assume model names or PCM samples from extensions alone.
4. If original gameplay can be observed, record camera viewpoint, arena landmark coordinates, frame timing, actor proportions, bird behavior and HUD in a revision-tagged comparison matrix.
5. Compare the later SU2000 title to 1000CS evidence separately; annotate every feature as verified for 1000CS, verified for SU2000, inferred, or unknown.
6. Implement newly authored geometry and sounds, not redistributed proprietary assets, unless explicit rights are established.

## Outreach questions

- Which exact Dactyl Nightmare build(s) can you run or inspect, and which original media/firmware are required?
- Do you have authenticated gameplay captures or an inventory of original 3D and audio resources?
- Is there a documented, read-only extraction workflow or file-format specification?
- Can we cite your research and compare visual landmarks with our independent 1991 reconstruction?
- Are there known differences between the 1000CS and SU2000 editions?

Research findings here are leads for follow-up, not permission to merge later-game assets into the 1991 reconstruction.

## Follow-up, 2026-11-13: machine-media provenance and outreach

The archived SkullSpace page explicitly describes its SU2000 as a DOS 6.22 system with a 486 host, a 500 MB hard drive on their unit, two compact-disc drives and a floppy drive. It states that the group backed up the hard drive and **three games**: Dactyl Nightmare, Zone Hunter and Missile Command. It does **not** establish that a public download exists, which game revision was backed up, or whether the full set of required game firmware was captured. The page warns that some programmable integrated circuits were not backed up. Source: https://wiki.skullspace.ca/index.php/Virtuality_SU2000 .

An attempt to open a preservation inquiry on the MallVR GitHub repository via the connected GitHub integration returned **403 Resource not accessible by integration**. No inquiry was posted. Do not describe this as completed outreach. The draft question is retained in local project issue #35. Contacting SkullSpace was not attempted through an authenticated channel; do not claim otherwise.

No precise Internet Archive item identifier, manifest, original asset checksum or verified Dactyl extraction utility has been recovered in this pass. The available evidence does not justify replacing 1000CS geometry with SU2000 geometry.
