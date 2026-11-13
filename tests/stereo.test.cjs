const {test}=require('node:test');
const assert=require('node:assert/strict');
const stereo=require('../js/stereo.js');
const orientation=require('../js/orientation.js');

test('stereo settings keep the historical 0.06-world-unit default and safe bounds',()=>{
 assert.equal(stereo.DEFAULT,.06);
 assert.equal(stereo.separationFromPercent(0),0);
 assert.equal(stereo.separationFromPercent(50),.06);
 assert.equal(stereo.separationFromPercent(100),.12);
 assert.equal(stereo.separationFromPercent(-300),0);
 assert.equal(stereo.separationFromPercent(200),.12);
 assert.equal(stereo.percentFromSeparation(.06),50);
 assert.equal(stereo.description(0),'Flat');
 assert.equal(stereo.description(50),'Normal');
 assert.throws(()=>stereo.separationFromPercent(NaN));
});
test('Cardboard eye locations are symmetric, and phone mode is cyclopean',()=>{
 for(const separation of [0,.02,.06,.10,.12]){
   const left=stereo.eyeOffset(0,2,separation);
   const right=stereo.eyeOffset(1,2,separation);
   assert.equal(left,-right);
   assert.equal(right-left,separation);
   assert.equal(stereo.eyeOffset(0,1,separation),0);
 }
 for(const [idx,count,sep] of [[-1,2,.06],[2,2,.06],[0,3,.06],[0,2,1]])
   assert.throws(()=>stereo.eyeOffset(idx,count,sep));
});
test('Canvas fallback and WebGL share parallax direction and proximity response',()=>{
 const basis=orientation.viewBasis(0,0),origin=[0,0,0];
 const left=stereo.eyeOffset(0,2,stereo.DEFAULT);
 const right=stereo.eyeOffset(1,2,stereo.DEFAULT);
 function offsetAt(distance){
   const point=[0,1.65,distance];
   const a=orientation.cameraPoint(point,origin,basis,left);
   const b=orientation.cameraPoint(point,origin,basis,right);
   return [a[0]/a[2],b[0]/b[2]];
 }
 const near=offsetAt(2),far=offsetAt(20);
 assert.ok(near[0]>0&&near[1]<0);
 assert.ok(Math.abs(near[0]-near[1])>Math.abs(far[0]-far[1]));
 assert.ok(Math.abs(near[0]+near[1])<1e-10);
});
