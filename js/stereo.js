/* One stereo geometry policy for WebGL and the Canvas fallback.
   Distances are provisional world units, NOT a measured physical lens profile. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DactylStereo=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DEFAULT=.06,MAX=.12;
  function separationFromPercent(percent){
    const p=Number(percent);
    if(!Number.isFinite(p))throw Error('Invalid stereo depth');
    return Math.min(100,Math.max(0,p))*MAX/100;
  }
  function percentFromSeparation(separation){
    if(!Number.isFinite(separation))throw Error('Invalid stereo separation');
    return Math.round(100*Math.min(MAX,Math.max(0,separation))/MAX);
  }
  function eyeOffset(index,count,separation=DEFAULT){
    if(!Number.isInteger(index)||!Number.isInteger(count)||
        (count!==1&&count!==2)||index<0||index>=count||
        !Number.isFinite(separation)||separation<0||separation>MAX)
      throw Error('Invalid stereo eye configuration');
    return count===1?0:(index===0?-.5:.5)*separation;
  }
  function description(percent){
    const p=Number(percent);
    return p===0?'Flat':p<40?'Reduced':p<=60?'Normal':'Increased';
  }
  return {DEFAULT,MAX,separationFromPercent,percentFromSeparation,eyeOffset,description};
});
