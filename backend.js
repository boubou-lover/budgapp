/* Adaptateur Supabase : fournit à app.js les mêmes fonctions que sur claude.ai (user, db, downloads).
   Si config.js n'est pas rempli ou si la connexion échoue, l'app reste en mode local. */
(function(){
 var C=window.BUDGET_CONFIG||{},sb=null,pend=null;
 function client(){
  if(sb)return sb;
  if(!window.supabase||!C.url||!C.anonKey||/VOTRE/.test(C.url+C.anonKey))return null;
  sb=window.supabase.createClient(C.url,C.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  return sb}
 function login(c){return new Promise(function(res){
  var d=document.createElement('div');d.id='lg';
  d.style.cssText='position:fixed;inset:0;z-index:60;background:var(--bg);color:var(--tx);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;font:15px system-ui,sans-serif';
  d.innerHTML='<h1 style="margin:0">💶 Mon Budget</h1><input id="lge" type="email" autocomplete="username" placeholder="E-mail" style="width:100%;max-width:300px"><input id="lgp" type="password" autocomplete="current-password" placeholder="Mot de passe" style="width:100%;max-width:300px"><button class="b" id="lgb" style="width:100%;max-width:300px">Se connecter</button><div id="lgm" class="neg"></div>';
  document.body.appendChild(d);
  var go=async function(){var m=document.getElementById('lgm');m.textContent='';
   try{var r=await c.auth.signInWithPassword({email:document.getElementById('lge').value.trim(),password:document.getElementById('lgp').value});
    if(r.error){m.textContent='Connexion refusée : '+r.error.message;return}
    d.remove();res(r.data.session)}catch(e){m.textContent='Réseau indisponible.'}};
  document.getElementById('lgb').onclick=go;
  document.getElementById('lgp').onkeydown=function(e){if(e.key==='Enter')go()}})}
 function session(){
  if(pend)return pend;
  pend=(async function(){var c=client();if(!c)return null;
   try{var r=await c.auth.getSession();if(r.data&&r.data.session)return r.data.session}catch(e){}
   return login(c)})();
  return pend}
 var DB={
  doc:function(path){var id=String(path).split('/').slice(1).join('/');
   return{set:async function(o){var r=await client().from('budget_docs').upsert({id:id,data:o,updated_at:new Date().toISOString()});if(r.error)throw r.error}}},
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
