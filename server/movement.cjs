'use strict';
const G=require('../js/geometry.js');
const PLATFORMS=G.PLATFORMS,STEPS=G.stairs(PLATFORMS);
const SPEED=3.5,MAX_CREDIT=1.2,START_CREDIT=.65;
const nearly=(a,b,t=.08)=>Math.abs(a-b)<=t;

function assess(player,next,{credit,now,elapsedMs=0}={}){
  const dx=next.x-player.x,dz=next.z-player.z,distance=Math.hypot(dx,dz);
  const fromGround=G.groundAt(player.x,player.z,PLATFORMS,STEPS);
  const toGround=G.groundAt(next.x,next.z,PLATFORMS,STEPS);
  // Bird capture is now server-driven. Elevated displacement from a client
  // is never an exception to grounded movement constraints.
  if(distance>credit+1e-7)return {ok:false,reason:'speed'};
  // Endpoint tolerances must never let a grounded player enter a solid.
  if(G.obstacleAt(next.x,next.z,PLATFORMS)&&!G.obstacleAt(player.x,player.z,PLATFORMS))
    return {ok:false,reason:'blocked'};
  if(toGround!==null){
    if(!nearly(next.y,toGround,.15)){
      if(fromGround!==null&&player.y>fromGround+.35&&next.y<=player.y+.15&&next.y>=toGround)
        return {ok:true,position:{x:next.x,y:next.y,z:next.z},cost:distance};
      return {ok:false,reason:'height'};
    }
    const reached=G.moveOnGround(player,dx,dz,PLATFORMS,STEPS,{voidSpeed:1});
    if(!nearly(reached.x,next.x,.12)||!nearly(reached.z,next.z,.12))
      return {ok:false,reason:'blocked'};
    return {ok:true,position:{x:next.x,y:toGround,z:next.z},cost:distance};
  }
  // Leaving a board is permitted, not teleporting upward into the void.
  if(next.y>player.y+.2)return {ok:false,reason:'height'};
  const maxDrop=8*Math.max(0,elapsedMs)/1000+.5;
  if(player.y-next.y>Math.max(.5,maxDrop))return {ok:false,reason:'fall_speed'};
  const reached=G.moveOnGround(player,dx,dz,PLATFORMS,STEPS,{voidSpeed:1});
  if(!nearly(reached.x,next.x,.12)||!nearly(reached.z,next.z,.12))
    return {ok:false,reason:'blocked'};
  return {ok:true,position:{x:next.x,y:next.y,z:next.z},cost:distance};
}
function replenish(credit,elapsedMs){
 return Math.min(MAX_CREDIT,Math.max(0,credit)+Math.max(0,elapsedMs)*SPEED/1000);
}
module.exports={assess,replenish,SPEED,MAX_CREDIT,START_CREDIT};
