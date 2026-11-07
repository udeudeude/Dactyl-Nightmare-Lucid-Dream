const {test}=require('node:test');
const assert=require('node:assert/strict');
const {deviceBasis,viewBasis,turn,angles,cameraPoint}=require('../js/orientation.js');
function close(a,b){assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);}
function same(a,b){for(const key of ['right','up','forward'])a[key].forEach((v,i)=>close(v,b[key][i]));}
test('upright portrait and both landscape poses produce the same horizon',()=>{
  const forward=viewBasis(0,0);
  same(deviceBasis(0,90,0,0),forward);
  same(deviceBasis(90,0,-90,90),forward);
  same(deviceBasis(270,0,90,-90),forward);
});
test('sensor basis is orthonormal across roll, tilt and screen orientation',()=>{
  for(const a of [0,67,179,359])for(const b of [-170,-30,0,90,179])for(const g of [-90,-37,0,68,89])for(const s of [-90,0,90,180]){
    const basis=deviceBasis(a,b,g,s);const vectors=Object.values(basis);
    for(const v of vectors)close(Math.hypot(...v),1);
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)close(vectors[i].reduce((sum,v,k)=>sum+v*vectors[j][k],0),0);
  }
});
test('heading calibration changes yaw without flattening pitch or roll',()=>{
  const basis=deviceBasis(43,72,31,0);const original=angles(basis);
  const calibrated=turn(basis,Math.PI/2-original.yaw);
  close(angles(calibrated).yaw,Math.PI/2);close(angles(calibrated).pitch,original.pitch);
  close(calibrated.right[1],basis.right[1]);
});
test('head roll rotates both camera projection and stereo baseline',()=>{
  const basis=deviceBasis(10,50,50,90),position=[2,3,4],point=[5,6,12];
  const left=cameraPoint(point,position,basis,-.03),right=cameraPoint(point,position,basis,.03);
  close(left[0]-right[0],.06);close(left[1],right[1]);close(left[2],right[2]);
});
test('invalid readings are ignored and looking straight down retains last yaw',()=>{
  assert.equal(deviceBasis(null,90,0,0),null);assert.equal(deviceBasis(0,NaN,0,0),null);
  const pose=angles(deviceBasis(0,0,0),1.2);close(pose.yaw,1.2);close(pose.pitch,-Math.PI/2);
});
