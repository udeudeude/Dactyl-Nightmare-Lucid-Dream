/* Deterministic reconstructed pterodactyl behavior shared by room server and
   mobile visual client. The ten-shot trigger is sourced to the 1000CS manual;
   pursuit, capture timings and trajectory are provisional reconstructions. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DactylBird=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ATTACK_MS=2800,CARRY_MS=2200,INITIAL_COOLDOWN_MS=7000;
  const RETRY_MS=13000,DROP_COOLDOWN_MS=8000,SHOT_THRESHOLD=10;
  function pose(now,startedAt){
    const t=Math.max(0,(now-startedAt)/1000);
    return {x:Math.cos(t*.48)*10,y:8+Math.sin(t*.6)*1.8,z:Math.sin(t*.48)*10,
      heading:-t*.48,flap:Math.sin(t*4)*1.3};
  }
  function create(startedAt){
    if(!Number.isFinite(startedAt))throw Error('Invalid bird start time');
    return {startedAt,phase:'patrol',target:null,until:null,
      cooldownUntil:startedAt+INITIAL_COOLDOWN_MS,sequence:0};
  }
  function publicState(bird){
    return {startedAt:bird.startedAt,phase:bird.phase,target:bird.target,
      until:bird.until,sequence:bird.sequence};
  }
  function recordShot(player){
    player.birdShots=Math.min(SHOT_THRESHOLD,(player.birdShots||0)+1);
    if(player.birdShots===SHOT_THRESHOLD)player.pendingBird=true;
  }
  function change(bird,phase,target,until){
    bird.phase=phase;bird.target=target;bird.until=until;bird.sequence++;
    return {phase,target,until};
  }
  function advance(bird,players,now){
    if(!Number.isFinite(now))throw Error('Invalid bird time');
    const events=[],byId=id=>players.find(p=>p.id===id),at=pose(now,bird.startedAt);
    if(bird.phase==='carry'){
      const victim=byId(bird.target);
      if(victim){
        victim.x=at.x;victim.y=at.y-2;victim.z=at.z;
        if(now>=bird.until){
          // The original drop dynamics are unverified. Release into the
          // existing gravity and ground-collision simulation.
          victim.y=5;victim.epoch++;victim.shieldUntil=now+4000;
          victim.moveAt=now;victim.moveCredit=.65;
          const event=change(bird,'patrol',null,null);
          bird.cooldownUntil=now+DROP_COOLDOWN_MS;
          events.push({...event,kind:'drop',target:victim.id,position:{x:victim.x,y:victim.y,z:victim.z},
            epoch:victim.epoch,sequence:bird.sequence});
        }
      }else{
        change(bird,'patrol',null,null);bird.cooldownUntil=now+DROP_COOLDOWN_MS;
      }
    }else if(bird.phase==='approach' && now>=bird.until){
      const victim=byId(bird.target);
      if(victim && victim.socket && now>=victim.shieldUntil &&
          Math.hypot(victim.x-at.x,victim.z-at.z)<16){
        victim.x=at.x;victim.y=at.y-2;victim.z=at.z;
        victim.epoch++;victim.shieldUntil=now+CARRY_MS+4000;
        victim.moveAt=now;victim.moveCredit=.65;
        const target=victim.id,event=change(bird,'carry',target,now+CARRY_MS);
        events.push({kind:'seize',target,position:{x:victim.x,y:victim.y,z:victim.z},
          epoch:victim.epoch,sequence:bird.sequence,...event});
      }else{
        const target=bird.target;
        change(bird,'patrol',null,null);bird.cooldownUntil=now+RETRY_MS;
        events.push({kind:'miss',target,sequence:bird.sequence});
      }
    }
    if(bird.phase==='patrol' && now>=bird.cooldownUntil){
      const victim=players.find(p=>p.pendingBird && p.socket && now>=p.shieldUntil);
      if(victim){
        victim.pendingBird=false;victim.birdShots=0;
        const event=change(bird,'approach',victim.id,now+ATTACK_MS);
        events.push({kind:'approach',target:victim.id,sequence:bird.sequence,...event});
      }
    }
    return events;
  }
  return {pose,create,publicState,recordShot,advance,
    SHOT_THRESHOLD,ATTACK_MS,CARRY_MS};
});
