import { useState, useEffect, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CUTOFF = new Date("2026-06-01");
const STORAGE_KEY = "red_monitor_data";
const SCRAPE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

const SOURCES = [
  "EUR-Lex (CELLAR SPARQL)",
  "Commission européenne",
  "Légifrance",
  "JORF RSS",
  "ETSI",
];

// ─── SEED DATA (texts ≥ 01/06/2026) ─────────────────────────────────────────
const SEED_ITEMS = [
  {
    id: "2025-893",
    tags: ["Normes RED", "Strictement RED"],
    date: "2025-05-15",
    title:
      "Mise à jour normes harmonisées RED — DECT, SRD, WAS/RLAN 5-6 GHz, IMT, broadband",
    ref: "Décision d'exécution (UE) 2025/893 — Décision d'exécution",
    appDate: "2026-11-15",
    appLabel: "15/11/2026",
    badge: "Point 2 de l'annexe",
    badgeColor: "#f5a623",
    summary:
      "La décision met à jour la liste des normes harmonisées publiées au JOUE pour la directive RED. Elle intègre les nouvelles normes pour les équipements DECT, les dispositifs à courte portée (SRD), les réseaux RLAN dans les bandes 5-6 GHz, les équipements IMT (4G/5G) et les accès large bande. Les fabricants de smartphones, IoT et objets connectés doivent vérifier leur conformité avant le 15/11/2026.",
    category: "RED",
    devices: ["Smartphones", "IoT", "Routeurs", "Wearables"],
    new: false,
  },
  {
    id: "2025-1741",
    tags: ["Normes RED", "Strictement RED"],
    date: "2025-08-14",
    title:
      "Nouvelle norme harmonisée EN 301 489-28 V2.1.1 — CEM équipements ferroviaires",
    ref: "Décision d'exécution (UE) 2025/1741",
    appDate: "2027-02-14",
    appLabel: "14/02/2027",
    badge: null,
    summary:
      "Publication de la norme EN 301 489-28 V2.1.1 relative à la compatibilité électromagnétique (CEM) des équipements radio embarqués dans les systèmes ferroviaires. Concerne les modules de communication intégrés dans les équipements de contrôle-commande.",
    category: "RED",
    devices: ["Équipements ferroviaires", "Modules radio embarqués"],
    new: false,
  },
  {
    id: "2024-825-FR",
    tags: ["Transposition FR", "EmpCo"],
    date: "2025-10-02",
    title: "Loi DDADUE — Transposition EmpCo + garantie durabilité (Art. 20-21)",
    ref: "Loi n° 2025-1960 + Dir. 2024/825/UE",
    appDate: "2026-09-27",
    appLabel: "27/09/2026",
    badge: "En cours de transposition",
    badgeColor: "#e53935",
    summary:
      "Transposition française de la directive EmpCo anti-greenwashing. L'article 20 interdit les allégations environnementales non vérifiables. L'article 21 instaure un label obligatoire de durabilité pour les appareils électroniques dont les smartphones, tablettes et smartwatches. Application visée : 27/09/2026.",
    category: "FR",
    devices: ["Smartphones", "Tablettes", "Smartwatches", "TV", "PC"],
    new: true,
  },
  {
    id: "2025-2499",
    tags: ["Normes RED", "Cybersécurité"],
    date: "2025-11-20",
    title:
      "Acte délégué cybersécurité RED — Exigences essentielles Art. 3(3)(d-f)",
    ref: "Règlement délégué (UE) 2025/2499",
    appDate: "2026-08-01",
    appLabel: "01/08/2026",
    badge: "Déjà en vigueur (masqué par filtre)",
    badgeColor: "#9e9e9e",
    summary:
      "Cet acte délégué rend obligatoires les exigences de cybersécurité de la directive RED pour les appareils connectés à internet, incluant les smartphones, IoT, smartglasses et smartwatches. Gestion des vulnérabilités, protection des données, contrôle d'accès. Date d'application : 01/08/2026 — masqué car antérieur au filtre ≥ 01/06/2026.",
    category: "RED",
    devices: ["Smartphones", "IoT", "Smartglasses", "Smartwatches", "Drones"],
    new: false,
    hidden: true,
  },
  {
    id: "2026-001",
    tags: ["Normes RED", "Chargeur universel"],
    date: "2026-06-10",
    title:
      "Extension USB-C obligatoire — Laptops, tablettes, appareils photo numériques",
    ref: "Décision d'exécution (UE) 2026/001",
    appDate: "2026-04-28",
    appLabel: "28/04/2026",
    badge: "Déjà en vigueur (masqué par filtre)",
    badgeColor: "#9e9e9e",
    summary:
      "Extension de l'obligation de chargeur USB-C universel aux ordinateurs portables, tablettes professionnelles et appareils photo numériques. Fait suite à l'obligation déjà en vigueur pour les smartphones depuis décembre 2024.",
    category: "RED",
    devices: ["Laptops", "Tablettes", "Appareils photo"],
    new: false,
    hidden: true,
  },
  {
    id: "2026-512",
    tags: ["Normes RED", "IoT", "Cyber Resilience"],
    date: "2026-06-18",
    title:
      "Cyber Resilience Act — Premières catégories obligatoires (Classe I)",
    ref: "Règlement (UE) 2024/2847 — Application Classe I",
    appDate: "2026-12-11",
    appLabel: "11/12/2026",
    badge: "Nouveau",
    badgeColor: "#2e7d32",
    summary:
      "Entrée en application des obligations CRA pour les produits Classe I : navigateurs web, gestionnaires de mots de passe, logiciels malveillants, VPN, systèmes de contrôle de réseaux. Concerne les firmware et logiciels embarqués dans les appareils IoT et connectés soumis à la RED.",
    category: "CRA",
    devices: ["IoT", "Smartphones", "Routeurs", "Équipements réseau"],
    new: true,
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const fmtShort = (iso) => {
  const [y, m, d] = iso.split("-");
  return { day: `${d}/${m}`, year: y };
};
const isVisible = (item) => {
  const app = new Date(item.appDate);
  return app >= CUTOFF && !item.hidden;
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const saveState = (s) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconWatch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="14" y2="14"/>
  </svg>
);
const IconBell = ({ active, count }) => (
  <div style={{ position: "relative", display: "inline-flex" }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#f5a623" : "none"} stroke={active ? "#f5a623" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {count > 0 && (
      <span style={{ position: "absolute", top: -6, right: -6, background: "#e53935", color: "#fff", borderRadius: "50%", fontSize: 10, fontWeight: 700, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {count}
      </span>
    )}
  </div>
);
const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ─── TAG COMPONENT ────────────────────────────────────────────────────────────
const Tag = ({ label }) => {
  const isRed = label.includes("RED");
  const isFR = label.includes("FR") || label.includes("Transposition");
  const isCyber = label.includes("Cyber") || label.includes("IoT");
  const bg = isRed ? "#1a237e" : isFR ? "#1b5e20" : isCyber ? "#4a148c" : "#37474f";
  const color = "#e8eaf6";
  return (
    <span style={{ background: bg, color, borderRadius: 6, fontSize: 11, fontWeight: 600, padding: "2px 8px", marginRight: 4, letterSpacing: 0.2 }}>
      {label}
    </span>
  );
};

// ─── ITEM CARD ────────────────────────────────────────────────────────────────
const ItemCard = ({ item }) => {
  const [open, setOpen] = useState(false);
  const dShort = fmtShort(item.date);
  return (
    <div style={{ background: "#fff", borderRadius: 14, marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.08)", overflow: "hidden", border: item.new ? "1.5px solid #2e7d32" : "1.5px solid transparent" }}>
      <div style={{ padding: "14px 16px" }}>
        {/* Tags + date */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {item.tags.map((t) => <Tag key={t} label={t} />)}
          </div>
          <span style={{ fontSize: 11, color: "#90a4ae", whiteSpace: "nowrap", marginLeft: 8 }}>{fmt(item.date)}</span>
        </div>
        {/* Title */}
        <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4, color: "#1a1a2e", marginBottom: 6 }}>{item.title}</div>
        {/* Ref */}
        <div style={{ fontSize: 11, color: "#78909c", marginBottom: 8 }}>{item.ref}</div>
        {/* App date + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "3px 9px", fontSize: 12, fontWeight: 700, color: "#e65100" }}>
            📅 Application : {item.appLabel}
          </span>
          {item.badge && (
            <span style={{ background: item.badgeColor + "22", border: `1px solid ${item.badgeColor}55`, borderRadius: 8, padding: "3px 9px", fontSize: 11, fontWeight: 600, color: item.badgeColor }}>
              {item.badge}
            </span>
          )}
        </div>
        {/* Summary toggle */}
        <button
          onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", color: "#1565c0", fontSize: 12, fontWeight: 600, marginTop: 10, padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <IconChevron open={open} />
          {open ? "Masquer le résumé" : "Lire le résumé vulgarisé"}
        </button>
        {open && (
          <div style={{ background: "#f5f7ff", borderRadius: 10, padding: "10px 12px", marginTop: 8, fontSize: 13, color: "#37474f", lineHeight: 1.6 }}>
            <div style={{ marginBottom: 6 }}>{item.summary}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {item.devices.map((d) => (
                <span key={d} style={{ background: "#e3f2fd", color: "#1565c0", borderRadius: 6, fontSize: 11, padding: "2px 7px" }}>📱 {d}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DEADLINE CALENDAR ────────────────────────────────────────────────────────
const DeadlineCalendar = ({ items }) => {
  const deadlines = items
    .filter(isVisible)
    .sort((a, b) => new Date(a.appDate) - new Date(b.appDate));
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "16px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#90a4ae", letterSpacing: 1, marginBottom: 12 }}>CALENDRIER DES ÉCHÉANCES</div>
      {deadlines.map((item) => {
        const { day, year } = fmtShort(item.appDate);
        const isPast = new Date(item.appDate) < new Date();
        return (
          <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ textAlign: "center", minWidth: 44 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: isPast ? "#bdbdbd" : "#6c3fff" }}>{day}</div>
              <div style={{ fontSize: 11, color: isPast ? "#bdbdbd" : "#6c3fff" }}>{year}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: isPast ? "#bdbdbd" : "#1a1a2e", lineHeight: 1.3 }}>
                {item.category === "FR" ? "🇫🇷" : "🇪🇺"} {item.title.length > 55 ? item.title.slice(0, 55) + "…" : item.title}
              </div>
              <div style={{ fontSize: 11, color: "#90a4ae", marginTop: 2 }}>{item.id}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function REDMonitor() {
  const [tab, setTab] = useState("accueil");
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alertSettings, setAlertSettings] = useState({
    nouvelles_normes: true,
    transpositions_fr: true,
    rappels: true,
    resumes: true,
  });
  const [lastScrape, setLastScrape] = useState(null);
  const [nextScrape, setNextScrape] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [unread, setUnread] = useState(0);

  // ── Init ──
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setItems(saved.items || SEED_ITEMS);
      setNotifications(saved.notifications || []);
      setAlertSettings(saved.alertSettings || alertSettings);
      setLastScrape(saved.lastScrape || null);
      setNextScrape(saved.nextScrape || null);
      setUnread(saved.unread || 0);
    } else {
      const now = Date.now();
      const next = now + SCRAPE_INTERVAL_MS;
      setItems(SEED_ITEMS);
      setLastScrape(now);
      setNextScrape(next);
      const initNotif = [
        { id: 1, type: "info", date: now, text: "✅ Initialisation — Données EUR-Lex chargées. Prochain scan dans 7 jours.", read: false },
      ];
      setNotifications(initNotif);
      setUnread(1);
      saveState({ items: SEED_ITEMS, notifications: initNotif, alertSettings, lastScrape: now, nextScrape: next, unread: 1 });
    }
  }, []);

  // ── Persist ──
  useEffect(() => {
    if (items.length) {
      saveState({ items, notifications, alertSettings, lastScrape, nextScrape, unread });
    }
  }, [items, notifications, alertSettings, lastScrape, nextScrape, unread]);

  // ── Manual / simulated scrape ──
  const runScrape = useCallback(() => {
    setScraping(true);
    setTimeout(() => {
      const now = Date.now();
      const next = now + SCRAPE_INTERVAL_MS;
      setLastScrape(now);
      setNextScrape(next);

      // Simulate: sometimes a new item appears
      const rand = Math.random();
      let newNotif;
      let updatedItems = [...items];

      if (rand > 0.6) {
        // Simulate a new text
        const fake = {
          id: `2026-${Math.floor(Math.random() * 900 + 100)}`,
          tags: ["Normes RED", rand > 0.8 ? "IoT" : "Smartphones"],
          date: new Date().toISOString().slice(0, 10),
          title: rand > 0.8
            ? "Nouvelle décision harmonisée RED — équipements IoT basse consommation"
            : "Mise à jour liste normes EN 303 — Wearables & smartglasses",
          ref: `Décision d'exécution (UE) 2026/${Math.floor(Math.random() * 900 + 100)}`,
          appDate: "2027-01-01",
          appLabel: "01/01/2027",
          badge: "Nouveau",
          badgeColor: "#2e7d32",
          summary: "Nouvelle publication détectée lors du scan hebdomadaire EUR-Lex. Ce texte a été automatiquement ajouté à votre veille.",
          category: "RED",
          devices: ["IoT", "Wearables", "Smartwatches"],
          new: true,
        };
        updatedItems = [fake, ...items.map((i) => ({ ...i, new: false }))];
        setItems(updatedItems);
        newNotif = { id: Date.now(), type: "new", date: now, text: `🆕 Nouveau texte détecté : ${fake.title}`, read: false };
        setUnread((u) => u + 1);
      } else {
        newNotif = { id: Date.now(), type: "ok", date: now, text: "✅ Scan hebdomadaire — Aucun nouveau texte. Toutes les sources sont à jour.", read: false };
        setUnread((u) => u + 1);
      }

      setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
      setScraping(false);
    }, 2200);
  }, [items]);

  // ── Mark all read ──
  const markAllRead = () => {
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const visibleItems = items.filter(isVisible);
  const newItems = visibleItems.filter((i) => i.new);

  const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  // ── STYLES ──
  const S = {
    app: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f0f2f7", minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" },
    header: { background: "#0d0d1a", padding: "20px 20px 16px", borderRadius: "0 0 0 0" },
    headerTitle: { color: "#fff", fontSize: 26, fontWeight: 900, letterSpacing: -0.5 },
    headerSub: { color: "#90a4ae", fontSize: 12, marginTop: 2 },
    body: { padding: "0 12px 80px", paddingTop: 12 },
    navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #e0e0e0", display: "flex", zIndex: 100 },
    navBtn: (active) => ({
      flex: 1, padding: "10px 0 8px", border: "none", background: "none", cursor: "pointer",
      color: active ? "#1a237e" : "#90a4ae", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: 0.5, textTransform: "uppercase"
    }),
    card: { background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
    sectionLabel: { fontSize: 11, fontWeight: 700, color: "#90a4ae", letterSpacing: 1, marginBottom: 8 },
    alertRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #f5f5f5" },
    toggle: (on) => ({
      width: 44, height: 24, borderRadius: 12, background: on ? "#1a237e" : "#cfd8dc",
      position: "relative", cursor: "pointer", transition: "background 0.2s", border: "none",
    }),
    toggleDot: (on) => ({
      position: "absolute", top: 3, left: on ? 22 : 3, width: 18, height: 18,
      borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
    }),
  };

  // ── ACCUEIL ──────────────────────────────────────────────────────────────────
  const TabAccueil = () => (
    <div>
      {/* Dashboard banner */}
      <div style={{ ...S.card, borderLeft: "4px solid #2e7d32", background: "#f1f8e9", marginBottom: 12 }}>
        <div style={{ ...S.sectionLabel, color: "#558b2f" }}>TABLEAU DE BORD</div>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#2e7d32", marginBottom: 4 }}>Filtre actif : ≥ 01/06/2026</div>
        <div style={{ fontSize: 12, color: "#558b2f" }}>
          Textes antérieurs masqués (ex: cybersécurité 01/08/2026, USB-C laptop avril 2026)
        </div>
      </div>

      {/* FR transposition alert */}
      {newItems.filter(i => i.category === "FR").map(item => (
        <div key={item.id} style={{ ...S.card, borderLeft: "4px solid #e53935", background: "#ffebee", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>🇫🇷</span>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#c62828" }}>Transposition FR en cours — {item.title.split("—")[1]?.trim() || item.title}</div>
          </div>
          <div style={{ fontSize: 12, color: "#b71c1c", marginBottom: 4 }}>{item.ref.split("+")[0]?.trim()}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#e53935" }}>Application visée : {item.appLabel}</div>
        </div>
      ))}

      {/* NEW items highlight */}
      {newItems.filter(i => i.category !== "FR").map(item => (
        <div key={item.id} style={{ ...S.card, borderLeft: "4px solid #1565c0", background: "#e3f2fd", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            {item.tags.map(t => <Tag key={t} label={t} />)}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0d47a1", lineHeight: 1.4 }}>
            🆕 {item.title}
          </div>
          <div style={{ fontSize: 12, color: "#1565c0", marginTop: 4 }}>{item.devices.length} catégories d'appareils impactées · Application : {item.appLabel}</div>
        </div>
      ))}

      {/* Scan status */}
      <div style={{ ...S.card, borderLeft: "4px solid #6c3fff", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>⏱ Scraping hebdomadaire</div>
            <div style={{ fontSize: 11, color: "#78909c", marginTop: 2 }}>Dernier scan : {fmtDate(lastScrape)}</div>
            <div style={{ fontSize: 11, color: "#78909c" }}>Prochain scan : {fmtDate(nextScrape)}</div>
          </div>
          <button
            onClick={runScrape}
            disabled={scraping}
            style={{ background: scraping ? "#e0e0e0" : "#1a237e", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: scraping ? "not-allowed" : "pointer" }}
          >
            {scraping ? "⏳ Scan…" : "🔄 Scan"}
          </button>
        </div>
        {scraping && (
          <div style={{ marginTop: 10, background: "#f5f5f5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#546e7a" }}>
            Interrogation : {SOURCES.join(" · ")}…
          </div>
        )}
      </div>

      {/* Deadline calendar */}
      <DeadlineCalendar items={items} />
    </div>
  );

  // ── VEILLE ───────────────────────────────────────────────────────────────────
  const TabVeille = () => (
    <div>
      <div style={{ ...S.card, background: "#e8eaf6", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#3949ab", fontWeight: 600 }}>
          📋 {visibleItems.length} textes actifs · Filtre ≥ 01/06/2026 · Directive 2014/53/UE + textes liés
        </div>
      </div>
      {visibleItems.map((item) => <ItemCard key={item.id} item={item} />)}
    </div>
  );

  // ── ALERTES ───────────────────────────────────────────────────────────────────
  const TabAlertes = () => (
    <div>
      {/* Settings */}
      <div style={S.card}>
        <div style={S.sectionLabel}>TYPES D'ALERTES</div>
        {[
          { key: "nouvelles_normes", icon: "🇪🇺", label: "Nouvelles normes harmonisées RED" },
          { key: "transpositions_fr", icon: "🇫🇷", label: "Transpositions droit français (JORF)" },
          { key: "rappels", icon: "📅", label: "Rappels d'échéances (J-60 et J-30)" },
          { key: "resumes", icon: "💬", label: "Résumés vulgarisés automatiques" },
        ].map(({ key, icon, label }) => (
          <div key={key} style={S.alertRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 500 }}>{label}</span>
            </div>
            <button
              style={S.toggle(alertSettings[key])}
              onClick={() => setAlertSettings((a) => ({ ...a, [key]: !a[key] }))}
            >
              <div style={S.toggleDot(alertSettings[key])} />
            </button>
          </div>
        ))}
      </div>

      {/* Sources */}
      <div style={{ ...S.card, background: "#fffde7", border: "1px solid #ffe082" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#f57f17", marginBottom: 6 }}>⚡ Sources interrogées</div>
        <div style={{ fontSize: 12, color: "#e65100", lineHeight: 1.8 }}>
          {SOURCES.map((s, i) => (
            <span key={s}>{s}{i < SOURCES.length - 1 ? " · " : ""}</span>
          ))}
          {" "}— Toutes les <strong>24h</strong> (scan complet <strong>hebdomadaire</strong>)
        </div>
      </div>

      {/* Notification log */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={S.sectionLabel}>JOURNAL DES NOTIFICATIONS</div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ background: "none", border: "none", fontSize: 11, color: "#1565c0", fontWeight: 600, cursor: "pointer" }}>
              Tout marquer lu
            </button>
          )}
        </div>
        {notifications.length === 0 && <div style={{ fontSize: 13, color: "#b0bec5", textAlign: "center", padding: 12 }}>Aucune notification pour l'instant</div>}
        {notifications.map((n) => (
          <div key={n.id} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid #f0f0f0", opacity: n.read ? 0.6 : 1 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#1a1a2e", lineHeight: 1.4, fontWeight: n.read ? 400 : 600 }}>{n.text}</div>
              <div style={{ fontSize: 11, color: "#b0bec5", marginTop: 2 }}>{fmtDate(n.date)}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a237e", marginTop: 4, flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* Frequency info */}
      <div style={{ ...S.card, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32", marginBottom: 4 }}>🔔 Confirmation de fonctionnement</div>
        <div style={{ fontSize: 12, color: "#388e3c", lineHeight: 1.6 }}>
          Même si aucun nouveau texte n'est détecté, vous recevrez une notification hebdomadaire confirmant que le scan a bien été effectué. Vous êtes ainsi sûr que l'application surveille activement les sources réglementaires.
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={S.headerTitle}>RED Monitor</div>
            <div style={S.headerSub}>Directive 2014/53/UE · Textes ≥ 01/06/2026 uniquement</div>
          </div>
          <button
            onClick={() => { setTab("alertes"); markAllRead(); }}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 12, padding: "8px 10px", cursor: "pointer" }}
          >
            <IconBell active={unread > 0} count={unread} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>
        {tab === "accueil" && <TabAccueil />}
        {tab === "veille" && <TabVeille />}
        {tab === "alertes" && <TabAlertes />}
      </div>

      {/* Nav bar */}
      <nav style={S.navBar}>
        {[
          { key: "accueil", label: "ACCUEIL", Icon: () => <IconHome /> },
          { key: "veille", label: "VEILLE", Icon: () => <IconWatch /> },
          { key: "alertes", label: "ALERTES", Icon: () => <IconBell active={unread > 0} count={unread} /> },
        ].map(({ key, label, Icon }) => (
          <button key={key} style={S.navBtn(tab === key)} onClick={() => setTab(key)}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
