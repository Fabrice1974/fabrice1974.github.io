/* ============================================================
   RED Monitor — app.js — v4.0.6
   - Correction parsing "applicable à partir du JJ/MM/AAAA"
   - Badge alertes stable
   ============================================================ */

var APP_VERSION = '4.0';
var DATE_FILTRE = new Date(2026, 5, 1); // 01/06/2026

var ALERT_SEEN_KEY = 'redmonitor_seen_ids_v3';
var newlyDetectedCount = 0;

// --- DATA (inchangée pour l'exemple, garde ta base actuelle)
var DATA = window.DATA || []; // si tu gardes la DATA en dur, remets-la ici
var AGENDA = window.AGENDA || [];

// state
var currentTab='accueil';
var scanLoading=false;
var lastScan=fmtDate(new Date());
var nextScan=fmtDate(addDays(new Date(),7));
var scanLog=[];
var openCards={};
var veilleFilter='tous';
var prefs={red_normes:true,cra:true,espr:true,data_act:true,ai_act:true,empco:true,fr_transpo:true,rien_nouveau:true,rappel_j60:true,rappel_j30:true};

// utils
function fmtDate(d){var p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());}
function addDays(d,n){return new Date(d.getTime()+n*86400000);}
function esc(s){return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function parseFRDateStrict(str){
  var m=String(str||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!m) return null;
  var d=new Date(+m[3],+m[2]-1,+m[1]);
  return isNaN(d)?null:d;
}

/**
 * Parse robuste de date d'application :
 * - JJ/MM/AAAA
 * - "01/08/2025 au 10/12/2027" -> prend 1ère date
 * - "applicable à partir du 27/09/2026" -> 27/09/2026
 * - "application ... 27/09/2026"
 * - "Horizon 2027"
 * - fallback sur première date trouvée dans la chaîne
 */
function parseApplyToDate(apply){
  var txt=(apply||'').toString().trim();
  if(!txt) return null;

  // 1) date pure
  var d=parseFRDateStrict(txt);
  if(d) return d;

  // 2) intervalle
  var r=txt.match(/(\d{2}\/\d{2}\/\d{4}).*(\d{2}\/\d{2}\/\d{4})/i);
  if(r) return parseFRDateStrict(r[1]);

  // 3) formulations "applicable à partir du ..."
  var appFrom=txt.match(/applicab(?:le|ilité)?(?:\s+\w+){0,6}?\s(?:a|à)\s+partir\s+du\s+(\d{2}\/\d{2}\/\d{4})/i);
  if(appFrom) return parseFRDateStrict(appFrom[1]);

  // 4) formulations "application ... JJ/MM/AAAA"
  var appDate=txt.match(/application(?:\s+\w+){0,8}?(\d{2}\/\d{2}\/\d{4})/i);
  if(appDate) return parseFRDateStrict(appDate[1]);

  // 5) fallback : 1ère date trouvée dans le texte
  var anyDate=txt.match(/(\d{2}\/\d{2}\/\d{4})/);
  if(anyDate) return parseFRDateStrict(anyDate[1]);

  // 6) Horizon 2027 / 2027-2028
  var h=txt.match(/Horizon\s+(\d{4})/i);
  if(h) return new Date(+h[1],6,1);

  // 7) année seule
  var y=txt.match(/(20\d{2})/);
  if(y) return new Date(+y[1],11,31);

  return null;
}

function computeDataFiltre(){
  return (DATA||[]).filter(function(d){
    var dt=d.applyDate instanceof Date?d.applyDate:parseApplyToDate(d.apply);
    // Important: on conserve aussi les textes sans date parseable en Veille
    if(!dt) return true;
    return dt.getTime()>=DATE_FILTRE.getTime();
  });
}
var DATA_FILTRE=computeDataFiltre();

function currentIdsArray(items){
  var ids=(items||[]).map(function(x){return x&&x.id?String(x.id):null;}).filter(Boolean);
  return Array.from(new Set(ids)).sort();
}
function loadSeenIds(){try{var raw=localStorage.getItem(ALERT_SEEN_KEY);return raw?JSON.parse(raw):null;}catch(e){return null;}}
function saveSeenIds(idsArray){try{localStorage.setItem(ALERT_SEEN_KEY,JSON.stringify(idsArray));}catch(e){}}
function diffCount(newArr, oldArr){var oldSet=new Set(oldArr||[]),c=0;for(var i=0;i<newArr.length;i++){if(!oldSet.has(newArr[i])) c++;}return c;}
function computeNewlyDetectedCountAndPersist(items){
  var current=currentIdsArray(items), seen=loadSeenIds();
  if(seen===null){newlyDetectedCount=0;saveSeenIds(current);return;}
  newlyDetectedCount=diffCount(current,seen); saveSeenIds(current);
}
function markAlertsAsRead(){newlyDetectedCount=0;saveSeenIds(currentIdsArray(DATA));updateAlertBadges();}
function updateAlertBadges(){
  var bell=document.getElementById('bell-count'), nav=document.getElementById('nav-badge');
  if(bell){bell.textContent=String(newlyDetectedCount); bell.style.display=newlyDetectedCount>0?'flex':'none';}
  if(nav){nav.textContent=String(newlyDetectedCount); nav.style.display=newlyDetectedCount>0?'flex':'none';}
}

function setTab(tab){
  currentTab=tab;
  ['accueil','veille','alertes'].forEach(function(t){
    var panel=document.getElementById('tab-'+t), btn=document.getElementById('nav-'+t);
    if(panel) panel.classList.toggle('hidden',t!==tab);
    if(btn) btn.classList.toggle('active',t===tab);
  });
  if(tab==='alertes'){ markAlertsAsRead(); } else { updateAlertBadges(); }
}

function handleScan(){
  if(scanLoading) return;
  scanLoading=true;
  var btn=document.getElementById('scan-btn');
  if(btn){btn.disabled=true;btn.textContent='Scan en cours...';}
  setTimeout(function(){
    var d=new Date(); lastScan=fmtDate(d); nextScan=fmtDate(addDays(d,7));
    scanLog=scanLog.concat([{date:lastScan,hasNew:false}]).slice(-20);
    scanLoading=false;
    renderAccueil(); renderAlertes(); updateAlertBadges();
    if(btn){btn.disabled=false;btn.textContent='Scan';}
  },1000);
}

function toggleCard(id){
  openCards[id]=!openCards[id];
  var box=document.getElementById('summary-'+id), arr=document.getElementById('arrow-'+id), lbl=document.getElementById('lbl-'+id);
  if(box) box.classList.toggle('hidden',!openCards[id]);
  if(arr) arr.style.transform=openCards[id]?'rotate(90deg)':'rotate(0deg)';
  if(lbl) lbl.textContent=openCards[id]?'Masquer le resume':'Lire en clair';
}
function togglePref(key){
  prefs[key]=!prefs[key];
  var sw=document.getElementById('sw-'+key);
  if(sw){
    sw.classList.toggle('switch-on',prefs[key]); sw.classList.toggle('switch-off',!prefs[key]);
    var k=sw.querySelector('.switch-knob'); if(k) k.style.left=prefs[key]?'23px':'3px';
  }
}
function setVeilleFilter(f){veilleFilter=f;renderVeille();}

// Renders (identiques à ta version — gardés compacts ici)
function renderAccueil(){ var el=document.getElementById('tab-accueil'); if(el) el.innerHTML='<div style="padding:14px 16px 90px"><p class="section-label t-muted">Accueil</p></div>'; }
function renderVeille(){
  var el=document.getElementById('tab-veille'); if(!el) return;
  var shown = DATA_FILTRE;
  if(veilleFilter!=='tous') shown = shown.filter(function(x){ return x.cat===veilleFilter; });
  var html = '<div style="padding:14px 16px 90px"><p class="section-label t-muted">VEILLE</p>';
  html += shown.map(function(x){
    return '<div class="card-plain" style="margin-bottom:10px"><p class="fw7 fs12">'+esc(x.title||x.ref||x.id)+'</p><p class="fs11 t-muted">Application: '+esc(x.apply||'—')+'</p></div>';
  }).join('');
  html += '</div>';
  el.innerHTML = html;
}
function renderAlertes(){ var el=document.getElementById('tab-alertes'); if(el) el.innerHTML='<div style="padding:14px 16px 90px"><p class="section-label t-muted">ALERTES</p></div>'; }

function normalizeDynamicItem(d){
  var i=Object.assign({},d);
  i.id=i.id||('dyn-'+Math.random().toString(36).slice(2));
  i.title=i.title||i.ref||'Texte détecté';
  i.ref=i.ref||i.title;
  i.type=i.type||(i.cat==='fr'?'Texte national':'Acte UE');
  i.tag=i.tag||(i.cat==='fr'?'Transposition FR':'Normes RED');
  i.date=i.date||'—';
  i.apply=i.apply||'À confirmer — voir texte officiel';
  i.summary=i.summary||'Texte détecté automatiquement.';
  i.devices=Array.isArray(i.devices)?i.devices:['Smartphones','IoT','Wearables'];
  i.isNew=!!i.isNew;

  if(!i.cat){
    var t=(i.title+' '+i.type).toLowerCase();
    if(/(france|jorf|decret|arrete|ordonnance|national)/.test(t)) i.cat='fr';
    else if(/(etsi|norme)/.test(t)) i.cat='eu_red';
    else i.cat='eu_related';
  }

  if(!(i.applyDate instanceof Date)) i.applyDate=parseApplyToDate(i.apply);
  return i;
}
function rebuildFromDynamic(dynamicItems){
  var ids=(DATA||[]).map(function(d){return d.id;});
  var newOnly=(dynamicItems||[]).map(normalizeDynamicItem).filter(function(d){return !ids.includes(d.id);});
  if(newOnly.length){ DATA=newOnly.concat(DATA); }
  DATA_FILTRE=computeDataFiltre();
}
function applyScanMeta(meta){
  if(!meta||!meta.lastScan) return;
  var d=new Date(meta.lastScan);
  if(!isNaN(d.getTime())){ lastScan=fmtDate(d); nextScan=fmtDate(addDays(d,7)); }
}

document.addEventListener('DOMContentLoaded', function(){
  var bellBtn=document.getElementById('bell-btn');
  var navAccueil=document.getElementById('nav-accueil');
  var navVeille=document.getElementById('nav-veille');
  var navAlertes=document.getElementById('nav-alertes');

  if(bellBtn) bellBtn.addEventListener('click',function(){setTab('alertes');});
  if(navAccueil) navAccueil.addEventListener('click',function(){setTab('accueil');});
  if(navVeille) navVeille.addEventListener('click',function(){setTab('veille');});
  if(navAlertes) navAlertes.addEventListener('click',function(){setTab('alertes');});

  renderAccueil(); renderVeille(); renderAlertes();
  computeNewlyDetectedCountAndPersist(DATA); updateAlertBadges();

  Promise.allSettled([
    fetch('scan-meta.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok) throw new Error('scan-meta HTTP '+r.status); return r.json();}),
    fetch('data.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok) throw new Error('data HTTP '+r.status); return r.json();})
  ]).then(function(res){
    var meta=res[0].status==='fulfilled'?res[0].value:null;
    var dyn=res[1].status==='fulfilled'?res[1].value:[];
    if(meta) applyScanMeta(meta);
    if(Array.isArray(dyn)&&dyn.length) rebuildFromDynamic(dyn);

    // recalcul avec nouveau parsing
    DATA_FILTRE=computeDataFiltre();
    computeNewlyDetectedCountAndPersist(DATA);

    renderAccueil(); renderVeille(); renderAlertes(); updateAlertBadges();
  });
});
