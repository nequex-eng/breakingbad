import './style.css';
import * as THREE from 'three';

const app = document.querySelector('#app');
const $ = (id) => document.getElementById(id);
document.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();},true);
document.addEventListener('selectstart',event=>{event.preventDefault();event.stopPropagation();},true);
// Prevent Shift + arrow from invoking native text selection / IME selection UI.
document.addEventListener('keydown',event=>{
 if(event.shiftKey&&/^Arrow(Left|Right|Up|Down)$/.test(event.code)){
  event.preventDefault();event.stopImmediatePropagation();
  try{window.getSelection()?.removeAllRanges();}catch{}
 }
},true);
document.addEventListener('keyup',event=>{
 if(event.code==='ShiftLeft'||event.code==='ShiftRight')event.preventDefault();
},true);
document.addEventListener('selectionchange',()=>{
 try{if(window.getSelection()?.rangeCount)window.getSelection().removeAllRanges();}catch{}
});
let gameReady=false;
function showStartupError(message){
 const loading=$('loading');if(!loading)return;
 loading.replaceChildren();
 const mark=document.createElement('div');mark.className='loader-mark';mark.textContent='ABQ';
 const title=document.createElement('div');title.textContent='THE CITY COULD NOT LOAD';
 const detail=document.createElement('p');detail.className='loading-error';detail.textContent=String(message||'Unknown startup error').slice(0,180);
 const retry=document.createElement('button');retry.type='button';retry.textContent='RELOAD';retry.onclick=()=>location.reload();
 loading.append(mark,title,detail,retry);
}
window.addEventListener('error',event=>{if(!gameReady)showStartupError(event.message||'A graphics error occurred.');});
window.addEventListener('unhandledrejection',event=>{if(!gameReady)showStartupError(event.reason?.message||event.reason||'A startup task failed.');});
const startupWatchdog=setTimeout(()=>{if(!gameReady)showStartupError('The 3D world is taking too long to start. Check the connection and reload.');},12000);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb9a18a);
scene.fog = new THREE.FogExp2(0xb9a18a, 0.0068);

const camera = new THREE.PerspectiveCamera(58, (window.visualViewport?.width||innerWidth) / (window.visualViewport?.height||innerHeight), 0.1, 650);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(window.visualViewport?.width||innerWidth, window.visualViewport?.height||innerHeight);
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
  glass: new THREE.MeshStandardMaterial({color:0x314b50, roughness:0.25, metalness:0.25, transparent:true, opacity:0.38, depthWrite:false}),
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
const diner=new THREE.Group(); diner.position.set(-82,0,22); scene.add(diner);
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
const gasStation=new THREE.Group();gasStation.position.set(78,0,24);scene.add(gasStation);
box(gasStation,0,2.2,0,20,4.4,13,materials.cream);box(gasStation,0,4.55,0,21,.3,14,materials.red);box(gasStation,0,3.25,6.62,13,1.1,.2,materials.blue);
for(const x of [-5,0,5]){box(gasStation,x,.85,11,1.1,1.7,.9,materials.red);box(gasStation,x,1.8,11,.75,.25,.65,materials.white);}
box(gasStation,0,.08,14,27,.16,10,materials.asphalt,false);

// Parked cars
const vehicleRegistry=[];
function car(x,z,color,rotation=0){
 const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rotation; scene.add(g);vehicleRegistry.push(g);
 box(g,0,.8,0,2.5,1.2,5,mat(color));
 box(g,0,1.55,-.1,1.9,.8,2.8,materials.glass);
 box(g,0,.45,2.52,2.25,.22,.16,materials.dark);box(g,0,.45,-2.52,2.25,.22,.16,materials.dark);
 for(const side of [-1,1]){box(g,side*.92,.88,2.48,.42,.2,.1,materials.yellow);box(g,side*.92,.88,-2.48,.42,.2,.1,materials.red);box(g,side*1.22,1.52,.1,.28,.18,.38,materials.dark);}
 for(let wx of [-1.25,1.25]) for(let wz of [-1.65,1.65]){
  const w=cylinder(g,wx,.48,wz,.48,.48,.28,materials.dark,12); w.rotation.z=Math.PI/2;
 }
 return g;
}
const playerCar=car(-6,13,0x8d8d86,0); car(19,15,0x8d8d86,-.4); car(-93,19,0x6e777c,.2); car(51,-20,0x9a483b,-.2);
const patrolCar=car(98,23,0x30383d,0);const patrolRed=box(patrolCar,-.38,2.18,0,.42,.16,.32,mat(0xd94d43));const patrolBlue=box(patrolCar,.38,2.18,0,.42,.16,.32,mat(0x4b86d8));
const trafficCars=[
 {root:car(-210,-4,0x87918d,Math.PI/2),direction:1,speed:12},
 {root:car(-55,4,0x8d594d,-Math.PI/2),direction:-1,speed:10},
 {root:car(135,-4,0xc6c1b2,Math.PI/2),direction:1,speed:14},
 {root:car(230,4,0x596d7a,-Math.PI/2),direction:-1,speed:11}
];
let driving=false,driveSpeed=0,crashCooldown=0,fuel=100;
const movingVehicleRoots=trafficCars.map(t=>t.root);
const vehicleBlockers=[
 {x:-30,z:-38,halfX:6.9,halfZ:5.18},{x:-58,z:-38,halfX:6,halfZ:4.5},
 {x:8,z:-44,halfX:6,halfZ:4.5},{x:42,z:-42,halfX:6.6,halfZ:4.95},
 {x:-70,z:38,halfX:5.4,halfZ:4.05},{x:70,z:42,halfX:6.6,halfZ:4.95},
 {x:36,z:28,halfX:14.5,halfZ:9},{x:-82,z:22,halfX:12,halfZ:7.5},
 {x:100,z:-70,halfX:19,halfZ:15},{x:78,z:24,halfX:10,halfZ:6.5},
 {x:-145,z:-76,halfX:28,halfZ:6.5},
 {x:73,z:35,halfX:.8,halfZ:.8},{x:78,z:35,halfX:.8,halfZ:.8},{x:83,z:35,halfX:.8,halfZ:.8}
];
function addParkedCarBlocker(x,z,rotation){
 const c=Math.abs(Math.cos(rotation)),s=Math.abs(Math.sin(rotation));
 vehicleBlockers.push({x,z,halfX:1.45*c+2.65*s,halfZ:1.45*s+2.65*c});
}
const VEHICLE_COLLISION_RADIUS=3.28;
// Conservative circle-vs-box collision covers the whole sedan footprint at every steering angle.
function vehicleOverlapsBox(position,b){
 const closestX=THREE.MathUtils.clamp(position.x,b.x-b.halfX,b.x+b.halfX);
 const closestZ=THREE.MathUtils.clamp(position.z,b.z-b.halfZ,b.z+b.halfZ);
 const dx=position.x-closestX,dz=position.z-closestZ;
 return dx*dx+dz*dz<VEHICLE_COLLISION_RADIUS*VEHICLE_COLLISION_RADIUS;
}
function vehicleOverlapsPedestrian(position,rotation,npc){
 const dx=npc.root.position.x-position.x,dz=npc.root.position.z-position.z;
 if(dx*dx+dz*dz>36)return false;
 const c=Math.cos(rotation),s=Math.sin(rotation);
 const localX=dx*c-dz*s,localZ=dx*s+dz*c;
 const nearestX=THREE.MathUtils.clamp(localX,-1.48,1.48),nearestZ=THREE.MathUtils.clamp(localZ,-2.72,2.72);
 const side=localX-nearestX,front=localZ-nearestZ;
 return side*side+front*front<1.35*1.35;
}
function pedestrianBlockedByAnyVehicle(x,z){
 const probe={root:{position:new THREE.Vector3(x,0,z)}};
 return vehicleRegistry.some(vehicle=>vehicleOverlapsPedestrian(vehicle.position,vehicle.rotation.y,probe));
}
function separatePedestriansFromAllVehicles(){
 for(const npc of pedestrianActors){
  if(!npc.root.visible)continue;
  for(const vehicle of vehicleRegistry){
   if(!vehicleOverlapsPedestrian(vehicle.position,vehicle.rotation.y,npc))continue;
   const dx=npc.root.position.x-vehicle.position.x,dz=npc.root.position.z-vehicle.position.z;
   const c=Math.cos(vehicle.rotation.y),s=Math.sin(vehicle.rotation.y);
   const lx=dx*c+dz*s,lz=-dx*s+dz*c;
   const px=THREE.MathUtils.clamp(lx,-1.48,1.48),pz=THREE.MathUtils.clamp(lz,-2.72,2.72);
   let nx=lx-px,nz=lz-pz,len=Math.hypot(nx,nz);
   if(len<.001){nx=1;nz=0;len=1;}
   const push=.86/len,outX=lx+nx*push,outZ=lz+nz*push;
   npc.root.position.x=vehicle.position.x+outX*c+outZ*s;
   npc.root.position.z=vehicle.position.z-outX*s+outZ*c;
  }
 }
}
function movePedestrianSafely(npc,x,z){
 if(!pedestrianBlockedByAnyVehicle(x,z)){npc.root.position.x=x;npc.root.position.z=z;return true;}
 const dx=x-npc.root.position.x,dz=z-npc.root.position.z,len=Math.hypot(dx,dz)||1;
 for(const sign of [1,-1]){
  const sx=npc.root.position.x+(-dz/len)*sign*.85,sz=npc.root.position.z+(dx/len)*sign*.85;
  if(!pedestrianBlockedByAnyVehicle(sx,sz)){npc.root.position.x=sx;npc.root.position.z=sz;return true;}
 }
 return false;
}
function vehicleOverlapsVehicle(position,rotation,otherRoot){
 const dx=otherRoot.position.x-position.x,dz=otherRoot.position.z-position.z;
 if(dx*dx+dz*dz>100)return false;
 const cA=Math.cos(rotation),sA=Math.sin(rotation),cB=Math.cos(otherRoot.rotation.y),sB=Math.sin(otherRoot.rotation.y);
 const axes=[[cA,-sA],[sA,cA],[cB,-sB],[sB,cB]];
 for(const [ax,az] of axes){
  const radiusA=1.58*Math.abs(ax*cA-az*sA)+2.88*Math.abs(ax*sA+az*cA);
  const radiusB=1.58*Math.abs(ax*cB-az*sB)+2.88*Math.abs(ax*sB+az*cB);
  if(Math.abs(dx*ax+dz*az)>radiusA+radiusB+.32)return false;
 }
 return true;
}
function vehiclePathHitsPedestrian(from,to,rotation){
 const distance=from.distanceTo(to),steps=Math.max(1,Math.ceil(distance/.06));
 for(let step=1;step<=steps;step++){
  const sample=from.clone().lerp(to,step/steps);
  for(const npc of pedestrianActors){
   if(npc.root.visible&&vehicleOverlapsPedestrian(sample,rotation,npc))return true;
  }
 }
 return false;
}
function vehicleCollisionAt(position,rotation,ignoreRoot=null){
 if(position.x< -239||position.x>239||position.z< -229||position.z>229)return 'city boundary';
 for(const b of vehicleBlockers)if(vehicleOverlapsBox(position,b))return 'building';
 for(const other of vehicleRegistry){if(other===ignoreRoot)continue;if(vehicleOverlapsVehicle(position,rotation,other))return 'another vehicle';}
 for(const npc of pedestrianActors)if(npc.root.visible&&vehicleOverlapsPedestrian(position,rotation,npc))return 'pedestrian';
 return '';
}

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
const dinerNPC=makeNPC(-82,32,0x8b6555,0x343a43);dinerNPC.root.rotation.y=Math.PI;
const warehouseNPC=makeNPC(100,-48,0x887b63,0x343a43);warehouseNPC.root.rotation.y=Math.PI;
const policeNPC=makeNPC(96,30,0x344e6b,0x242b32);policeNPC.root.rotation.y=Math.PI;
const gasContactNPC=makeNPC(73,43,0x57445e,0x30323c,0x9d7358);gasContactNPC.root.rotation.y=Math.PI;
const motelNPC=makeNPC(-132,-65,0x6d5a48,0x343a43,0xb58b6b);motelNPC.root.rotation.y=Math.PI;
const ambientNPCs=[makeNPC(-108,-28,0x697a70,0x343a43),makeNPC(4,24,0x8a6e57,0x343a43),makeNPC(62,-92,0x6d7180,0x343a43)];
ambientNPCs.forEach((npc,i)=>{npc.home=npc.root.position.clone();npc.wanderPhase=i*2.15;});
const witnessNPC=makeNPC(-94,29,0x8a7462,0x343a43,0xb98e6e);
const courierNPC=makeNPC(-74,29,0x6d5146,0x292f38,0x9b745b);
const driverNPC=makeNPC(69,43,0x4f6970,0x303841,0x9b745b);
const motelClerkNPC=makeNPC(-137,-66,0x70634f,0x343a43,0xb98e6e);
const warehouseArchivistNPC=makeNPC(108,-51,0x706b58,0x343a43,0x9c775d);
const pedestrianActors=[jesseNPC,dinerNPC,warehouseNPC,policeNPC,gasContactNPC,motelNPC,...ambientNPCs,witnessNPC,courierNPC,driverNPC,motelClerkNPC,warehouseArchivistNPC];

const locations=[
 {name:'A-1 CAR WASH',label:'THE CAR WASH',pos:new THREE.Vector3(36,0,43),range:13,type:'mission'},
 {name:'DINER',label:'THE DINER',pos:new THREE.Vector3(-82,0,32),range:15,type:'talk'},
 {name:'DESERT WAREHOUSE',label:'THE WAREHOUSE',pos:new THREE.Vector3(100,0,-50),range:15,type:'warehouse'},
 {name:'GAS STATION',label:'THE GAS STATION',pos:new THREE.Vector3(78,0,38),range:14,type:'gas'},
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
const landmarkLabels=[worldLabel('A-1 CAR WASH',36,43),worldLabel('DINER',-82,32),worldLabel('DESERT WAREHOUSE',100,-50),worldLabel('GAS / REPAIR',78,38),worldLabel('POLICE PATROL',96,30,'#9bb9d9'),worldLabel('ROUTE 66 MOTEL',-132,-65)];
const SAVE_KEY='abq-stories-save-v2';let saved={};try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch{}
let active=null,cash=Number.isFinite(saved.cash)?saved.cash:7300,missionStep=Number.isFinite(saved.missionStep)?saved.missionStep:0,dialogOpen=false,mapOpen=false,carWashShiftDone=!!saved.carWashShiftDone,localsTalked=Array.isArray(saved.localsTalked)?saved.localsTalked:[],customWaypoint=Number.isFinite(saved.waypointX)&&Number.isFinite(saved.waypointZ)?new THREE.Vector3(saved.waypointX,0,saved.waypointZ):null;
let evidenceCollected=Array.isArray(saved.evidenceCollected)?saved.evidenceCollected:[],salvageCollected=Array.isArray(saved.salvageCollected)?saved.salvageCollected:[],deliveryState=['available','active','complete','failed'].includes(saved.deliveryState)?saved.deliveryState:'available',deliveryDeadline=Number.isFinite(saved.deliveryDeadline)?saved.deliveryDeadline:0,deliveryTargetIndex=Number.isFinite(saved.deliveryTargetIndex)?saved.deliveryTargetIndex:0;
function makeActivityItem(id,label,x,z,color,kind){
 const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);
 box(root,0,.48,0,1.05,.9,.82,mat(color));box(root,0,.96,0,1.12,.12,.88,materials.dark);
 box(root,0,.99,.45,.72,.08,.035,materials.yellow,false);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.82,.055,7,20),new THREE.MeshBasicMaterial({color:kind==='delivery'?0x8fc4d2:0xe2c477}));
 ring.rotation.x=Math.PI/2;ring.position.y=.12;root.add(ring);
 const marker=new THREE.Mesh(new THREE.ConeGeometry(.2,.55,7),new THREE.MeshBasicMaterial({color:kind==='delivery'?0x8fc4d2:0xe2c477}));
 marker.position.y=1.65;root.add(marker);
 return {id,label,kind,root,pos:new THREE.Vector3(x,0,z),ring,marker};
}
const evidenceItems=[
 makeActivityItem('evidence-diner','Diner receipt',-101,37,0x8b7657,'evidence'),
 makeActivityItem('evidence-gas','Burner phone',93,39,0x506d7b,'evidence'),
 makeActivityItem('evidence-motel','Room key envelope',-180,-55,0x8b6c4e,'evidence'),
 makeActivityItem('evidence-warehouse','Shipping tag',130,-70,0x6d756a,'evidence')
];
const deliveryItem=makeActivityItem('courier-package','Courier package',48,42,0x5b7481,'delivery');
const raceStartItem=makeActivityItem('race-start','Street time trial',45,58,0x9a8050,'race');
let raceActive=false,raceIndex=0,raceDeadline=0;
const raceCheckpoints=[new THREE.Vector3(68,0,58),new THREE.Vector3(118,0,25),new THREE.Vector3(165,0,-12),new THREE.Vector3(44,0,42)];
const raceGates=raceCheckpoints.map((p,i)=>{
 const g=new THREE.Group();g.position.copy(p);scene.add(g);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(3.1,.18,8,24),new THREE.MeshBasicMaterial({color:i===raceCheckpoints.length-1?0x9fd0a5:0x8fc4d2,emissive:i===raceCheckpoints.length-1?0x183b24:0x10252b}));
 ring.rotation.x=Math.PI/2;ring.position.y=2.2;g.add(ring);
 for(const x of [-3.1,3.1])box(g,x,1.1,0,.18,2.2,.18,materials.dark);
 return {root:g,ring,pos:p};
});
for(const item of evidenceItems){item.collected=evidenceCollected.includes(item.id);item.root.visible=missionStep===22&&!item.collected;}
deliveryItem.root.visible=deliveryState==='available'||deliveryState==='failed';
const deliveryTargets=[locations[1],locations[3],locations[5],locations[2]];
const salvageItems=[
 makeActivityItem('salvage-toolkit','Tool case',-35,82,0x77766b,'salvage'),
 makeActivityItem('salvage-camera','Discarded camera',112,-108,0x4b5964,'salvage'),
 makeActivityItem('salvage-wallet','Lost wallet',-156,62,0x876d4d,'salvage'),
 makeActivityItem('salvage-radio','Old radio',164,46,0x586d60,'salvage'),
 makeActivityItem('salvage-watch','Silver watch',-22,-142,0x9b927e,'salvage')
];
for(const item of salvageItems){item.collected=salvageCollected.includes(item.id);item.root.visible=!item.collected;}
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({cash,missionStep,carWashShiftDone,localsTalked,evidenceCollected,salvageCollected,deliveryState,deliveryDeadline,deliveryTargetIndex,fuel,waypointX:customWaypoint?.x??null,waypointZ:customWaypoint?.z??null,playerX:player.position.x,playerZ:player.position.z,carX:playerCar.position.x,carZ:playerCar.position.z,carRotation:playerCar.rotation.y,driving,updatedAt:Date.now()}));}catch{}}
if(Number.isFinite(saved.fuel))fuel=THREE.MathUtils.clamp(saved.fuel,0,100);
if(Number.isFinite(saved.carX)){let sx=saved.carX,sz=Number.isFinite(saved.carZ)?saved.carZ:8,sr=Number.isFinite(saved.carRotation)?saved.carRotation:0;if(sx===8&&sz===-6){sx=-6;sz=8;sr=0;}playerCar.position.set(sx,0,sz);playerCar.rotation.y=sr;}
if(saved.driving){driving=true;player.visible=false;player.position.copy(playerCar.position);player.rotation.y=playerCar.rotation.y;}
else if(Number.isFinite(saved.playerX)&&Number.isFinite(saved.playerZ))player.position.set(saved.playerX,0,saved.playerZ);
if(!driving&&Math.abs(playerCar.position.z)<10)playerCar.position.z=playerCar.position.z<0?-13:13;
if(vehicleCollisionAt(playerCar.position,playerCar.rotation.y,playerCar)){
 playerCar.position.set(-6,0,13);playerCar.rotation.y=0;
 if(driving)player.position.copy(playerCar.position);
 showToast('Vehicle repositioned to a safe road after loading.');
}
function currentObjective(){
 if(raceActive)return {name:'TIME TRIAL CHECKPOINT',pos:raceCheckpoints[raceIndex]};
 if(deliveryState==='active')return deliveryTargets[deliveryTargetIndex]||locations[1];
 if(missionStep===22){const next=evidenceItems.find(item=>!item.collected);return next?{name:next.label,pos:next.pos}:locations[2];}
 if(missionStep>=25){const next=salvageItems.find(item=>!item.collected);if(next)return {name:next.label,pos:next.pos};}
 if(customWaypoint)return {name:'CUSTOM WAYPOINT',pos:customWaypoint};
 const objectives={0:locations[0],1:locations[1],2:locations[2],3:locations[1],4:locations[3],5:locations[2],6:locations[1],7:locations[5],8:locations[0],9:locations[0],10:locations[1],11:locations[3],12:locations[5],13:locations[2],14:locations[0],15:locations[0],16:locations[3],17:locations[1],18:locations[2],19:locations[5],20:locations[0],21:locations[0],23:locations[2],24:locations[0]};
 return objectives[missionStep]||null;
}
const objectiveBeacon=new THREE.Group();
const beaconRing=new THREE.Mesh(new THREE.TorusGeometry(1.35,.12,8,24),new THREE.MeshBasicMaterial({color:0xe1c477}));
beaconRing.rotation.x=Math.PI/2;objectiveBeacon.add(beaconRing);
const beaconArrow=new THREE.Mesh(new THREE.ConeGeometry(.42,1.15,8),new THREE.MeshBasicMaterial({color:0xe1c477}));
beaconArrow.position.y=-1.15;beaconArrow.rotation.x=Math.PI;objectiveBeacon.add(beaconArrow);scene.add(objectiveBeacon);
function updateObjectiveBeacon(time){const target=currentObjective();objectiveBeacon.visible=!!target;if(target){objectiveBeacon.position.set(target.pos.x,7.8+Math.sin(time*.002)*.3,target.pos.z);objectiveBeacon.rotation.y=time*.00045;}}
function updateObjectiveDistance(){
 const target=currentObjective(),el=$('objective-distance');if(!el)return;
 if(raceActive){const seconds=Math.max(0,Math.ceil((raceDeadline-Date.now())/1000));el.textContent='STREET TIME TRIAL · '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+' · CHECKPOINT '+(raceIndex+1)+' / '+raceCheckpoints.length;return;}
 if(deliveryState==='active'){const seconds=Math.max(0,Math.ceil((deliveryDeadline-Date.now())/1000));el.textContent='DELIVERY TIMER · '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+' · '+Math.round(player.position.distanceTo(target.pos))+' M';}
 else if(missionStep===22)el.textContent='EVIDENCE COLLECTED · '+evidenceCollected.length+' / 4 · '+(target?Math.round(player.position.distanceTo(target.pos))+' M':'');
 else if(missionStep>=25)el.textContent='CITY SALVAGE · '+salvageCollected.length+' / '+salvageItems.length+' · '+(target?Math.round(player.position.distanceTo(target.pos))+' M':'');
 else el.textContent=target?'TARGET DISTANCE · '+Math.round(player.position.distanceTo(target.pos))+' M':'FREE ROAM · EXPLORE ALBUQUERQUE';
}

const keys={};
let yaw=Math.PI, pitch=.25, dragging=false, lastX=0,lastY=0;
const cameraTarget=new THREE.Vector3();

// Keep the follow camera outside the main building shells instead of letting it clip through walls.
const cameraBlockers=[
 {x:-30,z:-38,halfX:6.9,halfZ:5.2,height:4.8},
 {x:-58,z:-38,halfX:6.2,halfZ:4.7,height:4.8},
 {x:8,z:-44,halfX:6.2,halfZ:4.7,height:4.8},
 {x:42,z:-42,halfX:6.9,halfZ:5.2,height:4.8},
 {x:-70,z:38,halfX:5.8,halfZ:4.4,height:4.2},
 {x:70,z:42,halfX:6.9,halfZ:5.2,height:4.8},
 {x:36,z:28,halfX:14.7,halfZ:8.9,height:6.2},
 {x:-82,z:22,halfX:12,halfZ:7.2,height:5.6},
 {x:100,z:-70,halfX:19,halfZ:15,height:10.5},
 {x:78,z:24,halfX:9.5,halfZ:6.2,height:4.8},
 {x:-145,z:-76,halfX:28,halfZ:6.8,height:7.8}
];
function keepCameraOutsideWalls(origin,desired){
 const delta=desired.clone().sub(origin),length=delta.length();
 if(length<.001)return desired;
 const dir=delta.multiplyScalar(1/length);
 let nearest=length;
 for(const b of cameraBlockers){
  let lo=0,hi=nearest;
  const axes=[
   [origin.x,dir.x,b.x-b.halfX,b.x+b.halfX],
   [origin.y,dir.y,0,b.height],
   [origin.z,dir.z,b.z-b.halfZ,b.z+b.halfZ]
  ];
  for(const [o,d,min,max] of axes){
   if(Math.abs(d)<1e-7){if(o<min||o>max){lo=Infinity;break;}continue;}
   let a=(min-o)/d,c=(max-o)/d;if(a>c)[a,c]=[c,a];
   lo=Math.max(lo,a);hi=Math.min(hi,c);
   if(hi<lo)break;
  }
  if(lo>0&&lo<nearest&&hi>=lo)nearest=lo;
 }
 return origin.clone().addScaledVector(dir,Math.max(2.35,nearest-.42));
}

let audioContext=null,audioMaster=null,windGain=null,engineGain=null,engineOsc=null,engineHarmonicGain=null,roadNoiseGain=null,soundEnabled=false,footstepClock=0,nextBirdAt=0,noiseBuffer=null;
function makeNoiseBuffer(){
 const buffer=audioContext.createBuffer(1,audioContext.sampleRate*2,audioContext.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.5;
 return buffer;
}
function makeNoiseLayer(type,frequency,q,level){
 const source=audioContext.createBufferSource();source.buffer=noiseBuffer;source.loop=true;
 const filter=audioContext.createBiquadFilter();filter.type=type;filter.frequency.value=frequency;filter.Q.value=q||.7;
 const gain=audioContext.createGain();gain.gain.value=level;
 source.connect(filter);filter.connect(gain);gain.connect(audioMaster);source.start();
 return {source,filter,gain};
}
function setupGameAudio(){
 if(audioContext)return true;
 const AudioCtor=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtor){showToast('Audio is not supported by this browser.');return false;}
 try{
  audioContext=new AudioCtor();
  audioMaster=audioContext.createGain();audioMaster.gain.value=0;audioMaster.connect(audioContext.destination);
  noiseBuffer=makeNoiseBuffer();
  const wind=makeNoiseLayer('lowpass',680,.45,.16);windGain=wind.gain;
  makeNoiseLayer('bandpass',175,.55,.085); // distant highway traffic
  makeNoiseLayer('highpass',3400,.7,.014); // desert insects
  const distantHum=audioContext.createOscillator(),distantHumGain=audioContext.createGain();
  distantHum.type='sine';distantHum.frequency.value=54;distantHumGain.gain.value=.012;
  distantHum.connect(distantHumGain);distantHumGain.connect(audioMaster);distantHum.start();
  engineOsc=audioContext.createOscillator();engineOsc.type='sawtooth';engineOsc.frequency.value=58;
  const engineFilter=audioContext.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=310;
  engineGain=audioContext.createGain();engineGain.gain.value=0;engineOsc.connect(engineFilter);engineFilter.connect(engineGain);engineGain.connect(audioMaster);engineOsc.start();
  const harmonic=audioContext.createOscillator(),harmonicFilter=audioContext.createBiquadFilter();
  harmonic.type='triangle';harmonic.frequency.value=116;harmonicFilter.type='lowpass';harmonicFilter.frequency.value=720;
  engineHarmonicGain=audioContext.createGain();engineHarmonicGain.gain.value=0;
  harmonic.connect(harmonicFilter);harmonicFilter.connect(engineHarmonicGain);engineHarmonicGain.connect(audioMaster);harmonic.start();
  const road=makeNoiseLayer('lowpass',520,.65,0);roadNoiseGain=road.gain;
  nextBirdAt=audioContext.currentTime+4;
  return true;
 }catch(error){showToast('Could not start audio: '+(error?.message||'browser audio error'));return false;}
}
function setGameAudioEnabled(enabled){
 if(!audioContext||!audioMaster)return;
 soundEnabled=enabled;
 audioMaster.gain.setTargetAtTime(soundEnabled?.68:0,audioContext.currentTime,.1);
 $('sound-toggle').textContent=soundEnabled?'SOUND ON':'SOUND OFF';
 $('sound-toggle').setAttribute('aria-pressed',String(soundEnabled));
}
function unlockGameAudio(){
 if(!setupGameAudio())return;
 if(audioContext.state!=='running')audioContext.resume().then(()=>setGameAudioEnabled(true)).catch(()=>{});
 else if(!soundEnabled)setGameAudioEnabled(true);
}
async function toggleGameAudio(){
 if(!setupGameAudio())return;
 try{if(audioContext.state!=='running')await audioContext.resume();}catch{return;}
 setGameAudioEnabled(!soundEnabled);
 showToast(soundEnabled?'Albuquerque ambience enabled.':'Sound muted.');
}
$('sound-toggle').addEventListener('click',toggleGameAudio);
renderer.domElement.addEventListener('pointerdown',unlockGameAudio,{passive:true});
$('mobile-joystick').addEventListener('pointerdown',unlockGameAudio,{passive:true});
function playFootstep(){
 if(!soundEnabled||!audioContext)return;
 const now=audioContext.currentTime;
 const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();
 source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=430;filter.Q.value=.8;
 gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+.12);
 source.connect(filter);filter.connect(gain);gain.connect(audioMaster);source.start(now);source.stop(now+.13);
 const thud=audioContext.createOscillator(),thudGain=audioContext.createGain();
 thud.type='triangle';thud.frequency.setValueAtTime(92,now);thud.frequency.exponentialRampToValueAtTime(42,now+.09);
 thudGain.gain.setValueAtTime(.035,now);thudGain.gain.exponentialRampToValueAtTime(.0001,now+.1);
 thud.connect(thudGain);thudGain.connect(audioMaster);thud.start(now);thud.stop(now+.11);
}
function playBirdCall(){
 if(!soundEnabled||!audioContext)return;
 const now=audioContext.currentTime;
 for(let i=0;i<2;i++){
  const start=now+i*.19,osc=audioContext.createOscillator(),gain=audioContext.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(1850-i*180,start);osc.frequency.exponentialRampToValueAtTime(2450-i*120,start+.09);osc.frequency.exponentialRampToValueAtTime(1580-i*100,start+.2);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.035,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+.22);
  osc.connect(gain);gain.connect(audioMaster);osc.start(start);osc.stop(start+.23);
 }
}
function playDoorSound(){
 if(!soundEnabled||!audioContext)return;
 const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();
 osc.type='triangle';osc.frequency.setValueAtTime(155,now);osc.frequency.exponentialRampToValueAtTime(68,now+.16);
 gain.gain.setValueAtTime(.07,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.2);
 osc.connect(gain);gain.connect(audioMaster);osc.start(now);osc.stop(now+.21);
}
function playImpact(){
 if(!soundEnabled||!audioContext)return;
 const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();
 osc.type='triangle';osc.frequency.setValueAtTime(105,now);osc.frequency.exponentialRampToValueAtTime(34,now+.22);
 gain.gain.setValueAtTime(.12,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.24);
 osc.connect(gain);gain.connect(audioMaster);osc.start(now);osc.stop(now+.25);
}
function playHorn(){
 if(!soundEnabled||!audioContext)return;
 const now=audioContext.currentTime;
 for(const frequency of [392,494]){
  const osc=audioContext.createOscillator(),gain=audioContext.createGain();
  osc.type='square';osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+.025);gain.gain.setValueAtTime(.055,now+.28);gain.gain.exponentialRampToValueAtTime(.0001,now+.38);
  osc.connect(gain);gain.connect(audioMaster);osc.start(now);osc.stop(now+.4);
 }
}
function showToast(text){
 $('toast').textContent=text; $('toast').classList.add('show');
 clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>$('toast').classList.remove('show'),2600);
}
function updateHUD(){
 $('cash').textContent='$' + cash.toLocaleString('en-US');
 const titles=['A DIFFERENT KIND OF FUTURE','A CONVERSATION IN THE DESERT','THE WAREHOUSE LEAD','THE LONG WAY HOME','A FACE AT THE GAS STATION','THE SECOND MEETING','A MESSAGE AFTER MIDNIGHT','THE ROUTE 66 ENVELOPE','BACK TO THE CAR WASH','THE MISSING DRIVER','THE DINER WITNESS','A DRIVER WHO REMEMBERS','ROOM SIX','THE LEDGER','BACK TO JESSE','A NEW ARRANGEMENT','THE NIGHT DELIVERY','THE COURIER','THE WAREHOUSE LIST','THE MOTEL ROOM','THE FINAL HANDOFF','CHAPTER FIVE COMPLETE','FOUR PIECES OF PROOF','THE WAREHOUSE FILE','THE LAST DECISION','CHAPTER SIX COMPLETE'];
 const copies=['Head to the car wash. Jesse is waiting to talk.','Visit the diner. Someone there may know more than they are saying.','The diner lead is in. Head to the desert warehouse.','A contact left a sealed envelope. Take it to the diner.','A stranger has been asking questions at the gas station. Go see what they know.','The new contact has a proposal. Return to the desert warehouse.','A voicemail is waiting at the diner. There is one more loose end to tie up.','A courier left something at the Route 66 Motel. Go collect it.','Return to A-1 Car Wash and decide what Jesse should know.','Jesse has heard from a driver who vanished after a late-night delivery. Start at the car wash.','Find the waitress who saw the delivery van leave the diner.','Track down the driver at the gas station. He knows where the van went.','Go to the Route 66 Motel. Someone kept a room key for the driver.','The room key leads to a ledger hidden at the desert warehouse.','Take the ledger back to Jesse at A-1 Car Wash.','Jesse has another job. A night delivery went missing on the east side.','Find the night driver at the gas station before the police do.','A courier is waiting at the diner with a route and a warning.','The warehouse contact has the shipment list. Get the truth.','Meet the motel manager. The missing cargo was moved through room six.','Return to Jesse. This time, decide what happens to the shipment.','The fifth chapter is complete. A new investigation is available.','Search the streets for four physical pieces of evidence. They are visible in the world; no conversation required.','Bring all four pieces of evidence to the warehouse archivist.','Return to Jesse and decide what to do with the evidence.','Chapter Six is complete. Albuquerque remains open for side activities.'];
 const step=Math.min(missionStep,titles.length-1);
 $('mission-title').textContent=titles[step];$('mission-copy').textContent=copies[step];
 const progress=document.querySelector('.objective-progress i');
 if(progress)progress.style.width=['5%','10%','15%','20%','25%','30%','35%','40%','45%','50%','55%','60%','65%','70%','75%','80%','84%','88%','92%','96%','99%','100%','82%','92%','97%','100%'][step]||'100%';
 const chapter=$('chapter');if(chapter)chapter.textContent=missionStep<=8?'CHAPTER 01 · THE FIRST MOVE':missionStep<=14?'CHAPTER 04 · THE MISSING DRIVER':missionStep<=20?'CHAPTER 05 · THE NIGHT DELIVERY':missionStep<=24?'CHAPTER 06 · THE EVIDENCE TRAIL':'CHAPTER 06 · COMPLETE';
 if(deliveryState==='active'){$('mission-title').textContent='TIME-SENSITIVE DELIVERY';$('mission-copy').textContent='A package is in your care. Reach the marked drop point before the timer expires.';}
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
$('mission-toggle').addEventListener('click',()=>{
 const panel=$('mission');
 const expanded=panel.classList.toggle('expanded');
 panel.classList.toggle('collapsed',!expanded);
 $('mission-toggle').setAttribute('aria-expanded',String(expanded));
});

function interact(target){
 if(!target)return;
 if(target.type==='activity-item'){
  const item=target.item;
  if(item.kind==='race'){
   if(raceActive){showToast('A time trial is already active.');return;}
   raceActive=true;raceIndex=0;raceDeadline=Date.now()+115000;item.root.visible=false;
   raceGates.forEach(g=>g.root.visible=true);showToast('Street time trial started. Get in your car and hit every gate!');updateHUD();saveGame();return;
  }
  if(item.kind==='delivery'){
   deliveryState='active';deliveryDeadline=Date.now()+105000;deliveryTargetIndex=(missionStep+1)%deliveryTargets.length;item.root.visible=false;
   showToast('Package collected. Deliver it within 1 minute 45 seconds.');updateHUD();saveGame();return;
  }
  if(item.kind==='evidence'&&missionStep===22&&!item.collected){
   item.collected=true;item.root.visible=false;evidenceCollected.push(item.id);cash+=100;
   showToast('Evidence recovered · '+evidenceCollected.length+'/4 · +$100');
   if(evidenceCollected.length===evidenceItems.length){missionStep=23;showToast('All four pieces secured. Take them to the warehouse.');}
   updateHUD();saveGame();return;
  }
  if(item.kind==='salvage'&&!item.collected){
   item.collected=true;item.root.visible=false;salvageCollected.push(item.id);cash+=275;
   showToast(item.label+' recovered · +$275');
   if(salvageCollected.length===salvageItems.length)showToast('Neighborhood salvage route complete · +$1,375 earned');
   updateHUD();saveGame();return;
  }
 }else if(target.type==='gas-refuel'){
  if(fuel>=100){showToast('The tank is already full.');return;}
  if(cash<300){showToast('Refueling costs $300. You do not have enough cash.');return;}
  cash-=300;fuel=100;showToast('Vehicle refueled · -$300');updateHUD();saveGame();return;
 }else if(target.type==='delivery-drop'){
  if(deliveryState==='active'){deliveryState='complete';deliveryDeadline=0;cash+=1250;showToast('Delivery completed on time. +$1,250');updateHUD();saveGame();}
  return;
 }else if(target.type==='local'){
  const lines=[['NEIGHBOR','That black-and-white cruiser keeps turning around near the avenue. Someone has been asking about a late-night delivery.'],['CAR WASH CUSTOMER','I saw a delivery van heading toward the warehouse road before sunrise. It looked like it was in a hurry.'],['DESERT COMMUTER','The stranger at the gas station was asking about a room at the Route 66 Motel.']];
  const [speaker,line]=lines[target.index]||lines[0];
  if(localsTalked.includes(target.index))openDialogue(speaker,'I have told you everything I know. I need to get going.',[{label:'Let them go',run:()=>{}}]);
  else openDialogue(speaker,line,[{label:'Thank them for the information',run:()=>{localsTalked.push(target.index);showToast('You have a new lead.');saveGame();}},{label:'Leave them alone',run:()=>{}}]);
 }else if(target.type==='mission'){
  if(missionStep===0)openDialogue('JESSE','You said you wanted to talk. So talk. What exactly are you asking me to do?',[{label:'“I have a plan. Hear me out.”',run:()=>{cash+=1200;missionStep=1;showToast('Jesse agreed to hear your proposal. +$1,200');saveGame();updateHUD();}},{label:'“Forget it. Not today.”',run:()=>showToast('Jesse leaves. The moment passes.')}]);
  else if(missionStep===8)openDialogue('JESSE','You came back. Tell me exactly what was in the envelope. And do not leave anything out.',[{label:'Show him the evidence (+$1,300)',run:()=>{cash+=1300;missionStep=9;showToast('Jesse understands. +$1,300. A new problem is waiting.');saveGame();updateHUD();}},{label:'Keep the details to yourself (+$500)',run:()=>{cash+=500;missionStep=9;showToast('You keep the details quiet. +$500.');saveGame();updateHUD();}}]);
  else if(missionStep===9)openDialogue('JESSE','A driver disappeared after a late delivery. His van was seen near the diner, then the motel. Find out what happened before somebody else does.',[{label:'“I will find the driver.”',run:()=>{missionStep=10;showToast('Chapter Four: The Missing Driver.');saveGame();updateHUD();}},{label:'Ask for an advance (+$150)',run:()=>{cash+=150;missionStep=10;showToast('Jesse gives you $150 for expenses.');saveGame();updateHUD();}}]);
  else if(missionStep===14)openDialogue('JESSE','That ledger could ruin a lot of people. We need to decide what it is worth.',[{label:'Split the proceeds (+$2,200)',run:()=>{cash+=2200;missionStep=15;showToast('Chapter Four complete. +$2,200');saveGame();updateHUD();}},{label:'Take the larger share (+$3,200)',run:()=>{cash+=3200;missionStep=15;showToast('You take the larger share. +$3,200');saveGame();updateHUD();}}]);
  else if(missionStep===15)openDialogue('JESSE','One more job. A night shipment went missing on the east side. The driver, the courier and the warehouse list are all connected. Bring me the truth.',[{label:'Start the night delivery investigation',run:()=>{missionStep=16;showToast('Chapter Five: The Night Delivery.');saveGame();updateHUD();}},{label:'Ask for an advance (+$200)',run:()=>{cash+=200;missionStep=16;showToast('Jesse gives you a $200 advance.');saveGame();updateHUD();}}]);
  else if(missionStep===20)openDialogue('JESSE','That is the last of it. We can close this quietly, or make one final move and walk away with more.',[{label:'Close the deal (+$3,000)',run:()=>{cash+=3000;missionStep=21;showToast('Chapter Five complete. +$3,000');saveGame();updateHUD();}},{label:'Make the final move (+$4,500)',run:()=>{cash+=4500;missionStep=21;showToast('You take the risk and get paid. +$4,500');saveGame();updateHUD();}}]);
  else if(missionStep===21)openDialogue('JESSE','The shipment list is only half the story. Four physical pieces of evidence were scattered around town. Find them. No more asking people questions — bring me something we can hold.',[{label:'Start the evidence trail',run:()=>{missionStep=22;evidenceCollected=[];evidenceItems.forEach(item=>{item.collected=false;item.root.visible=true;});showToast('Chapter Six: The Evidence Trail. Search the city.');saveGame();updateHUD();}},{label:'Not now',run:()=>{}}]);
  else if(missionStep===24)openDialogue('JESSE','You found all four pieces. We can hand the evidence over and disappear, or keep it and use it as leverage. Either way, this changes things.',[{label:'Hand it over and walk away (+$2,500)',run:()=>{cash+=2500;missionStep=25;showToast('You chose a clean exit. +$2,500. Chapter Six complete.');saveGame();updateHUD();}},{label:'Keep the evidence and take the risk (+$4,000)',run:()=>{cash+=4000;missionStep=25;showToast('You kept the leverage. +$4,000. Chapter Six complete.');saveGame();updateHUD();}}]);
  else if(missionStep>=25)openDialogue('JESSE','We have done enough for one lifetime. There is a cash-paying salvage route around town. Five lost items are marked on your map. Search them, bring the finds back, and keep the money. The courier package also respawns for repeat deliveries.',[{label:'Start the neighborhood salvage route',run:()=>{salvageItems.forEach(item=>{if(!item.collected)item.root.visible=true;});showToast('Five salvage locations added to your map. Each find pays $275.');saveGame();updateHUD();}},{label:'Leave',run:()=>{}}]);
  else if(!carWashShiftDone)openDialogue('CAR WASH MANAGER','The afternoon rush is over, but there is still work to do. A short shift would put some cash in your pocket.',[{label:'Work the short shift (+$300)',run:()=>{cash+=300;carWashShiftDone=true;showToast('Shift complete. +$300.');saveGame();updateHUD();}},{label:'Ask Jesse how things are going',run:()=>showToast('Jesse says to keep your head down.')}]);
  else openDialogue('CAR WASH MANAGER','The wash is running smoothly. There is nothing else to do here right now.',[{label:'Leave',run:()=>{}}]);
 }else if(target.type==='talk'){
  if(missionStep===10)openDialogue('MARA · DINER WAITRESS','I saw the van leave after midnight. The driver dropped a receipt. He said room six at the Route 66 Motel was paid in cash.',[{label:'Pay $100 for the receipt',run:()=>{if(cash<100){showToast('You do not have enough cash.');return;}cash-=100;missionStep=11;showToast('Receipt purchased. -$100');saveGame();updateHUD();}},{label:'Take the lead and owe her a favor',run:()=>{missionStep=11;showToast('You have a lead on the driver.');saveGame();updateHUD();}}]);
  else if(missionStep===17)openDialogue('THE COURIER','The shipment was rerouted. The warehouse list has the new destination, but I will not hand it over for free.',[{label:'Pay $300 for the route',run:()=>{if(cash<300){showToast('You do not have enough cash.');return;}cash-=300;missionStep=18;showToast('Route purchased. -$300');saveGame();updateHUD();}},{label:'Take the route without paying',run:()=>{missionStep=18;showToast('The courier gives you a partial route.');saveGame();updateHUD();}}]);
  else{
   const choices=[];
   if(missionStep===1)choices.push({label:'Ask about the warehouse',run:()=>{missionStep=2;showToast('A lead on the warehouse has been added to your map.');saveGame();updateHUD();}});
   else if(missionStep===3)choices.push({label:'Hand over the sealed envelope (+$900)',run:()=>{missionStep=4;cash+=900;showToast('Delivery complete. +$900. A contact is waiting at the gas station.');saveGame();updateHUD();}});
   else if(missionStep===6)choices.push({label:'Listen to the voicemail',run:()=>{missionStep=7;showToast('A message points to the Route 66 Motel.');saveGame();updateHUD();}});
   if(!choices.length)choices.push({label:'Ask what people have heard around town',run:()=>showToast('Nobody has anything new to add.')});
   choices.push({label:'Leave the diner',run:()=>{}});
   openDialogue('DINER REGULAR','The neighborhood is tense. A few people have noticed the same van making late-night stops.',choices);
  }
 }else if(target.type==='gas'){
  if(missionStep===4)openDialogue('THE STRANGER','You came. Keep your voice down. I have a name, a place, and a reason this needs to stay quiet.',[{label:'Hear the proposal',run:()=>{missionStep=5;showToast('A new lead points back to the desert warehouse.');saveGame();updateHUD();}},{label:'Walk away',run:()=>{missionStep=5;showToast('You decide to hear the rest later.');saveGame();updateHUD();}}]);
  else if(missionStep===11)openDialogue('THE DRIVER','I drove the van. I did not know what was inside. The motel clerk has the key, but I need to know you are serious.',[{label:'Pay him $250 for the details',run:()=>{if(cash<250){showToast('You do not have enough cash.');return;}cash-=250;missionStep=12;showToast('The driver gives you the room number. -$250');saveGame();updateHUD();}},{label:'Take the room number and leave',run:()=>{missionStep=12;showToast('The driver tells you where to look.');saveGame();updateHUD();}}]);
  else if(missionStep===16)openDialogue('NIGHT DRIVER','I was told to leave the package at the diner, but the courier changed the route. Someone at the diner knows where he went.',[{label:'Ask for the courier description',run:()=>{missionStep=17;showToast('The driver describes the courier. Head to the diner.');saveGame();updateHUD();}},{label:'Pay $200 for the driver’s notes',run:()=>{if(cash<200){showToast('You do not have enough cash.');return;}cash-=200;missionStep=17;showToast('Notes purchased. -$200');saveGame();updateHUD();}}]);
  else openDialogue('GAS STATION ATTENDANT','A quiet stop beside the highway. The attendant has seen plenty of strange cars, but remembers very little.',[{label:'Leave',run:()=>{}}]);
 }else if(target.type==='motel'){
  if(missionStep===7)openDialogue('MOTEL CONTACT','You are late. The courier left an envelope under the ice machine. There are two names inside. One of them is going to make trouble.',[{label:'Open the envelope (+$700)',run:()=>{cash+=700;missionStep=8;showToast('You found the names. Take the evidence back to Jesse. +$700');saveGame();updateHUD();}},{label:'Leave it sealed (+$200)',run:()=>{cash+=200;missionStep=8;showToast('You leave the envelope sealed. Return to the car wash. +$200');saveGame();updateHUD();}}]);
  else if(missionStep===12)openDialogue('MOTEL CLERK','Room six was paid for in cash. The driver left a key with me and said someone would come asking.',[{label:'Pay $150 for the key',run:()=>{if(cash<150){showToast('You do not have enough cash.');return;}cash-=150;missionStep=13;showToast('Room six key acquired. -$150');saveGame();updateHUD();}},{label:'Convince the clerk to hand it over',run:()=>{missionStep=13;showToast('The clerk slides the key across the counter.');saveGame();updateHUD();}}]);
  else if(missionStep===19)openDialogue('MOTEL MANAGER','Room six was cleared before dawn. The cargo was moved through the back lot. The person who signed for it is waiting at the car wash.',[{label:'Get the name and leave',run:()=>{missionStep=20;showToast('You have the name. Return to Jesse.');saveGame();updateHUD();}}]);
  else openDialogue('MOTEL MANAGER','The motel is quiet. Keep the noise down and stay out of the parking spaces.',[{label:'Leave',run:()=>{}}]);
 }else if(target.type==='police'){
  openDialogue('OFFICER','We have had reports of a van moving through this district after midnight. If you see it again, stay clear and call it in.',[{label:'Ask for the time of the report',run:()=>showToast('The report was logged just after midnight.')},{label:'Walk away',run:()=>{}}]);
 }else if(target.type==='warehouse'){
  if(missionStep<2)openDialogue('WAREHOUSE SECURITY','The warehouse is not ready for visitors. You need a lead before you can get inside.',[{label:'Leave for now',run:()=>{}}]);
  else if(missionStep===2)openDialogue('WAREHOUSE CONTACT','You made it. This is where the next chapter begins. Keep your head clear and decide how to handle the pressure.',[{label:'Talk it through (+$1,800)',run:()=>{cash+=1800;missionStep=3;showToast('The meeting went well. +$1,800. A delivery is waiting.');saveGame();updateHUD();}},{label:'Push for the details (+$2,400)',run:()=>{cash+=2400;missionStep=3;showToast('You get the information you came for. +$2,400.');saveGame();updateHUD();}}]);
  else if(missionStep===5)openDialogue('WAREHOUSE CONTACT','The stranger has a proposal. It is a chance to make money, but every deal leaves a trace.',[{label:'Accept the quiet deal (+$1,600)',run:()=>{cash+=1600;missionStep=6;showToast('Deal made. +$1,600.');saveGame();updateHUD();}},{label:'Walk away',run:()=>{missionStep=6;showToast('You leave without making a deal.');saveGame();updateHUD();}}]);
  else if(missionStep===13)openDialogue('WAREHOUSE ARCHIVIST','The ledger is here. It lists the motel payments, the van, and a shipment that never reached its destination.',[{label:'Take the ledger',run:()=>{missionStep=14;showToast('Ledger secured. Return to Jesse.');saveGame();updateHUD();}},{label:'Photograph the pages (+$250)',run:()=>{cash+=250;missionStep=14;showToast('You sell a copy of the ledger. +$250.');saveGame();updateHUD();}}]);
  else if(missionStep===18)openDialogue('WAREHOUSE CONTACT','The list confirms the shipment was split into two loads. The motel was only a transfer point. Jesse needs to know who signed the manifest.',[{label:'Take the manifest',run:()=>{missionStep=19;showToast('Manifest secured. Go to the motel.');saveGame();updateHUD();}},{label:'Sell a copy (+$400)',run:()=>{cash+=400;missionStep=19;showToast('A copy is sold. +$400.');saveGame();updateHUD();}}]);
  else if(missionStep===23)openDialogue('WAREHOUSE ARCHIVIST','Four pieces. The receipt, the phone, the motel key envelope and the shipping tag. Together they show who rerouted the shipment and who signed for it.',[{label:'Hand over the evidence',run:()=>{missionStep=24;showToast('The evidence is verified. Return to Jesse.');saveGame();updateHUD();}},{label:'Keep a private copy (+$500)',run:()=>{cash+=500;missionStep=24;showToast('You keep a copy of the file. +$500. Return to Jesse.');saveGame();updateHUD();}}]);
  else openDialogue('WAREHOUSE CONTACT','The warehouse is quiet for now. There is nothing new to discuss.',[{label:'Leave',run:()=>{}}]);
 }
}
function updateActive(){
 active=null;let best=Infinity;
 const el=$('interaction');
 if(driving){el.classList.add('visible');$('interaction-copy').textContent=' EXIT VEHICLE';}
 else{
  for(const l of locations){const d=player.position.distanceTo(l.pos);if(d<l.range&&d<best){best=d;active=l;}}
  if(fuel<100){for(const p of [new THREE.Vector3(73,0,35),new THREE.Vector3(78,0,35),new THREE.Vector3(83,0,35)]){const d=player.position.distanceTo(p);if(d<4.8&&d<best){best=d;active={type:'gas-refuel',label:'REFUEL VEHICLE · $300',pos:p,range:4.8};}}}
  for(let i=0;i<ambientNPCs.length;i++){const npc=ambientNPCs[i],d=player.position.distanceTo(npc.root.position);if(d<4.8&&d<best){best=d;active={type:'local',index:i,label:'TALK TO RESIDENT',pos:npc.root.position,range:4.8};}}
  if(deliveryState==='active'){const target=deliveryTargets[deliveryTargetIndex],d=target?player.position.distanceTo(target.pos):Infinity;if(d<9&&d<=best){best=d;active={type:'delivery-drop',label:'DELIVER PACKAGE',pos:target.pos,range:9};}}
  if(missionStep===22){for(const item of evidenceItems){if(item.collected)continue;const d=player.position.distanceTo(item.pos);if(d<5.5&&d<best){best=d;active={type:'activity-item',item,label:'COLLECT '+item.label.toUpperCase(),pos:item.pos,range:5.5};}}}
  if(raceStartItem.root.visible){const d=player.position.distanceTo(raceStartItem.pos);if(d<5.5&&d<best){best=d;active={type:'activity-item',item:raceStartItem,label:'START STREET TIME TRIAL',pos:raceStartItem.pos,range:5.5};}}
   if((deliveryState==='available'||deliveryState==='failed')&&deliveryItem.root.visible){const d=player.position.distanceTo(deliveryItem.pos);if(d<5.5&&d<best){best=d;active={type:'activity-item',item:deliveryItem,label:'PICK UP COURIER PACKAGE',pos:deliveryItem.pos,range:5.5};}}
  for(const item of salvageItems){if(item.collected)continue;const d=player.position.distanceTo(item.pos);if(d<5.5&&d<best){best=d;active={type:'activity-item',item,label:'SEARCH '+item.label.toUpperCase(),pos:item.pos,range:5.5};}}
  if(active&&!dialogOpen){el.classList.add('visible');$('interaction-copy').textContent=' '+active.label;}
  else if(player.position.distanceTo(playerCar.position)<4.8){el.classList.add('visible');$('interaction-copy').textContent=' ENTER SEDAN';}
  else el.classList.remove('visible');
 }
 let zone='RESIDENTIAL DISTRICT';
 if(player.position.distanceTo(locations[0].pos)<35)zone='CAR WASH DISTRICT';
 if(player.position.distanceTo(locations[1].pos)<35)zone='DINER DISTRICT';
 if(player.position.distanceTo(locations[2].pos)<45)zone='INDUSTRIAL OUTSKIRTS';
 if(player.position.distanceTo(locations[3].pos)<35)zone='GAS STATION';
 if(player.position.distanceTo(locations[4].pos)<24)zone='POLICE PATROL';
 if(player.position.distanceTo(locations[5].pos)<32)zone='ROUTE 66 MOTEL';
 $('location').innerHTML=zone+' <span>·</span> ALBUQUERQUE, NM';updateObjectiveDistance();drawMiniMap();
}
function drawMiniMap(){
 const canvas=$('minimap');if(!canvas)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,scale=.48;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(13,19,16,.22)';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='rgba(213,196,153,.32)';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();
 ctx.strokeStyle='rgba(213,196,153,.18)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();
 for(const l of locations){const dx=(l.pos.x-player.position.x)*scale,dy=(l.pos.z-player.position.z)*scale;if(Math.abs(dx)>cx-9||Math.abs(dy)>cy-9)continue;ctx.fillStyle=l.type==='warehouse'?'#c58c64':l.type==='gas'?'#83b7c1':'#d4b978';ctx.beginPath();ctx.arc(cx+dx,cy+dy,5,0,Math.PI*2);ctx.fill();}
 const target=currentObjective();if(target){const tx=cx+(target.pos.x-player.position.x)*scale,ty=cy+(target.pos.z-player.position.z)*scale;if(tx>4&&tx<w-4&&ty>4&&ty<h-4){ctx.strokeStyle='#fff0b2';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(tx,ty,9,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}}
 for(const item of [...evidenceItems,...salvageItems]){if(!item.root.visible)continue;const ix=cx+(item.pos.x-player.position.x)*scale,iy=cy+(item.pos.z-player.position.z)*scale;if(ix>4&&ix<w-4&&iy>4&&iy<h-4){ctx.fillStyle=item.kind==='salvage'?'#9ac7a4':'#e5c979';ctx.fillRect(ix-3,iy-3,6,6);}}
 if(deliveryItem.root.visible){const ix=cx+(deliveryItem.pos.x-player.position.x)*scale,iy=cy+(deliveryItem.pos.z-player.position.z)*scale;if(ix>4&&ix<w-4&&iy>4&&iy<h-4){ctx.fillStyle='#8fc4d2';ctx.fillRect(ix-4,iy-4,8,8);}}
 const carX=cx+(playerCar.position.x-player.position.x)*scale,carY=cy+(playerCar.position.z-player.position.z)*scale;if(carX>4&&carX<w-4&&carY>4&&carY<h-4){ctx.save();ctx.translate(carX,carY);ctx.rotate(-playerCar.rotation.y);ctx.fillStyle='#8fc4d2';ctx.fillRect(-3,-6,6,12);ctx.restore();}
 ctx.save();ctx.translate(cx,cy);ctx.rotate(-player.rotation.y);ctx.fillStyle='#f4e9d1';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.restore();
}
function drawWorldMap(){
 const canvas=$('world-map');if(!canvas)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,scale=Math.min((w-90)/520,(h-70)/520);
 const p=(x,z)=>({x:cx+x*scale,y:cy+z*scale});
 ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(32,42,34,.30)';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='rgba(192,177,138,.09)';ctx.lineWidth=1;
 for(let x=-250;x<=250;x+=25){const q=p(x,0);ctx.beginPath();ctx.moveTo(q.x,35);ctx.lineTo(q.x,h-35);ctx.stroke();}
 for(let z=-250;z<=250;z+=25){const q=p(0,z);ctx.beginPath();ctx.moveTo(35,q.y);ctx.lineTo(w-35,q.y);ctx.stroke();}
 ctx.lineCap='square';ctx.strokeStyle='#70736b';ctx.lineWidth=19*scale;ctx.beginPath();ctx.moveTo(...Object.values(p(-260,0)));ctx.lineTo(...Object.values(p(260,0)));ctx.stroke();
 ctx.strokeStyle='#686c64';ctx.lineWidth=15*scale;ctx.beginPath();ctx.moveTo(...Object.values(p(100,0)));ctx.lineTo(...Object.values(p(100,-52)));ctx.moveTo(...Object.values(p(-145,0)));ctx.lineTo(...Object.values(p(-145,-68)));ctx.stroke();
 ctx.strokeStyle='#d0b36a';ctx.lineWidth=2;ctx.setLineDash([9,10]);ctx.beginPath();ctx.moveTo(...Object.values(p(-250,0)));ctx.lineTo(...Object.values(p(250,0)));ctx.moveTo(...Object.values(p(100,-4)));ctx.lineTo(...Object.values(p(100,-50)));ctx.moveTo(...Object.values(p(-145,-4)));ctx.lineTo(...Object.values(p(-145,-66)));ctx.stroke();ctx.setLineDash([]);
 const block=(x,z,bw,bd,color)=>{const q=p(x,z);ctx.fillStyle=color;ctx.fillRect(q.x-bw*scale/2,q.y-bd*scale/2,bw*scale,bd*scale);ctx.strokeStyle='rgba(227,211,169,.35)';ctx.lineWidth=1;ctx.strokeRect(q.x-bw*scale/2,q.y-bd*scale/2,bw*scale,bd*scale);};
 [[-30,-38,14,11],[-58,-38,12,10],[8,-44,12,10],[42,-42,14,11],[-70,38,11,9],[70,42,14,10]].forEach(v=>block(v[0],v[1],v[2],v[3],'#887f6e'));
 block(36,28,30,19,'#b6a589');block(-82,22,25,16,'#d2c8b8');block(100,-70,39,31,'#4d5651');block(78,24,21,14,'#b9a77d');block(-145,-76,57,14,'#b9ad91');
 ctx.font='bold 15px monospace';ctx.textAlign='left';ctx.fillStyle='#e0d1aa';
 for(const l of locations){const q=p(l.pos.x,l.pos.z);ctx.fillStyle=l.type==='police'?'#9bb9d9':'#dfc27b';ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e0d1aa';ctx.fillText(l.name,q.x+11,q.y-8);}
 for(const item of [...evidenceItems,...salvageItems]){if(item.root.visible){const q=p(item.pos.x,item.pos.z);ctx.fillStyle=item.kind==='salvage'?'#9ac7a4':'#e5c979';ctx.fillRect(q.x-5,q.y-5,10,10);}}
 if(deliveryItem.root.visible){const q=p(deliveryItem.pos.x,deliveryItem.pos.z);ctx.fillStyle='#8fc4d2';ctx.fillRect(q.x-6,q.y-6,12,12);}
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
const clearWaypointButton=$('waypoint-clear');if(clearWaypointButton)clearWaypointButton.onclick=()=>{customWaypoint=null;saveGame();drawWorldMap();drawMiniMap();updateObjectiveDistance();showToast('Custom waypoint cleared.');};
$('map-close').onclick=()=>setMapOpen(false);
const viewButton=$('view-toggle');if(viewButton)viewButton.remove();
function enterVehicle(){playDoorSound();driving=true;driveSpeed=0;player.visible=false;player.position.copy(playerCar.position);player.rotation.y=playerCar.rotation.y;yaw=playerCar.rotation.y;showToast('Vehicle entered · W accelerate · A/D steer · S reverse');updateActive();}
function exitVehicle(){playDoorSound();driving=false;driveSpeed=0;player.visible=true;const side=new THREE.Vector3(Math.cos(playerCar.rotation.y),0,-Math.sin(playerCar.rotation.y));player.position.copy(playerCar.position).addScaledVector(side,3.4);player.rotation.y=playerCar.rotation.y;yaw=playerCar.rotation.y+Math.PI;showToast('You stepped out of the vehicle.');updateActive();}
function onInteract(){if(dialogOpen||mapOpen)return;if(driving){exitVehicle();return;}if(active&&(active.type==='delivery-drop'||active.type==='activity-item')){interact(active);return;}if(player.position.distanceTo(playerCar.position)<4.8){enterVehicle();return;}if(active)interact(active);}

window.addEventListener('keydown',e=>{
 unlockGameAudio();
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 if(e.code==='KeyM'){setMapOpen(!mapOpen);return;}
  if(e.code==='KeyH'&&driving){playHorn();return;}
 if(e.code==='KeyV'){toggleView();return;}
 if(e.code==='Escape'){if(mapOpen)setMapOpen(false);else closeDialogue();return;}
 if(mapOpen)return;
 keys[e.code]=true;
 if(e.code==='KeyE'||e.code==='Enter') onInteract();
});
window.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);dragging=false;resetJoystick();});
window.addEventListener('pagehide',saveGame);
document.addEventListener('visibilitychange',()=>{if(document.hidden){saveGame();Object.keys(keys).forEach(k=>keys[k]=false);dragging=false;resetJoystick();}});
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('pointermove',e=>{
 if(!dragging)return;
 yaw-=(e.clientX-lastX)*.004; pitch=Math.max(-.05,Math.min(.75,pitch+(e.clientY-lastY)*.003));
 lastX=e.clientX;lastY=e.clientY;
});
function bindHold(id,code){
 const el=$(id); if(!el)return;
 el.addEventListener('pointerdown',e=>{e.preventDefault();keys[code]=true;try{el.setPointerCapture(e.pointerId);}catch{}});
 ['pointerup','pointerleave','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,()=>keys[code]=false));
}
let joystickX=0,joystickY=0,joystickPointer=null;
const joystick=$('mobile-joystick'),joystickKnob=$('joystick-knob');
function resetJoystick(){
 joystickX=0;joystickY=0;joystickPointer=null;
 joystickKnob.style.transform='translate(-50%,-50%)';
}
function moveJoystick(e){
 const rect=joystick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
 const max=Math.min(rect.width,rect.height)*.25,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy),scale=len>max?max/len:1;
 const x=dx*scale,y=dy*scale;
 joystickX=THREE.MathUtils.clamp(x/max,-1,1);joystickY=THREE.MathUtils.clamp(y/max,-1,1);
 joystickKnob.style.transform='translate(calc(-50% + '+x+'px),calc(-50% + '+y+'px))';
}
joystick.addEventListener('pointerdown',e=>{
 e.preventDefault();joystickPointer=e.pointerId;
 try{joystick.setPointerCapture(e.pointerId);}catch{}
 moveJoystick(e);
});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joystickPointer){e.preventDefault();moveJoystick(e);}});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>joystick.addEventListener(type,e=>{if(e.pointerId===joystickPointer)resetJoystick();}));
$('mobile-interact').addEventListener('pointerdown',unlockGameAudio,{passive:true});
$('mobile-interact').onclick=onInteract;

function resize(){
 // Use the actual layout viewport; visualViewport can shrink unpredictably when iOS Safari chrome expands.
 const width=Math.max(1,Math.round(document.documentElement.clientWidth||window.innerWidth));
 const height=Math.max(1,Math.round(window.innerHeight||document.documentElement.clientHeight));
 camera.aspect=width/height;camera.updateProjectionMatrix();
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.setSize(width,height);
 renderer.domElement.style.width='100vw';renderer.domElement.style.height='100dvh';
}
window.addEventListener('resize',resize);
window.addEventListener('orientationchange',()=>setTimeout(resize,120));
window.visualViewport?.addEventListener('resize',resize);
const clock=new THREE.Clock();
let lastAutoSave=0,uiRefreshClock=0;
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04);
 let walkingNow=false;
 uiRefreshClock+=dt;
 if(!dialogOpen&&!mapOpen){
  crashCooldown=Math.max(0,crashCooldown-dt);
  trafficCars.forEach(t=>{
   let nextX=t.root.position.x+t.direction*t.speed*dt;
   if(nextX>265)nextX=-265;if(nextX< -265)nextX=265;
   const heading=t.direction>0?Math.PI/2:-Math.PI/2;
   const travel=Math.abs(nextX-t.root.position.x),steps=Math.max(1,Math.ceil(travel/.16));
   let blocked='';
   for(let step=1;step<=steps;step++){
    const candidate={x:t.root.position.x+(nextX-t.root.position.x)*step/steps,z:t.root.position.z};
    blocked=vehiclePathHitsPedestrian(t.root.position,candidate,heading)?'pedestrian':vehicleCollisionAt(candidate,heading,t.root);
    if(blocked)break;
    t.root.position.x=candidate.x;
   }
   if(blocked&&blocked!=='pedestrian')t.direction*=-1;
   t.root.rotation.y=t.direction>0?Math.PI/2:-Math.PI/2;
  });
  separatePedestriansFromAllVehicles();
  if(driving){
   const throttle=THREE.MathUtils.clamp((keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joystickY,-1,1);
   const steering=THREE.MathUtils.clamp((keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joystickX,-1,1);
   const effectiveThrottle=(fuel<=0&&throttle>0)?0:throttle;
   driveSpeed=THREE.MathUtils.clamp(driveSpeed+effectiveThrottle*15*dt,-10,24);
   if(fuel<=0&&driveSpeed>0)driveSpeed=Math.max(0,driveSpeed-18*dt);
   fuel=THREE.MathUtils.clamp(fuel-Math.abs(driveSpeed)*dt*.018,0,100);
   if(!throttle)driveSpeed*=Math.pow(.88,dt*60);
   if(Math.abs(driveSpeed)<.08)driveSpeed=0;
   const oldRotation=playerCar.rotation.y;
   const steeredRotation=oldRotation+steering*1.45*dt*(driveSpeed>=0?1:-1);
   if(!vehicleCollisionAt(playerCar.position,steeredRotation,playerCar))playerCar.rotation.y=steeredRotation;
   const oldPosition=playerCar.position.clone();
   const heading=new THREE.Vector3(Math.sin(playerCar.rotation.y),0,Math.cos(playerCar.rotation.y));
   const next=oldPosition.clone().addScaledVector(heading,driveSpeed*dt);
   const travel=oldPosition.distanceTo(next),steps=Math.max(1,Math.ceil(travel/.12));
   let collision='';
   for(let step=1;step<=steps;step++){
    const candidate=oldPosition.clone().lerp(next,step/steps);
    collision=vehiclePathHitsPedestrian(playerCar.position,candidate,playerCar.rotation.y)?'pedestrian':vehicleCollisionAt(candidate,playerCar.rotation.y,playerCar);
    if(collision)break;
    playerCar.position.copy(candidate);
   }
   if(collision){
    driveSpeed=0; // A blocked vehicle stops instead of bouncing through the obstacle.
    if(crashCooldown<=0){playImpact();const pedestrian=collision==='pedestrian';showToast(pedestrian?'The car stopped before reaching the pedestrian.':'Vehicle collision: '+collision+'.');crashCooldown=1.0;}
   }
   playerCar.position.x=THREE.MathUtils.clamp(playerCar.position.x,-245,245);playerCar.position.z=THREE.MathUtils.clamp(playerCar.position.z,-235,235);
   player.position.copy(playerCar.position);player.rotation.y=playerCar.rotation.y;
   $('drive-info').textContent='DRIVING · '+Math.round(Math.abs(driveSpeed)*3.6)+' KM/H · FUEL '+Math.round(fuel)+'%';
  }else{
   $('drive-info').textContent='ON FOOT';
   const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joystickY;
   const side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joystickX;
   const speed=(keys.ShiftLeft||keys.ShiftRight?13:7)*dt;
   const direction=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
   const right=new THREE.Vector3(direction.z,0,-direction.x);
   const move=direction.multiplyScalar(forward).add(right.multiplyScalar(side));
  if(move.lengthSq()>0){
   move.normalize();const next=player.position.clone().addScaledVector(move,speed);
   const obstacles=[[-30,-38,8.2,6.5],[-58,-38,7.5,6],[8,-44,7.5,6],[42,-42,8,6.5],[-70,38,7,5.5],[70,42,8,6.5],[36,28,15.5,9.7],[-82,22,13,8.5],[100,-70,20,16],[78,24,10,7],[-145,-76,28.5,7.5],[19,15,2,3.1],[-93,19,2,3.1],[51,-20,2,3.1],[-6,8,2.2,3.5],[98,23,2,3.5]];
   const isBlocked=(x,z)=>obstacles.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx&&Math.abs(z-oz)<rz);
   const actorBlocked=(x,z)=>pedestrianActors.some(n=>Math.hypot(x-n.root.position.x,z-n.root.position.z)<1.08)||trafficCars.some(t=>Math.hypot(x-t.root.position.x,z-t.root.position.z)<2.7);
   const oldX=player.position.x,oldZ=player.position.z;
   if(!isBlocked(next.x,oldZ)&&!actorBlocked(next.x,oldZ))player.position.x=next.x;
   if(!isBlocked(player.position.x,next.z)&&!actorBlocked(player.position.x,next.z))player.position.z=next.z;
   if(player.position.x!==oldX||player.position.z!==oldZ){player.rotation.y=Math.atan2(move.x,move.z);walkingNow=true;}
  }
  player.position.x=THREE.MathUtils.clamp(player.position.x,-245,245);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-235,235);
  }
 }
 if(uiRefreshClock>=.12){updateActive();uiRefreshClock=0;}
 if(walkingNow&&!driving){footstepClock+=dt;if(footstepClock>.42){playFootstep();footstepClock=0;}}else footstepClock=0;
 if(soundEnabled&&audioContext&&engineOsc){const speedRatio=Math.min(Math.abs(driveSpeed)/24,1);engineOsc.frequency.setTargetAtTime(48+Math.abs(driveSpeed)*3.2,audioContext.currentTime,.12);engineGain.gain.setTargetAtTime(driving?.045+speedRatio*.055:0,audioContext.currentTime,.18);engineHarmonicGain.gain.setTargetAtTime(driving?.012+speedRatio*.025:0,audioContext.currentTime,.18);roadNoiseGain.gain.setTargetAtTime(driving?speedRatio*.055:0,audioContext.currentTime,.2);}
 if(soundEnabled&&audioContext&&audioContext.state==='running'&&audioContext.currentTime>=nextBirdAt){playBirdCall();nextBirdAt=audioContext.currentTime+9+Math.random()*12;}
 if(deliveryState==='active'&&Date.now()>=deliveryDeadline){deliveryState='failed';deliveryDeadline=0;deliveryItem.root.visible=true;showToast('Delivery window expired. The package is back at the car wash.');saveGame();updateHUD();}
 if(raceActive){
  if(Date.now()>=raceDeadline){raceActive=false;raceGates.forEach(g=>g.root.visible=false);raceStartItem.root.visible=true;showToast('Time trial expired. Return to the start marker to try again.');}
  else if(driving&&playerCar.position.distanceTo(raceCheckpoints[raceIndex])<7.5){
   raceIndex++;
   if(raceIndex>=raceCheckpoints.length){raceActive=false;raceGates.forEach(g=>g.root.visible=false);raceStartItem.root.visible=true;cash+=1800;showToast('Street time trial complete · +$1,800');updateHUD();saveGame();}
   else showToast('Checkpoint '+raceIndex+' / '+raceCheckpoints.length+' cleared. Keep moving!');
  }
 }
 const animTime=performance.now(),swing=walkingNow&&!driving?Math.sin(animTime*.012)*.48:0;
 for(const item of [...evidenceItems,...salvageItems,deliveryItem,raceStartItem])if(item.root.visible){item.ring.rotation.z+=dt*.8;item.marker.position.y=1.62+Math.sin(animTime*.003+item.pos.x)*.12;}
 raceGates.forEach((gate,i)=>{if(gate.root.visible)gate.ring.rotation.z+=dt*(i%2?-.65:.65);});
  playerArms.forEach((limb,i)=>limb.rotation.x=(i===0?1:-1)*swing);playerLegs.forEach((limb,i)=>limb.rotation.x=(i===0?-1:1)*swing);body.position.y=walkingNow&&!driving?Math.abs(Math.sin(animTime*.012))*.055:0;
 const animateNpc=npc=>{npc.root.position.y=Math.sin(animTime*.001+npc.phase)*.022;const sway=Math.sin(animTime*.0015+npc.phase)*.035;npc.arms[0].rotation.x=sway;npc.arms[1].rotation.x=-sway;npc.legs[0].rotation.x=-sway*.65;npc.legs[1].rotation.x=sway*.65;};
 animateNpc(jesseNPC);animateNpc(dinerNPC);animateNpc(warehouseNPC);animateNpc(policeNPC);animateNpc(gasContactNPC);animateNpc(motelNPC);animateNpc(witnessNPC);animateNpc(courierNPC);animateNpc(driverNPC);animateNpc(motelClerkNPC);animateNpc(warehouseArchivistNPC);patrolRed.visible=Math.sin(animTime*.012)>0;patrolBlue.visible=!patrolRed.visible;
 ambientNPCs.forEach((npc,i)=>{
   animateNpc(npc);
   let nearestDistance=Infinity,awayX=0,awayZ=0;
   for(const movingCar of movingVehicleRoots){const dx=npc.root.position.x-movingCar.position.x,dz=npc.root.position.z-movingCar.position.z,d=Math.hypot(dx,dz);if(d<nearestDistance){nearestDistance=d;awayX=dx;awayZ=dz;}}
   if(driving){const dx=npc.root.position.x-playerCar.position.x,dz=npc.root.position.z-playerCar.position.z,d=Math.hypot(dx,dz);if(d<nearestDistance){nearestDistance=d;awayX=dx;awayZ=dz;}}
   if(nearestDistance<8.5){
     const length=Math.hypot(awayX,awayZ)||1;awayX/=length;awayZ/=length;
     const moved=movePedestrianSafely(npc,npc.root.position.x+awayX*3.8*dt,npc.root.position.z+awayZ*3.8*dt);
     if(moved){npc.home.x+=awayX*3.8*dt;npc.home.z+=awayZ*3.8*dt;}
     npc.root.rotation.y=Math.atan2(awayX,awayZ);
     const run=Math.sin(animTime*.025)*.48;npc.legs[0].rotation.x=moved?run:0;npc.legs[1].rotation.x=moved?-run:0;
     return;
    }
   const distance=npc.root.position.distanceTo(player.position);
   if(distance<7){npc.root.rotation.y=Math.atan2(player.position.x-npc.root.position.x,player.position.z-npc.root.position.z);npc.legs.forEach(leg=>leg.rotation.x=0);return;}
   const t=animTime*.00028+npc.wanderPhase,oldX=npc.root.position.x,oldZ=npc.root.position.z;
   const wanderX=npc.home.x+Math.sin(t)*2.1,wanderZ=npc.home.z+Math.cos(t)*1.15;
    movePedestrianSafely(npc,wanderX,wanderZ);
   if(Math.abs(npc.root.position.x-oldX)+Math.abs(npc.root.position.z-oldZ)>.002){
    npc.root.rotation.y=Math.atan2(npc.root.position.x-oldX,npc.root.position.z-oldZ);
    const step=Math.sin(t*4)*.22;npc.legs[0].rotation.x=step;npc.legs[1].rotation.x=-step;
   }
  });
 updateObjectiveBeacon(animTime);
 if(animTime-lastAutoSave>4000){saveGame();lastAutoSave=animTime;}
 const cameraYaw=driving?playerCar.rotation.y:yaw;
 const camDist=driving?13.5:8.8,cameraHeight=driving?2.15:1.55;
 cameraTarget.set(player.position.x,player.position.y+(driving?1.75:2.35),player.position.z);
 const offset=new THREE.Vector3(-Math.sin(cameraYaw)*camDist,cameraHeight,-Math.cos(cameraYaw)*camDist);
 const desired=keepCameraOutsideWalls(cameraTarget,cameraTarget.clone().add(offset));
 camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(cameraTarget);
 landmarkLabels.forEach(label=>label.quaternion.copy(camera.quaternion));
 renderer.render(scene,camera);
}
// Keep the live game independent of stale service-worker shells. Clear legacy app caches once on startup.
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
 window.addEventListener('load',async()=>{
  try{
   const registrations=await navigator.serviceWorker.getRegistrations();
   await Promise.all(registrations.map(registration=>registration.unregister()));
   if('caches' in window){
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('abq-stories-')).map(key=>caches.delete(key)));
   }
  }catch(error){console.warn('App cache cleanup skipped',error);}
 });
}
updateHUD();saveGame();drawMiniMap();animate();
gameReady=true;clearTimeout(startupWatchdog);
setTimeout(()=>$('loading').classList.add('gone'),700);
