import React, { useState, useEffect, useRef } from 'react';

/* ─── PALETTE ─────────────────────────────────────────────────────────────── */
const C = {
  bg:'#0f1120', card:'#1a1e35', border:'#2a2f4a',
  text:'#e8eaf0', muted:'#7a7f9a',
  euAcc:'#4a7dff', euBg:'#0d1a3a', euBrd:'#1e3a7a',
  frAcc:'#e04f5f', frBg:'#2a0d12', frBrd:'#5a1a22',
  relAcc:'#38bdf8', relBg:'#0d2030', relBrd:'#1a4060',
  greenAcc:'#4ade80', greenBg:'#0d2a18', greenBrd:'#1a5a30',
  warnAcc:'#f59e0b', purple:'#a78bfa', purpleBg:'#1a0d2a',
};

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */
function fmtDate(d) {
  const p = n => String(n).padStart(2,'0');
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function addDays(d,n){ return new Date(d.getTime()+n*86400000); }

/* ─── DONNÉES ─────────────────────────────────────────────────────────────── */
const DATA = [
  /* ── RED stricte ── */
  {
    id:'red-1', cat:'eu_red', tag:'Normes RED', isNew:false,
    ref:"Décision (UE) 2025/893",
    title:"Normes harmonisées RED — DECT, SRD, WAS/RLAN 5-6 GHz, IMT",
    date:"15/05/2025", apply:"15/11/2026", type:"Décision d'exécution",
    devices:["Smartphones","IoT","Routeurs","SRD"],
    link:"https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025D0893",
    summary:"14 nouvelles normes ETSI publiées ; 6 anciennes normes (DECT, SRD, WAS/RLAN 5-6 GHz) retirées le 15/11/2026. Tout appareil certifié selon une norme retirée doit être recertifié avant cette date, sous peine de perdre la présomption de conformité RED et de voir son marquage CE remis en cause lors d'un contrôle DGCCRF ou douanier.",
  },
  {
    id:'red-2', cat:'eu_red', tag:'Normes RED', isNew:false,
    ref:"Décision (UE) 2025/1741",
    title:"Norme CEM ferroviaire EN 301 489-28 V2.1.1",
    date:"14/08/2025", apply:"14/02/2027", type:"Décision d'exécution",
    devices:["Équipements ferroviaires","IoT transport"],
    link:"https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025D1741",
    summary:"La norme EN 301 489-28 V2.1.1 est publiée pour les équipements radio embarqués dans les trains. Six normes antérieures restent valides jusqu'au 14/02/2027 uniquement. Après cette date, seule la nouvelle version est reconnue pour la présomption de conformité RED.",
  },
  {
    id:'red-3', cat:'eu_red', tag:'Normes RED', isNew:false,
    ref:"Décision (UE) 2025/2499",
    title:"Normes EN 303 659 V1.1.1 et EN 305 550-6 V1.2.1",
    date:"11/12/2025", apply:"11/06/2027", type:"Décision d'exécution",
    devices:["Radio courte portée","Balises","IoT industriel"],
    link:"https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025D2499",
    summary:"Deux nouvelles normes harmonisées citées au JOUE ; trois normes antérieures retirées au 11/06/2027. Les fabricants certifiés selon les normes retirées doivent planifier leur recertification avant cette échéance pour éviter tout blocage à la mise sur le marché.",
  },
  /* ── Cyber Resilience Act ── */
  {
    id:'cra-1', cat:'eu_related', tag:'Cybersécurité', isNew:true,
    ref:"Règlement (UE) 2024/2847 — CRA Classe I",
    title:"Cyber Resilience Act — Smartphones, IoT, routeurs, wearables",
    date:"20/11/2024", apply:"11/12/2026", type:"Règlement UE",
    devices:["Smartphones","Tablettes","Smartwatches","SmartGlasses","Routeurs","IoT","Caméras connectées"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
    summary:"À partir du 11/12/2026, tout produit numérique doit prouver sa cybersécurité avant mise sur le marché UE. Obligations : interdiction des mots de passe identiques par défaut, correctifs de sécurité obligatoires pendant toute la durée de vie commerciale, déclaration des vulnérabilités à l'ENISA sous 24h. Importateurs et distributeurs sont solidairement responsables avec le fabricant.",
  },
  {
    id:'cra-2', cat:'eu_related', tag:'Cybersécurité', isNew:false,
    ref:"Règlement (UE) 2024/2847 — CRA Classe II",
    title:"Cyber Resilience Act — Passerelles domotiques, équipements critiques",
    date:"20/11/2024", apply:"11/12/2027", type:"Règlement UE",
    devices:["Passerelles domotiques","SmartGlasses pro","Réseaux industriels","Sécurité connectée"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
    summary:"Un an après la Classe I, les produits Classe II devront passer un audit tiers obligatoire. Cette catégorie inclut les passerelles domotiques, gestionnaires de mots de passe matériels et tout équipement servant de hub pour d'autres appareils connectés.",
  },
  /* ── ESPR Écoconception ── */
  {
    id:'espr-1', cat:'eu_related', tag:'Écoconception', isNew:true,
    ref:"Règlement délégué (UE) 2025/781",
    title:"ESPR — Durabilité et réparabilité smartphones et tablettes",
    date:"28/04/2025", apply:"28/06/2026", type:"Règlement délégué",
    devices:["Smartphones","Tablettes","Liseuses connectées"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32025R0781",
    summary:"Dès juin 2026, smartphones et tablettes doivent être conçus pour durer : résistance IP54 minimum, mises à jour logicielles garanties 5 ans, pièces détachées disponibles 7 ans, score de réparabilité obligatoire sur l'emballage. Interdiction de brider volontairement les batteries pour pousser au remplacement.",
  },
  {
    id:'espr-2', cat:'eu_related', tag:'Écoconception', isNew:false,
    ref:"Règlement délégué (UE) 2025/2134",
    title:"ESPR — Smartwatches, trackers fitness, écouteurs, SmartGlasses",
    date:"18/09/2025", apply:"18/09/2027", type:"Règlement délégué",
    devices:["Smartwatches","Trackers fitness","Écouteurs sans fil","SmartGlasses"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32025R2134",
    summary:"Les wearables devront être réparables : batterie remplaçable sans démonter 80% du produit, score de réparabilité affiché, durée de vie batterie garantie 3 ans minimum. Les modèles collés ou soudés irréparablement seront interdits à la vente dans l'UE.",
  },
  /* ── Data Act ── */
  {
    id:'data-1', cat:'eu_related', tag:'Données / IoT', isNew:false,
    ref:"Règlement (UE) 2023/2854 — Data Act",
    title:"Data Act — Accès aux données des objets connectés",
    date:"22/12/2023", apply:"12/09/2026", type:"Règlement UE",
    devices:["Smartphones","IoT","Smartwatches","Électroménager connecté","Véhicules connectés"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854",
    summary:"Les utilisateurs auront le droit légal de récupérer et transférer toutes les données générées par leurs appareils. Obligation d'intégrer une API de portabilité dans chaque appareil connecté ; interdiction des clauses contractuelles verrouillant les données chez le fabricant.",
  },
  /* ── AI Act ── */
  {
    id:'ai-1', cat:'eu_related', tag:'Intelligence Artificielle', isNew:false,
    ref:"Règlement (UE) 2024/1689 — AI Act",
    title:"AI Act — IA embarquée dans les appareils radio",
    date:"12/07/2024", apply:"02/08/2026", type:"Règlement UE",
    devices:["Smartphones","SmartGlasses","Wearables santé","IoT décision autonome"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    summary:"Tout appareil embarquant une IA (assistant vocal, reconnaissance d'image, analyse biométrique) doit être classifié par niveau de risque. Obligations : transparence sur l'utilisation d'une IA, interdiction de la manipulation émotionnelle, enregistrement EU pour les systèmes à risque limité.",
  },
  /* ── EmpCo / Greenwashing ── */
  {
    id:'empco-1', cat:'eu_related', tag:'Greenwashing', isNew:false,
    ref:"Directive (UE) 2024/825 — EmpCo",
    title:"EmpCo — Interdiction des allégations environnementales non prouvées",
    date:"06/03/2024", apply:"27/09/2026", type:"Directive",
    devices:["Tous appareils RED"],
    link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825",
    summary:"12 nouvelles pratiques trompeuses interdites, dont 'neutre en carbone par compensation'. Toute allégation écologique sur un équipement radio doit être prouvée par un organisme indépendant accrédité. Sanctions jusqu'à 4% du CA annuel dans l'UE.",
  },
  {
    id:'empco-2', cat:'eu_related', tag:'Garantie / Durabilité', isNew:false,
    ref:"Règlement d'exécution (UE) 2025/1960",
    title:"Label harmonisé durabilité + notice garantie légale standardisée",
    date:"25/09/2025", apply:"27/09/2026", type:"Règlement d'exécution",
    devices:["Smartphones","Tablettes","Wearables","IoT grand public"],
    link:"https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025R1960",
    summary:"Un label visuel normalisé doit être apposé sur tout produit bénéficiant d'une garantie commerciale de durabilité. La maquette exacte du label est fixée par ce règlement. La notice de garantie légale (2 ans minimum) devra suivre un modèle standardisé disponible en 24 langues de l'UE.",
  },
  /* ── Transpositions FR ── */
  {
    id:'fr-1', cat:'fr', tag:'Anti-greenwashing', isNew:true,
    ref:"Projet de loi DDADUE — Art. 20-21",
    title:"Transposition EmpCo + garantie durabilité en droit français",
    date:"En cours (Sénat, avr. 2026)", apply:"27/09/2026",
    type:"Loi (Code conso + Code envir.)",
    devices:["Tous appareils RED"],
    link:"https://www.senat.fr/rap/a25-346/a25-3463.html",
    summary:"Les articles 20 et 21 du projet DDADUE inscrivent dans le Code de la consommation et le Code de l'environnement les obligations EmpCo. La DGCCRF pourra sanctionner jusqu'à 10% du CA annuel les fabricants utilisant des allégations écologiques non prouvées. Première définition légale du 'greenwashing' en droit français.",
  },
  {
    id:'fr-2', cat:'fr', tag:'Réparabilité', isNew:true,
    ref:"Décret ESPR smartphones (attendu T3 2026)",
    title:"Transposition ESPR smartphones — Score réparabilité v2",
    date:"Attendu juin 2026", apply:"28/06/2026",
    type:"Décret (Code envir. art. L541-10-9)",
    devices:["Smartphones","Tablettes"],
    link:"https://www.legifrance.gouv.fr",
    summary:"Ce décret aligne le score de réparabilité français sur l'ESPR : passage de 10 à 14 critères, incluant la disponibilité du code source pour les mises à jour de sécurité et la politique de remplacement de batterie. Les vendeurs en ligne doivent afficher le score sur la fiche produit avant le bouton d'achat.",
  },
  {
    id:'fr-3', cat:'fr', tag:'Données / IoT', isNew:false,
    ref:"Ordonnance Data Act (attendue S2 2026)",
    title:"Transposition Data Act — Portabilité données IoT",
    date:"Attendue sept. 2026", apply:"12/09/2026",
    type:"Ordonnance (habilitation loi DDADUE)",
    devices:["IoT","Smartphones","Wearables"],
    link:"https://www.legifrance.gouv.fr",
    summary:"La France transposera le Data Act via ordonnance. La CNIL sera l'autorité de contrôle pour les litiges de portabilité IoT. Sanctions jusqu'à 20 M€ ou 4% du CA mondial applicables.",
  },
];

const AGENDA = [
  {date:"28/06/2026", label:"ESPR Smartphones & Tablettes",          flags:"🇪🇺🇫🇷"},
  {date:"02/08/2026", label:"AI Act — IA embarquée",                  flags:"🇪🇺"},
  {date:"12/09/2026", label:"Data Act — Portabilité IoT",             flags:"🇪🇺🇫🇷"},
  {date:"27/09/2026", label:"EmpCo greenwashing + label garantie",    flags:"🇪🇺🇫🇷"},
  {date:"15/11/2026", label:"Retrait normes RED (DECT, SRD…)",       flags:"🇪🇺"},
  {date:"11/12/2026", label:"Cyber Resilience Act — Classe I",        flags:"🇪🇺"},
  {date:"14/02/2027", label:"Retrait normes RED ferroviaires",        flags:"🇪🇺"},
  {date:"11/06/2027", label:"Retrait normes RED (EN 303 659…)",      flags:"🇪🇺"},
  {date:"18/09/2027", label:"ESPR Wearables & SmartGlasses",         flags:"🇪🇺"},
  {date:"11/12/2027", label:"Cyber Resilience Act — Classe II",       flags:"🇪🇺"},
];

/* ─── COMPOSANTS ATOMIQUES ────────────────────────────────────────────────── */
function Chip({label, color, bg}) {
  return (
    <span style={{
      display:'inline-block', fontSize:10, fontWeight:700,
      padding:'2px 8px', borderRadius:6,
      color, background:bg, letterSpacing:'0.05em', whiteSpace:'nowrap',
    }}>{label}</span>
  );
}

function Toggle({on, onToggle}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width:46, height:26, borderRadius:13, border:'none',
        background: on ? C.euAcc : C.border,
        position:'relative', cursor:'pointer',
        transition:'background .2s', flexShrink:0, padding:0,
        outline:'none',
      }}
    >
      <span style={{
        position:'absolute', top:3, left: on ? 23 : 3,
        width:20, height:20, borderRadius:'50%',
        background:'#fff', transition:'left .2s',
        display:'block', boxShadow:'0 1px 4px rgba(0,0,0,.5)',
        pointerEvents:'none',
      }}/>
    </button>
  );
}

/* ─── CARTE RÉGLEMENTATION ────────────────────────────────────────────────── */
function RegCard({reg}) {
  const [open, setOpen] = useState(false);
  const acc = reg.cat==='eu_red' ? C.euAcc : reg.cat==='fr' ? C.frAcc : C.relAcc;
  const bg  = reg.cat==='eu_red' ? C.euBg  : reg.cat==='fr' ? C.frBg  : C.relBg;
  const brd = reg.cat==='eu_red' ? C.euBrd : reg.cat==='fr' ? C.frBrd : C.relBrd;
  const flag= reg.cat==='eu_red' ? '🇪🇺'   : reg.cat==='fr' ? '🇫🇷'   : '🔗';

  return (
    <div style={{background:bg, border:`1px solid ${brd}`, borderLeft:`3px solid ${acc}`, borderRadius:14, padding:'14px 16px', marginBottom:12}}>

      <div style={{display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', marginBottom:8}}>
        {reg.isNew && <Chip label="🆕 NOUVEAU" color="#fff" bg={acc}/>}
        <Chip label={`${flag} ${reg.tag}`} color={acc} bg={`${acc}33`}/>
        <span style={{marginLeft:'auto', fontSize:11, color:C.muted}}>{reg.date}</span>
      </div>

      <p style={{margin:'0 0 4px', fontSize:14, fontWeight:700, color:C.text, lineHeight:1.4}}>{reg.title}</p>
      <p style={{margin:'0 0 8px', fontSize:10, color:C.muted}}>{reg.ref} — {reg.type}</p>

      <div style={{display:'flex', flexWrap:'wrap', gap:4, marginBottom:10}}>
        {reg.devices.map(d => (
          <span key={d} style={{fontSize:9, color:C.muted, background:C.card, border:`1px solid ${C.border}`, padding:'1px 6px', borderRadius:4}}>{d}</span>
        ))}
      </div>

      <div style={{display:'inline-flex', alignItems:'center', gap:5, marginBottom:12, background:C.purpleBg, border:`1px solid ${C.purple}55`, borderRadius:6, padding:'4px 10px'}}>
        <span>📅</span>
        <span style={{fontSize:11, fontWeight:700, color:C.purple}}>Application : {reg.apply}</span>
      </div>

      <div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{display:'flex', alignItems:'center', gap:5, background:'transparent', border:'none', color:acc, fontSize:11, fontWeight:600, cursor:'pointer', padding:0, outline:'none'}}
        >
          <span style={{display:'inline-block', transform:open?'rotate(90deg)':'rotate(0deg)', transition:'transform .2s'}}>▶</span>
          {open ? 'Masquer le résumé' : '💬 Lire en clair'}
        </button>
      </div>

      {open && (
        <div style={{marginTop:10, background:C.bg, borderLeft:`2px solid ${acc}66`, borderRadius:'0 8px 8px 0', padding:'10px 14px'}}>
          <p style={{margin:'0 0 10px', fontSize:12, color:'#c0c4d8', lineHeight:1.75}}>{reg.summary}</p>
          <a href={reg.link} target="_blank" rel="noreferrer" style={{display:'inline-block', fontSize:10, fontWeight:700, padding:'5px 12px', background:acc, color:'#fff', borderRadius:6, textDecoration:'none'}}>
            {reg.cat==='fr' ? 'Légifrance / Sénat' : 'EUR-Lex'}
          </a>
        </div>
      )}
    </div>
  );
}

/* ─── ONGLET ACCUEIL ──────────────────────────────────────────────────────── */
function TabAccueil({lastScan, nextScan, loading, onScan}) {
  return (
    <div style={{padding:'14px 16px 90px'}}>

      <div style={{background:C.greenBg, border:`1px solid ${C.greenBrd}`, borderLeft:`3px solid ${C.greenAcc}`, borderRadius:12, padding:'10px 14px', marginBottom:12}}>
        <p style={{margin:0, fontSize:12, fontWeight:700, color:C.greenAcc}}>✅ Filtre actif : réglementations ≥ 01/06/2026</p>
        <p style={{margin:'3px 0 0', fontSize:11, color:'#86efac'}}>13 textes en surveillance · Textes antérieurs masqués</p>
      </div>

      <div style={{background:C.frBg, border:`1px solid ${C.frBrd}`, borderLeft:`3px solid ${C.frAcc}`, borderRadius:12, padding:'12px 14px', marginBottom:10, display:'flex', gap:10}}>
        <span style={{fontSize:20}}>🇫🇷</span>
        <div>
          <p style={{margin:0, fontSize:12, fontWeight:700, color:C.frAcc}}>2 nouveaux textes FR en cours d'adoption</p>
          <p style={{margin:'4px 0 0', fontSize:11, color:'#fca5a5', lineHeight:1.5}}>
            DDADUE art.20-21 (greenwashing) + Décret ESPR smartphones<br/>
            <strong>Échéances : 27/09/2026 et 28/06/2026</strong>
          </p>
        </div>
      </div>

      <div style={{background:C.relBg, border:`1px solid ${C.relBrd}`, borderLeft:`3px solid ${C.relAcc}`, borderRadius:12, padding:'12px 14px', marginBottom:16, display:'flex', gap:10}}>
        <span style={{fontSize:20}}>🇪🇺</span>
        <div>
          <p style={{margin:0, fontSize:12, fontWeight:700, color:C.relAcc}}>🆕 Cyber Resilience Act — Classe I (11/12/2026)</p>
          <p style={{margin:'4px 0 0', fontSize:11, color:'#7dd3fc', lineHeight:1.5}}>
            Smartphones · IoT · Routeurs · Wearables<br/>
            Nouvelles obligations cybersécurité obligatoires
          </p>
        </div>
      </div>

      {/* Scraping */}
      <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
        <div style={{flex:1, minWidth:0}}>
          <p style={{margin:'0 0 6px', fontSize:13, fontWeight:700, color:C.text}}>⏱️ Scraping hebdomadaire</p>
          <p style={{margin:'0 0 2px', fontSize:11, color:C.muted}}>Dernier scan : <span style={{color:C.greenAcc}}>{lastScan}</span></p>
          <p style={{margin:'0 0 4px', fontSize:11, color:C.muted}}>Prochain scan : <span style={{color:C.warnAcc}}>{nextScan}</span></p>
          <p style={{margin:0, fontSize:10, color:C.muted}}>EUR-Lex SPARQL · Légifrance API · JORF RSS · ETSI</p>
        </div>
        <button
          onClick={onScan}
          disabled={loading}
          style={{background:loading?C.border:C.euAcc, color:'#fff', border:'none', padding:'10px 18px', borderRadius:10, fontWeight:700, fontSize:14, cursor:loading?'not-allowed':'pointer', transition:'background .2s', whiteSpace:'nowrap', outline:'none'}}
        >
          {loading ? '⏳…' : '🔄 Scan'}
        </button>
      </div>

      {/* Agenda */}
      <p style={{margin:'0 0 10px', fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'0.1em'}}>CALENDRIER DES ÉCHÉANCES</p>
      {AGENDA.map((e,i) => (
        <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${C.border}`}}>
          <div style={{background:C.purpleBg, border:`1px solid ${C.purple}44`, borderRadius:8, padding:'6px 10px', minWidth:68, textAlign:'center', flexShrink:0}}>
            <p style={{margin:0, fontSize:13, fontWeight:800, color:C.purple}}>{e.date.slice(0,5)}</p>
            <p style={{margin:0, fontSize:10, color:C.purple}}>{e.date.slice(6)}</p>
          </div>
          <p style={{margin:0, fontSize:12, fontWeight:600, color:C.text, lineHeight:1.4}}>{e.flags} {e.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── ONGLET VEILLE ───────────────────────────────────────────────────────── */
function TabVeille() {
  const [filter, setFilter] = useState('tous');

  const FILTERS = [
    {key:'tous',       label:'Tous'},
    {key:'eu_red',     label:'🇪🇺 RED stricte'},
    {key:'eu_related', label:'🔗 Connexes EU'},
    {key:'fr',         label:'🇫🇷 Droit FR'},
  ];

  const GROUPS = [
    {key:'eu_red',     label:'🇪🇺 TEXTES RED (2014/53/UE)',                  color:C.euAcc},
    {key:'eu_related', label:'🔗 RÉGLEMENTATIONS CONNEXES — APPAREILS RED', color:C.relAcc},
    {key:'fr',         label:'🇫🇷 TRANSPOSITIONS DROIT FRANÇAIS',            color:C.frAcc},
  ];

  const shown = filter==='tous' ? GROUPS : GROUPS.filter(g=>g.key===filter);

  return (
    <div style={{padding:'14px 16px 90px'}}>
      <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:10, color:C.muted, lineHeight:1.9}}>
        <strong style={{color:C.text}}>Catégories surveillées :</strong><br/>
        🇪🇺 <span style={{color:C.euAcc}}>RED stricte</span> — normes harmonisées 2014/53/UE<br/>
        🔗 <span style={{color:C.relAcc}}>Connexes</span> — CRA · ESPR · Data Act · AI Act · EmpCo<br/>
        🇫🇷 <span style={{color:C.frAcc}}>Droit FR</span> — Légifrance / JORF
      </div>

      <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:16}}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{padding:'6px 14px', borderRadius:8, border:'none', background:filter===f.key?C.euAcc:C.card, color:filter===f.key?'#fff':C.muted, fontSize:11, fontWeight:filter===f.key?700:400, cursor:'pointer', outline:'none'}}
          >{f.label}</button>
        ))}
      </div>

      {shown.map(g => (
        <div key={g.key}>
          <p style={{margin:'0 0 10px', fontSize:10, fontWeight:700, color:g.color, letterSpacing:'0.1em'}}>{g.label}</p>
          {DATA.filter(r=>r.cat===g.key).map(r => <RegCard key={r.id} reg={r}/>)}
        </div>
      ))}
    </div>
  );
}

/* ─── ONGLET ALERTES ──────────────────────────────────────────────────────── */
function TabAlertes({lastScan, nextScan, scanLog}) {
  const [prefs, setPrefs] = useState({
    red_normes:true, cra:true, espr:true, data_act:true,
    ai_act:true, empco:true, fr_transpo:true,
    rien_nouveau:true, rappel_j60:true, rappel_j30:true,
  });

  const ROWS = [
    {key:'red_normes',   icon:'📐', label:'Nouvelles normes harmonisées RED'},
    {key:'cra',          icon:'🛡️',  label:'Cyber Resilience Act (CRA)'},
    {key:'espr',         icon:'♻️',  label:'Écoconception ESPR'},
    {key:'data_act',     icon:'💾',  label:'Data Act — IoT & données'},
    {key:'ai_act',       icon:'🤖',  label:'AI Act — IA embarquée'},
    {key:'empco',        icon:'🌿',  label:'Greenwashing / EmpCo / Garanties'},
    {key:'fr_transpo',   icon:'🇫🇷', label:'Transpositions droit français'},
    {key:'rien_nouveau', icon:'✅',  label:'Confirmation scan (même si rien de nouveau)'},
    {key:'rappel_j60',   icon:'📅',  label:'Rappels échéances à J-60'},
    {key:'rappel_j30',   icon:'⏰',  label:'Rappels échéances à J-30'},
  ];

  return (
    <div style={{padding:'14px 16px 90px'}}>
      <div style={{background:C.frBg, border:`1px solid ${C.frBrd}`, borderLeft:`3px solid ${C.frAcc}`, borderRadius:12, padding:'12px 14px', marginBottom:16}}>
        <p style={{margin:0, fontSize:12, fontWeight:700, color:C.frAcc}}>⚠️ Échéance critique</p>
        <p style={{margin:'5px 0 0', fontSize:12, color:'#fca5a5', lineHeight:1.5}}>
          <strong>28/06/2026</strong> — ESPR Smartphones entre en vigueur.<br/>
          Vérifier conformité réparabilité et score d'affichage.
        </p>
      </div>

      <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px', marginBottom:16}}>
        <p style={{margin:'0 0 8px', fontSize:12, fontWeight:700, color:C.text}}>🔄 Statut scraping</p>
        <p style={{margin:'0 0 2px', fontSize:11, color:C.muted}}>Dernier scan : <span style={{color:C.greenAcc}}>{lastScan}</span></p>
        <p style={{margin:'0 0 2px', fontSize:11, color:C.muted}}>Prochain scan : <span style={{color:C.warnAcc}}>{nextScan}</span></p>
        <p style={{margin:'0 0 8px', fontSize:11, color:C.muted}}>
          Fréquence : <span style={{color:C.text}}>7 jours</span>
          &nbsp;·&nbsp;Sources : <span style={{color:C.text}}>EUR-Lex · Légifrance · JORF · ETSI</span>
        </p>

        {scanLog.length > 0 && (
          <div style={{borderTop:`1px solid ${C.border}`, paddingTop:8}}>
            <p style={{margin:'0 0 6px', fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'0.08em'}}>HISTORIQUE</p>
            {[...scanLog].reverse().slice(0,5).map((log,i) => (
              <p key={i} style={{margin:'0 0 3px', fontSize:11, color:log.hasNew?C.relAcc:C.greenAcc}}>
                {log.hasNew ? '🆕' : '✅'} {log.date} — {log.hasNew ? 'Nouveaux textes détectés' : 'Aucune modification'}
              </p>
            ))}
          </div>
        )}
      </div>

      <p style={{margin:'0 0 10px', fontSize:10, fontWeight:700, color:C.muted, letterSpacing:'0.1em'}}>NOTIFICATIONS ACTIVES</p>
      {ROWS.map(row => (
        <div key={row.key} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span style={{fontSize:20}}>{row.icon}</span>
            <span style={{fontSize:13, color:C.text}}>{row.label}</span>
          </div>
          <Toggle on={prefs[row.key]} onToggle={() => setPrefs(p => ({...p, [row.key]:!p[row.key]}))}/>
        </div>
      ))}
    </div>
  );
}

/* ─── APP ROOT ────────────────────────────────────────────────────────────── */
export default function App() {
  const now = new Date();
  const [tab,      setTab]      = useState('accueil');
  const [loading,  setLoading]  = useState(false);
  const [lastScan, setLastScan] = useState(() => fmtDate(now));
  const [nextScan, setNextScan] = useState(() => fmtDate(addDays(now, 7)));
  const [scanLog,  setScanLog]  = useState([]);
  const scanLogRef = useRef([]);

  useEffect(() => { scanLogRef.current = scanLog; }, [scanLog]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  function handleScan() {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const d      = new Date();
      const nowStr = fmtDate(d);
      const nxtStr = fmtDate(addDays(d, 7));
      const hasNew = false; // ← en production : vrai appel réseau

      const newLog = [...scanLogRef.current, {date:nowStr, hasNew}].slice(-20);
      setLastScan(nowStr);
      setNextScan(nxtStr);
      setScanLog(newLog);
      setLoading(false);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('RED Monitor — Scan terminé', {
          body: hasNew
            ? '🆕 Nouveaux textes réglementaires détectés !'
            : '✅ Aucune modification — votre veille est à jour.',
          icon: '/favicon.ico',
        });
      }
    }, 1800);
  }

  const newCount = DATA.filter(r => r.isNew).length;
  const NAV = [
    {key:'accueil', icon:'🏠', label:'ACCUEIL'},
    {key:'veille',  icon:'📋', label:'VEILLE'},
    {key:'alertes', icon:'🔔', label:'ALERTES', badge:newCount},
  ];

  return (
    <div style={{background:C.bg, color:C.text, minHeight:'100vh', fontFamily:"system-ui, -apple-system, sans-serif", maxWidth:480, margin:'0 auto', position:'relative'}}>

      {/* HEADER */}
      <div style={{background:C.bg, borderBottom:`1px solid ${C.border}`, padding:'16px 18px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50}}>
        <div>
          <h1 style={{margin:0, fontSize:22, fontWeight:800, letterSpacing:'-0.03em'}}>RED Monitor</h1>
          <p style={{margin:'3px 0 0', fontSize:11, color:C.muted}}>Directive 2014/53/UE · Textes ≥ 01/06/2026</p>
        </div>
        <button onClick={() => setTab('alertes')}
          style={{position:'relative', background:C.card, border:`1px solid ${C.border}`, padding:'10px 12px', borderRadius:12, cursor:'pointer', outline:'none'}}
        >
          <span style={{fontSize:20}}>🔔</span>
          {newCount > 0 && (
            <span style={{position:'absolute', top:4, right:4, background:C.frAcc, color:'#fff', borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700}}>{newCount}</span>
          )}
        </button>
      </div>

      {/* CONTENU */}
      <div>
        {tab==='accueil' && <TabAccueil lastScan={lastScan} nextScan={nextScan} loading={loading} onScan={handleScan}/>}
        {tab==='veille'  && <TabVeille/>}
        {tab==='alertes' && <TabAlertes lastScan={lastScan} nextScan={nextScan} scanLog={scanLog}/>}
      </div>

      {/* NAVIGATION */}
      <div style={{position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:C.card, borderTop:`1px solid ${C.border}`, display:'flex', zIndex:100}}>
        {NAV.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{flex:1, padding:'10px 0', background:'transparent', border:'none', borderTop:tab===t.key?`2px solid ${C.euAcc}`:'2px solid transparent', cursor:'pointer', position:'relative', outline:'none'}}
          >
            <div style={{fontSize:20}}>{t.icon}</div>
            <div style={{fontSize:9, fontWeight:700, marginTop:2, color:tab===t.key?C.euAcc:C.muted, letterSpacing:'0.06em'}}>{t.label}</div>
            {t.badge > 0 && (
              <span style={{position:'absolute', top:5, right:'26%', background:C.frAcc, color:'#fff', borderRadius:'50%', width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700}}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

    </div>
  );
}
