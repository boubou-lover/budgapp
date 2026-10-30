/* Hors claude.ai : pas de base partagée (données gardées sur l'appareil) ; l'export télécharge un fichier. */
window.claude=window.claude||{use:async function(n){
  if(n==='downloads')return{save:async function(o){var b=new Blob([o.data],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=o.filename;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}};
  return null}};
