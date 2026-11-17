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
const school=new THREE.Group(); school.position.set(-132,0,-48); scene.add(school);
box(school,0,3.1,0,34,6.2,20,materials.cream);box(school,0,6.25,0,35,.35,21,materials.rust);
for(let x=-12;x<=12;x+=6)box(school,x,3.3,10.15,3.1,2.2,.16,materials.glass);
box(school,0,1.25,10.25,2.1,2.5,.18,materials.teal);box(school,0,.12,16,38,.2,9,materials.asphalt);
box(warehouse,0,5,0,38,10,30,materials.dark);
for(let x of [-12,0,12]) box(warehouse,x,4.2,15.1,8,7,.3,materials.rust);
box(warehouse,0,10.2,0,39,.4,31,materials.rust);

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
car(19,15,0x8d8d86,-.4); car(-93,19,0x6e777c,.2); car(51,-20,0x9a483b,-.2);

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

const locations=[
 {name:'WHITE HOME',label:'TALK TO SKYLER',pos:new THREE.Vector3(-30,0,-25),range:8,type:'skyler'},
 {name:'WALTER JR.',label:'TALK TO WALTER JR.',pos:new THREE.Vector3(-35,0,-25),range:8,type:'junior'},
 {name:'SCHOOL',label:'TALK TO A COLLEAGUE',pos:new THREE.Vector3(-132,0,-30),range:10,type:'teacher'},
 {name:'A-1 CAR WASH',label:'TALK TO JESSE',pos:new THREE.Vector3(28,0,43),range:9,type:'jesse'},
 {name:'DINER',label:'THE DINER',pos:new THREE.Vector3(-82,0,17),range:15,type:'diner'},
 {name:'DESERT WAREHOUSE',label:'THE WAREHOUSE',pos:new THREE.Vector3(100,0,-70),range:19,type:'locked'}
];
// Visible original NPCs at key conversation locations.
function makeNPC(x,z,shirt,pants,skin=0xb98e6e){
 const root=new THREE.Group(); root.position.set(x,0,z); scene.add(root);
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(.34,.43,1.05,9),mat(shirt));
 torso.position.y=1.35; torso.castShadow=true; root.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.31,12,10),mat(skin));
 head.position.y=2.12; head.castShadow=true; root.add(head);
 const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.32,10,8,0,Math.PI*2,0,Math.PI/2),materials.dark);
 hairCap.position.y=2.27; root.add(hairCap);
 for(const side of [-1,1]){
  const arm=cylinder(root,side*.43,1.35,0,.13,.16,.78,mat(shirt),8);
  arm.rotation.z=side*.12;
  cylinder(root,side*.19,.43,0,.15,.18,.75,mat(pants),8);
 }
 return {root,phase:Math.random()*6};
}
const jesseNPC=makeNPC(28,43,0x6f8069,0x343c3c);
jesseNPC.root.rotation.y=-.35;
const dinerNPC=makeNPC(-82,17,0x8b6555,0x343a43);dinerNPC.root.rotation.y=Math.PI;
const skylerNPC=makeNPC(-30,-25,0x6f7d78,0x343a43,0xc99b7a);skylerNPC.root.rotation.y=Math.PI;
const juniorNPC=makeNPC(-35,-25,0x667d9a,0x343a43,0xc99b7a);juniorNPC.root.rotation.y=Math.PI;
const teacherNPC=makeNPC(-132,-30,0x8c6c56,0x343a43);teacherNPC.root.rotation.y=Math.PI;

// Persistent progress: choices and money survive refreshes on this device.
const SAVE_KEY='abq-stories-save-v1';
let saved={};
try { saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{}; } catch {}
let active=null,cash=Number.isFinite(saved.cash)?saved.cash:7300,trust=Number.isFinite(saved.trust)?saved.trust:50,heat=Number.isFinite(saved.heat)?saved.heat:8,missionStep=Number.isFinite(saved.missionStep)?saved.missionStep:0,dialogOpen=false;
const defaults={skyler:{trust:58,suspicion:12,fear:0},junior:{trust:76,suspicion:3,fear:0},jesse:{trust:28,suspicion:18,fear:0},teacher:{trust:52,suspicion:4,fear:0},diner:{trust:50,suspicion:5,fear:0}};
const people={};for(const [id,base] of Object.entries(defaults)){const old=saved.people?.[id]||{};people[id]={...base,...old,knowledge:Array.isArray(old.knowledge)?old.knowledge:[],memories:Array.isArray(old.memories)?old.memories:[]};}
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({cash,trust,heat,missionStep,people,updatedAt:Date.now()}));}catch{}}
function affect(id,delta={},memory='',knowledge=''){const p=people[id];if(!p)return;for(const k of ['trust','suspicion','fear'])if(Number.isFinite(delta[k]))p[k]=THREE.MathUtils.clamp(p[k]+delta[k],0,100);if(knowledge&&!p.knowledge.includes(knowledge))p.knowledge.push(knowledge);if(memory){p.memories.push({text:memory,at:Date.now()});p.memories=p.memories.slice(-12);}saveGame();updateHUD();}

const keys={};
let yaw=0, pitch=.25, dragging=false, lastX=0,lastY=0;
const cameraTarget=new THREE.Vector3();

function showToast(text){
 $('toast').textContent=text; $('toast').classList.add('show');
 clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>$('toast').classList.remove('show'),2600);
}
function updateHUD(){
 $('cash').textContent='$'+cash.toLocaleString('en-US');
 const stats=$('stats'); if(stats) stats.textContent='SKYLER '+people.skyler.trust+' · JESSE '+people.jesse.trust+' · HEAT '+heat;
 $('mission-title').textContent=missionStep===0?'A LIFE THAT LOOKS NORMAL':missionStep===1?'A CONVERSATION WITH JESSE':'TWO LIVES, ONE MAN';
 $('mission-copy').textContent=missionStep===0?'Go home or visit school. The people closest to Walter notice when he changes.':missionStep===1?'Find Jesse at the car wash. He remembers Walter as his chemistry teacher.':'There is no quest marker for every problem. Talk, listen, and decide what Walter hides.';
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
function closeDialogue(){dialogOpen=false;$('dialogue').classList.add('hidden');saveGame();updateHUD();}
$('close-dialogue').onclick=closeDialogue;

function interact(target){
 if(!target)return;
 if(target.type==='skyler')openDialogue('SKYLER WHITE',people.skyler.suspicion>35?"You keep saying everything is fine. You expect me not to notice?":"You have been somewhere else lately, Walt. If something is wrong, tell me.",[
 {label:'Tell her the truth about the diagnosis',run:()=>{affect('skyler',{trust:12,suspicion:-8},'Walter told Skyler about the cancer diagnosis.','Walter has cancer.');missionStep=Math.max(missionStep,1);showToast('Skyler knows about the diagnosis, not everything.');}},
 {label:'Say it is only work stress',run:()=>{affect('skyler',{trust:-5,suspicion:8},'Walter blamed his distance on work.');showToast('She notices the evasion.');}},
 {label:'Shut down the conversation',run:()=>{affect('skyler',{trust:-9,suspicion:13},'Walter refused to explain.');showToast('The silence creates distance.');}}]);
 else if(target.type==='junior')openDialogue('WALTER JR.',people.junior.memories.length?'You said you would be honest with us. Are you feeling better?':'Hey, Dad. Mom says you have been tired. Are you okay?',[
 {label:'Spend a moment with him',run:()=>{affect('junior',{trust:8,suspicion:-2},'Walter spent time with his son.');showToast('A small moment of normal life.');}},
 {label:'Tell him not to worry',run:()=>{affect('junior',{trust:1,suspicion:2},'Walter reassured his son without explaining.');showToast('He wants to believe you.');}}]);
 else if(target.type==='teacher')openDialogue('SCHOOL COLLEAGUE','You have been distracted in class, Walt. Everything all right?',[
 {label:'Keep it professional',run:()=>{affect('teacher',{trust:3},'Walter kept the conversation professional.');showToast('A normal day at school.');}},
 {label:'Admit something is wrong',run:()=>{affect('teacher',{trust:6,suspicion:1},'Walter admitted a personal problem.','Walter has a serious personal problem.');showToast('Your colleague knows something is wrong, not what.');}}]);
 else if(target.type==='jesse')openDialogue('JESSE PINKMAN',people.jesse.trust<25?'Mr. White? You show up after all this time and expect me to trust you?':'My old chemistry teacher. This is weird. What do you want?',[
 {label:'Ask him to hear you out',run:()=>{affect('jesse',{trust:10,suspicion:3},'Walter asked Jesse to hear a proposal.','Walter approached Jesse with a proposal.');missionStep=Math.max(missionStep,2);showToast('Jesse agrees to hear you out — cautiously.');}},
 {label:'Offer him money to listen',run:()=>{cash=Math.max(0,cash-300);affect('jesse',{trust:2,suspicion:7},'Walter offered Jesse $300.');showToast('Money got his attention, not his trust.');}},
 {label:'Remind him you were his teacher',run:()=>{affect('jesse',{trust:-4,suspicion:6},'Walter invoked his authority as Jesse’s former teacher.');showToast('Jesse dislikes being talked down to.');}}]);
 else if(target.type==='diner')openDialogue('DINER REGULAR',people.diner.memories.length?'People are talking about strange things happening around town.':'Morning. Same coffee?',[
 {label:'Make ordinary conversation',run:()=>{affect('diner',{trust:4,suspicion:-1},'Walter shared ordinary conversation.');showToast('For a moment, life feels ordinary.');}},
 {label:'Ask what people are saying',run:()=>{affect('diner',{trust:-1,suspicion:4},'Walter pressed for local rumors.');heat++;showToast('Your questions stood out.');}}]);
 else openDialogue('DESERT WAREHOUSE','The warehouse is quiet. Walter has no reason to go inside yet.',[{label:'Leave',run:()=>{}}]);
}
function updateActive(){
 active=null; let best=Infinity;
 for(const l of locations){
  const d=player.position.distanceTo(l.pos);
  if(d<l.range&&d<best){best=d;active=l;}
 }
 const el=$('interaction');
 if(active&&!dialogOpen){el.classList.add('visible');$('interaction-copy').textContent=' '+active.label;}
 else el.classList.remove('visible');
 let zone='RESIDENTIAL DISTRICT';
 if(player.position.distanceTo(locations[0].pos)<35) zone='WHITE RESIDENCE';
 if(player.position.distanceTo(locations[2].pos)<40) zone='SCHOOL DISTRICT';
 if(player.position.distanceTo(locations[3].pos)<35) zone='CAR WASH DISTRICT';
 if(player.position.distanceTo(locations[4].pos)<35) zone='DINER DISTRICT';
 if(player.position.distanceTo(locations[5].pos)<45) zone='INDUSTRIAL OUTSKIRTS';
 $('location').innerHTML=zone+' <span>·</span> ALBUQUERQUE, NM';
}
function onInteract(){if(!dialogOpen&&active)interact(active);}

window.addEventListener('keydown',e=>{
 keys[e.code]=true;
 if(e.code==='KeyE'||e.code==='Enter') onInteract();
 if(e.code==='Escape') closeDialogue();
});
window.addEventListener('keyup',e=>keys[e.code]=false);
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
  const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
  const side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  const speed=(keys.ShiftLeft||keys.ShiftRight?13:7)*dt;
  // W moves away from the camera (the character's forward direction).
  const direction=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const move=direction.multiplyScalar(forward).add(right.multiplyScalar(side));
  if(move.lengthSq()>0){
   move.normalize();
   const next=player.position.clone().addScaledVector(move,speed);
   // Keep the player outside solid building footprints; entrances remain open.
   const blocked=[
    [-30,-38,8.2,6.5],[-58,-38,7.5,6], [8,-44,7.5,6],
    [42,-42,8,6.5],[-70,38,7,5.5],[70,42,8,6.5],
    [36,28,15.5,9.7],[-82,7,13,8.5],[100,-70,20,16],[-132,-48,18,11]
   ].some(([x,z,rx,rz])=>Math.abs(next.x-x)<rx && Math.abs(next.z-z)<rz);
   if(!blocked){player.position.copy(next);player.rotation.y=Math.atan2(move.x,move.z);}
  }
  player.position.x=THREE.MathUtils.clamp(player.position.x,-245,245);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-235,235);
 }
 updateActive();
 jesseNPC.root.position.y=Math.sin(performance.now()*.0012+jesseNPC.phase)*.025;
 dinerNPC.root.position.y=Math.sin(performance.now()*.001+dinerNPC.phase)*.018;
 skylerNPC.root.position.y=Math.sin(performance.now()*.0009+skylerNPC.phase)*.012;juniorNPC.root.position.y=Math.sin(performance.now()*.0011+juniorNPC.phase)*.015;teacherNPC.root.position.y=Math.sin(performance.now()*.001+teacherNPC.phase)*.012;
 const camDist=10.5;
 const offset=new THREE.Vector3(Math.sin(yaw)*camDist,4.5+pitch*5,Math.cos(yaw)*camDist);
 cameraTarget.set(player.position.x,player.position.y+1.2,player.position.z);
 const desired=cameraTarget.clone().add(offset);
 camera.position.lerp(desired,1-Math.pow(.001,dt));
 camera.lookAt(cameraTarget);
 renderer.render(scene,camera);
}
updateHUD();saveGame();animate();
setTimeout(()=>$('loading').classList.add('gone'),700);
