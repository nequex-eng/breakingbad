import './style.css';
import * as THREE from 'three';

const app = document.querySelector('#app');
const $ = (id) => document.getElementById(id);
// iPads often report a desktop-sized viewport, so detect touch hardware rather than screen width.
const hasTouchInput = (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia?.('(pointer: coarse)').matches ?? false);
document.documentElement.classList.toggle('touch-device',hasTouchInput);
document.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();},true);
document.addEventListener('selectstart',event=>{event.preventDefault();event.stopPropagation();},true);
// Suppress browser text-selection shortcuts without interfering with the game's Shift-to-run key.
document.addEventListener('keydown',event=>{
 if(event.shiftKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
  event.preventDefault();
  event.stopImmediatePropagation();
 }
},true);
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
let performanceEnabled=localStorage.getItem('abq-performance-mode')==='true';
function applyPerformanceMode(){
 renderer.setPixelRatio(performanceEnabled?Math.min(window.devicePixelRatio||1,.9):Math.min(window.devicePixelRatio||1,1.65));
 renderer.shadowMap.enabled=!performanceEnabled;
 renderer.shadowMap.needsUpdate=true;
 const button=$('performance-toggle');
 if(button){button.textContent=performanceEnabled?'SMOOTH MODE ON':'SMOOTH MODE OFF';button.setAttribute('aria-pressed',String(performanceEnabled));}
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(window.visualViewport?.width||innerWidth, window.visualViewport?.height||innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
app.prepend(renderer.domElement);

const hemiLight=new THREE.HemisphereLight(0xe7d9c6, 0x5c5143, 2.0);scene.add(hemiLight);
const sun = new THREE.DirectionalLight(0xffd4a1, 3.2);
sun.position.set(-65, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100;
scene.add(sun);

// Persistent in-world clock drives a complete Albuquerque day/night cycle.
let gameClock=14.0,lightingRefresh=0;
const daySky=new THREE.Color(0xb9a18a),duskSky=new THREE.Color(0xd28b68);
const dayFog=new THREE.Color(0xb9a18a),duskFog=new THREE.Color(0xb98268);
const skyStars=new THREE.BufferGeometry(),starPositions=[];
for(let i=0;i<220;i++)starPositions.push((Math.random()-.5)*520,85+Math.random()*115,(Math.random()-.5)*520);
skyStars.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
const starField=new THREE.Points(skyStars,new THREE.PointsMaterial({color:0xe4e8f0,size:1.25,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false}));starField.frustumCulled=false;scene.add(starField);
const streetLights=[];

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

// Warm sodium street lamps along the avenue; no shadow maps keeps the lights inexpensive.
const lampMetal=mat(0x333735),lampBulb=new THREE.MeshStandardMaterial({color:0xffd49a,emissive:0xffa84d,emissiveIntensity:.12,roughness:.35});
for(let x=-220;x<=220;x+=55){
 const pole=new THREE.Group();pole.position.set(x,0,-13.2);scene.add(pole);
 cylinder(pole,0,3.1,0,.12,.16,6.2,lampMetal,8);
 const arm=box(pole,.72,6.05,0,1.55,.12,.14,lampMetal);arm.rotation.z=-.08;
 box(pole,1.35,5.92,0,.62,.16,.5,lampMetal);
 const bulb=box(pole,1.35,5.79,0,.38,.08,.3,lampBulb,false);
 const light=new THREE.PointLight(0xffc47a,0,34,2);light.position.set(x+1.35,5.55,-13.2);light.castShadow=false;scene.add(light);
 streetLights.push({light,bulb});
}

// Additional street lamps around active locations. Their light pools keep sidewalks,
// entrances and parking areas readable instead of illuminating only the central avenue.
const districtLampPositions=[
 [-91,6],[-65,43],[-42,28],[-17,-52],[20,-43],[49,-23],
 [63,48],[91,48],[112,-88],[-169,-68],[-128,-58],[-190,130],
 [145,22],[175,-18],[190,65]
];
for(const [x,z] of districtLampPositions){
 const pole=new THREE.Group();pole.position.set(x,0,z);scene.add(pole);
 cylinder(pole,0,2.65,0,.09,.12,5.3,lampMetal,8);
 const arm=box(pole,.55,5.15,0,1.15,.1,.12,lampMetal);arm.rotation.z=-.08;
 box(pole,1.03,5.02,0,.48,.13,.36,lampMetal);
 const bulb=box(pole,1.03,4.91,0,.3,.07,.24,lampBulb,false);
 const light=new THREE.PointLight(0xffc47a,0,42,1.7);
 light.position.set(x+1.03,4.72,z);light.castShadow=false;scene.add(light);
 streetLights.push({light,bulb});
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
// Dedicated access road connects the restaurant parking lot to the main avenue.
box(scene,150,.008,35,12,.028,70,materials.asphalt,false);
box(scene,143.8,.014,35,1.5,.035,70,materials.sidewalk,false);box(scene,156.2,.014,35,1.5,.035,70,materials.sidewalk,false);
for(let z=4;z<=64;z+=18)box(scene,150,.035,z,.14,.03,7,materials.yellow,false);
box(scene,100,.012,-50,24,.025,10,materials.asphalt,false);
 // Dust road from the remote RV camp to the Route 66 access road.
 const desertTrack=mat(0x927b5d),trackRuts=mat(0x796448),trackEdge=mat(0xa08b6d);
 const trackPoints=[[-190,148],[-180,112],[-160,82],[-145,55],[-145,2]];
 for(let i=0;i<trackPoints.length-1;i++){
  const [ax,az]=trackPoints[i],[bx,bz]=trackPoints[i+1],dx=bx-ax,dz=bz-az,length=Math.hypot(dx,dz),angle=Math.atan2(dx,dz),mx=(ax+bx)/2,mz=(az+bz)/2;
  const road=box(scene,mx,.018,mz,8,.045,length+1,desertTrack,false);road.rotation.y=angle;
  for(const side of [-1,1]){
   const rut=box(scene,mx+Math.cos(angle)*side*1.75,.046,mz-Math.sin(angle)*side*1.75,.24,.025,length,trackRuts,false);rut.rotation.y=angle;
   const shoulder=box(scene,mx+Math.cos(angle)*side*4.25,.027,mz-Math.sin(angle)*side*4.25,.38,.04,length,trackEdge,false);shoulder.rotation.y=angle;
  }
 }
 for(let i=0;i<10;i++){
  const z=142-i*14,x=-190+Math.sin(i*.42)*17;
  for(const side of [-1,1]){const px=x+side*(6.2+Math.sin(i)*.7);cylinder(scene,px,.58,z,.12,.12,1.15,materials.dark,6);box(scene,px,.88,z,.2,.16,.1,materials.yellow,false);}
 }
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
makeFacadeSign(motel,'ROUTE 66 MOTEL',0,7.8,7.35,22,1.8,{bg:'#7b3028',fg:'#fff0c9',accent:'#e5b64e',sub:'VACANCY · FREE WIFI'});
for(const x of [-25,25]){const lamp=box(motel,x,5.4,7.1,.42,.55,.22,mat(0xf0ca78),false);}

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

// High-contrast, physically mounted storefront signs with readable lettering at street level.
function makeFacadeSign(parent,text,x,y,z,width,height,options={}){
 const {bg='#173b35',fg='#fff0c9',accent='#d7b45d',sub='',font='Arial Black'}=options;
 const board=box(parent,x,y,z,width,height,.22,mat(bg),false);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);
 ctx.fillStyle=accent;ctx.fillRect(0,0,1024,13);ctx.fillRect(0,243,1024,13);
 ctx.strokeStyle=fg;ctx.lineWidth=7;ctx.strokeRect(20,20,984,216);
 ctx.textAlign='center';ctx.textBaseline='middle';
 const main=String(text).toUpperCase();let size=main.length>19?66:main.length>13?82:104;
 ctx.font='900 '+size+'px '+font;
 while(ctx.measureText(main).width>900&&size>40){size-=3;ctx.font='900 '+size+'px '+font;}
 ctx.fillStyle=fg;ctx.shadowColor='#0008';ctx.shadowBlur=7;ctx.fillText(main,512,sub?108:132);
 if(sub){ctx.shadowBlur=0;ctx.fillStyle=accent;ctx.font='bold 34px Arial';ctx.fillText(String(sub).toUpperCase(),512,194);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(width*.94,height*.82),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
 face.position.set(x,y,z+.125);parent.add(face);
 for(const side of [-1,1]){const lamp=box(parent,x+side*width*.38,y+height*.66,z+.1,.1,.12,.12,mat(0xe8d49a),false);}
 board.userData.signText=main;return board;
}
function addWallTrim(parent,width,z,y,color=0x765b43){
 const trimMat=mat(color);box(parent,0,y,z,width,.16,.18,trimMat,false);
 box(parent,0,.24,z,width,.2,.2,trimMat,false);
}

// Procedural buildings
function house(x,z,color,scale=1,accent=0x80634c){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const w=12*scale,d=9*scale,h=4.2*scale,front=d/2;
 const stucco=mat(color),trim=mat(accent),roof=mat(0x4b4941);
 box(g,0,h/2,0,w,h,d,stucco);
 box(g,0,h+.12,0,w+.8,.28,d+.8,roof);
 box(g,0,h-.18,front+.08,w+.12,.2,.18,trim);
 box(g,0,.22,front+.08,w+.12,.22,.18,trim);
 for(const wx of [-3.5,3.5]){
  const px=wx*scale;
  box(g,px,2.45*scale,front+.09,1.78*scale,1.58*scale,.12,materials.glass);
  box(g,px,2.45*scale,front+.17,1.9*scale,.12,.13,materials.white);
  box(g,px,1.62*scale,front+.17,1.9*scale,.12,.13,materials.white);
  for(const side of [-1,1])box(g,px+side*.98*scale,2.45*scale,front+.12,.13,1.7*scale,.16,trim);
  box(g,px,2.45*scale,front+.19,.09,1.5*scale,.08,trim,false);
  box(g,px,2.45*scale,front+.19,1.65*scale,.08,.08,trim,false);
  // Short stucco window awning with brackets.
  const awning=box(g,px,3.35*scale,front+.42,2.05*scale,.16,.72,trim);awning.rotation.x=-.08;
  for(const side of [-1,1])box(g,px+side*.82*scale,3.08*scale,front+.34,.08,.48,.08,roof);
 }
 box(g,0,1.15*scale,front+.1,1.48*scale,2.3*scale,.18,materials.rust);
 box(g,0,2.26*scale,front+.2,1.62*scale,.12,.08,trim);
 box(g,.42*scale,1.15*scale,front+.22,.08,.08,.06,mat(0xd2b66d),false);
 // Porch landing, two steps, pillars and warm wall lights.
 box(g,0,.16*scale,front+.75,3.4*scale,.28*scale,1.35*scale,mat(0x8d8577),false);
 for(const step of [0,1])box(g,0,(.08+step*.12)*scale,front+.95+step*.34,2.5*scale,.16*scale,.62*scale,mat(0xaaa08e),false);
 for(const px of [-2.3,2.3])box(g,px*scale,1.8*scale,front+.48,.18*scale,3.5*scale,.22*scale,trim);
 // House number plaque and mailbox make every frontage distinct.
 const number=String(Math.abs(Math.round(x*3+z*2))%900+100);
 box(g,-4.65*scale,3.15*scale,front+.16,.95*scale,.5*scale,.12*scale,roof,false);
 const plaque=document.createElement('canvas');plaque.width=256;plaque.height=128;
 const pc=plaque.getContext('2d');pc.fillStyle='#303a34';pc.fillRect(0,0,256,128);pc.fillStyle='#f0d9a1';pc.font='bold 68px Arial';pc.textAlign='center';pc.textBaseline='middle';pc.fillText(number,128,66);
 const ptex=new THREE.CanvasTexture(plaque);ptex.colorSpace=THREE.SRGBColorSpace;
 const pmesh=new THREE.Mesh(new THREE.PlaneGeometry(.82*scale,.38*scale),new THREE.MeshBasicMaterial({map:ptex,toneMapped:false}));pmesh.position.set(-4.65*scale,3.15*scale,front+.235);g.add(pmesh);
 box(g,4.7*scale,1.05*scale,front+.7,.7*scale,.5*scale,.32*scale,trim);
 box(g,4.7*scale,1.32*scale,front+.7,.78*scale,.08*scale,.36*scale,roof);
 const sconceMat=new THREE.MeshStandardMaterial({color:0xffd59a,emissive:0xffad50,emissiveIntensity:.45});
 for(const px of [-1.25,1.25]){box(g,px,2.2*scale,front+.24,.18*scale,.42*scale,.12*scale,roof);box(g,px,2.2*scale,front+.32,.12*scale,.27*scale,.08*scale,sconceMat,false);}
 return g;
}
house(-30,-38,0xc5b295,1.15);
house(-58,-38,0xd2c5aa,1);
house(8,-44,0xb5a58c,1);
house(42,-42,0xc9bda7,1.1);
house(-70,38,0xb9aa94,.9,0x795b49);
house(70,42,0xd1c1a5,1.1,0x66725d);

// Car wash landmark
const wash=new THREE.Group(); wash.position.set(36,0,28); scene.add(wash);
box(wash,0,2.8,0,29,5.6,18,materials.cream);
box(wash,0,5.7,0,30,.35,19,materials.dark);
box(wash,0,3.8,9.1,20,1.05,.28,materials.teal);
box(wash,0,3.8,9.28,18,.12,.12,materials.white);
for(let x of [-8,-3,3,8]) box(wash,x,1.8,9.22,.22,3.5,.2,materials.dark);
for(let x of [-11,11]) box(wash,x,1.9,9.25,3.2,3.7,.3,materials.glass);
box(wash,0,.12,13,31,.2,8,materials.asphalt);
const sign=box(wash,0,7,0,13,1.4,.3,materials.blue);sign.position.set(0,7,9.8);
makeFacadeSign(wash,'A-1 CAR WASH',0,7,9.98,13,1.4,{bg:'#183b55',fg:'#fff1cc',accent:'#e3b34f',sub:'FULL SERVICE · OPEN DAILY'});
addWallTrim(wash,28,9.18,5.35,0xb5a27c);

// Small diner and convenience store
const diner=new THREE.Group(); diner.position.set(-82,0,22); scene.add(diner);
box(diner,0,2.5,0,24,5,15,materials.white);
box(diner,0,5.1,0,25,.35,16,materials.red);
box(diner,0,3.5,7.6,15,1.1,.25,materials.red);
for(let x of [-8,-3,3,8]) box(diner,x,2.5,7.7,2,2.2,.15,materials.glass);
box(diner,0,.12,13,27,.2,7,materials.asphalt);
// Independent neighborhood diner; Los Pollos has its own full-size restaurant farther east.
box(diner,0,5.42,7.72,23,.28,.32,mat(0x334b55));
makeFacadeSign(diner,'CROSSROADS DINER',0,5.62,7.94,19.5,1.45,{bg:'#24434c',fg:'#fff0c9',accent:'#e5b94f',sub:'COFFEE · PIE · BREAKFAST'});
for(let x=-9;x<=9;x+=3){const stripe=box(diner,x,3.82,8.02,2.9,.48,.3,mat((x/3)%2===0?0xe8dfc7:0xb8332c));stripe.rotation.x=-.12;}
box(diner,0,.28,8.15,4.8,.42,.5,mat(0x403c34));
for(const x of [-10.5,10.5]){box(diner,x,2.7,7.9,.18,4.2,.18,mat(0x5a5144));box(diner,x,4.9,8.02,.35,.35,.3,mat(0xf1cf7a),false);}
makeFacadeSign(diner,'DRIVE THRU',-8.6,1.25,8.05,4.2,.72,{bg:'#263b32',fg:'#fff0c9',accent:'#d4ae57'});

// A warehouse in the distance
const warehouse=new THREE.Group(); warehouse.position.set(100,0,-70); scene.add(warehouse);
box(warehouse,0,5,0,38,10,30,materials.dark);
for(let x of [-12,0,12]) box(warehouse,x,4.2,15.1,8,7,.3,materials.rust);
box(warehouse,0,10.2,0,39,.4,31,materials.rust);
makeFacadeSign(warehouse,'INDUSTRIAL SUPPLY',0,8.65,15.35,25,1.7,{bg:'#313b3a',fg:'#e9e0cb',accent:'#c18a4b',sub:'ALBUQUERQUE · NEW MEXICO'});
for(const x of [-16,16]){box(warehouse,x,1.1,15.25,1.3,2.1,.2,mat(0x5b5549));box(warehouse,x,2.4,15.38,.7,.16,.08,mat(0xd1b36b),false);}

// A full roadside Los Pollos Hermanos restaurant with a dedicated parking apron.
const losPollos=new THREE.Group();losPollos.position.set(150,0,65);scene.add(losPollos);
const polloCream=mat(0xe6d8b8),polloRed=mat(0x9f3028),polloGold=mat(0xd8ad4e);
// Open restaurant shell: floor, four walls and roof leave a real doorway into the dining room.
box(losPollos,0,.14,0,34,.28,22,mat(0xc7b99d),false);
box(losPollos,-16.85,2.85,0,.3,5.42,22,polloCream);
box(losPollos,16.85,2.85,0,.3,5.42,22,polloCream);
box(losPollos,0,2.85,-10.85,34,5.42,.3,polloCream);
for(const [x,w] of [[-15.5,3],[-9,1.8],[-2.65,2.7],[2.65,2.7],[9,1.8],[15.5,3]])box(losPollos,x,2.85,10.85,w,5.42,.3,polloCream);
box(losPollos,0,5.65,0,34,.3,22,polloCream,false);
box(losPollos,0,5.82,0,35,.34,23,polloRed);
box(losPollos,0,5.35,11.25,33,.42,.34,polloRed);
for(const x of [-12,-6,6,12]){
 box(losPollos,x,2.75,11.16,4.2,2.55,.18,materials.glass);
 box(losPollos,x,4.12,11.25,4.35,.12,.22,polloGold);
 box(losPollos,x,1.38,11.27,4.35,.12,.22,polloGold);
}
// Glass double entrance with gold handles and a red portal frame.
for(const x of [-1.92,1.92]){\n  box(losPollos,x,2.15,11.02,1.08,4.05,.09,polloRed,false);\n  box(losPollos,x,2.15,11.17,.98,3.96,.055,materials.glass,false);\n  cylinder(losPollos,x+(x<0?.34:-.34),2.05,11.27,.045,.045,.48,polloGold,8);\n }
box(losPollos,0,4.35,11.15,2.75,.22,.35,polloRed);
box(losPollos,0,.12,11.15,2.75,.24,.35,polloGold);
box(losPollos,0,.13,16,39,.22,11,materials.asphalt,false);
box(losPollos,0,.04,23,44,.08,30,mat(0x8d826e),false);
for(const x of [-15,-7,7,15])for(const z of [18,28])box(losPollos,x,.09,z,5,.04,.14,mat(0xe5dfca),false);
makeFacadeSign(losPollos,'LOS POLLOS HERMANOS',0,6.9,11.65,29,1.75,{bg:'#a12c26',fg:'#fff0ca',accent:'#e6b84d',sub:'FAMILY RESTAURANT · FRESH DAILY'});
for(const x of [-14,14]){
 const post=box(losPollos,x,4.3,11.62,.18,2.1,.18,polloGold);
}
makeFacadeSign(losPollos,'DRIVE THRU',18,1.65,10.95,5.4,.85,{bg:'#253d34',fg:'#fff0c9',accent:'#dfb75b'});
// Dining room: red booths, polished tables, pendant lights, menu boards and service counter.
const polloInterior=mat(0xdbcba9),polloWood=mat(0x6b4934),polloSeat=mat(0x9e3029),polloSteel=mat(0x737c78);
box(losPollos,0,.32,-2.1,31,.12,15,polloInterior,false);
box(losPollos,0,1.18,-9.8,27,1.65,.18,polloWood);
box(losPollos,0,2.12,-9.68,27,.18,.22,polloGold);
box(losPollos,0,1.12,1.6,24,1.45,.42,polloWood);
box(losPollos,0,1.88,1.6,24,.12,.46,polloGold);
for(const x of [-11,-7,7,11]){
 box(losPollos,x,.72,-3.8,3.1,.18,2.1,polloWood);
 for(const side of [-1,1])box(losPollos,x,1.28,-3.8+side*.86,3.1,1.05,.32,polloSeat);
 box(losPollos,x,.83,-3.8,2.7,.12,1.65,polloGold);
}
for(const x of [-8,0,8]){
 cylinder(losPollos,x,4.65,-1.8,.07,.07,1.9,polloGold,8);
 const shade=new THREE.Mesh(new THREE.ConeGeometry(.72,.42,12,1,true),new THREE.MeshStandardMaterial({color:0x8f3027,side:THREE.DoubleSide,roughness:.55}));shade.position.set(x,3.72,-1.8);shade.rotation.x=Math.PI;losPollos.add(shade);
 const bulb=new THREE.PointLight(0xffd39b,.34,8,2);bulb.position.set(x,3.55,-1.8);losPollos.add(bulb);
}
makeFacadeSign(losPollos,'FRESH CHICKEN · FAMILY MEALS',-9,4.55,-10.56,12,.9,{bg:'#263c34',fg:'#fff0c9',accent:'#e2b54f'});
makeFacadeSign(losPollos,'ORDER HERE',0,3.95,1.84,8.5,1.0,{bg:'#a12c26',fg:'#fff0c9',accent:'#e2b54f'});
makeFacadeSign(losPollos,'PICK UP',10,3.95,-9.52,6.2,.9,{bg:'#263c34',fg:'#fff0c9',accent:'#e2b54f'});
// Decorative kitchen pass and display case; no real-world preparation instructions.
box(losPollos,-8,1.35,-7.2,5.2,1.9,2.1,polloSteel);
for(const x of [-9.4,-7.7,-6]){
 box(losPollos,x,2.42,-7.2,1.15,.12,1.5,mat(0x303b3a));
 cylinder(losPollos,x,2.55,-7.2,.48,.48,.1,mat(0x171d1c),12);
}
box(losPollos,8,1.35,-7.2,5.5,1.8,1.8,polloWood);
box(losPollos,8,2.15,-7.2,5.35,.12,1.7,materials.glass);
for(const x of [6.5,8,9.5]){const chicken=new THREE.Mesh(new THREE.SphereGeometry(.36,10,8),mat(0xb97835));chicken.scale.set(1.2,.58,.8);chicken.position.set(x,2.05,-7.15);losPollos.add(chicken);}
const polloFoodTray=new THREE.Group();polloFoodTray.position.set(9,2.36,-7.15);losPollos.add(polloFoodTray);
box(polloFoodTray,0,0,0,1.45,.12,1.05,mat(0xddd5c3),false);
for(const x of [-.38,0,.38]){const piece=new THREE.Mesh(new THREE.SphereGeometry(.24,9,7),mat(0xb97835));piece.scale.set(1.15,.58,.8);piece.position.set(x,.22,0);polloFoodTray.add(piece);}
const polloServeRing=new THREE.Mesh(new THREE.TorusGeometry(1.15,.09,7,28),new THREE.MeshBasicMaterial({color:0xe6bd61,emissive:0x5d4215,transparent:true,opacity:.9}));
polloServeRing.rotation.x=Math.PI/2;polloServeRing.position.set(-11,.16,-4);losPollos.add(polloServeRing);
// Roadside pylon sign, visible from the avenue.
const polloPylon=new THREE.Group();polloPylon.position.set(172,0,49);scene.add(polloPylon);
box(polloPylon,0,3.3,0,.34,6.6,.38,mat(0x5a5142));
box(polloPylon,0,6.2,.16,7.2,2.1,.42,polloRed);
makeFacadeSign(polloPylon,'LOS POLLOS',0,6.25,.4,6.9,1.85,{bg:'#a12c26',fg:'#fff0c9',accent:'#e7bd58',sub:'HERMANOS'});

// Gas station and repair stop on the edge of the highway.
const gasStation=new THREE.Group();gasStation.position.set(78,0,24);scene.add(gasStation);
box(gasStation,0,2.2,0,20,4.4,13,materials.cream);box(gasStation,0,4.55,0,21,.3,14,materials.red);box(gasStation,0,3.25,6.62,13,1.1,.2,materials.blue);
for(const x of [-5,0,5]){box(gasStation,x,.85,11,1.1,1.7,.9,materials.red);box(gasStation,x,1.8,11,.75,.25,.65,materials.white);}
box(gasStation,0,.08,14,27,.16,10,materials.asphalt,false);
makeFacadeSign(gasStation,'MESA PETROLEUM',0,4.1,6.82,14,1.35,{bg:'#1e4658',fg:'#fff0c9',accent:'#e2b34f',sub:'GAS · MARKET · SERVICE'});
for(const x of [-5,0,5])makeFacadeSign(gasStation,'GAS',x,2.55,11.48,1.05,.42,{bg:'#a92f2a',fg:'#fff5d8',accent:'#e9bf55'});

// Parked cars
const vehicleRegistry=[];
function car(x,z,color,rotation=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);vehicleRegistry.push(g);
 const paint=new THREE.MeshPhysicalMaterial({color,roughness:.34,metalness:.48,clearcoat:.38,clearcoatRoughness:.24}),trim=mat(0x272b2a),chrome=mat(0xb6b8b0),rubber=mat(0x202322),lamp=new THREE.MeshStandardMaterial({color:0xffedc9,emissive:0xffd99a,emissiveIntensity:.2,roughness:.2});
 // Sculpted lower body, hood, cabin and rear deck.
 box(g,0,.78,0,2.5,1.12,5,paint);
 box(g,0,1.16,1.62,2.42,.34,1.68,paint);
 box(g,0,1.12,-1.82,2.4,.32,1.18,paint);
 box(g,0,1.57,-.1,1.96,.78,2.82,paint);
 const windshield=box(g,0,1.61,1.08,1.78,.62,.065,materials.glass);windshield.rotation.x=-.26;
 const rear=box(g,0,1.59,-1.55,1.78,.58,.065,materials.glass);rear.rotation.x=.3;
 for(const side of [-1,1]){
  box(g,side*.99,1.56,-.16,.055,.58,1.15,materials.glass);
  box(g,side*.99,1.56,.72,.055,.5,.55,materials.glass);
  box(g,side*.99,1.56,-1.02,.055,.5,.55,materials.glass);
  box(g,side*1.255,.76,-.05,.06,.36,4.45,trim);
  box(g,side*1.27,1.02,-.05,.045,.07,2.7,chrome,false);
  box(g,side*1.18,1.28,.22,.24,.16,.28,trim);
  box(g,side*1.2,1.18,.25,.16,.07,.12,chrome,false);
  for(const wz of [-1.68,1.68]){
   const w=cylinder(g,side*1.22,.49,wz,.47,.47,.3,rubber,16);w.rotation.z=Math.PI/2;
   const hub=cylinder(g,side*1.39,.49,wz,.28,.28,.31,chrome,14);hub.rotation.z=Math.PI/2;
   cylinder(g,side*1.405,.49,wz,.1,.1,.32,trim,12).rotation.z=Math.PI/2;
  }
  box(g,side*1.18,1.13,-.65,.18,.09,.12,chrome,false);
  box(g,side*1.25,1.35,.08,.2,.16,.2,paint);
  // Door shut-lines, flush handles and separate mirror housings.
  for(const seamZ of [-.92,.82])box(g,side*1.258,.91,seamZ,.025,.72,.035,trim,false);
  for(const handleZ of [-.92,.72])box(g,side*1.29,1.12,handleZ,.045,.055,.32,chrome,false);
  const mirror=box(g,side*1.34,1.43,.82,.24,.16,.3,trim);mirror.rotation.z=side*.12;
  box(g,side*1.35,1.43,.82,.12,.09,.2,chrome,false);
  box(g,side*1.258,.88,-.08,.035,.055,3.75,chrome,false);
 }
 // Front grille, chrome bumper, headlamps and rear lamps.
 box(g,0,.7,2.52,1.05,.38,.1,trim);
 box(g,0,.51,2.58,2.28,.17,.16,chrome);
 for(let i=0;i<7;i++)box(g,-.38+i*.127,.7,2.585,.025,.25,.025,chrome,false);
 for(const side of [-1,1]){
  box(g,side*.91,.98,2.55,.42,.3,.08,lamp,false);
  box(g,side*.91,.96,-2.52,.42,.27,.08,mat(0x9e3432),false);
  box(g,side*.8,.98,-2.58,.22,.15,.05,mat(0xe2b66c),false);
 }
 box(g,0,.5,-2.58,2.28,.16,.15,chrome);
 box(g,0,.63,2.64,.72,.2,.045,mat(0xd7d5c8),false);
 box(g,0,.62,-2.66,.72,.2,.045,mat(0xd7d5c8),false);
 // Individually textured New Mexico plates add a small but convincing finish detail.
 const plateCanvas=document.createElement('canvas');plateCanvas.width=512;plateCanvas.height=160;
 const plateCtx=plateCanvas.getContext('2d'),plateGrad=plateCtx.createLinearGradient(0,0,512,160);plateGrad.addColorStop(0,'#f6e7b9');plateGrad.addColorStop(1,'#d5bd83');
 plateCtx.fillStyle=plateGrad;plateCtx.fillRect(0,0,512,160);plateCtx.strokeStyle='#6c5a3c';plateCtx.lineWidth=10;plateCtx.strokeRect(7,7,498,146);
 plateCtx.fillStyle='#a33a2e';plateCtx.font='bold 31px Arial';plateCtx.textAlign='center';plateCtx.fillText('NEW MEXICO',256,42);
 plateCtx.fillStyle='#283d48';plateCtx.font='bold 70px monospace';plateCtx.fillText('ABQ  86',256,116);
 const plateTex=new THREE.CanvasTexture(plateCanvas);plateTex.colorSpace=THREE.SRGBColorSpace;
 const frontPlate=new THREE.Mesh(new THREE.PlaneGeometry(.72,.225),new THREE.MeshBasicMaterial({map:plateTex,toneMapped:false}));frontPlate.position.set(0,.63,2.668);g.add(frontPlate);
 const rearPlate=new THREE.Mesh(new THREE.PlaneGeometry(.72,.225),new THREE.MeshBasicMaterial({map:plateTex,toneMapped:false}));rearPlate.position.set(0,.62,-2.684);rearPlate.rotation.y=Math.PI;g.add(rearPlate);
 box(g,0,1.35,1.78,.045,.018,1.1,chrome,false);
 return g;
}
const playerCar=car(-190,165,0xe8e4d6,0);
// Replace the starter sedan mesh with a classic 1980s Winnebago-style RV.
while(playerCar.children.length)playerCar.remove(playerCar.children[0]);
const rvBody=mat(0xe5e0d1),rvLower=mat(0x777b70),rvGreen=mat(0x4d6856),rvGlass=mat(0x26383b),rvChrome=mat(0xb5b5a7);
box(playerCar,0,1.68,-.18,2.72,2.55,7.55,rvBody);
box(playerCar,0,.48,-.18,2.78,.34,7.58,rvLower);
box(playerCar,0,1.05,-.18,2.79,.23,7.62,rvGreen);
box(playerCar,0,2.93,-.18,2.66,.16,7.42,rvBody);
box(playerCar,0,2.72,3.13,2.58,.72,1.42,rvBody);
box(playerCar,0,2.36,3.88,2.18,.92,.08,rvGlass);
box(playerCar,0,1.98,3.94,2.2,.09,.1,rvChrome);
box(playerCar,0,.88,3.91,1.55,.24,.12,rvChrome);
box(playerCar,-.72,1.35,3.95,.28,.22,.12,materials.yellow);
box(playerCar,.72,1.35,3.95,.28,.22,.12,materials.yellow);
box(playerCar,0,1.52,-3.98,2.25,.5,.08,rvLower);
for(const side of [-1,1]){
 box(playerCar,side*1.372,2.03,-2.35,.045,.92,1.18,rvGlass);
 box(playerCar,side*1.372,2.03,-.48,.045,.92,1.18,rvGlass);
 box(playerCar,side*1.372,2.03,1.42,.045,.92,1.18,rvGlass);
 box(playerCar,side*1.39,1.04,-.15,.035,.12,6.7,rvGreen);
 box(playerCar,side*1.405,1.78,-.15,.035,.12,6.7,rvChrome);
 for(const wz of [-2.65,2.55]){
  const wheel=cylinder(playerCar,side*1.38,.57,wz,.57,.57,.3,materials.dark,14);wheel.rotation.z=Math.PI/2;
  const hub=cylinder(playerCar,side*1.55,.57,wz,.22,.22,.31,rvChrome,12);hub.rotation.z=Math.PI/2;
 }
}
box(playerCar,0,3.08,-.1,1.5,.12,2.2,rvLower);
box(playerCar,0,3.22,-.1,.72,.12,.72,rvChrome);
const rvRoofAntenna=cylinder(playerCar,.72,3.23,-2.8,.035,.035,.55,rvChrome,6);rvRoofAntenna.rotation.z=.2;
box(playerCar,0,.35,-4.0,1.5,.38,.12,rvLower);
playerCar.scale.setScalar(2);
// Distinct RV headlamps illuminate the road after sunset.
const rvHeadlightMaterial=new THREE.MeshStandardMaterial({color:0xfff1c8,emissive:0xffd98a,emissiveIntensity:.15,roughness:.25});
const rvHeadlights=[];
for(const x of [-.78,.78]){
 const lens=box(playerCar,x,1.36,4.03,.34,.22,.08,rvHeadlightMaterial,false);
 const beam=new THREE.PointLight(0xffdca0,0,29,2);beam.position.set(x,1.36,4.03);playerCar.add(beam);rvHeadlights.push({beam,lens});
}
// Walter White's iconic olive-green Pontiac Aztek: split-level body, steep windshield, grey cladding and roof rack.
function pontiacAztek(x,z,rotation=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);vehicleRegistry.push(g);
 const green=new THREE.MeshStandardMaterial({color:0x66734c,roughness:.68,metalness:.22});
 const greenLight=mat(0x78865b),cladding=mat(0x555954),glass=new THREE.MeshStandardMaterial({color:0x24383b,roughness:.2,metalness:.18}),chrome=mat(0xb8b9ae),rubber=mat(0x202322),red=mat(0xb72d35);
 // Low, angular two-piece body and distinctive short sloping hood.
 box(g,0,.78,-.05,2.18,.72,4.55,green);
 box(g,0,.56,-.05,2.28,.42,4.62,cladding);
 box(g,0,1.13,1.34,2.08,.48,1.72,greenLight);
 box(g,0,1.22,-1.38,2.1,.58,1.18,green);
 // Raised cabin with a steep rake at the windshield and a tapered rear roofline.
 box(g,0,1.72,-.32,1.88,.92,2.48,green);
 const windshield=box(g,0,1.76,1.0,1.78,.78,.075,glass);windshield.rotation.x=-.34;
 const rearGlass=box(g,0,1.72,-1.57,1.72,.72,.075,glass);rearGlass.rotation.x=.42;
 for(const side of [-1,1]){
  box(g,side*.954,1.73,-.32,.045,.62,1.02,glass);
  box(g,side*.954,1.73,.56,.045,.57,.55,glass);
  box(g,side*.954,1.73,-1.12,.045,.56,.48,glass);
  box(g,side*1.12,.59,-.05,.07,.32,4.35,cladding);
  box(g,side*1.105,1.1,-.15,.045,.07,2.75,chrome);
  // Characteristic grey wheel-arch trim.
  for(const wz of [-1.48,1.48]){
   const tire=cylinder(g,side*1.08,.52,wz,.48,.48,.22,rubber,16);tire.rotation.z=Math.PI/2;
   const hub=cylinder(g,side*1.205,.52,wz,.25,.25,.24,chrome,12);hub.rotation.z=Math.PI/2;
   const arch=new THREE.Mesh(new THREE.TorusGeometry(.49,.075,7,18,Math.PI),cladding);arch.position.set(side*1.2,.52,wz);arch.rotation.y=Math.PI/2;arch.rotation.z=Math.PI;g.add(arch);
  }
  box(g,side*1.12,1.03,2.12,.2,.18,.1,mat(0xe8dfc2));
  box(g,side*1.12,1.03,-2.31,.2,.2,.1,mat(0x9d3434));
  box(g,side*1.11,1.25,-.05,.045,.12,.5,greenLight);
 }
 // Pontiac split grille, chrome surround and the red arrowhead marque.
 box(g,0,.91,2.34,1.16,.34,.12,cladding);
 box(g,0,.91,2.415,.92,.19,.025,mat(0x252a29));
 for(let i=0;i<5;i++)box(g,-.35+i*.175,.91,2.435,.025,.14,.018,chrome,false);
 const badgeShape=new THREE.Shape();badgeShape.moveTo(0,.13);badgeShape.lineTo(-.105,-.08);badgeShape.lineTo(.105,-.08);badgeShape.closePath();
 const badge=new THREE.Mesh(new THREE.ShapeGeometry(badgeShape),red);badge.position.set(0,1.12,2.45);g.add(badge);
 box(g,0,.72,2.42,.44,.045,.025,chrome);
 box(g,0,.7,-2.34,1.25,.2,.1,cladding);
 // Roof rails and compact luggage rack, a signature silhouette detail.
 for(const side of [-1,1]){
  const rail=box(g,side*.68,2.22,-.35,.07,.08,2.45,cladding);rail.rotation.x=0;
  box(g,side*.68,2.22,.82,.08,.07,.18,chrome);
  box(g,side*.68,2.22,-1.52,.08,.07,.18,chrome);
 }
 box(g,0,2.22,-.35,1.4,.06,.08,chrome);
 // Subtle rear spoiler and roof step.
 box(g,0,2.02,-1.88,1.72,.11,.28,cladding);
 return g;
}
const pontiacAztekRoot=pontiacAztek(19,15,-.4);
car(-104,35,0x6e777c,.2); car(51,-20,0x9a483b,-.2);
const patrolCar=car(98,23,0x30383d,0);const patrolRed=box(patrolCar,-.38,2.18,0,.42,.16,.32,mat(0xd94d43));const patrolBlue=box(patrolCar,.38,2.18,0,.42,.16,.32,mat(0x4b86d8));
const trafficCars=[
 {root:car(-210,-4,0x87918d,Math.PI/2),direction:1,speed:12},
 {root:car(-55,4,0x8d594d,-Math.PI/2),direction:-1,speed:10},
 {root:car(135,-4,0xc6c1b2,Math.PI/2),direction:1,speed:14},
 {root:car(230,4,0x596d7a,-Math.PI/2),direction:-1,speed:11}
];
let driving=false,driveSpeed=0,crashCooldown=0,fuel=100;
const movingVehicleRoots=trafficCars.map(t=>t.root);
const parkedDriveables=vehicleRegistry.filter(v=>v!==playerCar&&v!==patrolCar&&!movingVehicleRoots.includes(v));
let currentVehicle=playerCar;
const buildingBlockers=[
 // One authoritative footprint per building; vehicle and pedestrian systems share this registry.
 {x:-30,z:-38,halfX:6.9,halfZ:5.18,pedX:8.2,pedZ:6.5},{x:-58,z:-38,halfX:6,halfZ:4.5,pedX:7.5,pedZ:6},
 {x:8,z:-44,halfX:6,halfZ:4.5,pedX:7.5,pedZ:6},{x:42,z:-42,halfX:6.6,halfZ:4.95,pedX:8,pedZ:6.5},
 {x:-70,z:38,halfX:5.4,halfZ:4.05,pedX:7,pedZ:5.5},{x:70,z:42,halfX:6.6,halfZ:4.95,pedX:8,pedZ:6.5},
 {x:36,z:28,halfX:14.5,halfZ:9,pedX:15.5,pedZ:9.7},{x:-82,z:22,halfX:12,halfZ:7.5,pedX:13,pedZ:8.5},
 // Removed full-building blocker; segmented wall blockers preserve the entrance.

 {x:100,z:-70,halfX:19,halfZ:15,pedX:20,pedZ:16},{x:78,z:24,halfX:10,halfZ:6.5,pedX:10,pedZ:7},
 {x:-145,z:-76,halfX:28,halfZ:6.5,pedX:28.5,pedZ:7.5},
 // Los Pollos wall footprints leave a central pedestrian doorway open.
 {x:133.15,z:65,halfX:.25,halfZ:11,pedX:.7,pedZ:11.4},{x:166.85,z:65,halfX:.25,halfZ:11,pedX:.7,pedZ:11.4},
 {x:150,z:54.15,halfX:17,halfZ:.25,pedX:17.3,pedZ:.7},
 ...[-15.5,-9,-2.65,2.65,9,15.5].map((x,i)=>({x:150+x,z:75.85,halfX:i===0||i===5?1.5:i===1||i===4?.9:1.35,halfZ:.2,pedX:i===0||i===5?1.7:i===1||i===4?1.1:1.55,pedZ:.65})),
 ...[-12,-6,6,12].map(x=>({x:150+x,z:76.05,halfX:2.1,halfZ:.22,pedX:2.25,pedZ:.55}))
];
const vehicleBlockers=buildingBlockers.map(({x,z,halfX,halfZ})=>({x,z,halfX,halfZ}));
vehicleBlockers.push({x:73,z:35,halfX:.8,halfZ:.8},{x:78,z:35,halfX:.8,halfZ:.8},{x:83,z:35,halfX:.8,halfZ:.8});
function addParkedCarBlocker(x,z,rotation){
 const c=Math.abs(Math.cos(rotation)),s=Math.abs(Math.sin(rotation));
 vehicleBlockers.push({x,z,halfX:1.45*c+2.65*s,halfZ:1.45*s+2.65*c});
}
const VEHICLE_COLLISION_MARGIN=.28;
// Oriented vehicle rectangle vs axis-aligned building rectangle (SAT).
// Unlike the old 8.35m RV circle, this tests the actual vehicle footprint and heading.
function vehicleOverlapsBox(position,b,vehicleRoot=null,rotation=vehicleRoot?.rotation.y||0){
 const isRV=vehicleRoot===playerCar,halfWidth=isRV?2.85:1.58,halfLength=isRV?7.85:2.88;
 const c=Math.cos(rotation),s=Math.sin(rotation),dx=b.x-position.x,dz=b.z-position.z;
 const axes=[[c,-s],[s,c],[1,0],[0,1]];
 for(const [ax,az] of axes){
  const vehicleRadius=halfWidth*Math.abs(ax*c-az*s)+halfLength*Math.abs(ax*s+az*c);
  const obstacleRadius=b.halfX*Math.abs(ax)+b.halfZ*Math.abs(az);
  if(Math.abs(dx*ax+dz*az)>vehicleRadius+obstacleRadius+VEHICLE_COLLISION_MARGIN)return false;
 }
 return true;
}
function vehicleOverlapsPedestrian(position,rotation,npc,vehicleRoot=null){
 const dx=npc.root.position.x-position.x,dz=npc.root.position.z-position.z;
 const isRV=vehicleRoot===playerCar;
 if(dx*dx+dz*dz>(isRV?144:36))return false;
 const c=Math.cos(rotation),s=Math.sin(rotation);
 const localX=dx*c-dz*s,localZ=dx*s+dz*c;
 const halfWidth=isRV?2.85:1.58,halfLength=isRV?7.85:3.95;
 const nearestX=THREE.MathUtils.clamp(localX,-halfWidth,halfWidth),nearestZ=THREE.MathUtils.clamp(localZ,-halfLength,halfLength);
 const side=localX-nearestX,front=localZ-nearestZ;
 return side*side+front*front<1.35*1.35;
}
function pedestrianBlockedByAnyVehicle(x,z){
 const probe={root:{position:new THREE.Vector3(x,0,z)}};
 return vehicleRegistry.some(vehicle=>vehicleOverlapsPedestrian(vehicle.position,vehicle.rotation.y,probe,vehicle));
}
function separatePedestriansFromAllVehicles(){
 for(const npc of allPedestrianActors){
  if(!npc.root.visible)continue;
  for(const vehicle of vehicleRegistry){
   if(!vehicleOverlapsPedestrian(vehicle.position,vehicle.rotation.y,npc,vehicle))continue;
   const dx=npc.root.position.x-vehicle.position.x,dz=npc.root.position.z-vehicle.position.z;
   const c=Math.cos(vehicle.rotation.y),s=Math.sin(vehicle.rotation.y);
   const lx=dx*c+dz*s,lz=-dx*s+dz*c;
   const halfWidth=vehicle===playerCar?2.75:1.48,halfLength=vehicle===playerCar?7.7:2.72;
   const px=THREE.MathUtils.clamp(lx,-halfWidth,halfWidth),pz=THREE.MathUtils.clamp(lz,-halfLength,halfLength);
   let nx=lx-px,nz=lz-pz,len=Math.hypot(nx,nz);
   if(len<.001){nx=1;nz=0;len=1;}
   const push=.86/len,outX=lx+nx*push,outZ=lz+nz*push;
   const candidateX=vehicle.position.x+outX*c+outZ*s,candidateZ=vehicle.position.z-outX*s+outZ*c;
   if(!pedestrianBlockedByWorld(candidateX,candidateZ)&&!pedestrianBlockedByCrowd(candidateX,candidateZ,npc)){npc.root.position.x=candidateX;npc.root.position.z=candidateZ;}
  }
 }
}
function pedestrianBlockedByWorld(x,z){
 // Keep the whole pedestrian body clear of every building footprint.
 return walkObstacles.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx+.62&&Math.abs(z-oz)<rz+.62);
}
function pedestrianBlockedByCrowd(x,z,npc){
 return pedestrianActors.some(other=>other!==npc&&other.root.visible&&Math.hypot(x-other.root.position.x,z-other.root.position.z)<.92);
}
function movePedestrianSafely(npc,x,z){
 const blocked=(px,pz)=>pedestrianBlockedByWorld(px,pz)||pedestrianBlockedByAnyVehicle(px,pz)||pedestrianBlockedByCrowd(px,pz,npc);
 const dx=x-npc.root.position.x,dz=z-npc.root.position.z,distance=Math.hypot(dx,dz);
 if(distance<.0001)return false;
 // Advance in short swept steps; do not teleport sideways when an obstacle is reached.
 const steps=Math.max(1,Math.ceil(distance/.22)),startX=npc.root.position.x,startZ=npc.root.position.z;
 let moved=false;
 for(let i=1;i<=steps;i++){
  const t=i/steps,px=startX+dx*t,pz=startZ+dz*t;
  if(blocked(px,pz))break;
  npc.root.position.x=px;npc.root.position.z=pz;moved=true;
 }
 return moved;
}
function vehicleOverlapsVehicle(position,rotation,otherRoot,movingRoot=null){
 const dx=otherRoot.position.x-position.x,dz=otherRoot.position.z-position.z;
 if(dx*dx+dz*dz>400)return false;
 const cA=Math.cos(rotation),sA=Math.sin(rotation),cB=Math.cos(otherRoot.rotation.y),sB=Math.sin(otherRoot.rotation.y);
 const axes=[[cA,-sA],[sA,cA],[cB,-sB],[sB,cB]];
 const isRV_A=movingRoot===playerCar,isRV_B=otherRoot===playerCar;
 const wA=isRV_A?2.85:1.58,lA=isRV_A?7.85:2.88,wB=isRV_B?2.85:1.58,lB=isRV_B?7.85:2.88;
 for(const [ax,az] of axes){
  const radiusA=wA*Math.abs(ax*cA-az*sA)+lA*Math.abs(ax*sA+az*cA);
  const radiusB=wB*Math.abs(ax*cB-az*sB)+lB*Math.abs(ax*sB+az*cB);
  if(Math.abs(dx*ax+dz*az)>radiusA+radiusB+.32)return false;
 }
 return true;
}
function vehiclePathHitsPedestrian(from,to,rotation,vehicleRoot=null){
 const start=from?.isVector3?from:new THREE.Vector3(Number(from?.x)||0,0,Number(from?.z)||0);
 const end=to?.isVector3?to:new THREE.Vector3(Number(to?.x)||0,0,Number(to?.z)||0);
 const distance=Math.hypot(end.x-start.x,end.z-start.z);
 const steps=Math.max(1,Math.ceil(distance/.10));
 for(let step=0;step<=steps;step++){
  const sample=start.clone().lerp(end,step/steps);
  for(const pedestrian of allPedestrianActors){
   if(pedestrian.root.visible&&vehicleOverlapsPedestrian(sample,rotation,pedestrian,vehicleRoot))return true;
  }
 }
 return false;
}
function vehicleCollisionAt(position,rotation,ignoreRoot=null){
 if(!movingVehicleRoots.includes(ignoreRoot)&&(position.x< -239||position.x>239||position.z< -229||position.z>229))return 'city boundary';
 for(const b of vehicleBlockers)if(vehicleOverlapsBox(position,b,ignoreRoot,rotation))return 'building';
 for(const other of vehicleRegistry){if(other===ignoreRoot)continue;if(vehicleOverlapsVehicle(position,rotation,other,ignoreRoot))return 'another vehicle';}
 for(const pedestrian of allPedestrianActors)if(pedestrian.root.visible&&vehicleOverlapsPedestrian(position,rotation,pedestrian,ignoreRoot))return 'pedestrian';
 return '';
}

// Walter White-inspired player model: shaved head, wire-frame glasses, goatee and beige jacket.
const player=new THREE.Group(); scene.add(player);
const body=new THREE.Group(); player.add(body);
const skinMat=mat(0xc49a78),jacketMat=mat(0xb5a17d),shirtMat=mat(0xd7d5c8),pantsMat=mat(0x77735e),glassMat=mat(0x242b2b);
cylinder(body,0,1.35,0,.43,.5,1.05,jacketMat,10);
box(body,0,1.39,.255,.34,.72,.035,shirtMat,false);
for(const side of [-1,1]){
 box(body,side*.16,1.73,.27,.19,.24,.045,jacketMat,false);
 box(body,side*.2,.08,.12,.34,.16,.55,materials.shoe);
}
const head=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),skinMat);
head.position.y=2.12;head.castShadow=true;body.add(head);
cylinder(body,0,1.84,0,.13,.13,.28,skinMat,8);
// Clean-shaven scalp with a subtle close-cropped rim; no full hair cap.
const scalp=new THREE.Mesh(new THREE.SphereGeometry(.343,16,10,0,Math.PI*2,0,Math.PI/2),mat(0x9c806a));
scalp.position.y=2.275;body.add(scalp);
for(const side of [-1,1]){
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),materials.eyeWhite);eye.position.set(side*.115,2.16,.302);body.add(eye);
 const pupil=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),materials.pupil);pupil.position.set(side*.115,2.16,.343);body.add(pupil);
 // Distinctive rectangular glasses, bridge and temples.
 box(body,side*.115,2.16,.366,.205,.145,.035,glassMat,false);
 box(body,side*.115,2.225,.39,.205,.025,.025,glassMat,false);
 box(body,side*.115,2.095,.39,.205,.025,.025,glassMat,false);
 box(body,side*.215,2.16,.39,.025,.155,.025,glassMat,false);
 box(body,side*.015,2.16,.39,.025,.155,.025,glassMat,false);
 box(body,side*.225,2.16,.335,.09,.025,.025,glassMat,false);
 const ear=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),skinMat);ear.position.set(side*.326,2.1,0);body.add(ear);
}
box(body,0,2.16,.367,.045,.035,.035,glassMat,false);
const nose=new THREE.Mesh(new THREE.ConeGeometry(.065,.13,6),skinMat);nose.position.set(0,2.08,.34);nose.rotation.x=Math.PI/2;body.add(nose);
// Short dark goatee and moustache.
const beard=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),mat(0x35322e));beard.scale.set(1,.58,.42);beard.position.set(0,1.91,.285);body.add(beard);
box(body,0,2.005,.32,.22,.045,.07,glassMat,false);
const playerArms=[],playerLegs=[];
for(const side of [-1,1]){
 const armPivot=new THREE.Group();armPivot.position.set(side*.48,1.72,0);body.add(armPivot);
 cylinder(armPivot,0,-.4,0,.14,.17,.82,jacketMat,10);armPivot.rotation.z=side*.12;
 box(armPivot,0,-.72,.015,.29,.12,.29,mat(0x625b4b),false);
 const hand=new THREE.Mesh(new THREE.SphereGeometry(.115,10,8),skinMat);hand.position.set(0,-.86,.025);armPivot.add(hand);playerArms.push(armPivot);
 const legPivot=new THREE.Group();legPivot.position.set(side*.2,.78,0);body.add(legPivot);
 cylinder(legPivot,0,-.36,0,.16,.19,.72,pantsMat,10);
 box(legPivot,0,-.72,.12,.36,.17,.58,materials.shoe);
 playerLegs.push(legPivot);
}
// Tailored lapels, collar, buttons, belt and jacket pockets.
for(const side of [-1,1]){
 const lapel=box(body,side*.16,1.58,.31,.18,.48,.08,mat(0xc8b58f),false);lapel.rotation.z=side*.2;
 box(body,side*.19,1.05,.2,.34,.13,.06,mat(0x4c4b40),false);
 box(body,side*.19,1.46,.31,.25,.22,.055,mat(0x9c896b),false);
}
box(body,0,1.79,.3,.36,.12,.09,shirtMat,false);
for(const y of [1.55,1.35,1.15])cylinder(body,0,y,.31,.025,.025,.025,mat(0x343a36),8);
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
 }
 const nose=new THREE.Mesh(new THREE.ConeGeometry(.055,.12,6),faceSkin);nose.position.set(0,2.08,.31);nose.rotation.x=Math.PI/2;root.add(nose);
 // Limb pivots are placed at real shoulder/hip joints so walking swings the legs
 // instead of rotating whole cylinders around the character's feet.
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const armPivot=new THREE.Group();armPivot.position.set(side*.43,1.72,0);root.add(armPivot);
  const arm=cylinder(armPivot,0,-.39,0,.13,.16,.78,mat(shirt),8);arm.rotation.z=side*.12;
  box(armPivot,0,-.7,.015,.28,.12,.27,mat(0x4a4942),false);
  const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,9,7),faceSkin);hand.position.set(0,-.82,.025);armPivot.add(hand);arms.push(armPivot);
  const legPivot=new THREE.Group();legPivot.position.set(side*.19,.78,0);root.add(legPivot);
  cylinder(legPivot,0,-.375,0,.15,.18,.75,mat(pants),8);
  box(legPivot,0,-.72,.12,.32,.15,.5,materials.shoe);
  box(legPivot,0,-.39,.095,.3,.1,.2,mat(0x383a37),false);
  legs.push(legPivot);
 }
 // Clothing seams, collar, placket, pockets, cuffs and hem give each NPC a tailored silhouette.
 const shirtMat=mat(0xe0d7c4),darkCloth=mat(0x343a35),seamMat=mat(0x8b8371);
 box(root,0,1.86,.315,.23,.16,.08,shirtMat,false);
 box(root,0,1.39,.435,.045,.64,.035,darkCloth,false);
 for(const y of [1.56,1.38,1.2])cylinder(root,0,y,.46,.025,.025,.025,mat(0xc9b98e),8);
 box(root,0,.82,.015,.58,.1,.56,darkCloth,false);
 for(const side of [-1,1]){
  box(root,side*.22,1.45,.39,.24,.28,.06,mat(0x77736a),false);
  box(root,side*.45,1.02,0,.31,.12,.28,mat(0x4a4a43),false);
  box(root,side*.22,1.78,.28,.25,.09,.1,seamMat,false);
 }
 // Facial planes, brows, eyelids and a mouth line avoid blank mannequin faces.
 const faceStubble=mat(0x4b4138),mouthMat=mat(0x694c42);
 for(const side of [-1,1]){
  box(root,side*.105,2.22,.29,.13,.035,.045,faceStubble,false);
  box(root,side*.105,2.105,.316,.075,.018,.018,faceStubble,false);
 }
 box(root,0,1.99,.306,.13,.025,.025,mouthMat,false);
 for(const side of [-1,1])box(root,side*.27,2.19,.015,.075,.22,.12,mat(0x3c3934),false);
 return {root,phase:Math.random()*6,arms,legs,walkPhase:Math.random()*Math.PI*2};
}
// Gustavo Fring: neat receding hair, narrow glasses, moustache, pale yellow shirt and dark tie.
const gusNPC=makeNPC(150,61.5,0xe4d28e,0x343a43,0x9b765d);
const genericCap=gusNPC.root.children.find(o=>o.geometry?.type==='SphereGeometry'&&Math.abs(o.position.y-2.27)<.02);if(genericCap)genericCap.visible=false;
const gusHair=mat(0x252522),gusTie=mat(0x252a2b),gusFrame=mat(0x282c2b),gusMoustache=mat(0x40352d);
for(const side of [-1,1]){
 const temple=new THREE.Mesh(new THREE.SphereGeometry(.13,9,7),gusHair);temple.position.set(side*.255,2.2,-.01);temple.scale.set(.75,1.35,1);gusNPC.root.add(temple);
 const lens=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,6,16),gusFrame);lens.position.set(side*.105,2.15,.322);gusNPC.root.add(lens);
 const glass=new THREE.Mesh(new THREE.CircleGeometry(.092,16),new THREE.MeshBasicMaterial({color:0x82918b,transparent:true,opacity:.24}));glass.position.set(side*.105,2.15,.321);gusNPC.root.add(glass);
 box(gusNPC.root,side*.1,1.99,.315,.13,.035,.07,gusMoustache,false);
}
box(gusNPC.root,0,2.15,.322,.12,.025,.035,gusFrame,false);
const tie=new THREE.Mesh(new THREE.ConeGeometry(.11,.72,4),gusTie);tie.position.set(0,1.43,.38);tie.rotation.x=Math.PI;gusNPC.root.add(tie);
box(gusNPC.root,0,1.77,.37,.28,.1,.08,mat(0xf0e6c7),false);
box(gusNPC.root,0,1.03,.42,.48,.1,.08,mat(0x393d3b),false);
for(const y of [1.58,1.4,1.22])cylinder(gusNPC.root,.12,y,.43,.025,.025,.025,mat(0x6e634b),8);
const jesseNPC=makeNPC(28,43,0x6f8069,0x343c3c);jesseNPC.root.rotation.y=-.35;
const dinerNPC=makeNPC(-82,32,0x8b6555,0x343a43);dinerNPC.root.rotation.y=Math.PI;
const warehouseNPC=makeNPC(100,-48,0x887b63,0x343a43);warehouseNPC.root.rotation.y=Math.PI;
const policeNPC=makeNPC(96,30,0x344e6b,0x242b32);policeNPC.root.rotation.y=Math.PI;
const gasContactNPC=makeNPC(92,42,0x57445e,0x30323c,0x9d7358);gasContactNPC.root.rotation.y=Math.PI;
const motelNPC=makeNPC(-132,-65,0x6d5a48,0x343a43,0xb58b6b);motelNPC.root.rotation.y=Math.PI;
const ambientNPCs=[makeNPC(-108,-28,0x697a70,0x343a43),makeNPC(4,24,0x8a6e57,0x343a43),makeNPC(62,-92,0x6d7180,0x343a43)];
ambientNPCs.forEach((npc,i)=>{npc.home=npc.root.position.clone();npc.wanderPhase=i*2.15;});
const witnessNPC=makeNPC(-97,34,0x8a7462,0x343a43,0xb98e6e);
const courierNPC=makeNPC(-64,31,0x6d5146,0x292f38,0x9b745b);
const driverNPC=makeNPC(102,42,0x4f6970,0x303841,0x9b745b);
const motelClerkNPC=makeNPC(-137,-66,0x70634f,0x343a43,0xb98e6e);
const warehouseArchivistNPC=makeNPC(108,-51,0x706b58,0x343a43,0x9c775d);
const polloStaffNPC=makeNPC(158,62,0xb9c8b0,0x333b39,0x986f57);polloStaffNPC.root.rotation.y=0;
const pedestrianActors=[jesseNPC,dinerNPC,warehouseNPC,policeNPC,gasContactNPC,motelNPC,...ambientNPCs,witnessNPC,courierNPC,driverNPC,motelClerkNPC,warehouseArchivistNPC,gusNPC,polloStaffNPC];
const allPedestrianActors=[{root:player},...pedestrianActors];

const locations=[
 {name:'A-1 CAR WASH',label:'THE CAR WASH',pos:new THREE.Vector3(36,0,43),range:13,type:'mission'},
 {name:'DINER',label:'THE DINER',pos:new THREE.Vector3(-82,0,32),range:15,type:'talk'},
 {name:'DESERT WAREHOUSE',label:'THE WAREHOUSE',pos:new THREE.Vector3(100,0,-50),range:15,type:'warehouse'},
 {name:'GAS STATION',label:'THE GAS STATION',pos:new THREE.Vector3(78,0,38),range:14,type:'gas'},
 {name:'POLICE PATROL',label:'TALK TO THE OFFICER',pos:new THREE.Vector3(96,0,30),range:9,type:'police'},
 {name:'ROUTE 66 MOTEL',label:'THE ROUTE 66 MOTEL',pos:new THREE.Vector3(-132,0,-65),range:13,type:'motel'},
 {name:'LOS POLLOS HERMANOS',label:'LOS POLLOS HERMANOS',pos:new THREE.Vector3(150,0,65),range:20,type:'pollo'}
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
// Shared 20-minute cycle: 16 minutes of daylight, then a short golden-hour dusk. Night is removed.
 function synchronizedGameClock(){
  const cycleSeconds=1200,phase=((Date.now()/1000)%cycleSeconds+cycleSeconds)%cycleSeconds;
  if(phase<960)return 6+(phase/960)*12;
  return 18+((phase-960)/240)*2;
 }
 gameClock=synchronizedGameClock();

 // Remote desert camp: physical scenery and an animated, fictional work area.
 const desertCamp=new THREE.Group();desertCamp.position.set(-190,0,165);scene.add(desertCamp);
 const campDirt=mat(0x8e795d),campDark=mat(0x45433b),campMetal=mat(0x626b68),campCanvas=mat(0x6e7569),campWood=mat(0x79634a);
 box(desertCamp,0,.015,0,66,.035,52,campDirt,false);
 box(desertCamp,-12,.025,-15,8,.025,46,mat(0x77664f),false);
 box(desertCamp,-20,.03,-8,1.2,.03,28,mat(0x9b8667),false);
 box(desertCamp,-4,.03,-8,1.2,.03,28,mat(0x9b8667),false);
 // Canvas shade and support poles.
 for(const x of [4.5,14.5])for(const z of [-5,5])cylinder(desertCamp,x,2.5,z,.09,.09,5,campMetal,8);
 box(desertCamp,9.5,5,0,14,.18,12,campCanvas,false);
 box(desertCamp,9.5,4.88,0,14,.06,12,mat(0x8d927d),false);
 // Workbench and stylized, sealed fictional apparatus (no real-world process).
 box(desertCamp,9.5,1.15,1.2,5.8,.22,2.1,campWood);
 for(const x of [7,12])for(const z of [.55,1.85])box(desertCamp,x,.52,z,.16,1.05,.16,campDark);
 const cookMachine=new THREE.Group();cookMachine.position.set(9.5,1.35,1.2);desertCamp.add(cookMachine);
 box(cookMachine,0,.45,0,1.8,.95,1.25,campMetal);
 box(cookMachine,0,1.02,.02,1.45,.12,1.02,campDark);
 const cookGlow=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),new THREE.MeshBasicMaterial({color:0x58c7d5,transparent:true,opacity:.18}));
 cookGlow.position.set(0,1.2,.05);cookMachine.add(cookGlow);
 for(let i=0;i<3;i++){const dial=new THREE.Mesh(new THREE.CircleGeometry(.12,16),new THREE.MeshBasicMaterial({color:i===1?0x9eae79:0x8b9b9a}));dial.position.set(-.48+i*.48,.55,.64);cookMachine.add(dial);}
 const sealedPackage=box(desertCamp,13,.55,2.3,1.05,1.05,1.05,mat(0x9b8a6b));sealedPackage.visible=false;
const rvCargo=box(playerCar,0,3.36,-2.3,1.1,.2,1.15,rvLower);rvCargo.visible=false;
const rvCargoStrap=box(playerCar,0,3.47,-2.3,.12,.08,1.2,rvChrome);rvCargoStrap.visible=false;
 for(const [x,z] of [[2,3],[16,3],[2,-4],[16,-4]])box(desertCamp,x,.62,z,1.8,1.2,1.8,campWood);
 for(const [x,z] of [[0,6],[18,7]]){cylinder(desertCamp,x,.72,z,.55,.55,1.45,campMetal,12);cylinder(desertCamp,x,.12,z,.58,.58,.12,campDark,12);}
 const campChair=new THREE.Group();campChair.position.set(15,0,5);desertCamp.add(campChair);
 box(campChair,0,.72,0,1.2,.12,1,campCanvas);box(campChair,0,.38,.38,1.15,.1,.12,campMetal);
 for(const x of [-.5,.5])for(const z of [-.35,.35])box(campChair,x,.34,z,.07,.68,.07,campMetal);
 const campLight=new THREE.PointLight(0xd4b77b,0,18);campLight.position.set(9.5,4.5,0);desertCamp.add(campLight);
 const vaporPuffs=[];
 for(let i=0;i<4;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.22+i*.035,10,8),new THREE.MeshBasicMaterial({color:0xc9d2cb,transparent:true,opacity:0}));puff.position.set(9.5,2.2+i*.38,1.2);desertCamp.add(puff);vaporPuffs.push(puff);}

 // Low red-rock mesas frame the isolated clearing; sparse desert plants break up the horizon.
 for(const [x,z,r,h,color] of [[-30,47,18,22,0x8e7964],[-5,55,22,28,0x9a8069],[28,49,16,19,0x88735e]]){const mesa=new THREE.Mesh(new THREE.ConeGeometry(r,h,5),mat(color));mesa.position.set(x,h/2-1,z);mesa.rotation.y=.3;desertCamp.add(mesa);}
 for(const [x,z] of [[-26,-15],[-23,14],[25,-18],[26,16],[-15,23],[17,24]]){cylinder(desertCamp,x,.9,z,.32,.42,1.8,materials.cactus,7);box(desertCamp,x+.36,1,z,.2,.9,.2,materials.cactus);box(desertCamp,x+.26,1.35,z,.35,.18,.2,materials.cactus);}
 worldLabel('DESERT COOK SITE',-187,147,'#d7c29a');

let active=null,cash=Number.isFinite(saved.cash)?saved.cash:7300,missionStep=Number.isFinite(saved.missionStep)?saved.missionStep:0,dialogOpen=false,mapOpen=false,carWashShiftDone=!!saved.carWashShiftDone,localsTalked=Array.isArray(saved.localsTalked)?saved.localsTalked:[],polloState=['idle','preparing','ready','carried','served'].includes(saved.polloState)?saved.polloState:'idle',polloDeadline=Number.isFinite(saved.polloDeadline)?saved.polloDeadline:0,cookState=['idle','cooking','ready','loaded','sold'].includes(saved.cookState)?saved.cookState:'idle',cookProgress=Number.isFinite(saved.cookProgress)?THREE.MathUtils.clamp(saved.cookProgress,0,1):0,customWaypoint=Number.isFinite(saved.waypointX)&&Number.isFinite(saved.waypointZ)?new THREE.Vector3(saved.waypointX,0,saved.waypointZ):null;
let cookPrep=Array.isArray(saved.cookPrep)?[0,1,2].map(i=>!!saved.cookPrep[i]):[false,false,false];
const cookWorkPos=new THREE.Vector3(-180.5,0,166.2);
const cookPackagePos=new THREE.Vector3(-177,0,167.3);
const cookStationSpecs=[
 {id:'power',label:'RESTORE CAMP POWER',x:-17,z:-11,color:0xd5a54d},
 {id:'calibration',label:'CALIBRATE CONTROL PANEL',x:22,z:-11,color:0x70b7bd},
 {id:'seal',label:'PREPARE THE SEALED CASE',x:22,z:15,color:0xbca26c}
];
const cookStations=cookStationSpecs.map((spec,index)=>{
 const root=new THREE.Group();root.position.set(spec.x,0,spec.z);desertCamp.add(root);
 box(root,0,.66,0,2.4,1.3,1.8,campDark);
 if(index===0){
  box(root,0,1.47,0,1.9,.35,1.45,campMetal);
  for(let i=0;i<5;i++)box(root,-.72+i*.36,1.5,.74,.2,.12,.06,materials.yellow,false);
  const switchBox=box(root,.75,1.18,.96,.28,.32,.12,mat(0x9b493d));switchBox.rotation.x=-.12;
  cylinder(root,-.72,1.63,-.15,.24,.24,.12,mat(0x303a37),12);
 }else if(index===1){
  box(root,0,1.48,0,2.1,.34,1.4,campMetal);
  box(root,0,2.0,.05,1.55,.78,.12,mat(0x253537));
  box(root,0,2.0,.125,1.25,.52,.035,mat(0x5b9e9c),false);
  for(let i=0;i<3;i++)cylinder(root,-.62+i*.62,1.05,.78,.18,.18,.16,mat(0xc2b27e),10);
 }else{
  box(root,0,1.35,0,2.25,.25,1.55,campWood);
  box(root,0,1.83,-.12,1.4,.72,1.12,mat(0x9c8c6c));
  for(const x of [-.52,.52])box(root,x,2.22,-.12,.14,.08,1.2,campMetal);
  box(root,0,2.24,.45,.48,.12,.12,materials.yellow,false);
 }
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.72,.075,7,28),new THREE.MeshBasicMaterial({color:spec.color}));
 ring.rotation.x=Math.PI/2;ring.position.y=.12;root.add(ring);
 const marker=new THREE.Mesh(new THREE.ConeGeometry(.28,.78,7),new THREE.MeshBasicMaterial({color:spec.color}));marker.position.y=2.85;root.add(marker);
 const doneLamp=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),new THREE.MeshBasicMaterial({color:0x8dc39a,emissive:0x264b2c}));
 doneLamp.position.set(0,2.42,0);doneLamp.visible=false;root.add(doneLamp);
 return {...spec,index,root,ring,marker,doneLamp,pos:new THREE.Vector3(-190+spec.x,0,165+spec.z)};
});
function nextCookStationIndex(){return cookPrep.findIndex(done=>!done);}
function refreshCookStations(){cookStations.forEach((station,i)=>{const done=!!cookPrep[i];station.marker.visible=!done;station.doneLamp.visible=done;station.ring.material.color.setHex(done?0x6fa77c:station.color);});}
refreshCookStations();
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
let yaw=Number.isFinite(saved.playerYaw)?saved.playerYaw:Math.PI;
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({gameClock,cash,missionStep,carWashShiftDone,localsTalked,cookState,evidenceCollected,salvageCollected,deliveryState,deliveryDeadline,deliveryTargetIndex,fuel,waypointX:customWaypoint?.x??null,waypointZ:customWaypoint?.z??null,playerX:player.position.x,playerZ:player.position.z,playerYaw:yaw,carX:playerCar.position.x,carZ:playerCar.position.z,carRotation:playerCar.rotation.y,driving,cookPrep,cookProgress,rvCampVersion:1,polloState,polloDeadline,updatedAt:Date.now()}));}catch{}}
if(Number.isFinite(saved.fuel))fuel=THREE.MathUtils.clamp(saved.fuel,0,100);
if(Number.isFinite(saved.carX)){let sx=saved.carX,sz=Number.isFinite(saved.carZ)?saved.carZ:8,sr=Number.isFinite(saved.carRotation)?saved.carRotation:0;if(sx===8&&sz===-6){sx=-6;sz=8;sr=0;}playerCar.position.set(sx,0,sz);playerCar.rotation.y=sr;}
if(saved.driving){driving=true;player.visible=false;player.position.copy(currentVehicle.position);player.rotation.y=currentVehicle.rotation.y;}
else if(Number.isFinite(saved.playerX)&&Number.isFinite(saved.playerZ))player.position.set(saved.playerX,0,saved.playerZ);
if(!driving&&Math.abs(playerCar.position.z)<10)playerCar.position.z=playerCar.position.z<0?-13:13;
if(vehicleCollisionAt(playerCar.position,playerCar.rotation.y,playerCar)){
 playerCar.position.set(-190,0,165);playerCar.rotation.y=0;
 if(driving)player.position.copy(playerCar.position);
 showToast('Vehicle repositioned to the desert camp.');
}
if(saved.rvCampVersion!==1){driving=false;player.visible=true;playerCar.position.set(-190,0,165);playerCar.rotation.y=0;player.position.set(-186,0,165);player.rotation.y=-Math.PI/2;yaw=-Math.PI/2;saveGame();}
sealedPackage.visible=cookState==='ready';rvCargo.visible=cookState==='loaded';rvCargoStrap.visible=cookState==='loaded';refreshCookStations();
function currentObjective(){
 if(cookState==='idle'){const next=nextCookStationIndex();return next>=0?{name:cookStations[next].label,pos:cookStations[next].pos}:{name:'DESERT WORKBENCH',pos:cookWorkPos};}
 if(cookState==='cooking')return {name:'DESERT WORKBENCH · ACTIVE',pos:cookWorkPos};
 if(cookState==='ready')return {name:'COLLECT THE SEALED CASE',pos:cookPackagePos};
 if(cookState==='loaded')return {name:'ROUTE 66 MOTEL · BUYER',pos:locations[5].pos};
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
 if(cookState==='idle'){el.textContent='CAMP PREPARATION · '+cookPrep.filter(Boolean).length+' / 3 COMPLETE';return;}
 if(cookState==='cooking'){el.textContent='WORKBENCH TIMER · '+Math.max(0,Math.ceil((1-cookProgress)*10))+' SEC';return;}
 if(cookState==='ready'){el.textContent='FINISHED CASE · LOAD IT INTO THE RV';return;}
 if(cookState==='loaded'){el.textContent='CARGO SECURED · '+Math.round(player.position.distanceTo(locations[5].pos))+' M TO BUYER';return;}
 if(deliveryState==='active'){const seconds=Math.max(0,Math.ceil((deliveryDeadline-Date.now())/1000));el.textContent='DELIVERY TIMER · '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+' · '+Math.round(player.position.distanceTo(target.pos))+' M';}
 else if(missionStep===22)el.textContent='EVIDENCE COLLECTED · '+evidenceCollected.length+' / 4 · '+(target?Math.round(player.position.distanceTo(target.pos))+' M':'');
 else if(missionStep>=25)el.textContent='CITY SALVAGE · '+salvageCollected.length+' / '+salvageItems.length+' · '+(target?Math.round(player.position.distanceTo(target.pos))+' M':'');
 else el.textContent=target?'TARGET DISTANCE · '+Math.round(player.position.distanceTo(target.pos))+' M':'FREE ROAM · EXPLORE ALBUQUERQUE';
}

const keys={};
let clickMovePath=[];
const walkObstacles=[
 ...buildingBlockers.map(b=>[b.x,b.z,b.pedX,b.pedZ]),
 // Parked vehicles and fixed roadside fixtures.
 [19,15,2,3.1],[-104,35,2,3.1],[51,-20,2,3.1],[-6,8,2.2,3.5],[98,23,2,3.5],
 [73,35,1.25,1.25],[78,35,1.25,1.25],[83,35,1.25,1.25]
];
// Startup placement audit: if a character is ever authored inside a wall, move it to the nearest clear point.
for(const npc of pedestrianActors){
 if(!pedestrianBlockedByWorld(npc.root.position.x,npc.root.position.z)&&!pedestrianBlockedByCrowd(npc.root.position.x,npc.root.position.z,npc))continue;
 const origin=npc.root.position.clone();let placed=false;
 for(let radius=.8;radius<=12&&!placed;radius+=.8){
  for(let i=0;i<24;i++){
   const angle=i*Math.PI/12,x=origin.x+Math.cos(angle)*radius,z=origin.z+Math.sin(angle)*radius;
   if(!pedestrianBlockedByWorld(x,z)&&!pedestrianBlockedByAnyVehicle(x,z)&&!pedestrianBlockedByCrowd(x,z,npc)){npc.root.position.set(x,0,z);npc.home?.set(x,0,z);placed=true;break;}
  }
 }
 if(!placed)console.warn('No clear initial spawn found for pedestrian',npc);
}
function buildClickMovePath(destination){
 const step=5,size=97,min=-240,index=(x,z)=>{const gx=Math.max(0,Math.min(size-1,Math.round((x-min)/step))),gz=Math.max(0,Math.min(size-1,Math.round((z-min)/step)));return gz*size+gx;};
 const blocked=(i)=>{const x=min+(i%size)*step,z=min+Math.floor(i/size)*step;return walkObstacles.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx+1.45&&Math.abs(z-oz)<rz+1.45);};
 const start=index(player.position.x,player.position.z),goal=index(destination.x,destination.z);
 const parent=new Int32Array(size*size);parent.fill(-1);const queue=new Int32Array(size*size);let read=0,write=0;queue[write++]=start;parent[start]=start;
 let found=-1;
 while(read<write){const cur=queue[read++];if(cur===goal){found=cur;break;}
  const x=cur%size,z=Math.floor(cur/size),next=[x>0?cur-1:-1,x<size-1?cur+1:-1,z>0?cur-size:-1,z<size-1?cur+size:-1];
  for(const n of next){if(n<0||parent[n]!==-1||(n!==goal&&blocked(n)))continue;parent[n]=cur;queue[write++]=n;}
 }
 if(found<0||blocked(goal)){clickMovePath=[];showToast('Choose an open street or sidewalk, not a building.');return false;}
 const raw=[];for(let n=found;n!==start;n=parent[n])raw.push(new THREE.Vector3(min+(n%size)*step,0,min+Math.floor(n/size)*step));
 raw.reverse();
 // Pull the grid route into diagonal segments and round corners for natural steering.
 const clearSegment=(a,b)=>{const samples=Math.ceil(a.distanceTo(b)/1.2);for(let k=1;k<samples;k++){const t=k/samples,x=THREE.MathUtils.lerp(a.x,b.x,t),z=THREE.MathUtils.lerp(a.z,b.z,t);if(walkObstacles.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx+1.15&&Math.abs(z-oz)<rz+1.15))return false;}return true;};
 const anchors=[new THREE.Vector3(player.position.x,0,player.position.z)];let cursor=0;
 while(cursor<raw.length){let farthest=cursor;for(let j=cursor;j<raw.length;j++){if(clearSegment(anchors[anchors.length-1],raw[j]))farthest=j;else break;}anchors.push(raw[farthest]);cursor=farthest+1;}
 anchors.push(new THREE.Vector3(destination.x,0,destination.z));const route=[];
 for(let i=1;i<anchors.length-1;i++){const prev=anchors[i-1],corner=anchors[i],next=anchors[i+1],d1=prev.distanceTo(corner),d2=next.distanceTo(corner),incoming=corner.clone().lerp(prev,Math.min(1.8,d1*.28)/Math.max(.001,d1)),outgoing=corner.clone().lerp(next,Math.min(1.8,d2*.28)/Math.max(.001,d2));route.push(incoming);for(let n=1;n<=5;n++){const t=n/5,u=1-t;route.push(incoming.clone().multiplyScalar(u*u).addScaledVector(corner,2*u*t).addScaledVector(outgoing,t*t));}}
 route.push(anchors[anchors.length-1]);clickMovePath=route;return true;
}
function setClickDestination(x,z){
 const point=new THREE.Vector3(THREE.MathUtils.clamp(x,-235,235),0,THREE.MathUtils.clamp(z,-230,230));
 if(driving){showToast('Exit the car before setting a walking destination.');return;}
 if(!buildClickMovePath(point))return;
 customWaypoint=point.clone();saveGame();drawMiniMap();updateObjectiveDistance();
}
let pitch=-.08, dragging=false, lastX=0,lastY=0;
player.rotation.y=yaw;
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

let audioContext=null,audioMaster=null,windGain=null,engineGain=null,engineOsc=null,engineHarmonicGain=null,roadNoiseGain=null,soundEnabled=localStorage.getItem('abq-sound-enabled')!=='false',footstepClock=0,nextBirdAt=0,noiseBuffer=null;
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
 try{localStorage.setItem('abq-sound-enabled',String(soundEnabled));}catch{}
 audioMaster.gain.setTargetAtTime(soundEnabled?.68:0,audioContext.currentTime,.1);
 $('sound-toggle').textContent=soundEnabled?'SOUND ON':'SOUND OFF';
 $('sound-toggle').setAttribute('aria-pressed',String(soundEnabled));
}
function unlockGameAudio(){
 // A muted preference is authoritative: movement, taps and key presses never unmute.
 if(!soundEnabled||!setupGameAudio())return;
 if(audioContext.state!=='running')audioContext.resume().then(()=>{if(soundEnabled)setGameAudioEnabled(true);}).catch(()=>{});
 else setGameAudioEnabled(true);
}
async function toggleGameAudio(){
 if(!setupGameAudio())return;
 try{if(audioContext.state!=='running')await audioContext.resume();}catch{return;}
 setGameAudioEnabled(!soundEnabled);
 showToast(soundEnabled?'Albuquerque ambience enabled.':'Sound muted.');
}
$('sound-toggle').textContent=soundEnabled?'SOUND ON':'SOUND OFF';
$('sound-toggle').setAttribute('aria-pressed',String(soundEnabled));
$('sound-toggle').addEventListener('click',toggleGameAudio);
function togglePerformanceMode(){
 performanceEnabled=!performanceEnabled;
 try{localStorage.setItem('abq-performance-mode',String(performanceEnabled));}catch{}
 applyPerformanceMode();
 showToast(performanceEnabled?'Smooth mode enabled · reduced rendering load.':'Smooth mode disabled · full visual quality restored.');
}
$('performance-toggle')?.addEventListener('click',togglePerformanceMode);
applyPerformanceMode();
renderer.domElement.addEventListener('pointerdown',unlockGameAudio,{passive:true});
$('mobile-joystick').addEventListener('pointerdown',unlockGameAudio,{passive:true});
function playFootstep(){
 if(!soundEnabled||!audioContext)return;
 const now=audioContext.currentTime;
 const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();
 source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=430;filter.Q.value=.8;
 gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.18,now+.014);gain.gain.exponentialRampToValueAtTime(.0001,now+.16);
 source.connect(filter);filter.connect(gain);gain.connect(audioMaster);source.start(now);source.stop(now+.17);
 const thud=audioContext.createOscillator(),thudGain=audioContext.createGain();
 thud.type='triangle';thud.frequency.setValueAtTime(105,now);thud.frequency.exponentialRampToValueAtTime(38,now+.11);
 thudGain.gain.setValueAtTime(.11,now);thudGain.gain.exponentialRampToValueAtTime(.0001,now+.13);
 thud.connect(thudGain);thudGain.connect(audioMaster);thud.start(now);thud.stop(now+.14);
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
 if(['idle','cooking','ready','loaded'].includes(cookState)){
  const complete=cookPrep.filter(Boolean).length,next=nextCookStationIndex();
  const titles={idle:next>=0?'DESERT CAMP · PREP '+(complete+1)+' / 3':'DESERT CAMP · READY TO START',cooking:'DESERT WORKBENCH · ACTIVE',ready:'SEALED CASE · PICK IT UP',loaded:'RV DELIVERY · ROUTE 66 MOTEL'};
  const copies={
   idle:next>=0?'Complete the three physical camp stations in order: power, calibration, then secure the case. Walk to each marked station and press E.':'All three prep stations are ready. Go to the workbench beneath the canopy and press E to start the 10-second sequence.',
   cooking:'Stay in the marked work area while the fictional production timer runs. Leaving the camp pauses progress.',
   ready:'The sealed case is on the packing bench. Walk over and press E to load it onto the RV roof rack.',
   loaded:'The case is secured on the RV. Drive to the Route 66 Motel, exit the vehicle and meet the buyer to complete the sale.'
  };
  $('mission-title').textContent=titles[cookState];$('mission-copy').textContent=copies[cookState];
  const p=document.querySelector('.objective-progress i');
  if(p)p.style.width=cookState==='idle'?Math.max(5,complete/3*42)+'%':cookState==='cooking'?42+Math.round(cookProgress*35)+'%':cookState==='ready'?'82%':'94%';
  const ch=$('chapter');if(ch)ch.textContent='SIDE STORY · THE DESERT RUN';return;
 }
 const titles=['A DIFFERENT KIND OF FUTURE','A CONVERSATION IN THE DESERT','THE WAREHOUSE LEAD','THE LONG WAY HOME','A FACE AT THE GAS STATION','THE SECOND MEETING','A MESSAGE AFTER MIDNIGHT','THE ROUTE 66 ENVELOPE','BACK TO THE CAR WASH','THE MISSING DRIVER','THE DINER WITNESS','A DRIVER WHO REMEMBERS','ROOM SIX','THE LEDGER','BACK TO JESSE','A NEW ARRANGEMENT','THE NIGHT DELIVERY','THE COURIER','THE WAREHOUSE LIST','THE MOTEL ROOM','THE FINAL HANDOFF','CHAPTER FIVE COMPLETE','FOUR PIECES OF PROOF','THE WAREHOUSE FILE','THE LAST DECISION','CHAPTER SIX COMPLETE'];
 const copies=['Head to the car wash. Jesse is waiting to talk.','Visit the diner. Someone there may know more than they are saying.','The diner lead is in. Head to the desert warehouse.','A contact left a sealed envelope. Take it to the diner.','A stranger has been asking questions at the gas station. Go see what they know.','The new contact has a proposal. Return to the desert warehouse.','A voicemail is waiting at the diner. There is one more loose end to tie up.','A courier left something at the Route 66 Motel. Go collect it.','Return to A-1 Car Wash and decide what Jesse should know.','Jesse has heard from a driver who vanished after a late-night delivery. Start at the car wash.','Find the waitress who saw the delivery van leave the diner.','Track down the driver at the gas station. He knows where the van went.','Go to the Route 66 Motel. Someone kept a room key for the driver.','The room key leads to a ledger hidden at the desert warehouse.','Take the ledger back to Jesse at A-1 Car Wash.','Jesse has another job. A night delivery went missing on the east side.','Find the night driver at the gas station before the police do.','A courier is waiting at the diner with a route and a warning.','The warehouse contact has the shipment list. Get the truth.','Meet the motel manager. The missing cargo was moved through room six.','Return to Jesse. This time, decide what happens to the shipment.','The fifth chapter is complete. A new investigation is available.','Search the streets for four physical pieces of evidence. They are visible in the world; no conversation required.','Bring all four pieces to the warehouse archivist.','Return to Jesse and decide what to do with the evidence.','Chapter Six is complete. Albuquerque remains open for side activities.'];
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
 if(target.type==='rv-station'){
   const i=target.index;if(cookState!=='idle'||i!==nextCookStationIndex())return;
   cookPrep[i]=true;refreshCookStations();showToast(cookStations[i].label+' · '+cookPrep.filter(Boolean).length+' / 3');saveGame();updateHUD();return;
  }
  if(target.type==='rv-cook'){
   if(cookState==='idle'){if(nextCookStationIndex()>=0){showToast('Finish all three marked camp stations first.');return;}cookState='cooking';cookProgress=0;showToast('Work sequence started. Stay by the workbench while the timer runs.');saveGame();updateHUD();}
   else if(cookState==='cooking')showToast('The work sequence is active. Stay in the marked camp area.');return;
  }
  if(target.type==='rv-package'){
   if(cookState!=='ready')return;cookState='loaded';sealedPackage.visible=false;rvCargo.visible=true;rvCargoStrap.visible=true;
   showToast('Sealed case loaded and strapped to the RV. Head for the Route 66 Motel.');saveGame();updateHUD();return;
  }
  if(target.type==='rv-sale'){
   if(cookState!=='loaded'){showToast('The buyer will not deal until the sealed case is loaded in the RV.');return;}
   openDialogue('MOTEL BUYER','The buyer checks the case strapped to your Winnebago, then counts out the payment.',[
    {label:'COMPLETE THE SALE · +$2,500',run:()=>{cookState='sold';cash+=2500;sealedPackage.visible=false;rvCargo.visible=false;rvCargoStrap.visible=false;showToast('Buyer paid · sale complete · +$2,500.');saveGame();updateHUD();}},
    {label:'WALK AWAY',run:()=>{}}
   ]);return;
  }if(target.type==='activity-item'){
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
 }else if(target.type==='pollo-gus'){
  openDialogue('GUSTAVO FRING','Welcome to Los Pollos Hermanos. We take pride in doing things properly. A clean dining room, a courteous staff, and a customer who leaves satisfied. Is there something I can help you with?',[
   {label:'Ask about the restaurant',run:()=>showToast('“Every detail matters. People remember how you make them feel.”')},
   {label:'Offer to help during the lunch rush',run:()=>{if(polloState==='idle'||polloState==='served'){polloState='preparing';polloDeadline=Date.now()+9000;showToast('Gus assigns you a restaurant shift. An order is being prepared.');saveGame();}else showToast('Finish the current restaurant order first.');}},
   {label:'Ask if he is hiring',run:()=>showToast('“We value reliability. Show me you can handle a simple shift first.”')},
   {label:'Leave',run:()=>{}}
  ]);return;
 }else if(target.type==='pollo-order'){
  if(polloState==='idle'||polloState==='served')openDialogue('ORDER COUNTER','Welcome. What can we get started for you?',[
   {label:'Classic chicken meal · $18',run:()=>{if(cash<18){showToast('Not enough cash for the meal.');return;}cash-=18;polloState='preparing';polloDeadline=Date.now()+9000;showToast('Order placed · number 24. Please wait for the pickup light.');saveGame();updateHUD();}},
   {label:'Family meal · $32',run:()=>{if(cash<32){showToast('Not enough cash for the family meal.');return;}cash-=32;polloState='preparing';polloDeadline=Date.now()+12000;showToast('Family meal ordered · number 25.');saveGame();updateHUD();}},
   {label:'Maybe later',run:()=>{}}
  ]);else showToast('You already have an order in progress. Collect it at the pickup counter.');return;
 }else if(target.type==='pollo-pickup'){
  if(polloState==='preparing'&&Date.now()>=polloDeadline){polloState='ready';saveGame();}
  if(polloState==='ready'){polloState='carried';showToast('Order collected. Take the tray to the window booth marked by the gold ring.');saveGame();}
  else if(polloState==='preparing')showToast('Your order is still being prepared · '+Math.ceil((polloDeadline-Date.now())/1000)+' sec.');
  else showToast('No order is waiting at the pickup counter.');return;
 }else if(target.type==='pollo-table'){
  if(polloState==='carried'){polloState='served';cash+=45;showToast('Table served · shift bonus +$45.');saveGame();updateHUD();}
  else showToast('The table is ready for its order. Pick up a tray first.');return;
 }else if(target.type==='pollo-staff'){
  openDialogue('LOS POLLOS EMPLOYEE','Welcome in. The lunch rush is steady today. Gus likes everything neat and on time.',[
   {label:'Ask how the kitchen is running',run:()=>showToast('“We are right on schedule. Pickup is at the counter.”')},
   {label:'Ask where to take an order',run:()=>showToast('The booth by the front window has been waiting.')},
   {label:'Leave',run:()=>{}}
  ]);return;
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
  const polloTargets=[
   {type:'pollo-gus',label:'SPEAK WITH GUSTAVO FRING',pos:gusNPC.root.position,range:4.9},
   {type:'pollo-order',label:'PLACE CHICKEN ORDER',pos:new THREE.Vector3(150,0,70),range:3.8},
   {type:'pollo-pickup',label:'COLLECT ORDER',pos:new THREE.Vector3(159,0,57),range:3.8},
   {type:'pollo-table',label:'SERVE WINDOW TABLE',pos:new THREE.Vector3(139,0,61),range:3.8},
   {type:'pollo-staff',label:'TALK TO RESTAURANT STAFF',pos:polloStaffNPC.root.position,range:4.8}
  ];
  for(const t of polloTargets){const d=player.position.distanceTo(t.pos);if(d<t.range&&d<best){best=d;active=t;}}
  const rvDistance=player.position.distanceTo(currentVehicle.position);
if(cookState==='idle'){
 const next=nextCookStationIndex();
 if(next>=0){const station=cookStations[next],d=player.position.distanceTo(station.pos);if(d<5.2&&d<best){best=d;active={type:'rv-station',index:next,label:station.label,pos:station.pos,range:5.2};}}
 else{const d=player.position.distanceTo(cookWorkPos);if(d<5.8&&d<best){best=d;active={type:'rv-cook',label:'START WORK SEQUENCE · 10 SEC',pos:cookWorkPos,range:5.8};}}
}
if(cookState==='cooking'){const d=player.position.distanceTo(cookWorkPos);if(d<7.5&&d<best){best=d;active={type:'rv-cook',label:'WORK SEQUENCE · '+Math.max(0,Math.ceil((1-cookProgress)*10))+' SEC',pos:cookWorkPos,range:7.5};}}
if(cookState==='ready'){const d=player.position.distanceTo(cookPackagePos);if(d<5.2&&d<best){best=d;active={type:'rv-package',label:'LOAD SEALED CASE INTO RV',pos:cookPackagePos,range:5.2};}}
if(cookState==='loaded'){const d=player.position.distanceTo(motelClerkNPC.root.position);if(d<5.8&&d<best){best=d;active={type:'rv-sale',label:'SELL THE FINISHED PRODUCT',pos:motelClerkNPC.root.position,range:5.8};}}
   if(fuel<100){for(const p of [new THREE.Vector3(73,0,35),new THREE.Vector3(78,0,35),new THREE.Vector3(83,0,35)]){const d=player.position.distanceTo(p);if(d<4.8&&d<best){best=d;active={type:'gas-refuel',label:'REFUEL VEHICLE · $300',pos:p,range:4.8};}}}
  for(let i=0;i<ambientNPCs.length;i++){const npc=ambientNPCs[i],d=player.position.distanceTo(npc.root.position);if(d<4.8&&d<best){best=d;active={type:'local',index:i,label:'TALK TO RESIDENT',pos:npc.root.position,range:4.8};}}
  const nearbyCar=parkedDriveables.map(vehicle=>({vehicle,d:player.position.distanceTo(vehicle.position)})).filter(v=>v.d<5.2).sort((a,b)=>a.d-b.d)[0];
  if(nearbyCar&&nearbyCar.d<best){best=nearbyCar.d;active={type:'vehicle-enter',vehicle:nearbyCar.vehicle,label:nearbyCar.vehicle===pontiacAztekRoot?'DRIVE WALTER’S PONTIAC AZTEK':'ENTER PARKED CAR',pos:nearbyCar.vehicle.position,range:5.2};}
  if(deliveryState==='active'){const target=deliveryTargets[deliveryTargetIndex],d=target?player.position.distanceTo(target.pos):Infinity;if(d<9&&d<=best){best=d;active={type:'delivery-drop',label:'DELIVER PACKAGE',pos:target.pos,range:9};}}
  if(missionStep===22){for(const item of evidenceItems){if(item.collected)continue;const d=player.position.distanceTo(item.pos);if(d<5.5&&d<best){best=d;active={type:'activity-item',item,label:'COLLECT '+item.label.toUpperCase(),pos:item.pos,range:5.5};}}}
  if(raceStartItem.root.visible){const d=player.position.distanceTo(raceStartItem.pos);if(d<5.5&&d<best){best=d;active={type:'activity-item',item:raceStartItem,label:'START STREET TIME TRIAL',pos:raceStartItem.pos,range:5.5};}}
   if((deliveryState==='available'||deliveryState==='failed')&&deliveryItem.root.visible){const d=player.position.distanceTo(deliveryItem.pos);if(d<5.5&&d<best){best=d;active={type:'activity-item',item:deliveryItem,label:'PICK UP COURIER PACKAGE',pos:deliveryItem.pos,range:5.5};}}
  for(const item of salvageItems){if(item.collected)continue;const d=player.position.distanceTo(item.pos);if(d<5.5&&d<best){best=d;active={type:'activity-item',item,label:'SEARCH '+item.label.toUpperCase(),pos:item.pos,range:5.5};}}
  if(active&&!dialogOpen){el.classList.add('visible');$('interaction-copy').textContent=' '+active.label;}
  else if(player.position.distanceTo(currentVehicle.position)<5.0){el.classList.add('visible');$('interaction-copy').textContent=' ENTER VEHICLE';}
  else el.classList.remove('visible');
 }
 let zone='RESIDENTIAL DISTRICT';
 if(player.position.distanceTo(locations[0].pos)<35)zone='CAR WASH DISTRICT';
 if(player.position.distanceTo(locations[1].pos)<35)zone='DINER DISTRICT';
 if(player.position.distanceTo(locations[2].pos)<45)zone='INDUSTRIAL OUTSKIRTS';
 if(player.position.distanceTo(locations[3].pos)<35)zone='GAS STATION';
 if(player.position.distanceTo(locations[4].pos)<24)zone='POLICE PATROL';
 if(player.position.distanceTo(locations[5].pos)<32)zone='ROUTE 66 MOTEL';
 if(player.position.distanceTo(locations[6].pos)<38)zone='LOS POLLOS DISTRICT';
  if(player.position.distanceTo(new THREE.Vector3(-190,0,165))<62)zone='DESERT COOK SITE';
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
 const carX=cx+(currentVehicle.position.x-player.position.x)*scale,carY=cy+(currentVehicle.position.z-player.position.z)*scale;if(carX>4&&carX<w-4&&carY>4&&carY<h-4){ctx.save();ctx.translate(carX,carY);ctx.rotate(-playerCar.rotation.y);ctx.fillStyle='#8fc4d2';ctx.fillRect(-3,-6,6,12);ctx.restore();}
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
 ctx.strokeStyle='#927b5d';ctx.lineWidth=8*scale;ctx.beginPath();trackPoints.forEach((v,i)=>{const q=p(v[0],v[1]);if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});ctx.stroke();
  ctx.strokeStyle='#686c64';ctx.lineWidth=15*scale;ctx.beginPath();ctx.moveTo(...Object.values(p(100,0)));ctx.lineTo(...Object.values(p(100,-52)));ctx.moveTo(...Object.values(p(-145,0)));ctx.lineTo(...Object.values(p(-145,-68)));ctx.stroke();
 ctx.strokeStyle='#d0b36a';ctx.lineWidth=2;ctx.setLineDash([9,10]);ctx.beginPath();ctx.moveTo(...Object.values(p(-250,0)));ctx.lineTo(...Object.values(p(250,0)));ctx.moveTo(...Object.values(p(100,-4)));ctx.lineTo(...Object.values(p(100,-50)));ctx.moveTo(...Object.values(p(-145,-4)));ctx.lineTo(...Object.values(p(-145,-66)));ctx.stroke();ctx.setLineDash([]);
 const block=(x,z,bw,bd,color)=>{const q=p(x,z);ctx.fillStyle=color;ctx.fillRect(q.x-bw*scale/2,q.y-bd*scale/2,bw*scale,bd*scale);ctx.strokeStyle='rgba(227,211,169,.35)';ctx.lineWidth=1;ctx.strokeRect(q.x-bw*scale/2,q.y-bd*scale/2,bw*scale,bd*scale);};
 [[-30,-38,14,11],[-58,-38,12,10],[8,-44,12,10],[42,-42,14,11],[-70,38,11,9],[70,42,14,10]].forEach(v=>block(v[0],v[1],v[2],v[3],'#887f6e'));
 block(36,28,30,19,'#b6a589');block(-82,22,25,16,'#d2c8b8');block(100,-70,39,31,'#4d5651');block(78,24,21,14,'#b9a77d');block(-145,-76,57,14,'#b9ad91');block(150,65,35,23,'#b9a77d');
 ctx.font='bold 12px monospace';ctx.textAlign='left';
 const occupied=[];
 for(const l of locations){
  const q=p(l.pos.x,l.pos.z);ctx.fillStyle=l.type==='police'?'#9bb9d9':'#dfc27b';ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.fill();
  const label=String(l.name),tw=ctx.measureText(label).width,options=[[10,-10],[-tw-10,-10],[10,19],[-tw-10,19],[10,-25],[-tw-10,-25]];
  let chosen=null;
  for(const [ox,oy] of options){const box={x:q.x+ox-3,y:q.y+oy-11,w:tw+6,h:15};if(box.x<5||box.x+box.w>w-5||box.y<5||box.y+box.h>h-28)continue;if(!occupied.some(b=>box.x<b.x+b.w+4&&box.x+box.w+4>b.x&&box.y<b.y+b.h+3&&box.y+box.h+3>b.y)){chosen={box,ox,oy};break;}}
  if(chosen){occupied.push(chosen.box);ctx.fillStyle='rgba(18,24,20,.82)';ctx.fillRect(chosen.box.x,chosen.box.y,chosen.box.w,chosen.box.h);ctx.fillStyle='#e0d1aa';ctx.fillText(label,q.x+chosen.ox,q.y+chosen.oy);}
 }
 for(const item of [...evidenceItems,...salvageItems]){if(item.root.visible){const q=p(item.pos.x,item.pos.z);ctx.fillStyle=item.kind==='salvage'?'#9ac7a4':'#e5c979';ctx.fillRect(q.x-5,q.y-5,10,10);}}
 if(deliveryItem.root.visible){const q=p(deliveryItem.pos.x,deliveryItem.pos.z);ctx.fillStyle='#8fc4d2';ctx.fillRect(q.x-6,q.y-6,12,12);}
 const camp=p(-190,165);ctx.fillStyle='#d0a75e';ctx.beginPath();ctx.arc(camp.x,camp.y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e0d1aa';ctx.font='bold 12px monospace';ctx.fillText('DESERT RV CAMP',camp.x+10,camp.y-8);
  const target=currentObjective();if(target){const q=p(target.pos.x,target.pos.z);ctx.strokeStyle='#ffe69c';ctx.lineWidth=4;ctx.beginPath();ctx.arc(q.x,q.y,15,0,Math.PI*2);ctx.stroke();}
 const car=p(currentVehicle.position.x,currentVehicle.position.z);ctx.save();ctx.translate(car.x,car.y);ctx.rotate(-playerCar.rotation.y);ctx.fillStyle='#83bfd1';ctx.fillRect(-7,-13,14,26);ctx.restore();
 const me=p(player.position.x,player.position.z);ctx.save();ctx.translate(me.x,me.y);ctx.rotate(-player.rotation.y);ctx.fillStyle='#fff0cf';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(9,10);ctx.lineTo(0,6);ctx.lineTo(-9,10);ctx.closePath();ctx.fill();ctx.restore();
 const objectiveText=target?target.name+' · '+Math.round(player.position.distanceTo(target.pos))+' M':'FREE ROAM';
 ctx.fillStyle='#d8c58f';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText(objectiveText,w/2,h-12);
}
function setMapOpen(open){mapOpen=!!open;$('map-overlay').classList.toggle('hidden',!mapOpen);if(mapOpen)drawWorldMap();}
$('minimap').addEventListener('click',()=>setMapOpen(true));
let mapPointerStart=null;
const worldMapCanvas=$('world-map');
worldMapCanvas.addEventListener('pointerdown',e=>{mapPointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};try{worldMapCanvas.setPointerCapture(e.pointerId);}catch{}});
worldMapCanvas.addEventListener('pointerup',e=>{
 if(!mapPointerStart||mapPointerStart.id!==e.pointerId)return;
 const moved=Math.hypot(e.clientX-mapPointerStart.x,e.clientY-mapPointerStart.y);mapPointerStart=null;
 if(moved>18)return;
 e.preventDefault();
 const rect=worldMapCanvas.getBoundingClientRect(),px=(e.clientX-rect.left)*worldMapCanvas.width/rect.width,py=(e.clientY-rect.top)*worldMapCanvas.height/rect.height;
 const scale=Math.min((worldMapCanvas.width-90)/520,(worldMapCanvas.height-70)/520),x=(px-worldMapCanvas.width/2)/scale,z=(py-worldMapCanvas.height/2)/scale;
 if(x< -245||x>245||z< -245||z>245){showToast('Choose a point inside the city map.');return;}
 setClickDestination(x,z);drawWorldMap();if(clickMovePath.length)setMapOpen(false);showToast(clickMovePath.length?'Destination set · walking there now.':'Choose another destination.');
});
worldMapCanvas.addEventListener('pointercancel',()=>{mapPointerStart=null;});
const clearWaypointButton=$('waypoint-clear');if(clearWaypointButton)clearWaypointButton.onclick=()=>{customWaypoint=null;clickMovePath=[];saveGame();drawWorldMap();drawMiniMap();updateObjectiveDistance();showToast('Custom waypoint cleared.');};
$('map-close').onclick=()=>setMapOpen(false);
function enterVehicle(){playDoorSound();driving=true;driveSpeed=0;player.visible=false;player.position.copy(currentVehicle.position);player.rotation.y=currentVehicle.rotation.y;yaw=currentVehicle.rotation.y;showToast(currentVehicle===playerCar?'RV entered · W accelerate · A/D steer · S reverse · H horn':'Vehicle entered · W accelerate · A/D steer · S reverse · H horn');updateActive();}
function exitVehicle(){playDoorSound();driving=false;driveSpeed=0;player.visible=true;const side=new THREE.Vector3(Math.cos(currentVehicle.rotation.y),0,-Math.sin(currentVehicle.rotation.y));player.position.copy(currentVehicle.position).addScaledVector(side,currentVehicle===playerCar?3.4:2.3);player.rotation.y=currentVehicle.rotation.y;yaw=currentVehicle.rotation.y;showToast('You stepped out of the vehicle.');updateActive();}
function onInteract(){if(dialogOpen||mapOpen)return;if(driving){exitVehicle();return;}if(active&&(active.type==='delivery-drop'||active.type==='activity-item'||active.type==='rv-cook'||active.type==='rv-sale'||active.type==='rv-station'||active.type==='rv-package')){interact(active);return;}if(active?.type==='vehicle-enter'){currentVehicle=active.vehicle;enterVehicle();return;}if(player.position.distanceTo(currentVehicle.position)<5.0){enterVehicle();return;}if(active)interact(active);}

window.addEventListener('keydown',e=>{
 unlockGameAudio();
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 if(e.code==='KeyM'){setMapOpen(!mapOpen);return;}
  if(e.code==='KeyH'&&driving){playHorn();return;}
  if(e.code==='KeyE'&&!driving&&active?.type==='vehicle-enter'){currentVehicle=active.vehicle;enterVehicle();return;}
 if(e.code==='KeyC'&&!driving&&active?.type==='rv-cook'){interact(active);return;}
 if(e.code==='Escape'){if(mapOpen)setMapOpen(false);else closeDialogue();return;}
 if(mapOpen)return;
 keys[e.code]=true;
 if(e.code==='KeyE'||e.code==='Enter') onInteract();
});
window.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);dragging=false;resetJoystick();});
window.addEventListener('pagehide',saveGame);
document.addEventListener('visibilitychange',()=>{if(document.hidden){saveGame();Object.keys(keys).forEach(k=>keys[k]=false);dragging=false;resetJoystick();}});
let scenePointerStart=null;
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;scenePointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};try{renderer.domElement.setPointerCapture(e.pointerId);}catch{}});
renderer.domElement.addEventListener('pointerup',e=>{
 dragging=false;
 if(!scenePointerStart||scenePointerStart.id!==e.pointerId)return;
 const distance=Math.hypot(e.clientX-scenePointerStart.x,e.clientY-scenePointerStart.y);
 scenePointerStart=null;
 if(distance>9||dialogOpen||mapOpen||driving)return;
 const rect=renderer.domElement.getBoundingClientRect();
 const ndc=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
 const raycaster=new THREE.Raycaster();raycaster.setFromCamera(ndc,camera);
 const ground=new THREE.Plane(new THREE.Vector3(0,1,0),0),point=new THREE.Vector3();
 if(raycaster.ray.intersectPlane(ground,point)&&Math.abs(point.x)<245&&Math.abs(point.z)<235){
  setClickDestination(point.x,point.z);showToast('Destination set · walking there now.');
 }
});
renderer.domElement.addEventListener('pointercancel',()=>{dragging=false;scenePointerStart=null;});
renderer.domElement.addEventListener('pointermove',e=>{
 if(!dragging)return;
 yaw-=(e.clientX-lastX)*.00145; pitch=Math.max(-.12,Math.min(.22,pitch+(e.clientY-lastY)*.0018));
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
 const viewport=window.visualViewport;
 const width=Math.max(1,Math.round(viewport?.width||window.innerWidth||document.documentElement.clientWidth));
 const height=Math.max(1,Math.round(viewport?.height||window.innerHeight||document.documentElement.clientHeight));
 camera.aspect=width/height;camera.updateProjectionMatrix();
 renderer.setPixelRatio(performanceEnabled?Math.min(window.devicePixelRatio||1,.9):Math.min(window.devicePixelRatio||1,1.65));
 renderer.setSize(width,height,false);
 app.style.setProperty('--viewport-width',width+'px');
 app.style.setProperty('--viewport-height',height+'px');
 renderer.domElement.style.width='100%';
 renderer.domElement.style.height='100%';
}
window.addEventListener('resize',resize);
window.addEventListener('orientationchange',()=>setTimeout(resize,120));
window.visualViewport?.addEventListener('resize',resize);
window.visualViewport?.addEventListener('scroll',resize);
window.addEventListener('pageshow',resize);
resize();
const clock=new THREE.Clock();
let lastAutoSave=0,uiRefreshClock=0,performanceFrameTime=0;
function animate(){
 requestAnimationFrame(animate);
 const frameNow=performance.now();
 if(performanceEnabled&&frameNow-performanceFrameTime<33.333)return;
 if(performanceEnabled)performanceFrameTime=frameNow;
 const dt=Math.min(clock.getDelta(),performanceEnabled?.05:.04);
 gameClock=synchronizedGameClock();
 const dusk=THREE.MathUtils.smoothstep(gameClock,18,20);
 lightingRefresh+=dt;
 if(lightingRefresh>=.12){
  lightingRefresh=0;
  scene.background.copy(daySky).lerp(duskSky,dusk);
  scene.fog.color.copy(dayFog).lerp(duskFog,dusk);
  scene.fog.density=.0068+dusk*.0009;
  sun.intensity=3.2-dusk*1.75;
  sun.color.setRGB(1, .83-dusk*.24, .65-dusk*.29);
  sun.position.set(-65,95-dusk*70,45);
  hemiLight.intensity=2.0-dusk*.62;
  starField.visible=false;starField.material.opacity=0;
  for(const lamp of streetLights){lamp.light.intensity=dusk*.65;lamp.bulb.material.emissiveIntensity=.12+dusk*.65;}
  for(const headlight of rvHeadlights){headlight.beam.intensity=dusk*.4;headlight.lens.material.emissiveIntensity=.15+dusk*.35;}
  const hour=Math.floor(gameClock),minute=Math.floor((gameClock-hour)*60);
  const clockEl=$('game-clock');if(clockEl)clockEl.textContent=String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0')+(dusk>.02?' · DUSK':' · DAY');
 }
 let walkingNow=false;
 uiRefreshClock+=dt;
 if(!dialogOpen&&!mapOpen){
  crashCooldown=Math.max(0,crashCooldown-dt);
  if(polloState==='preparing'&&Date.now()>=polloDeadline){polloState='ready';showToast('Order 24 is ready at the Los Pollos pickup counter.');saveGame();}
  if(cookState==='cooking'&&!driving&&player.position.distanceTo(cookWorkPos)<7.5){
   cookProgress=Math.min(1,cookProgress+dt/10);
   const bar=document.querySelector('.objective-progress i');if(bar)bar.style.width=Math.round(cookProgress*70)+'%';
   if(cookProgress>=1){cookState='ready';sealedPackage.visible=true;showToast('Work sequence complete · no payment yet. Collect the sealed case and load it into the RV.');saveGame();updateHUD();}
  }
  trafficCars.forEach(t=>{
   const start=t.root.position.clone();
   let nextX=start.x+t.direction*t.speed*dt;
   let wrapped=false;
   if(nextX>265){nextX=-265;wrapped=true;}
   if(nextX< -265){nextX=265;wrapped=true;}
   const heading=t.direction>0?Math.PI/2:-Math.PI/2;
   const end=new THREE.Vector3(nextX,start.y,start.z);
   let blocked='';
   if(wrapped){
    blocked=vehicleCollisionAt(end,heading,t.root);
    if(!blocked)t.root.position.copy(end);
   }else{
    const travel=Math.abs(nextX-start.x),steps=Math.max(1,Math.ceil(travel/.12));
    let lastSafe=start.clone();
    for(let step=1;step<=steps;step++){
     const candidate=start.clone().lerp(end,step/steps);
     blocked=vehiclePathHitsPedestrian(lastSafe,candidate,heading)?'pedestrian':vehicleCollisionAt(candidate,heading,t.root);
     if(blocked)break;
     t.root.position.copy(candidate);
     lastSafe.copy(candidate);
    }
   }
   if(blocked){
    t.root.position.copy(start);
    if(blocked!=='pedestrian')t.direction*=-1;
   }
   t.root.rotation.y=t.direction>0?Math.PI/2:-Math.PI/2;
  });
  separatePedestriansFromAllVehicles();
  if(driving){
   const throttle=THREE.MathUtils.clamp((keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joystickY,-1,1);
   const steeringInput=THREE.MathUtils.clamp((keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joystickX,-1,1);
    // Softer steering curve prevents tiny thumb movements from snapping the long RV around.
    const steering=Math.sign(steeringInput)*Math.pow(Math.abs(steeringInput),1.65);
   const effectiveThrottle=(fuel<=0&&throttle>0)?0:throttle;
   driveSpeed=THREE.MathUtils.clamp(driveSpeed+effectiveThrottle*15*dt,-10,24);
   if(fuel<=0&&driveSpeed>0)driveSpeed=Math.max(0,driveSpeed-18*dt);
   fuel=THREE.MathUtils.clamp(fuel-Math.abs(driveSpeed)*dt*.018,0,100);
   if(!throttle)driveSpeed*=Math.pow(.88,dt*60);
   if(Math.abs(driveSpeed)<.08)driveSpeed=0;
   const oldRotation=currentVehicle.rotation.y;
   const speedRatio=Math.min(Math.abs(driveSpeed)/24,1);
    const steeringRate=(.065+.27*speedRatio);
    const steeredRotation=oldRotation-steering*steeringRate*dt*(driveSpeed>=0?1:-1);
   if(!vehicleCollisionAt(currentVehicle.position,steeredRotation,currentVehicle))currentVehicle.rotation.y=steeredRotation;
   const oldPosition=currentVehicle.position.clone();
   const heading=new THREE.Vector3(Math.sin(currentVehicle.rotation.y),0,Math.cos(currentVehicle.rotation.y));
   const next=oldPosition.clone().addScaledVector(heading,driveSpeed*dt);
   const travel=oldPosition.distanceTo(next),steps=Math.max(1,Math.ceil(travel/.12));
   let collision='';
   for(let step=1;step<=steps;step++){
    const candidate=oldPosition.clone().lerp(next,step/steps);
    collision=vehiclePathHitsPedestrian(currentVehicle.position,candidate,currentVehicle.rotation.y,currentVehicle)?'pedestrian':vehicleCollisionAt(candidate,currentVehicle.rotation.y,currentVehicle);
    if(collision)break;
    currentVehicle.position.copy(candidate);
   }
   if(collision){
    driveSpeed=0; // A blocked vehicle stops instead of bouncing through the obstacle.
    if(crashCooldown<=0){playImpact();const pedestrian=collision==='pedestrian';showToast(pedestrian?'The car stopped before reaching the pedestrian.':'Vehicle collision: '+collision+'.');crashCooldown=1.0;}
   }
   currentVehicle.position.x=THREE.MathUtils.clamp(currentVehicle.position.x,-245,245);currentVehicle.position.z=THREE.MathUtils.clamp(currentVehicle.position.z,-235,235);
   player.position.copy(playerCar.position);player.rotation.y=playerCar.rotation.y;
   $('drive-info').textContent='DRIVING · '+Math.round(Math.abs(driveSpeed)*3.6)+' KM/H · FUEL '+Math.round(fuel)+'%';
  }else{
   $('drive-info').textContent='ON FOOT';
   const manualForward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joystickY;
   const manualSide=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joystickX;
   if(manualForward!==0||manualSide!==0)clickMovePath=[];
   while(clickMovePath.length&&player.position.distanceTo(clickMovePath[0])<1.9)clickMovePath.shift();
   const autoTarget=clickMovePath[0]||null;
   if(autoTarget){const desiredYaw=Math.atan2(autoTarget.x-player.position.x,autoTarget.z-player.position.z),angle=((desiredYaw-yaw+Math.PI*3)%(Math.PI*2))-Math.PI;yaw+=angle*(1-Math.exp(-dt*7.5));player.rotation.y=yaw;}
   const forward=autoTarget?1:manualForward;
   const side=autoTarget?0:manualSide;
   const speed=(keys.ShiftLeft||keys.ShiftRight?15.5:9.5)*dt;
   const direction=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
   const right=new THREE.Vector3(-direction.z,0,direction.x);
   const move=direction.multiplyScalar(forward).add(right.multiplyScalar(side*.12));
  if(move.lengthSq()>0){
   if(move.lengthSq()>1)move.normalize();const next=player.position.clone().addScaledVector(move,speed);
   // Shared clearance test for keyboard, joystick and click-to-move.
   // The player's collision radius is kept consistent around corners and narrow passages.
   const isBlocked=(x,z)=>walkObstacles.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx+.48&&Math.abs(z-oz)<rz+.48);
   const actorBlocked=(x,z)=>pedestrianActors.some(n=>Math.hypot(x-n.root.position.x,z-n.root.position.z)<1.08)||pedestrianBlockedByAnyVehicle(x,z);
   const oldX=player.position.x,oldZ=player.position.z;
   if(!isBlocked(next.x,next.z)&&!actorBlocked(next.x,next.z)){player.position.x=next.x;player.position.z=next.z;}
   else if(!autoTarget){if(!isBlocked(next.x,oldZ)&&!actorBlocked(next.x,oldZ))player.position.x=next.x;if(!isBlocked(player.position.x,next.z)&&!actorBlocked(player.position.x,next.z))player.position.z=next.z;}
   else{const slideA=new THREE.Vector3(oldX+(next.z-oldZ),0,oldZ),slideB=new THREE.Vector3(oldX,0,oldZ+(next.x-oldX)),valid=p=>!isBlocked(p.x,p.z)&&!actorBlocked(p.x,p.z);if(valid(slideA))player.position.copy(slideA);else if(valid(slideB))player.position.copy(slideB);}
   if(player.position.x!==oldX||player.position.z!==oldZ){
    // Keep the character's facing direction while backing up; turning 180° every
    // frame made S/joystick-down oscillate instead of moving straight backwards.
    if(!autoTarget&&manualForward>=0&&Math.abs(manualSide)>.15){
     const face=Math.atan2(move.x,move.z),da=((face-yaw+Math.PI*3)%(Math.PI*2))-Math.PI;
     yaw+=da*(1-Math.exp(-dt*8));player.rotation.y=yaw;
    }else if(!autoTarget&&manualForward>0&&Math.abs(manualSide)<=.15){
     const face=Math.atan2(move.x,move.z),da=((face-yaw+Math.PI*3)%(Math.PI*2))-Math.PI;
     yaw+=da*(1-Math.exp(-dt*8));player.rotation.y=yaw;
    }
    walkingNow=true;
   }
   else if(autoTarget){clickMovePath=[];showToast('Route blocked · choose another destination.');}
   if(autoTarget&&clickMovePath.length===0){customWaypoint=null;saveGame();drawMiniMap();}
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
  else if(driving&&currentVehicle.position.distanceTo(raceCheckpoints[raceIndex])<7.5){
   raceIndex++;
   if(raceIndex>=raceCheckpoints.length){raceActive=false;raceGates.forEach(g=>g.root.visible=false);raceStartItem.root.visible=true;cash+=1800;showToast('Street time trial complete · +$1,800');updateHUD();saveGame();}
   else showToast('Checkpoint '+raceIndex+' / '+raceCheckpoints.length+' cleared. Keep moving!');
  }
 }
 const animTime=performance.now(),swing=walkingNow&&!driving?Math.sin(animTime*.008)*.34:0;
 polloFoodTray.visible=polloState==='ready';polloServeRing.visible=polloState==='carried';polloServeRing.rotation.z+=dt*.45;
  cookStations.forEach((station,i)=>{station.ring.rotation.z+=dt*(i%2?-.55:.55);if(station.marker.visible)station.marker.position.y=2.85+Math.sin(animTime*.003+i)*.13;});
  const cookingNow=cookState==='cooking';cookGlow.material.opacity=cookingNow?.72:.18;cookGlow.scale.setScalar(cookingNow?1.08+Math.sin(animTime*.012)*.12:1);campLight.intensity=cookingNow?1.35:0;
  vaporPuffs.forEach((p,i)=>{p.material.opacity=cookingNow?.22:0;p.position.y=2.1+i*.34+(cookingNow?((animTime*.00055+i*.23)%1)*.75:0);p.scale.setScalar(cookingNow?(.75+Math.sin(animTime*.004+i)*.25):.01);});
 for(const item of [...evidenceItems,...salvageItems,deliveryItem,raceStartItem])if(item.root.visible){item.ring.rotation.z+=dt*.8;item.marker.position.y=1.62+Math.sin(animTime*.003+item.pos.x)*.12;}
 raceGates.forEach((gate,i)=>{if(gate.root.visible)gate.ring.rotation.z+=dt*(i%2?-.65:.65);});
  playerArms.forEach((limb,i)=>limb.rotation.x=(i===0?1:-1)*swing);playerLegs.forEach((limb,i)=>limb.rotation.x=(i===0?-1:1)*swing);body.position.y=walkingNow&&!driving?Math.abs(Math.sin(animTime*.012))*.055:0;
 const animateNpc=(npc,travelDistance=0)=>{
  // Feet stay planted on the ground. Gait advances only with real horizontal travel.
  npc.root.position.y=0;
  if(travelDistance>.0001)npc.walkPhase+=travelDistance*8.2;
  const stride=travelDistance>.0001?Math.sin(npc.walkPhase)*.48:0;
  const armSwing=travelDistance>.0001?Math.sin(npc.walkPhase+Math.PI)*.34:Math.sin(animTime*.001+npc.phase)*.018;
  npc.legs[0].rotation.x=stride;npc.legs[1].rotation.x=-stride;
  npc.arms[0].rotation.x=armSwing;npc.arms[1].rotation.x=-armSwing;
 };
 animateNpc(jesseNPC);animateNpc(dinerNPC);animateNpc(warehouseNPC);animateNpc(policeNPC);animateNpc(gasContactNPC);animateNpc(motelNPC);animateNpc(witnessNPC);animateNpc(courierNPC);animateNpc(driverNPC);animateNpc(motelClerkNPC);animateNpc(warehouseArchivistNPC);patrolRed.visible=Math.sin(animTime*.012)>0;patrolBlue.visible=!patrolRed.visible;
 ambientNPCs.forEach((npc,i)=>{
   const oldX=npc.root.position.x,oldZ=npc.root.position.z;
   let nearestDistance=Infinity,awayX=0,awayZ=0;
   for(const movingCar of movingVehicleRoots){const dx=oldX-movingCar.position.x,dz=oldZ-movingCar.position.z,d=Math.hypot(dx,dz);if(d<nearestDistance){nearestDistance=d;awayX=dx;awayZ=dz;}}
   if(driving){const dx=oldX-currentVehicle.position.x,dz=oldZ-currentVehicle.position.z,d=Math.hypot(dx,dz);if(d<nearestDistance){nearestDistance=d;awayX=dx;awayZ=dz;}}
   if(nearestDistance<8.5){
     const length=Math.hypot(awayX,awayZ)||1;awayX/=length;awayZ/=length;
     const step=3.1*dt,tx=oldX+awayX*step,tz=oldZ+awayZ*step;
     if(movePedestrianSafely(npc,tx,tz)){npc.home.x+=npc.root.position.x-oldX;npc.home.z+=npc.root.position.z-oldZ;}
   }else{
     const t=animTime*.00034+npc.wanderPhase;
     const targetX=npc.home.x+Math.sin(t)*2.0,targetZ=npc.home.z+Math.cos(t)*1.15;
     movePedestrianSafely(npc,targetX,targetZ);
   }
   const dx=npc.root.position.x-oldX,dz=npc.root.position.z-oldZ,travel=Math.hypot(dx,dz);
   if(travel>.0001)npc.root.rotation.y=Math.atan2(dx,dz);
   animateNpc(npc,travel);
  });
 updateObjectiveBeacon(animTime);
 if(animTime-lastAutoSave>4000){saveGame();lastAutoSave=animTime;}
 const cameraYaw=driving?currentVehicle.rotation.y:yaw;
 const camDist=driving?13.5:8.8;
 const cameraPitch=driving?pitch*.35:pitch;
 cameraTarget.set(player.position.x,player.position.y+(driving?2.85:1.82),player.position.z);
 const horizontalDistance=camDist*Math.cos(cameraPitch);
 const offset=new THREE.Vector3(-Math.sin(cameraYaw)*horizontalDistance,Math.sin(cameraPitch)*camDist,-Math.cos(cameraYaw)*horizontalDistance);
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
