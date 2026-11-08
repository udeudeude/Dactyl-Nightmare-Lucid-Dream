/* Original-hardware visual reference: docs/VISUAL_RECONSTRUCTION.md.
   New geometry, not recovered assets. Dimensions and hidden faces are inferred. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DactylVisuals=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const PALETTE=Object.freeze({
    void:'#000000',star:'#c7d5d5',white:'#e4e6db',red:'#ed1717',blue:'#181bd5',
    teal:'#969f9f',tealSide:'#687579',tealDark:'#485558',
    yellow:'#e0ba35',yellowSide:'#c18a24',yellowDark:'#85551f',
    ring:'#ba531b',ringSide:'#863b18',marker:'#afd16b',
    gun:'#aab3b5',gunSide:'#778587',gunDark:'#3d494d',
    bird:'#35ac62',birdLight:'#55c77e',birdDark:'#217444',claws:'#d5d9ca',
    shirt:'#964720',shirtShade:'#66341f',trousers:'#2424cb',trouserShade:'#171785',
    skin:'#dbba80',skinShade:'#a48c60',head:'#20212d'
  });
  function mesh(){
    const faces=[];
    const face=(v,color,part)=>faces.push({v,color,part});
    function box(x,y,z,w,h,d,top,side,dark=side,part='architecture',includeTop=true){
      const a=x-w/2,b=x+w/2,e=z-d/2,f=z+d/2;
      if(includeTop)face([[a,y+h,e],[b,y+h,e],[b,y+h,f],[a,y+h,f]],top,part);
      face([[a,y,e],[b,y,e],[b,y+h,e],[a,y+h,e]],side,part);
      face([[b,y,e],[b,y,f],[b,y+h,f],[b,y+h,e]],dark,part);
      face([[b,y,f],[a,y,f],[a,y+h,f],[b,y+h,f]],side,part);
      face([[a,y,f],[a,y,e],[a,y+h,e],[a,y+h,f]],dark,part);
    }
    const floor=(x,z,w,d,y,color,part='floor')=>face([[x,y,z],[x+w,y,z],[x+w,y,z+d],[x,y,z+d]],color,part);
    return {faces,face,box,floor};
  }
  // Eight-sided lathed profiles keep the deliberately faceted columns and markers.
  function column(m,x,y,z,profile,colors,part){
    const n=8;
    for(let j=1;j<profile.length;j++)for(let i=0;i<n;i++){
      const a=i*Math.PI/4,b=(i+1)*Math.PI/4;
      const at=(k,t)=>[x+profile[k][1]*Math.cos(t),y+profile[k][0],z+profile[k][1]*Math.sin(t)];
      m.face([at(j-1,a),at(j-1,b),at(j,b),at(j,a)],colors[i%colors.length],part);
    }
  }
  // A solid extruded convex polygon, used for each arch segment and gun profile.
  function extrude(m,outline,depth,front,side,part){
    for(const z of [-depth/2,depth/2])m.face(outline.map(([x,y])=>[x,y,z]),front,part);
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];
      m.face([[...a,-depth/2],[...b,-depth/2],[...b,depth/2],[...a,depth/2]],side,part);
    }
  }
  function ring(x,y,z,heading=0){
    const m=mesh(),P=PALETTE;
    // GamePro 13:08 / 13:32: clipped square exterior and square aperture.
    // Split the square opening at side midpoints to match the eight outer edges.
    const outer=[[-.9,0],[.9,0],[1.4,.5],[1.4,2.3],[.9,2.8],[-.9,2.8],[-1.4,2.3],[-1.4,.5]];
    const inner=[[-.55,.8],[.55,.8],[.55,1.1],[.55,1.7],[.55,2],[-.55,2],[-.55,1.7],[-.55,1.1]];
    // Each wall is separate: never fill the aperture with a single polygon.
    for(let i=0;i<8;i++){
      const j=(i+1)%8,at=(p,d)=>[p[0],p[1],d];
      for(const d of [-.22,.22])m.face([at(outer[i],d),at(outer[j],d),at(inner[j],d),at(inner[i],d)],P.ring,'ring');
      for(const contour of [outer,inner])m.face([at(contour[i],-.22),at(contour[j],-.22),at(contour[j],.22),at(contour[i],.22)],P.ringSide,'ring');
    }
    return transform(m.faces,x,y,z,heading);
  }
  function arena(platforms,stairs){
    const m=mesh(),P=PALETTE;
    for(let index=0;index<platforms.length;index++){
      const p=platforms[index],border=index===0?p.w*.065:.35,inner=p.w-border*2;
      // GamePro aerial 13:20–13:24: center 3x3 quadrants, outer 2x2.
      // Rectified V03 central-floor samples support a one-cell cross, not two.
      // Outer board ratios remain provisional; do not transfer the central fit.
      const count=index===0?3:2,cross=index===0?inner/7:inner*.23,tile=(inner-cross)/(count*2);
      const x=p.x-p.w/2,z=p.z-p.w/2;
      m.floor(x,z,p.w,border,p.y,P.teal);m.floor(x,z+p.w-border,p.w,border,p.y,P.teal);
      m.floor(x,z+border,border,inner,p.y,P.teal);m.floor(x+p.w-border,z+border,border,inner,p.y,P.teal);
      m.floor(p.x-cross/2,z+border,cross,inner,p.y,P.teal);
      m.floor(x+border,p.z-cross/2,(inner-cross)/2,cross,p.y,P.teal);
      m.floor(p.x+cross/2,p.z-cross/2,(inner-cross)/2,cross,p.y,P.teal);
      for(let qx=0;qx<2;qx++)for(let qz=0;qz<2;qz++)for(let i=0;i<count;i++)for(let j=0;j<count;j++){
        m.floor(x+border+qx*(count*tile+cross)+i*tile,z+border+qz*(count*tile+cross)+j*tile,tile,tile,p.y,
          (i+j+qx*count+qz*count)%2?P.white:(index===0?P.blue:P.red),'checks');
      }
      m.box(p.x,p.y-.3,p.z,p.w,.3,p.w,P.teal,P.tealSide,P.tealDark,'slab',false);
      const span=p.w*.43,height=index===0?3.4:2.9;
      for(const dx of [-span/2,span/2])for(const dz of [-span/2,span/2]){
        column(m,p.x+dx,p.y,p.z+dz,[[0,.43],[.12,.43],[.45,.19],[height-.22,.19],[height,.32]],
          [P.yellow,P.yellowSide,P.yellowDark,P.yellowSide],'column');
      }
      // Angular arch soffits visible at 13:36. Split into convex sections for clipping.
      for(let side=0;side<4;side++){
        const beam=mesh(),half=span/2,thickness=.3;
        const xs=[-half,-half*.58,half*.58,half],bottom=[-.48,-.08,-.08,-.48];
        for(let k=0;k<3;k++)extrude(beam,[[xs[k],bottom[k]],[xs[k+1],bottom[k+1]],[xs[k+1],thickness],[xs[k],thickness]],.38,P.yellow,P.yellowSide,'arch');
        const angle=side*Math.PI/2;
        m.faces.push(...transform(beam.faces,p.x+Math.sin(angle)*half,p.y+height,p.z+Math.cos(angle)*half,angle));
      }
      const heading=index===0?0:Math.atan2(p.x-platforms[0].x,p.z-platforms[0].z);
      m.faces.push(...ring(p.x,p.y,p.z,heading));
      // Faceted corner cones are visible on center and outer boards; dimensions inferred.
      const offset=p.w*.37;
      for(const dx of [-offset,offset])for(const dz of [-offset,offset])
        column(m,p.x+dx,p.y,p.z+dz,[[0,.42],[.12,.42],[.75,0]],
          index===0?[P.yellow,P.yellowSide]:[P.marker,P.birdLight],'marker');
    }
    for(const p of stairs)m.box(p.x,p.y-.25,p.z,p.w,.25,p.d,
      P.teal,P.yellow,P.yellowSide,'stairs');
    return m.faces;
  }
  function transform(faces,x,y,z,heading){
    const s=Math.sin(heading),c=Math.cos(heading);
    return faces.map(f=>({...f,v:f.v.map(([a,b,d])=>[x+a*c+d*s,y+b,z-a*s+d*c])}));
  }
  // Shared by the visible opponent and the stereo first-person model.
  function weapon(){
    const m=mesh(),P=PALETTE;
    // Barrel runs along +Z. Broad octagonal muzzle and a narrower stepped receiver.
    const sections=[[0,.075,.09],[.42,.075,.09],[.48,.12,.12],[.72,.12,.12],[.8,.075,.09]];
    const contour=(z,w,h)=>[[-w,-h,z],[w,-h,z],[w,h*.5,z],[w*.5,h,z],[-w*.5,h,z],[-w,h*.5,z]];
    for(let k=1;k<sections.length;k++){
      const a=contour(...sections[k-1]),b=contour(...sections[k]);
      for(let i=0;i<a.length;i++)m.face([a[i],a[(i+1)%a.length],b[(i+1)%a.length],b[i]],i%2?P.gun:P.gunSide,'weapon');
    }
    m.face(contour(...sections[sections.length-1]),P.gunDark,'weapon');
    m.box(0,-.22,.1,.12,.22,.17,P.gun,P.gunSide,P.gunDark,'weapon');
    m.box(0,-.18,.1,.16,.13,.2,P.skin,P.skinShade,P.skinShade,'hand');
    return m.faces;
  }
  const gun=weapon();
  function firstPersonWeapon(position,basis){
    // A single 3D model transformed once from the cyclopean aim basis; draw() applies
    // each eye offset. No screen-space gun duplication or independent eye placement.
    return gun.map(f=>({...f,v:f.v.map(([x,y,z])=>{
      const local=[x+.22,y-.28,z+.36];
      return [position.x,position.y+1.65,position.z].map((v,i)=>v+basis.right[i]*local[0]+basis.up[i]*local[1]+basis.forward[i]*local[2]);
    })}));
  }
  function avatar(position,{heading=0,phase=0,moving=false}={}){
    const m=mesh(),P=PALETTE,step=moving?Math.sin(phase)*.18:0;
    for(const side of [-1,1]){
      m.box(side*.2,.1,side*step,.27,1.05,.32,P.trousers,P.trouserShade,P.trouserShade,'avatar');
      m.box(side*.2,0,.08+side*step,.29,.12,.44,P.head,P.head,P.head,'avatar');
    }
    // Brown short sleeves; right forearm raised to the gun, free left arm lowered.
    m.box(0,1.15,0,.74,.8,.43,P.shirt,P.shirtShade,P.shirtShade,'avatar');
    m.box(-.48,1.45,0,.22,.45,.28,P.shirt,P.shirtShade,P.shirtShade,'avatar');
    m.box(-.48,1.02,.03,.18,.44,.2,P.skin,P.skinShade,P.skinShade,'avatar');
    m.box(.46,1.48,.05,.22,.4,.28,P.shirt,P.shirtShade,P.shirtShade,'avatar');
    m.box(.46,1.46,.28,.18,.19,.44,P.skin,P.skinShade,P.skinShade,'avatar');
    m.faces.push(...transform(gun,.46,1.69,.43,0));
    m.box(0,1.95,0,.22,.15,.22,P.skin,P.skinShade,P.skinShade,'avatar');
    m.box(0,2.1,0,.42,.42,.4,P.skin,P.skinShade,P.skinShade,'avatar');
    m.box(0,2.44,-.02,.45,.14,.42,P.head,P.head,P.head,'avatar');
    return transform(m.faces,position.x,position.y||0,position.z,heading);
  }
  function bird({x,y,z,heading=0,flap=0}){
    const m=mesh(),P=PALETTE;
    // Broad angular membranes with segmented flat greens; no feathers/texture.
    for(const side of [-1,1]){
      const root=[side*.38,0,.45],elbow=[side*2.6,flap*.35,.9];
      const tip=[side*5.3,flap,-1.2],rear=[side*2.2,flap*.2,-.85],hip=[side*.3,-.1,-.65];
      m.face([root,elbow,rear],P.birdLight,'bird');
      m.face([elbow,tip,rear],P.bird,'bird');
      m.face([root,rear,hip],P.birdDark,'bird');
      m.face([[side*.2,-.2,-.35],[side*.35,-.85,-.5],[side*.45,-.8,-.45]],P.birdDark,'bird');
      for(let toe=0;toe<3;toe++){
        const tx=side*(.27+toe*.1);
        m.face([[tx,-.78,-.45],[tx+.045,-1.1,-.12],[tx+.09,-.79,-.4]],P.claws,'bird');
      }
    }
    m.face([[-.45,0,.8],[.45,0,.8],[0,.35,-.6]],P.birdLight,'bird');
    m.face([[-.45,0,.8],[0,-.35,-.5],[.45,0,.8]],P.birdDark,'bird');
    m.face([[-.3,0,.7],[.3,0,.7],[.2,.5,1.5],[-.2,.5,1.5]],P.bird,'bird');
    m.face([[-.25,.5,1.4],[.25,.5,1.4],[0,.35,2.7]],P.birdLight,'bird');
    m.face([[-.25,.5,1.4],[0,.1,1.8],[0,.35,2.7]],P.birdDark,'bird');
    m.face([[-.15,.5,1.1],[.15,.5,1.1],[0,.95,.4]],P.bird,'bird');
    return transform(m.faces,x,y,z,heading);
  }
  // A fixed distant star field: only camera rotation moves it; no sparkle effect.
  const stars=Object.freeze(Array.from({length:120},(_,i)=>{
    const y=1-2*(i+.5)/120,r=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));
    return Object.freeze([Math.cos(a)*r,y,Math.sin(a)*r]);
  }));
  function drawStars(context,x,width,height,basis,scale){
    context.fillStyle=PALETTE.star;
    const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    for(const star of stars){
      const depth=dot(star,basis.forward);if(depth<=0)continue;
      const px=x+width/2+dot(star,basis.right)*scale/depth,py=height/2-dot(star,basis.up)*scale/depth;
      if(px<x+2||px>x+width-2||py<2||py>height-2)continue;
      context.fillRect(Math.round(px)-2,Math.round(py),5,1);
      context.fillRect(Math.round(px),Math.round(py)-2,1,5);
    }
  }
  return {PALETTE,arena,ring,avatar,bird,weapon,firstPersonWeapon,stars,drawStars};
});
