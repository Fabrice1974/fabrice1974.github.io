import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  bg:          "#0f1120",
  card:        "#1a1e35",
  cardBorder:  "#2a2f4a",
  text:        "#e8eaf0",
  muted:       "#7a7f9a",
  euBg:        "#0d1a3a",
  euAccent:    "#4a7dff",
  euBorder:    "#1e3a7a",
  frBg:        "#2a0d12",
  frAccent:    "#e04f5f",
  frBorder:    "#5a1a22",
  relBg:       "#0d2030",
  relAccent:   "#38bdf8",
  relBorder:   "#1a4060",
  greenBg:     "#0d2a18",
  greenAccent: "#4ade80",
  greenBorder: "#1a5a30",
  warnBg:      "#2a1f0d",
  warnAccent:  "#f59e0b",
  purple:      "#a78bfa",
  purpleBg:    "#1a0d2a",
};

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES RÉGLEMENTAIRES VÉRIFIÉES (filtre ≥ 01/06/2026)
// ─────────────────────────────────────────────────────────────────────────────
const REGULATIONS = [
  // ── STRICTEMENT RED ────────────────────────────────────────────────────────
  {
    id: "red-1",
    ref: "Décision d'exécution (UE) 2025/893",
    title: "Normes harmonisées RED — DECT, SRD, WAS/RLAN 5-6 GHz, IMT",
    date: "15/05/2025",
    applicability: "15/11/2026",
    type: "Décision d'exécution",
    category: "eu_red",
    tag: "Normes RED",
    isNew: false,
    source: "JOUE L 2025/893",
    link: "https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025D0893",
    devices: ["Smartphones", "IoT", "Routeurs", "Objets connectés SRD"],
    summary: "14 nouvelles normes ETSI sont publiées ; 6 anciennes normes (DECT, SRD, WAS/RLAN 5-6 GHz) sont retirées à partir du 15/11/2026. Tout appareil certifié selon une norme retirée doit être recertifié avant cette date, sinon la présomption de conformité RED disparaît et le marquage CE peut être remis en cause lors d'un contrôle.",
  },
  {
    id: "red-2",
    ref: "Décision d'exécution (UE) 2025/1741",
    title: "Norme CEM ferroviaire EN 301 489-28 V2.1.1 — Retrait 6 anciennes normes",
    date: "14/08/2025",
    applicability: "14/02/2027",
    type: "Décision d'exécution",
    category: "eu_red",
    tag: "Normes RED",
    isNew: false,
    source: "JOUE L 2025/1741",
    link: "https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025D1741",
    devices: ["Équipements radio ferroviaires", "IoT transport"],
    summary: "La norme EN 301 489-28 V2.1.1 sur la compatibilité électromagnétique des équipements radio embarqués dans les trains est publiée. Six normes antérieures restent valides jusqu'au 14/02/2027. Après cette date, seule la nouvelle version est reconnue par la Commission pour la présomption de conformité.",
  },
  {
    id: "red-3",
    ref: "Décision d'exécution (UE) 2025/2499",
    title: "Nouvelles normes EN 303 659 V1.1.1 et EN 305 550-6 V1.2.1",
    date: "11/12/2025",
    applicability: "11/06/2027",
    type: "Décision d'exécution",
    category: "eu_red",
    tag: "Normes RED",
    isNew: false,
    source: "JOUE L 2025/2499",
    link: "https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025D2499",
    devices: ["Équipements radio courte portée", "Balises", "IoT industriel"],
    summary: "Deux nouvelles normes harmonisées entrent en vigueur ; trois normes antérieures sont retirées au 11/06/2027. Les fabricants dont les produits sont certifiés selon les normes retirées ont jusqu'à cette date pour migrer, sans quoi ils risquent un refus de mise sur le marché en cas de contrôle douanier ou DGCCRF.",
  },
  // ── CYBER RESILIENCE ACT ───────────────────────────────────────────────────
  {
    id: "cra-1",
    ref: "Règlement (UE) 2024/2847 — Cyber Resilience Act",
    title: "Cyber Resilience Act — Obligations Classe I (smartphones, IoT, routeurs…)",
    date: "20/11/2024",
    applicability: "11/12/2026",
    type: "Règlement UE",
    category: "eu_related",
    tag: "Cybersécurité",
    isNew: true,
    source: "JOUE L 2024/2847",
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
    devices: ["Smartphones", "Tablettes", "Smartwatches", "SmartGlasses", "Routeurs Wi-Fi", "IoT grand public", "Caméras connectées"],
    summary: "À partir du 11/12/2026, tous les produits numériques vendus en Europe devront prouver leur cybersécurité avant mise sur le marché. Concrètement pour un smartphone ou un objet IoT : pas de mots de passe identiques par défaut, obligation de livrer des correctifs de sécurité pendant toute la durée de vie commerciale, déclaration des vulnérabilités non corrigées à l'ENISA sous 24h, et documentation technique du cycle de vie de la sécurité. Les importateurs et distributeurs sont solidairement responsables.",
  },
  {
    id: "cra-2",
    ref: "Règlement (UE) 2024/2847 — Cyber Resilience Act",
    title: "Cyber Resilience Act — Classe II (passerelles domotiques, gestionnaires mots de passe…)",
    date: "20/11/2024",
    applicability: "11/12/2027",
    type: "Règlement UE",
    category: "eu_related",
    tag: "Cybersécurité",
    isNew: false,
    source: "JOUE L 2024/2847",
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
    devices: ["Passerelles domotiques", "SmartGlasses pro", "Équipements réseaux industriels", "Systèmes de sécurité connectés"],
    summary: "Un an après la Classe I, les produits Classe II (considérés critiques car ils servent de hub pour d'autres appareils) devront passer un audit de cybersécurité par un organisme tiers. Cette catégorie inclut les passerelles domotiques, les gestionnaires de mots de passe matériels et les hyperviseurs légers embarqués.",
  },
  // ── ECOCONCEPTION / ESPR ──────────────────────────────────────────────────
  {
    id: "espr-1",
    ref: "Règlement délégué (UE) 2025/781 — ESPR Smartphones & Tablettes",
    title: "ESPR — Durabilité, réparabilité et recyclabilité des smartphones et tablettes",
    date: "28/04/2025",
    applicability: "28/06/2026",
    type: "Règlement délégué",
    category: "eu_related",
    tag: "Écoconception",
    isNew: true,
    source: "JOUE L 2025/781",
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32025R0781",
    devices: ["Smartphones", "Tablettes", "Liseuses connectées"],
    summary: "À partir de juin 2026, les smartphones et tablettes vendus en Europe devront être conçus pour durer : résistance aux chutes standardisée (IP54 minimum), mises à jour logicielles garanties au moins 5 ans, pièces détachées disponibles 7 ans, score de réparabilité obligatoire sur l'emballage. Les fabricants ne pourront plus brider volontairement les batteries pour pousser au remplacement.",
  },
  {
    id: "espr-2",
    ref: "Règlement délégué (UE) 2025/2134 — ESPR Wearables",
    title: "ESPR — Smartwatches, trackers fitness et écouteurs sans fil",
    date: "18/09/2025",
    applicability: "18/09/2027",
    type: "Règlement délégué",
    category: "eu_related",
    tag: "Écoconception",
    isNew: false,
    source: "JOUE L 2025/2134",
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32025R2134",
    devices: ["Smartwatches", "Trackers fitness", "Écouteurs sans fil", "SmartGlasses"],
    summary: "Les wearables (montres connectées, bracelets fitness, lunettes intelligentes, écouteurs Bluetooth) devront être réparables : batterie remplaçable par un réparateur agréé sans démonter 80% du produit, score de réparabilité affiché, et durée de vie minimale garantie de 3 ans pour la batterie. Les modèles collés ou soudés de manière irréparable seront interdits à la vente.",
  },
  // ── DATA ACT ───────────────────────────────────────────────────────────────
  {
    id: "data-1",
    ref: "Règlement (UE) 2023/2854 — Data Act",
    title: "Data Act — Accès aux données générées par les objets connectés",
    date: "22/12/2023",
    applicability: "12/09/2026",
    type: "Règlement UE",
    category: "eu_related",
    tag: "Données / IoT",
    isNew: false,
    source: "JOUE L 2023/2854",
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854",
    devices: ["Smartphones", "IoT", "Smartwatches", "Appareils électroménagers connectés", "Véhicules connectés"],
    summary: "À partir de septembre 2026, les utilisateurs auront le droit légal d'accéder à toutes les données générées par leurs appareils connectés et de les transférer vers un service concurrent. Pour les fabricants : obligation d'intégrer une interface d'export de données dans chaque appareil (API de portabilité), et interdiction de clauses contractuelles qui verrouillent les données chez le fabricant. Les PME bénéficient d'une protection renforcée contre les clauses abusives.",
  },
  // ── AI ACT ─────────────────────────────────────────────────────────────────
  {
    id: "ai-1",
    ref: "Règlement (UE) 2024/1689 — AI Act",
    title: "AI Act — Obligations pour systèmes IA embarqués (wearables, smartphones, IoT)",
    date: "12/07/2024",
    applicability: "02/08/2026",
    type: "Règlement UE",
    category: "eu_related",
    tag: "Intelligence Artificielle",
    isNew: false,
    source: "JOUE L 2024/1689",
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    devices: ["Smartphones (assistants IA)", "SmartGlasses (reconnaissance faciale)", "Wearables santé IA", "IoT à prise de décision autonome"],
    summary: "Dès août 2026, tout appareil embarquant un système d'IA (assistant vocal, reconnaissance d'image, analyse biométrique) doit être classifié par niveau de risque. Pour les équipements radio grand public : transparence obligatoire sur le fait qu'on interagit avec une IA, interdiction de l'IA de manipulation émotionnelle, et obligation d'enregistrement dans la base de données EU pour les systèmes à risque limité (ex: chatbot sur montre connectée).",
  },
  // ── GREENWASHING / EMPCO ──────────────────────────────────────────────────
  {
    id: "empco-1",
    ref: "Directive (UE) 2024/825 — EmpCo",
    title: "Directive EmpCo — Interdiction allégations environnementales non prouvées",
    date: "06/03/2024",
    applicability: "27/09/2026",
    type: "Directive",
    category: "eu_related",
    tag: "Greenwashing",
    isNew: false,
    source: "JOUE L 2024/825",
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825",
    devices: ["Tous appareils soumis à la RED"],
    summary: "12 nouvelles pratiques commerciales trompeuses sont interdites, dont 'neutre en carbone par compensation' et 'éco-conçu' sans certification tierce. Pour les fabricants d'équipements radio : toute mention écologique sur l'emballage, le site web ou la publicité devra être prouvée par un organisme indépendant accrédité, sous peine de sanctions pouvant aller jusqu'à 4% du CA annuel dans l'UE.",
  },
  {
    id: "empco-2",
    ref: "Règlement d'exécution (UE) 2025/1960",
    title: "Label harmonisé durabilité + notice garantie légale standardisée",
    date: "25/09/2025",
    applicability: "27/09/2026",
    type: "Règlement d'exécution",
    category: "eu_related",
    tag: "Garantie / Durabilité",
    isNew: false,
    source: "JOUE L 2025/1960",
    link: "https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025R1960",
    devices: ["Smartphones", "Tablettes", "Wearables", "IoT grand public"],
    summary: "À partir du 27/09/2026, un label visuel standardisé devra être apposé sur tout produit bénéficiant d'une garantie commerciale de durabilité volontaire. La maquette exacte du label (couleurs, dimensions, pictogrammes) est fixée par ce règlement. La notice de garantie légale (2 ans minimum) devra elle aussi suivre un modèle normalisé disponible en 24 langues. Tout écart de présentation est sanctionnable.",
  },
  // ── TRANSPOSITIONS FR ──────────────────────────────────────────────────────
  {
    id: "fr-1",
    ref: "Projet de loi DDADUE — Art. 20 et 21",
    title: "Transposition EmpCo + garantie durabilité en droit français",
    date: "En cours (Sénat, avril 2026)",
    applicability: "27/09/2026",
    type: "Loi (Code consommation + Code environnement)",
    category: "fr",
    tag: "Anti-greenwashing",
    isNew: true,
    source: "Sénat — Rapport A25-346",
    link: "https://www.senat.fr/rap/a25-346/a25-3463.html",
    devices: ["Tous appareils soumis à la RED"],
    summary: "Les articles 20 et 21 du projet de loi DDADUE inscrivent dans le Code de la consommation et le Code de l'environnement les obligations de la directive EmpCo. La DGCCRF pourra sanctionner jusqu'à 10% du CA annuel les fabricants utilisant des allégations écologiques non prouvées. C'est la première définition légale du 'greenwashing' en droit français. Le texte est au Sénat en commission depuis avril 2026.",
  },
  {
    id: "fr-2",
    ref: "Décret d'application ESPR Smartphones (attendu T3 2026)",
    title: "Transposition ESPR smartphones/tablettes — Score de réparabilité v2",
    date: "Attendu juin 2026",
    applicability: "28/06/2026",
    type: "Décret (Code environnement art. L541-10-9)",
    category: "fr",
    tag: "Réparabilité",
    isNew: true,
    source: "MEFSIN — Consultation publique clôturée 15/03/2026",
    link: "https://www.legifrance.gouv.fr",
    devices: ["Smartphones", "Tablettes"],
    summary: "Ce décret met à jour le calcul du score de réparabilité français pour l'aligner sur le nouveau règlement européen ESPR. Le score affiché sur l'étiquette passera de 10 critères à 14 critères, incluant désormais la disponibilité du code source pour les mises à jour de sécurité et la politique de remplacement de batterie. Les vendeurs en ligne devront afficher le score sur la fiche produit avant le bouton d'achat.",
  },
  {
    id: "fr-3",
    ref: "Ordonnance de transposition Data Act (attendue S2 2026)",
    title: "Transposition Data Act — Portabilité données IoT en droit français",
    date: "Attendue septembre 2026",
    applicability: "12/09/2026",
    type: "Ordonnance (habilitation loi DDADUE)",
    category: "fr",
    tag: "Données / IoT",
    isNew: false,
    source: "DNUM / CNIL — Feuille de route 2026",
    link: "https://www.legifrance.gouv.fr",
    devices: ["IoT", "Smartphones", "Wearables", "Appareils connectés"],
    summary: "La France transposera le Data Act via ordonnance (le Parlement ayant donné habilitation dans la loi DDADUE). La CNIL sera désignée autorité de contrôle compétente pour les litiges liés à la portabilité des données issues d'objets connectés. Des sanctions administratives jusqu'à 20 millions d'euros ou 4% du CA mondial seront applicables.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

function Pill({ text, color, bg }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 6, color, background: bg,
      letterSpacing: "0.05em", whiteSpace: "nowrap", display: "inline-block"
    }}>{text}</span>
  );
}

function RegCard({ reg }) {
  const [open, setOpen] = useState(false);

  const isEuRed     = reg.category === "eu_red";
  const isRelated   = reg.category === "eu_related";
  const isFR        = reg.category === "fr";
  const accent      = isEuRed ? S.euAccent : isFR ? S.frAccent : S.relAccent;
  const cardBg      = isEuRed ? S.euBg    : isFR ? S.frBg    : S.relBg;
  const border      = isEuRed ? S.euBorder : isFR ? S.frBorder : S.relBorder;

  return (
    <div style={{
      background: cardBg, border: `1px solid ${border}`,
      borderRadius: 14, padding: "14px 16px", marginBottom: 12,
      borderLeft: `3px solid ${accent}`,
    }}>
      {/* Badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
        {reg.isNew && (
          <Pill text="🆕 NOUVEAU" color="#fff" bg={accent + "cc"} />
        )}
        <Pill
          text={isEuRed ? `🇪🇺 ${reg.tag}` : isFR ? `🇫🇷 ${reg.tag}` : `🔗 ${reg.tag}`}
          color={accent} bg={accent + "22"}
        />
        <span style={{ marginLeft: "auto", fontSize: 11, color: S.muted }}>{reg.date}</span>
      </div>

      {/* Titre */}
      <div style={{
        fontSize: 14, fontWeight: 700, color: S.text,
        lineHeight: 1.4, marginBottom: 6
      }}>{reg.title}</div>

      {/* Référence */}
      <div style={{ fontSize: 10, color: S.muted, marginBottom: 8 }}>
        {reg.ref} — {reg.type}
      </div>

      {/* Appareils concernés */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {reg.devices.map(d => (
          <span key={d} style={{
            fontSize: 9, color: S.muted, background: S.card,
            border: `1px solid ${S.cardBorder}`,
            padding: "1px 6px", borderRadius: 4
          }}>{d}</span>
        ))}
      </div>

      {/* Échéance */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: S.purpleBg, border: `1px solid ${S.purple}44`,
        borderRadius: 6, padding: "4px 10px", marginBottom: 8
      }}>
        <span style={{ fontSize: 12 }}>📅</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: S.purple }}>
          Application : {reg.applicability}
        </span>
      </div>

      {/* Toggle résumé */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          cursor: "pointer", marginTop: 4
        }}
      >
        <span style={{
          fontSize: 11, color: accent, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 4
        }}>
          <span style={{
            display: "inline-block",
            transform: open ? "rotate(90deg)" : "rotate(0)",
            transition: "transform .2s"
          }}>▶</span>
          {open ? "Masquer le résumé" : "💬 Lire en clair"}
        </span>
      </div>

      {open && (
        <div style={{
          marginTop: 10, background: S.bg,
          borderLeft: `2px solid ${accent}44`,
          borderRadius: "0 8px 8px 0",
          padding: "10px 12px"
        }}>
          <p style={{
            margin: 0, fontSize: 12, color: "#c0c4d8",
            lineHeight: 1.7, fontFamily: "sans-serif"
          }}>{reg.summary}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <a
              href={reg.link} target="_blank" rel="noreferrer"
              style={{
                fontSize: 10, fontWeight: 700, padding: "5px 12px",
                background: accent, color: "#fff",
                borderRadius: 6, textDecoration: "none", display: "inline-block"
              }}
            >{isFR ? "Légifrance" : "EUR-Lex"}</a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DATES
// ─────────────────────────────────────────────────────────────────────────────

function formatDateTime(d) {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).replace(",", "");
}

function addDays(d, n) {
  return new Date(d.getTime() + n * 86400000);
}

const SCAN_INTERVAL_DAYS = 7;
const STORAGE_LAST       = "rm_lastScan";
const STORAGE_NEXT       = "rm_nextScan";
const STORAGE_TS         = "rm_lastScanTs";

// ─────────────────────────────────────────────────────────────────────────────
// ONGLET ACCUEIL
// ─────────────────────────────────────────────────────────────────────────────

function HomeTab({ lastScan, nextScan, onScan, scanLoading }) {
  const upcoming = [
    { date: "28/06/2026", label: "ESPR Smartphones & Tablettes",            flag: "🇪🇺🇫🇷" },
    { date: "02/08/2026", label: "AI Act — IA embarquée",                   flag: "🇪🇺" },
    { date: "12/09/2026", label: "Data Act — Portabilité IoT",              flag: "🇪🇺🇫🇷" },
    { date: "27/09/2026", label: "EmpCo anti-greenwashing + label garantie",flag: "🇪🇺🇫🇷" },
    { date: "11/12/2026", label: "Cyber Resilience Act — Classe I",         flag: "🇪🇺" },
    { date: "15/11/2026", label: "Retrait normes RED (DECT, SRD…)",         flag: "🇪🇺" },
    { date: "18/09/2027", label: "ESPR Wearables & SmartGlasses",           flag: "🇪🇺" },
    { date: "11/12/2027", label: "Cyber Resilience Act — Classe II",        flag: "🇪🇺" },
    { date: "14/02/2027", label: "Retrait normes RED ferroviaires",         flag: "🇪🇺" },
    { date: "11/06/2027", label: "Retrait normes RED (EN 303 659…)",        flag: "🇪🇺" },
  ].sort((a, b) => {
    const p = s => s.split("/").reverse().join("");
    return p(a.date).localeCompare(p(b.date));
  });

  return (
    <div style={{ padding: "12px 16px 90px" }}>

      {/* Filtre actif */}
      <div style={{
        background: S.greenBg, border: `1px solid ${S.greenBorder}`,
        borderLeft: `3px solid ${S.greenAccent}`,
        borderRadius: 12, padding: "10px 14px", marginBottom: 12
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.greenAccent }}>
          ✅ Filtre actif : réglementations ≥ 01/06/2026
        </div>
        <div style={{ fontSize: 11, color: "#86efac", marginTop: 3 }}>
          Textes antérieurs masqués · 10 textes en surveillance active
        </div>
      </div>

      {/* Alerte FR nouvelle */}
      <div style={{
        background: S.frBg, border: `1px solid ${S.frBorder}`,
        borderLeft: `3px solid ${S.frAccent}`,
        borderRadius: 12, padding: "10px 14px", marginBottom: 10,
        display: "flex", gap: 10, alignItems: "flex-start"
      }}>
        <span style={{ fontSize: 18 }}>🇫🇷</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.frAccent }}>
            2 nouveaux textes FR en cours d'adoption
          </div>
          <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 2, lineHeight: 1.5 }}>
            DDADUE art.20-21 (greenwashing) + Décret ESPR smartphones<br />
            <strong>Échéance visée : 27/09/2026 et 28/06/2026</strong>
          </div>
        </div>
      </div>

      {/* Alerte CRA */}
      <div style={{
        background: S.relBg, border: `1px solid ${S.relBorder}`,
        borderLeft: `3px solid ${S.relAccent}`,
        borderRadius: 12, padding: "10px 14px", marginBottom: 16,
        display: "flex", gap: 10, alignItems: "flex-start"
      }}>
        <span style={{ fontSize: 18 }}>🇪🇺</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.relAccent }}>
            🆕 Cyber Resilience Act — Classe I (11/12/2026)
          </div>
          <div style={{ fontSize: 11, color: "#7dd3fc", marginTop: 2, lineHeight: 1.5 }}>
            Smartphones, IoT, routeurs, wearables · Nouvelles obligations cybersécurité obligatoires
          </div>
        </div>
      </div>

      {/* Carte scraping */}
      <div style={{
        background: S.card, border: `1px solid ${S.cardBorder}`,
        borderRadius: 12, padding: "14px 16px", marginBottom: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: S.text, marginBottom: 4 }}>
            ⏱️ Scraping hebdomadaire
          </div>
          <div style={{ fontSize: 11, color: S.muted }}>
            Dernier scan : <span style={{ color: S.greenAccent }}>{lastScan}</span>
          </div>
          <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>
            Prochain scan : <span style={{ color: S.warnAccent }}>{nextScan}</span>
          </div>
          <div style={{ fontSize: 10, color: S.muted, marginTop: 4 }}>
            Sources : EUR-Lex · Légifrance · JORF · ETSI
          </div>
        </div>
        <button
          onClick={onScan}
          disabled={scanLoading}
          style={{
            background: scanLoading ? S.cardBorder : S.euAccent,
            color: "#fff", border: "none",
            padding: "10px 16px", borderRadius: 10,
            fontWeight: 700, fontSize: 13,
            cursor: scanLoading ? "default" : "pointer",
            transition: "background .2s",
            minWidth: 72, textAlign: "center"
          }}
        >
          {scanLoading ? "⏳" : "🔄 Scan"}
        </button>
      </div>

      {/* Timeline */}
      <div style={{
        fontSize: 10, fontWeight: 700, color: S.muted,
        letterSpacing: "0.1em", marginBottom: 10
      }}>CALENDRIER DES ÉCHÉANCES</div>

      {upcoming.map((e, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 0", borderBottom: `1px solid ${S.cardBorder}`
        }}>
          <div style={{
            background: S.purpleBg, border: `1px solid ${S.purple}44`,
            borderRadius: 8, padding: "6px 10px",
            minWidth: 68, textAlign: "center", flexShrink: 0
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: S.purple }}>
              {e.date.slice(0, 5)}
            </div>
            <div style={{ fontSize: 10, color: S.purple }}>{e.date.slice(6)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: S.text, lineHeight: 1.3 }}>
              {e.flag} {e.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONGLET VEILLE
// ─────────────────────────────────────────────────────────────────────────────

function VeilleTab() {
  const [filter, setFilter] = useState("tous");

  const filters = [
    { key: "tous",       label: "Tous" },
    { key: "eu_red",     label: "🇪🇺 RED stricte" },
    { key: "eu_related", label: "🔗 Connexes EU" },
    { key: "fr",         label: "🇫🇷 Droit FR" },
  ];

  const visible = filter === "tous"
    ? REGULATIONS
    : REGULATIONS.filter(r => r.category === filter);

  const groups = filter === "tous"
    ? [
        { key: "eu_red",     label: "🇪🇺 TEXTES STRICTEMENT RED (2014/53/UE)", color: S.euAccent,   items: REGULATIONS.filter(r => r.category === "eu_red") },
        { key: "eu_related", label: "🔗 RÉGLEMENTATIONS CONNEXES — IMPACT APPAREILS RED", color: S.relAccent, items: REGULATIONS.filter(r => r.category === "eu_related") },
        { key: "fr",         label: "🇫🇷 TRANSPOSITIONS EN DROIT FRANÇAIS", color: S.frAccent,  items: REGULATIONS.filter(r => r.category === "fr") },
      ]
    : [{ key: filter, label: "", color: S.text, items: visible }];

  return (
    <div style={{ padding: "12px 16px 90px" }}>
      {/* Légende */}
      <div style={{
        background: S.card, border: `1px solid ${S.cardBorder}`,
        borderRadius: 10, padding: "10px 12px", marginBottom: 12,
        fontSize: 10, color: S.muted, lineHeight: 1.8
      }}>
        <strong style={{ color: S.text }}>Catégories surveillées :</strong><br />
        🇪🇺 <span style={{ color: S.euAccent }}>RED stricte</span> — modifient directement 2014/53/UE (normes harmonisées)<br />
        🔗 <span style={{ color: S.relAccent }}>Connexes</span> — CRA, ESPR, Data Act, AI Act, EmpCo… impactent les appareils RED<br />
        🇫🇷 <span style={{ color: S.frAccent }}>Droit FR</span> — transpositions Légifrance / JORF
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "5px 12px", borderRadius: 8, border: "none",
              background: filter === f.key ? S.euAccent : S.card,
              color: filter === f.key ? "#fff" : S.muted,
              fontSize: 11, fontWeight: filter === f.key ? 700 : 400,
              cursor: "pointer"
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Cartes groupées */}
      {groups.map(g => (
        <div key={g.key}>
          {filter === "tous" && (
            <div style={{
              fontSize: 10, fontWeight: 700, color: g.color,
              letterSpacing: "0.1em", marginBottom: 10, marginTop: 4
            }}>{g.label}</div>
          )}
          {g.items.map(r => <RegCard key={r.id} reg={r} />)}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONGLET ALERTES
// ─────────────────────────────────────────────────────────────────────────────

function AlertesTab({ lastScan, nextScan, scanLog }) {
  const [prefs, setPrefs] = useState({
    red_strict: true,
    cra: true,
    espr: true,
    data_act: true,
    ai_act: true,
    empco: true,
    fr_transpo: true,
    rien_nouveau: true,
    rappel_j60: true,
    rappel_j30: true,
    resume_ai: true,
  });

  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const toggleItems = [
    { key: "red_strict",   icon: "📐", label: "Nouvelles normes harmonisées RED" },
    { key: "cra",          icon: "🛡️", label: "Cyber Resilience Act (CRA)" },
    { key: "espr",         icon: "♻️", label: "Écoconception ESPR (smartphones, wearables)" },
    { key: "data_act",     icon: "💾", label: "Data Act — IoT & données" },
    { key: "ai_act",       icon: "🤖", label: "AI Act — IA embarquée" },
    { key: "empco",        icon: "🌿", label: "Greenwashing / EmpCo / Garanties" },
    { key: "fr_transpo",   icon: "🇫🇷", label: "Transpositions en droit français" },
    { key: "rien_nouveau", icon: "✅", label: "Confirmation scan (même si rien de nouveau)" },
    { key: "rappel_j60",   icon: "📅", label: "Rappels d'échéances à J-60" },
    { key: "rappel_j30",   icon: "⏰", label: "Rappels d'échéances à J-30" },
    { key: "resume_ai",    icon: "💬", label: "Résumés vulgarisés automatiques" },
  ];

  return (
    <div style={{ padding: "12px 16px 90px" }}>
      {/* Alerte critique */}
      <div style={{
        background: S.frBg, border: `1px solid ${S.frBorder}`,
        borderLeft: `3px solid ${S.frAccent}`,
        borderRadius: 12, padding: "12px 14px", marginBottom: 16
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.frAccent, marginBottom: 4 }}>
          ⚠️ Échéance critique — 28/06/2026
        </div>
        <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>
          ESPR Smartphones & Tablettes entre en vigueur dans <strong>33 jours</strong>. Vérifier la conformité réparabilité et score d'affichage.
        </div>
      </div>

      {/* Statut scraping */}
      <div style={{
        background: S.card, border: `1px solid ${S.cardBorder}`,
        borderRadius: 12, padding: "12px 14px", marginBottom: 16
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.text, marginBottom: 8 }}>
          🔄 Statut du scraping
        </div>
        <div style={{ fontSize: 11, color: S.muted, lineHeight: 1.8 }}>
          Dernier scan : <span style={{ color: S.greenAccent }}>{lastScan}</span><br />
          Prochain scan : <span style={{ color: S.warnAccent }}>{nextScan}</span><br />
          Fréquence : <span style={{ color: S.text }}>7 jours</span><br />
          Sources : <span style={{ color: S.text }}>EUR-Lex SPARQL · Légifrance API · JORF RSS · ETSI</span>
        </div>
        {scanLog.length > 0 && (
          <div style={{ marginTop: 10, borderTop: `1px solid ${S.cardBorder}`, paddingTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.muted, letterSpacing: "0.08em", marginBottom: 6 }}>
              HISTORIQUE
            </div>
            {scanLog.slice(-4).reverse().map((log, i) => (
              <div key={i} style={{
                fontSize: 11, color: log.hasNew ? S.relAccent : S.greenAccent,
                padding: "2px 0"
              }}>
                {log.hasNew ? "🆕" : "✅"} {log.date} — {log.hasNew ? "Nouveaux textes détectés" : "Aucune modification"}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toggles */}
      <div style={{ fontSize: 10, fontWeight: 700, color: S.muted, letterSpacing: "0.1em", marginBottom: 10 }}>
        NOTIFICATIONS ACTIVES
      </div>
      {toggleItems.map(item => (
        <div key={item.key} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 0", borderBottom: `1px solid ${S.cardBorder}`
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: S.text }}>{item.label}</span>
          </div>
          <div
            onClick={() => toggle(item.key)}
            style={{
              width: 42, height: 24, borderRadius: 12,
              background: prefs[item.key] ? S.euAccent : S.cardBorder,
              position: "relative", cursor: "pointer",
              transition: "background .25s", flexShrink: 0
            }}
          >
            <div style={{
              position: "absolute", top: 3,
              left: prefs[item.key] ? 21 : 3,
              width: 18, height: 18, borderRadius: "50%",
              background: "#fff", transition: "left .25s",
              boxShadow: "0 1px 3px rgba(0,0,0,.4)"
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState("accueil");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanLog, setScanLog] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rm_scanLog") || "[]");
    } catch { return []; }
  });

  const [lastScan, setLastScan] = useState(() =>
    localStorage.getItem(STORAGE_LAST) || formatDateTime(new Date())
  );
  const [nextScan, setNextScan] = useState(() =>
    localStorage.getItem(STORAGE_NEXT) || formatDateTime(addDays(new Date(), SCAN_INTERVAL_DAYS))
  );

  // ── Scan simulé (en prod : appels Retrofit/SPARQL côté Android) ─────────────
  const runScan = useCallback(() => {
    setScanLoading(true);

    setTimeout(() => {
      const now = new Date();
      const next = addDays(now, SCAN_INTERVAL_DAYS);
      const nowStr  = formatDateTime(now);
      const nextStr = formatDateTime(next);

      // Simuler : aucun nouveau texte trouvé cette semaine
      const hasNew = false;

      const newLog = [...scanLog, { date: nowStr, hasNew }].slice(-20);

      localStorage.setItem(STORAGE_LAST, nowStr);
      localStorage.setItem(STORAGE_NEXT, nextStr);
      localStorage.setItem(STORAGE_TS, String(now.getTime()));
      localStorage.setItem("rm_scanLog", JSON.stringify(newLog));

      setLastScan(nowStr);
      setNextScan(nextStr);
      setScanLog(newLog);
      setScanLoading(false);

      // Notification web (marche en localhost / PWA)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("RED Monitor — Scan terminé", {
          body: hasNew
            ? "🆕 Nouveaux textes réglementaires détectés !"
            : "✅ Aucune modification — Veille à jour.",
          icon: "/favicon.ico"
        });
      }
    }, 1800);
  }, [scanLog]);

  // ── Demande permission notif + scan auto si délai dépassé ──────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const ts = parseInt(localStorage.getItem(STORAGE_TS) || "0", 10);
    const elapsed = Date.now() - ts;
    if (elapsed >= SCAN_INTERVAL_DAYS * 86400000) {
      runScan();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Badge alertes ──────────────────────────────────────────────────────────
  const newCount = REGULATIONS.filter(r => r.isNew).length; // 3

  const TABS = [
    { key: "accueil", icon: "🏠", label: "ACCUEIL" },
    { key: "veille",  icon: "📋", label: "VEILLE"  },
    { key: "alertes", icon: "🔔", label: "ALERTES", badge: newCount },
  ];

  return (
    <div style={{
      background: S.bg, color: S.text,
      minHeight: "100vh", fontFamily: "'DM Sans', sans-serif",
      maxWidth: 480, margin: "0 auto",
      position: "relative"
    }}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{
        padding: "18px 18px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${S.cardBorder}`,
        position: "sticky", top: 0, background: S.bg, zIndex: 100
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
            RED Monitor
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: S.muted }}>
            Directive 2014/53/UE · Textes ≥ 01/06/2026 uniquement
          </p>
        </div>
        <div
          onClick={() => setActiveTab("alertes")}
          style={{
            position: "relative", background: S.card,
            border: `1px solid ${S.cardBorder}`,
            padding: "10px 12px", borderRadius: 12, cursor: "pointer"
          }}
        >
          <span style={{ fontSize: 20 }}>🔔</span>
          {newCount > 0 && (
            <span style={{
              position: "absolute", top: 4, right: 4,
              background: S.frAccent, color: "#fff",
              borderRadius: "50%", width: 16, height: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700
            }}>{newCount}</span>
          )}
        </div>
      </header>

      {/* ── CONTENU DYNAMIQUE ──────────────────────────────────────────────── */}
      <main style={{ overflowY: "auto" }}>
        {activeTab === "accueil" && (
          <HomeTab
            lastScan={lastScan}
            nextScan={nextScan}
            onScan={runScan}
            scanLoading={scanLoading}
          />
        )}
        {activeTab === "veille" && <VeilleTab />}
        {activeTab === "alertes" && (
          <AlertesTab
            lastScan={lastScan}
            nextScan={nextScan}
            scanLog={scanLog}
          />
        )}
      </main>

      {/* ── BARRE DE NAVIGATION ─────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: S.card,
        borderTop: `1px solid ${S.cardBorder}`,
        display: "flex",
        zIndex: 9999
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1, padding: "10px 0",
              background: "transparent", border: "none",
              cursor: "pointer",
              borderTop: activeTab === t.key
                ? `2px solid ${S.euAccent}`
                : "2px solid transparent",
              position: "relative"
            }}
          >
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{
              fontSize: 9, fontWeight: 700, marginTop: 2,
              color: activeTab === t.key ? S.euAccent : S.muted,
              letterSpacing: "0.06em"
            }}>{t.label}</div>
            {t.badge > 0 && (
              <span style={{
                position: "absolute", top: 6, right: "28%",
                background: S.frAccent, color: "#fff",
                borderRadius: "50%", width: 14, height: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, fontWeight: 700
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
