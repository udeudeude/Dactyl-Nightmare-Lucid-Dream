'use strict';
// Development-only planar metrology. No image files or external dependencies.
// Four coplanar corners, in boundary order, define a unit square. This does NOT
// calibrate a camera or recover height, depth, absolute scale or off-plane objects.
function homography(corners){
 if(!Array.isArray(corners)||corners.length!==4||corners.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))throw Error('Four finite plane corners required');
 const crosses=corners.map((a,i)=>{const b=corners[(i+1)%4],c=corners[(i+2)%4];return (b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);});
 if(crosses.some(x=>Math.abs(x)<1e-10)||!crosses.every(x=>Math.sign(x)===Math.sign(crosses[0])))throw Error('Corners must form a convex boundary');
 // Normalize input coordinates for numerical stability with large source images.
 const origin=corners.reduce((v,p)=>v.map((a,i)=>a+p[i]/4),[0,0]);
 const scale=Math.max(...corners.flatMap(p=>p.map((v,i)=>Math.abs(v-origin[i]))));
 const target=[[0,0],[1,0],[1,1],[0,1]],rows=[];
 corners.forEach(([px,py],i)=>{const x=(px-origin[0])/scale,y=(py-origin[1])/scale,[u,v]=target[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);});
 for(let j=0;j<8;j++){
  let pivot=j;for(let i=j+1;i<8;i++)if(Math.abs(rows[i][j])>Math.abs(rows[pivot][j]))pivot=i;
  if(Math.abs(rows[pivot][j])<1e-10)throw Error('Degenerate plane');
  [rows[j],rows[pivot]]=[rows[pivot],rows[j]];
  const divisor=rows[j][j];rows[j]=rows[j].map(v=>v/divisor);
  for(let i=0;i<8;i++)if(i!==j){const factor=rows[i][j];rows[i]=rows[i].map((v,k)=>v-factor*rows[j][k]);}
 }
 const h=rows.map(r=>r[8]);
 return point=>{
  if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite))throw Error('Finite point required');
  const x=(point[0]-origin[0])/scale,y=(point[1]-origin[1])/scale,d=h[6]*x+h[7]*y+1;
  if(Math.abs(d)<1e-10)throw Error('Point lies on projective horizon');
  return [(h[0]*x+h[1]*y+h[2])/d,(h[3]*x+h[4]*y+h[5])/d];
 };
}
function measure(corners,points){
 const project=homography(corners),p=points.map(project);
 if(p.length!==5)throw Error('Cross edges and three tile edges required');
 const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const cross=length(p[0],p[1]),tiles=p.slice(1,-1).map((a,i)=>length(a,p[i+2]));
 if(tiles.some(x=>x<=1e-10))throw Error('Zero-length tile');
 const tile=tiles.reduce((a,b)=>a+b,0)/tiles.length;
 return {cross,tile,crossToTile:cross/tile,tiles};
}
function analyze(data,trials=1000){
 let seed=1991;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 return data.scanlines.map(line=>{
  const base=measure(data.corners,line.points),ratios=[];
  for(let i=0;i<trials;i++){
   const jitter=(p,e)=>p.map(v=>v+(random()*2-1)*e);
   const corners=data.corners.map(p=>jitter(p,data.cornerErrorPixels));
   ratios.push(measure(corners,line.points.map(p=>jitter(p,data.edgeErrorPixels))).crossToTile);
  }
  ratios.sort((a,b)=>a-b);
  return {name:line.name,...base,sensitivity95:[ratios[Math.floor(trials*.025)],ratios[Math.floor(trials*.975)]]};
 });
}
module.exports={homography,measure,analyze};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path');
 const file=process.argv[2]||path.join(__dirname,'../research/period-center-floor.json');
 console.log(JSON.stringify(analyze(JSON.parse(fs.readFileSync(file,'utf8'))),null,2));
}
