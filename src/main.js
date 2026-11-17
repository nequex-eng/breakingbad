import './style.css';
const $=id=>document.getElementById(id),KEY='abq-operation-simple-v1';
const fresh=()=>({role:'heisenberg',cash:0,heat:0,round:1,a:0,b:0,c:0,batches:0,sales:0});
let state=fresh();try{const old=JSON.parse(localStorage.getItem(KEY)||'null');if(old&&['heisenberg','jesse'].includes(old.role))state={...fresh(),...old};}catch{}
const goal=()=>state.sales>=5?5000:state.sales>=3?3000:state.sales>=1?1000:500;
const need=()=>state.role==='jesse'?2:1;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function say(s){$('message').textContent=s;}
function render(){
 $('cash').textContent='$'+state.cash.toLocaleString('en-US');
 $('role').textContent=state.role==='heisenberg'?'HEISENBERG · WALTER WHITE':'JESSE PINKMAN';
 $('round').textContent='ROUND '+state.round;$('heat').textContent='HEAT '+state.heat;
 $('a-count').textContent=state.a;$('b-count').textContent=state.b;$('c-count').textContent=state.c;
 $('batch-copy').textContent=state.batches+' finished batch'+(state.batches===1?'':'es')+' ready to sell.';
 if(!state.batches)$('batch-copy').textContent='No finished batches yet.';
 $('craft-copy').textContent='Requires '+need()+' of each component.';
 $('craft').disabled=state.a<need()||state.b<need()||state.c<need();$('sell').disabled=state.batches<1;
 const target=goal();$('goal').textContent=state.sales>=5?'Operation complete':'Earn $'+target.toLocaleString('en-US');
 $('instruction').textContent=state.sales>=5?'You built a successful operation. Keep playing or start over.': 'Sell batches and reach the next cash target. '+state.sales+' sale'+(state.sales===1?'':'s')+' completed.';
 $('progress').style.width=Math.min(100,state.cash/target*100)+'%';
 ['a','b','c'].forEach(k=>{$('collect-'+k).disabled=state[k]>=need()*3;});save();
}
function start(role){state=fresh();state.role=role;$('select').classList.add('hidden');$('game').classList.remove('hidden');say(role==='heisenberg'?'Heisenberg selected. Quality is your advantage.':'Jesse selected. You collect supplies faster.');render();}
$('heisenberg').onclick=()=>start('heisenberg');$('jesse').onclick=()=>start('jesse');
for(const k of ['a','b','c'])$('collect-'+k).onclick=()=>{const amount=need();state[k]=Math.min(need()*3,state[k]+amount);say('Collected '+amount+' component '+k.toUpperCase()+'.');render();};
$('craft').onclick=()=>{const n=need();if(state.a<n||state.b<n||state.c<n)return;state.a-=n;state.b-=n;state.c-=n;state.batches++;state.quality=state.role==='heisenberg'?90+Math.floor(Math.random()*9):70+Math.floor(Math.random()*16);say('Batch ready. Quality score: '+state.quality+'/100.');render();};
$('sell').onclick=()=>{if(!state.batches)return;const quality=state.quality||75,price=Math.round((state.role==='heisenberg'?300:340)+quality*8);state.batches--;state.cash+=price;state.sales++;state.heat=Math.min(100,state.heat+(state.role==='heisenberg'?5:7));state.round++;say('Sale complete: +$'+price.toLocaleString('en-US')+'. Your next target is $'+goal().toLocaleString('en-US')+'.');render();};
$('reset').onclick=()=>{if(!confirm('Start a new game? Your current progress will be cleared.'))return;state=fresh();$('game').classList.add('hidden');$('select').classList.remove('hidden');save();};
if(state.cash||state.sales||state.a||state.b||state.c||state.batches){$('select').classList.add('hidden');$('game').classList.remove('hidden');render();say('Welcome back. Your progress has been saved on this device.');}