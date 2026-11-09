/* Local-only reference editing. Stored coordinates never depend on display size. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),L=DactylLandmarks;
 const img=$('frame'),svg=$('overlay');
 let imageURL=null,imageReady=false,points=[],frames=[],selected=-1,frameSize=null;
 const status=s=>{$('status').textContent=s;};
 const fail=e=>{$('error').textContent=e.message||String(e);};
 function clearImage(){
  ++loadToken;imageReady=false;img.onload=null;img.removeAttribute('src');$('file').value='';svg.replaceChildren();
  if(imageURL)URL.revokeObjectURL(imageURL);imageURL=null;
 }
 function list(){
  const select=$('savedFrame');select.replaceChildren(new Option('New frame','-1'));
  frames.forEach((f,i)=>select.add(new Option(`${i+1}: ${f.source} · ${f.timestamp}s · ${f.points.length} points`,String(i))));
  select.value=String(selected);
 }
 function draw(){
  svg.replaceChildren();
  $('points').textContent=points.map(p=>`${p.name}  ${p.u.toFixed(5)}, ${p.v.toFixed(5)}`).join('\n');
  if(!imageReady)return;
  svg.setAttribute('viewBox',`0 0 ${frameSize.width} ${frameSize.height}`);
  for(const p of points){
   const x=p.u*frameSize.width,y=p.v*frameSize.height;
   const c=document.createElementNS('http://www.w3.org/2000/svg','circle'),t=document.createElementNS('http://www.w3.org/2000/svg','text');
   for(const [key,value]of Object.entries({cx:x,cy:y,r:Math.max(3,frameSize.width/250),fill:'#ffe174',stroke:'#181818','stroke-width':2}))c.setAttribute(key,value);
   for(const [key,value]of Object.entries({x:x+8,y:y-8,'font-size':Math.max(12,frameSize.width/85),fill:'#ffe174'}))t.setAttribute(key,value);
   t.textContent=p.name;svg.append(c,t);
  }
 }
 function persist(){
  if(!frameSize||(selected<0&&!points.length))return false;
  const f=L.frame({source:$('source').value,timestamp:$('time').value,...frameSize,notes:$('notes').value,points:points.map(p=>({...p}))});
  if(selected<0){selected=frames.length;frames.push(f);}else frames[selected]=f;
  list();return true;
 }
 function selectFrame(index){
  const f=frames[index];selected=f?index:-1;clearImage();
  points=f?f.points.map(p=>({...p})):[];frameSize=f?{width:f.width,height:f.height}:null;
  if(f){$('source').value=f.source;$('time').value=f.timestamp;$('notes').value=f.notes||'';}
  else $('notes').value='';
  list();draw();$('error').textContent='';
  status(f?`Opened ${f.source} at ${f.timestamp}s. Choose its matching ${f.width} × ${f.height} image to continue marking; verify source and timestamp.`:'New frame. Choose its image; previous saved frames are retained.');
 }
 $('savedFrame').onchange=()=>{
  const target=Number($('savedFrame').value);
  try{persist();selectFrame(target);}catch(e){list();fail(e);}
 };
 $('newFrame').onclick=()=>{try{persist();selectFrame(-1);}catch(e){fail(e);}};
 // Decode into a temporary element first. A wrong-sized image must not erase or
 // silently rescale imported annotations, and rapid file changes cannot race.
 let loadToken=0;
 $('file').onchange=()=>{
  const file=$('file').files[0];if(!file)return;
  const token=++loadToken,url=URL.createObjectURL(file),candidate=new Image();
  candidate.onload=()=>{
   if(token!==loadToken){URL.revokeObjectURL(url);return;}
   if(frameSize&&(candidate.naturalWidth!==frameSize.width||candidate.naturalHeight!==frameSize.height)){
    URL.revokeObjectURL(url);$('file').value='';fail(Error(`Image size differs: expected ${frameSize.width} × ${frameSize.height}. Select the matching frame or start another frame. Existing points are retained.`));return;
   }
   if(imageURL)URL.revokeObjectURL(imageURL);imageURL=url;
   frameSize={width:candidate.naturalWidth,height:candidate.naturalHeight};
   img.onload=()=>{if(token!==loadToken)return;imageReady=true;draw();status(`Frame loaded: ${frameSize.width} × ${frameSize.height}. ${points.length} existing points retained. Verify source and timestamp before editing.`);};
   imageReady=false;img.src=url;$('error').textContent='';
  };
  candidate.onerror=()=>{URL.revokeObjectURL(url);if(token===loadToken)fail(Error('Image could not be read. Existing points are retained.'));};
  candidate.src=url;
 };
 $('stage').onclick=e=>{
  if(!imageReady)return;
  const name=$('name').value.trim();if(!name){fail(Error('Enter a landmark name first'));return;}
  const r=img.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
  try{
   const p=L.normalizePoint((e.clientX-r.left)/r.width*frameSize.width,(e.clientY-r.top)/r.height*frameSize.height,frameSize.width,frameSize.height);
   points=points.filter(x=>x.name!==name);points.push({name,...p});$('error').textContent='';draw();
  }catch(err){fail(err);}
 };
 $('undo').onclick=()=>{points.pop();draw();};
 $('save').onclick=()=>{try{if(!persist())throw Error('Choose an image and mark at least one point');status(`Saved frame ${selected+1}. Export to preserve ${frames.length} frames.`);$('error').textContent='';}catch(e){fail(e);}};
 $('export').onclick=()=>{
  try{
   persist();const data=L.validate({schema:1,frames});if(!frames.length)throw Error('Save at least one frame');
   const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='dactyl-landmarks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   status(`Exported ${frames.length} frames, including current edits.`);
  }catch(e){fail(e);}
 };
 $('clear').onclick=()=>{
  if(!confirm('Discard all frame annotations in this browser session?'))return;
  ++loadToken;frames=[];selectFrame(-1);status('Dataset cleared');
 };
 $('import').onchange=async()=>{
  try{
   const file=$('import').files[0];if(!file)return;
   const data=L.validate(JSON.parse(await file.text()));
   ++loadToken;frames=data.frames;selectFrame(frames.length?0:-1);
  }catch(e){fail(e);}
 };
})();
