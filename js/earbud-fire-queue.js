/* Input-event bursts become separate, cooldown-limited shots.
   A browser's media event is NOT proof of individual physical clicks. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DactylEarbudFire=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const SHOTS={fire:1,fire2:2,fire3:3};
function shotsForAction(action){return Object.hasOwn(SHOTS,action)?SHOTS[action]:0}
class FireQueue{
  constructor(maxPending=12){if(!Number.isInteger(maxPending)||maxPending<1)throw Error('Invalid queue limit');this.maxPending=maxPending;this.pending=0}
  request(count){if(!Number.isInteger(count)||count<1||count>3)throw Error('Invalid recognized burst');const accepted=Math.min(count,this.maxPending-this.pending);this.pending+=accepted;return {accepted,dropped:count-accepted,pending:this.pending}}
  drain(tryFire){if(this.pending===0)return false;if(tryFire()!==true)return false;this.pending--;return true}
  clear(){this.pending=0}
}
return {FireQueue,shotsForAction,SHOTS};
});