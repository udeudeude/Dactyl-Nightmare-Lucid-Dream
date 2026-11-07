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
  return {BirdTrigger};
});
