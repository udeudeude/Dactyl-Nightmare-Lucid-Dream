/* Shared by the renderer, collision queries and regression tests. No build step. */
(function (root, factory) {
  const geometry = factory();
  if (typeof module === 'object' && module.exports) module.exports = geometry;
  else root.DactylGeometry = geometry;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const EPSILON = 1e-8;
  // Exact footprint constants shared with the polygon scene, rather than
  // maintaining two unrelated sets of obstacle coordinates.
  const ARCHITECTURE = Object.freeze({
    ringHalfWidth:1.4, ringHalfDepth:.22,
    columnSpanFraction:.43, columnBaseRadius:.43,
    markerOffsetFraction:.37, markerBaseRadius:.42,
    playerRadius:.28
  });

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

  // Keep the provisional solo opponent on its assigned elevated platform.
  // A rectangular patrol is deterministic and never crosses the unsupported void.
  function patrol(platform, time, margin = 1.5) {
    const extent = Math.max(0,platform.w/2-margin);
    return {x:platform.x+Math.sin(time*.55)*extent*.65,
      y:platform.y,z:platform.z+Math.sin(time*.7)*extent*.65};
  }
  // Rectangle is the standing player's full-height projection of the
  // upright ring. Its low square opening is not tall enough to walk through.
  function ringBlocks(x,z,platforms,radius=ARCHITECTURE.playerRadius){
    for(const [i,p] of platforms.entries()){
      const heading=i===0?0:Math.atan2(p.x-platforms[0].x,p.z-platforms[0].z);
      const dx=x-p.x,dz=z-p.z,c=Math.cos(heading),s=Math.sin(heading);
      const localX=dx*c-dz*s,localZ=dx*s+dz*c;
      const nearestX=Math.max(-ARCHITECTURE.ringHalfWidth,Math.min(ARCHITECTURE.ringHalfWidth,localX));
      const nearestZ=Math.max(-ARCHITECTURE.ringHalfDepth,Math.min(ARCHITECTURE.ringHalfDepth,localZ));
      if(Math.hypot(localX-nearestX,localZ-nearestZ)<=radius+EPSILON)return true;
    }
    return false;
  }

  // A faceted pillar/cone at floor level is a regular octagon, not a circle.
  // The character's circular footprint overlaps it if the center is inside
  // the polygon or within playerRadius of one of its eight edges.
  function octagonalFootprintBlocks(dx,dz,baseRadius,playerRadius){
    const limit=baseRadius+playerRadius;
    if(Math.abs(dx)>limit||Math.abs(dz)>limit||Math.hypot(dx,dz)>limit)return false;
    let inside=true;
    const side=Math.PI/4;
    for(let i=0;i<8;i++){
      const a=i*side,b=(i+1)*side;
      const ax=baseRadius*Math.cos(a),az=baseRadius*Math.sin(a);
      const bx=baseRadius*Math.cos(b),bz=baseRadius*Math.sin(b);
      const vx=bx-ax,vz=bz-az,wx=dx-ax,wz=dz-az;
      if(vx*wz-vz*wx < -EPSILON)inside=false;
      const t=Math.max(0,Math.min(1,(wx*vx+wz*vz)/(vx*vx+vz*vz)));
      if(Math.hypot(wx-t*vx,wz-t*vz)<=playerRadius+EPSILON)return true;
    }
    return inside;
  }

  // Include every ring, four structural columns and four conical corner
  // markers on each of the five playable checkerboards.
  function obstacleAt(x,z,platforms,radius=ARCHITECTURE.playerRadius){
    if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(radius)||radius<0)throw Error('Invalid obstacle query');
    if(ringBlocks(x,z,platforms,radius))return 'ring';
    for(const p of platforms){
      const halfSpan=p.w*ARCHITECTURE.columnSpanFraction/2;
      for(const dx of [-halfSpan,halfSpan])for(const dz of [-halfSpan,halfSpan])
        if(octagonalFootprintBlocks(x-p.x-dx,z-p.z-dz,ARCHITECTURE.columnBaseRadius,radius))return 'column';
      const offset=p.w*ARCHITECTURE.markerOffsetFraction;
      for(const dx of [-offset,offset])for(const dz of [-offset,offset])
        if(octagonalFootprintBlocks(x-p.x-dx,z-p.z-dz,ARCHITECTURE.markerBaseRadius,radius))return 'marker';
    }
    return null;
  }

  // Resolve travel in short segments to prevent skipping narrow obstacles.
  // If a diagonal step is blocked, resolve its axes independently so a player
  // naturally slides along a wall or pillar rather than freezing entirely.
  function moveOnGround(position,dx,dz,platforms,steps,{
    radius=ARCHITECTURE.playerRadius,maxRise=.55,voidSpeed=.35,maxSubstep=.05
  }={}){
    if(![position.x,position.y,position.z,dx,dz,radius,maxRise,voidSpeed,maxSubstep].every(Number.isFinite)||
       radius<0||maxSubstep<=0||voidSpeed<0||voidSpeed>1)throw Error('Invalid movement');
    const result={x:position.x,y:position.y,z:position.z};
    const segments=Math.max(1,Math.ceil(Math.hypot(dx,dz)/maxSubstep));
    const move=(sx,sz)=>{
      if(sx===0&&sz===0)return true;
      const x=result.x+sx,z=result.z+sz;
      // Normally entering a solid is forbidden. A bird drop can place a
      // player *inside* one: allow movement until they escape, then block
      // re-entry. Otherwise a displaced player is permanently trapped.
      if(obstacleAt(x,z,platforms,radius)&&!obstacleAt(result.x,result.z,platforms,radius))return false;
      const level=groundAt(x,z,platforms,steps);
      if(level!==null){
        if(level-result.y>=maxRise)return false;
        result.x=x;result.z=z;result.y=level;return true;
      }
      const spillX=result.x+sx*voidSpeed,spillZ=result.z+sz*voidSpeed;
      if(obstacleAt(spillX,spillZ,platforms,radius)&&!obstacleAt(result.x,result.z,platforms,radius))return false;
      result.x=spillX;result.z=spillZ;return true;
    };
    for(let i=0;i<segments;i++){
      const sx=dx/segments,sz=dz/segments;
      if(move(sx,sz))continue;
      if(Math.abs(sx)>=Math.abs(sz)){move(sx,0);move(0,sz);}
      else{move(0,sz);move(sx,0);}
    }
    return {...result,dx:result.x-position.x,dz:result.z-position.z};
  }
  return { stairs, groundAt, clipNear, movementInput, patrol,
    ARCHITECTURE, ringBlocks, obstacleAt, moveOnGround };
});
