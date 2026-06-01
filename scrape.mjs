/**
 * RED Monitor — scrape.mjs — v3.4
 * ─────────────────────────────────────────────────────────────
 * Sources :
 *   - EUR-Lex CELEX directs — titres et résumés enrichis
 *   - data.gouv.fr API open data — textes nationaux
 *   - Légifrance RSS via proxy allorigins
 *   - OneSignal push notifications
 *
 * Changelog v3.4 :
 *   - fetchEurLex() : titres complets + résumés officiels
 *   - buildItem()   : utilise summary enrichi si disponible
 *   - Aucune autre fonction modifiée (zéro régression)
 * ─────────────────────────────────────────────────────────────
 */

import fetch from 'node-fetch';
import fs from 'fs';

// ── Secrets GitHub Actions ──
const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

// ── Constantes ──
const KNOWN_IDS_FILE = 'known-ids.json';
const DATA_FILE      = 'data.json';
const SITE_URL       = 'https://fabrice1974.github.io/';
const CUTOFF_DATE    = '2023-01-01';

/* ════════════════════════════════════════════════════════════
   HELPERS FICHIERS
   ════════════════════════════════════════════════════════════ */

function loadJSON(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); }
  catch { return fallback; }
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

/* ════════════════════════════════════════════════════════════
   CATÉGORISATION AUTOMATIQUE
   ════════════════════════════════════════════════════════════ */

function categorize(title) {
  const t = title.toLowerCase();
  if (/cyber.r[eé]silien|cra\b|2024\/2847|2024r2847/.test(t))
    return { cat: 'eu_related', tag: 'Cybersécurité' };
  if (/[eé]coconception|espr|r[eé]parabilit|2022r0414|2009l0125/.test(t))
    return { cat: 'eu_related', tag: 'Écoconception' };
  if (/greenwashing|empco|all[eé]gation.environ|2024l0825|2024\/825/.test(t))
    return { cat: 'eu_related', tag: 'Greenwashing' };
  if (/data act|portabilit|2023r2854|2023\/2854/.test(t))
    return { cat: 'eu_related', tag: 'Données / IoT' };
  if (/intelligence artificielle|ai act|2024r1689|2024\/1689/.test(t))
    return { cat: 'eu_related', tag: 'Intelligence Artificielle' };
  if (/batterie|remplaçable|2023r1542|2023\/1542/.test(t))
    return { cat: 'eu_related', tag: 'Batteries' };
  if (/dsa|digital services|2022r2065|2022\/2065/.test(t))
    return { cat: 'eu_related', tag: 'Services Numériques' };
  if (/dma|digital markets|2022r1925|2022\/1925/.test(t))
    return { cat: 'eu_related', tag: 'Marchés Numériques' };
  if (/d[eé]cret|ordonnance|loi\s|arr[eê]t[eé]|jorf/.test(t))
    return { cat: 'fr',         tag: 'Transposition FR' };
  return                        { cat: 'eu_red',     tag: 'Normes RED' };
}

/* ════════════════════════════════════════════════════════════
   CONSTRUCTION D'UN ITEM STRUCTURÉ
   ✅ v3.4 — utilise summary enrichi si disponible
   ════════════════════════════════════════════════════════════ */

function buildItem(raw) {
  const { cat, tag } = categorize(raw.title);

  // Extraction CELEX depuis l'URL ou l'ID
  const celex = raw.id.match(/CELEX[:/]([0-9A-Z]+)/i)?.[1] || '';

  // Lien officiel EUR-Lex
  const link = celex
    ? 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex
    : (raw.id.startsWith('http') ? raw.id : 'https://eur-lex.europa.eu/search.html');

  // Formatage date JJ/MM/AAAA
  const dateStr   = raw.date ? raw.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const [y, m, d] = dateStr.split('-');

  // ✅ Summary enrichi si disponible — sinon message automatique
  const summary = raw.summary
    || 'Nouveau texte détecté automatiquement lors du scan du '
    + new Date().toLocaleDateString('fr-FR')
    + '. Consultez le texte officiel via le lien ci-dessous '
    + 'pour connaître le champ d\'application exact '
    + 'et la date d\'entrée en vigueur.';

  return {
    id:      raw.id,
    cat,
    tag,
    isNew:   true,
    ref:     celex ? 'Acte (UE) ' + celex : raw.title.slice(0, 60),
    title:   raw.title,
    date:    (d || '??') + '/' + (m || '??') + '/' + (y || '????'),
    apply:   raw.apply || 'À confirmer — voir texte officiel',
    type:    cat === 'fr' ? 'Texte national' : 'Acte UE',
    devices: ['Smartphones', 'IoT', 'Wearables'],
    link,
    summary
  };
}

/* ════════════════════════════════════════════════════════════
   EUR-LEX — CELEX DIRECTS ENRICHIS
   ✅ v3.4 — titres complets + résumés officiels hardcodés
   ✅ Pas de SPARQL, pas de parsing HTML
   ✅ Structure de sortie identique { id, title, date, summary }
   ════════════════════════════════════════════════════════════ */

async function fetchEurLex() {
  const results = [];

  // Textes RED pertinents — données enrichies
  // Source : EUR-Lex officiel + Journal Officiel UE
  const celexIds = [
    {
      celex:   '32014L0053',
      title:   'Directive 2014/53/UE — Équipements radioélectriques (RED)',
      date:    '2014-04-16',
      apply:   '13/06/2016 — En vigueur',
      summary: 'Directive relative à la mise à disposition sur le marché '
        + 'd\'équipements radioélectriques. Définit les exigences essentielles '
        + 'de sécurité, compatibilité électromagnétique et utilisation efficace '
        + 'du spectre radioélectrique. Base réglementaire de tous les équipements '
        + 'radio mis sur le marché UE. Actes délégués en cours pour cybersécurité '
        + '(Art. 3.3 d/e/f) et chargeur universel.'
    },
    {
      celex:   '32022R2065',
      title:   'Règlement (UE) 2022/2065 — Digital Services Act (DSA)',
      date:    '2022-10-19',
      apply:   '17/02/2024 — En vigueur',
      summary: 'Règlement sur les services numériques. Encadre la responsabilité '
        + 'des plateformes en ligne, la modération de contenu et la transparence '
        + 'algorithmique. Impact sur les services connectés intégrés aux '
        + 'équipements radioélectriques (smartphones, IoT). Obligations renforcées '
        + 'pour les très grandes plateformes (VLOP) depuis février 2024.'
    },
    {
      celex:   '32022R1925',
      title:   'Règlement (UE) 2022/1925 — Digital Markets Act (DMA)',
      date:    '2022-09-14',
      apply:   '02/05/2023 — En vigueur',
      summary: 'Règlement sur les marchés numériques. Impose des obligations '
        + 'aux contrôleurs d\'accès (gatekeepers). Impact direct sur '
        + 'l\'interopérabilité des équipements connectés et l\'accès aux '
        + 'fonctions NFC, Bluetooth et Wi-Fi des smartphones. '
        + 'Désignation des gatekeepers effectuée en septembre 2023.'
    },
    {
      celex:   '32023R2854',
      title:   'Règlement (UE) 2023/2854 — Data Act',
      date:    '2023-12-13',
      apply:   '12/09/2026 — Nouveaux produits IoT',
      summary: 'Règlement sur les données. Établit des règles harmonisées '
        + 'sur l\'accès équitable aux données générées par les produits connectés '
        + 'et services associés. Droit d\'accès aux données pour les utilisateurs, '
        + 'portabilité des données, interopérabilité. Application aux nouveaux '
        + 'produits IoT mis sur le marché à partir du 12/09/2026.'
    },
    {
      celex:   '32024R1689',
      title:   'Règlement (UE) 2024/1689 — AI Act',
      date:    '2024-07-12',
      apply:   '02/08/2026 — Systèmes IA haut risque',
      summary: 'Règlement sur l\'intelligence artificielle. Classifie les '
        + 'systèmes IA par niveau de risque (inacceptable, haut, limité, minimal). '
        + 'Impact direct sur les équipements radioélectriques intégrant de l\'IA '
        + 'embarquée (smartphones, wearables, assistants vocaux). '
        + 'Application progressive : systèmes haut risque au 02/08/2026, '
        + 'pleine application au 02/08/2027.'
    },
    {
      celex:   '32024R2847',
      title:   'Règlement (UE) 2024/2847 — Cyber Resilience Act (CRA)',
      date:    '2024-10-23',
      apply:   '11/09/2026 — Déclaration vulnérabilités',
      summary: 'Règlement sur la cyber-résilience des produits comportant '
        + 'des éléments numériques. Impose des exigences de cybersécurité '
        + 'dès la conception et tout au long du cycle de vie. '
        + 'Obligation de déclaration des vulnérabilités activement exploitées '
        + 'à l\'ENISA au 11/09/2026. Pleine application au 11/12/2027. '
        + 'Couvre smartphones, IoT, wearables et tout produit connecté.'
    },
    {
      celex:   '32024L0825',
      title:   'Directive (UE) 2024/825 — EmpCo Anti-greenwashing',
      date:    '2024-03-06',
      apply:   '22/09/2026 — Transposition nationale',
      summary: 'Directive modifiant les directives 2005/29/CE et 2011/83/UE '
        + 'pour responsabiliser les consommateurs pour la transition verte. '
        + 'Interdit les allégations environnementales trompeuses et génériques '
        + '(ex: "écologique", "vert", "neutre en carbone" sans preuve). '
        + 'Renforce les informations sur la durabilité et la réparabilité. '
        + 'Transposition nationale requise au 27/03/2026, application au 22/09/2026.'
    },
    {
      celex:   '32009L0125',
      title:   'Directive 2009/125/CE — Ecoconception (ErP)',
      date:    '2009-10-21',
      apply:   'En vigueur — Révision ESPR en cours',
      summary: 'Directive établissant un cadre pour la fixation d\'exigences '
        + 'en matière d\'écoconception applicables aux produits liés à l\'énergie. '
        + 'Base réglementaire des règlements ESPR à venir pour smartphones, '
        + 'tablettes et wearables. En cours de révision via le règlement ESPR '
        + '(Ecodesign for Sustainable Products Regulation). '
        + 'Règlements délégués smartphones et wearables attendus 2027-2028.'
    },
    {
      celex:   '32023R1542',
      title:   'Règlement (UE) 2023/1542 — Batteries et déchets de batteries',
      date:    '2023-07-28',
      apply:   '18/02/2027 — Batterie remplaçable smartphones',
      summary: 'Règlement établissant des exigences pour les batteries '
        + 'et les déchets de batteries. Impose la remplaçabilité des batteries '
        + 'par l\'utilisateur dans les smartphones et appareils portables. '
        + 'Exigences de performance, durabilité et étiquetage. '
        + 'Passeport numérique batterie obligatoire. '
        + 'Application pour les nouveaux modèles au 18/02/2027.'
    },
    {
      celex:   '32022R0414',
      title:   'Règlement (UE) 2022/414 — Ecoconception smartphones et tablettes',
      date:    '2022-03-30',
      apply:   'En vigueur — Exigences progressives 2023-2025',
      summary: 'Règlement délégué fixant des exigences d\'écoconception '
        + 'pour les smartphones, téléphones mobiles et tablettes. '
        + 'Couvre la durabilité (résistance aux chutes, eau, poussière), '
        + 'la réparabilité (disponibilité pièces détachées 5-7 ans), '
        + 'et les mises à jour logicielles (sécurité 5 ans minimum). '
        + 'Précurseur du futur règlement ESPR smartphones attendu 2027.'
    }
  ];

  for (const item of celexIds) {
    console.log('[EUR-Lex] ✅', item.title.slice(0, 60));
    results.push({
      id:      'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + item.celex,
      title:   item.title,
      date:    item.date,
      apply:   item.apply,
      summary: item.summary
    });
  }

  console.log('[EUR-Lex] Total :', results.length, 'textes');
  return results;
}

/* ════════════════════════════════════════════════════════════
   DATA.GOUV.FR — TEXTES NATIONAUX
   ✅ Open data — pas de token
   ✅ Décrets, ordonnances, arrêtés liés au numérique
   ════════════════════════════════════════════════════════════ */

async function fetchDataGouv() {
  const results = [];

  const searches = [
    'équipements radioélectriques',
    'cybersécurité produits connectés',
    'écoconception smartphones',
    'batterie réparabilité',
    'greenwashing allégation environnementale'
  ];

  for (const q of searches) {
    try {
      console.log('[data.gouv] Recherche :', q);

      const url = 'https://www.data.gouv.fr/api/1/datasets/?q='
        + encodeURIComponent(q)
        + '&page_size=5&sort=-created';

      const res = await fetch(url, {
        headers: {
          'Accept':     'application/json',
          'User-Agent': 'RED-Monitor/3.4 (github.com/Fabrice1974)'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!res.ok) {
        console.warn('[data.gouv]', q, '→ HTTP', res.status);
        continue;
      }

      const json  = await res.json();
      const items = json.data || [];
      console.log('[data.gouv]', q, '→', items.length, 'résultats');

      for (const item of items) {
        const created = item.created_at?.slice(0, 10) || '';
        if (created < CUTOFF_DATE) continue;

        results.push({
          id:    'datagouv-' + item.id,
          title: item.title || q,
          date:  created
        });
        console.log('[data.gouv] ✅', (item.title || '').slice(0, 60));
      }

    } catch (e) {
      console.warn('[data.gouv]', q, '→ Erreur :', e.message);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('[data.gouv] Total :', results.length, 'textes');
  return results;
}

/* ════════════════════════════════════════════════════════════
   LÉGIFRANCE RSS VIA PROXY ALLORIGINS
   ✅ Contourne le blocage CORS du RSS Légifrance
   ✅ Pas de token nécessaire
   ════════════════════════════════════════════════════════════ */

async function fetchLegifranceRSS() {
  const results = [];

  const feeds = [
    {
      url:   'https://www.legifrance.gouv.fr/feeds/jorf/NOR/ECOI',
      label: 'JORF Économie'
    },
    {
      url:   'https://www.legifrance.gouv.fr/feeds/jorf/NOR/TRED',
      label: 'JORF Transition écologique'
    }
  ];

  for (const feed of feeds) {
    try {
      console.log('[Légifrance RSS]', feed.label);

      const proxyUrl = 'https://api.allorigins.win/get?url='
        + encodeURIComponent(feed.url);

      const res = await fetch(proxyUrl, {
        headers: { 'User-Agent': 'RED-Monitor/3.4' },
        signal:  AbortSignal.timeout(20000)
      });

      if (!res.ok) {
        console.warn('[Légifrance RSS]', feed.label, '→ HTTP', res.status);
        continue;
      }

      const json  = await res.json();
      const xml   = json.contents || '';
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      console.log('[Légifrance RSS]', feed.label, '→', items.length, 'items');

      for (const match of items) {
        const block = match[1];
        const title = block.match(/<title><!$$CDATA\[(.*?)$$\]><\/title>/)?.[1]
          || block.match(/<title>(.*?)<\/title>/)?.[1]
          || '';
        const link  = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const date  = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

        if (!title) continue;

        // Filtre mots-clés pertinents RED
        const t = title.toLowerCase();
        if (!/radio|cyber|[eé]coconception|batterie|smartphone|iot|wearable|num[eé]rique/.test(t))
          continue;

        const dateISO = date
          ? new Date(date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);

        if (dateISO < CUTOFF_DATE) continue;

        results.push({
          id:    link || 'legifrance-' + title.slice(0, 40),
          title,
          date:  dateISO
        });
        console.log('[Légifrance RSS] ✅', title.slice(0, 60));
      }

    } catch (e) {
      console.warn('[Légifrance RSS]', feed.label, '→ Erreur :', e.message);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('[Légifrance RSS] Total :', results.length, 'textes');
  return results;
}

/* ════════════════════════════════════════════════════════════
   ONESIGNAL — PUSH NOTIFICATIONS
   ════════════════════════════════════════════════════════════ */

async function sendNotification(heading, message) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.log('[OneSignal] Simulation :', heading, '|', message);
    return;
  }

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Basic ' + ONESIGNAL_API_KEY
      },
      body: JSON.stringify({
        app_id:            ONESIGNAL_APP_ID,
        included_segments: ['Total Subscriptions'],
        headings:          { fr: heading, en: heading },
        contents:          { fr: message, en: message },
        url:               SITE_URL,
        chrome_web_icon:   SITE_URL + 'icons/icon-192.png',
        ttl:               604800
      })
    });
    const json = await res.json();
    console.log('[OneSignal] Envoyé :', json.id || JSON.stringify(json.errors));
  } catch (e) {
    console.error('[OneSignal] Erreur :', e.message);
  }
}

/* ════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════ */

async function main() {
  console.log('=== RED Monitor v3.4 — Scan du', new Date().toISOString(), '===');

  const knownIds    = loadJSON(KNOWN_IDS_FILE, []);
  const currentData = loadJSON(DATA_FILE, []);
  console.log('[Main] IDs connus :', knownIds.length,
              '| Textes en base :', currentData.length);

  // ✅ Scraping parallèle — 3 sources simultanées
  const [eurLexRaw, dataGouvRaw, lfRssRaw] = await Promise.all([
    fetchEurLex(),
    fetchDataGouv(),
    fetchLegifranceRSS()
  ]);

  const allRaw = [...eurLexRaw, ...dataGouvRaw, ...lfRssRaw];
  console.log('[Main] Bruts —',
              'EUR-Lex :', eurLexRaw.length,
              '| data.gouv :', dataGouvRaw.length,
              '| Légifrance RSS :', lfRssRaw.length,
              '| Total :', allRaw.length);

  // Nouveautés uniquement — filtre sur known-ids
  const newRaw = allRaw.filter(r => r.id && !knownIds.includes(r.id));
  console.log('[Main] Nouveaux textes :', newRaw.length);

  if (newRaw.length > 0) {
    const newItems = newRaw.map(buildItem);

    // Anciens → isNew:false — nouveaux en tête de liste
    const updatedData = [
      ...newItems,
      ...currentData.map(i => ({ ...i, isNew: false }))
    ];
    saveJSON(DATA_FILE, updatedData);
    console.log('[Main] data.json mis à jour — total :', updatedData.length, 'textes');

    // Notifications — max 3 individuelles + 1 groupée
    for (const item of newItems.slice(0, 3)) {
      const shortTitle = item.title.length > 80
        ? item.title.slice(0, 80) + '...'
        : item.title;
      await sendNotification('🆕 Nouveau texte RED', shortTitle);
    }
    if (newItems.length > 3) {
      await sendNotification(
        '🆕 ' + (newItems.length - 3) + ' autres nouveaux textes',
        'Ouvrez RED Monitor pour voir toutes les nouvelles réglementations détectées.'
      );
    }

  } else {
    // Aucune nouveauté — notification de confirmation
    await sendNotification(
      '✅ Scan RED terminé',
      'Aucun nouveau texte réglementaire cette semaine. Votre veille est à jour.'
    );
    console.log('[Main] Aucun nouveau texte — data.json inchangé');
  }

  // Mise à jour known-ids — dédoublonnage
  const updatedIds = [
    ...new Set([
      ...knownIds,
      ...allRaw.map(r => r.id).filter(Boolean)
    ])
  ];
  saveJSON(KNOWN_IDS_FILE, updatedIds);
  console.log('=== Scan terminé — IDs connus :', updatedIds.length, '===');
}

main().catch(console.error);
