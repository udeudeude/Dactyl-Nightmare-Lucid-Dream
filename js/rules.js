(function (root, factory) {
  const rules=factory();
  if(typeof module==='object'&&module.exports)module.exports=rules;
  else root.DactylRules=rules;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // CS 1000 service manual, printed p. 1.14: b<n>, default ten shots.
  // Per-player counting, reset policy and deferred attacks are reconstruction
  // decisions; the manual does not specify those details.
  class BirdTrigger {
    constructor(threshold=10){this.configure(threshold);}
    configure(value){
      const n=Number(value);
      this.threshold=Number.isInteger(n)&&n>=1&&n<=99?n:10;
      this.reset();
    }
    reset(){this.shots=0;this.pending=false;}
    recordShot(){
      this.shots=Math.min(this.threshold,this.shots+1);
      if(this.shots===this.threshold)this.pending=true;
    }
    takeAttack(ready){
      if(!ready||!this.pending)return false;
      this.reset();return true;
    }
  }
  // 1000CS service manual printed p.1.14: t<n>, default 180 seconds.
  // Absolute timestamps keep the server clock authoritative regardless of
  // browser animation speed, dropped frames, or socket reconnection.
  class MatchClock {
    constructor(duration=180){
      const seconds=Number(duration);
      if(!Number.isInteger(seconds)||seconds<1||seconds>3600)throw Error('Invalid match duration');
      this.duration=seconds;this.endsAt=null;
    }
    start(now){if(!Number.isFinite(now))throw Error('Invalid clock time');this.endsAt=now+this.duration*1000;return this.endsAt;}
    reset(){this.endsAt=null;}
    remaining(now){if(!Number.isFinite(now))throw Error('Invalid clock time');return this.endsAt===null?this.duration:Math.max(0,Math.ceil((this.endsAt-now)/1000));}
    expired(now){return this.endsAt!==null&&now>=this.endsAt;}
  }
  // Sherman & Craig's technical description of original Virtuality Dactyl:
  // +1 for each player hit, -1 when killed by the bird, high score at timeout.
  // The penalty threshold and tie presentation are not version-specific artifacts.
  function penalizeBirdDeath(score){
    if(!Number.isSafeInteger(score))throw Error('Invalid score');
    return score-1; // Do not assume an undocumented zero-point score floor.
  }
  // Tied winners share first place. A plain ranked result is a modern phone
  // convenience, NOT a reproduction of an original game-over display.
  function standings(players){
    if(!Array.isArray(players)||players.some(p=>!p||typeof p.id!=='string'||
       !Number.isSafeInteger(p.score)))throw Error('Invalid standings');
    const sorted=players.slice().sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
    return sorted.map((p,i)=>({...p,place:sorted.findIndex(q=>q.score===p.score)+1,
      winner:sorted.length>0&&p.score===sorted[0].score}));
  }
  return {BirdTrigger,MatchClock,penalizeBirdDeath,standings};
});
