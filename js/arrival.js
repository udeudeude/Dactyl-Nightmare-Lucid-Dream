/* Optional, explicitly inferred 1000CS aerial-to-ground arrival.
   Independent 1994/95 player reports support the sequence, not its path.
   The reconstruction exposes the inferred motion in Cardboard when selected. */
(function(root,factory){
  const orientation=typeof module==='object'&&module.exports?require('./orientation.js'):root.DactylOrientation;
  const api=factory(orientation);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DactylArrival=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(orientation){
  'use strict';
  const DURATION_MS=3200;
  const BEGIN=Object.freeze({x:-5,y:14,z:9});
  const TARGET=Object.freeze({x:0,y:0,z:0});
  const clamp=x=>Math.max(0,Math.min(1,x));
  function create(now,finish,duration=DURATION_MS){
    if(!Number.isFinite(now)||!Number.isFinite(duration)||duration<=0||
       !finish||![finish.x,finish.y,finish.z].every(Number.isFinite))
      throw Error('Invalid aerial arrival');
    const startYaw=Math.atan2(TARGET.x-BEGIN.x,TARGET.z-BEGIN.z);
    const horizontal=Math.hypot(TARGET.x-BEGIN.x,TARGET.z-BEGIN.z);
    const startPitch=Math.atan2(TARGET.y-BEGIN.y-1.65,horizontal);
    const finalYaw=Math.atan2(-finish.x,-finish.z);
    return {startedAt:now,duration,finish:{x:finish.x,y:finish.y,z:finish.z},
      startYaw,startPitch,finalYaw};
  }
  function sample(arrival,now){
    if(!arrival||!Number.isFinite(now))throw Error('Invalid aerial sample');
    const progress=clamp((now-arrival.startedAt)/arrival.duration);
    const eased=progress*progress*(3-2*progress);
    const mix=(a,b)=>a+(b-a)*eased;
    const position={x:mix(BEGIN.x,arrival.finish.x),
      y:mix(BEGIN.y,arrival.finish.y),z:mix(BEGIN.z,arrival.finish.z)};
    const yaw=mix(arrival.startYaw,arrival.finalYaw);
    const pitch=mix(arrival.startPitch,0);
    return {position,basis:orientation.viewBasis(yaw,pitch),yaw,pitch,
      progress,active:progress<1};
  }
  return {DURATION_MS,BEGIN,create,sample};
});
