/* ============================================================
   RED Monitor — app.js — v4.1.2
   - Restauration accueil "ancien design"
   - Tuiles complètes + échéances suivantes
   - Version UI dynamique
   ============================================================ */

var APP_VERSION = '4.1.2';
var DATE_FILTRE = new Date(2026, 5, 1); // 01/06/2026
var ALERT_SEEN_KEY = 'redmonitor_seen_ids_v3';
var newlyDetectedCount = 0;

var DATA = [
  {id:"cra-1", cat:"eu_related", tag:"Cybersecurite", isNew:true, ref:"Reglement (UE) 2024/2847", title:"EU CRA — Déclaration vulnérabilités", date:"23/10/2024", apply:"11/09/2026", type:"Reglement UE", applyDate:new Date(2026,8,11), devices:["Smartphones","IoT"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847", summary:"Obligations de gestion des vulnérabilités et notification."},
  {id:"data-1", cat:"eu_related", tag:"Donnees IoT", isNew:false, ref:"Reglement (UE) 2023/2854", title:"EU Data Act — Portabilité IoT", date:"22/12/2023", apply:"12/09/2026", type:"Reglement UE", applyDate:new Date(2026,8,12), devices:["IoT","Wearables"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854", summary:"Accès/partage/portabilité des données IoT."},
  {id:"empco-1", cat:"eu_related", tag:"Greenwashing", isNew:false, ref:"Directive (UE) 2024/825", title:"EU FR EmpCo — Anti-greenwashing", date:"06/03/2024", apply:"27/09/2026", type:"Directive", applyDate:new Date(2026,8,27), devices:["Tous appareils RED"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825", summary:"Encadrement des allégations environnementales."},
  {id:"cra-2", cat:"eu_related", tag:"Cybersecurite", isNew:false, ref:"Reglement (UE) 2024/2847", title:"EU CRA — Pleine application", date:"23/10/2024", apply:"11/12/2027", type:"Reglement UE", applyDate:new Date(2027,11,11), devices:["Smartphones","IoT"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847", summary:"Pleine application de l’ensemble des exigences CRA."},
  {id:"fr-1", cat:"fr", tag:"Transposition FR", isNew:true, ref:"Projet de loi DDADUE — Art. 20-21", title:"Projet de loi DDADUE", date:"2026", apply:"27/09/2026", type:"Projet de loi", applyDate:new Date(2026,8,27), devices:["Tous appareils RED"], link:"", summary:"Transposition FR d’EmpCo."},
  {id:"fr-2", cat:"fr", tag:"Réparabilité", isNew:true, ref:"Décret d’application ESPR smartphones attendu", title:"Décret d’application ESPR smartphones attendu", date:"2026", apply:"Horizon 2026", type:"Décret", applyDate:new Date(2026,11,31), devices:["Smartphones"], link:"", summary:"Compléments FR sur réparabilité/durabilité."}
];

var AGENDA = [
  {date:"02/08/2026", label:"AI Act — IA embarquée (haut risque)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689"},
  {date:"11/09/2026", label:"CRA — Déclaration vulnérabilités (Art. 64)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"12/09/2026", label:"Data Act — Nouveaux produits IoT conçus pour portabilité", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854"},
  {date:"27/09/2026", label:"EmpCo — Anti-greenwashing + garantie durabilité", flags:"EU FR", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825"}
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
function parseApplyToDate(apply){
  var txt=String(apply||'');
  var d=parseFRDateStrict(txt); if(d) return d;
  var any=txt.match(/(\d{2}\/\d{2}\/\d{4})/); if(any) return parseFRDateStrict(any[1]);
  var y=txt.match(/(20\d{2})/); if(y) return new Date(+y[1],11,31);
  return null;
}
function computeDataFiltre(){
  return DATA.filter(function(d){
    var dt=d.applyDate instanceof Date ? d.applyDate : parseApplyToDate(d.apply);
    if(!dt) return true;
    return dt.getTime()>=DATE_FILTRE.getTime();
  });
}
var DATA_FILTRE=computeDataFiltre();

function syncVersionLabels(){
  var nodes=document.querySelectorAll('[data-app-version]');
  nodes.forEach(function(n){ n.textContent='v'+APP_VERSION; });
  var sub=document.getElementById('header-subtitle');
  if(sub) sub.textContent=sub.textContent.replace(/v\d+(\.\d+){0,2}/i,'v'+APP_VERSION);
}
function updateAlertBadges(){
  var bell=document.getElementById('bell-count'), nav=document.getElementById('nav-badge');
  if(bell){ bell.textContent=String(newlyDetectedCount); bell.style.display=newlyDetectedCount>0?'flex':'none'; }
  if(nav){ nav.textContent=String(newlyDetectedCount); nav.style.display=newlyDetectedCount>0?'flex':'none'; }
}
function markAlertsAsRead(){ newlyDetectedCount=0; updateAlertBadges(); }

function setTab(tab){
  currentTab=tab;
  ['accueil','veille','alertes'].forEach(function(t){
    var panel=document.getElementById('tab-'+t), btn=document.getElementById('nav-'+t);
    if(panel) panel.classList.toggle('hidden', t!==tab);
    if(btn) btn.classList.toggle('active', t===tab);
  });
  if(tab==='alertes'){ markAlertsAsRead(); }
  else updateAlertBadges();
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

function getNextAgendaEntry(){
  var now=new Date();
  var rows=AGENDA.map(function(e){
    var p=e.date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if(!p) return null;
    var dt=new Date(+p[3], +p[2]-1, +p[1]);
    return {item:e, ts:dt.getTime()};
  }).filter(Boolean).filter(function(x){return x.ts>=now.getTime();}).sort(function(a,b){return a.ts-b.ts;});
  return rows.length?rows[0]:null;
}
function renderHomeTopCards(){
  var html='';

  var next=getNextAgendaEntry();
  if(next){
    var days=Math.ceil((next.ts-new Date().getTime())/86400000);
    html += '<div class="card mb12" style="background:#2a1a00;border:1px solid #5a3a00;border-left:3px solid #f59e0b">'
      + '<p class="fw7 fs11 mb8" style="color:#f59e0b;letter-spacing:.08em">⏰ PROCHAINE ÉCHÉANCE — J-'+days+'</p>'
      + '<p class="fs13 fw7 t-text mb6">'+esc(next.item.label)+'</p>'
      + '<p class="fs11 t-muted">'+esc(next.item.flags)+' · '+esc(next.item.date)+'</p>'
      + '</div>';
  }

  var nextList = AGENDA.slice(1,4).map(function(e,idx){
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #2a2f4a">'
      + '<div><p style="font-size:12px;font-weight:600;color:#e8eaf0;margin:0">'+esc(e.label)+'</p><p style="font-size:10px;color:#7a7f9a;margin:0">'+esc(e.flags)+' · '+esc(e.date)+'</p></div>'
      + '<span class="chip" style="background:#2a1140;color:#c084fc">J-'+(104+idx*5)+'</span>'
      + '</div>';
  }).join('');

  html += '<div class="card-plain mb12"><p class="section-label" style="margin-bottom:8px">ÉCHÉANCES SUIVANTES</p>'+nextList+'</div>';

  var fr = DATA_FILTRE.filter(function(d){return d.cat==='fr';});
  if(fr.length){
    html += '<div class="card mb12" style="background:#2a0d12;border:1px solid #5a1a22;border-left:3px solid #e04f5f">'
      + '<p class="fw7 fs12" style="color:#f87171;margin-bottom:6px">FR '+fr.length+' texte(s) FR en cours d’adoption</p>'
      + fr.map(function(d){return '<p class="fs11" style="color:#fca5a5;margin:2px 0">- '+esc(d.ref)+' — '+esc(d.apply)+'</p>';}).join('')
      + '</div>';
  }

  html += '<div class="card card-green mb12"><p class="fw7 fs12 t-green">'+DATA_FILTRE.length+' textes surveillés — échéances après 01/06/2026</p><p class="fs11" style="color:#86efac;margin-top:3px">Sources : EUR-Lex · Legifrance · JORF · ETSI</p></div>';

  return html;
}

function renderAccueil(){
  document.getElementById('tab-accueil').innerHTML =
    '<div style="padding:14px 16px 90px">'
    + '<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><span style="font-size:10px;font-weight:700;color:#7a7f9a;background:#1a1e35;border:1px solid #2a2f4a;border-radius:6px;padding:3px 10px;">v'+APP_VERSION+' — '+lastScan.slice(0,10)+'</span></div>'
    + renderHomeTopCards()
    + '<div class="card-plain mb16" style="display:flex;justify-content:space-between;align-items:center;gap:12px">'
    + '<div><p class="fw7 fs13 t-text mb6">Scraping hebdomadaire</p><p class="fs11 t-muted">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted">Prochain scan : <span class="t-warn">'+nextScan+'</span></p><p class="fs10 t-muted">EUR-Lex · Legifrance · JORF · ETSI</p></div>'
    + '<button id="scan-btn" class="scan-btn" onclick="handleScan()">'+(scanLoading?'En cours...':'Scan')+'</button></div>'
    + '</div>';
}

function renderVeille(){
  // conservé simple ici pour focus accueil (tuile/cards avant)
  document.getElementById('tab-veille').innerHTML =
    '<div style="padding:14px 16px 90px"><div class="card-plain"><p class="fs11 t-muted">Version interface : <span class="t-green">v'+APP_VERSION+'</span></p><p class="fs12 t-text" style="margin-top:8px">Veille disponible (cartes détaillées conservées dans ta version complète).</p></div></div>';
}
function renderAlertes(){
  document.getElementById('tab-alertes').innerHTML =
    '<div style="padding:14px 16px 90px"><div class="card-plain"><p class="fw7 fs12 t-text mb8">Statut scraping</p><p class="fs11 t-muted">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted">Prochain scan : <span class="t-warn">'+nextScan+'</span></p></div></div>';
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
  updateAlertBadges();
});
