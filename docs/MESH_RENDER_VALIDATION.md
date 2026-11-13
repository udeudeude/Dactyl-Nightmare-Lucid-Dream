# Flat-shaded mesh integrity and rendering validation

Updated: 2026-11-12

## Defects verified in the prior model

The original `column()` helper made a quadrilateral for each edge of a pointed cone. At its tip the final two coordinates were **identical**. Rendering each such quad as a two-triangle fan produced **one zero-area triangle**; this occurred for all eight upper facets on each of the 20 corner cones. WebGL normally discards a degenerate triangle, but the geometry is not a valid planar four-sided face and is especially undesirable for the software painter fallback.

The gun's successive tapered six-sided profiles produced some warped four-point surfaces. The two triangles chosen by the hardware renderer lay on different planes, despite the source declaring one polygon. Explicit triangles preserve the intended low-polygon shape while eliminating that ambiguity between rendering paths.

## Implementation and regression coverage

- A cone tip is now an **actual triangular facet**. Nonpointed column sections remain quadrilaterals.
- Every tapered gun side is authored as the same pair of flat triangular facets the renderer previously generated implicitly.
- Unit tests check complete five-board scenery, gun, moving opponent, three bird-wing configurations, and rotated first-person gun views. All triangles must have finite coordinates, positive nonzero area, consistent winding, and coplanar vertices within tolerance.
- Browser visual tests enforce a **triangle budget**, rather than an arbitrary face-count limit. Explicitly splitting a warped quad into two faces does not increase the actual number of triangles submitted to the GPU.
- The appearance remains a best-effort historic reconstruction; this pass is a geometry hygiene correction, not evidence of exact original model coordinates.

## Remaining visual acceptance

1. Inspect floor/column/marker intersections and the ring aperture from low and high camera positions on an actual iPhone.
2. Confirm Google Cardboard left/right views maintain depth order and readable HUD without eye-dependent polygon gaps.
3. Evaluate the software-painter fallback separately on a device with WebGL disabled; it still uses whole-polygon sorting and cannot generally solve interpenetrating surfaces.
4. Test lengthy multiplayer sessions for frame pacing and thermal throttling. The default remains 20 rendered frames per second.

Do not describe synthetic browser-renderer checks as physical Cardboard tests.
