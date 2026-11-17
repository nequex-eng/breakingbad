import './style.css';
import * as THREE from 'three';

const app = document.querySelector('#app');
const $ = (id) => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb9a18a);
scene.fog = new THREE.FogExp2(0xb9a18a, 0.0068);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 650);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
app.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe7d9c6, 0x5c5143, 2.0));
const sun = new THREE.DirectionalLight(0xffd4a1, 3.2);
sun.position.set(-65, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100;
scene.add(sun);

const mat = (color, roughness=0.9) => new THREE.MeshStandardMaterial({ color, roughness });
const materials = {
  asphalt: mat(0x454541), sand: mat(0xb69c78), sidewalk: mat(0x9b9182),
  white: mat(0xd8d0c2), stucco: mat(0xc7b69b), cream: mat(0xe0d0b2),
  rust: mat(0x985d3e), teal: mat(0x527b79), dark: mat(0x343a37),
  glass: new THREE.MeshStandardMaterial({color:0x314b50, roughness:0.25, metalness:0.25}),
  green: mat(0x566348), cactus: mat(0x53694d), yellow: mat(0xc79b4c),
  red: mat(0x9d493b), blue: mat(0x506a7c),
  eyeWhite: mat(0xe9e5d9), pupil: mat(0x1b211f), shoe: mat(0x242725)
};

const ground = new THREE.Mesh(new THREE.PlaneGeometry(520,520), materials.sand);
ground.rotation.x=-Math.PI/2; ground.position.y=-0.08; ground.receiveShadow=true; scene.add(ground);

function box(parent, x,y,z, sx,sy,sz, material, cast=true) {
  const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);
  m.position.set(x,y,z); m.castShadow=cast; m.receiveShadow=true; parent.add(m); return m;
}
function cylinder(parent,x,y,z,r1,r2,h,material,segments=10) {
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);
 m.position.set(x,y,z); m.castShadow=true; parent.add(m); return m;
}

// Roads and sidewalks
box(scene,0,0.005,0,520,0.02,15,materials.asphalt,false);
box(scene,0,0.01,-15,520,0.03,2.2,materials.sidewalk,false);
box(scene,0,0.01,15,520,0.03,2.2,materials.sidewalk,false);
for(let x=-245;x<250;x+=18){
 box(scene,x,0.025,0,8,0.025,0.13,materials.yellow,false);
}
for(let z=-190;z<=190;z+=38){
 box(scene,0,0.012,z,14,0.025,2,materials.sidewalk,false);
}
// A short access road connects the main avenue to the desert warehouse.
box(scene,100,0.006,-26,12,.025,52,materials.asphalt,false);
box(scene,93,0.012,-26,1.8,.035,52,materials.sidewalk,false);
box(scene,107,0.012,-26,1.8,.035,52,materials.sidewalk,false);
for(let z=-44;z<=-8;z+=18)box(scene,100,.03,z,.14,.03,7,materials.yellow,false);
box(scene,100,.012,-50,24,.025,10,materials.asphalt,false);
// Route 66 Motel approach and parking apron.
box(scene,-145,.006,-34,12,.025,68,materials.asphalt,false);
box(scene,-152,.012,-34,1.6,.035,68,materials.sidewalk,false);
box(scene,-138,.012,-34,1.6,.035,68,materials.sidewalk,false);
for(let z=-62;z<=-8;z+=18)box(scene,-145,.03,z,.14,.03,7,materials.yellow,false);
const motel=new THREE.Group();motel.position.set(-145,0,-76);scene.add(motel);
box(motel,0,3.5,0,56,7,13,materials.cream);box(motel,0,7.1,0,57,.4,14,materials.dark);
box(motel,0,.14,9,60,.2,8,materials.asphalt,false);
for(const x of [-23,-15,-7,1,9,17,25]){
 box(motel,x,4.1,6.62,4.3,2.4,.18,materials.glass);
 box(motel,x,2.55,6.72,2.3,1.05,.22,materials.rust);
 box(motel,x,5.55,6.75,4.5,.12,.2,materials.white);
}
box(motel,-28,2.2,6.65,1.2,4.4,.25,materials.dark);box(motel,28,2.2,6.65,1.2,4.4,.25,materials.dark);

// Distant mesa silhouettes
for(let i=0;i<13;i++){
 const h=18+Math.random()*30, w=35+Math.random()*40;
 const mountain=new THREE.Mesh(new THREE.ConeGeometry(w,h,5),mat(i%2?0x897866:0x9a8069));
 mountain.position.set(-190+i*34,h/2-2,-185-Math.random()*35);
 mountain.rotation.y=Math.random()*Math.PI; scene.add(mountain);
}

// Desert shrubs and cacti
for(let i=0;i<100;i++){
 const x=(Math.random()-.5)*330, z=(Math.random()-.5)*260;
 if(Math.abs(z)<21 || (x>-24&&x<55&&z>-50&&z<40)) continue;
 if(Math.random()<.48){
  cylinder(scene,x,.7,z,.28,.4,1.4,materials.cactus,7);
  box(scene,x+.34,.75,z,.22,.8,.22,materials.cactus);
  box(scene,x+.23,1.05,z,.35,.18,.22,materials.cactus);
 } else {
  const shrub=new THREE.Mesh(new THREE.DodecahedronGeometry(.5+Math.random()*.5,0),materials.green);
  shrub.position.set(x,.35,z); shrub.scale.y=.55; scene.add(shrub);
 }
}

// Procedural buildings
function house(x,z,color,scale=1){
 const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
 box(g,0,2.1,0,12*scale,4.2*scale,9*scale,mat(color));
 box(g,0,4.35*scale,0,12.7*scale,.35*scale,9.7*scale,materials.dark);
 for(const wx of [-3.5,3.5]){
  box(g,wx*scale,2.45*scale,4.56*scale,1.65*scale,1.45*scale,.12,materials.glass);
  box(g,wx*scale,2.45*scale,4.64*scale,1.8*scale,.12,.16,materials.white);
 }
 box(g,0,1.15*scale,4.58*scale,1.4*scale,2.3*scale,.15,materials.rust);
 return g;
}
house(-30,-38,0xc5b295,1.15);
house(-58,-38,0xd2c5aa,1);
house(8,-44,0xb5a58c,1);
house(42,-42,0xc9bda7,1.1);
house(-70,38,0xb9aa94,.9);
house(70,42,0xd1c1a5,1.1);

// Car wash landmark
const wash=new THREE.Group(); wash.position.set(36,0,28); scene.add(wash);
box(wash,0,2.8,0,29,5.6,18,materials.cream);
box(wash,0,5.7,0,30,.35,19,materials.dark);
box(wash,0,3.8,9.1,20,1.05,.28,materials.teal);
box(wash,0,3.8,9.28,18,.12,.12,materials.white);
for(let x of [-8,-3,3,8]) box(wash,x,1.8,9.22,.22,3.5,.2,materials.dark);
for(let x of [-11,11]) box(wash,x,1.9,9.25,3.2,3.7,.3,materials.glass);
box(wash,0,.12,13,31,.2,8,materials.asphalt);
const sign=box(wash,0,7,0,13,1.4,.3,materials.blue);
sign.position.set(0,7,9.8);

// Small diner and convenience store
const diner=new THREE.Group(); diner.position.set(-82,0,7); scene.add(diner);
box(diner,0,2.5,0,24,5,15,materials.white);
box(diner,0,5.1,0,25,.35,16,materials.red);
box(diner,0,3.5,7.6,15,1.1,.25,materials.red);
for(let x of [-8,-3,3,8]) box(diner,x,2.5,7.7,2,2.2,.15,materials.glass);
box(diner,0,.12,13,27,.2,7,materials.asphalt);

// A warehouse in the distance
const warehouse=new THREE.Group(); warehouse.position.set(100,0,-70); scene.add(warehouse);
box(warehouse,0,5,0,38,10,30,materials.dark);
for(let x of [-12,0,12]) box(warehouse,x,4.2,15.1,8,7,.3,materials.rust);
box(warehouse,0,10.2,0,39,.4,31,materials.rust);

// Gas station and repair stop on the edge of the highway.
const gasStation=new THREE.Group();gasStation.position.set(78,0,8);scene.add(gasStation);
box(gasStation,0,2.2,0,20,4.4,13,materials.cream);box(gasStation,0,4.55,0,21,.3,14,materials.red);box(gasStation,0,3.25,6.62,13,1.1,.2,materials.blue);
for(const x of [-5,0,5]){box(gasStation,x,.85,11,1.1,1.7,.9,materials.red);box(gasStation,x,1.8,11,.75,.25,.65,materials.white);}
box(gasStation,0,.08,14,27,.16,10,materials.asphalt,false);

// Parked cars
function car(x,z,color,rotation=0){
 const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rotation; scene.add(g);
 box(g,0,.8,0,2.5,1.2,5,mat(color));
 box(g,0,1.55,-.1,1.9,.8,2.8,materials.glass);
 box(g,0,.45,2.52,2.25,.22,.16,materials.dark);box(g,0,.45,-2.52,2.25,.22,.16,materials.dark);
 for(const side of [-1,1]){box(g,side*.92,.88,2.48,.42,.2,.1,materials.yellow);box(g,side*.92,.88,-2.48,.42,.2,.1,materials.red);box(g,side*1.22,1.52,.1,.28,.18,.38,materials.dark);}
 for(let wx of [-1.25,1.25]) for(let wz of [-1.65,1.65]){
  const w=cylinder(g,wx,.48,wz,.48,.48,.28,materials.dark,12); w.rotation.z=Math.PI/2;
 }
 return g;
}
const playerCar=car(-6,8,0x8d8d86,0); car(19,15,0x8d8d86,-.4); car(-93,19,0x6e777c,.2); car(51,-20,0x9a483b,-.2);
const patrolCar=car(98,23,0x30383d,0);const patrolRed=box(patrolCar,-.38,2.18,0,.42,.16,.32,mat(0xd94d43));const patrolBlue=box(patrolCar,.38,2.18,0,.42,.16,.32,mat(0x4b86d8));
const trafficCars=[
 {root:car(-210,-4,0x87918d,Math.PI/2),direction:1,speed:12},
 {root:car(-55,4,0x8d594d,-Math.PI/2),direction:-1,speed:10},
 {root:car(135,-4,0xc6c1b2,Math.PI/2),direction:1,speed:14},
 {root:car(230,4,0x596d7a,-Math.PI/2),direction:-1,speed:11}
];
let driving=false,driveSpeed=0,crashCooldown=0;

// Player character, original low-poly civilian silhouette
const player=new THREE.Group(); scene.add(player);
const body= new THREE.Group(); player.add(body);
cylinder(body,0,1.35,0,.42,.5,1.05,materials.blue,9);
const head=new THREE.Mesh(new THREE.SphereGeometry(.34,12,10),mat(0xb98e6e));
head.position.y=2.12; head.castShadow=true; body.add(head);
cylinder(body,0,1.84,0,.13,.13,.28,mat(0xb98e6e),8);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.35,10,8,0,Math.PI*2,0,Math.PI/2),materials.dark);
hair.position.y=2.27; body.add(hair);
for(const side of [-1,1]){
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.052,8,6),materials.eyeWhite);eye.position.set(side*.115,2.16,.299);body.add(eye);
 const pupil=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),materials.pupil);pupil.position.set(side*.115,2.16,.344);body.add(pupil);
 box(body,side*.115,2.245,.286,.12,.035,.035,materials.dark,false);
 const ear=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),mat(0xb98e6e));ear.position.set(side*.326,2.1,0);body.add(ear);
 box(body,side*.2,.08,.12,.34,.16,.55,materials.shoe);
}
const nose=new THREE.Mesh(new THREE.ConeGeometry(.065,.13,6),mat(0xb98e6e));nose.position.set(0,2.08,.34);nose.rotation.x=Math.PI/2;body.add(nose);
box(body,0,1.88,.315,.14,.025,.025,materials.dark,false);
const playerArms=[],playerLegs=[];
for(const side of [-1,1]){
 const arm=cylinder(body,side*.48,1.3,0,.13,.16,.82,materials.blue,8); arm.rotation.z=side*.12;playerArms.push(arm);
 const leg=cylinder(body,side*.2,.43,0,.16,.19,.72,materials.dark,8);playerLegs.push(leg);
}
player.position.set(0,0,0);

function makeNPC(x,z,shirt,pants,skin=0xb98e6e){
 const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(.34,.43,1.05,9),mat(shirt));torso.position.y=1.35;torso.castShadow=true;root.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.31,12,10),mat(skin));head.position.y=2.12;head.castShadow=true;root.add(head);
 cylinder(root,0,1.84,0,.12,.12,.25,mat(skin),8);
 const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.32,10,8,0,Math.PI*2,0,Math.PI/2),materials.dark);hairCap.position.y=2.27;root.add(hairCap);
 const faceSkin=mat(skin);
 for(const side of [-1,1]){
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.047,8,6),materials.eyeWhite);eye.position.set(side*.105,2.15,.274);root.add(eye);
  const pupil=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),materials.pupil);pupil.position.set(side*.105,2.15,.315);root.add(pupil);
  const ear=new THREE.Mesh(new THREE.SphereGeometry(.065,8,6),faceSkin);ear.position.set(side*.3,2.1,0);root.add(ear);
  box(root,side*.19,.075,.12,.32,.15,.5,materials.shoe);
 }
 const nose=new THREE.Mesh(new THREE.ConeGeometry(.055,.12,6),faceSkin);nose.position.set(0,2.08,.31);nose.rotation.x=Math.PI/2;root.add(nose);
 const arms=[],legs=[];
 for(const side of [-1,1]){const arm=cylinder(root,side*.43,1.35,0,.13,.16,.78,mat(shirt),8);arm.rotation.z=side*.12;arms.push(arm);legs.push(cylinder(root,side*.19,.43,0,.15,.18,.75,mat(pants),8));}
 return {root,phase:Math.random()*6,arms,legs};
}
const jesseNPC=makeNPC(28,43,0x6f8069,0x343c3c);jesseNPC.root.rotation.y=-.35;
const dinerNPC=makeNPC(-82,17,0x8b6555,0x343a43);dinerNPC.root.rotation.y=Math.PI;
const warehouseNPC=makeNPC(100,-48,0x887b63,0x343a43);warehouseNPC.root.rotation.y=Math.PI;
const policeNPC=makeNPC(96,30,0x344e6b,0x242b32);policeNPC.root.rotation.y=Math.PI;
const gasContactNPC=makeNPC(73,27,0x57445e,0x30323c,0x9d7358);gasContactNPC.root.rotation.y=Math.PI;
const motelNPC=makeNPC(-132,-65,0x6d5a48,0x343a43,0xb58b6b);motelNPC.root.rotation.y=Math.PI;
const ambientNPCs=[makeNPC(-108,-28,0x697a70,0x343a43),makeNPC(4,24,0x8a6e57,0x343a43),makeNPC(62,-92,0x6d7180,0x343a43)];
ambientNPCs.forEach((npc,i)=>{npc.home=npc.root.position.clone();npc.wanderPhase=i*2.15;});

const locations=[
 {name:'A-1 CAR WASH',label:'THE CAR WASH',pos:new THREE.Vector3(36,0,43),range:13,type:'mission'},
 {name:'DINER',label:'THE DINER',pos:new THREE.Vector3(-82,0,17),range:15,type:'talk'},
 {name:'DESERT WAREHOUSE',label:'THE WAREHOUSE',pos:new THREE.Vector3(100,0,-50),range:15,type:'warehouse'},
 {name:'GAS STATION',label:'THE GAS STATION',pos:new THREE.Vector3(78,0,22),range:14,type:'gas'},
 {name:'POLICE PATROL',label:'TALK TO THE OFFICER',pos:new THREE.Vector3(96,0,30),range:9,type:'police'},
 {name:'ROUTE 66 MOTEL',label:'THE ROUTE 66 MOTEL',pos:new THREE.Vector3(-132,0,-65),range:13,type:'motel'}
];
function worldLabel(text,x,z,color='#e8d9b8'){
 const c=document.createElement('canvas');c.width=512;c.height=112;const ctx=c.getContext('2d');
 ctx.fillStyle='rgba(16,21,17,.82)';ctx.fillRect(0,0,512,112);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(3,3,506,106);
 ctx.fillStyle=color;ctx.font='bold 42px monospace';ctx.textAlign='center';ctx.fillText(text,256,70);
 const tex=new THREE.CanvasTexture(c);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(13,2.8),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
 mesh.position.set(x,11.5,z);scene.add(mesh);return mesh;
}
const landmarkLabels=[worldLabel('A-1 CAR WASH',36,43),worldLabel('DINER',-82,17),worldLabel('DESERT WAREHOUSE',100,-50),worldLabel('GAS / REPAIR',78,22),worldLabel('POLICE PATROL',96,30,'#9bb9d9'),worldLabel('ROUTE 66 MOTEL',-132,-65)];
const SAVE_KEY='abq-stories-save-v2';let saved={};try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch{}
let active=null,cash=Number.isFinite(saved.cash)?saved.cash:7300,trust=Number.isFinite(saved.trust)?saved.trust:50,heat=Number.isFinite(saved.heat)?saved.heat:8,health=Number.isFinite(saved.health)?THREE.MathUtils.clamp(saved.health,0,100):100,missionStep=Number.isFinite(saved.missionStep)?saved.missionStep:0,dialogOpen=false,mapOpen=false,policeHelpUsed=!!saved.policeHelpUsed,carWashShiftDone=!!saved.carWashShiftDone,localsTalked=Array.isArray(saved.localsTalked)?saved.localsTalked:[],customWaypoint=Number.isFinite(saved.waypointX)&&Number.isFinite(saved.waypointZ)?new THREE.Vector3(saved.waypointX,0,saved.waypointZ):null;
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({cash,trust,heat,health,missionStep,policeHelpUsed,carWashShiftDone,localsTalked,waypointX:customWaypoint?.x??null,waypointZ:customWaypoint?.z??null,playerX:player.position.x,playerZ:player.position.z,carX:playerCar.position.x,carZ:playerCar.position.z,carRotation:playerCar.rotation.y,driving,updatedAt:Date.now()}));}catch{}}
if(Number.isFinite(saved.carX)){let sx=saved.carX,sz=Number.isFinite(saved.carZ)?saved.carZ:8,sr=Number.isFinite(saved.carRotation)?saved.carRotation:0;if(sx===8&&sz===-6){sx=-6;sz=8;sr=0;}playerCar.position.set(sx,0,sz);playerCar.rotation.y=sr;}
if(saved.driving){driving=true;player.visible=false;player.position.copy(playerCar.position);player.rotation.y=playerCar.rotation.y;}
else if(Number.isFinite(saved.playerX)&&Number.isFinite(saved.playerZ))player.position.set(saved.playerX,0,saved.playerZ);
function currentObjective(){if(customWaypoint)return {name:'CUSTOM WAYPOINT',pos:customWaypoint};return missionStep===0?locations[0]:missionStep===1?locations[1]:missionStep===2?locations[2]:missionStep===3?locations[1]:missionStep===4?locations[3]:missionStep===5?locations[2]:missionStep===6?locations[1]:missionStep===7?locations[5]:missionStep===8?locations[0]:null;}
const objectiveBeacon=new THREE.Group();
const beaconRing=new THREE.Mesh(new THREE.TorusGeometry(1.35,.12,8,24),new THREE.MeshBasicMaterial({color:0xe1c477}));
beaconRing.rotation.x=Math.PI/2;objectiveBeacon.add(beaconRing);
const beaconArrow=new THREE.Mesh(new THREE.ConeGeometry(.42,1.15,8),new THREE.MeshBasicMaterial({color:0xe1c477}));
beaconArrow.position.y=-1.15;beaconArrow.rotation.x=Math.PI;objectiveBeacon.add(beaconArrow);scene.add(objectiveBeacon);
function updateObjectiveBeacon(time){const target=currentObjective();objectiveBeacon.visible=!!target;if(target){objectiveBeacon.position.set(target.pos.x,7.8+Math.sin(time*.002)*.3,target.pos.z);objectiveBeacon.rotation.y=time*.00045;}}
function updateObjectiveDistance(){const target=currentObjective();const el=$('objective-distance');if(el)el.textContent=target?'TARGET DISTANCE · '+Math.round(player.position.distanceTo(target.pos))+' M':'FREE ROAM · EXPLORE ALBUQUERQUE';}
function updateHealthUI(){ /* Health remains a gameplay mechanic; visual health bars are intentionally removed. */ }
function damagePlayer(amount,reason='You were hurt.'){
 health=Math.max(0,health-amount);updateHealthUI();saveGame();showToast(reason+' Health -'+amount+'.');
 if(health<=0){health=100;cash=Math.max(0,cash-300);player.position.set(-82,0,29);showToast('You recovered at the diner. $300 lost; health restored.');updateHealthUI();saveGame();updateHUD();}
}
function healPlayer(amount,cost=0){if(cost>cash){showToast('Not enough cash for treatment.');return false;}cash-=cost;health=Math.min(100,health+amount);updateHealthUI();saveGame();updateHUD();return true;}
const keys={};
let yaw=Math.PI, pitch=.25, dragging=false, lastX=0,lastY=0;
const cameraTarget=new THREE.Vector3();

let audioContext=null,audioMaster=null,windGain=null,engineGain=null,engineOsc=null,soundEnabled=false,footstepClock=0;
function setupGameAudio(){
 const AudioCtor=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtor){showToast('Audio is not supported by this browser.');return false;}
 audioContext=new AudioCtor();
 audioMaster=audioContext.createGain();audioMaster.gain.value=0;audioMaster.connect(audioContext.destination);
 const buffer=audioContext.createBuffer(1,audioContext.sampleRate*2,audioContext.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.34;
 const wind=audioContext.createBufferSource();wind.buffer=buffer;wind.loop=true;
 const windFilter=audioContext.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=420;
 windGain=audioContext.createGain();windGain.gain.value=.18;wind.connect(windFilter);windFilter.connect(windGain);windGain.connect(audioMaster);wind.start();
 engineOsc=audioContext.createOscillator();engineOsc.type='sawtooth';engineOsc.frequency.value=42;
 const engineFilter=audioContext.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=180;
 engineGain=audioContext.createGain();engineGain.gain.value=0;engineOsc.connect(engineFilter);engineFilter.connect(engineGain);engineGain.connect(audioMaster);engineOsc.start();
 return true;
}
async function toggleGameAudio(){
 if(!audioContext&&!setupGameAudio())return;
 try{if(audioContext.state==='suspended')await audioContext.resume();}catch{return;}
 soundEnabled=!soundEnabled;
 audioMaster.gain.setTargetAtTime(soundEnabled?.32:0,audioContext.currentTime,.22);
 $('sound-toggle').textContent=soundEnabled?'SOUND ON':'SOUND OFF';
 $('sound-toggle').setAttribute('aria-pressed',String(soundEnabled));
 showToast(soundEnabled?'Desert ambience enabled.':'Sound muted.');
}
$('sound-toggle').addEventListener('click',toggleGameAudio);
function playFootstep(){
 if(!soundEnabled||!audioContext)return;
 const osc=audioContext.createOscillator(),gain=audioContext.createGain();
 osc.type='triangle';osc.frequency.setValueAtTime(118,audioContext.currentTime);osc.frequency.exponentialRampToValueAtTime(48,audioContext.currentTime+.085);
 gain.gain.setValueAtTime(.045,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.09);
 osc.connect(gain);gain.connect(audioMaster);osc.start();osc.stop(audioContext.currentTime+.1);
}
function showToast(text){
 $('toast').textContent=text; $('toast').classList.add('show');
 clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>$('toast').classList.remove('show'),2600);
}
function updateHUD(){
 $('cash').textContent='$' + cash.toLocaleString('en-US');
 updateHealthUI();
 trust=THREE.MathUtils.clamp(trust,0,100);heat=THREE.MathUtils.clamp(heat,0,100);
 $('stats').textContent='TRUST '+Math.round(trust)+' · HEAT '+Math.round(heat)+(heat>=30?' · POLICE ALERT':'');
 const titles=['A DIFFERENT KIND OF FUTURE','A CONVERSATION IN THE DESERT','THE WAREHOUSE LEAD','THE LONG WAY HOME','A FACE AT THE GAS STATION','THE SECOND MEETING','A MESSAGE AFTER MIDNIGHT','THE ROUTE 66 ENVELOPE','BACK TO THE CAR WASH','CHAPTER THREE COMPLETE'];
 const copies=['Head to the car wash. Jesse is waiting to talk.','Visit the diner and decide who deserves your trust.','The diner lead is in. Head to the desert warehouse.','A contact left a sealed envelope. Take it to the diner. The sedan will make the trip faster.','A stranger has been asking questions at the gas station. Go see what they know.','The new contact has a proposal. Return to the desert warehouse.','A voicemail is waiting at the diner. There is one more loose end to tie up.','A courier left something at the Route 66 Motel. Go collect it.','Return to A-1 Car Wash and decide what Jesse should know.','The third chapter is complete. Explore Albuquerque and live with the consequences.'];
 const step=Math.min(missionStep,9);
 $('mission-title').textContent=titles[step];
 $('mission-copy').textContent=copies[step];
 const progress=document.querySelector('.objective-progress i');if(progress)progress.style.width=['8%','18%','30%','42%','56%','70%','78%','88%','96%','100%'][step];
}
function openDialogue(speaker,text,choices){
 dialogOpen=true; $('speaker').textContent=speaker; $('dialogue-text').textContent=text;
 const actions=$('dialogue-actions'); actions.innerHTML='';
 choices.forEach(c=>{
  const b=document.createElement('button'); b.textContent=c.label;
  b.onclick=()=>{c.run(); closeDialogue();}; actions.appendChild(b);
 });
 $('dialogue').classList.remove('hidden');
}
function closeDialogue(){dialogOpen=false;$('dialogue').classList.add('hidden');}
$('close-dialogue').onclick=closeDialogue;

function interact(target){
 if(!target)return;
 if(target.type==='local'){
  const lines=[
   ['NEIGHBOR','That black-and-white cruiser keeps turning around near the avenue. Someone has put the cops on edge.'],
   ['CAR WASH CUSTOMER','I saw a delivery van heading toward the warehouse road before sunrise. Nobody uses that road without a reason.'],
   ['DESERT COMMUTER','That stranger at the gas station has been waiting for someone. He does not look like he is from around here.']
  ];
  const [speaker,line]=lines[target.index]||lines[0];
  if(localsTalked.includes(target.index))openDialogue(speaker,'I already told you what I know. I need to get going.',[{label:'Let them go',run:()=>{}}]);
  else openDialogue(speaker,line,[
   {label:'Listen and thank them (trust +2, heat -2)',run:()=>{localsTalked.push(target.index);trust=Math.min(100,trust+2);heat=Math.max(0,heat-2);showToast('A useful bit of neighborhood information.');saveGame();updateHUD();}},
   {label:'Leave them alone',run:()=>{}}
  ]);
 }else if(target.type==='mission'){
  if(missionStep===0)openDialogue('JESSE','You said you wanted to talk. So talk. What exactly are you asking me to do?',[
   {label:'“I have a plan. Hear me out.”',run:()=>{trust=Math.min(100,trust+12);cash+=1200;missionStep=1;showToast('Jesse agreed to hear your proposal. +$1,200');saveGame();updateHUD();}},
   {label:'“Forget it. Not today.”',run:()=>{heat=Math.min(100,heat+2);showToast('Jesse leaves. The moment passes.');saveGame();updateHUD();}}
  ]);
  else if(missionStep===8)openDialogue('JESSE','You came back. Tell me exactly what was in the envelope. And do not leave anything out.',[
   {label:'Show him the evidence (trust +14, heat +5, +$1,300)',run:()=>{trust=Math.min(100,trust+14);heat=Math.min(100,heat+5);cash+=1300;missionStep=9;showToast('Jesse understands. +$1,300. Chapter three complete.');saveGame();updateHUD();}},
   {label:'Keep the details to yourself (trust +3, heat -4, +$500)',run:()=>{trust=Math.min(100,trust+3);heat=Math.max(0,heat-4);cash+=500;missionStep=9;showToast('You keep the details quiet. +$500.');saveGame();updateHUD();}}
  ]);
  else if(!carWashShiftDone)openDialogue('CAR WASH MANAGER','The afternoon rush is over, but there is still work to do. A short shift would put some cash in your pocket.',[
   {label:'Work the short shift (+$300, heat -2)',run:()=>{cash+=300;heat=Math.max(0,heat-2);carWashShiftDone=true;showToast('Shift complete. +$300.');saveGame();updateHUD();}},
   {label:'Ask Jesse how things are going',run:()=>{showToast('Jesse says to keep your head down.');}}
  ]);
  else openDialogue('CAR WASH MANAGER','You already worked your shift today. The wash is running smoothly.',[{label:'Leave',run:()=>{}}]);
 }else if(target.type==='talk'){
  const dinerChoices=[];
  if(missionStep===6)dinerChoices.push({label:'Listen to the voicemail (start the next lead)',run:()=>{missionStep=7;trust=Math.min(100,trust+2);showToast('A message points to the Route 66 Motel.');saveGame();updateHUD();}});
  else if(missionStep===1)dinerChoices.push({label:'Ask about the warehouse (advance the lead)',run:()=>{heat+=1;trust=Math.min(100,trust+3);missionStep=2;showToast('A lead on the warehouse has been added to your map.');saveGame();updateHUD();}});
  else if(missionStep===3)dinerChoices.push({label:'Hand over the sealed envelope (complete delivery)',run:()=>{missionStep=4;cash+=900;heat=Math.max(0,heat-3);trust=Math.min(100,trust+5);showToast('Delivery complete. +$900 · A contact is waiting at the gas station.');saveGame();updateHUD();}});
  else if(missionStep===0)dinerChoices.push({label:'You should speak to Jesse at the car wash first.',run:()=>{showToast('Jesse is waiting at the car wash.');}});
  dinerChoices.push({label:'Take a break (+35 health)',run:()=>{healPlayer(35,0);showToast('You rested at the diner.');}});
  dinerChoices.push({label:'Buy a meal (+60 health, $250)',run:()=>{if(healPlayer(60,250))showToast('You feel much better.');}});
  openDialogue('DINER REGULAR','The neighborhood is tense. Sit down, catch your breath, or ask what people have heard around town.',dinerChoices);
 }else if(target.type==='gas'){
  const gasChoices=[];
  if(missionStep===4)gasChoices.push({label:'Meet the stranger (continue the story)',run:()=>{missionStep=5;trust=Math.min(100,trust+6);heat=Math.min(100,heat+8);showToast('A new lead points back to the desert warehouse.');saveGame();updateHUD();}});
  gasChoices.push({label:'Use first-aid kit (+45 health, $180)',run:()=>{if(healPlayer(45,180))showToast('First-aid kit used.');}});
  gasChoices.push({label:'Rest and recover (+100 health, $400)',run:()=>{if(healPlayer(100,400))showToast('You are back in shape.');}});
  openDialogue(missionStep===4?'THE STRANGER':'GAS STATION',missionStep===4?'You came. Keep your voice down. I have a name, a place, and a reason this needs to stay quiet.':'A quiet stop beside the highway. The attendant offers first aid and a chance to regroup.',gasChoices);
 }else if(target.type==='motel'){
  if(missionStep===7)openDialogue('MOTEL CONTACT','You are late. The courier left an envelope under the ice machine. There are two names inside. One of them is going to make trouble.',[
   {label:'Open the envelope (+$700, trust +8, heat +6)',run:()=>{cash+=700;trust=Math.min(100,trust+8);heat=Math.min(100,heat+6);missionStep=8;showToast('You found the names. Take the evidence back to Jesse.');saveGame();updateHUD();}},
   {label:'Leave it sealed (+$200, trust -3, heat -4)',run:()=>{cash+=200;trust=Math.max(0,trust-3);heat=Math.max(0,heat-4);missionStep=8;showToast('You leave the envelope sealed. Return to the car wash.');saveGame();updateHUD();}}
  ]);
  else openDialogue('MOTEL MANAGER','The motel is quiet. Keep the noise down and stay out of the parking spaces.',[{label:'Leave',run:()=>{}}]);
 }else if(target.type==='police'){
  if(policeHelpUsed)openDialogue('OFFICER','I already gave you a warning. Keep moving and stay out of trouble.',[{label:'Walk away',run:()=>{}}]);
  else if(heat>=30)openDialogue('OFFICER','We have heard a few things about you. You can cooperate, or make this more difficult.',[
   {label:'Cooperate ($500 · reduce heat by 25)',run:()=>{if(cash<500){showToast('You do not have enough cash.');return;}cash-=500;heat=Math.max(0,heat-25);policeHelpUsed=true;showToast('The officer lets you go. Heat reduced.');saveGame();updateHUD();}},
   {label:'Refuse to answer (heat +8)',run:()=>{heat=Math.min(100,heat+8);policeHelpUsed=true;showToast('The officer will remember you.');saveGame();updateHUD();}}
  ]);
  else openDialogue('OFFICER','Quiet day. Keep your distance from the warehouse district and there will be no trouble.',[
   {label:'Ask for directions (heat -3)',run:()=>{heat=Math.max(0,heat-3);policeHelpUsed=true;showToast('A brief conversation puts the officer at ease.');saveGame();updateHUD();}},
   {label:'Leave',run:()=>{}}
  ]);
 }else if(target.type==='warehouse'){
  if(missionStep<2)openDialogue('WAREHOUSE SECURITY','The warehouse is not ready for visitors. You need a lead before you can get inside.',[{label:'Leave for now',run:()=>{}}]);
  else if(missionStep===2)openDialogue('WAREHOUSE CONTACT','You made it. This is where the next chapter begins. Keep your head clear and decide how to handle the pressure.',[
   {label:'Talk it through (+15 trust)',run:()=>{trust=Math.min(100,trust+15);heat=Math.min(100,heat+2);cash+=1800;missionStep=3;showToast('The meeting went well. +$1,800 · A delivery is waiting.');saveGame();updateHUD();}},
   {label:'Force the issue (-35 health, +$2,400)',run:()=>{damagePlayer(35,'A tense confrontation.');cash+=2400;heat=Math.min(100,heat+18);missionStep=3;showToast('You got what you came for. +$2,400 · A delivery is waiting.');saveGame();updateHUD();}}
  ]);
  else if(missionStep===5)openDialogue('WAREHOUSE CONTACT','The stranger has a proposal. It is a chance to build trust, but every deal leaves a trace.',[
   {label:'Accept the quiet deal (+$1,600, trust +10)',run:()=>{cash+=1600;trust=Math.min(100,trust+10);heat=Math.min(100,heat+10);missionStep=6;showToast('Deal made. +$1,600.');saveGame();updateHUD();}},
   {label:'Walk away (heat -5)',run:()=>{heat=Math.max(0,heat-5);missionStep=6;showToast('You leave without making a deal.');saveGame();updateHUD();}}
  ]);
  else openDialogue('WAREHOUSE CONTACT','The warehouse is quiet for now. You have completed the second chapter.',[{label:'Understood',run:()=>{}}]);
 }
}
function updateActive(){
 active=null; let best=Infinity;
 const el=$('interaction');
 if(driving){el.classList.add('visible');$('interaction-copy').textContent=' EXIT VEHICLE';}
 else if(player.position.distanceTo(playerCar.position)<4.8){el.classList.add('visible');$('interaction-copy').textContent=' ENTER SEDAN';}
 else {
 for(const l of locations){
  const d=player.position.distanceTo(l.pos);
  if(d<l.range&&d<best){best=d;active=l;}
 }
 for(let i=0;i<ambientNPCs.length;i++){
  const npc=ambientNPCs[i],d=player.position.distanceTo(npc.root.position);
  if(d<4.8&&d<best){best=d;active={type:'local',index:i,label:'TALK TO RESIDENT',pos:npc.root.position,range:4.8};}
 }
 if(active&&!dialogOpen){el.classList.add('visible');$('interaction-copy').textContent=' '+active.label;}
 else if(!driving&&player.position.distanceTo(playerCar.position)>=4.8)el.classList.remove('visible');
 }
 let zone='RESIDENTIAL DISTRICT';
 if(player.position.distanceTo(locations[0].pos)<35) zone='CAR WASH DISTRICT';
 if(player.position.distanceTo(locations[1].pos)<35) zone='DINER DISTRICT';
 if(player.position.distanceTo(locations[2].pos)<45) zone='INDUSTRIAL OUTSKIRTS';
 if(player.position.distanceTo(locations[3].pos)<35)zone='GAS STATION';
 if(player.position.distanceTo(locations[4].pos)<24)zone='POLICE PATROL';
 if(player.position.distanceTo(locations[5].pos)<32)zone='ROUTE 66 MOTEL';
 $('location').innerHTML=zone+' <span>·</span> ALBUQUERQUE, NM';updateObjectiveDistance();drawMiniMap();
}
function drawMiniMap(){
 const canvas=$('minimap');if(!canvas)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,scale=.48;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(13,19,16,.9)';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='rgba(213,196,153,.32)';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();
 ctx.strokeStyle='rgba(213,196,153,.18)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();
 for(const l of locations){const dx=(l.pos.x-player.position.x)*scale,dy=(l.pos.z-player.position.z)*scale;if(Math.abs(dx)>cx-9||Math.abs(dy)>cy-9)continue;ctx.fillStyle=l.type==='warehouse'?'#c58c64':l.type==='gas'?'#83b7c1':'#d4b978';ctx.beginPath();ctx.arc(cx+dx,cy+dy,5,0,Math.PI*2);ctx.fill();}
 const target=currentObjective();if(target){const tx=cx+(target.pos.x-player.position.x)*scale,ty=cy+(target.pos.z-player.position.z)*scale;if(tx>4&&tx<w-4&&ty>4&&ty<h-4){ctx.strokeStyle='#fff0b2';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(tx,ty,9,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}}
 const carX=cx+(playerCar.position.x-player.position.x)*scale,carY=cy+(playerCar.position.z-player.position.z)*scale;if(carX>4&&carX<w-4&&carY>4&&carY<h-4){ctx.save();ctx.translate(carX,carY);ctx.rotate(-playerCar.rotation.y);ctx.fillStyle='#8fc4d2';ctx.fillRect(-3,-6,6,12);ctx.restore();}
 ctx.save();ctx.translate(cx,cy);ctx.rotate(-player.rotation.y);ctx.fillStyle='#f4e9d1';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.restore();
}
function drawWorldMap(){
 const canvas=$('world-map');if(!canvas)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,scale=Math.min((w-90)/520,(h-70)/520);
 const p=(x,z)=>({x:cx+x*scale,y:cy+z*scale});
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#202a22';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='rgba(192,177,138,.09)';ctx.lineWidth=1;
 for(let x=-250;x<=250;x+=25){const q=p(x,0);ctx.beginPath();ctx.moveTo(q.x,35);ctx.lineTo(q.x,h-35);ctx.stroke();}
 for(let z=-250;z<=250;z+=25){const q=p(0,z);ctx.beginPath();ctx.moveTo(35,q.y);ctx.lineTo(w-35,q.y);ctx.stroke();}
 ctx.lineCap='square';ctx.strokeStyle='#70736b';ctx.lineWidth=19*scale;ctx.beginPath();ctx.moveTo(...Object.values(p(-260,0)));ctx.lineTo(...Object.values(p(260,0)));ctx.stroke();
 ctx.strokeStyle='#686c64';ctx.lineWidth=15*scale;ctx.beginPath();ctx.moveTo(...Object.values(p(100,0)));ctx.lineTo(...Object.values(p(100,-52)));ctx.moveTo(...Object.values(p(-145,0)));ctx.lineTo(...Object.values(p(-145,-68)));ctx.stroke();
 ctx.strokeStyle='#d0b36a';ctx.lineWidth=2;ctx.setLineDash([9,10]);ctx.beginPath();ctx.moveTo(...Object.values(p(-250,0)));ctx.lineTo(...Object.values(p(250,0)));ctx.moveTo(...Object.values(p(100,-4)));ctx.lineTo(...Object.values(p(100,-50)));ctx.moveTo(...Object.values(p(-145,-4)));ctx.lineTo(...Object.values(p(-145,-66)));ctx.stroke();ctx.setLineDash([]);
 const block=(x,z,bw,bd,color)=>{const q=p(x,z);ctx.fillStyle=color;ctx.fillRect(q.x-bw*scale/2,q.y-bd*scale/2,bw*scale,bd*scale);ctx.strokeStyle='rgba(227,211,169,.35)';ctx.lineWidth=1;ctx.strokeRect(q.x-bw*scale/2,q.y-bd*scale/2,bw*scale,bd*scale);};
 [[-30,-38,14,11],[-58,-38,12,10],[8,-44,12,10],[42,-42,14,11],[-70,38,11,9],[70,42,14,10]].forEach(v=>block(v[0],v[1],v[2],v[3],'#887f6e'));
 block(36,28,30,19,'#b6a589');block(-82,7,25,16,'#d2c8b8');block(100,-70,39,31,'#4d5651');block(78,8,21,14,'#b9a77d');block(-145,-76,57,14,'#b9ad91');
 ctx.font='bold 15px monospace';ctx.textAlign='left';ctx.fillStyle='#e0d1aa';
 for(const l of locations){const q=p(l.pos.x,l.pos.z);ctx.fillStyle=l.type==='police'?'#9bb9d9':'#dfc27b';ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e0d1aa';ctx.fillText(l.name,q.x+11,q.y-8);}
 const target=currentObjective();if(target){const q=p(target.pos.x,target.pos.z);ctx.strokeStyle='#ffe69c';ctx.lineWidth=4;ctx.beginPath();ctx.arc(q.x,q.y,15,0,Math.PI*2);ctx.stroke();}
 const car=p(playerCar.position.x,playerCar.position.z);ctx.save();ctx.translate(car.x,car.y);ctx.rotate(-playerCar.rotation.y);ctx.fillStyle='#83bfd1';ctx.fillRect(-7,-13,14,26);ctx.restore();
 const me=p(player.position.x,player.position.z);ctx.save();ctx.translate(me.x,me.y);ctx.rotate(-player.rotation.y);ctx.fillStyle='#fff0cf';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(9,10);ctx.lineTo(0,6);ctx.lineTo(-9,10);ctx.closePath();ctx.fill();ctx.restore();
 const objectiveText=target?target.name+' · '+Math.round(player.position.distanceTo(target.pos))+' M':'FREE ROAM';
 ctx.fillStyle='#d8c58f';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText(objectiveText,w/2,h-14);
}
function setMapOpen(open){mapOpen=!!open;$('map-overlay').classList.toggle('hidden',!mapOpen);if(mapOpen)drawWorldMap();}
$('minimap').addEventListener('click',()=>setMapOpen(true));
$('world-map').addEventListener('click',e=>{
 const canvas=$('world-map'),rect=canvas.getBoundingClientRect(),px=(e.clientX-rect.left)*canvas.width/rect.width,py=(e.clientY-rect.top)*canvas.height/rect.height;
 const scale=Math.min((canvas.width-90)/520,(canvas.height-70)/520),x=(px-canvas.width/2)/scale,z=(py-canvas.height/2)/scale;
 if(x< -245||x>245||z< -245||z>245){showToast('Choose a point inside the city map.');return;}
 customWaypoint=new THREE.Vector3(x,0,z);saveGame();drawWorldMap();drawMiniMap();updateObjectiveDistance();showToast('Custom waypoint set.');
});
$('waypoint-clear').onclick=()=>{customWaypoint=null;saveGame();drawWorldMap();drawMiniMap();updateObjectiveDistance();showToast('Custom waypoint cleared.');};
$('map-close').onclick=()=>setMapOpen(false);
function enterVehicle(){driving=true;driveSpeed=0;player.visible=false;player.position.copy(playerCar.position);player.rotation.y=playerCar.rotation.y;yaw=playerCar.rotation.y;showToast('Vehicle entered · W accelerate · A/D steer · S reverse');updateActive();}
function exitVehicle(){driving=false;driveSpeed=0;player.visible=true;const side=new THREE.Vector3(Math.cos(playerCar.rotation.y),0,-Math.sin(playerCar.rotation.y));player.position.copy(playerCar.position).addScaledVector(side,3.4);player.rotation.y=playerCar.rotation.y;yaw=playerCar.rotation.y+Math.PI;showToast('You stepped out of the vehicle.');updateActive();}
function onInteract(){if(dialogOpen||mapOpen)return;if(driving){exitVehicle();return;}if(player.position.distanceTo(playerCar.position)<4.8){enterVehicle();return;}if(active)interact(active);}

window.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 if(e.code==='KeyM'){setMapOpen(!mapOpen);return;}
 if(e.code==='Escape'){if(mapOpen)setMapOpen(false);else closeDialogue();return;}
 if(mapOpen)return;
 keys[e.code]=true;
 if(e.code==='KeyE'||e.code==='Enter') onInteract();
});
window.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);dragging=false;});
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('pointermove',e=>{
 if(!dragging)return;
 yaw-=(e.clientX-lastX)*.004; pitch=Math.max(-.05,Math.min(.75,pitch+(e.clientY-lastY)*.003));
 lastX=e.clientX;lastY=e.clientY;
});
function bindHold(id,code){
 const el=$(id); if(!el)return;
 el.addEventListener('pointerdown',e=>{e.preventDefault();keys[code]=true;});
 ['pointerup','pointerleave','pointercancel'].forEach(ev=>el.addEventListener(ev,()=>keys[code]=false));
}
bindHold('mobile-forward','KeyW');bindHold('mobile-left','KeyA');bindHold('mobile-back','KeyS');bindHold('mobile-right','KeyD');
$('mobile-interact').onclick=onInteract;

function resize(){
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setSize(innerWidth,innerHeight);
}
window.addEventListener('resize',resize);
const clock=new THREE.Clock();
let lastAutoSave=0;
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04);
 let walkingNow=false;
 if(!dialogOpen&&!mapOpen){
  crashCooldown=Math.max(0,crashCooldown-dt);
  trafficCars.forEach(t=>{t.root.position.x+=t.direction*t.speed*dt;if(t.root.position.x>265)t.root.position.x=-265;if(t.root.position.x< -265)t.root.position.x=265;});
  if(driving){
   const throttle=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
   const steering=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
   driveSpeed=THREE.MathUtils.clamp(driveSpeed+throttle*15*dt,-10,24);
   if(!throttle)driveSpeed*=Math.pow(.88,dt*60);
   if(Math.abs(driveSpeed)<.08)driveSpeed=0;
   if(Math.abs(driveSpeed)>.25)playerCar.rotation.y+=steering*1.45*dt*(driveSpeed>=0?1:-1);
   const heading=new THREE.Vector3(Math.sin(playerCar.rotation.y),0,Math.cos(playerCar.rotation.y));
   const next=playerCar.position.clone().addScaledVector(heading,driveSpeed*dt);
   const solid=[[-30,-38,8.2,6.5],[-58,-38,7.5,6],[8,-44,7.5,6],[42,-42,8,6.5],[-70,38,7,5.5],[70,42,8,6.5],[36,28,15.5,9.7],[-82,7,13,8.5],[100,-70,20,16],[78,8,10,7],[-145,-76,28.5,7.5],[19,15,2,3.1],[-93,19,2,3.1],[51,-20,2,3.1],[98,23,2,3.6]];
   const blocked=(x,z)=>solid.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx+1.8&&Math.abs(z-oz)<rz+1.8);
   const oldX=playerCar.position.x,oldZ=playerCar.position.z;
   const trafficHit=trafficCars.some(t=>Math.abs(next.x-t.root.position.x)<4.8&&Math.abs(next.z-t.root.position.z)<2.8);
   if(trafficHit){driveSpeed*=-.22;if(crashCooldown<=0){damagePlayer(8,'A traffic collision.');heat=Math.min(100,heat+2);updateHUD();crashCooldown=1.4;}}
   else{
    if(!blocked(next.x,oldZ))playerCar.position.x=next.x;
    if(!blocked(playerCar.position.x,next.z))playerCar.position.z=next.z;
    if(playerCar.position.x!==next.x||playerCar.position.z!==next.z)driveSpeed*=.18;
   }
   playerCar.position.x=THREE.MathUtils.clamp(playerCar.position.x,-245,245);playerCar.position.z=THREE.MathUtils.clamp(playerCar.position.z,-235,235);
   player.position.copy(playerCar.position);player.rotation.y=playerCar.rotation.y;
   $('drive-info').textContent='DRIVING · '+Math.round(Math.abs(driveSpeed)*3.6)+' KM/H';
  }else{
   $('drive-info').textContent='ON FOOT';
   const forward=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
   const side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
   const speed=(keys.ShiftLeft||keys.ShiftRight?13:7)*dt;
   const direction=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
   const right=new THREE.Vector3(direction.z,0,-direction.x);
   const move=direction.multiplyScalar(forward).add(right.multiplyScalar(side));
  if(move.lengthSq()>0){
   move.normalize();const next=player.position.clone().addScaledVector(move,speed);
   const obstacles=[[-30,-38,8.2,6.5],[-58,-38,7.5,6],[8,-44,7.5,6],[42,-42,8,6.5],[-70,38,7,5.5],[70,42,8,6.5],[36,28,15.5,9.7],[-82,7,13,8.5],[100,-70,20,16],[78,8,10,7],[-145,-76,28.5,7.5],[19,15,2,3.1],[-93,19,2,3.1],[51,-20,2,3.1],[-6,8,2.2,3.5],[98,23,2,3.5]];
   const isBlocked=(x,z)=>obstacles.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx&&Math.abs(z-oz)<rz);
   const oldX=player.position.x,oldZ=player.position.z;
   if(!isBlocked(next.x,oldZ))player.position.x=next.x;
   if(!isBlocked(player.position.x,next.z))player.position.z=next.z;
   if(player.position.x!==oldX||player.position.z!==oldZ){player.rotation.y=Math.atan2(move.x,move.z);walkingNow=true;}
  }
  player.position.x=THREE.MathUtils.clamp(player.position.x,-245,245);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-235,235);
  }
 }
 updateActive();
 if(walkingNow&&!driving){footstepClock+=dt;if(footstepClock>.42){playFootstep();footstepClock=0;}}else footstepClock=0;
 if(soundEnabled&&audioContext&&engineOsc){engineOsc.frequency.setTargetAtTime(42+Math.abs(driveSpeed)*2.8,audioContext.currentTime,.12);engineGain.gain.setTargetAtTime(driving?.055+Math.min(Math.abs(driveSpeed)/24,.7)*.035:0,audioContext.currentTime,.18);}
 const animTime=performance.now(),swing=walkingNow&&!driving?Math.sin(animTime*.012)*.48:0;
 playerArms.forEach((limb,i)=>limb.rotation.x=(i===0?1:-1)*swing);playerLegs.forEach((limb,i)=>limb.rotation.x=(i===0?-1:1)*swing);body.position.y=walkingNow&&!driving?Math.abs(Math.sin(animTime*.012))*.055:0;
 const animateNpc=npc=>{npc.root.position.y=Math.sin(animTime*.001+npc.phase)*.022;const sway=Math.sin(animTime*.0015+npc.phase)*.035;npc.arms[0].rotation.x=sway;npc.arms[1].rotation.x=-sway;npc.legs[0].rotation.x=-sway*.65;npc.legs[1].rotation.x=sway*.65;};
 animateNpc(jesseNPC);animateNpc(dinerNPC);animateNpc(warehouseNPC);animateNpc(policeNPC);animateNpc(gasContactNPC);animateNpc(motelNPC);patrolRed.visible=Math.sin(animTime*.012)>0;patrolBlue.visible=!patrolRed.visible;
 ambientNPCs.forEach((npc,i)=>{animateNpc(npc);const t=animTime*.00028+npc.wanderPhase,oldX=npc.root.position.x,oldZ=npc.root.position.z;npc.root.position.x=npc.home.x+Math.sin(t)*2.1;npc.root.position.z=npc.home.z+Math.cos(t)*1.15;if(Math.abs(npc.root.position.x-oldX)+Math.abs(npc.root.position.z-oldZ)>.002){npc.root.rotation.y=Math.atan2(npc.root.position.x-oldX,npc.root.position.z-oldZ);const step=Math.sin(t*4)*.22;npc.legs[0].rotation.x=step;npc.legs[1].rotation.x=-step;}});
 updateObjectiveBeacon(animTime);
 if(animTime-lastAutoSave>4000){saveGame();lastAutoSave=animTime;}
 const camDist=driving?15:10.5;
 const cameraYaw=driving?playerCar.rotation.y:yaw;
 const offset=driving?new THREE.Vector3(-Math.sin(cameraYaw)*camDist,5.2,-Math.cos(cameraYaw)*camDist):new THREE.Vector3(Math.sin(cameraYaw)*camDist,4.5+pitch*5,Math.cos(cameraYaw)*camDist);
 cameraTarget.set(player.position.x,player.position.y+1.2,player.position.z);
 const desired=cameraTarget.clone().add(offset);
 camera.position.lerp(desired,1-Math.pow(.001,dt));
 camera.lookAt(cameraTarget);landmarkLabels.forEach(label=>label.quaternion.copy(camera.quaternion));
 renderer.render(scene,camera);
}
updateHUD();saveGame();drawMiniMap();animate();
setTimeout(()=>$('loading').classList.add('gone'),700);
