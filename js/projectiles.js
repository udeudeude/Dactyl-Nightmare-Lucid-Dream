/* Shared server/browser projectile physics against the actual reconstructed mesh.
   The reconstruction's geometry is provisional, but its solid surfaces are not optional. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DactylProjectiles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const EPS=1e-9;
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

  // Concave polygons must already be split by the mesh author. The render
  // pipeline uses the identical triangle fan and therefore the identical walls.
  function makeWorld(faces){
    const triangles=[];
    for(const face of faces){
      if(!face.v||face.v.length<3)continue;
      for(let k=1;k<face.v.length-1;k++){
        const a=face.v[0],b=face.v[k],c=face.v[k+1];
        const e1=sub(b,a),e2=sub(c,a),n=cross(e1,e2);
        if(dot(n,n)<1e-18)continue;
        triangles.push({a,e1,e2,part:face.part||'scenery',
          min:[0,1,2].map(j=>Math.min(a[j],b[j],c[j])),
          max:[0,1,2].map(j=>Math.max(a[j],b[j],c[j]))});
      }
    }
    return triangles;
  }
  function terrainImpact(start,end,world){
    const direction=sub(end,start);
    const low=[0,1,2].map(j=>Math.min(start[j],end[j])-EPS);
    const high=[0,1,2].map(j=>Math.max(start[j],end[j])+EPS);
    let best=null;
    for(const t of world){
      if([0,1,2].some(j=>high[j]<t.min[j]||low[j]>t.max[j]))continue;
      // Double-sided Moller-Trumbore intersection, not a one-sided face test.
      const p=cross(direction,t.e2),det=dot(t.e1,p);
      if(Math.abs(det)<EPS)continue;
      const inv=1/det,s=sub(start,t.a),u=dot(s,p)*inv;
      if(u< -EPS||u>1+EPS)continue;
      const q=cross(s,t.e1),v=dot(direction,q)*inv;
      if(v< -EPS||u+v>1+EPS)continue;
      const ratio=dot(t.e2,q)*inv;
      if(ratio< -EPS||ratio>1+EPS)continue;
      if(!best||ratio<best.t)best={kind:'scenery',t:Math.max(0,ratio),part:t.part};
    }
    return best;
  }
  // Earliest intersection with a standing actor's vertical cylinder.
  function actorImpact(start,end,actor,radius=.9,height=3){
    const dx=end[0]-start[0],dz=end[2]-start[2];
    const ox=start[0]-actor.x,oz=start[2]-actor.z;
    const a=dx*dx+dz*dz,b=2*(ox*dx+oz*dz),c=ox*ox+oz*oz-radius*radius;
    let lo=0,hi=1;
    if(a<EPS){if(c>0)return null;}
    else{
      const determinant=b*b-4*a*c;
      if(determinant<0)return null;
      const root=Math.sqrt(Math.max(0,determinant));
      const t1=(-b-root)/(2*a),t2=(-b+root)/(2*a);
      lo=Math.max(lo,Math.min(t1,t2));
      hi=Math.min(hi,Math.max(t1,t2));
      if(lo>hi)return null;
    }
    const vy=end[1]-start[1],floor=actor.y,ceiling=actor.y+height;
    if(Math.abs(vy)<EPS){if(start[1]<floor||start[1]>ceiling)return null;}
    else{
      const t1=(floor-start[1])/vy,t2=(ceiling-start[1])/vy;
      lo=Math.max(lo,Math.min(t1,t2));
      hi=Math.min(hi,Math.max(t1,t2));
      if(lo>hi)return null;
    }
    return hi<0||lo>1?null:Math.max(0,lo);
  }
  // Modifies the projectile exactly once. Geometry and players are tested along
  // the same swept path, so a player cannot be hit through a nearer column.
  function advance(shot,dt,world,actors=[],owner=shot.owner){
    if(!Number.isFinite(dt)||dt<0||dt>.25)throw Error('Invalid projectile interval');
    const start=[shot.x,shot.y,shot.z];
    const end=[shot.x+shot.vx*dt,shot.y+shot.vy*dt,shot.z+shot.vz*dt];
    let hit=terrainImpact(start,end,world);
    for(const actor of actors){
      if(actor.id===owner||actor.shielded)continue;
      const t=actorImpact(start,end,actor);
      if(t!==null&&(!hit||t<hit.t))hit={kind:'player',t,target:actor.id};
    }
    const ratio=hit?.t??1;
    shot.x=start[0]+(end[0]-start[0])*ratio;
    shot.y=start[1]+(end[1]-start[1])*ratio;
    shot.z=start[2]+(end[2]-start[2])*ratio;
    shot.vy-=9.8*dt*ratio;
    shot.ttl-=dt*ratio;
    if(hit)shot.ttl=0;
    if(!hit&&shot.ttl<=0)hit={kind:'expired',t:1};
    return hit;
  }
  return {makeWorld,terrainImpact,actorImpact,advance};
});
