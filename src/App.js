import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE DARK
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  bg:          "#0f1120",
  card:        "#1a1e35",
  cardBorder:  "#2a2f4a",
  text:        "#e8eaf0",
  muted:       "#7a7f9a",
  euAccent:    "#4a7dff",
  euBg:        "#0d1a3a",
  euBorder:    "#1e3a7a",
  frAccent:    "#e04f5f",
  frBg:        "#2a0d12",
  frBorder:    "#5a1a22",
  relAccent:   "#38bdf8",
  relBg:       "#0d2030",
  relBorder:   "#1a4060",
  greenAccent: "#4ade80",
  greenBg:     "#0d2a18",
  greenBorder: "#1a5a30",
  warnAccent:  "#f59e0b",
  warnBg:      "#2a1f0d",
  purple:      "#a78bfa",
  purpleBg:    "#1a0d2a",
};

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES RÉGLEMENTAIRES — filtre ≥ 01/06/2026
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
    link: "https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025D0893",
    devices: ["Smartphones", "IoT", "Routeurs", "Objets connectés SRD"],
    summary:
      "14 nouvelles normes ETSI publiées ; 6 anciennes normes (DECT, SRD, WAS/RLAN 5-6 GHz) retirées le 15/11/2026. Tout appareil certifié selon une norme retirée doit être recertifié avant cette date, sinon la présomption de conformité RED disparaît et le marquage CE peut être remis en cause lors d'un contrôle DGCCRF ou douanier.",
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
    link: "https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025D1741",
    devices: ["Équipements radio ferroviaires", "IoT transport"],
    summary:
      "La norme EN 301 489-28 V2.1.1 sur la compatibilité électromagnétique des équipements radio ferroviaires est publiée. Six normes antérieures restent valides jusqu'au 14/02/2027 seulement. Après cette date, seule la nouvelle version est reconnue par la Commission pour la présomption de conformité RED.",
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
    link: "https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025D2499",
    devices: ["Équipements radio courte portée", "Balises", "IoT industriel"],
    summary:
      "Deux nouvelles normes harmonisées citées au JOUE ; trois normes antérieures retirées au 11/06/2027. Les fabricants certifiés selon les normes retirées ont jusqu'à cette date pour migrer, sous peine de refus de mise sur le marché lors d'un contrôle.",
  },

  // ── CYBER RESILIENCE ACT ───────────────────────────────────────────────────
  {
    id: "cra-1",
    ref: "Règlement (UE) 2024/2847 — Cyber Resilience Act — Classe I",
    title: "CRA — Obligations Classe I : smartphones, IoT, routeurs, wearables",
    date: "20/11/2024",
    applicability: "11/12/2026",
    type: "Règlement UE",
    category: "eu_related",
    tag: "Cybersécurité",
    isNew: true,
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
    devices: ["Smartphones", "Tablettes", "Smartwatches", "SmartGlasses", "Routeurs Wi-Fi", "IoT grand public", "Caméras connectées"],
    summary:
      "À partir du 11/12/2026, tout produit numérique vendu en Europe doit prouver sa cybersécurité avant mise sur le marché. Pour smartphones et objets IoT : interdiction des mots de passe identiques par défaut, correctifs de sécurité obligatoires pendant toute la durée de vie commerciale, déclaration des vulnérabilités à l'ENISA sous 24h. Importateurs et distributeurs sont solidairement responsables avec le fabricant.",
  },
  {
    id: "cra-2",
    ref: "Règlement (UE) 2024/2847 — Cyber Resilience Act — Classe II",
    title: "CRA — Classe II : passerelles domotiques, équipements critiques",
    date: "20/11/2024",
    applicability: "11/12/2027",
    type: "Règlement UE",
    category: "eu_related",
    tag: "Cybersécurité",
    isNew: false,
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
    devices: ["Passerelles domotiques", "SmartGlasses pro", "Équipements réseaux industriels", "Systèmes de sécurité connectés"],
    summary:
      "Un an après la Classe I, les produits Classe II (passerelles domotiques, gestionnaires de mots de passe matériels, hyperviseurs embarqués) devront passer un audit tiers obligatoire. Ces appareils sont considérés critiques car ils servent de hub central pour d'autres équipements connectés.",
  },

  // ── ÉCOCONCEPTION ESPR ────────────────────────────────────────────────────
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
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32025R0781",
    devices: ["Smartphones", "Tablettes", "Liseuses connectées"],
    summary:
      "Dès juin 2026, smartphones et tablettes vendus en Europe devront être conçus pour durer : résistance aux chutes IP54 minimum, mises à jour logicielles garanties 5 ans, pièces détachées disponibles 7 ans, score de réparabilité obligatoire sur l'emballage. Interdiction de brider volontairement les batteries pour pousser au remplacement.",
  },
  {
    id: "espr-2",
    ref: "Règlement délégué (UE) 2025/2134 — ESPR Wearables",
    title: "ESPR — Smartwatches, trackers fitness, écouteurs sans fil et SmartGlasses",
    date: "18/09/2025",
    applicability: "18/09/2027",
    type: "Règlement délégué",
    category: "eu_related",
    tag: "Écoconception",
    isNew: false,
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32025R2134",
    devices: ["Smartwatches", "Trackers fitness", "Écouteurs sans fil", "SmartGlasses"],
    summary:
      "Montres connectées, bracelets fitness, lunettes intelligentes et écouteurs Bluetooth devront être réparables : batterie remplaçable sans démonter 80% du produit, score de réparabilité affiché, durée de vie batterie garantie 3 ans minimum. Les modèles collés ou soudés irréparablement seront interdits à la vente dans l'UE.",
  },

  // ── DATA ACT ───────────────────────────────────────────────────────────────
  {
    id: "data-1",
    ref: "Règlement (UE) 2023/2854 — Data Act",
    title: "Data Act — Droit d'accès aux données générées par les objets connectés",
    date: "22/12/2023",
    applicability: "12/09/2026",
    type: "Règlement UE",
    category: "eu_related",
    tag: "Données / IoT",
    isNew: false,
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854",
    devices: ["Smartphones", "IoT", "Smartwatches", "Électroménager connecté", "Véhicules connectés"],
    summary:
      "À partir de septembre 2026, les utilisateurs ont le droit légal d'accéder à toutes les données générées par leurs appareils et de les transférer vers un service concurrent. Obligation pour les fabricants d'intégrer une API de portabilité dans chaque appareil, et interdiction des clauses contractuelles verrouillant les données chez le fabricant.",
  },

  // ── AI ACT ─────────────────────────────────────────────────────────────────
  {
    id: "ai-1",
    ref: "Règlement (UE) 2024/1689 — AI Act",
    title: "AI Act — Systèmes IA embarqués dans les appareils radio",
    date: "12/07/2024",
    applicability: "02/08/2026",
    type: "Règlement UE",
    category: "eu_related",
    tag: "Intelligence Artificielle",
    isNew: false,
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    devices: ["Smartphones (assistants IA)", "SmartGlasses (reconnaissance faciale)", "Wearables santé IA", "IoT décision autonome"],
    summary:
      "Dès août 2026, tout appareil embarquant une IA (assistant vocal, reconnaissance d'image, analyse biométrique) doit être classifié par niveau de risque. Obligations : transparence sur l'utilisation d'une IA, interdiction de la manipulation émotionnelle, enregistrement obligatoire dans la base de données EU pour les systèmes à risque limité comme un chatbot sur montre connectée.",
  },

  // ── EMPCO / GREENWASHING ──────────────────────────────────────────────────
  {
    id: "empco-1",
    ref: "Directive (UE) 2024/825 — EmpCo",
    title: "EmpCo — Interdiction des allégations environnementales non prouvées",
    date: "06/03/2024",
    applicability: "27/09/2026",
    type: "Directive",
    category: "eu_related",
    tag: "Greenwashing",
    isNew: false,
    link: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825",
    devices: ["Tous appareils soumis à la RED"],
    summary:
      "12 nouvelles pratiques trompeuses interdites, dont 'neutre en carbone par compensation' et 'éco-conçu' sans certification tierce. Pour les fabricants d'équipements radio : toute mention écologique sur l'emballage, le site web ou la publicité devra être prouvée par un organisme indépendant accrédité. Sanctions jusqu'à 4% du CA annuel dans l'UE.",
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
    link: "https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32025R1960",
    devices: ["Smartphones", "Tablettes", "Wearables", "IoT grand public"],
    summary:
      "À partir du 27/09/2026, un label visuel normalisé devra être apposé sur tout produit bénéficiant d'une garantie commerciale de durabilité. La maquette exacte (couleurs, dimensions, pictogrammes) est fixée par ce règlement. La notice de garantie légale (2 ans minimum) devra également suivre un modèle standardisé disponible en 24 langues de l'UE.",
  },

  // ── TRANSPOSITIONS DROIT FRANÇAIS ─────────────────────────────────────────
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
    link: "https://www.senat.fr/rap/a25-346/a25-3463.html",
    devices: ["Tous appareils soumis à la RED"],
    summary:
      "Les articles 20 et 21 du projet DDADUE inscrivent dans le Code de la consommation et le Code de l'environnement les obligations de la directive EmpCo. La DGCCRF pourra sanctionner jusqu'à 10% du CA annuel les fabricants utilisant des allégations écologiques non prouvées. Première définition légale du 'greenwashing' en droit français.",
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
    link: "https://www.legifrance.gouv.fr",
    devices: ["Smartphones", "Tablettes"],
    summary:
      "Ce décret aligne le score de réparabilité français sur le nouveau règlement ESPR. Le score passe de 10 à 14 critères, incluant désormais la disponibilité du code source pour les mises à jour de sécurité et la politique de remplacement de batterie. Les vendeurs en ligne devront afficher le score sur la fiche produit avant le bouton d'achat.",
  },
  {
    id: "fr-3",
    ref: "Ordonnance de transposition Data Act (attendue S2 2026)",
    title: "Transposition Data Act — Portabilité données IoT en droit français",
    date: "Attendue sept. 2026",
    applicability: "12/09/2026",
    type: "Ordonnance (habilitation loi DDADUE)",
    category: "fr",
    tag: "Données / IoT",
    isNew: false,
    link: "https://www.legifrance.gouv.fr",
    devices: ["IoT", "Smartphones", "Wearables", "Appareils connectés"],
    summary:
      "La France transposera le Data Act via ordonnance. La CNIL sera désignée autorité de contrôle pour les litiges de portabilité des données IoT. Sanctions administratives jusqu'à 20 millions d'euros ou 4% du CA mondial applicables.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_LAST = "rm_lastScan";
const STORAGE_NEXT = "rm_nextScan";
const STORAGE_TS   = "rm_lastScanTs";
const STORAGE_LOG  = "rm_scanLog";
const SCAN_DAYS    = 7;

function fmtDate(d) {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).replace(",", "");
}
function addDays(d, n) {
  return new Date(d.getTime() + n * 86_400_000);
}
function safeLS(key, fallback) {
  try { return localStorage.getItem(key) || fallback; }
  catch { return fallback; }
}
function setLS(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS
// ─────────────────────────────────────────────────────────────────────────────

function Pill({ label, color, bg }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 6, color, background: bg,
      letterSpacing: "0.05em", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 26, borderRadius: 13, flexShrink: 0,
        background: on ? S.euAccent : S.cardBorder,
        position: "relative", cursor: "pointer",
        transition: "background .2s",
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left .2s",
        boxShadow: "0 1px 4px rgba(0,0,0,.4)",
      }} />
    </div>
  );
}

function RegCard({ reg }) {
  const [open, setOpen] = useState(false);
  const cat = reg.category;
  const accent = cat === "eu_red" ? S.euAccent : cat === "fr" ? S.frAccent : S.relAccent;
  const bg     = cat === "eu_red" ? S.euBg     : cat === "fr" ? S.frBg     : S.relBg;
  const border = cat === "eu_red" ? S.euBorder : cat === "fr" ? S.frBorder : S.relBorder;

  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 14, padding: "14px 16px", marginBottom: 12,
    }}>
      {/* ligne 1 : badges + date */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 }}>
        {reg.isNew && <Pill label="🆕 NOUVEAU" color="#fff" bg={accent + "cc"} />}
        <Pill
          label={cat === "eu_red" ? `🇪🇺 ${reg.tag}` : cat === "fr" ? `🇫🇷 ${reg.tag}` : `🔗 ${reg.tag}`}
          color={accent} bg={accent + "22"}
        />
        <span style={{ marginLeft: "auto", fontSize: 11, color: S.muted }}>{reg.date}</span>
      </div>

      {/* titre */}
      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: S.text, lineHeight: 1.4 }}>
        {reg.title}
      </p>

      {/* référence */}
      <p style={{ margin: "0 0 8px", fontSize: 10, color: S.muted }}>{reg.ref} — {reg.type}</p>

      {/* appareils */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {reg.devices.map(d => (
          <span key={d} style={{
            fontSize: 9, color: S.muted, background: S.card,
            border: `1px solid ${S.cardBorder}`,
            padding: "1px 6px", borderRadius: 4,
          }}>{d}</span>
        ))}
      </div>

      {/* échéance */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: S.purpleBg, border: `1px solid ${S.purple}44`,
        borderRadius: 6, padding: "4px 10px", marginBottom: 10,
      }}>
        <span>📅</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: S.purple }}>
          Application : {reg.applicability}
        </span>
      </div>

      {/* toggle résumé */}
      <div onClick={() => setOpen(o => !o)} style={{ cursor: "pointer" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: accent, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }}>▶</span>
          {open ? "Masquer le résumé" : "💬 Lire en clair"}
        </span>
      </div>

      {open && (
        <div style={{
          marginTop: 10, background: S.bg,
          borderLeft: `2px solid ${accent}55`,
          borderRadius: "0 8px 8px 0",
          padding: "10px 14px",
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#c0c4d8", lineHeight: 1.75 }}>
            {reg.summary}
          </p>
          <a
            href={reg.link} target="_blank" rel="noreferrer"
            style={{
              fontSize: 10, fontWeight: 700, padding: "5px 12px",
              background: accent, color: "#fff",
              borderRadius: 6, textDecoration: "none", display: "inline-block",
            }}
          >
            {cat === "fr" ? "Légifrance / Sénat" : "EUR-Lex"}
          </a>
        </div>
      )}
    </div>
  );
}

// ── ONGLET ACCUEIL ─────────────────────────────────────────────────────────────
function HomeTab({ lastScan, nextScan, onScan, scanLoading }) {
  const agenda = [
    { date: "28/06/2026", label: "ESPR Smartphones & Tablettes",                   flags: "🇪🇺🇫🇷" },
    { date: "02/08/2026", label: "AI Act — IA embarquée",                           flags: "🇪🇺"    },
    { date: "12/09/2026", label: "Data Act — Portabilité IoT",                      flags: "🇪🇺🇫🇷" },
    { date: "27/09/2026", label: "EmpCo anti-greenwashing + label garantie",        flags: "🇪🇺🇫🇷" },
    { date: "15/11/2026", label: "Retrait normes RED (DECT, SRD, WAS/RLAN…)",      flags: "🇪🇺"    },
    { date: "11/12/2026", label: "Cyber Resilience Act — Classe I",                 flags: "🇪🇺"    },
    { date: "14/02/2027", label: "Retrait normes RED ferroviaires",                 flags: "🇪🇺"    },
    { date: "11/06/2027", label: "Retrait normes RED (EN 303 659…)",               flags: "🇪🇺"    },
    { date: "18/09/2027", label: "ESPR Wearables & SmartGlasses",                  flags: "🇪🇺"    },
    { date: "11/12/2027", label: "Cyber Resilience Act — Classe II",                flags: "🇪🇺"    },
  ];

  return (
    <div style={{ padding: "14px 16px 100px" }}>
      {/* filtre actif */}
      <div style={{
        background: S.greenBg, border: `1px solid ${S.greenBorder}`,
        borderLeft: `3px solid ${S.greenAccent}`,
        borderRadius: 12, padding: "10px 14px", marginBottom: 12,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: S.greenAccent }}>
          ✅ Filtre actif : réglementations ≥ 01/06/2026
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#86efac" }}>
          10 textes en surveillance active — Textes antérieurs masqués
        </p>
      </div>

      {/* alerte FR */}
      <div style={{
        background: S.frBg, border: `1px solid ${S.frBorder}`,
        borderLeft: `3px solid ${S.frAccent}`,
        borderRadius: 12, padding: "12px 14px", marginBottom: 10,
        display: "flex", gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>🇫🇷</span>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: S.frAccent }}>
            2 nouveaux textes FR en cours d'adoption
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#fca5a5", lineHeight: 1.5 }}>
            DDADUE art.20-21 (greenwashing) + Décret ESPR smartphones<br />
            <strong>Échéances : 27/09/2026 et 28/06/2026</strong>
          </p>
        </div>
      </div>

      {/* alerte CRA */}
      <div style={{
        background: S.relBg, border: `1px solid ${S.relBorder}`,
        borderLeft: `3px solid ${S.relAccent}`,
        borderRadius: 12, padding: "12px 14px", marginBottom: 16,
        display: "flex", gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>🇪🇺</span>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: S.relAccent }}>
            🆕 Cyber Resilience Act — Classe I (11/12/2026)
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#7dd3fc", lineHeight: 1.5 }}>
            Smartphones · IoT · Routeurs · Wearables<br />
            Nouvelles obligations cybersécurité obligatoires
          </p>
        </div>
      </div>

      {/* carte scraping */}
      <div style={{
        background: S.card, border: `1px solid ${S.cardBorder}`,
        borderRadius: 12, padding: "14px 16px", marginBottom: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: S.text }}>
            ⏱️ Scraping hebdomadaire
          </p>
          <p style={{ margin: "0 0 2px", fontSize: 11, color: S.muted }}>
            Dernier scan : <span style={{ color: S.greenAccent }}>{lastScan}</span>
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: S.muted }}>
            Prochain scan : <span style={{ color: S.warnAccent }}>{nextScan}</span>
          </p>
          <p style={{ margin: 0, fontSize: 10, color: S.muted }}>
            EUR-Lex SPARQL · Légifrance · JORF RSS · ETSI
          </p>
        </div>
        <button
          onClick={onScan}
          disabled={scanLoading}
          style={{
            background: scanLoading ? S.cardBorder : S.euAccent,
            color: "#fff", border: "none",
            padding: "10px 18px", borderRadius: 10,
            fontWeight: 700, fontSize: 14,
            cursor: scanLoading ? "not-allowed" : "pointer",
            transition: "background .2s", whiteSpace: "nowrap",
          }}
        >
          {scanLoading ? "⏳…" : "🔄 Scan"}
        </button>
      </div>

      {/* agenda */}
      <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: S.muted, letterSpacing: "0.1em" }}>
        CALENDRIER DES ÉCHÉANCES
      </p>
      {agenda.map((e, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 0", borderBottom: `1px solid ${S.cardBorder}`,
        }}>
          <div style={{
            background: S.purpleBg, border: `1px solid ${S.purple}44`,
            borderRadius: 8, padding: "6px 10px", minWidth: 68, textAlign: "center", flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: S.purple }}>{e.date.slice(0, 5)}</p>
            <p style={{ margin: 0, fontSize: 10, color: S.purple }}>{e.date.slice(6)}</p>
          </div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: S.text, lineHeight: 1.4 }}>
            {e.flags} {e.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── ONGLET VEILLE ──────────────────────────────────────────────────────────────
function VeilleTab() {
  const [filter, setFilter] = useState("tous");

  const filters = [
    { key: "tous",       label: "Tous" },
    { key: "eu_red",     label: "🇪🇺 RED stricte" },
    { key: "eu_related", label: "🔗 Connexes EU" },
    { key: "fr",         label: "🇫🇷 Droit FR" },
  ];

  const grouped = [
    {
      key: "eu_red",
      label: "🇪🇺 TEXTES STRICTEMENT RED (2014/53/UE)",
      color: S.euAccent,
      items: REGULATIONS.filter(r => r.category === "eu_red"),
    },
    {
      key: "eu_related",
      label: "🔗 RÉGLEMENTATIONS CONNEXES — IMPACT APPAREILS RED",
      color: S.relAccent,
      items: REGULATIONS.filter(r => r.category === "eu_related"),
    },
    {
      key: "fr",
      label: "🇫🇷 TRANSPOSITIONS EN DROIT FRANÇAIS",
      color: S.frAccent,
      items: REGULATIONS.filter(r => r.category === "fr"),
    },
  ];

  const visible = filter === "tous" ? grouped : grouped.filter(g => g.key === filter);

  return (
    <div style={{ padding: "14px 16px 100px" }}>
      {/* légende */}
      <div style={{
        background: S.card, border: `1px solid ${S.cardBorder}`,
        borderRadius: 10, padding: "10px 14px", marginBottom: 12,
        fontSize: 10, color: S.muted, lineHeight: 1.9,
      }}>
        <strong style={{ color: S.text }}>Catégories :</strong><br />
        🇪🇺 <span style={{ color: S.euAccent }}>RED stricte</span> — normes harmonisées 2014/53/UE<br />
        🔗 <span style={{ color: S.relAccent }}>Connexes</span> — CRA · ESPR · Data Act · AI Act · EmpCo<br />
        🇫🇷 <span style={{ color: S.frAccent }}>Droit FR</span> — Légifrance / JORF
      </div>

      {/* filtres */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "5px 12px", borderRadius: 8, border: "none",
              background: filter === f.key ? S.euAccent : S.card,
              color: filter === f.key ? "#fff" : S.muted,
              fontSize: 11, fontWeight: filter === f.key ? 700 : 400,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* groupes */}
      {visible.map(g => (
        <div key={g.key}>
          <p style={{
            margin: "0 0 10px",
            fontSize: 10, fontWeight: 700, color: g.color, letterSpacing: "0.1em",
          }}>{g.label}</p>
          {g.items.map(r => <RegCard key={r.id} reg={r} />)}
        </div>
      ))}
    </div>
  );
}

// ── ONGLET ALERTES ─────────────────────────────────────────────────────────────
function AlertesTab({ lastScan, nextScan, scanLog }) {
  const [prefs, setPrefs] = useState({
    red_normes:    true,
    cra:           true,
    espr:          true,
    data_act:      true,
    ai_act:        true,
    empco:         true,
    fr_transpo:    true,
    rien_nouveau:  true,
    rappel_j60:    true,
    rappel_j30:    true,
  });

  const rows = [
    { key: "red_normes",   icon: "📐", label: "Nouvelles normes harmonisées RED" },
    { key: "cra",          icon: "🛡️",  label: "Cyber Resilience Act (CRA)" },
    { key: "espr",         icon: "♻️",  label: "Écoconception ESPR" },
    { key: "data_act",     icon: "💾",  label: "Data Act — IoT & données" },
    { key: "ai_act",       icon: "🤖",  label: "AI Act — IA embarquée" },
    { key: "empco",        icon: "🌿",  label: "Greenwashing / EmpCo / Garanties" },
    { key: "fr_transpo",   icon: "🇫🇷", label: "Transpositions droit français" },
    { key: "rien_nouveau", icon: "✅",  label: "Confirmation scan (même rien de nouveau)" },
    { key: "rappel_j60",   icon: "📅",  label: "Rappels échéances à J-60" },
    { key: "rappel_j30",   icon: "⏰",  label: "Rappels échéances à J-30" },
  ];

  return (
    <div style={{ padding: "14px 16px 100px" }}>
      {/* alerte critique */}
      <div style={{
        background: S.frBg, border: `1px solid ${S.frBorder}`,
        borderLeft: `3px solid ${S.frAccent}`,
        borderRadius: 12, padding: "12px 14px", marginBottom: 16,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: S.frAccent }}>⚠️ Échéance critique</p>
        <p style={{ margin: "5px 0 0", fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>
          <strong>28/06/2026</strong> — ESPR Smartphones & Tablettes entre en vigueur.<br />
          Vérifier la conformité réparabilité et score d'affichage.
        </p>
      </div>

      {/* statut scan */}
      <div style={{
        background: S.card, border: `1px solid ${S.cardBorder}`,
        borderRadius: 12, padding: "12px 14px", marginBottom: 16,
      }}>
        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: S.text }}>🔄 Statut du scraping</p>
        <p style={{ margin: "0 0 2px", fontSize: 11, color: S.muted }}>
          Dernier scan : <span style={{ color: S.greenAccent }}>{lastScan}</span>
        </p>
        <p style={{ margin: "0 0 2px", fontSize: 11, color: S.muted }}>
          Prochain scan : <span style={{ color: S.warnAccent }}>{nextScan}</span>
        </p>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: S.muted }}>
          Fréquence : <span style={{ color: S.text }}>7 jours</span>
          &nbsp;·&nbsp; Sources : <span style={{ color: S.text }}>EUR-Lex · Légifrance · JORF · ETSI</span>
        </p>

        {scanLog.length > 0 && (
          <div style={{ borderTop: `1px solid ${S.cardBorder}`, paddingTop: 8 }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: S.muted, letterSpacing: "0.08em" }}>
              HISTORIQUE
            </p>
            {[...scanLog].reverse().slice(0, 5).map((log, i) => (
              <p key={i} style={{
                margin: "0 0 3px",
                fontSize: 11,
                color: log.hasNew ? S.relAccent : S.greenAccent,
              }}>
                {log.hasNew ? "🆕" : "✅"} {log.date} — {log.hasNew ? "Nouveaux textes détectés" : "Aucune modification"}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* toggles */}
      <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: S.muted, letterSpacing: "0.1em" }}>
        NOTIFICATIONS ACTIVES
      </p>
      {rows.map(row => (
        <div key={row.key} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 0", borderBottom: `1px solid ${S.cardBorder}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{row.icon}</span>
            <span style={{ fontSize: 13, color: S.text }}>{row.label}</span>
          </div>
          <Toggle
            on={prefs[row.key]}
            onToggle={() => setPrefs(p => ({ ...p, [row.key]: !p[row.key] }))}
          />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab]               = useState("accueil");
  const [scanLoading, setScanLoading] = useState(false);

  const [lastScan, setLastScan] = useState(
    () => safeLS(STORAGE_LAST, fmtDate(new Date()))
  );
  const [nextScan, setNextScan] = useState(
    () => safeLS(STORAGE_NEXT, fmtDate(addDays(new Date(), SCAN_DAYS)))
  );
  const [scanLog, setScanLog] = useState(() => {
    try { return JSON.parse(safeLS(STORAGE_LOG, "[]")); }
    catch { return []; }
  });

  // ── runScan : on utilise une ref pour éviter la closure périmée ─────────────
  const scanLogRef = useRef(scanLog);
  useEffect(() => { scanLogRef.current = scanLog; }, [scanLog]);

  const runScan = () => {
    if (scanLoading) return;
    setScanLoading(true);

    setTimeout(() => {
      const now     = new Date();
      const nowStr  = fmtDate(now);
      const nextStr = fmtDate(addDays(now, SCAN_DAYS));

      // En production : vrai appel réseau → boolean hasNew
      const hasNew = false;

      const newLog = [...scanLogRef.current, { date: nowStr, hasNew }].slice(-20);

      setLS(STORAGE_LAST, nowStr);
      setLS(STORAGE_NEXT, nextStr);
      setLS(STORAGE_TS,   String(now.getTime()));
      setLS(STORAGE_LOG,  JSON.stringify(newLog));

      setLastScan(nowStr);
      setNextScan(nextStr);
      setScanLog(newLog);
      setScanLoading(false);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("RED Monitor — Scan terminé", {
          body: hasNew
            ? "🆕 Nouveaux textes réglementaires détectés !"
            : "✅ Aucune modification — votre veille est à jour.",
          icon: "/favicon.ico",
        });
      }
    }, 1800);
  };

  // ── Auto-scan si délai dépassé + demande permission notif ──────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const ts = parseInt(safeLS(STORAGE_TS, "0"), 10);
    if (Date.now() - ts >= SCAN_DAYS * 86_400_000) {
      runScan();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newCount = REGULATIONS.filter(r => r.isNew).length;

  const TABS = [
    { key: "accueil", icon: "🏠", label: "ACCUEIL"  },
    { key: "veille",  icon: "📋", label: "VEILLE"   },
    { key: "alertes", icon: "🔔", label: "ALERTES", badge: newCount },
  ];

  return (
    <div style={{
      background: S.bg, color: S.text,
      minHeight: "100vh", fontFamily: "system-ui, sans-serif",
      maxWidth: 480, margin: "0 auto", position: "relative",
    }}>
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: S.bg, borderBottom: `1px solid ${S.cardBorder}`,
        padding: "16px 18px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
            RED Monitor
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: S.muted }}>
            Directive 2014/53/UE · Textes ≥ 01/06/2026
          </p>
        </div>
        <div
          onClick={() => setTab("alertes")}
          style={{
            position: "relative", background: S.card,
            border: `1px solid ${S.cardBorder}`,
            padding: "10px 12px", borderRadius: 12, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 20 }}>🔔</span>
          {newCount > 0 && (
            <span style={{
              position: "absolute", top: 4, right: 4,
              background: S.frAccent, color: "#fff",
              borderRadius: "50%", width: 16, height: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700,
            }}>{newCount}</span>
          )}
        </div>
      </header>

      {/* ── CONTENU ─────────────────────────────────────────────────────────── */}
      <main>
        {tab === "accueil" && (
          <HomeTab
            lastScan={lastScan}
            nextScan={nextScan}
            onScan={runScan}
            scanLoading={scanLoading}
          />
        )}
        {tab === "veille"  && <VeilleTab />}
        {tab === "alertes" && (
          <AlertesTab lastScan={lastScan} nextScan={nextScan} scanLog={scanLog} />
        )}
      </main>

      {/* ── NAVIGATION ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: S.card, borderTop: `1px solid ${S.cardBorder}`,
        display: "flex", zIndex: 9999,
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: "10px 0",
              background: "transparent", border: "none",
              borderTop: tab === t.key ? `2px solid ${S.euAccent}` : "2px solid transparent",
              cursor: "pointer", position: "relative",
            }}
          >
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{
              fontSize: 9, fontWeight: 700, marginTop: 2,
              color: tab === t.key ? S.euAccent : S.muted,
              letterSpacing: "0.06em",
            }}>{t.label}</div>
            {t.badge > 0 && (
              <span style={{
                position: "absolute", top: 5, right: "26%",
                background: S.frAccent, color: "#fff",
                borderRadius: "50%", width: 14, height: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, fontWeight: 700,
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
