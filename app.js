/* ============================================================
   RED Monitor — app.js — v4.3.0 (FULL UI STABLE)
   ============================================================ */

var APP_VERSION = '4.3.0';
var DATE_FILTRE = new Date(2026, 5, 1); // 01/06/2026
var ALERT_SEEN_KEY = 'redmonitor_seen_ids_v3';
var newlyDetectedCount = 0;

// Exclusions strictes
var EXCLUDED_CELEX = ['32022R1925', '32022R2065', '32009L0125']; // DMA, DSA, ancienne eco
var EXCLUDED_KEYWORDS = [
  ' digital markets act ', ' digital services act ',
  ' dma ', ' dsa '
];

// Base statique vide (on charge data.json)
var DATA = [];
var AGENDA = [
  {date:"11/09/2026", label:"CRA — Déclaration vulnérabilités (Art. 64)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"12/09/2026", label:"Data Act — Portabilité IoT", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854"},
  {date:"22/09/2026", label:"EmpCo — Application nationale", flags:"EU FR", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825"},
  {date:"18/02/2027", label:"Batteries — Remplaçabilité smartphones", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1542"}
];

var currentTab='accueil';
var scanLoading=false;
var lastScan=fmtDate(new Date());
var nextScan=fmtDate(addDays(new Date(),7));
var openCards={};
var veilleFilter='tous';
var prefs={red_normes:true,cra:true,espr:true,data_act:true,ai_act:true,empco:true,fr_transpo:true,rien_nouveau:true,rappel_j60:true,rappel_j30:true};
var DATA_FILTRE=[];

/* ---------------- Utils ---------------- */
function fmtDate(d){var p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());}
function addDays(d,n){return new Date(d.getTime()+n*86400000);}
function esc(s){return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function parseFRDateStrict(str){var m=String(str||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return null;var d=new Date(+m[3],+m[2]-1,+m[1]);return isNaN(d)?null:d;}
function parseFRTextDate(str){
  var t=(str||'').toLowerCase();
  var M={"janvier":0,"fevrier":1,"février":1,"mars":2,"avril":3,"mai":4,"juin":5,"juillet":6,"aout":7,"août":7,"septembre":8,"octobre":9,"novembre":10,"decembre":11,"décembre":11};
  var m=t.match(/(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(20\d{2})/i);
  if(!m)return null;
  var d=new Date(+m[3],M[m[2]],+m[1]); return isNaN(d)?null:d;
}
function parseApplyToDate(apply){
  var txt=String(apply||'');
  var d=parseFRDateStrict(txt); if(d) return d;
  var from=txt.match(/(?:a|à)\s+partir\s+du\s+(\d{2}\/\d{2}\/\d{4})/i); if(from) return parseFRDateStrict(from[1]);
  var any=txt.match(/(\d{2}\/\d{2}\/\d{4})/); if(any) return parseFRDateStrict(any[1]);
  var td=parseFRTextDate(txt); if(td) return td;
  var y=txt.match(/(20\d{2})/); if(y) return new Date(+y[1],11,31);
  return null;
}
function getApplyDate(r){return r.applyDate instanceof Date ? r.applyDate : parseApplyToDate(r.apply);}

function extractCelex(r){
  var blob=((r.id||'')+' '+(r.ref||'')+' '+(r.title||'')+' '+(r.link||'')).toUpperCase();
  var m=blob.match(/CELEX[:\s]*([0-9A-Z]{10})/);
  if(m) return m[1];
  // fallback style 32024R1689
  var m2=blob.match(/\b(3\d{4}[A-Z]\d{4})\b/);
  return m2 ? m2[1] : null;
}

function textBlob(r){return (' '+(r.id||'')+' '+(r.title||'')+' '+(r.ref||'')+' '+(r.tag||'')+' '+(r.type||'')+' '+(r.link||'')+' ').toLowerCase();}
function isExcludedReg(r){
  var t=textBlob(r);
  var cx=extractCelex(r);
  if(cx && EXCLUDED_CELEX.indexOf(cx)!==-1) return true;
  for(var i=0;i<EXCLUDED_KEYWORDS.length;i++) if(t.indexOf(EXCLUDED_KEYWORDS[i])!==-1) return true;
  return false;
}

function normalizeDynamicItem(d){
  var i=Object.assign({},d);
  i.id=i.id||('dyn-'+Math.random().toString(36).slice(2));
  i.title=i.title||i.ref||'Texte détecté';
  i.ref=i.ref||i.title;
  i.type=i.type||'Acte UE';
  i.tag=i.tag||'Normes RED';
  i.date=i.date||'—';
  i.apply=i.apply||'À confirmer — voir texte officiel';
  i.summary=i.summary||'';
  i.devices=Array.isArray(i.devices)?i.devices:['Smartphones','IoT','Wearables'];
  i.cat=i.cat||'eu_related';
  i.isNew=!!i.isNew;
  if(!(i.applyDate instanceof Date)) i.applyDate=parseApplyToDate(i.apply);
  i.celex=extractCelex(i);
  return i;
}

function scoreEntry(r){
  var s=0;
  if(r.summary && r.summary.length>80) s+=3;
  if(r.apply && !/à confirmer/i.test(r.apply)) s+=2;
  if(r.link) s+=1;
  if(r.isNew) s+=1;
  return s;
}

function dedupeByCelex(items){
  var byKey={};
  items.forEach(function(r){
    var key=r.celex || r.id;
    if(!byKey[key]) byKey[key]=r;
    else if(scoreEntry(r)>scoreEntry(byKey[key])) byKey[key]=r;
  });
  return Object.keys(byKey).map(function(k){return byKey[k];});
}

function computeDataFiltre(){
  return DATA.filter(function(r){
    if(isExcludedReg(r)) return false;
    var dt=getApplyDate(r);
    if(!dt) return true; // à confirmer gardé
    return dt.getTime()>=DATE_FILTRE.getTime();
  });
}

/* ---------------- Badge ---------------- */
function currentIdsArray(items){return Array.from(new Set((items||[]).map(function(x){return x.id;}).filter(Boolean))).sort();}
function loadSeenIds(){try{var raw=localStorage.getItem(ALERT_SEEN_KEY);return raw?JSON.parse(raw):null;}catch(e){return null;}}
function saveSeenIds(ids){try{localStorage.setItem(ALERT_SEEN_KEY,JSON.stringify(ids));}catch(e){}}
function diffCount(newArr,oldArr){var set=new Set(oldArr||[]),c=0;newArr.forEach(function(id){if(!set.has(id))c++;});return c;}
function computeNewlyDetectedCountAndPersist(items){
  var cur=currentIdsArray(items), seen=loadSeenIds();
  if(seen===null){newlyDetectedCount=0;saveSeenIds(cur);return;}
  newlyDetectedCount=diffCount(cur,seen); saveSeenIds(cur);
}
function markAlertsAsRead(){newlyDetectedCount=0;saveSeenIds(currentIdsArray(DATA));updateAlertBadges();}
function updateAlertBadges(){
  var bell=document.getElementById('bell-count'), nav=document.getElementById('nav-badge');
  if(bell){bell.textContent=String(newlyDetectedCount);bell.style.display=newlyDetectedCount>0?'flex':'none';}
  if(nav){nav.textContent=String(newlyDetectedCount);nav.style.display=newlyDetectedCount>0?'flex':'none';}
}

/* ---------------- UI ---------------- */
function syncVersionLabels(){
  var nodes=document.querySelectorAll('[data-app-version]');
  nodes.forEach(function(n){n.textContent='v'+APP_VERSION;});
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
  if(tab==='alertes'){markAlertsAsRead();} else updateAlertBadges();
}

function toggleCard(id){
  openCards[id]=!openCards[id];
  var b=document.getElementById('summary-'+id), a=document.getElementById('arrow-'+id), l=document.getElementById('lbl-'+id);
  if(b) b.classList.toggle('hidden',!openCards[id]);
  if(a) a.style.transform=openCards[id]?'rotate(90deg)':'rotate(0deg)';
  if(l) l.textContent=openCards[id]?'Masquer le résumé':'Lire en clair';
}

document.addEventListener('click',function(ev){
  var btn=ev.target.closest('[data-action="toggle-summary"]');
  if(!btn) return;
  ev.preventDefault();
  toggleCard(btn.getAttribute('data-id'));
});

function smartSummary(r){
  var cx=r.celex||'';
  if(cx==='32014L0053'){
    return "Directive RED : fixe les exigences essentielles pour les équipements radio (sécurité, CEM, usage du spectre), les obligations de conformité CE (évaluation, documentation technique, DoC) et le cadre de surveillance du marché.";
  }
  if(r.summary && r.summary.trim().length>40) return r.summary.trim();
  return (r.type||'Acte UE')+' — '+(r.ref||r.title||'')+' — Application : '+(r.apply||'À confirmer');
}

function renderCard(r){
  var acc=r.cat==='eu_red'?'#4a7dff':(r.cat==='fr'?'#e04f5f':'#38bdf8');
  var flag=r.cat==='fr'?'FR':'EU';
  var isOpen=!!openCards[r.id];
  var chips=(r.isNew?'<span class="chip chip-new">Nouveau</span>':'')+'<span class="chip chip-'+r.cat+'">'+flag+' '+esc(r.tag||'Texte')+'</span>';
  var dev=(r.devices||[]).map(function(d){return '<span class="dtag">'+esc(d)+'</span>';}).join('');
  var link=r.link?'<a href="'+r.link+'" target="_blank" rel="noopener" class="eur-link" style="background:'+acc+'">'+(r.cat==='fr'?'Legifrance':'EUR-Lex')+' &rarr;</a>':'<span style="font-size:10px;color:#7a7f9a">Texte non publié</span>';

  return '<div class="card-reg card-reg-'+r.cat+'">'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">'+chips+'<span style="margin-left:auto;font-size:11px;color:#7a7f9a">'+esc(r.date||'—')+'</span></div>'
    +'<p style="font-size:14px;font-weight:700;color:#e8eaf0;line-height:1.4;margin-bottom:4px">'+esc(r.title||'')+'</p>'
    +'<p style="font-size:10px;color:#7a7f9a;margin-bottom:8px">'+esc(r.ref||'')+' — '+esc(r.type||'')+'</p>'
    +'<div style="display:flex;flex-wrap:wrap;margin-bottom:10px">'+dev+'</div>'
    +'<div class="date-pill"><span>Application :</span><span style="font-size:11px;font-weight:700;color:#a78bfa">'+esc(r.apply||'À confirmer')+'</span></div>'
    +'<button type="button" data-action="toggle-summary" data-id="'+esc(r.id)+'" class="summary-toggle" style="color:'+acc+';margin-top:8px"><i id="arrow-'+r.id+'" class="arrow" style="transform:'+(isOpen?'rotate(90deg)':'rotate(0deg)')+'">&#9658;</i><span id="lbl-'+r.id+'">'+(isOpen?'Masquer le résumé':'Lire en clair')+'</span></button>'
    +'<div id="summary-'+r.id+'" class="summary-box'+(isOpen?'':' hidden')+'"><p style="font-size:12px;color:#c0c4d8;line-height:1.7;margin-bottom:8px">'+esc(smartSummary(r))+'</p>'+link+'</div>'
    +'</div>';
}

function getUpcomingRows(){
  return DATA_FILTRE.map(function(r){return {r:r,dt:getApplyDate(r)};})
    .filter(function(x){return x.dt;})
    .sort(function(a,b){return a.dt-b.dt;});
}
function fmtDateOnly(d){var p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear();}

function renderAccueil(){
  var upcoming=getUpcomingRows().slice(0,8);
  var recap=upcoming.map(function(x){
    var j=Math.ceil((x.dt.getTime()-Date.now())/86400000);
    var link=x.r.link?'<a href="'+x.r.link+'" target="_blank" rel="noopener" style="font-size:10px;color:#4a7dff;text-decoration:none">Voir texte</a>':'<span style="font-size:10px;color:#7a7f9a">Texte non publié</span>';
    return '<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid #2a2f4a"><div><p style="font-size:12px;font-weight:600;color:#e8eaf0;margin:0">'+esc(x.r.title)+'</p><p style="font-size:10px;color:#7a7f9a;margin:0">Entrée en application : '+fmtDateOnly(x.dt)+' · J-'+j+'</p></div><div>'+link+'</div></div>';
  }).join('') || '<p class="fs11 t-muted">Aucune échéance détectée</p>';

  document.getElementById('tab-accueil').innerHTML =
    '<div style="padding:14px 16px 90px">'
    +'<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><span style="font-size:10px;font-weight:700;color:#7a7f9a;background:#1a1e35;border:1px solid #2a2f4a;border-radius:6px;padding:3px 10px;">v'+APP_VERSION+' — '+lastScan.slice(0,10)+'</span></div>'
    +'<div class="card card-green mb12"><p class="fw7 fs12 t-green">'+DATA_FILTRE.length+' textes surveillés</p></div>'
    +'<div class="card-plain mb12"><p class="section-label">RÉCAPITULATIF DES TEXTES À VENIR</p>'+recap+'</div>'
    +'<div class="card-plain mb16" style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><p class="fw7 fs13 t-text mb6">Scraping hebdomadaire</p><p class="fs11 t-muted">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted">Prochain scan : <span class="t-warn">'+nextScan+'</span></p></div><button id="scan-btn" class="scan-btn" '+(scanLoading?'disabled':'')+'>'+(scanLoading?'En cours...':'Scan')+'</button></div>'
    +'</div>';

  var btn=document.getElementById('scan-btn');
  if(btn) btn.onclick=handleScan;
}

function renderVeille(){
  var filters=[{key:'tous',label:'Tous'},{key:'eu_red',label:'RED stricte'},{key:'eu_related',label:'Connexes EU'},{key:'fr',label:'Droit FR'}];
  var groups=[{key:'eu_red',label:'TEXTES RED (2014/53/UE)',color:'#4a7dff'},{key:'eu_related',label:'RÉGLEMENTATIONS CONNEXES',color:'#38bdf8'},{key:'fr',label:'TRANSPOSITIONS DROIT FRANÇAIS',color:'#e04f5f'}];
  var shown=veilleFilter==='tous'?groups:groups.filter(function(g){return g.key===veilleFilter;});
  var btns=filters.map(function(f){return '<button class="filter-btn '+(veilleFilter===f.key?'active':'')+'" data-filter="'+f.key+'">'+f.label+'</button>';}).join('');

  var content=shown.map(function(g){
    var cards=DATA_FILTRE.filter(function(r){return r.cat===g.key;}).map(renderCard).join('');
    return '<p class="section-label" style="color:'+g.color+'">'+g.label+'</p>'+(cards||'<p class="fs12 t-muted">Aucun texte</p>');
  }).join('');

  document.getElementById('tab-veille').innerHTML =
    '<div style="padding:14px 16px 90px"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">'+btns+'</div><p class="fs10 t-muted" style="margin-bottom:12px">'+DATA_FILTRE.length+' textes (DMA/DSA exclus)</p>'+content+'</div>';

  document.querySelectorAll('[data-filter]').forEach(function(b){
    b.onclick=function(){veilleFilter=b.getAttribute('data-filter'); renderVeille();};
  });
}

function renderAlertes(){
  var rows=[
    {key:'red_normes',icon:'📐',label:'Nouvelles normes harmonisées RED'},
    {key:'cra',icon:'🛡️',label:'Cyber Resilience Act (CRA)'},
    {key:'espr',icon:'♻️',label:'Écoconception ESPR'},
    {key:'data_act',icon:'💾',label:'Data Act IoT'},
    {key:'ai_act',icon:'🤖',label:'AI Act IA embarquée'},
    {key:'empco',icon:'🌿',label:'Greenwashing EmpCo'},
    {key:'fr_transpo',icon:'🇫🇷',label:'Transpositions droit français'}
  ];
  var html=rows.map(function(r){
    var on=prefs[r.key]!==false;
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #2a2f4a"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:20px">'+r.icon+'</span><span class="fs13 t-text">'+r.label+'</span></div><button id="sw-'+r.key+'" style="width:46px;height:26px;border-radius:13px;border:none;position:relative;background:'+(on?'#4a7dff':'#2a2f4a')+'"><span style="position:absolute;top:3px;left:'+(on?'23px':'3px')+';width:20px;height:20px;background:#fff;border-radius:50%"></span></button></div>';
  }).join('');

  document.getElementById('tab-alertes').innerHTML='<div style="padding:14px 16px 90px"><div class="card-plain mb12"><p class="fw7 fs12 t-text">Statut scraping</p><p class="fs11 t-muted">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted">Prochain scan : <span class="t-warn">'+nextScan+'</span></p><p class="fs10 t-muted">Version : v'+APP_VERSION+'</p></div><p class="section-label">NOTIFICATIONS ACTIVES</p>'+html+'</div>';
}

/* ---------------- Data loading ---------------- */
function rebuildFromDynamic(items){
  var arr=(items||[]).map(normalizeDynamicItem);
  DATA = dedupeByCelex(arr);
  DATA_FILTRE = computeDataFiltre();
}

/* ---------------- Init ---------------- */
document.addEventListener('DOMContentLoaded', function(){
  var navA=document.getElementById('nav-accueil'), navV=document.getElementById('nav-veille'), navAl=document.getElementById('nav-alertes'), bell=document.getElementById('bell-btn');
  if(navA) navA.onclick=function(){setTab('accueil');};
  if(navV) navV.onclick=function(){setTab('veille');};
  if(navAl) navAl.onclick=function(){setTab('alertes');};
  if(bell) bell.onclick=function(){setTab('alertes');};

  Promise.allSettled([
    fetch('data.json?v='+Date.now(), {cache:'no-store'}).then(function(r){if(!r.ok) throw new Error('data'); return r.json();})
  ]).then(function(res){
    var dyn = res[0].status==='fulfilled' ? res[0].value : [];
    rebuildFromDynamic(dyn);

    computeNewlyDetectedCountAndPersist(DATA);
    renderAccueil(); renderVeille(); renderAlertes();
    syncVersionLabels(); updateAlertBadges(); setTab('accueil');

    console.log('[OK] data total:', DATA.length, '| filtré:', DATA_FILTRE.length);
    console.log('[OK] exclusions CELEX:', EXCLUDED_CELEX.join(', '));
  }).catch(function(e){
    console.error('[Init] erreur', e);
    renderAccueil(); renderVeille(); renderAlertes(); setTab('accueil');
  });
});
