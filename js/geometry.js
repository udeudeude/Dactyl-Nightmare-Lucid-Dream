/* Shared by the renderer, collision queries and regression tests. No build step. */
(function (root, factory) {
  const geometry = factory();
  if (typeof module === 'object' && module.exports) module.exports = geometry;
  else root.DactylGeometry = geometry;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const EPSILON = 1e-8;

  // These dimensions are the existing provisional reconstruction, not measurements
  // recovered from the arcade game. Render and collide against the same surfaces.
  function stairs(platforms, steps = 8, width = 3) {
    const center = platforms[0];
    return platforms.slice(1).flatMap(p => {
      const alongX = Math.abs(p.x - center.x) > Math.abs(p.z - center.z);
      const sign = Math.sign(alongX ? p.x - center.x : p.z - center.z);
      const from = center.w / 2;
      const to = Math.abs(alongX ? p.x - center.x : p.z - center.z) - p.w / 2;
      const depth = (to - from) / steps;
      return Array.from({ length: steps }, (_, i) => {
        const position = sign * (from + (i + .5) * depth);
        return {
          x: center.x + (alongX ? position : 0),
          z: center.z + (alongX ? 0 : position),
          w: alongX ? depth : width,
          d: alongX ? width : depth,
          y: center.y + (p.y - center.y) * (i + 1) / steps,
          step: i
        };
      });
    });
  }

  function groundAt(x, z, platforms, steps) {
    let height = null;
    for (const p of [...platforms, ...steps]) {
      if (Math.abs(x - p.x) <= p.w / 2 + EPSILON &&
          Math.abs(z - p.z) <= (p.d ?? p.w) / 2 + EPSILON) {
        height = height === null ? p.y : Math.max(height, p.y);
      }
    }
    return height;
  }

  // Sutherland-Hodgman clipping in camera space [right, up, depth]. Discarding
  // a whole polygon for a single vertex behind the eye made floors disappear.
  function clipNear(vertices, near = .15) {
    if (!vertices.length) return [];
    const output = [];
    let previous = vertices[vertices.length - 1];
    let previousInside = previous[2] >= near;
    for (const current of vertices) {
      const inside = current[2] >= near;
      if (inside !== previousInside) {
        const t = (near - previous[2]) / (current[2] - previous[2]);
        output.push([
          previous[0] + t * (current[0] - previous[0]),
          previous[1] + t * (current[1] - previous[1]),
          near
        ]);
      }
      if (inside) output.push(current);
      previous = current;
      previousInside = inside;
    }
    return output;
  }

  function movementInput(x, z) {
    const length = Math.max(1, Math.hypot(x, z));
    return { x: x / length, z: z / length };
  }

  return { stairs, groundAt, clipNear, movementInput };
});
