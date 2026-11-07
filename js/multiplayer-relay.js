/* Bridge into the existing classic-script game. PeerJS and the phone controller
   remain available; relay rooms have their own identity and server-owned combat. */
(function () {
  'use strict';
  const selector=document.querySelector('#transport');
  const serverInput=document.querySelector('#relayServer');
  const settings=document.querySelector('#relaySettings');
  const scoreBoard=document.querySelector('#roomScores');
  const shareButton=document.querySelector('#shareRoom');
  const sessionKey='dactyl-relay-session';
  let saved=null, targets={}, latestSequence=-1;
  function read(key) {try{return JSON.parse(sessionStorage.getItem(key));}catch{return null;}}
  saved=read(sessionKey);
  const params=new URLSearchParams(location.search);
  serverInput.value=params.get('relay') || saved?.url || (location.hostname.endsWith('.onrender.com') ? 'wss://'+location.host+'/room' : '');
  if(params.get('room'))document.querySelector('#room').value=params.get('room');
  if(serverInput.value)selector.value='relay';
  function showSettings(){settings.hidden=selector.value!=='relay';}
  selector.onchange=showSettings;showSettings();
  function storeSession(value){saved=value;try{if(value)sessionStorage.setItem(sessionKey,JSON.stringify(value));else sessionStorage.removeItem(sessionKey);}catch{}}
  const messages={room_full:'Room is full (four seats, including reconnecting friends).',room_expired:'Room ended or server restarted. Create a new room.',session_expired:'Your reconnect reservation expired. Join the room again.',invalid_room:'Enter a code such as LD-1234ABCD.',unavailable:'Server unavailable. Check its address and try again; a sleeping free server may need a minute.',replaced:'This seat was resumed in another tab.',server_full:'Server is busy. Please try again later.',protocol_version:'Game and server versions differ. Reload the game.'};
  function clearPeers(){for(const connection of conns)connection.close();conns=[];peer?.destroy();peer=null;others={};shots=[];targets={};}
  function resetToSolo(){birdTrigger.reset();room='';id='local';others={};shots=[];targets={};scoreBoard.textContent='';shareButton.hidden=true;}
  const relay=new DactylRelay.Client({
    save:storeSession,
    onStatus(state,code){
      if(state==='connected')status('ROOM '+relay.room+' · Connected. Choose Play, or share the room.');
      else if(state==='connecting')status('Connecting to room server…');
      else if(state==='reconnecting'){
        playing=false;clearInput();menu.style.display='block';
        status('Reconnecting… Your seat is reserved for 30 seconds. A sleeping server can take a minute.');
      }else if(state==='error'){
        playing=false;clearInput();menu.style.display='block';resetToSolo();
        status(messages[code]||'Room connection failed: '+code);
      }
    },
    onEvent(data){
      if(data.type==='welcome'){
        if(id!==data.id)birdTrigger.reset();clearPeers();latestSequence=-1;room=data.room;id=data.id;score=data.self.score;
        Object.assign(me,{x:data.self.x,y:data.self.y,z:data.self.z});
        birdCarry=0;birdAttack=0;invulnerable=4;lastShot=-Infinity;
        shots=data.shots.map(b=>({...b}));
        document.querySelector('#room').value=room;shareButton.hidden=false;
      }else if(data.type==='snapshot' && data.sequence>latestSequence){
        latestSequence=data.sequence;
        const next={};
        for(const p of data.players){
          if(p.id===id){score=p.score;continue;}
          if(p.online){next[p.id]=p;if(!others[p.id])others[p.id]={x:p.x,y:p.y,z:p.z};}
        }
        targets=next;
        for(const key of Object.keys(others))if(!next[key])delete others[key];
        scoreBoard.textContent=data.players.map((p,i)=>'P'+(i+1)+(p.id===id?' (you)':'')+': '+p.score+(p.online?'':' · reconnecting')).join('  |  ');
      }else if(data.type==='shot'){
        // The local predicted shot is already visible and audible.
        if(data.b.owner!==id)shots.push({...data.b});else{recordDactylShot();const predicted=shots.find(b=>b.owner===id&&!b.id);if(predicted)predicted.id=data.b.id;}
      }else if(data.type==='hit'){
        shots=shots.filter(b=>b.id!==data.shot);
        if(data.source===id)sound('hit');
        if(data.target===id){respawn();Object.assign(me,{x:data.self.x,y:data.self.y,z:data.self.z});relay.send({type:'state',...me});}
      }
    }
  });
  window.dactylRelay=relay;
  // Interpolate visible opponents without predicting through walls or extrapolating
  // indefinitely after a disconnect. Self movement stays immediate on this phone.
  relay.interpolate=function(dt){
    const alpha=1-Math.exp(-dt*18);
    for(const [key,p]of Object.entries(targets)){
      const current=others[key];if(!current)continue;
      const snap=Math.hypot(current.x-p.x,current.y-p.y,current.z-p.z)>4;
      for(const axis of ['x','y','z'])current[axis]=snap?p[axis]:current[axis]+(p[axis]-current[axis])*alpha;
    }
  };
  const peerHost=document.querySelector('#host').onclick;
  const peerJoin=document.querySelector('#join').onclick;
  function enter(action){
    if(selector.value!=='relay'){
      relay.leave();resetToSolo();clearPeers();
      return action==='create'?peerHost():peerJoin();
    }
    try{
      const url=DactylRelay.endpoint(serverInput.value.trim());
      const code=document.querySelector('#room').value.trim().toUpperCase();
      if(action==='join'&&!/^LD-[0-9A-F]{8}$/.test(code))return status(messages.invalid_room);
      const credentials=action==='join'&&saved?.url===url&&saved.room===code?saved:null;
      clearPeers();playing=false;clearInput();
      relay.connect(url,credentials?'resume':action,code,credentials);
    }catch(error){status(error.message);}
  }
  document.querySelector('#host').onclick=()=>enter('create');
  document.querySelector('#join').onclick=()=>enter('join');
  document.querySelector('#leaveRoom').onclick=()=>{relay.leave();clearPeers();resetToSolo();status('Left room. Solo play is available.');};
  shareButton.onclick=async()=>{
    const url=new URL(location.href);url.search='';url.searchParams.set('relay',relay.url);url.searchParams.set('room',relay.room);
    try{
      if(navigator.share)await navigator.share({title:'Dactyl Nightmare room',text:relay.room,url:url.href});
      else if(navigator.clipboard){await navigator.clipboard.writeText(url.href);status('Room link copied.');}
      else{document.querySelector('#roomLink').href=url.href;document.querySelector('#roomLink').textContent=url.href;}
    }catch(error){if(error.name!=='AbortError')status('Share unavailable. Share the room code and server address.');}
  };
  if(saved){document.querySelector('#room').value=params.get('room')||saved.room;status('Previous room available. Tap Join room to resume.');}
})();
