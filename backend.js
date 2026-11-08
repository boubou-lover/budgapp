/* Adaptateur Supabase : fournit à app.js les mêmes fonctions que sur claude.ai (user, db, downloads).
   Si config.js n'est pas rempli ou si la connexion échoue, l'app reste en mode local. */
(function(){
 window.BUDGET_BACKEND='supabase';
 var C=window.BUDGET_CONFIG||{},sb=null,pend=null;
 var ST={getItem:function(k){try{return sessionStorage.getItem(k)||localStorage.getItem(k)}catch(e){return null}},
  setItem:function(k,v){try{(localStorage.getItem('budget_rm')==='0'?sessionStorage:localStorage).setItem(k,v)}catch(e){}},
  removeItem:function(k){try{sessionStorage.removeItem(k);localStorage.removeItem(k)}catch(e){}}};
 function why(m){window.BKS=m;try{console.warn('[Budget] '+m)}catch(e){}}
 function client(){
  if(sb)return sb;
  if(!window.supabase){why('bibliothèque Supabase introuvable (le dossier vendor/ est-il bien envoyé ?)');return null}
  if(!C.url||!C.anonKey||/VOTRE/.test(C.url+C.anonKey)){why('config.js absent ou non rempli');return null}
  var u=String(C.url).trim().replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');
  try{sb=window.supabase.createClient(u,String(C.anonKey).trim(),{auth:{storage:ST,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})}
  catch(e){why('configuration invalide : '+e.message);return null}
  return sb}
 function login(c){return new Promise(function(res){
  var d=document.createElement('div');d.id='lg';
  d.style.cssText='position:fixed;inset:0;z-index:60;background:var(--bg);color:var(--tx);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;font:15px system-ui,sans-serif';
  d.innerHTML='<div class="card" style="width:100%;max-width:340px;display:flex;flex-direction:column;gap:12px;margin:0"><img src="logo-256.png" alt="Budgapp" style="width:170px;height:170px;margin:0 auto"><input id="lge" type="email" autocomplete="username" placeholder="E-mail"><input id="lgp" type="password" autocomplete="current-password" placeholder="Mot de passe"><label style="display:flex;gap:8px;align-items:center;font-size:14px;color:var(--mu)"><input type="checkbox" id="lgr" checked style="width:auto"> Se souvenir de moi</label><button class="b" id="lgb">Se connecter</button><div id="lgm" class="neg" style="text-align:center"></div></div>';
  document.body.appendChild(d);try{document.getElementById('lge').value=localStorage.getItem('budget_em')||''}catch(e){}
  var go=async function(){var m=document.getElementById('lgm');m.textContent='';var rm=document.getElementById('lgr'),em=document.getElementById('lge').value.trim();try{localStorage.setItem('budget_rm',rm&&rm.checked?'1':'0');if(rm&&rm.checked)localStorage.setItem('budget_em',em);else localStorage.removeItem('budget_em')}catch(e){}
   try{var r=await c.auth.signInWithPassword({email:document.getElementById('lge').value.trim(),password:document.getElementById('lgp').value});
    if(r.error){m.textContent='Connexion refusée : '+r.error.message;return}
    d.remove();res(r.data.session)}catch(e){m.textContent='Réseau indisponible.'}};
  document.getElementById('lgb').onclick=go;
  document.getElementById('lgp').onkeydown=function(e){if(e.key==='Enter')go()}})}
 function session(){
  if(pend)return pend;
  pend=(async function(){var c=client();if(!c)return null;
   try{var r=await c.auth.getSession();if(r.data&&r.data.session)return r.data.session;
    if(r.error||navigator.onLine===false){why('Hors connexion : mode local, resynchronisation à la reconnexion');pend=null;return null}}
   catch(e){why('Supabase injoignable : '+(e&&e.message||e));pend=null;return null}
   return login(c)})();
  return pend}
 var DB={
  doc:function(path){var id=String(path).split('/').slice(1).join('/');
   return{
    set:async function(o){var r=await client().from('budget_docs').upsert({id:id,data:o,updated_at:new Date().toISOString()}).select('id');if(r.error)throw r.error;if(!r.data||!r.data.length)throw new Error('écriture non confirmée par le serveur')},
    get:async function(){var r=await client().from('budget_docs').select('data').eq('id',id).maybeSingle();if(r.error)throw r.error;return r.data?r.data.data:null}}},
  collection:function(){return{onSnapshot:function(cb,err){
   var load=async function(){var r=await client().from('budget_docs').select('id,data');
    if(r.error){if(err)err(r.error);return}
    cb({docs:r.data.map(function(x){return{id:x.id,data:function(){return x.data}}}),empty:!r.data.length})};
   load();
   var ch=client().channel('budget').on('postgres_changes',{event:'*',schema:'public',table:'budget_docs'},function(){load()}).subscribe();
   return function(){client().removeChannel(ch)}}}}};
 var DL={save:async function(o){var b=new Blob([o.data],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=o.filename;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}};
 window.claude={
  use:async function(n){
   if(n==='downloads')return DL;
   if(n!=='user'&&n!=='db')return null;
   var s=await session();if(!s)return null;
   if(n==='user')return{id:async function(){return s.user.id},isOwner:function(){return false},canEdit:function(){return true}};
   return DB},
  signOut:async function(){var c=client();if(c)await c.auth.signOut();location.reload()}};
})();
/* Mise en cache : l'app s'ouvre hors connexion (voir sw.js) */
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(e){console.warn('[Budget] cache indisponible',e)})})}
