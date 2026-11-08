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
    teal:'#49b6a0',tealSide:'#287c70',tealDark:'#20594f',
    yellow:'#dedb35',yellowSide:'#aaa82a',yellowDark:'#777a1d',
    bird:'#36dc18',birdLight:'#78ef36',birdDark:'#1a9b20',claws:'#902320',
    shirt:'#e0e2dc',shirtShade:'#a8b8b8',trousers:'#2424cb',trouserShade:'#171785',
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
  function arena(platforms,stairs){
    const m=mesh(),P=PALETTE;
    for(let index=0;index<platforms.length;index++){
      const p=platforms[index],border=.35,inner=p.w-border*2,tile=inner/8;
      const x=p.x-p.w/2,z=p.z-p.w/2;
      // Teal perimeter and a two-tile cross, with contrasting checker quadrants.
      // Eight divisions and these proportions are estimates from the capture.
      m.floor(x,z,p.w,border,p.y,P.teal);m.floor(x,z+p.w-border,p.w,border,p.y,P.teal);
      m.floor(x,z+border,border,inner,p.y,P.teal);m.floor(x+p.w-border,z+border,border,inner,p.y,P.teal);
      for(let i=0;i<8;i++)for(let j=0;j<8;j++){
        const cross=(i===3||i===4||j===3||j===4);
        const color=cross?P.teal:(i+j)%2?P.white:(index===0?P.blue:P.red);
        m.floor(x+border+i*tile,z+border+j*tile,tile,tile,p.y,color);
      }
      m.box(p.x,p.y-.3,p.z,p.w,.3,p.w,P.teal,P.tealSide,P.tealDark,'slab',false);
      // Open yellow posts/lintels replace the unsupported solid central tower.
      // Repetition on unseen platforms and exact spans remain reconstruction.
      const span=p.w*.43,height=index===0?3.4:2.9,post=.36,beam=.34;
      for(const dx of [-span/2,span/2])for(const dz of [-span/2,span/2]){
        m.box(p.x+dx,p.y,p.z+dz,.62,.18,.62,P.yellow,P.yellowSide,P.yellowDark,'frame');
        m.box(p.x+dx,p.y+.18,p.z+dz,post,height-.18,post,P.yellow,P.yellowSide,P.yellowDark,'frame');
      }
      for(const sign of [-1,1]){
        m.box(p.x,p.y+height,p.z+sign*span/2,span+post,beam,post,P.yellow,P.yellowSide,P.yellowDark,'frame');
        m.box(p.x+sign*span/2,p.y+height,p.z,post,beam,span+post,P.yellow,P.yellowSide,P.yellowDark,'frame');
      }
    }
    // The 1993 first-person account describes a large doughnut-shaped object
    // in the center of the lower arena. Faceted ring geometry is provisional:
    // its diameter, elevation, orientation and material are not documented.
    // A low-poly annulus preserves the visible opening instead of a solid tower.
    const center=platforms[0],segments=12,outer=2.05,inner=.94;
    const ringBottom=center.y+.34,ringTop=center.y+.83;
    for(let i=0;i<segments;i++){
      const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
      const pt=(r,ang,y)=>[center.x+r*Math.cos(ang),y,center.z+r*Math.sin(ang)];
      const oa=pt(outer,a,ringTop),ob=pt(outer,b,ringTop);
      const ia=pt(inner,a,ringTop),ib=pt(inner,b,ringTop);
      m.face([oa,ob,ib,ia],i%2?P.yellow:P.yellowSide,'central-ring');
      m.face([pt(outer,a,ringBottom),pt(outer,b,ringBottom),ob,oa],P.yellowDark,'central-ring');
      m.face([ia,ib,pt(inner,b,ringBottom),pt(inner,a,ringBottom)],P.yellowSide,'central-ring');
    }
    for(const p of stairs)m.box(p.x,p.y-.24,p.z,p.w,.24,p.d,
      p.step%2?P.white:P.teal,P.yellowSide,P.tealSide,'stairs');
    return m.faces;
  }
  function transform(faces,x,y,z,heading){
    const s=Math.sin(heading),c=Math.cos(heading);
    return faces.map(f=>({...f,v:f.v.map(([a,b,d])=>[x+a*c+d*s,y+b,z-a*s+d*c])}));
  }
  function avatar(position,{heading=0,phase=0,moving=false}={}){
    const m=mesh(),P=PALETTE,step=moving?Math.sin(phase)*.22:0;
    // White torso/blue separated legs/dark upper head: fieldwork description.
    // Joint proportions, walking pose and head variant are provisional.
    for(const side of [-1,1]){
      m.box(side*.24,.1,side*step,.32,.92,.38,P.trousers,P.trouserShade,P.trouserShade,'avatar');
      m.box(side*.24,0,.08+side*step,.36,.14,.57,P.head,P.head,P.head,'avatar');
      m.box(side*.63,1.52,-side*step,.28,.5,.32,P.shirt,P.shirtShade,P.shirtShade,'avatar');
      m.box(side*.63,1.07,-side*step,.24,.48,.26,P.skin,P.skinShade,P.skinShade,'avatar');
    }
    m.box(0,1.02,0,.88,1.02,.52,P.shirt,P.shirtShade,P.shirtShade,'avatar');
    m.box(0,2.04,0,.24,.14,.24,P.skin,P.skinShade,P.skinShade,'avatar');
    m.box(0,2.18,0,.56,.42,.49,P.skin,P.skinShade,P.skinShade,'avatar');
    m.box(0,2.52,-.03,.59,.18,.5,P.head,P.head,P.head,'avatar');
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
      m.face([[side*.2,-.2,-.35],[side*.4,-.9,-.65],[side*.45,-.65,-.05]],P.claws,'bird');
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
  return {PALETTE,arena,avatar,bird,stars,drawStars};
});
