/* Safari permission and screen-orientation integration. Sensor math lives in the
   pure orientation module; permission success alone does not mean tracking works. */
let motionAllowed=false,rawHeadBasis=null,headOffset=0,pendingHeading=null;
let startSerial=0,motionTimeout=null,gamepadMenuDown=false,gamepadCenterDown=false;
const trackingStatus=document.querySelector('#trackingStatus');
function stopMotion(){
  motionAllowed=false;tracking=false;cameraBasis=null;rawHeadBasis=null;
  clearTimeout(motionTimeout);
}
function applyHeadBasis(){
  if(!rawHeadBasis)return;
  const rawAngles=DactylOrientation.angles(rawHeadBasis,yaw-headOffset);
  if(pendingHeading!==null){headOffset=pendingHeading-rawAngles.yaw;pendingHeading=null;}
  cameraBasis=DactylOrientation.turn(rawHeadBasis,headOffset);
  ({yaw,pitch}=DactylOrientation.angles(cameraBasis,yaw));
}
function recenter(){
  pendingHeading=Math.PI/2;
  if(tracking)applyHeadBasis();
  else{yaw=Math.PI/2;pitch=0;}
}
addEventListener('deviceorientation',event=>{
  if(!motionAllowed||!vr)return;
  const angle=Number.isFinite(screen.orientation?.angle)?screen.orientation.angle:
    Number.isFinite(window.orientation)?window.orientation:0;
  const basis=DactylOrientation.deviceBasis(event.alpha,event.beta,event.gamma,angle);
  if(!basis)return;
  rawHeadBasis=basis;tracking=true;clearTimeout(motionTimeout);applyHeadBasis();
  trackingStatus.textContent='Head tracking active. Recenter while facing forward.';
});
async function motion(){
  if(typeof DeviceOrientationEvent==='undefined'){
    trackingStatus.textContent='Head tracking is unavailable in this browser. Phone play is available.';return false;
  }
  try{
    if(typeof DeviceOrientationEvent.requestPermission==='function' &&
       await DeviceOrientationEvent.requestPermission()!=='granted'){
      trackingStatus.textContent='Motion permission was denied. Allow motion access in Safari to use Cardboard, or choose phone play.';return false;
    }
    return true;
  }catch{
    trackingStatus.textContent='Motion access failed. Open the game directly in Safari and tap Google Cardboard again.';return false;
  }
}
async function start(v){
  const request=++startSerial;
  if(window.dactylRelay?.active&&!window.dactylRelay.connected){status('Wait for the room connection, or choose Leave room.');return;}
  if(v&&innerWidth<=innerHeight){trackingStatus.textContent='Turn the phone sideways, then tap Google Cardboard.';return;}
  // Prime Web Audio within the tap, before an asynchronous permission prompt.
  initAudio();stopMotion();
  if(v){trackingStatus.textContent='Requesting motion access…';if(!await motion()||request!==startSerial)return;}
  if(request!==startSerial)return;
  if(window.dactylRelay?.active)window.dactylRelay.send({type:'start'});
  else beginSoloMatch();
  vr=v;playing=true;last=performance.now();clearInput();
  menu.style.display='none';document.body.classList.toggle('vr',v);
  gamepadMenuDown=gamepadCenterDown=false;
  if(v){
    pendingHeading=yaw;motionAllowed=true;
    trackingStatus.textContent='Waiting for motion readings…';
    screen.orientation?.lock?.('landscape')?.catch(()=>{});
    motionTimeout=setTimeout(()=>{
      if(!tracking&&vr){openGameMenu();
        trackingStatus.textContent='No motion readings arrived. Check Safari motion access and retry, or choose phone play.';}
    },3000);
  }
}
function gamepadActions(gp){
  const centerDown=!!gp.buttons[8]?.pressed,menuDown=!!gp.buttons[9]?.pressed;
  if(centerDown&&!gamepadCenterDown)recenter();
  if(menuDown&&!gamepadMenuDown)openGameMenu();
  gamepadCenterDown=centerDown;gamepadMenuDown=menuDown;
}
addEventListener('resize',()=>{
  if(vr&&playing&&innerWidth<=innerHeight){openGameMenu();trackingStatus.textContent='Cardboard paused. Turn the phone sideways and tap Google Cardboard to resume.';}
});
