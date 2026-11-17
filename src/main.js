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
  red: mat(0x9d493b), blue: mat(0x506a7c)
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
 box(g,0,.8,0,5,1.2,2.5,mat(color));
 box(g,0,1.55,-.1,2.7,.8,2.1,materials.glass);
 for(let wx of [-1.65,1.65]) for(let wz of [-1.25,1.25]){
  const w=cylinder(g,wx,.48,wz,.48,.48,.28,materials.dark,12); w.rotation.z=Math.PI/2;
 }
 return g;
}
const playerCar=car(8,-6,0x8d8d86,Math.PI); car(19,15,0x8d8d86,-.4); car(-93,19,0x6e777c,.2); car(51,-20,0x9a483b,-.2);
let driving=false,driveSpeed=0;

// Player character, original low-poly civilian silhouette
const player=new THREE.Group(); scene.add(player);
const body= new THREE.Group(); player.add(body);
cylinder(body,0,1.35,0,.42,.5,1.05,materials.blue,9);
const head=new THREE.Mesh(new THREE.SphereGeometry(.34,12,10),mat(0xb98e6e));
head.position.y=2.12; head.castShadow=true; body.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.35,10,8,0,Math.PI*2,0,Math.PI/2),materials.dark);
hair.position.y=2.27; body.add(hair);
for(const side of [-1,1]){
 const arm=cylinder(body,side*.48,1.3,0,.13,.16,.82,materials.blue,8); arm.rotation.z=side*.12;
 const leg=cylinder(body,side*.2,.43,0,.16,.19,.72,materials.dark,8);
}
player.position.set(0,0,0);

function makeNPC(x,z,shirt,pants,skin=0xb98e6e){
 const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(.34,.43,1.05,9),mat(shirt));torso.position.y=1.35;torso.castShadow=true;root.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.31,12,10),mat(skin));head.position.y=2.12;head.castShadow=true;root.add(head);
 const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.32,10,8,0,Math.PI*2,0,Math.PI/2),materials.dark);hairCap.position.y=2.27;root.add(hairCap);
 for(const side of [-1,1]){const arm=cylinder(root,side*.43,1.35,0,.13,.16,.78,mat(shirt),8);arm.rotation.z=side*.12;cylinder(root,side*.19,.43,0,.15,.18,.75,mat(pants),8);}
 return {root,phase:Math.random()*6};
}
const jesseNPC=makeNPC(28,43,0x6f8069,0x343c3c);jesseNPC.root.rotation.y=-.35;
const dinerNPC=makeNPC(-82,17,0x8b6555,0x343a43);dinerNPC.root.rotation.y=Math.PI;
const warehouseNPC=makeNPC(100,-48,0x887b63,0x343a43);warehouseNPC.root.rotation.y=Math.PI;
const ambientNPCs=[makeNPC(-108,-28,0x697a70,0x343a43),makeNPC(4,24,0x8a6e57,0x343a43),makeNPC(62,-92,0x6d7180,0x343a43)];

const locations=[
 {name:'A-1 CAR WASH',label:'THE CAR WASH',pos:new THREE.Vector3(36,0,43),range:13,type:'mission'},
 {name:'DINER',label:'THE DINER',pos:new THREE.Vector3(-82,0,17),range:15,type:'talk'},
 {name:'DESERT WAREHOUSE',label:'THE WAREHOUSE',pos:new THREE.Vector3(100,0,-50),range:15,type:'warehouse'},
 {name:'GAS STATION',label:'THE GAS STATION',pos:new THREE.Vector3(78,0,22),range:14,type:'gas'}
];
function worldLabel(text,x,z,color='#e8d9b8'){
 const c=document.createElement('canvas');c.width=512;c.height=112;const ctx=c.getContext('2d');
 ctx.fillStyle='rgba(16,21,17,.82)';ctx.fillRect(0,0,512,112);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(3,3,506,106);
 ctx.fillStyle=color;ctx.font='bold 42px monospace';ctx.textAlign='center';ctx.fillText(text,256,70);
 const tex=new THREE.CanvasTexture(c);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(13,2.8),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
 mesh.position.set(x,8,z);scene.add(mesh);return mesh;
}
const landmarkLabels=[worldLabel('A-1 CAR WASH',36,43),worldLabel('DINER',-82,17),worldLabel('DESERT WAREHOUSE',100,-50),worldLabel('GAS / REPAIR',78,22)];
const SAVE_KEY='abq-stories-save-v2';let saved={};try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch{}
let active=null,cash=Number.isFinite(saved.cash)?saved.cash:7300,trust=Number.isFinite(saved.trust)?saved.trust:50,heat=Number.isFinite(saved.heat)?saved.heat:8,health=Number.isFinite(saved.health)?THREE.MathUtils.clamp(saved.health,0,100):100,missionStep=Number.isFinite(saved.missionStep)?saved.missionStep:0,dialogOpen=false;
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({cash,trust,heat,health,missionStep,updatedAt:Date.now()}));}catch{}}
function updateHealthUI(){ /* Health remains a gameplay mechanic; visual health bars are intentionally removed. */ }
function damagePlayer(amount,reason='You were hurt.'){
 health=Math.max(0,health-amount);updateHealthUI();saveGame();showToast(reason+' Health -'+amount+'.');
 if(health<=0){health=100;cash=Math.max(0,cash-300);player.position.set(-82,0,29);showToast('You recovered at the diner. $300 lost; health restored.');updateHealthUI();saveGame();updateHUD();}
}
function healPlayer(amount,cost=0){if(cost>cash){showToast('Not enough cash for treatment.');return false;}cash-=cost;health=Math.min(100,health+amount);updateHealthUI();saveGame();updateHUD();return true;}
const keys={};
let yaw=0, pitch=.25, dragging=false, lastX=0,lastY=0;
const cameraTarget=new THREE.Vector3();

function showToast(text){
 $('toast').textContent=text; $('toast').classList.add('show');
 clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>$('toast').classList.remove('show'),2600);
}
function updateHUD(){
 $('cash').textContent='$' + cash.toLocaleString('en-US');
 updateHealthUI();
 const titles=['A DIFFERENT KIND OF FUTURE','A CONVERSATION IN THE DESERT','THE WAREHOUSE LEAD','CHAPTER ONE COMPLETE'];
 const copies=['Head to the car wash. Jesse is waiting to talk.','Visit the diner and decide who deserves your trust.','The diner lead is in. Head to the desert warehouse.','You completed the first chapter. Explore Albuquerque and recover when needed.'];
 const step=Math.min(missionStep,3);
 $('mission-title').textContent=titles[step];
 $('mission-copy').textContent=copies[step];
 const progress=document.querySelector('.objective-progress i');if(progress)progress.style.width=['8%','38%','68%','100%'][step];
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
 if(target.type==='mission'&&missionStep===0){
  openDialogue('JESSE','You said you wanted to talk. So talk. What exactly are you asking me to do?',[
   {label:'“I have a plan. Hear me out.”',run:()=>{trust=Math.min(100,trust+12);cash+=1200;missionStep=1;showToast('Jesse agreed to hear your proposal. +$1,200');saveGame();updateHUD();}},
   {label:'“Forget it. Not today.”',run:()=>{heat+=2;showToast('Jesse leaves. The moment passes.');saveGame();updateHUD();}}
  ]);
 }else if(target.type==='talk'){
  openDialogue('DINER REGULAR','The neighborhood is tense. Sit down, catch your breath, or ask what people have heard around town.',[
   {label:'Ask about the warehouse (advance the lead)',run:()=>{heat+=1;trust=Math.min(100,trust+3);missionStep=Math.max(missionStep,2);showToast('A lead on the warehouse has been added to your map.');saveGame();updateHUD();}},
   {label:'Take a break (+35 health)',run:()=>{healPlayer(35,0);showToast('You rested at the diner.');}},
   {label:'Buy a meal (+60 health, $250)',run:()=>{if(healPlayer(60,250))showToast('You feel much better.');}}
  ]);
 }else if(target.type==='gas'){
  openDialogue('GAS STATION','A quiet stop beside the highway. The attendant offers a first-aid kit and a chance to regroup.',[
   {label:'Use first-aid kit (+45 health, $180)',run:()=>{if(healPlayer(45,180))showToast('First-aid kit used.');}},
   {label:'Refuel and rest (+100 health, $400)',run:()=>{if(healPlayer(100,400))showToast('You are back in shape.');}}
  ]);
 }else if(target.type==='warehouse'){
  if(missionStep<2)openDialogue('WAREHOUSE SECURITY','The warehouse is not ready for visitors. You need a lead before you can get inside.',[{label:'Leave for now',run:()=>{}}]);
  else if(missionStep===2)openDialogue('WAREHOUSE CONTACT','You made it. This is where the next chapter begins. Keep your head clear and decide how to handle the pressure.',[
   {label:'Talk it through (+15 trust)',run:()=>{trust=Math.min(100,trust+15);heat+=2;cash+=1800;missionStep=3;showToast('The meeting went well. +$1,800');saveGame();updateHUD();}},
   {label:'Force the issue (-35 health, +$2,400)',run:()=>{damagePlayer(35,'A tense confrontation.');cash+=2400;heat+=8;missionStep=3;showToast('You got what you came for. +$2,400');saveGame();updateHUD();}}
  ]);
  else openDialogue('WAREHOUSE CONTACT','The warehouse is secure for now. You have completed the first chapter.',[{label:'Understood',run:()=>{}}]);
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
 if(active&&!dialogOpen){el.classList.add('visible');$('interaction-copy').textContent=' '+active.label;}
 else if(!driving&&player.position.distanceTo(playerCar.position)>=4.8)el.classList.remove('visible');
 }
 let zone='RESIDENTIAL DISTRICT';
 if(player.position.distanceTo(locations[0].pos)<35) zone='CAR WASH DISTRICT';
 if(player.position.distanceTo(locations[1].pos)<35) zone='DINER DISTRICT';
 if(player.position.distanceTo(locations[2].pos)<45) zone='INDUSTRIAL OUTSKIRTS';
 if(player.position.distanceTo(locations[3].pos)<35)zone='GAS STATION';
 $('location').innerHTML=zone+' <span>·</span> ALBUQUERQUE, NM';drawMiniMap();
}
function drawMiniMap(){
 const canvas=$('minimap');if(!canvas)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,scale=.48;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(13,19,16,.9)';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='rgba(213,196,153,.32)';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();
 ctx.strokeStyle='rgba(213,196,153,.18)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();
 for(const l of locations){const dx=(l.pos.x-player.position.x)*scale,dy=(l.pos.z-player.position.z)*scale;if(Math.abs(dx)>cx-9||Math.abs(dy)>cy-9)continue;ctx.fillStyle=l.type==='warehouse'?'#c58c64':l.type==='gas'?'#83b7c1':'#d4b978';ctx.beginPath();ctx.arc(cx+dx,cy+dy,5,0,Math.PI*2);ctx.fill();}
 ctx.save();ctx.translate(cx,cy);ctx.rotate(-player.rotation.y);ctx.fillStyle='#f4e9d1';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.restore();
}
function enterVehicle(){driving=true;driveSpeed=0;player.visible=false;player.position.copy(playerCar.position);player.rotation.y=playerCar.rotation.y;yaw=playerCar.rotation.y;showToast('Vehicle entered · W accelerate · A/D steer · S reverse');updateActive();}
function exitVehicle(){driving=false;driveSpeed=0;player.visible=true;const side=new THREE.Vector3(Math.cos(playerCar.rotation.y),0,-Math.sin(playerCar.rotation.y));player.position.copy(playerCar.position).addScaledVector(side,3.4);player.rotation.y=playerCar.rotation.y;showToast('You stepped out of the vehicle.');updateActive();}
function onInteract(){if(dialogOpen)return;if(driving){exitVehicle();return;}if(player.position.distanceTo(playerCar.position)<4.8){enterVehicle();return;}if(active)interact(active);}

window.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 keys[e.code]=true;
 if(e.code==='KeyE'||e.code==='Enter') onInteract();
 if(e.code==='Escape') closeDialogue();
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
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04);
 if(!dialogOpen){
  if(driving){
   const throttle=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
   const steering=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
   driveSpeed=THREE.MathUtils.clamp(driveSpeed+throttle*15*dt,-10,24);
   if(!throttle)driveSpeed*=Math.pow(.88,dt*60);
   if(Math.abs(driveSpeed)<.08)driveSpeed=0;
   if(Math.abs(driveSpeed)>.25)playerCar.rotation.y+=steering*1.45*dt*(driveSpeed>=0?1:-1);
   const heading=new THREE.Vector3(Math.sin(playerCar.rotation.y),0,Math.cos(playerCar.rotation.y));
   const next=playerCar.position.clone().addScaledVector(heading,driveSpeed*dt);
   const solid=[[ -30,-38,8.2,6.5],[-58,-38,7.5,6],[8,-44,7.5,6],[42,-42,8,6.5],[-70,38,7,5.5],[70,42,8,6.5],[36,28,15.5,9.7],[-82,7,13,8.5],[100,-70,20,16],[78,8,10,7]];
   const blocked=(x,z)=>solid.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx+1.8&&Math.abs(z-oz)<rz+1.8);
   const oldX=playerCar.position.x,oldZ=playerCar.position.z;
   if(!blocked(next.x,oldZ))playerCar.position.x=next.x;
   if(!blocked(playerCar.position.x,next.z))playerCar.position.z=next.z;
   if(playerCar.position.x!==next.x||playerCar.position.z!==next.z)driveSpeed*=.18;
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
   const obstacles=[[-30,-38,8.2,6.5],[-58,-38,7.5,6],[8,-44,7.5,6],[42,-42,8,6.5],[-70,38,7,5.5],[70,42,8,6.5],[36,28,15.5,9.7],[-82,7,13,8.5],[100,-70,20,16],[78,8,10,7],[19,15,3.1,2],[-93,19,3.1,2],[51,-20,3.1,2],[8,-6,3.5,2.2]];
   const isBlocked=(x,z)=>obstacles.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx&&Math.abs(z-oz)<rz);
   const oldX=player.position.x,oldZ=player.position.z;
   if(!isBlocked(next.x,oldZ))player.position.x=next.x;
   if(!isBlocked(player.position.x,next.z))player.position.z=next.z;
   if(player.position.x!==oldX||player.position.z!==oldZ)player.rotation.y=Math.atan2(move.x,move.z);
  }
  player.position.x=THREE.MathUtils.clamp(player.position.x,-245,245);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-235,235);
  }
 }
 updateActive();
 jesseNPC.root.position.y=Math.sin(performance.now()*.0012+jesseNPC.phase)*.025;dinerNPC.root.position.y=Math.sin(performance.now()*.001+dinerNPC.phase)*.018;warehouseNPC.root.position.y=Math.sin(performance.now()*.0011+warehouseNPC.phase)*.02;ambientNPCs.forEach((npc,i)=>{npc.root.position.y=Math.sin(performance.now()*.0009+npc.phase)*.018;npc.root.rotation.y+=Math.sin(performance.now()*.00025+i)*.00015;});
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
