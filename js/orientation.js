(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DactylOrientation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const radians=Math.PI/180;
  function deviceBasis(alpha,beta,gamma,screenAngle=0){
    if(![alpha,beta,gamma,screenAngle].every(Number.isFinite))return null;
    const a=alpha*radians,b=beta*radians,c=gamma*radians,s=screenAngle*radians;
    const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cc=Math.cos(c),sc=Math.sin(c);
    // W3C intrinsic Z-X'-Y'' = Rz(alpha) Rx(beta) Ry(gamma).
    // Device coordinates remain portrait-based even when the screen rotates.
    // Convert earth X/Y/Z (east/north/up) to game X/Y/Z (east/up/north).
    function rotate([x,y,z]){
      const x1=cc*x+sc*z,z1=-sc*x+cc*z;
      const y2=cb*y-sb*z1,z2=sb*y+cb*z1;
      return [ca*x1-sa*y2,z2,sa*x1+ca*y2];
    }
    return {right:rotate([Math.cos(s),-Math.sin(s),0]),
      up:rotate([Math.sin(s),Math.cos(s),0]),forward:rotate([0,0,-1])};
  }
  function turn(basis,angle){
    const c=Math.cos(angle),s=Math.sin(angle);
    const rotate=([x,y,z])=>[x*c+z*s,y,z*c-x*s];
    return {right:rotate(basis.right),up:rotate(basis.up),forward:rotate(basis.forward)};
  }
  function viewBasis(yaw,pitch){
    const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
    return {right:[cy,0,-sy],up:[-sy*sp,cp,-cy*sp],forward:[sy*cp,sp,cy*cp]};
  }
  function angles(basis,fallbackYaw=0){
    const [x,y,z]=basis.forward;
    return {yaw:Math.hypot(x,z)<1e-7?fallbackYaw:Math.atan2(x,z),pitch:Math.asin(Math.max(-1,Math.min(1,y)))};
  }
  function cameraPoint(vertex,position,basis,eyeOffset=0,eyeHeight=1.65){
    const delta=vertex.map((v,i)=>v-position[i]-(i===1?eyeHeight:0)-basis.right[i]*eyeOffset);
    const dot=axis=>axis.reduce((n,v,i)=>n+v*delta[i],0);
    return [dot(basis.right),dot(basis.up),dot(basis.forward)];
  }
  return {deviceBasis,turn,viewBasis,angles,cameraPoint};
});
