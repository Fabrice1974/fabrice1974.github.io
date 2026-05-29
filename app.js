/* RED Monitor — app.js */

var DATA = [
  {id:"red-1", cat:"eu_red", tag:"Normes RED", isNew:false,
   ref:"Directive 2014/53/UE — RED",
   title:"Directive RED — Equipements radioelectriques (texte de reference)",
   date:"16/04/2014", apply:"13/06/2016", type:"Directive UE",
   devices:["Smartphones","IoT","Routeurs","Wearables","SRD","Drones"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014L0053",
   summary:"Texte fondateur de la directive RED. Fixe les exigences essentielles de securite, compatibilite electromagnetique et utilisation efficace du spectre pour tous les equipements radioelectriques mis sur le marche UE. Tout appareil emettant ou recevant des ondes radio doit y etre conforme pour porter le marquage CE."},
  {id:"red-2", cat:"eu_red", tag:"Normes RED", isNew:false,
   ref:"Decision d'execution (UE) 2022/2444",
   title:"Normes harmonisees RED publiees au JOUE — liste consolidee 2022",
   date:"13/12/2022", apply:"En vigueur", type:"Decision d'execution",
   devices:["Smartphones","IoT","Routeurs","SRD","Wearables"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022D2444",
   summary:"Liste consolidee des normes harmonisees RED publiees au Journal officiel de l'UE. Les fabricants qui respectent ces normes beneficient de la presomption de conformite aux exigences essentielles RED. Des decisions de mise a jour sont publiees regulierement au JOUE."},
  {id:"red-3", cat:"eu_red", tag:"Cybersecurite RED", isNew:false,
   ref:"Reglement delegue (UE) 2022/30",
   title:"Acte delegue cybersecurite RED — Art. 3(3)(d)(e)(f) — Applicable depuis 01/08/2025",
   date:"29/10/2021", apply:"01/08/2025 au 10/12/2027", type:"Reglement delegue",
   devices:["Smartphones","IoT","Smartwatches","SmartGlasses","Routeurs","Cameras connectees"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0030",
   summary:"En vigueur depuis le 01/08/2025 pour tous les appareils connectes a internet. Obligations : protection des donnees personnelles, protection contre les acces non autorises, absence de fonctions frauduleuses. Ce reglement sera abroge le 11/12/2027 lors de la pleine application du Cyber Resilience Act (CRA), qui reprend et etend ces obligations."},
  {id:"cra-rapport", cat:"eu_related", tag:"Cybersecurite", isNew:true,
   ref:"Reglement (UE) 2024/2847 — CRA Art. 64",
   title:"Cyber Resilience Act — Obligations de declaration vulnerabilites et incidents",
   date:"23/10/2024", apply:"11/09/2026", type:"Reglement UE",
   devices:["Smartphones","Tablettes","Smartwatches","SmartGlasses","Routeurs","IoT"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
   summary:"Des le 11 septembre 2026, les fabricants doivent declarer toute vulnerabilite activement exploitee et tout incident grave a l'ENISA dans un delai de 24 heures. Cette obligation s'applique aux produits deja sur le marche. Elle precede d'un an la pleine application du CRA (11/12/2027)."},
  {id:"cra-1", cat:"eu_related", tag:"Cybersecurite", isNew:true,
   ref:"Reglement (UE) 2024/2847 — CRA pleine application",
   title:"Cyber Resilience Act — Pleine application toutes classes (I et II)",
   date:"23/10/2024", apply:"11/12/2027", type:"Reglement UE",
   devices:["Smartphones","Tablettes","Smartwatches","SmartGlasses","Routeurs","IoT","Cameras connectees","Passerelles domotiques"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
   summary:"A partir du 11/12/2027, tout produit numerique mis sur le marche UE doit satisfaire l'ensemble des exigences CRA : interdiction des mots de passe par defaut, correctifs de securite pendant toute la duree de vie, conformite evaluee (audit tiers pour produits Classe II). Produits Classe I : auto-evaluation possible. Produits Classe II : audit tiers obligatoire. Entree en vigueur du reglement : 10/12/2024."},
  {id:"espr-base", cat:"eu_related", tag:"Econception", isNew:false,
   ref:"Reglement (UE) 2024/1781 — ESPR",
   title:"ESPR — Reglement ecoconception pour produits durables (base)",
   date:"28/06/2024", apply:"19/07/2024", type:"Reglement UE",
   devices:["Smartphones","Tablettes","Wearables","Liseuses","IoT grand public"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781",
   summary:"Reglement cadre en vigueur depuis le 19/07/2024. Remplace la directive Ecoconception 2009/125/CE. Instaure le Passeport Numerique de Produit (DNP), les scores de reparabilite et les criteres de durabilite. Les actes delegues specifiques par categorie de produits (smartphones, wearables) sont publies separement."},
  {id:"espr-phones", cat:"eu_related", tag:"Econception", isNew:true,
   ref:"Acte delegue ESPR smartphones — non encore publie au JOUE",
   title:"ESPR — Durabilite et reparabilite smartphones et tablettes",
   date:"En cours de publication", apply:"28/06/2026 (prevu)", type:"Acte delegue attendu",
   devices:["Smartphones","Tablettes","Liseuses connectees"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781",
   summary:"L'acte delegue specifique aux smartphones n'est pas encore publie au JOUE. Selon le plan de travail ESPR, il imposera des juin 2026 : resistance IP54 minimum, mises a jour logicielles garanties 5 ans, pieces detachees 7 ans, score de reparabilite obligatoire sur l'emballage. Lien vers le reglement ESPR de base (2024/1781) en attendant la publication officielle."},
  {id:"espr-wearables", cat:"eu_related", tag:"Econception", isNew:false,
   ref:"Acte delegue ESPR wearables — en preparation",
   title:"ESPR — Smartwatches, trackers fitness, ecouteurs, SmartGlasses",
   date:"En preparation", apply:"Horizon 2027", type:"Acte delegue attendu",
   devices:["Smartwatches","Trackers fitness","Ecouteurs sans fil","SmartGlasses"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781",
   summary:"L'acte delegue specifique aux wearables est en cours de preparation. Il devrait imposer batterie remplacable, score de reparabilite affiche et duree de vie garantie. Non encore publie au JOUE. Lien vers le reglement ESPR de base (2024/1781)."},
  {id:"data-1", cat:"eu_related", tag:"Donnees IoT", isNew:false,
   ref:"Reglement (UE) 2023/2854 — Data Act",
   title:"Data Act — Acces aux donnees des objets connectes — Applicable depuis 12/09/2025",
   date:"22/12/2023", apply:"12/09/2025 (en vigueur)", type:"Reglement UE",
   devices:["Smartphones","IoT","Smartwatches","Electromenager connecte","Vehicules connectes"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854",
   summary:"Applicable depuis le 12 septembre 2025. Les utilisateurs ont le droit legal de recuperer et transferer leurs donnees generees par leurs appareils. Obligation d'integrer une API de portabilite dans chaque appareil connecte mis sur le marche apres le 12/09/2026. Interdiction des clauses contractuelles verrouillant les donnees chez le fabricant."},
  {id:"ai-1", cat:"eu_related", tag:"Intelligence Artificielle", isNew:false,
   ref:"Reglement (UE) 2024/1689 — AI Act",
   title:"AI Act — IA embarquee dans les appareils connectes",
   date:"12/07/2024", apply:"02/08/2026", type:"Reglement UE",
   devices:["Smartphones","SmartGlasses","Wearables sante","IoT decision autonome"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
   summary:"Entree en vigueur : 01/08/2024. Application progressive : pratiques IA interdites depuis le 02/02/2025, modeles IA generaux depuis le 02/08/2025, systemes a haut risque et IA embarquee dans les appareils connectes depuis le 02/08/2026. Obligations : classification par niveau de risque, transparence, interdiction de manipulation emotionnelle."},
  {id:"empco-1", cat:"eu_related", tag:"Greenwashing", isNew:false,
   ref:"Directive (UE) 2024/825 — EmpCo",
   title:"EmpCo — Interdiction allegations environnementales non prouvees",
   date:"06/03/2024", apply:"27/09/2026", type:"Directive",
   devices:["Tous appareils RED"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825",
   summary:"Les Etats membres doivent transposer la directive et l'appliquer au plus tard le 27/09/2026. 12 nouvelles pratiques commerciales trompeuses interdites, dont l'allegation neutre en carbone par compensation. Toute allegation ecologique doit etre prouvee par un organisme independant accredite. Sanctions jusqu'a 4% du CA annuel."},
  {id:"empco-2", cat:"eu_related", tag:"Garantie Durabilite", isNew:false,
   ref:"Directive (UE) 2024/825 — EmpCo volet garantie",
   title:"Label harmonise durabilite + notice de garantie legale",
   date:"06/03/2024", apply:"27/09/2026", type:"Directive",
   devices:["Smartphones","Tablettes","Wearables","IoT grand public"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825",
   summary:"La directive EmpCo instaure un label visuel normalise pour les produits beneficiant d'une garantie commerciale de durabilite, et standardise la notice de garantie legale (2 ans minimum) en 24 langues de l'UE. Application : 27/09/2026 dans les Etats membres ayant transpose la directive."},
  {id:"fr-1", cat:"fr", tag:"Anti-greenwashing", isNew:true,
   ref:"Projet de loi DDADUE — Art. 20-21",
   title:"Transposition EmpCo en droit francais — DDADUE",
   date:"En cours Parlement 2026", apply:"27/09/2026", type:"Projet de loi",
   devices:["Tous appareils RED"],
   link:"",
   summary:"Les articles 20 et 21 du projet de loi DDADUE transposent la directive EmpCo dans le Code de la consommation et le Code de l'environnement. La DGCCRF sera l'autorite de controle avec des sanctions jusqu'a 10% du CA annuel. Texte en cours d'adoption parlementaire — non encore publie au JORF."},
  {id:"fr-2", cat:"fr", tag:"Reparabilite", isNew:true,
   ref:"Decret d'application ESPR smartphones attendu",
   title:"Score de reparabilite v2 — Transposition ESPR smartphones",
   date:"Attendu 2026", apply:"28/06/2026 (prevu)", type:"Decret",
   devices:["Smartphones","Tablettes"],
   link:"",
   summary:"Decret qui alignera le score de reparabilite francais (actuellement sur 10 criteres) sur les nouvelles exigences ESPR. Les vendeurs en ligne devront afficher le score directement sur la fiche produit. Texte en cours de preparation — non encore publie au JORF."},
  {id:"fr-3", cat:"fr", tag:"Donnees IoT", isNew:false,
   ref:"Ordonnance de transposition Data Act attendue 2026",
   title:"Transposition Data Act — Portabilite des donnees IoT",
   date:"Attendue 2026", apply:"Le Data Act est applicable depuis 12/09/2025", type:"Ordonnance",
   devices:["IoT","Smartphones","Wearables"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854",
   summary:"Le Data Act (UE) 2023/2854 est directement applicable depuis le 12/09/2025. La France doit publier une ordonnance de transposition (habilitation prevue dans la loi DDADUE). La CNIL sera l'autorite nationale de controle. Ordonnance non encore publiee au JORF — lien vers le reglement Data Act directement applicable."}
];

var AGENDA = [
  {date:"12/09/2025", label:"Data Act — Applicable (deja en vigueur)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854"},
  {date:"28/06/2026", label:"ESPR Smartphones et Tablettes (prevu)", flags:"EU FR", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781"},
  {date:"02/08/2026", label:"AI Act — IA embarquee (haut risque)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689"},
  {date:"11/09/2026", label:"CRA — Declaration vulnerabilites (Art. 64)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"27/09/2026", label:"EmpCo — Anti-greenwashing", flags:"EU FR", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825"},
  {date:"12/09/2026", label:"Data Act — Nouveaux produits IoT concus pour portabilite", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854"},
  {date:"11/12/2027", label:"CRA — Pleine application toutes classes", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"Horizon 2027", label:"ESPR Wearables et SmartGlasses (prevu)", flags:"EU", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781"}
];

var currentTab   = 'accueil';
var scanLoading  = false;
var lastScan     = fmtDate(new Date());
var nextScan     = fmtDate(addDays(new Date(), 7));
var scanLog      = [];
var openCards    = {};
var veilleFilter = 'tous';
var prefs = {
  red_normes:true, cra:true, espr:true, data_act:true,
  ai_act:true, empco:true, fr_transpo:true,
  rien_nouveau:true, rappel_j60:true, rappel_j30:true
};

function fmtDate(d) {
  var p = function(n) { return String(n).padStart(2,'0'); };
  return p(d.getDate()) + '/' + p(d.getMonth()+1) + '/' + d.getFullYear()
       + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setTab(tab) {
  currentTab = tab;
  ['accueil','veille','alertes'].forEach(function(t) {
    var panel = document.getElementById('tab-' + t);
    var btn   = document.getElementById('nav-' + t);
    if (panel) panel.classList.toggle('hidden', t !== tab);
    if (btn)   btn.classList.toggle('active', t === tab);
  });
  if (tab === 'alertes') {
    var badge = document.getElementById('nav-badge');
    var bellBadge = document.getElementById('bell-count');
    if (badge) badge.style.display = 'none';
    if (bellBadge) bellBadge.style.display = 'none';
  }
}

function handleScan() {
  if (scanLoading) return;
  scanLoading = true;
  var btn = document.getElementById('scan-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Scan en cours...'; }
  setTimeout(function() {
    var d = new Date();
    lastScan = fmtDate(d);
    nextScan = fmtDate(addDays(d, 7));
    scanLog  = scanLog.concat([{date: lastScan, hasNew: false}]).slice(-20);
    scanLoading = false;
    renderAccueil();
    renderAlertes();
    if (btn) { btn.disabled = false; btn.textContent = 'Scan'; }
  }, 1800);
}

function toggleCard(id) {
  openCards[id] = !openCards[id];
  var box   = document.getElementById('summary-' + id);
  var arrow = document.getElementById('arrow-' + id);
  var lbl   = document.getElementById('lbl-' + id);
  if (box)   box.classList.toggle('hidden', !openCards[id]);
  if (arrow) arrow.style.transform = openCards[id] ? 'rotate(90deg)' : 'rotate(0deg)';
  if (lbl)   lbl.textContent = openCards[id] ? 'Masquer le resume' : 'Lire en clair';
}

function togglePref(key) {
  prefs[key] = !prefs[key];
  var sw = document.getElementById('sw-' + key);
  if (sw) {
    sw.classList.toggle('switch-on',  prefs[key]);
    sw.classList.toggle('switch-off', !prefs[key]);
    var knob = sw.querySelector('.switch-knob');
    if (knob) knob.style.left = prefs[key] ? '23px' : '3px';
  }
}

function setVeilleFilter(f) { veilleFilter = f; renderVeille(); }

function renderCard(reg) {
  var acc = reg.cat === 'eu_red' ? '#4a7dff' : reg.cat === 'fr' ? '#e04f5f' : '#38bdf8';
  var flag = reg.cat === 'eu_red' ? 'EU' : reg.cat === 'fr' ? 'FR' : 'EU';
  var linkLabel = reg.cat === 'fr' ? 'Legifrance' : 'EUR-Lex';
  var isOpen = openCards[reg.id] || false;
  var newChip = reg.isNew ? '<span class="chip chip-new">Nouveau</span>' : '';
  var catChip = '<span class="chip chip-' + reg.cat + '">' + flag + ' ' + esc(reg.tag) + '</span>';
  var deviceTags = reg.devices.map(function(d) { return '<span class="dtag">' + esc(d) + '</span>'; }).join('');
  var linkBtn = reg.link
    ? '<a href="' + reg.link + '" target="_blank" rel="noopener" class="eur-link" style="background:' + acc + '">' + linkLabel + ' &rarr;</a>'
    : '<span style="display:inline-block;font-size:10px;font-weight:700;padding:5px 12px;border-radius:6px;background:#2a2f4a;color:#7a7f9a;margin-top:10px">Texte non encore publie</span>';

  return '<div class="card-reg card-reg-' + reg.cat + '">'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px">'
    + newChip + catChip
    + '<span style="margin-left:auto;font-size:11px;color:#7a7f9a">' + esc(reg.date) + '</span>'
    + '</div>'
    + '<p style="font-size:14px;font-weight:700;color:#e8eaf0;line-height:1.4;margin-bottom:4px">' + esc(reg.title) + '</p>'
    + '<p style="font-size:10px;color:#7a7f9a;margin-bottom:8px">' + esc(reg.ref) + ' - ' + esc(reg.type) + '</p>'
    + '<div style="display:flex;flex-wrap:wrap;margin-bottom:10px">' + deviceTags + '</div>'
    + '<div class="date-pill" style="margin-bottom:10px">'
    + '<span>Application :</span>'
    + '<span style="font-size:11px;font-weight:700;color:#a78bfa">' + esc(reg.apply) + '</span>'
    + '</div>'
    + '<button class="summary-toggle" onclick="toggleCard(\'' + reg.id + '\')" style="color:' + acc + '">'
    + '<i id="arrow-' + reg.id + '" class="arrow" style="transform:' + (isOpen ? 'rotate(90deg)' : 'rotate(0deg)') + '">&#9658;</i>'
    + '<span id="lbl-' + reg.id + '">' + (isOpen ? 'Masquer' : 'Lire en clair') + '</span>'
    + '</button>'
    + '<div id="summary-' + reg.id + '" class="summary-box' + (isOpen ? '' : ' hidden') + '">'
    + '<p style="font-size:12px;color:#c0c4d8;line-height:1.75;margin-bottom:10px">' + esc(reg.summary) + '</p>'
    + linkBtn
    + '</div>'
    + '</div>';
}

function renderAccueil() {
  var agendaRows = AGENDA.map(function(e) {
    return '<a href="' + e.link + '" target="_blank" rel="noopener" style="text-decoration:none">'
      + '<div class="agenda-row" style="cursor:pointer">'
      + '<div class="agenda-date">'
      + '<p style="font-size:12px;font-weight:800;color:#a78bfa;margin:0">' + esc(e.date.slice(0,5)) + '</p>'
      + '<p style="font-size:10px;color:#a78bfa;margin:0">' + esc(e.date.slice(6)) + '</p>'
      + '</div>'
      + '<div style="flex:1">'
      + '<p style="font-size:12px;font-weight:600;color:#e8eaf0;line-height:1.4;margin:0">' + esc(e.flags) + ' ' + esc(e.label) + '</p>'
      + '<p style="font-size:10px;color:#4a7dff;margin-top:2px">Voir le texte</p>'
      + '</div>'
      + '</div></a>';
  }).join('');

  document.getElementById('tab-accueil').innerHTML =
    '<div style="padding:14px 16px 90px">'
    + '<div class="card card-green mb12">'
    + '<p class="fw7 fs12 t-green">Filtre actif : reglementations depuis 01/06/2026</p>'
    + '<p class="fs11" style="color:#86efac;margin-top:3px">' + DATA.length + ' textes en surveillance</p>'
    + '</div>'
    + '<div class="card card-fr mb10" style="display:flex;gap:10px">'
    + '<div><p class="fw7 fs12 t-fr">2 textes FR en cours d\'adoption</p>'
    + '<p class="fs11 lh15 mb0" style="color:#fca5a5;margin-top:4px">DDADUE art.20-21 (greenwashing) + Decret ESPR smartphones<br><strong>Echeances prevues : 27/09/2026 et 28/06/2026</strong></p>'
    + '</div></div>'
    + '<div class="card card-eu mb16" style="display:flex;gap:10px">'
    + '<div><p class="fw7 fs12 t-eu">CRA — Pleine application toutes classes (11/12/2027)</p>'
    + '<p class="fs11 lh15 mb0" style="color:#7dd3fc;margin-top:4px">Reporting vulnerabilites applicable des 11/09/2026</p>'
    + '</div></div>'
    + '<div class="card-plain mb16" style="display:flex;justify-content:space-between;align-items:center;gap:12px">'
    + '<div style="flex:1;min-width:0">'
    + '<p class="fw7 fs13 t-text mb6">Scraping hebdomadaire</p>'
    + '<p class="fs11 t-muted" style="margin-bottom:2px">Dernier scan : <span class="t-green">' + lastScan + '</span></p>'
    + '<p class="fs11 t-muted mb4">Prochain scan : <span class="t-warn">' + nextScan + '</span></p>'
    + '<p class="fs10 t-muted">EUR-Lex - Legifrance - JORF - ETSI</p>'
    + '</div>'
    + '<button id="scan-btn" class="scan-btn" onclick="handleScan()">' + (scanLoading ? 'En cours...' : 'Scan') + '</button>'
    + '</div>'
    + '<p class="section-label t-muted">CALENDRIER DES ECHEANCES</p>'
    + agendaRows
    + '</div>';
}

function renderVeille() {
  var filters = [
    {key:'tous', label:'Tous'},
    {key:'eu_red', label:'RED stricte'},
    {key:'eu_related', label:'Connexes EU'},
    {key:'fr', label:'Droit FR'}
  ];
  var groups = [
    {key:'eu_red', label:'TEXTES RED (2014/53/UE)', color:'#4a7dff'},
    {key:'eu_related', label:'REGLEMENTATIONS CONNEXES', color:'#38bdf8'},
    {key:'fr', label:'TRANSPOSITIONS DROIT FRANCAIS', color:'#e04f5f'}
  ];
  var shown = veilleFilter === 'tous' ? groups : groups.filter(function(g) { return g.key === veilleFilter; });
  var filterBtns = filters.map(function(f) {
    return '<button class="filter-btn ' + (veilleFilter === f.key ? 'active' : '') + '" onclick="setVeilleFilter(\'' + f.key + '\')">' + f.label + '</button>';
  }).join('');
  var groupsHtml = shown.map(function(g) {
    var cards = DATA.filter(function(r) { return r.cat === g.key; }).map(renderCard).join('');
    return '<p class="section-label" style="color:' + g.color + '">' + g.label + '</p>' + cards;
  }).join('');
  document.getElementById('tab-veille').innerHTML =
    '<div style="padding:14px 16px 90px">'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">' + filterBtns + '</div>'
    + groupsHtml
    + '</div>';
}

function renderAlertes() {
  var rows = [
    {key:'red_normes',  icon:'📐', label:'Nouvelles normes harmonisees RED'},
    {key:'cra',         icon:'🛡️', label:'Cyber Resilience Act (CRA)'},
    {key:'espr',        icon:'♻️', label:'Econception ESPR'},
    {key:'data_act',    icon:'💾', label:'Data Act IoT'},
    {key:'ai_act',      icon:'🤖', label:'AI Act IA embarquee'},
    {key:'empco',       icon:'🌿', label:'Greenwashing EmpCo Garanties'},
    {key:'fr_transpo',  icon:'🇫🇷', label:'Transpositions droit francais'},
    {key:'rien_nouveau',icon:'✅', label:'Confirmation scan (meme si rien de nouveau)'},
    {key:'rappel_j60',  icon:'📅', label:'Rappels echeances a J-60'},
    {key:'rappel_j30',  icon:'⏰', label:'Rappels echeances a J-30'}
  ];
  var logHtml = '';
  if (scanLog.length > 0) {
    var logItems = scanLog.slice().reverse().slice(0,5).map(function(l) {
      return '<p class="' + (l.hasNew ? 'log-new' : 'log-ok') + '">'
        + (l.hasNew ? 'Nouveaux textes detectes' : 'Aucune modification') + ' — ' + l.date + '</p>';
    }).join('');
    logHtml = '<div style="border-top:1px solid #2a2f4a;padding-top:8px">' + logItems + '</div>';
  }
  var switchRows = rows.map(function(r) {
    return '<div class="toggle-row">'
      + '<div class="toggle-left">'
      + '<span style="font-size:20px">' + r.icon + '</span>'
      + '<span class="fs13 t-text">' + r.label + '</span>'
      + '</div>'
      + '<button id="sw-' + r.key + '" class="switch ' + (prefs[r.key] ? 'switch-on' : 'switch-off') + '" onclick="togglePref(\'' + r.key + '\')">'
      + '<span class="switch-knob" style="left:' + (prefs[r.key] ? '23px' : '3px') + '"></span>'
      + '</button></div>';
  }).join('');
  document.getElementById('tab-alertes').innerHTML =
    '<div style="padding:14px 16px 90px">'
    + '<div class="card-plain mb16">'
    + '<p class="fw7 fs12 t-text mb8">Statut scraping</p>'
    + '<p class="fs11 t-muted" style="margin-bottom:2px">Dernier scan : <span class="t-green">' + lastScan + '</span></p>'
    + '<p class="fs11 t-muted" style="margin-bottom:2px">Prochain scan : <span class="t-warn">' + nextScan + '</span></p>'
    + '<p class="fs11 t-muted mb8">Frequence : 7 jours - Sources : EUR-Lex - Legifrance - JORF - ETSI</p>'
    + logHtml
    + '</div>'
    + '<p class="section-label t-muted">NOTIFICATIONS ACTIVES</p>'
    + switchRows
    + '</div>';
}

document.getElementById('bell-btn').addEventListener('click', function() { setTab('alertes'); });
document.getElementById('nav-accueil').addEventListener('click', function() { setTab('accueil'); });
document.getElementById('nav-veille').addEventListener('click',  function() { setTab('veille'); });
document.getElementById('nav-alertes').addEventListener('click', function() { setTab('alertes'); });

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

renderAccueil();
renderVeille();
renderAlertes();

fetch('data.json?v=' + Date.now())
  .then(function(r) { return r.ok ? r.json() : []; })
  .catch(function() { return []; })
  .then(function(dynamicItems) {
    if (dynamicItems && dynamicItems.length > 0) {
      var staticIds = DATA.map(function(d) { return d.id; });
      var newOnly = dynamicItems.filter(function(d) { return !staticIds.includes(d.id); });
      if (newOnly.length > 0) {
        DATA = newOnly.concat(DATA);
        renderAccueil();
        renderVeille();
        renderAlertes();
      }
    }
  });
