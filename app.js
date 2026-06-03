/* RED Monitor — app.js — v4.2.3 */
var APP_VERSION='4.2.3';
var DATE_FILTRE=new Date(2026,5,1);
var ALERT_SEEN_KEY='redmonitor_seen_ids_v3';
var newlyDetectedCount=0;

var EXCLUDED_CELEX = ['32022R1925','32022R2065','32009L0125']; // DMA, DSA, old Ecodesign
var EXCLUDED_KEYWORDS = [' dma ',' dsa ','digital services act','digital markets act'];

var DATA=[]; // garde ton DATA actuel si tu veux, ou laisse vide + data.json
var AGENDA=[];

var currentTab='accueil', scanLoading=false, lastScan=fmtDate(new Date()), nextScan=fmtDate(addDays(new Date(),7));
var openCards={}, veilleFilter='tous', prefs={red_normes:true,cra:true,espr:true,data_act:true,ai_act:true,empco:true,fr_transpo:true,rien_nouveau:true,rappel_j60:true,rappel_j30:true};

function fmtDate(d){var p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());}
function addDays(d,n){return new Date(d.getTime()+n*86400000);}
function esc(s){return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function parseFRDateStrict(str){var m=String(str||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return null;var d=new Date(+m[3],+m[2]-1,+m[1]);return isNaN(d)?null:d;}
function parseFRTextDate(str){var t=(str||'').toLowerCase();var M={"janvier":0,"fevrier":1,"février":1,"mars":2,"avril":3,"mai":4,"juin":5,"juillet":6,"aout":7,"août":7,"septembre":8,"octobre":9,"novembre":10,"decembre":11,"décembre":11};var m=t.match(/(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(20\d{2})/i);if(!m)return null;var d=new Date(+m[3],M[m[2]],+m[1]);return isNaN(d)?null:d;}
function parseApplyToDate(apply){var txt=String(apply||'');var d=parseFRDateStrict(txt);if(d)return d;var from=txt.match(/(?:a|à)\s+partir\s+du\s+(\d{2}\/\d{2}\/\d{4})/i);if(from)return parseFRDateStrict(from[1]);var any=txt.match(/(\d{2}\/\d{2}\/\d{4})/);if(any)return parseFRDateStrict(any[1]);var td=parseFRTextDate(txt);if(td)return td;var y=txt.match(/(20\d{2})/);if(y)return new Date(+y[1],11,31);return null;}
function getApplyDate(r){return r.applyDate instanceof Date?r.applyDate:parseApplyToDate(r.apply);}

function textBlob(r){return (' '+(r.id||'')+' '+(r.title||'')+' '+(r.ref||'')+' '+(r.tag||'')+' '+(r.type||'')+' '+(r.link||'')+' ').toLowerCase();}
function isExcludedReg(r){
  var t=textBlob(r);
  for(var i=0;i<EXCLUDED_CELEX.length;i++){ if(t.indexOf(EXCLUDED_CELEX[i].toLowerCase())!==-1) return true; }
  for(var j=0;j<EXCLUDED_KEYWORDS.length;j++){ if(t.indexOf(EXCLUDED_KEYWORDS[j])!==-1) return true; }
  return false;
}

function computeDataFiltre(){
  return (DATA||[]).filter(function(r){
    if(isExcludedReg(r)) return false;
    var dt=getApplyDate(r);
    if(!dt) return true;
    return dt.getTime()>=DATE_FILTRE.getTime();
  });
}
var DATA_FILTRE=computeDataFiltre();

function renderAccueil(){document.getElementById('tab-accueil').innerHTML='<div style="padding:14px 16px 90px"><div class="card card-green"><p class="fw7 fs12 t-green">'+DATA_FILTRE.length+' textes surveillés</p></div></div>';}
function toggleCard(id){openCards[id]=!openCards[id];var b=document.getElementById('summary-'+id),a=document.getElementById('arrow-'+id),l=document.getElementById('lbl-'+id);if(b)b.classList.toggle('hidden',!openCards[id]);if(a)a.style.transform=openCards[id]?'rotate(90deg)':'rotate(0deg)';if(l)l.textContent=openCards[id]?'Masquer le résumé':'Lire en clair';}
function smartSummary(r){if(r.id==='red-1') return "La directive RED impose exigences essentielles sécurité, CEM, spectre radio, conformité CE et documentation technique."; return (r.summary&&r.summary.trim())?r.summary:((r.type||'Texte')+' — '+(r.ref||r.title||''));}
function renderCard(r){
  var isOpen=!!openCards[r.id], acc=r.cat==='eu_red'?'#4a7dff':r.cat==='fr'?'#e04f5f':'#38bdf8';
  var link=r.link?'<a href="'+r.link+'" target="_blank" rel="noopener" class="eur-link" style="background:'+acc+'">EUR-Lex &rarr;</a>':'<span style="font-size:10px;color:#7a7f9a">Texte non publié</span>';
  return '<div class="card-reg card-reg-'+(r.cat||'eu_related')+'"><p style="font-size:14px;font-weight:700">'+esc(r.title||'')+'</p><p style="font-size:10px;color:#7a7f9a">'+esc(r.ref||'')+'</p><div class="date-pill"><span>Application :</span><span style="font-size:11px;font-weight:700;color:#a78bfa">'+esc(r.apply||'À confirmer')+'</span></div><button type="button" data-action="toggle-summary" data-id="'+esc(r.id)+'" class="summary-toggle" style="color:'+acc+'"><i id="arrow-'+r.id+'" class="arrow" style="transform:'+(isOpen?'rotate(90deg)':'rotate(0deg)')+'">&#9658;</i><span id="lbl-'+r.id+'">'+(isOpen?'Masquer le résumé':'Lire en clair')+'</span></button><div id="summary-'+r.id+'" class="summary-box'+(isOpen?'':' hidden')+'"><p style="font-size:12px;line-height:1.7">'+esc(smartSummary(r))+'</p>'+link+'</div></div>';
}
function renderVeille(){
  var arr=DATA_FILTRE.slice();
  var html=arr.map(renderCard).join('')||'<p class="fs12 t-muted">Aucun texte à surveiller</p>';
  document.getElementById('tab-veille').innerHTML='<div style="padding:14px 16px 90px"><p class="fs10 t-muted" style="margin-bottom:8px">'+arr.length+' textes à surveiller (DMA/DSA exclus)</p>'+html+'</div>';
}
function renderAlertes(){document.getElementById('tab-alertes').innerHTML='<div style="padding:14px 16px 90px"><div class="card-plain"><p class="fw7 fs12">Alertes</p><p class="fs11 t-muted">Version : v'+APP_VERSION+'</p></div></div>';}

function setTab(tab){
  currentTab=tab;['accueil','veille','alertes'].forEach(function(t){var p=document.getElementById('tab-'+t),b=document.getElementById('nav-'+t);if(p)p.classList.toggle('hidden',t!==tab);if(b)b.classList.toggle('active',t===tab);});
}
document.addEventListener('click',function(ev){var btn=ev.target.closest('[data-action="toggle-summary"]');if(!btn)return;ev.preventDefault();toggleCard(btn.getAttribute('data-id'));});

function normalizeDynamicItem(d){
  var i=Object.assign({},d);
  i.id=i.id||('dyn-'+Math.random().toString(36).slice(2));
  i.title=i.title||i.ref||'Texte détecté';
  i.ref=i.ref||i.title;
  i.type=i.type||'Acte UE';
  i.tag=i.tag||'Normes RED';
  i.apply=i.apply||'À confirmer — voir texte officiel';
  if(!(i.applyDate instanceof Date)) i.applyDate=parseApplyToDate(i.apply);
  i.cat=i.cat||'eu_related';
  return i;
}
function rebuildFromDynamic(items){
  var inArr=(items||[]).map(normalizeDynamicItem);
  DATA=inArr.concat(DATA||[]);
  DATA = DATA.filter(function(v,i,a){return a.findIndex(function(x){return x.id===v.id;})===i;});
  DATA_FILTRE=computeDataFiltre();
}

document.addEventListener('DOMContentLoaded',function(){
  var navA=document.getElementById('nav-accueil'), navV=document.getElementById('nav-veille'), navAl=document.getElementById('nav-alertes'), bell=document.getElementById('bell-btn');
  if(navA)navA.addEventListener('click',function(){setTab('accueil');});
  if(navV)navV.addEventListener('click',function(){setTab('veille');});
  if(navAl)navAl.addEventListener('click',function(){setTab('alertes');});
  if(bell)bell.addEventListener('click',function(){setTab('alertes');});

  Promise.allSettled([
    fetch('data.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok) throw new Error(); return r.json();})
  ]).then(function(res){
    var dyn=res[0].status==='fulfilled'?res[0].value:[];
    if(Array.isArray(dyn)&&dyn.length) rebuildFromDynamic(dyn);
    DATA_FILTRE=computeDataFiltre();
    renderAccueil();renderVeille();renderAlertes();setTab('accueil');
    console.log('[Filter] exclusions actives:', EXCLUDED_CELEX.join(', '));
  });
});
