/* ============================================================
   RED Monitor — app.js — v4.1.0
   - Fix "Lire en clair" (clic fiable)
   - Résumé réglementaire clair (fallback auto)
   - Version UI dynamique + badge stable
   ============================================================ */

var APP_VERSION = '4.1.0';
var DATE_FILTRE = new Date(2026, 5, 1); // 01/06/2026
var ALERT_SEEN_KEY = 'redmonitor_seen_ids_v3';
var newlyDetectedCount = 0;

var DATA = [
  {id:"red-1", cat:"eu_red", tag:"Normes RED", isNew:false, ref:"Directive 2014/53/UE — RED", title:"Directive RED — Equipements radioelectriques", date:"16/04/2014", apply:"13/06/2016", type:"Directive UE", applyDate:null, devices:["Smartphones","IoT"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014L0053", summary:"Texte fondateur RED."},
  {id:"cra-1", cat:"eu_related", tag:"Cybersecurite", isNew:true, ref:"Reglement (UE) 2024/2847", title:"Cyber Resilience Act — pleine application", date:"23/10/2024", apply:"11/12/2027", type:"Reglement UE", applyDate:new Date(2027,11,11), devices:["Smartphones","Routeurs","IoT"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847", summary:"Pleine application CRA."},
  {id:"data-1", cat:"eu_related", tag:"Donnees IoT", isNew:false, ref:"Reglement (UE) 2023/2854", title:"Data Act — portabilite IoT", date:"22/12/2023", apply:"12/09/2026", type:"Reglement UE", applyDate:new Date(2026,8,12), devices:["IoT","Wearables"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854", summary:"Portabilité des données."},
  {
    id:"ue-2025-1960",
    cat:"eu_related",
    tag:"Normes RED",
    isNew:true,
    ref:"Règlement d’exécution (UE) 2025/1960",
    title:"Règlement d’exécution UE 2025/1960",
    date:"2025",
    apply:"Il est applicable à partir du 27 septembre 2026",
    type:"Règlement d'exécution",
    applyDate:null,
    devices:["Equipements radio","IoT","Smartphones"],
    link:"",
    summary:"Article 3 : application à partir du 27/09/2026."
  }
];

var AGENDA = [
  {date:"11/09/2026", label:"CRA — Déclaration vulnérabilités", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"12/09/2026", label:"Data Act — Portabilité IoT", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854"},
  {date:"27/09/2026", label:"EmpCo — Anti-greenwashing", flags:"EU FR", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825"}
];

var currentTab='accueil';
var scanLoading=false;
var lastScan=fmtDate(new Date());
var nextScan=fmtDate(addDays(new Date(),7));
var openCards={};
var veilleFilter='tous';

function fmtDate(d){ var p=n=>String(n).padStart(2,'0'); return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes()); }
function addDays(d,n){ return new Date(d.getTime()+n*86400000); }
function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function parseFRDateStrict(str){
  var m=String(str||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!m) return null;
  var d=new Date(+m[3], +m[2]-1, +m[1]);
  return isNaN(d)?null:d;
}
function parseFRTextDate(str){
  var txt=(str||'').toLowerCase();
  var months={"janvier":0,"fevrier":1,"février":1,"mars":2,"avril":3,"mai":4,"juin":5,"juillet":6,"aout":7,"août":7,"septembre":8,"octobre":9,"novembre":10,"decembre":11,"décembre":11};
  var m=txt.match(/(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(20\d{2})/i);
  if(!m) return null;
  var d=new Date(parseInt(m[3],10), months[m[2]], parseInt(m[1],10));
  return isNaN(d)?null:d;
}
function parseApplyToDate(apply){
  var txt=String(apply||'');
  var d=parseFRDateStrict(txt); if(d) return d;
  var from=txt.match(/(?:a|à)\s+partir\s+du\s+(\d{2}\/\d{2}\/\d{4})/i); if(from) return parseFRDateStrict(from[1]);
  var any=txt.match(/(\d{2}\/\d{2}\/\d{4})/); if(any) return parseFRDateStrict(any[1]);
  var text=parseFRTextDate(txt); if(text) return text;
  var y=txt.match(/(20\d{2})/); if(y) return new Date(+y[1],11,31);
  return null;
}

function buildSmartSummary(reg){
  if(reg.summary && reg.summary.trim().length>=20) return reg.summary.trim();
  var bits = [];
  if(reg.type) bits.push(reg.type);
  if(reg.ref) bits.push(reg.ref);
  if(reg.apply) bits.push("Application : " + reg.apply);
  if(reg.devices && reg.devices.length) bits.push("Périmètre : " + reg.devices.join(", "));
  return bits.join(" — ") || "Résumé non disponible. Ouvre le texte officiel pour le détail.";
}

function computeDataFiltre(){
  return DATA.filter(function(d){
    var dt=d.applyDate instanceof Date ? d.applyDate : parseApplyToDate(d.apply);
    if(!dt) return true;
    return dt.getTime()>=DATE_FILTRE.getTime();
  });
}
var DATA_FILTRE=computeDataFiltre();

function currentIdsArray(items){ return Array.from(new Set((items||[]).map(x=>x.id).filter(Boolean))).sort(); }
function loadSeenIds(){ try{var r=localStorage.getItem(ALERT_SEEN_KEY); return r?JSON.parse(r):null;}catch(e){return null;} }
function saveSeenIds(ids){ try{localStorage.setItem(ALERT_SEEN_KEY, JSON.stringify(ids));}catch(e){} }
function diffCount(cur,prev){ var s=new Set(prev||[]), c=0; cur.forEach(function(id){if(!s.has(id)) c++;}); return c; }
function computeNewlyDetectedCountAndPersist(items){
  var cur=currentIdsArray(items), seen=loadSeenIds();
  if(seen===null){ newlyDetectedCount=0; saveSeenIds(cur); return; }
  newlyDetectedCount=diffCount(cur,seen); saveSeenIds(cur);
}
function markAlertsAsRead(){ newlyDetectedCount=0; saveSeenIds(currentIdsArray(DATA)); updateAlertBadges(); }
function updateAlertBadges(){
  var bell=document.getElementById('bell-count'), nav=document.getElementById('nav-badge');
  if(bell){ bell.textContent=String(newlyDetectedCount); bell.style.display=newlyDetectedCount>0?'flex':'none'; }
  if(nav){ nav.textContent=String(newlyDetectedCount); nav.style.display=newlyDetectedCount>0?'flex':'none'; }
}
function syncVersionLabels(){
  var nodes=document.querySelectorAll('[data-app-version]');
  nodes.forEach(function(n){ n.textContent='v'+APP_VERSION; });
  var sub=document.getElementById('header-subtitle');
  if(sub) sub.textContent=sub.textContent.replace(/v\d+(\.\d+){0,2}/i,'v'+APP_VERSION);
}

function setTab(tab){
  currentTab=tab;
  ['accueil','veille','alertes'].forEach(function(t){
    var panel=document.getElementById('tab-'+t), btn=document.getElementById('nav-'+t);
    if(panel) panel.classList.toggle('hidden', t!==tab);
    if(btn) btn.classList.toggle('active', t===tab);
  });
  if(tab==='alertes'){
    markAlertsAsRead();
    var b=document.getElementById('nav-badge'), bb=document.getElementById('bell-count');
    if(b) b.style.display='none';
    if(bb) bb.style.display='none';
  } else updateAlertBadges();
}

function handleScan(){
  if(scanLoading) return;
  scanLoading=true;
  var btn=document.getElementById('scan-btn');
  if(btn){btn.disabled=true;btn.textContent='Scan en cours...';}
  setTimeout(function(){
    var d=new Date(); lastScan=fmtDate(d); nextScan=fmtDate(addDays(d,7));
    scanLoading=false;
    renderAccueil(); renderVeille(); renderAlertes(); syncVersionLabels(); updateAlertBadges();
    if(btn){btn.disabled=false;btn.textContent='Scan';}
  },900);
}

function toggleCard(id){
  openCards[id]=!openCards[id];
  var box=document.getElementById('summary-'+id);
  var ar=document.getElementById('arrow-'+id);
  var lb=document.getElementById('lbl-'+id);
  if(box) box.classList.toggle('hidden', !openCards[id]);
  if(ar) ar.style.transform=openCards[id]?'rotate(90deg)':'rotate(0deg)';
  if(lb) lb.textContent=openCards[id]?'Masquer le résumé':'Lire en clair';
}
function setVeilleFilter(f){ veilleFilter=f; renderVeille(); }

function getNextDeadlineInfo(){
  var now=new Date();
  var cands=DATA_FILTRE.map(function(d){
    var dt=d.applyDate instanceof Date ? d.applyDate : parseApplyToDate(d.apply);
    return dt?{item:d,ts:dt.getTime()}:null;
  }).filter(Boolean).filter(function(x){return x.ts>=now.getTime();}).sort(function(a,b){return a.ts-b.ts;});
  if(!cands.length) return null;
  var n=cands[0], days=Math.ceil((n.ts-now.getTime())/86400000);
  return {reg:n.item,days:days};
}
function renderJxxTile(){
  var info=getNextDeadlineInfo(); if(!info) return '';
  var d=info.days, color=d<=7?'#e04f5f':d<=30?'#f59e0b':'#38bdf8', bg=d<=7?'#2a0d12':d<=30?'#2a1a00':'#0d2030', br=d<=7?'#5a1a22':d<=30?'#5a3a00':'#1a4060';
  return '<div class="card mb12" style="background:'+bg+';border:1px solid '+br+';border-left:3px solid '+color+'"><p class="fw7 fs11 mb8" style="color:'+color+'">⏰ PROCHAINE ÉCHÉANCE — J-'+d+'</p><p class="fs13 fw7 t-text">'+esc(info.reg.title||info.reg.ref||'Texte réglementaire')+'</p><p class="fs11 t-muted">Application : '+esc(info.reg.apply||'—')+'</p></div>';
}

function renderCard(reg){
  var acc=reg.cat==='eu_red'?'#4a7dff':(reg.cat==='fr'?'#e04f5f':'#38bdf8');
  var flag=reg.cat==='fr'?'FR':'EU';
  var isOpen=!!openCards[reg.id];
  var chips=(reg.isNew?'<span class="chip chip-new">Nouveau</span>':'')+'<span class="chip chip-'+reg.cat+'">'+flag+' '+esc(reg.tag||'Texte')+'</span>';
  var devices=(reg.devices||[]).map(function(d){return '<span class="dtag">'+esc(d)+'</span>';}).join('');
  var linkBtn=reg.link?'<a href="'+reg.link+'" target="_blank" rel="noopener" class="eur-link" style="background:'+acc+'">'+(reg.cat==='fr'?'Legifrance':'EUR-Lex')+' &rarr;</a>':'<span style="font-size:10px;color:#7a7f9a">Texte officiel non renseigné</span>';
  var smartSummary = buildSmartSummary(reg);

  return '<div class="card-reg card-reg-'+reg.cat+'">'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px">'+chips+'<span style="margin-left:auto;font-size:11px;color:#7a7f9a">'+esc(reg.date||'—')+'</span></div>'
    + '<p style="font-size:14px;font-weight:700;color:#e8eaf0;line-height:1.4;margin-bottom:4px">'+esc(reg.title||'')+'</p>'
    + '<p style="font-size:10px;color:#7a7f9a;margin-bottom:8px">'+esc(reg.ref||'')+' — '+esc(reg.type||'')+'</p>'
    + '<div style="display:flex;flex-wrap:wrap;margin-bottom:10px">'+devices+'</div>'
    + '<div class="date-pill"><span>Application :</span><span style="font-size:11px;font-weight:700;color:#a78bfa">'+esc(reg.apply||'À confirmer')+'</span></div>'
    + '<button type="button" class="summary-toggle" data-regid="'+esc(reg.id)+'" onclick="toggleCard(\''+reg.id+'\'); return false;" style="color:'+acc+';margin-top:10px;">'
    + '<i id="arrow-'+reg.id+'" class="arrow" style="transform:'+(isOpen?'rotate(90deg)':'rotate(0deg)')+'">&#9658;</i>'
    + '<span id="lbl-'+reg.id+'">'+(isOpen?'Masquer le résumé':'Lire en clair')+'</span>'
    + '</button>'
    + '<div id="summary-'+reg.id+'" class="summary-box'+(isOpen?'':' hidden')+'">'
    + '<p style="font-size:12px;color:#c0c4d8;line-height:1.7;margin-bottom:8px">'+esc(smartSummary)+'</p>'
    + linkBtn
    + '</div></div>';
}

function renderAccueil(){
  var agenda=AGENDA.map(function(e){
    return '<a href="'+e.link+'" target="_blank" rel="noopener" style="text-decoration:none"><div class="agenda-row"><div class="agenda-date"><p style="font-size:12px;font-weight:800;color:#a78bfa;margin:0">'+esc(e.date.slice(0,5))+'</p><p style="font-size:10px;color:#a78bfa;margin:0">'+esc(e.date.slice(6))+'</p></div><div style="flex:1"><p style="font-size:12px;font-weight:600;color:#e8eaf0;margin:0">'+esc(e.flags)+' '+esc(e.label)+'</p><p style="font-size:10px;color:#4a7dff;margin-top:2px">Voir le texte</p></div></div></a>';
  }).join('');
  document.getElementById('tab-accueil').innerHTML =
    '<div style="padding:14px 16px 90px"><div class="card card-green"><p class="fw7 fs12 t-green">'+DATA_FILTRE.length+' textes surveillés — échéances après 01/06/2026</p></div><div class="card-plain mb16" style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><p class="fw7 fs13 t-text mb6">Scraping hebdomadaire</p><p class="fs11 t-muted">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted">Prochain scan : <span class="t-warn">'+nextScan+'</span></p><p class="fs10 t-muted">Version : v'+APP_VERSION+'</p></div><button id="scan-btn" class="scan-btn" onclick="handleScan()">'+(scanLoading?'En cours...':'Scan')+'</button></div><p class="section-label">CALENDRIER DES ÉCHÉANCES</p>'+agenda+'</div>';
}

function renderVeille(){
  var groups=[{key:'eu_red',label:'TEXTES RED (2014/53/UE)',color:'#4a7dff'},{key:'eu_related',label:'REGLEMENTATIONS CONNEXES',color:'#38bdf8'},{key:'fr',label:'TRANSPOSITIONS DROIT FRANCAIS',color:'#e04f5f'}];
  var filters=[{key:'tous',label:'Tous'},{key:'eu_red',label:'RED stricte'},{key:'eu_related',label:'Connexes EU'},{key:'fr',label:'Droit FR'}];
  var filterBtns=filters.map(function(f){return '<button class="filter-btn '+(veilleFilter===f.key?'active':'')+'" onclick="setVeilleFilter(\''+f.key+'\')">'+f.label+'</button>';}).join('');
  var shown=veilleFilter==='tous'?groups:groups.filter(function(g){return g.key===veilleFilter;});
  var html=shown.map(function(g){
    var cards=DATA_FILTRE.filter(function(r){return r.cat===g.key;}).map(renderCard).join('');
    return '<p class="section-label" style="color:'+g.color+'">'+g.label+'</p>'+(cards||'<p class="fs12 t-muted" style="padding:8px 0 14px">Aucun texte</p>');
  }).join('');
  document.getElementById('tab-veille').innerHTML =
    '<div style="padding:14px 16px 90px"><div class="card-plain mb12"><p class="fs11 t-muted">Version interface : <span class="t-green">v'+APP_VERSION+'</span></p></div>'+renderJxxTile()+'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">'+filterBtns+'</div>'+html+'</div>';
}

function renderAlertes(){
  document.getElementById('tab-alertes').innerHTML =
    '<div style="padding:14px 16px 90px"><div class="card-plain"><p class="fw7 fs12 t-text mb8">Statut scraping</p><p class="fs11 t-muted">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted">Prochain scan : <span class="t-warn">'+nextScan+'</span></p><p class="fs10 t-muted">Version : v'+APP_VERSION+'</p></div></div>';
}

function normalizeDynamicItem(d){
  var i=Object.assign({}, d);
  i.id=i.id||('dyn-'+Math.random().toString(36).slice(2));
  i.title=i.title||i.ref||'Texte détecté';
  i.ref=i.ref||i.title;
  i.type=i.type||'Acte UE';
  i.tag=i.tag||'Normes RED';
  i.date=i.date||'—';
  i.apply=i.apply||'À confirmer';
  i.summary=i.summary||'';
  i.devices=Array.isArray(i.devices)?i.devices:['Smartphones','IoT'];
  i.isNew=!!i.isNew;
  i.cat=i.cat||'eu_related';
  if(!(i.applyDate instanceof Date)) i.applyDate=parseApplyToDate(i.apply);
  return i;
}
function rebuildFromDynamic(dynamicItems){
  var ids=DATA.map(function(d){return d.id;});
  var newOnly=(dynamicItems||[]).map(normalizeDynamicItem).filter(function(d){return !ids.includes(d.id);});
  if(newOnly.length) DATA=newOnly.concat(DATA);
  DATA_FILTRE=computeDataFiltre();
}
function applyScanMeta(meta){
  if(!meta || !meta.lastScan) return;
  var d=new Date(meta.lastScan);
  if(!isNaN(d)){ lastScan=fmtDate(d); nextScan=fmtDate(addDays(d,7)); }
}

document.addEventListener('DOMContentLoaded', function(){
  var bell=document.getElementById('bell-btn');
  var navA=document.getElementById('nav-accueil');
  var navV=document.getElementById('nav-veille');
  var navAl=document.getElementById('nav-alertes');

  if(bell) bell.addEventListener('click', function(){setTab('alertes');});
  if(navA) navA.addEventListener('click', function(){setTab('accueil');});
  if(navV) navV.addEventListener('click', function(){setTab('veille');});
  if(navAl) navAl.addEventListener('click', function(){setTab('alertes');});

  renderAccueil();
  renderVeille();
  renderAlertes();
  syncVersionLabels();

  computeNewlyDetectedCountAndPersist(DATA);
  updateAlertBadges();

  Promise.allSettled([
    fetch('scan-meta.json?v='+Date.now(), {cache:'no-store'}).then(function(r){return r.ok?r.json():null;}),
    fetch('data.json?v='+Date.now(), {cache:'no-store'}).then(function(r){return r.ok?r.json():[];})
  ]).then(function(res){
    var meta=res[0].status==='fulfilled'?res[0].value:null;
    var dyn=res[1].status==='fulfilled'?res[1].value:[];
    if(meta) applyScanMeta(meta);
    if(Array.isArray(dyn) && dyn.length) rebuildFromDynamic(dyn);

    DATA_FILTRE=computeDataFiltre();
    computeNewlyDetectedCountAndPersist(DATA);

    renderAccueil();
    renderVeille();
    renderAlertes();
    syncVersionLabels();
    updateAlertBadges();
  });
});
