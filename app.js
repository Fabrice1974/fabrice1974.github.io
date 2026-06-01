/* ============================================================
   RED Monitor — app.js — v4.0.2
   - Ancien design conservé
   - Compat data.json / scan-meta.json
   - Badge alertes dynamique (nombre réel de isNew)
   ============================================================ */

var APP_VERSION = '4.0';

// ─────────────────────────────────────────────────────────────
// Date filtre
// ─────────────────────────────────────────────────────────────
var DATE_FILTRE = new Date(2026, 5, 1); // 01/06/2026

// ─────────────────────────────────────────────────────────────
// Données statiques de base (socle)
// ─────────────────────────────────────────────────────────────
var DATA = [
  {id:"red-1", cat:"eu_red", tag:"Normes RED", isNew:false, ref:"Directive 2014/53/UE — RED", title:"Directive RED — Equipements radioelectriques (texte de reference)", date:"16/04/2014", apply:"13/06/2016", type:"Directive UE", applyDate:null, devices:["Smartphones","IoT","Routeurs","Wearables","SRD","Drones"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014L0053", summary:"Texte fondateur RED."},
  {id:"red-2", cat:"eu_red", tag:"Normes RED", isNew:false, ref:"Decision d'execution (UE) 2022/2444", title:"Normes harmonisees RED publiees au JOUE — liste consolidee 2022", date:"13/12/2022", apply:"En vigueur", type:"Decision d'execution", applyDate:null, devices:["Smartphones","IoT","Routeurs","SRD","Wearables"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022D2444", summary:"Liste consolidee des normes harmonisees RED."},
  {id:"red-3", cat:"eu_red", tag:"Cybersecurite RED", isNew:false, ref:"Reglement delegue (UE) 2022/30", title:"Acte delegue cybersecurite RED — Art. 3(3)(d)(e)(f)", date:"29/10/2021", apply:"01/08/2025 au 10/12/2027", type:"Reglement delegue", applyDate:null, devices:["Smartphones","IoT","Smartwatches","SmartGlasses","Routeurs","Cameras connectees"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0030", summary:"Acte cyber RED."},

  {id:"cra-rapport", cat:"eu_related", tag:"Cybersecurite", isNew:true, ref:"Reglement (UE) 2024/2847 — CRA Art. 64", title:"Cyber Resilience Act — Declaration vulnerabilites et incidents", date:"23/10/2024", apply:"11/09/2026", type:"Reglement UE", applyDate:new Date(2026,8,11), devices:["Smartphones","Tablettes","Smartwatches","SmartGlasses","Routeurs","IoT"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847", summary:"Declaration incidents ENISA."},
  {id:"cra-1", cat:"eu_related", tag:"Cybersecurite", isNew:true, ref:"Reglement (UE) 2024/2847 — CRA pleine application", title:"Cyber Resilience Act — Pleine application toutes classes (I et II)", date:"23/10/2024", apply:"11/12/2027", type:"Reglement UE", applyDate:new Date(2027,11,11), devices:["Smartphones","Tablettes","Smartwatches","SmartGlasses","Routeurs","IoT"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847", summary:"Pleine application CRA."},

  {id:"espr-base", cat:"eu_related", tag:"Econception", isNew:false, ref:"Reglement (UE) 2024/1781 — ESPR", title:"ESPR — Reglement ecoconception pour produits durables (base)", date:"28/06/2024", apply:"19/07/2024", type:"Reglement UE", applyDate:null, devices:["Smartphones","Tablettes","Wearables","IoT grand public"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781", summary:"Cadre ESPR."},
  {id:"espr-phones", cat:"eu_related", tag:"Econception", isNew:false, ref:"Reglement (UE) 2023/1670 — Ecoconception smartphones", title:"Ecoconception smartphones et tablettes — en vigueur 20/06/2025", date:"16/06/2023", apply:"20/06/2025", type:"Reglement UE", applyDate:null, devices:["Smartphones","Tablettes"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1670", summary:"Exigences smartphones/tablettes."},
  {id:"espr-phones-delegue", cat:"eu_related", tag:"Econception", isNew:false, ref:"Acte delegue ESPR smartphones", title:"ESPR — Acte delegue smartphones (Passeport Numerique Produit)", date:"En preparation", apply:"Horizon 2027-2028", type:"Acte delegue attendu", applyDate:new Date(2027,6,1), devices:["Smartphones","Tablettes"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781", summary:"Acte delegue attendu."},
  {id:"espr-wearables", cat:"eu_related", tag:"Econception", isNew:false, ref:"Acte delegue ESPR wearables", title:"ESPR — Smartwatches, trackers fitness, ecouteurs, SmartGlasses", date:"En preparation", apply:"Horizon 2027", type:"Acte delegue attendu", applyDate:new Date(2027,6,1), devices:["Smartwatches","Trackers","Ecouteurs","SmartGlasses"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781", summary:"Acte delegue wearables attendu."},

  {id:"batteries-1", cat:"eu_related", tag:"Batteries", isNew:true, ref:"Reglement (UE) 2023/1542", title:"Batterie remplacable par l'utilisateur — Smartphones obligatoire", date:"28/06/2023", apply:"18/02/2027", type:"Reglement UE", applyDate:new Date(2027,1,18), devices:["Smartphones","Tablettes","Wearables"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1542", summary:"Batterie remplaçable."},
  {id:"data-1", cat:"eu_related", tag:"Donnees IoT", isNew:false, ref:"Reglement (UE) 2023/2854 — Data Act", title:"Data Act — Nouveaux produits IoT concus pour portabilite", date:"22/12/2023", apply:"12/09/2026", type:"Reglement UE", applyDate:new Date(2026,8,12), devices:["Smartphones","IoT","Wearables"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854", summary:"Portabilité des données."},
  {id:"ai-1", cat:"eu_related", tag:"Intelligence Artificielle", isNew:false, ref:"Reglement (UE) 2024/1689 — AI Act", title:"AI Act — IA embarquee dans les appareils connectes", date:"12/07/2024", apply:"02/08/2026", type:"Reglement UE", applyDate:new Date(2026,7,2), devices:["Smartphones","SmartGlasses","Wearables"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689", summary:"AI Act IA embarquée."},
  {id:"empco-1", cat:"eu_related", tag:"Greenwashing", isNew:false, ref:"Directive (UE) 2024/825 — EmpCo", title:"EmpCo — Interdiction allegations environnementales non prouvees", date:"06/03/2024", apply:"27/09/2026", type:"Directive", applyDate:new Date(2026,8,27), devices:["Tous appareils RED"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825", summary:"Anti-greenwashing."},
  {id:"empco-2", cat:"eu_related", tag:"Garantie Durabilite", isNew:false, ref:"Directive (UE) 2024/825 — EmpCo volet garantie", title:"Label harmonise durabilite + notice de garantie legale", date:"06/03/2024", apply:"27/09/2026", type:"Directive", applyDate:new Date(2026,8,27), devices:["Smartphones","Tablettes","Wearables"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825", summary:"Volet garantie durabilité."},

  {id:"fr-1", cat:"fr", tag:"Anti-greenwashing", isNew:true, ref:"Projet de loi DDADUE — Art. 20-21", title:"Transposition EmpCo en droit francais — DDADUE", date:"En cours Parlement 2026", apply:"27/09/2026", type:"Projet de loi", applyDate:new Date(2026,8,27), devices:["Tous appareils RED"], link:"", summary:"Transposition FR EmpCo."},
  {id:"fr-2", cat:"fr", tag:"Reparabilite", isNew:true, ref:"Decret d'application ESPR smartphones attendu", title:"Score de reparabilite v2 — Transposition ESPR smartphones", date:"Attendu 2026", apply:"Horizon 2026", type:"Decret", applyDate:new Date(2026,11,31), devices:["Smartphones","Tablettes"], link:"", summary:"Décret attendu."},
  {id:"fr-3", cat:"fr", tag:"Donnees IoT", isNew:false, ref:"Ordonnance de transposition Data Act attendue 2026", title:"Transposition Data Act — Portabilite des donnees IoT", date:"Attendue 2026", apply:"Horizon 2026", type:"Ordonnance", applyDate:new Date(2026,11,31), devices:["IoT","Smartphones","Wearables"], link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854", summary:"Transposition FR Data Act."}
];

// ─────────────────────────────────────────────────────────────
// Agenda
// ─────────────────────────────────────────────────────────────
var AGENDA = [
  {date:"02/08/2026", label:"AI Act — IA embarquee (haut risque)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689"},
  {date:"11/09/2026", label:"CRA — Declaration vulnerabilites (Art. 64)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"12/09/2026", label:"Data Act — Nouveaux produits IoT concus pour portabilite", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854"},
  {date:"27/09/2026", label:"EmpCo — Anti-greenwashing + garantie durabilite", flags:"EU FR", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825"},
  {date:"18/02/2027", label:"Batterie remplacable utilisateur — Smartphones obligatoire", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1542"},
  {date:"11/12/2027", label:"CRA — Pleine application toutes classes", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"Horizon 2027-2028", label:"ESPR Acte delegue smartphones (DPP) — attendu", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781"},
  {date:"Horizon 2027", label:"ESPR Wearables et SmartGlasses — attendu", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781"}
];

// ─────────────────────────────────────────────────────────────
// Etat UI
// ─────────────────────────────────────────────────────────────
var currentTab='accueil';
var scanLoading=false;
var lastScan=fmtDate(new Date());
var nextScan=fmtDate(addDays(new Date(),7));
var scanLog=[];
var openCards={};
var veilleFilter='tous';
var prefs={red_normes:true,cra:true,espr:true,data_act:true,ai_act:true,empco:true,fr_transpo:true,rien_nouveau:true,rappel_j60:true,rappel_j30:true};

// ─────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────
function fmtDate(d){var p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());}
function addDays(d,n){return new Date(d.getTime()+n*86400000);}
function esc(s){return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function parseFRDateStrict(str){var m=String(str||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return null;var d=new Date(+m[3],+m[2]-1,+m[1]);return isNaN(d)?null:d;}
function parseApplyToDate(apply){
  var txt=String(apply||'');
  var d=parseFRDateStrict(txt); if(d) return d;
  var r=txt.match(/(\d{2}\/\d{2}\/\d{4}).*(\d{2}\/\d{2}\/\d{4})/); if(r) return parseFRDateStrict(r[1]);
  var h=txt.match(/Horizon\s+(\d{4})/i); if(h) return new Date(+h[1],6,1);
  var y=txt.match(/(20\d{2})/); if(y) return new Date(+y[1],11,31);
  return null;
}
function computeDataFiltre(){
  return DATA.filter(function(d){
    var dt=d.applyDate instanceof Date?d.applyDate:parseApplyToDate(d.apply);
    return dt && dt.getTime()>=DATE_FILTRE.getTime();
  });
}
var DATA_FILTRE=computeDataFiltre();

// ─────────────────────────────────────────────────────────────
// Badge dynamique (correction clé)
// ─────────────────────────────────────────────────────────────
function updateAlertBadges(){
  var count=(DATA||[]).filter(function(item){return !!item.isNew;}).length;
  var bell=document.getElementById('bell-count');
  var nav=document.getElementById('nav-badge');

  if(bell){
    bell.textContent=String(count);
    bell.style.display=count>0?'flex':'none';
  }
  if(nav){
    nav.textContent=String(count);
    nav.style.display=count>0?'flex':'none';
  }
  console.log('[Badge] nouveautés =',count);
}

// ─────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────
function setTab(tab){
  currentTab=tab;
  ['accueil','veille','alertes'].forEach(function(t){
    var panel=document.getElementById('tab-'+t);
    var btn=document.getElementById('nav-'+t);
    if(panel) panel.classList.toggle('hidden',t!==tab);
    if(btn) btn.classList.toggle('active',t===tab);
  });
  if(tab==='alertes'){
    var badge=document.getElementById('nav-badge');
    var bell=document.getElementById('bell-count');
    if(badge) badge.style.display='none';
    if(bell) bell.style.display='none';
  } else {
    updateAlertBadges();
  }
}

// ─────────────────────────────────────────────────────────────
// Scan manuel UI
// ─────────────────────────────────────────────────────────────
function handleScan(){
  if(scanLoading) return;
  scanLoading=true;
  console.log('[Scan] start');
  var btn=document.getElementById('scan-btn');
  if(btn){btn.disabled=true;btn.textContent='Scan en cours...';}

  setTimeout(function(){
    var d=new Date();
    lastScan=fmtDate(d);
    nextScan=fmtDate(addDays(d,7));
    scanLog=scanLog.concat([{date:lastScan,hasNew:false}]).slice(-20);
    scanLoading=false;
    renderAccueil();
    renderAlertes();
    updateAlertBadges();
    if(btn){btn.disabled=false;btn.textContent='Scan';}
    console.log('[Scan] done',lastScan);
  },1000);
}

// ─────────────────────────────────────────────────────────────
// Cards
// ─────────────────────────────────────────────────────────────
function toggleCard(id){
  openCards[id]=!openCards[id];
  var box=document.getElementById('summary-'+id);
  var arr=document.getElementById('arrow-'+id);
  var lbl=document.getElementById('lbl-'+id);
  if(box) box.classList.toggle('hidden',!openCards[id]);
  if(arr) arr.style.transform=openCards[id]?'rotate(90deg)':'rotate(0deg)';
  if(lbl) lbl.textContent=openCards[id]?'Masquer le resume':'Lire en clair';
}
function togglePref(key){
  prefs[key]=!prefs[key];
  var sw=document.getElementById('sw-'+key);
  if(sw){
    sw.classList.toggle('switch-on',prefs[key]);
    sw.classList.toggle('switch-off',!prefs[key]);
    var k=sw.querySelector('.switch-knob'); if(k) k.style.left=prefs[key]?'23px':'3px';
  }
}
function setVeilleFilter(f){veilleFilter=f;renderVeille();}

function renderAccueilCards(){
  var now=new Date(),html='';
  var withDates=AGENDA.filter(function(e){return /^\d{2}\/\d{2}\/\d{4}$/.test(e.date);})
    .map(function(e){var p=e.date.split('/');return {item:e,ts:new Date(p[2],p[1]-1,p[0]).getTime()};})
    .filter(function(e){return e.ts>=DATE_FILTRE.getTime();})
    .sort(function(a,b){return a.ts-b.ts;});

  if(withDates.length){
    var next=withDates[0];
    var days=Math.ceil((next.ts-now.getTime())/86400000);
    var c=days<=0?['#4ade80','#0d2a18','#1a5a30']:days<=30?['#e04f5f','#2a0d12','#5a1a22']:days<=90?['#f59e0b','#2a1a00','#5a3a00']:['#38bdf8','#0d2030','#1a4060'];
    html+='<div class="card mb10" style="background:'+c[1]+';border:1px solid '+c[2]+';border-left:3px solid '+c[0]+'"><p class="fw7 fs11 mb4" style="color:'+c[0]+';letter-spacing:0.08em">⏰ PROCHAINE ÉCHÉANCE — '+(days<=0?'En vigueur':'J-'+days)+'</p><p class="fs13 fw7 t-text mb4">'+esc(next.item.label)+'</p><p class="fs11 t-muted">'+esc(next.item.flags)+' · '+esc(next.item.date)+'</p></div>';
  }

  var fr=DATA_FILTRE.filter(function(d){return d.cat==='fr'&&d.isNew;});
  if(fr.length){
    html+='<div class="card card-fr mb12"><p class="fw7 fs12 t-fr mb6">🇫🇷 '+fr.length+' texte(s) FR en cours d\'adoption</p>'
      +fr.map(function(d){return '<p class="fs11" style="color:#fca5a5;margin-top:3px;line-height:1.4">· '+esc(d.ref)+' — '+esc(d.apply)+'</p>';}).join('')
      +'</div>';
  }

  html+='<div class="card card-green mb16"><p class="fw7 fs12 t-green">'+DATA_FILTRE.length+' textes surveillés — échéances après 01/06/2026</p><p class="fs11" style="color:#86efac;margin-top:3px">Sources : EUR-Lex · Legifrance · JORF · ETSI</p></div>';
  return html;
}

function renderCard(reg){
  var acc=reg.cat==='eu_red'?'#4a7dff':reg.cat==='fr'?'#e04f5f':'#38bdf8';
  var flag=reg.cat==='eu_red'?'EU':reg.cat==='fr'?'FR':'EU';
  var isOpen=!!openCards[reg.id];
  var newChip=reg.isNew?'<span class="chip chip-new">Nouveau</span>':'';
  var catChip='<span class="chip chip-'+reg.cat+'">'+flag+' '+esc(reg.tag)+'</span>';
  var devices=(reg.devices||[]).map(function(d){return '<span class="dtag">'+esc(d)+'</span>';}).join('');
  var linkBtn=reg.link?'<a href="'+reg.link+'" target="_blank" rel="noopener" class="eur-link" style="background:'+acc+'">'+(reg.cat==='fr'?'Legifrance':'EUR-Lex')+' &rarr;</a>'
                    :'<span style="display:inline-block;font-size:10px;font-weight:700;padding:5px 12px;border-radius:6px;background:#2a2f4a;color:#7a7f9a;margin-top:10px">Texte non encore publie</span>';

  return '<div class="card-reg card-reg-'+reg.cat+'"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px">'+newChip+catChip+'<span style="margin-left:auto;font-size:11px;color:#7a7f9a">'+esc(reg.date||'')+'</span></div><p style="font-size:14px;font-weight:700;color:#e8eaf0;line-height:1.4;margin-bottom:4px">'+esc(reg.title||'')+'</p><p style="font-size:10px;color:#7a7f9a;margin-bottom:8px">'+esc(reg.ref||'')+' — '+esc(reg.type||'')+'</p><div style="display:flex;flex-wrap:wrap;margin-bottom:10px">'+devices+'</div><div class="date-pill" style="margin-bottom:10px"><span>Application :</span><span style="font-size:11px;font-weight:700;color:#a78bfa">'+esc(reg.apply||'À confirmer')+'</span></div><button class="summary-toggle" onclick="toggleCard(\''+reg.id+'\')" style="color:'+acc+'"><i id="arrow-'+reg.id+'" class="arrow" style="transform:'+(isOpen?'rotate(90deg)':'rotate(0deg)')+'">&#9658;</i><span id="lbl-'+reg.id+'">'+(isOpen?'Masquer':'Lire en clair')+'</span></button><div id="summary-'+reg.id+'" class="summary-box'+(isOpen?'':' hidden')+'"><p style="font-size:12px;color:#c0c4d8;line-height:1.75;margin-bottom:10px">'+esc(reg.summary||'')+'</p>'+linkBtn+'</div></div>';
}

function renderAccueil(){
  var agendaRows=AGENDA.filter(function(e){
    if(!/^\d{2}\/\d{2}\/\d{4}$/.test(e.date)) return true;
    var p=e.date.split('/'); var ts=new Date(p[2],p[1]-1,p[0]).getTime();
    return ts>=DATE_FILTRE.getTime();
  }).map(function(e){
    return '<a href="'+e.link+'" target="_blank" rel="noopener" style="text-decoration:none"><div class="agenda-row"><div class="agenda-date"><p style="font-size:12px;font-weight:800;color:#a78bfa;margin:0">'+esc(e.date.slice(0,5))+'</p><p style="font-size:10px;color:#a78bfa;margin:0">'+esc(e.date.slice(6))+'</p></div><div style="flex:1"><p style="font-size:12px;font-weight:600;color:#e8eaf0;line-height:1.4;margin:0">'+esc(e.flags)+' '+esc(e.label)+'</p><p style="font-size:10px;color:#4a7dff;margin-top:2px">Voir le texte</p></div></div></a>';
  }).join('');

  document.getElementById('tab-accueil').innerHTML=
    '<div style="padding:14px 16px 90px"><div style="display:flex;justify-content:flex-end;margin-bottom:8px"><span style="font-size:10px;font-weight:700;color:#7a7f9a;background:#1a1e35;border:1px solid #2a2f4a;border-radius:6px;padding:3px 10px;letter-spacing:0.05em">v'+APP_VERSION+' — '+lastScan.slice(0,10)+'</span></div>'
    +renderAccueilCards()
    +'<div class="card-plain mb16" style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div style="flex:1;min-width:0"><p class="fw7 fs13 t-text mb6">Scraping hebdomadaire</p><p class="fs11 t-muted" style="margin-bottom:2px">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted mb4">Prochain scan : <span class="t-warn">'+nextScan+'</span></p><p class="fs10 t-muted">EUR-Lex · Legifrance · JORF · ETSI</p></div><button id="scan-btn" class="scan-btn" onclick="handleScan()">'+(scanLoading?'En cours...':'Scan')+'</button></div>'
    +'<p class="section-label t-muted">CALENDRIER DES ÉCHÉANCES — après 01/06/2026</p>'+agendaRows+'</div>';
}

function renderVeille(){
  var filters=[{key:'tous',label:'Tous'},{key:'eu_red',label:'RED stricte'},{key:'eu_related',label:'Connexes EU'},{key:'fr',label:'Droit FR'}];
  var groups=[{key:'eu_red',label:'TEXTES RED (2014/53/UE)',color:'#4a7dff'},{key:'eu_related',label:'REGLEMENTATIONS CONNEXES',color:'#38bdf8'},{key:'fr',label:'TRANSPOSITIONS DROIT FRANCAIS',color:'#e04f5f'}];
  var shown=veilleFilter==='tous'?groups:groups.filter(function(g){return g.key===veilleFilter;});
  var filterBtns=filters.map(function(f){return '<button class="filter-btn '+(veilleFilter===f.key?'active':'')+'" onclick="setVeilleFilter(\''+f.key+'\')">'+f.label+'</button>';}).join('');
  var groupsHtml=shown.map(function(g){
    var cards=DATA_FILTRE.filter(function(r){return r.cat===g.key;}).map(renderCard).join('');
    var empty=cards===''?'<p class="fs12 t-muted" style="padding:12px 0">Aucun texte dans cette catégorie après le 01/06/2026</p>':cards;
    return '<p class="section-label" style="color:'+g.color+'">'+g.label+'</p>'+empty;
  }).join('');

  document.getElementById('tab-veille').innerHTML='<div style="padding:14px 16px 90px"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">'+filterBtns+'</div><p class="fs10 t-muted" style="margin-bottom:12px;font-style:italic">'+DATA_FILTRE.length+' textes — échéances après 01/06/2026</p>'+groupsHtml+'</div>';
}

function renderAlertes(){
  var rows=[
    {key:'red_normes',icon:'📐',label:'Nouvelles normes harmonisees RED'},
    {key:'cra',icon:'🛡️',label:'Cyber Resilience Act (CRA)'},
    {key:'espr',icon:'♻️',label:'Econception ESPR'},
    {key:'data_act',icon:'💾',label:'Data Act IoT'},
    {key:'ai_act',icon:'🤖',label:'AI Act IA embarquee'},
    {key:'empco',icon:'🌿',label:'Greenwashing EmpCo Garanties'},
    {key:'fr_transpo',icon:'🇫🇷',label:'Transpositions droit francais'},
    {key:'rien_nouveau',icon:'✅',label:'Confirmation scan (meme si rien de nouveau)'},
    {key:'rappel_j60',icon:'📅',label:'Rappels echeances a J-60'},
    {key:'rappel_j30',icon:'⏰',label:'Rappels echeances a J-30'}
  ];

  var logHtml='';
  if(scanLog.length){
    var logItems=scanLog.slice().reverse().slice(0,5).map(function(l){
      return '<p class="'+(l.hasNew?'log-new':'log-ok')+'">'+(l.hasNew?'🆕 Nouveaux textes detectes':'✅ Aucune modification')+' — '+l.date+'</p>';
    }).join('');
    logHtml='<div style="border-top:1px solid #2a2f4a;padding-top:8px">'+logItems+'</div>';
  }

  var switchRows=rows.map(function(r){
    return '<div class="toggle-row"><div class="toggle-left"><span style="font-size:20px">'+r.icon+'</span><span class="fs13 t-text">'+r.label+'</span></div><button id="sw-'+r.key+'" class="switch '+(prefs[r.key]?'switch-on':'switch-off')+'" onclick="togglePref(\''+r.key+'\')"><span class="switch-knob" style="left:'+(prefs[r.key]?'23px':'3px')+'"></span></button></div>';
  }).join('');

  document.getElementById('tab-alertes').innerHTML=
    '<div style="padding:14px 16px 90px"><div class="card-plain mb16"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><p class="fw7 fs12 t-text" style="margin:0">Statut scraping</p><span style="font-size:11px;font-weight:800;color:#a78bfa;background:#1a0d2a;border:1px solid #a78bfa44;border-radius:6px;padding:3px 10px">v'+APP_VERSION+'</span></div><p class="fs11 t-muted" style="margin-bottom:2px">Dernier scan : <span class="t-green">'+lastScan+'</span></p><p class="fs11 t-muted" style="margin-bottom:2px">Prochain scan : <span class="t-warn">'+nextScan+'</span></p><p class="fs11 t-muted mb8">Frequence : 7 jours · Sources : EUR-Lex · Legifrance · JORF · ETSI</p>'+logHtml+'</div><p class="section-label t-muted">NOTIFICATIONS ACTIVES</p>'+switchRows+'</div>';
}

// ─────────────────────────────────────────────────────────────
// Intégration dynamique data.json + scan-meta.json
// ─────────────────────────────────────────────────────────────
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
  var ids=DATA.map(function(d){return d.id;});
  var newOnly=(dynamicItems||[]).map(normalizeDynamicItem).filter(function(d){return !ids.includes(d.id);});

  if(newOnly.length){
    console.log('[Data] nouveaux chargés:',newOnly.length);
    DATA=newOnly.concat(DATA);
  } else {
    console.log('[Data] aucun nouveau id');
  }

  DATA_FILTRE=computeDataFiltre();
}

function applyScanMeta(meta){
  if(!meta||!meta.lastScan) return;
  var d=new Date(meta.lastScan);
  if(!isNaN(d.getTime())){
    lastScan=fmtDate(d);
    nextScan=fmtDate(addDays(d,7));
  }
}

// ─────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  console.log('[App] RED Monitor v'+APP_VERSION);

  var bellBtn=document.getElementById('bell-btn');
  var navAccueil=document.getElementById('nav-accueil');
  var navVeille=document.getElementById('nav-veille');
  var navAlertes=document.getElementById('nav-alertes');

  if(bellBtn) bellBtn.addEventListener('click',function(){setTab('alertes');});
  if(navAccueil) navAccueil.addEventListener('click',function(){setTab('accueil');});
  if(navVeille) navVeille.addEventListener('click',function(){setTab('veille');});
  if(navAlertes) navAlertes.addEventListener('click',function(){setTab('alertes');});

  renderAccueil();
  renderVeille();
  renderAlertes();
  updateAlertBadges();

  Promise.allSettled([
    fetch('scan-meta.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok) throw new Error('scan-meta HTTP '+r.status); return r.json();}),
    fetch('data.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok) throw new Error('data HTTP '+r.status); return r.json();})
  ]).then(function(res){
    var meta=res[0].status==='fulfilled'?res[0].value:null;
    var dyn=res[1].status==='fulfilled'?res[1].value:[];
    if(meta) applyScanMeta(meta);
    if(Array.isArray(dyn)&&dyn.length) rebuildFromDynamic(dyn);

    renderAccueil();
    renderVeille();
    renderAlertes();
    updateAlertBadges();
    console.log('[App] rendu final OK');
  }).catch(function(e){
    console.warn('[App] chargement dynamique partiel:',e.message);
  });
});
