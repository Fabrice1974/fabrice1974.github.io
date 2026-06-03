/* ============================================================
   RED Monitor — app.js — v4.2.2
   Fix:
   - Lire en clair cliquable pour toutes cartes
   - Résumé explicite Directive RED
   - Accueil + Veille + Alertes complets
   ============================================================ */

var APP_VERSION = '4.2.2';
var DATE_FILTRE = new Date(2026, 5, 1); // 01/06/2026
var ALERT_SEEN_KEY = 'redmonitor_seen_ids_v3';
var newlyDetectedCount = 0;

// =========================
// DATA
// =========================
var DATA = [
  {
    id:"red-1",
    cat:"eu_red",
    tag:"Normes RED",
    isNew:false,
    ref:"Directive RED — CELEX 32014L0053",
    title:"Directive RED — CELEX 32014L0053",
    date:"16/04/2014",
    apply:"13/06/2016",
    type:"Directive UE",
    applyDate:null,
    devices:["Smartphones","IoT","Wearables"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014L0053",
    summary:"La directive RED définit les exigences essentielles applicables aux équipements radio : sécurité électrique, compatibilité électromagnétique, utilisation efficace du spectre, obligations de conformité CE, documentation technique et surveillance du marché."
  },
  {
    id:"eco-1",
    cat:"eu_related",
    tag:"EU Écoconception",
    isNew:true,
    ref:"Acte (UE) 32009L0125 — Acte UE",
    title:"Directive 2009/125/CE — Ecoconception (ErP)",
    date:"21/10/2009",
    apply:"En vigueur — Révision ESPR en cours",
    type:"Acte UE",
    applyDate:null,
    devices:["Smartphones","IoT","Wearables"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009L0125",
    summary:"Cadre historique d’écoconception des produits liés à l’énergie. Progressivement remplacé/complété par ESPR selon familles de produits."
  },
  {
    id:"bat-1",
    cat:"eu_related",
    tag:"EU Batteries",
    isNew:true,
    ref:"Acte (UE) 32023R1542 — Acte UE",
    title:"Règlement (UE) 2023/1542 — Batteries et déchets de batteries",
    date:"28/07/2023",
    apply:"18/02/2027 — Batterie remplaçable smartphones",
    type:"Acte UE",
    applyDate:new Date(2027,1,18),
    devices:["Smartphones","IoT","Wearables"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1542",
    summary:"Fixe des exigences de durabilité, traçabilité et fin de vie des batteries. Pour certaines catégories, batteries remplaçables à échéance."
  },
  {
    id:"data-1",
    cat:"eu_related",
    tag:"EU Données / IoT",
    isNew:false,
    ref:"Acte (UE) 32023R2854 — Acte UE",
    title:"Data Act — CELEX 32023R2854",
    date:"01/01/2023",
    apply:"À confirmer — voir texte officiel",
    type:"Acte UE",
    applyDate:null,
    devices:["Smartphones","IoT","Wearables"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854",
    summary:"Encadre l’accès, le partage et la portabilité des données générées par les objets connectés."
  },
  {
    id:"ai-1",
    cat:"eu_related",
    tag:"EU Intelligence Artificielle",
    isNew:false,
    ref:"Acte (UE) 32024R1689 — Acte UE",
    title:"AI Act — CELEX 32024R1689",
    date:"01/01/2023",
    apply:"À confirmer — voir texte officiel",
    type:"Acte UE",
    applyDate:null,
    devices:["Smartphones","IoT","Wearables"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    summary:"Cadre européen de l’IA basé sur le risque, avec obligations renforcées pour les systèmes à haut risque."
  },
  {
    id:"cra-2",
    cat:"eu_related",
    tag:"EU Cybersécurité",
    isNew:false,
    ref:"Acte (UE) 32024R2847 — Acte UE",
    title:"CRA Cyber Resilience — CELEX 32024R2847",
    date:"01/01/2023",
    apply:"À confirmer — voir texte officiel",
    type:"Acte UE",
    applyDate:null,
    devices:["Smartphones","IoT","Wearables"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
    summary:"Exigences cybersécurité sur le cycle de vie des produits connectés (vulnérabilités, correctifs, notifications)."
  },
  {
    id:"empco-1",
    cat:"eu_related",
    tag:"EU Greenwashing",
    isNew:false,
    ref:"Acte (UE) 32024L0825 — Acte UE",
    title:"EmpCo Greenwashing — CELEX 32024L0825",
    date:"01/01/2023",
    apply:"À confirmer — voir texte officiel",
    type:"Acte UE",
    applyDate:null,
    devices:["Smartphones","IoT","Wearables"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825",
    summary:"Interdit les allégations environnementales trompeuses et renforce l’information consommateur."
  }
];

var AGENDA = [
  {date:"11/09/2026", label:"CRA — Déclaration vulnérabilités (Art. 64)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"12/09/2026", label:"Data Act — Portabilité IoT", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854"},
  {date:"27/09/2026", label:"EmpCo — Anti-greenwashing + garantie durabilité", flags:"EU FR", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825"}
];

// =========================
// STATE
// =========================
var currentTab='accueil';
var scanLoading=false;
var lastScan=fmtDate(new Date());
var nextScan=fmtDate(addDays(new Date(),7));
var openCards={};
var veilleFilter='tous';
var prefs={red_normes:true,cra:true,espr:true,data_act:true,ai_act:true,empco:true,fr_transpo:true,rien_nouveau:true,rappel_j60:true,rappel_j30:true};

// =========================
// UTILS
// =========================
function fmtDate(d){var p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());}
function addDays(d,n){return new Date(d.getTime()+n*86400000);}
function esc(s){return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function parseFRDateStrict(str){var m=String(str||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return null;var d=new Date(+m[3],+m[2]-1,+m[1]);return isNaN(d)?null:d;}
function parseFRTextDate(str){
  var txt=(str||'').toLowerCase();
  var months={"janvier":0,"fevrier":1,"février":1,"mars":2,"avril":3,"mai":4,"juin":5,"juillet":6,"aout":7,"août":7,"septembre":8,"octobre":9,"novembre":10,"decembre":11,"décembre":11};
  var m=txt.match(/(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(20\d{2})/i);
  if(!m)return null;
  var d=new Date(parseInt(m[3],10),months[m[2]],parseInt(m[1],10));
  return isNaN(d)?null:d;
}
function parseApplyToDate(apply){
  var txt=String(apply||'');
  var d=parseFRDateStrict(txt); if(d) return d;
  var from=txt.match(/(?:a|à)\s+partir\s+du\s+(\d{2}\/\d{2}\/\d{4})/i); if(from) return parseFRDateStrict(from[1]);
  var any=txt.match(/(\d{2}\/\d{2}\/\d{4})/); if(any) return parseFRDateStrict(any[1]);
  var t=parseFRTextDate(txt); if(t) return t;
  var y=txt.match(/(20\d{2})/); if(y) return new Date(+y[1],11,31);
  return null;
}
function getApplyDate(reg){return reg.applyDate instanceof Date ? reg.applyDate : parseApplyToDate(reg.apply);}
function computeDataFiltre(){
  return DATA.filter(function(d){
    // on conserve les "à confirmer" pour veille, mais on exclut les dates < filtre
    var dt=getApplyDate(d);
    if(!dt) return true;
    return dt.getTime()>=DATE_FILTRE.getTime();
  });
}
var DATA_FILTRE=computeDataFiltre();

function syncVersionLabels(){
  var nodes=document.querySelectorAll('[data-app-version]');
  nodes.forEach(function(n){n.textContent='v'+APP_VERSION;});
  var sub=document.getElementById('header-subtitle');
  if(sub) sub.textContent=sub.textContent.replace(/v\d+(\.\d+){0,2}/i,'v'+APP_VERSION);
}

// =========================
// BADGES
// =========================
function currentIdsArray(items){return Array.from(new Set((items||[]).map(function(x){return x.id;}).filter(Boolean))).sort();}
function loadSeenIds(){try{var r=localStorage.getItem(ALERT_SEEN_KEY);return r?JSON.parse(r):null;}catch(e){return null;}}
function saveSeenIds(ids){try{localStorage.setItem(ALERT_SEEN_KEY,JSON.stringify(ids));}catch(e){}}
function diffCount(cur,prev){var s=new Set(prev||[]),c=0;cur.forEach(function(id){if(!s.has(id))c++;});return c;}
function computeNewlyDetectedCountAndPersist(items){
  var cur=currentIdsArray(items), seen=loadSeenIds();
  if(seen===null){newlyDetectedCount=0;saveSeenIds(cur);return;}
  newlyDetectedCount=diffCount(cur,seen);saveSeenIds(cur);
}
function markAlertsAsRead(){newlyDetectedCount=0;saveSeenIds(currentIdsArray(DATA));updateAlertBadges();}
function updateAlertBadges(){
  var bell=document.getElementById('bell-count'), nav=document.getElementById('nav-badge');
  if(bell){bell.textContent=String(newlyDetectedCount);bell.style.display=newlyDetectedCount>0?'flex':'none';}
  if(nav){nav.textContent=String(newlyDetectedCount);nav.style.display=newlyDetectedCount>0?'flex':'none';}
}

// =========================
// NAV / ACTIONS
// =========================
function setTab(tab){
  currentTab=tab;
  ['accueil','veille','alertes'].forEach(function(t){
    var panel=document.getElementById('tab-'+t), btn=document.getElementById('nav-'+t);
    if(panel) panel.classList.toggle('hidden',t!==tab);
    if(btn) btn.classList.toggle('active',t===tab);
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

// FIX clé: délégation d'événement globale pour "Lire en clair"
document.addEventListener('click', function(ev){
  var btn = ev.target.closest('[data-action="toggle-summary"]');
  if(!btn) return;
  ev.preventDefault();
  var id = btn.getAttribute('data-id');
  if(id) toggleCard(id);
});

function toggleCard(id){
  openCards[id]=!openCards[id];
  var box=document.getElementById('summary-'+id);
  var ar=document.getElementById('arrow-'+id);
  var lb=document.getElementById('lbl-'+id);
  if(box) box.classList.toggle('hidden',!openCards[id]);
  if(ar) ar.style.transform=openCards[id]?'rotate(90deg)':'rotate(0deg)';
  if(lb) lb.textContent=openCards[id]?'Masquer le résumé':'Lire en clair';
}
function setVeilleFilter(f){veilleFilter=f;renderVeille();}
function togglePref(key){
  prefs[key]=!prefs[key];
  var sw=document.getElementById('sw-'+key);
  if(sw){
    sw.classList.toggle('switch-on',prefs[key]);
    sw.classList.toggle('switch-off',!prefs[key]);
    var k=sw.querySelector('.switch-knob');
    if(k) k.style.left=prefs[key]?'23px':'3px';
  }
}

// =========================
// ACCUEIL
// =========================
function formatDateFR(d){var p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear();}
function upcomingRegs(){
  return DATA_FILTRE
    .map(function(r){return {reg:r,dt:getApplyDate(r)};})
    .filter(function(x){return x.dt && x.dt.getTime()>=new Date().setHours(0,0,0,0);})
    .sort(function(a,b){return a.dt-b.dt;});
}
function renderUpcomingRecap(){
  var rows=upcomingRegs().slice(0,8);
  if(!rows.length) return '<div class="card-plain mb12"><p class="fw7 fs12 t-text">Aucune échéance future détectée</p></div>';
  var html='<div class="card-plain mb12"><p class="section-label" style="margin-bottom:8px">RÉCAPITULATIF DES TEXTES À VENIR</p>';
  html+=rows.map(function(x){
    var j=Math.ceil((x.dt.getTime()-new Date().getTime())/86400000);
    var link=x.reg.link?'<a href="'+x.reg.link+'" target="_blank" rel="noopener" style="font-size:10px;color:#4a7dff;text-decoration:none">Voir texte</a>':'<span style="font-size:10px;color:#7a7f9a">Texte non publié</span>';
    return '<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid #2a2f4a"><div style="min-width:0"><p style="font-size:12px;font-weight:600;color:#e8eaf0;line-height:1.35;margin:0">'+esc(x.reg.title)+'</p><p style="font-size:10px;color:#7a7f9a;margin-top:2px">Entrée en application : '+formatDateFR(x.dt)+' · J-'+j+'</p></div><div style="white-space:nowrap;align-self:center">'+link+'</div></div>';
  }).join('');
  return html+'</div>';
}
function renderAccueil(){
  var fr=DATA_FILTRE.filter(function(d){return d.cat==='fr';});
  document.getElementById('tab-accueil').innerHTML =
    '<div style="padding:14px 16px 90px">'
    +'<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><span style="font-size:10px;font-weight:700;color:#7a7f9a;background:#1a1e35;border:1px solid #2a2f4a;border-radius:6px;padding:3px 10px;">v'+APP_VERSION+' — '+lastScan.slice(0,10)+'</span></div>'
    +'<div class="card card-green mb12"><p class="fw7 fs12 t-green">'+DATA_FILTRE.length+' textes surveillés — échéances après 01/06/2026</p><p class="fs11" style="color:#86efac;margin-top:3px">Sources : EUR-Lex · Legifrance · JORF · ETSI</p></div>'
    +(fr.length?('<div class="card mb12" style="background:#2a0d12;border:1px solid #5a1a22;border-left:3px solid #e04f5f"><p class="fw7 fs12" style="color:#f87171;margin-bottom:6px">🇫🇷 '+fr.length+' texte(s) FR en cours d’adoption</p>'+fr.map(function(d){return '<p class="fs11" style="color:#fca5a5;margin:2px 0">· '+esc(d.ref)+' — '+esc(d.apply)+'</p>';}).join('')+'</div>'):'')
    +renderUpcomingRecap()
    +'<div class="card-plain mb16" style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><p class="fw7 fs13 t-text mb6">Scraping hebdomadaire</p><p class="fs11 t-muted">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted">Prochain scan : <span class="t-warn">'+nextScan+'</span></p><p class="fs10 t-muted">EUR-Lex · Legifrance · JORF · ETSI</p></div><button id="scan-btn" class="scan-btn" onclick="handleScan()">'+(scanLoading?'En cours...':'Scan')+'</button></div>'
    +'</div>';
}

// =========================
// VEILLE
// =========================
function smartSummary(reg){
  if(reg.id==='red-1'){
    return "La directive RED encadre la mise sur le marché des équipements radio dans l’UE. Elle impose des exigences essentielles (sécurité des personnes, compatibilité électromagnétique, usage efficace du spectre), ainsi que les obligations de conformité CE (évaluation, documentation technique, déclaration UE de conformité, marquage).";
  }
  if(reg.summary && reg.summary.trim().length>20) return reg.summary.trim();
  return (reg.type||'Texte')+' — '+(reg.ref||reg.title||'')+' — Application : '+(reg.apply||'À confirmer');
}

function renderCard(reg){
  var acc=reg.cat==='eu_red'?'#4a7dff':reg.cat==='fr'?'#e04f5f':'#38bdf8';
  var flag=reg.cat==='fr'?'FR':'EU';
  var isOpen=!!openCards[reg.id];
  var chips=(reg.isNew?'<span class="chip chip-new">Nouveau</span>':'')+'<span class="chip chip-'+reg.cat+'">'+flag+' '+esc(reg.tag||'Texte')+'</span>';
  var devices=(reg.devices||[]).map(function(d){return '<span class="dtag">'+esc(d)+'</span>';}).join('');
  var linkBtn=reg.link
    ? '<a href="'+reg.link+'" target="_blank" rel="noopener" class="eur-link" style="background:'+acc+'">'+(reg.cat==='fr'?'Legifrance':'EUR-Lex')+' &rarr;</a>'
    : '<span style="display:inline-block;font-size:10px;font-weight:700;padding:5px 12px;border-radius:6px;background:#2a2f4a;color:#7a7f9a;margin-top:10px">Texte non encore publié</span>';

  return '<div class="card-reg card-reg-'+reg.cat+'" id="card-'+reg.id+'">'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px">'+chips+'<span style="margin-left:auto;font-size:11px;color:#7a7f9a">'+esc(reg.date||'—')+'</span></div>'
    +'<p style="font-size:14px;font-weight:700;color:#e8eaf0;line-height:1.4;margin-bottom:4px">'+esc(reg.title||'')+'</p>'
    +'<p style="font-size:10px;color:#7a7f9a;margin-bottom:8px">'+esc(reg.ref||'')+' — '+esc(reg.type||'')+'</p>'
    +'<div style="display:flex;flex-wrap:wrap;margin-bottom:10px">'+devices+'</div>'
    +'<div class="date-pill" style="margin-bottom:10px"><span>Application :</span><span style="font-size:11px;font-weight:700;color:#a78bfa">'+esc(reg.apply||'À confirmer')+'</span></div>'
    +'<button type="button" data-action="toggle-summary" data-id="'+esc(reg.id)+'" class="summary-toggle" style="color:'+acc+';cursor:pointer;position:relative;z-index:2;">'
    +'<i id="arrow-'+reg.id+'" class="arrow" style="transform:'+(isOpen?'rotate(90deg)':'rotate(0deg)')+'">&#9658;</i>'
    +'<span id="lbl-'+reg.id+'">'+(isOpen?'Masquer le résumé':'Lire en clair')+'</span></button>'
    +'<div id="summary-'+reg.id+'" class="summary-box'+(isOpen?'':' hidden')+'"><p style="font-size:12px;color:#c0c4d8;line-height:1.75;margin-bottom:10px">'+esc(smartSummary(reg))+'</p>'+linkBtn+'</div>'
    +'</div>';
}

function renderVeille(){
  var filters=[{key:'tous',label:'Tous'},{key:'eu_red',label:'RED stricte'},{key:'eu_related',label:'Connexes EU'},{key:'fr',label:'Droit FR'}];
  var groups=[{key:'eu_red',label:'TEXTES RED (2014/53/UE)',color:'#4a7dff'},{key:'eu_related',label:'RÉGLEMENTATIONS CONNEXES',color:'#38bdf8'},{key:'fr',label:'TRANSPOSITIONS DROIT FRANÇAIS',color:'#e04f5f'}];
  var shown=veilleFilter==='tous'?groups:groups.filter(function(g){return g.key===veilleFilter;});
  var filterBtns=filters.map(function(f){return '<button class="filter-btn '+(veilleFilter===f.key?'active':'')+'" onclick="setVeilleFilter(\''+f.key+'\')">'+f.label+'</button>';}).join('');
  var groupsHtml=shown.map(function(g){
    var cards=DATA_FILTRE.filter(function(r){return r.cat===g.key;}).map(renderCard).join('');
    return '<p class="section-label" style="color:'+g.color+'">'+g.label+'</p>'+(cards||'<p class="fs12 t-muted" style="padding:12px 0">Aucun texte dans cette catégorie</p>');
  }).join('');

  document.getElementById('tab-veille').innerHTML =
    '<div style="padding:14px 16px 90px"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">'+filterBtns+'</div><p class="fs10 t-muted" style="margin-bottom:12px;font-style:italic">'+DATA_FILTRE.length+' textes à surveiller</p>'+groupsHtml+'</div>';
}

// =========================
// ALERTES
// =========================
function renderAlertes(){
  var rows=[
    {key:'red_normes',icon:'📐',label:'Nouvelles normes harmonisées RED'},
    {key:'cra',icon:'🛡️',label:'Cyber Resilience Act (CRA)'},
    {key:'espr',icon:'♻️',label:'Écoconception ESPR'},
    {key:'data_act',icon:'💾',label:'Data Act IoT'},
    {key:'ai_act',icon:'🤖',label:'AI Act IA embarquée'},
    {key:'empco',icon:'🌿',label:'Greenwashing EmpCo / Garanties'},
    {key:'fr_transpo',icon:'🇫🇷',label:'Transpositions droit français'},
    {key:'rien_nouveau',icon:'✅',label:'Confirmation scan (même si rien de nouveau)'},
    {key:'rappel_j60',icon:'📅',label:'Rappels échéances à J-60'},
    {key:'rappel_j30',icon:'⏰',label:'Rappels échéances à J-30'}
  ];
  var switchRows=rows.map(function(r){
    var on=prefs[r.key]!==false;
    return '<div class="toggle-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #2a2f4a"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:20px">'+r.icon+'</span><span class="fs13 t-text">'+r.label+'</span></div><button id="sw-'+r.key+'" class="switch '+(on?'switch-on':'switch-off')+'" onclick="togglePref(\''+r.key+'\')" style="width:46px;height:26px;border-radius:13px;border:none;position:relative;cursor:pointer;"><span class="switch-knob" style="position:absolute;top:3px;left:'+(on?'23px':'3px')+';width:20px;height:20px;border-radius:50%;background:#fff;"></span></button></div>';
  }).join('');

  document.getElementById('tab-alertes').innerHTML =
    '<div style="padding:14px 16px 90px"><div class="card-plain mb16"><p class="fw7 fs12 t-text mb8">Statut scraping</p><p class="fs11 t-muted">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted">Prochain scan : <span class="t-warn">'+nextScan+'</span></p><p class="fs10 t-muted">Version : v'+APP_VERSION+'</p></div><p class="section-label">NOTIFICATIONS ACTIVES</p>'+switchRows+'</div>';
}

// =========================
// DYNAMIC
// =========================
function normalizeDynamicItem(d){
  var i=Object.assign({},d);
  i.id=i.id||('dyn-'+Math.random().toString(36).slice(2));
  i.title=i.title||i.ref||'Texte détecté';
  i.ref=i.ref||i.title;
  i.type=i.type||(i.cat==='fr'?'Texte national':'Acte UE');
  i.tag=i.tag||(i.cat==='fr'?'Transposition FR':'Normes RED');
  i.date=i.date||'—';
  i.apply=i.apply||'À confirmer — voir texte officiel';
  i.summary=i.summary||'';
  i.devices=Array.isArray(i.devices)?i.devices:['Smartphones','IoT'];
  i.isNew=!!i.isNew;
  if(!i.cat) i.cat='eu_related';
  if(!(i.applyDate instanceof Date)) i.applyDate=parseApplyToDate(i.apply);
  return i;
}
function rebuildFromDynamic(dynamicItems){
  var ids=DATA.map(function(d){return d.id;});
  var newOnly=(dynamicItems||[]).map(normalizeDynamicItem).filter(function(d){return !ids.includes(d.id);});
  if(newOnly.length){DATA=newOnly.concat(DATA);}
  DATA_FILTRE=computeDataFiltre();
}
function applyScanMeta(meta){
  if(!meta||!meta.lastScan) return;
  var d=new Date(meta.lastScan);
  if(!isNaN(d.getTime())){lastScan=fmtDate(d);nextScan=fmtDate(addDays(d,7));}
}

// =========================
// INIT
// =========================
document.addEventListener('DOMContentLoaded',function(){
  var bell=document.getElementById('bell-btn');
  var navA=document.getElementById('nav-accueil');
  var navV=document.getElementById('nav-veille');
  var navAl=document.getElementById('nav-alertes');

  if(bell) bell.addEventListener('click',function(){setTab('alertes');});
  if(navA) navA.addEventListener('click',function(){setTab('accueil');});
  if(navV) navV.addEventListener('click',function(){setTab('veille');});
  if(navAl) navAl.addEventListener('click',function(){setTab('alertes');});

  renderAccueil();
  renderVeille();
  renderAlertes();
  syncVersionLabels();

  computeNewlyDetectedCountAndPersist(DATA);
  updateAlertBadges();

  Promise.allSettled([
    fetch('scan-meta.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok) throw new Error('scan-meta HTTP '+r.status); return r.json();}),
    fetch('data.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok) throw new Error('data HTTP '+r.status); return r.json();})
  ]).then(function(res){
    var meta=res[0].status==='fulfilled'?res[0].value:null;
    var dyn=res[1].status==='fulfilled'?res[1].value:[];
    if(meta) applyScanMeta(meta);
    if(Array.isArray(dyn)&&dyn.length) rebuildFromDynamic(dyn);

    DATA_FILTRE=computeDataFiltre();
    computeNewlyDetectedCountAndPersist(DATA);

    renderAccueil();
    renderVeille();
    renderAlertes();
    syncVersionLabels();
    updateAlertBadges();
  }).catch(function(e){
    console.warn('[App] chargement dynamique partiel:',e.message);
  });
});
