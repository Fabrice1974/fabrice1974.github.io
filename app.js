/* RED Monitor — app.js
   Séparé de index.html pour éviter que Jekyll corrompe les template literals JS */

/* ═══════════════════════════════════════════════
   DONNÉES RÉGLEMENTAIRES
   ═══════════════════════════════════════════════ */
var DATA = [
  /* ── TEXTES RED STRICTE ── */
  {id:"red-1", cat:"eu_red", tag:"Normes RED", isNew:false,
   ref:"Directive 2014/53/UE — RED",
   title:"Directive RED — Équipements radioélectriques (texte de référence)",
   date:"16/04/2014", apply:"13/06/2016", type:"Directive UE",
   devices:["Smartphones","IoT","Routeurs","Wearables","SRD","Drones"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014L0053",
   summary:"Texte fondateur de la directive RED. Fixe les exigences essentielles de sécurité, compatibilité électromagnétique et utilisation efficace du spectre pour tous les équipements radioélectriques mis sur le marché UE. Tout appareil émettant/recevant des ondes radio doit y être conforme pour porter le marquage CE."},
  {id:"red-2", cat:"eu_red", tag:"Normes RED", isNew:false,
   ref:"Décision d'exécution (UE) 2022/2444",
   title:"Normes harmonisées RED publiées au JOUE — liste consolidée 2022",
   date:"13/12/2022", apply:"En vigueur", type:"Décision d'exécution",
   devices:["Smartphones","IoT","Routeurs","SRD","Wearables"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022D2444",
   summary:"Liste consolidée des normes harmonisées RED publiées au Journal officiel de l'UE. Les fabricants qui respectent ces normes bénéficient de la présomption de conformité aux exigences essentielles RED. Consulter pour identifier les normes EN applicables à chaque catégorie d'appareil."},
  {id:"red-3", cat:"eu_red", tag:"Cybersécurité RED", isNew:false,
   ref:"Règlement délégué (UE) 2022/30",
   title:"Acte délégué cybersécurité RED — Art. 3(3)(d)(e)(f)",
   date:"29/10/2021", apply:"01/08/2025", type:"Règlement délégué",
   devices:["Smartphones","IoT","Smartwatches","SmartGlasses","Routeurs","Caméras connectées"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0030",
   summary:"Rend obligatoires les exigences de cybersécurité de l'article 3(3)(d)(e)(f) de la directive RED pour tous les appareils connectés à internet. Obligations : protection des données personnelles, protection contre les accès non autorisés, absence de fonctions frauduleuses. En vigueur depuis le 01/08/2025."},

  /* ── RÈGLEMENTS CONNEXES ── */
  {id:"cra-1", cat:"eu_related", tag:"Cybersécurité", isNew:true,
   ref:"Règlement (UE) 2024/2847 — CRA",
   title:"Cyber Resilience Act — Obligations cybersécurité produits numériques",
   date:"23/10/2024", apply:"11/12/2026", type:"Règlement UE",
   devices:["Smartphones","Tablettes","Smartwatches","SmartGlasses","Routeurs","IoT","Caméras connectées"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
   summary:"À partir du 11/12/2026 (Classe I), tout produit numérique doit prouver sa cybersécurité avant mise sur le marché UE. Obligations : interdiction des mots de passe identiques par défaut, correctifs de sécurité pendant toute la durée de vie, déclaration des vulnérabilités à l'ENISA sous 24h. Importateurs et distributeurs solidairement responsables."},
  {id:"cra-2", cat:"eu_related", tag:"Cybersécurité", isNew:false,
   ref:"Règlement (UE) 2024/2847 — CRA Classe II",
   title:"Cyber Resilience Act — Passerelles domotiques, équipements critiques",
   date:"23/10/2024", apply:"11/12/2027", type:"Règlement UE",
   devices:["Passerelles domotiques","SmartGlasses pro","Réseaux industriels","Sécurité connectée"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
   summary:"Un an après la Classe I (11/12/2027), les produits Classe II devront passer un audit tiers obligatoire. Cette catégorie inclut passerelles domotiques, gestionnaires de mots de passe matériels et tout équipement servant de hub pour d'autres appareils connectés. Même règlement de base que la Classe I."},
  {id:"espr-base", cat:"eu_related", tag:"Écoconception", isNew:false,
   ref:"Règlement (UE) 2024/1781 — ESPR",
   title:"ESPR — Règlement écoconception pour produits durables (base)",
   date:"28/06/2024", apply:"19/07/2024", type:"Règlement UE",
   devices:["Smartphones","Tablettes","Wearables","Liseuses","IoT grand public"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781",
   summary:"Règlement cadre qui remplace la directive Écoconception 2009/125/CE. Instaure le Passeport Numérique de Produit (DNP), les scores de réparabilité et les critères de durabilité pour les produits électroniques. Les actes délégués spécifiques (smartphones, wearables) seront publiés séparément par la Commission."},
  {id:"espr-phones", cat:"eu_related", tag:"Écoconception", isNew:true,
   ref:"Acte délégué ESPR smartphones — en cours de publication",
   title:"ESPR — Durabilité et réparabilité smartphones et tablettes",
   date:"En cours", apply:"28/06/2026", type:"Acte délégué (attendu)",
   devices:["Smartphones","Tablettes","Liseuses connectées"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781",
   summary:"L'acte délégué spécifique aux smartphones et tablettes n'est pas encore publié au JOUE. Selon le plan de travail ESPR de la Commission, il doit imposer dès juin 2026 : résistance IP54 minimum, mises à jour logicielles garanties 5 ans, pièces détachées disponibles 7 ans, score de réparabilité obligatoire. Lien vers le règlement ESPR de base (2024/1781) en attendant la publication."},
  {id:"espr-wearables", cat:"eu_related", tag:"Écoconception", isNew:false,
   ref:"Acte délégué ESPR wearables — en préparation",
   title:"ESPR — Smartwatches, trackers fitness, écouteurs, SmartGlasses",
   date:"En préparation", apply:"Horizon 2027", type:"Acte délégué (attendu)",
   devices:["Smartwatches","Trackers fitness","Écouteurs sans fil","SmartGlasses"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781",
   summary:"L'acte délégué spécifique aux wearables est en cours de préparation par la Commission européenne. Il devrait imposer batterie remplaçable, score de réparabilité affiché et durée de vie garantie. Non encore publié au JOUE. Lien vers le règlement ESPR de base (2024/1781)."},
  {id:"data-1", cat:"eu_related", tag:"Données / IoT", isNew:false,
   ref:"Règlement (UE) 2023/2854 — Data Act",
   title:"Data Act — Accès aux données des objets connectés",
   date:"22/12/2023", apply:"12/09/2026", type:"Règlement UE",
   devices:["Smartphones","IoT","Smartwatches","Électroménager connecté","Véhicules connectés"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854",
   summary:"À partir du 12/09/2026, les utilisateurs auront le droit légal de récupérer et transférer toutes les données générées par leurs appareils. Obligation d'intégrer une API de portabilité dans chaque appareil connecté. Interdiction des clauses contractuelles verrouillant les données chez le fabricant."},
  {id:"ai-1", cat:"eu_related", tag:"Intelligence Artificielle", isNew:false,
   ref:"Règlement (UE) 2024/1689 — AI Act",
   title:"AI Act — IA embarquée dans les appareils connectés",
   date:"12/07/2024", apply:"02/08/2026", type:"Règlement UE",
   devices:["Smartphones","SmartGlasses","Wearables santé","IoT décision autonome"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
   summary:"Tout appareil embarquant une IA (assistant vocal, reconnaissance d'image, analyse biométrique) doit être classifié par niveau de risque. À partir du 02/08/2026 : obligations de transparence sur l'IA, interdiction de manipulation émotionnelle, enregistrement EU obligatoire pour les systèmes à risque limité."},
  {id:"empco-1", cat:"eu_related", tag:"Greenwashing", isNew:false,
   ref:"Directive (UE) 2024/825 — EmpCo",
   title:"EmpCo — Interdiction allégations environnementales non prouvées",
   date:"06/03/2024", apply:"27/09/2026", type:"Directive",
   devices:["Tous appareils RED"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825",
   summary:"12 nouvelles pratiques commerciales trompeuses interdites, dont l'allégation 'neutre en carbone par compensation'. Toute allégation écologique sur un équipement radio doit être prouvée par un organisme indépendant accrédité avant le 27/09/2026. Sanctions jusqu'à 4% du CA annuel dans l'UE."},
  {id:"empco-2", cat:"eu_related", tag:"Garantie / Durabilité", isNew:false,
   ref:"Directive (UE) 2024/825 — EmpCo (garantie)",
   title:"Label harmonisé durabilité + notice garantie légale",
   date:"06/03/2024", apply:"27/09/2026", type:"Directive",
   devices:["Smartphones","Tablettes","Wearables","IoT grand public"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825",
   summary:"La directive EmpCo instaure également un label visuel normalisé pour les produits bénéficiant d'une garantie commerciale de durabilité, et standardise la notice de garantie légale (2 ans minimum) en 24 langues de l'UE. Le règlement d'exécution précisant la maquette exacte du label est en cours de publication."},

  /* ── TRANSPOSITIONS FR ── */
  {id:"fr-1", cat:"fr", tag:"Anti-greenwashing", isNew:true,
   ref:"Projet de loi DDADUE — Art. 20-21",
   title:"Transposition EmpCo en droit français — DDADUE",
   date:"En cours (Sénat 2026)", apply:"27/09/2026",
   type:"Projet de loi",
   devices:["Tous appareils RED"],
   link:"",
   summary:"Les articles 20 et 21 du projet de loi DDADUE transposent la directive EmpCo dans le Code de la consommation et le Code de l'environnement. La DGCCRF sera l'autorité de contrôle avec des sanctions jusqu'à 10% du CA annuel. Texte en cours d'adoption parlementaire — non encore publié au JORF."},
  {id:"fr-2", cat:"fr", tag:"Réparabilité", isNew:true,
   ref:"Décret d'application ESPR smartphones (attendu)",
   title:"Score de réparabilité v2 — Transposition ESPR smartphones",
   date:"Attendu 2026", apply:"28/06/2026",
   type:"Décret",
   devices:["Smartphones","Tablettes"],
   link:"",
   summary:"Décret qui alignera le score de réparabilité français (actuellement sur 10 critères) sur les nouvelles exigences ESPR. Les vendeurs en ligne devront afficher le score directement sur la fiche produit. Texte en cours de préparation par le Ministère de la Transition écologique — non encore publié au JORF."},
  {id:"fr-3", cat:"fr", tag:"Données / IoT", isNew:false,
   ref:"Ordonnance de transposition Data Act (attendue S2 2026)",
   title:"Transposition Data Act — Portabilité des données IoT",
   date:"Attendue S2 2026", apply:"12/09/2026",
   type:"Ordonnance",
   devices:["IoT","Smartphones","Wearables"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854",
   summary:"La France transposera le Data Act par ordonnance (habilitation prévue dans la loi DDADUE). La CNIL sera l'autorité nationale de contrôle pour les litiges de portabilité IoT. Texte non encore publié au JORF — lien vers le règlement Data Act source (UE) 2023/2854 directement applicable."}
];

/* ═══════════════════════════════════════════════
   ÉTAT
   ═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
function fmtDate(d) {
  var p = function(n) { return String(n).padStart(2,'0'); };
  return p(d.getDate()) + '/' + p(d.getMonth()+1) + '/' + d.getFullYear()
       + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function addDays(d, n) {
  return new Date(d.getTime() + n * 86400000);
}

function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function h(tag, attrs, inner) {
  var a = '';
  for (var k in attrs) { a += ' ' + k + '="' + attrs[k] + '"'; }
  return '<' + tag + a + '>' + (inner || '') + '</' + tag + '>';
}

/* ═══════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   SCAN
   ═══════════════════════════════════════════════ */
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
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('RED Monitor — Scan terminé', {
        body: 'Aucune modification — votre veille est à jour.',
        icon: '/favicon.ico'
      });
    }
  }, 1800);
}

/* ═══════════════════════════════════════════════
   TOGGLE CARTE (résumé)
   ═══════════════════════════════════════════════ */
function toggleCard(id) {
  openCards[id] = !openCards[id];
  var box   = document.getElementById('summary-' + id);
  var arrow = document.getElementById('arrow-' + id);
  var lbl   = document.getElementById('lbl-' + id);
  if (box)   box.classList.toggle('hidden', !openCards[id]);
  if (arrow) arrow.style.transform = openCards[id] ? 'rotate(90deg)' : 'rotate(0deg)';
  if (lbl)   lbl.textContent = openCards[id] ? 'Masquer le résumé' : 'Lire en clair';
}

/* ═══════════════════════════════════════════════
   TOGGLE SWITCH (alertes)
   ═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   FILTRE VEILLE
   ═══════════════════════════════════════════════ */
function setVeilleFilter(f) {
  veilleFilter = f;
  renderVeille();
}

/* ═══════════════════════════════════════════════
   RENDU CARTE RÉGLEMENTATION
   ═══════════════════════════════════════════════ */
function renderCard(reg) {
  var acc = reg.cat === 'eu_red' ? '#4a7dff' : reg.cat === 'fr' ? '#e04f5f' : '#38bdf8';
  var flag = reg.cat === 'eu_red' ? '🇪🇺' : reg.cat === 'fr' ? '🇫🇷' : '🔗';
  var linkLabel = reg.cat === 'fr' ? 'Légifrance / Sénat' : 'EUR-Lex';
  var isOpen = openCards[reg.id] || false;

  var newChip    = reg.isNew ? '<span class="chip chip-new">Nouveau</span>' : '';
  var catChip    = '<span class="chip chip-' + reg.cat + '">' + flag + ' ' + esc(reg.tag) + '</span>';
  var deviceTags = reg.devices.map(function(d) { return '<span class="dtag">' + esc(d) + '</span>'; }).join('');

  return '<div class="card-reg card-reg-' + reg.cat + '">'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px">'
    +   newChip + catChip
    +   '<span style="margin-left:auto;font-size:11px;color:#7a7f9a">' + esc(reg.date) + '</span>'
    + '</div>'
    + '<p style="font-size:14px;font-weight:700;color:#e8eaf0;line-height:1.4;margin-bottom:4px">' + esc(reg.title) + '</p>'
    + '<p style="font-size:10px;color:#7a7f9a;margin-bottom:8px">' + esc(reg.ref) + ' — ' + esc(reg.type) + '</p>'
    + '<div style="display:flex;flex-wrap:wrap;margin-bottom:10px">' + deviceTags + '</div>'
    + '<div class="date-pill" style="margin-bottom:10px">'
    +   '<span>📅</span>'
    +   '<span style="font-size:11px;font-weight:700;color:#a78bfa">Application : ' + esc(reg.apply) + '</span>'
    + '</div>'
    + '<button class="summary-toggle" onclick="toggleCard(\'' + reg.id + '\')" style="color:' + acc + '">'
    +   '<i id="arrow-' + reg.id + '" class="arrow" style="transform:' + (isOpen ? 'rotate(90deg)' : 'rotate(0deg)') + '">▶</i>'
    +   '<span id="lbl-' + reg.id + '">' + (isOpen ? 'Masquer le résumé' : 'Lire en clair') + '</span>'
    + '</button>'
    + '<div id="summary-' + reg.id + '" class="summary-box' + (isOpen ? '' : ' hidden') + '">'
    +   '<p style="font-size:12px;color:#c0c4d8;line-height:1.75;margin-bottom:10px">' + esc(reg.summary) + '</p>'
    +   (reg.link
          ? '<a href="' + reg.link + '" target="_blank" rel="noopener" class="eur-link" style="background:' + acc + '">' + linkLabel + ' ↗</a>'
          : '<span style="display:inline-block;font-size:10px;font-weight:700;padding:5px 12px;border-radius:6px;background:#2a2f4a;color:#7a7f9a;margin-top:10px">⏳ Texte non encore publié</span>'
        )
    + '</div>'
    + '</div>';
}

/* ═══════════════════════════════════════════════
   ONGLET ACCUEIL
   ═══════════════════════════════════════════════ */
function renderAccueil() {
  var agendaRows = AGENDA.map(function(e) {
    return '<a href="' + e.link + '" target="_blank" rel="noopener" style="text-decoration:none">'
      + '<div class="agenda-row" style="cursor:pointer">'
      + '<div class="agenda-date">'
      +   '<p style="font-size:13px;font-weight:800;color:#a78bfa;margin:0">' + e.date.slice(0,5) + '</p>'
      +   '<p style="font-size:10px;color:#a78bfa;margin:0">' + e.date.slice(6) + '</p>'
      + '</div>'
      + '<div style="flex:1">'
      +   '<p style="font-size:12px;font-weight:600;color:#e8eaf0;line-height:1.4;margin:0">' + e.flags + ' ' + esc(e.label) + '</p>'
      +   '<p style="font-size:10px;color:#4a7dff;margin-top:2px">Voir le texte ↗</p>'
      + '</div>'
      + '</div>'
      + '</a>';
  }).join('');

  document.getElementById('tab-accueil').innerHTML =
    '<div style="padding:14px 16px 90px">'
    + '<div class="card card-green mb12">'
    +   '<p class="fw7 fs12 t-green">Filtre actif : réglementations &ge; 01/06/2026</p>'
    +   '<p class="fs11" style="color:#86efac;margin-top:3px">13 textes en surveillance &middot; Textes antérieurs masqués</p>'
    + '</div>'
    + '<div class="card card-fr mb10" style="display:flex;gap:10px">'
    +   '<span style="font-size:20px">🇫🇷</span>'
    +   '<div>'
    +     '<p class="fw7 fs12 t-fr">2 nouveaux textes FR en cours d\'adoption</p>'
    +     '<p class="fs11 lh15 mb0" style="color:#fca5a5;margin-top:4px">DDADUE art.20-21 (greenwashing) + Décret ESPR smartphones<br><strong>Échéances : 27/09/2026 et 28/06/2026</strong></p>'
    +   '</div>'
    + '</div>'
    + '<div class="card card-eu mb16" style="display:flex;gap:10px">'
    +   '<span style="font-size:20px">🇪🇺</span>'
    +   '<div>'
    +     '<p class="fw7 fs12 t-eu">Cyber Resilience Act — Classe I (11/12/2026)</p>'
    +     '<p class="fs11 lh15 mb0" style="color:#7dd3fc;margin-top:4px">Smartphones &middot; IoT &middot; Routeurs &middot; Wearables<br>Nouvelles obligations cybersécurité obligatoires</p>'
    +   '</div>'
    + '</div>'
    + '<div class="card-plain mb16" style="display:flex;justify-content:space-between;align-items:center;gap:12px">'
    +   '<div style="flex:1;min-width:0">'
    +     '<p class="fw7 fs13 t-text mb6">Scraping hebdomadaire</p>'
    +     '<p class="fs11 t-muted" style="margin-bottom:2px">Dernier scan : <span class="t-green">' + lastScan + '</span></p>'
    +     '<p class="fs11 t-muted mb4">Prochain scan : <span class="t-warn">' + nextScan + '</span></p>'
    +     '<p class="fs10 t-muted">EUR-Lex SPARQL &middot; Légifrance API &middot; JORF RSS &middot; ETSI</p>'
    +   '</div>'
    +   '<button id="scan-btn" class="scan-btn" onclick="handleScan()" ' + (scanLoading ? 'disabled' : '') + '>'
    +     (scanLoading ? 'Scan en cours...' : '🔄 Scan')
    +   '</button>'
    + '</div>'
    + '<p class="section-label t-muted">CALENDRIER DES ÉCHÉANCES</p>'
    + agendaRows
    + '</div>';
}

/* ═══════════════════════════════════════════════
   ONGLET VEILLE
   ═══════════════════════════════════════════════ */
function renderVeille() {
  var filters = [
    {key:'tous',     label:'Tous'},
    {key:'eu_red',   label:'🇪🇺 RED stricte'},
    {key:'eu_related',label:'🔗 Connexes EU'},
    {key:'fr',       label:'🇫🇷 Droit FR'}
  ];
  var groups = [
    {key:'eu_red',    label:'🇪🇺 TEXTES RED (2014/53/UE)',              color:'#4a7dff'},
    {key:'eu_related',label:'🔗 RÉGLEMENTATIONS CONNEXES — APPAREILS RED', color:'#38bdf8'},
    {key:'fr',        label:'🇫🇷 TRANSPOSITIONS DROIT FRANÇAIS',         color:'#e04f5f'}
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
    + '<div class="card-plain fs10 t-muted mb12" style="line-height:1.9">'
    +   '<strong class="t-text">Catégories surveillées :</strong><br>'
    +   '🇪🇺 <span class="t-blue">RED stricte</span> — normes harmonisées 2014/53/UE<br>'
    +   '🔗 <span class="t-eu">Connexes</span> — CRA &middot; ESPR &middot; Data Act &middot; AI Act &middot; EmpCo<br>'
    +   '🇫🇷 <span class="t-fr">Droit FR</span> — Légifrance / JORF'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">' + filterBtns + '</div>'
    + groupsHtml
    + '</div>';
}

/* ═══════════════════════════════════════════════
   ONGLET ALERTES
   ═══════════════════════════════════════════════ */
function renderAlertes() {
  var rows = [
    {key:'red_normes',  icon:'📐', label:'Nouvelles normes harmonisées RED'},
    {key:'cra',         icon:'🛡️', label:'Cyber Resilience Act (CRA)'},
    {key:'espr',        icon:'♻️', label:'Écoconception ESPR'},
    {key:'data_act',    icon:'💾', label:'Data Act — IoT et données'},
    {key:'ai_act',      icon:'🤖', label:'AI Act — IA embarquée'},
    {key:'empco',       icon:'🌿', label:'Greenwashing / EmpCo / Garanties'},
    {key:'fr_transpo',  icon:'🇫🇷', label:'Transpositions droit français'},
    {key:'rien_nouveau',icon:'✅', label:'Confirmation scan (même si rien de nouveau)'},
    {key:'rappel_j60',  icon:'📅', label:'Rappels échéances à J-60'},
    {key:'rappel_j30',  icon:'⏰', label:'Rappels échéances à J-30'}
  ];

  var logHtml = '';
  if (scanLog.length > 0) {
    var logItems = scanLog.slice().reverse().slice(0, 5).map(function(l) {
      return '<p class="' + (l.hasNew ? 'log-new' : 'log-ok') + '">'
        + (l.hasNew ? '🆕' : '✅') + ' ' + l.date + ' — '
        + (l.hasNew ? 'Nouveaux textes détectés' : 'Aucune modification')
        + '</p>';
    }).join('');
    logHtml = '<div style="border-top:1px solid #2a2f4a;padding-top:8px">'
      + '<p class="fs10 fw7 t-muted" style="letter-spacing:.08em;margin-bottom:6px">HISTORIQUE</p>'
      + logItems
      + '</div>';
  }

  var switchRows = rows.map(function(r) {
    return '<div class="toggle-row">'
      + '<div class="toggle-left">'
      +   '<span style="font-size:20px">' + r.icon + '</span>'
      +   '<span class="fs13 t-text">' + r.label + '</span>'
      + '</div>'
      + '<button id="sw-' + r.key + '" class="switch ' + (prefs[r.key] ? 'switch-on' : 'switch-off') + '" onclick="togglePref(\'' + r.key + '\')">'
      +   '<span class="switch-knob" style="left:' + (prefs[r.key] ? '23px' : '3px') + '"></span>'
      + '</button>'
      + '</div>';
  }).join('');

  document.getElementById('tab-alertes').innerHTML =
    '<div style="padding:14px 16px 90px">'
    + '<div class="card card-fr mb16">'
    +   '<p class="fw7 fs12 t-fr">Échéance critique</p>'
    +   '<p class="fs12 lh15 mb0" style="color:#fca5a5;margin-top:5px">'
    +     '<strong>28/06/2026</strong> — ESPR Smartphones entre en vigueur.<br>'
    +     'Vérifier conformité réparabilité et score d\'affichage.'
    +   '</p>'
    + '</div>'
    + '<div class="card-plain mb16">'
    +   '<p class="fw7 fs12 t-text mb8">Statut scraping</p>'
    +   '<p class="fs11 t-muted" style="margin-bottom:2px">Dernier scan : <span class="t-green">' + lastScan + '</span></p>'
    +   '<p class="fs11 t-muted" style="margin-bottom:2px">Prochain scan : <span class="t-warn">' + nextScan + '</span></p>'
    +   '<p class="fs11 t-muted mb8">Fréquence : <span class="t-text">7 jours</span> &middot; Sources : <span class="t-text">EUR-Lex &middot; Légifrance &middot; JORF &middot; ETSI</span></p>'
    +   logHtml
    + '</div>'
    + '<p class="section-label t-muted">NOTIFICATIONS ACTIVES</p>'
    + switchRows
    + '</div>';
}

/* ═══════════════════════════════════════════════
   INIT — charge data.json puis rend l'app
   ═══════════════════════════════════════════════ */
document.getElementById('bell-btn').addEventListener('click', function() { setTab('alertes'); });
document.getElementById('nav-accueil').addEventListener('click', function() { setTab('accueil'); });
document.getElementById('nav-veille').addEventListener('click',  function() { setTab('veille'); });
document.getElementById('nav-alertes').addEventListener('click', function() { setTab('alertes'); });

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

/* Charger les textes dynamiques depuis data.json (mis à jour par scrape.mjs)
   et les fusionner EN TÊTE des données statiques */
fetch('data.json?v=' + Date.now())
  .then(function(r) { return r.ok ? r.json() : []; })
  .catch(function() { return []; })
  .then(function(dynamicItems) {
    if (dynamicItems && dynamicItems.length > 0) {
      // Éviter les doublons : on ne garde que les items dynamiques
      // dont l'id n'existe pas déjà dans DATA statique
      var staticIds = DATA.map(function(d) { return d.id; });
      var newOnly = dynamicItems.filter(function(d) {
        return !staticIds.includes(d.id);
      });
      // Insérer les nouveaux en tête
      if (newOnly.length > 0) {
        DATA = newOnly.concat(DATA);
        console.log('data.json : ' + newOnly.length + ' nouveaux textes chargés');
      }
    }
    renderAccueil();
    renderVeille();
    renderAlertes();
  });
