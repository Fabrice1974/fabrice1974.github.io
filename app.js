/* ============================================================
   RED Monitor — app.js — v2.2
   Veille réglementaire équipements radio (Directive 2014/53/UE)
   Correction : gestion Service Worker + cache busting
   ============================================================ */

// ─── VERSION (à incrémenter à chaque déploiement) ────────────────────────────
var APP_VERSION = '2.2';

// ─── GESTION DU SERVICE WORKER ───────────────────────────────────────────────
(function initServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Worker non supporté sur ce navigateur');
    return;
  }

  navigator.serviceWorker.register('./sw.js')
    .then(function(registration) {
      console.log('[SW] Enregistré — scope :', registration.scope, '— App v' + APP_VERSION);

      // Vérifie immédiatement si une mise à jour est disponible
      registration.update();

      // Écoute les nouvelles versions du SW en attente
      registration.addEventListener('updatefound', function() {
        var newWorker = registration.installing;
        console.log('[SW] Nouveau worker détecté — état :', newWorker.state);

        newWorker.addEventListener('statechange', function() {
          console.log('[SW] State →', newWorker.state);

          // Nouveau SW prêt et en attente d'activation
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] Mise à jour disponible — affichage bannière');
            showUpdateBanner();
          }
        });
      });
    })
    .catch(function(err) {
      console.error('[SW] Erreur enregistrement :', err);
    });

  // Recharge la page quand le nouveau SW prend le contrôle
  var refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (!refreshing) {
      refreshing = true;
      console.log('[SW] Nouveau SW actif — rechargement');
      window.location.reload();
    }
  });
})();

// ─── BANNIÈRE DE MISE À JOUR ──────────────────────────────────────────────────
function showUpdateBanner() {
  if (document.getElementById('update-banner')) return; // évite les doublons

  var banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText = [
    'position:fixed',
    'bottom:80px',
    'left:50%',
    'transform:translateX(-50%)',
    'background:#1e293b',
    'border:1px solid #a78bfa',
    'border-radius:12px',
    'padding:12px 16px',
    'display:flex',
    'align-items:center',
    'gap:12px',
    'z-index:9999',
    'box-shadow:0 4px 24px rgba(0,0,0,0.5)',
    'max-width:320px',
    'width:90%'
  ].join(';');

  banner.innerHTML =
    '<span style="font-size:20px">🔄</span>'
    + '<div style="flex:1">'
    + '<p style="font-size:12px;font-weight:700;color:#e8eaf0;margin:0">Mise à jour disponible</p>'
    + '<p style="font-size:11px;color:#a78bfa;margin:2px 0 0">Nouvelles données réglementaires</p>'
    + '</div>'
    + '<button onclick="applyUpdate()" style="'
    + 'background:#a78bfa;color:#0f1117;border:none;border-radius:8px;'
    + 'padding:6px 12px;font-size:11px;font-weight:800;cursor:pointer'
    + '">Mettre à jour</button>';

  document.body.appendChild(banner);
}

// ─── APPLICATION DE LA MISE À JOUR ───────────────────────────────────────────
function applyUpdate() {
  console.log('[App] Mise à jour demandée par l\'utilisateur');
  navigator.serviceWorker.ready.then(function(registration) {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

// ─── DONNÉES RÉGLEMENTAIRES ───────────────────────────────────────────────────
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

// ─── AGENDA DES ÉCHÉANCES ─────────────────────────────────────────────────────
var AGENDA = [
  {date:"12/09/2025", label:"Data Act — Applicable (deja en vigueur)",                    flags:"EU",    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854"},
  {date:"28/06/2026", label:"ESPR Smartphones et Tablettes (prevu)",                      flags:"EU FR", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781"},
  {date:"02/08/2026", label:"AI Act — IA embarquee (haut risque)",                        flags:"EU",    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689"},
  {date:"11/09/2026", label:"CRA — Declaration vulnerabilites (Art. 64)",                 flags:"EU",    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"27/09/2026", label:"EmpCo — Anti-greenwashing",                                  flags:"EU FR", link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825"},
  {date:"12/09/2026", label:"Data Act — Nouveaux produits IoT concus pour portabilite",   flags:"EU",    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854"},
  {date:"11/12/2027", label:"CRA — Pleine application toutes classes",                    flags:"EU",    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847"},
  {date:"Horizon 2027", label:"ESPR Wearables et SmartGlasses (prevu)",                   flags:"EU",    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781"}
];

// ─── ÉTAT GLOBAL ──────────────────────────────────────────────────────────────
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

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────

/** Formate une date JS en "DD/MM/YYYY HH:MM" */
function fmtDate(d) {
  var p = function(n) { return String(n).padStart(2, '0'); };
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear()
       + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/** Ajoute n jours à une date */
function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }

/** Échappe les caractères HTML pour éviter les injections XSS */
function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

/** Active un onglet et masque les autres */
function setTab(tab) {
  currentTab = tab;
  ['accueil', 'veille', 'alertes'].forEach(function(t) {
    var panel = document.getElementById('tab-' + t);
    var btn   = document.getElementById('nav-' + t);
    if (panel) panel.classList.toggle('hidden', t !== tab);
    if (btn)   btn.classList.toggle('active',   t === tab);
  });
  // Masque le badge de notification quand on ouvre l'onglet alertes
  if (tab === 'alertes') {
    var badge     = document.getElementById('nav-badge');
    var bellBadge = document.getElementById('bell-count');
    if (badge)     badge.style.display     = 'none';
    if (bellBadge) bellBadge.style.display = 'none';
  }
}

// ─── SCAN ─────────────────────────────────────────────────────────────────────

/** Déclenche un scan simulé (à connecter à un vrai backend) */
function handleScan() {
  if (scanLoading) return;
  scanLoading = true;
  console.log('[Scan] Démarrage du scan réglementaire...');

  var btn = document.getElementById('scan-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Scan en cours...'; }

  setTimeout(function() {
    var d    = new Date();
    lastScan = fmtDate(d);
    nextScan = fmtDate(addDays(d, 7));
    scanLog  = scanLog.concat([{ date: lastScan, hasNew: false }]).slice(-20);
    scanLoading = false;

    console.log('[Scan] Terminé —', lastScan, '— Aucune modification détectée');

    renderAccueil();
    renderAlertes();
    if (btn) { btn.disabled = false; btn.textContent = 'Scan'; }
  }, 1800);
}

// ─── CARTES ───────────────────────────────────────────────────────────────────

/** Ouvre/ferme le résumé d'une carte réglementaire */
function toggleCard(id) {
  openCards[id] = !openCards[id];
  var box   = document.getElementById('summary-' + id);
  var arrow = document.getElementById('arrow-'   + id);
  var lbl   = document.getElementById('lbl-'     + id);
  if (box)   box.classList.toggle('hidden', !openCards[id]);
  if (arrow) arrow.style.transform = openCards[id] ? 'rotate(90deg)' : 'rotate(0deg)';
  if (lbl)   lbl.textContent       = openCards[id] ? 'Masquer le resume' : 'Lire en clair';
}

// ─── PRÉFÉRENCES ──────────────────────────────────────────────────────────────

/** Bascule une préférence de notification */
function togglePref(key) {
  prefs[key] = !prefs[key];
  var sw = document.getElementById('sw-' + key);
  if (sw) {
    sw.classList.toggle('switch-on',  prefs[key]);
    sw.classList.toggle('switch-off', !prefs[key]);
    var knob = sw.querySelector('.switch-knob');
    if (knob) knob.style.left = prefs[key] ? '23px' : '3px';
  }
  console.log('[Prefs]', key, '→', prefs[key] ? 'activé' : 'désactivé');
}

// ─── FILTRE VEILLE ────────────────────────────────────────────────────────────

/** Applique un filtre sur l'onglet Veille */
function setVeilleFilter(f) {
  veilleFilter = f;
  console.log('[Veille] Filtre →', f);
  renderVeille();
}

// ─── RENDU : CARTE RÉGLEMENTAIRE ─────────────────────────────────────────────

/**
 * Génère le HTML d'une carte réglementaire
 * @param {Object} reg - Objet réglementation depuis DATA[]
 * @returns {string} HTML de la carte
 */
function renderCard(reg) {
  var acc       = reg.cat === 'eu_red' ? '#4a7dff' : reg.cat === 'fr' ? '#e04f5f' : '#38bdf8';
  var flag      = reg.cat === 'eu_red' ? 'EU' : reg.cat === 'fr' ? 'FR' : 'EU';
  var linkLabel = reg.cat === 'fr' ? 'Legifrance' : 'EUR-Lex';
  var isOpen    = openCards[reg.id] || false;

  var newChip  = reg.isNew
    ? '<span class="chip chip-new">Nouveau</span>'
    : '';
  var catChip  = '<span class="chip chip-' + reg.cat + '">' + flag + ' ' + esc(reg.tag) + '</span>';
  var deviceTags = reg.devices.map(function(d) {
    return '<span class="dtag">' + esc(d) + '</span>';
  }).join('');
  var linkBtn  = reg
