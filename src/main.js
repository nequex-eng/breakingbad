import './style.css';
import * as THREE from 'three';
const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x171b18);scene.fog=new THREE.Fog(0x171b18,22,48);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,100);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;$('app').prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdce6e0,0x34302a,2.0));
const key=new THREE.DirectionalLight(0xffd5a0,2.4);key.position.set(-5,12,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
const fill=new THREE.PointLight(0x83a9a3,18,18);fill.position.set(0,5,-2);scene.add(fill);
const mat=(c,r=.82,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const M={floor:mat(0x77766b),rubber:mat(0x242927),wall:mat(0xb8b5a7),metal:mat(0x66716d,.38,.65),steel:mat(0x9ba6a0,.28,.72),dark:mat(0x29312d),wood:mat(0x765d45),yellow:mat(0xd4ad5e),blue:mat(0x4d737a),red:mat(0x934b3c),green:mat(0x738b77),skin:mat(0xc49472),shirt:mat(0x647b84),pants:mat(0x353b3c),glass:new THREE.MeshStandardMaterial({color:0x91b8b4,roughness:.18,transparent:true,opacity:.55}),glow:new THREE.MeshStandardMaterial({color:0x77c6ad,emissive:0x1e745a,emissiveIntensity:1.4})};
function box(parent,x,y,z,w,h,d,material,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o;}
function cyl(parent,x,y,z,r1,r2,h,material,n=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),material);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
function sphere(parent,x,y,z,r,material){const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),material);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
// A compact, open-roof cutaway RV interior: one room, no exterior map.
const van=new THREE.Group();scene.add(van);
box(van,0,-.22,0,15,.42,8,M.rubber);
box(van,0,.02,0,14.6,.12,7.6,M.floor,false);
box(van,0,1.55,-3.78,14.8,3.1,.22,M.wall);
box(van,-7.25,1.55,0,.22,3.1,7.8,M.wall);
box(van,7.25,1.55,0,.22,3.1,7.8,M.wall);
// Front cab partition and rear doors, with wide opening for readability.
box(van,-4.9,1.55,3.78,4.7,3.1,.22,M.wall);
box(van,4.9,1.55,3.78,4.7,3.1,.22,M.wall);
box(van,0,2.95,-3.78,14.8,.2,.22,M.dark);
box(van,0,2.95,3.78,5.0,.2,.22,M.dark);
for(const x of [-5.4,5.4]){box(van,x,1.9,-3.64,2.3,1.15,.08,M.glass);box(van,x,1.9,-3.57,.08,1.25,.08,M.metal);}
box(van,0,2.7,0,13.8,.12,7.2,M.dark,false); // ceiling edge trim, roof intentionally open
// Ceiling ribs and warm practical lights.
for(const z of [-2.9,-1.2,.5,2.2]){box(van,0,2.82,z,14.2,.12,.16,M.metal);const lamp=new THREE.PointLight(0xffdfad,8,7);lamp.position.set(0,2.55,z);scene.add(lamp);box(van,0,2.68,z,.9,.08,.32,mat(0xffe5bb,.35));}
// Side benches, cabinets, and practical clutter.
box(van,-6.2,.65,-.4,1.4,1.2,5.9,M.wood);box(van,6.2,.65,-.4,1.4,1.2,5.9,M.wood);
for(const x of [-6.2,6.2]){for(const z of [-2.4,-.8,.8,2.4]){box(van,x,.85,z,1.45,.08,1.35,M.dark);box(van,x,1.25,z,.12,.65,1.15,M.metal);}}
box(van,0,.48,-2.7,5.2,.9,1.15,M.metal);box(van,0,.98,-2.7,5.1,.12,1.05,M.dark);
for(let x=-1.8;x<=1.8;x+=.9){cyl(van,x,1.2,-2.7,.22,.22,.34,M.steel,16);cyl(van,x,1.4,-2.7,.12,.12,.12,M.glow,16);}
box(van,0,.4,2.5,4.8,.8,1.0,M.wood);box(van,0,.85,2.5,4.9,.1,1.05,M.metal);
for(let x of [-1.7,-.6,.6,1.7]){cyl(van,x,1.12,2.5,.22,.22,.35,M.blue,12);sphere(van,x,1.35,2.5,.14,M.glow);}
box(van,-5.9,1.8,-2.7,1.3,1.4,.9,M.dark);box(van,-5.9,2.55,-2.7,1.4,.08,1.0,M.yellow);
box(van,5.9,1.8,-2.7,1.3,1.4,.9,M.dark);box(van,5.9,2.55,-2.7,1.4,.08,1.0,M.yellow);
// Rear cab dashboard and windshield hint.
box(van,0,.9,3.25,3.8,.5,.65,M.dark);box(van,0,1.55,3.48,3.4,.9,.1,M.glass);
// Characters are deliberately stylized but clearly human, with recognizable silhouettes.
function person(name,shirt,pants,skin){const g=new THREE.Group();const torso=cyl(g,0,1.18,0,.38,.46,.95,mat(shirt),10);cyl(g,0,.42,0,.32,.34,.55,mat(pants),10);sphere(g,0,1.95,0,.29,mat(skin));cyl(g,-.48,1.2,0,.12,.15,.78,mat(shirt),8).rotation.z=-.12;cyl(g,.48,1.2,0,.12,.15,.78,mat(shirt),8).rotation.z=.12;for(const x of [-.17,.17]){cyl(g,x,.13,.04,.13,.15,.28,M.rubber,8);}g.userData.name=name;scene.add(g);return g;}
const walt=person('HEISENBERG',0x53616b,0x292d30,0xc69b7e);walt.position.set(-2.7,0,.3);
const jesse=person('JESSE PINKMAN',0x71816d,0x333b3b,0xc58e6e);jesse.position.set(2.6,0,-.1);jesse.rotation.y=-Math.PI/2;
// Heisenberg's hat/glasses cue.
cyl(walt,0,2.2,0,.31,.31,.1,M.rubber,12);box(walt,0,2.05,.27,.44,.08,.05,M.dark);
const activePlayer=new THREE.Group();scene.add(activePlayer);let role='heisenberg',partner='JESSE PINKMAN';
const avatar=person('PLAYER',0x53616b,0x292d30,0xc69b7e);activePlayer.add(avatar);avatar.position.set(0,0,0);avatar.visible=false;
const bins=[];
function station(name,x,z,color,kind){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(g,0,.42,0,1.35,.84,1.1,M.dark);box(g,0,.88,0,1.4,.1,1.15,M.metal);box(g,0,1.12,0,.65,.28,.65,mat(color,.4));const light=sphere(g,0,1.36,0,.12,M.glow);bins.push({name,kind,pos:new THREE.Vector3(x,0,z),visual:light});}
station('SEALED SUPPLY A',-5.8,-.3,0xd0b36b,'a');
station('SEALED SUPPLY B',5.8,-.3,0x8bafaa,'b');
station('SEALED SUPPLY C',-5.8,2.1,0xb58b75,'c');
station('BATCH CONTROL',0,-2.65,0x72bba0,'craft');
station('BUYER RADIO',5.8,2.15,0xc8a35e,'sell');
// Labels float above interaction stations.
function label(text,x,z){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='rgba(12,18,15,.84)';ctx.fillRect(0,0,512,96);ctx.strokeStyle='#bba66e';ctx.lineWidth=3;ctx.strokeRect(2,2,508,92);ctx.fillStyle='#f1e8d5';ctx.font='bold 34px monospace';ctx.textAlign='center';ctx.fillText(text,256,60);const t=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.45),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));m.position.set(x,2.05,z);scene.add(m);return m;}
label('SUPPLY A',-5.8, -.3);label('SUPPLY B',5.8,-.3);label('SUPPLY C',-5.8,2.1);label('CONTROL',0,-2.65);label('RADIO',5.8,2.15);
const state={cash:0,heat:0,supplies:0,batch:0,sold:0,collected:{a:false,b:false,c:false}};
const saveKey='rv-cookhouse-save-v1';try{const s=JSON.parse(localStorage.getItem(saveKey)||'null');if(s&&s.collected){Object.assign(state,s);}}catch{}
function save(){try{localStorage.setItem(saveKey,JSON.stringify(state));}catch{}}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2200);}
function update(){ $('cash').textContent='$'+state.cash.toLocaleString();$('heat').textContent='HEAT '+state.heat;$('supplies').textContent='SUPPLIES '+Object.values(state.collected).filter(Boolean).length+' / 3';$('batch').textContent='BATCH '+state.batch;$('partner').textContent='PARTNER: '+partner.replace(' PINKMAN','');if(state.batch>0){$('objective').textContent='Sell the finished batch';$('objective-sub').textContent='Use the buyer radio at the rear of the RV.';}else if(Object.values(state.collected).every(Boolean)){$('objective').textContent='Use the batch control';$('objective-sub').textContent='All sealed supplies are ready. Go to the workbench.';}else{$('objective').textContent='Collect the sealed supplies';$('objective-sub').textContent='Three marked supply cases are inside this RV.';}save();}
function start(r){role=r;partner=r==='heisenberg'?'JESSE PINKMAN':'HEISENBERG';activePlayer.position.set(r==='heisenberg'?-1.8:1.8,0,1.25);avatar.visible=true;avatar.children.forEach(c=>{if(c.material)c.material=mat(r==='heisenberg'?0x53616b:0x71816d);});if(r==='heisenberg'){walt.visible=false;jesse.visible=true;}else{jesse.visible=false;walt.visible=true;} $('select').classList.add('hidden');update();toast(r==='heisenberg'?'You are Heisenberg. Jesse is here with you.':'You are Jesse. Walt is here with you.');}
$('pick-walt').onclick=()=>start('heisenberg');$('pick-jesse').onclick=()=>start('jesse');
let near=null,dialog=false;const keys={};let yaw=0,drag=false,lastX=0;
function interact(){if(dialog||!near)return;const k=near.kind;
if(['a','b','c'].includes(k)){if(state.collected[k]){toast('That case is empty.');return;}state.collected[k]=true;toast('Sealed supply secured.');update();}
else if(k==='craft'){if(!Object.values(state.collected).every(Boolean)){toast('You still need all three sealed supply cases.');return;}if(state.batch){toast('A finished batch is already waiting for pickup.');return;}state.batch=1;state.heat+=2;toast('Batch completed. Check the radio for the next step.');update();}
else if(k==='sell'){if(!state.batch){toast('No finished batch. Use the batch control first.');return;}state.batch=0;state.cash+=role==='heisenberg'?900:780;state.heat+=role==='heisenberg'?5:4;state.sold++;state.collected={a:false,b:false,c:false};toast('The buyer confirmed the deal. Payment received.');update();}}
function setNear(){near=null;let best=2.35;for(const p of bins){const d=Math.hypot(activePlayer.position.x-p.pos.x,activePlayer.position.z-p.pos.z);if(d<best){best=d;near=p;}}if(near){$('prompt').classList.add('show');$('prompt-text').textContent=near.name;}else $('prompt').classList.remove('show');}
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE'||e.code==='Enter')interact();});window.addEventListener('keyup',e=>keys[e.code]=false);
renderer.domElement.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);});renderer.domElement.addEventListener('pointerup',()=>drag=false);renderer.domElement.addEventListener('pointercancel',()=>drag=false);renderer.domElement.addEventListener('pointermove',e=>{if(drag){yaw-=(e.clientX-lastX)*.003;lastX=e.clientX;}});
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));});$('touch-e').onclick=interact;
$('dialog-ok').onclick=()=>{$('dialog').classList.add('hidden');dialog=false;};
const clock=new THREE.Clock(),target=new THREE.Vector3(),desired=new THREE.Vector3();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(!$('select').classList.contains('hidden')){camera.position.set(0,9,13);camera.lookAt(0,1,0);}else{
const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);const v=new THREE.Vector3(Math.sin(yaw)*f+Math.cos(yaw)*s,0,Math.cos(yaw)*f-Math.sin(yaw)*s);if(v.lengthSq()){v.normalize();activePlayer.position.addScaledVector(v,dt*(role==='jesse'?3.4:2.8));activePlayer.position.x=THREE.MathUtils.clamp(activePlayer.position.x,-6.25,6.25);activePlayer.position.z=THREE.MathUtils.clamp(activePlayer.position.z,-3.15,3.1);activePlayer.rotation.y=Math.atan2(v.x,v.z);}
setNear();target.set(activePlayer.position.x,1.0,activePlayer.position.z);desired.set(activePlayer.position.x+Math.sin(yaw)*8,7.4,activePlayer.position.z+Math.cos(yaw)*9);camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(target);
}renderer.render(scene,camera);}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));});update();animate();setTimeout(()=>$('loading').classList.add('gone'),800);