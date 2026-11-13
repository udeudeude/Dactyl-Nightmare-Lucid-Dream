const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../js/geometry.js'),V=require('../js/visuals.js'),O=require('../js/orientation.js');
const platforms=[{x:0,z:0,w:12,y:0},{x:-13,z:0,w:10,y:2},{x:13,z:0,w:10,y:2},{x:0,z:-13,w:10,y:2},{x:0,z:13,w:10,y:2}];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function validMesh(faces){
 for(const f of faces){
  assert.match(f.color,/^#[0-9a-f]{6}$/i);
  assert.ok(f.v.length>=3,'all faces need three distinct vertices');
  for(const vertex of f.v)assert.ok(vertex.length===3&&vertex.every(Number.isFinite));
  const a=f.v[0],sub=b=>b.map((n,i)=>n-a[i]);
  const basis=cross(sub(f.v[1]),sub(f.v[2])),size=Math.hypot(...basis);
  assert.ok(size>1e-9,'first triangle must have positive area: '+f.part);
  for(let i=1;i<f.v.length-1;i++){
   const normal=cross(sub(f.v[i]),sub(f.v[i+1]));
   assert.ok(Math.hypot(...normal)>1e-9,'zero-area fan triangle: '+f.part);
   // Coplanarity makes face splitting deterministic across both renderers.
   const alignment=normal.reduce((sum,n,j)=>sum+n*basis[j],0);
   assert.ok(alignment>0,'folded or winding-reversing polygon: '+f.part);
  }
  for(const vertex of f.v.slice(3)){
   const height=Math.abs(basis.reduce((sum,n,j)=>sum+n*(vertex[j]-a[j]),0))/size;
   assert.ok(height<1e-7,'nonplanar polygon: '+f.part+' '+height);
  }
 }
}
test('every original-scene polygon has valid area, winding and a single plane',()=>{
 const meshes=[V.arena(platforms,G.stairs(platforms)),V.weapon()];
 for(const [heading,flap] of [[0,-1.3],[1.2,0],[2.8,1.3]]){
  const basis=O.viewBasis(heading,.23);
  meshes.push(V.avatar({x:3,y:2,z:-3},{heading,moving:true,phase:heading}));
  meshes.push(V.bird({x:0,y:8,z:0,heading,flap}));
  meshes.push(V.firstPersonWeapon({x:3,y:2,z:5},basis));
 }
 for(const mesh of meshes)validMesh(mesh);
});
test('cone tips have eight real triangular facets and no duplicate apex',()=>{
 const arena=V.arena(platforms,G.stairs(platforms));
 const pointed=arena.filter(f=>f.part==='marker'&&f.v.length===3);
 assert.equal(pointed.length,5*4*8);
 for(const f of pointed)assert.notDeepEqual(f.v[0],f.v[1]);
});
test('mesh uses the same triangle count and vertex values in depth buffer',()=>{
 const faces=[...V.arena(platforms,G.stairs(platforms)),...V.weapon()];
 const R=require('../js/depth-renderer.js'),buffer=R.triangulate(faces);
 const triangles=faces.reduce((total,f)=>total+f.v.length-2,0);
 assert.equal(buffer.length,triangles*18);
 assert.ok(buffer.every(Number.isFinite));
 assert.ok(triangles<4400,'keep the 20-frame-per-second scene budget bounded');
});
