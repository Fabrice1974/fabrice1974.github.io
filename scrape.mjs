/**
 * RED Monitor — scrape.mjs — v4.0
 * Sources :
 *   - EUR-Lex SPARQL (détection live des nouveautés) + socle de textes de référence
 *   - data.gouv.fr API open data
 *   - Légifrance RSS via proxy allorigins
 *   - OneSignal push notifications
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

/* ── HELPERS FICHIERS ── */

function loadJSON(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); }
  catch { return fallback; }
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

/* ── CATÉGORISATION AUTOMATIQUE ── */

function categorize(title) {
  const t = title.toLowerCase();
  if (/cyber.r[eé]silien|cra\b|2024\/2847|2024r2847/.test(t))
    return { cat: 'eu_related', tag: 'Cybersécurité' };
  if (/[eé]coconception|espr|r[eé]parabilit|2023r1670|2023\/1670|2022r0414|2009l0125/.test(t))
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

/* ── CONSTRUCTION D'UN ITEM STRUCTURÉ ── */

function buildItem(raw) {
  const { cat, tag } = categorize(raw.title);

  const celex = raw.id.match(/CELEX[:/]([0-9A-Z]+)/i)?.[1] || '';

  const link = celex
    ? 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex
    : (raw.id.startsWith('http') ? raw.id : 'https://eur-lex.europa.eu/search.html');

  const dateStr   = raw.date ? raw.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const [y, m, d] = dateStr.split('-');

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
    devices: ['Smartphones', 'Tablettes', 'IoT', 'Wearables'],
    link,
    summary
  };
}

/* ── EUR-LEX : SOCLE + DÉTECTION LIVE PAR SPARQL ── */

async function fetchEurLex() {
  const results = [];

  // 1. Socle : textes de référence connus
  const baseline = [
    { celex: '32014L0053', title: 'Directive 2014/53/UE — Équipements radioélectriques (RED)', date: '2014-04-16', apply: '13/06/2016 — En vigueur', summary: 'Directive relative à la mise à disposition sur le marché d\'équipements radioélectriques. Exigences essentielles de sécurité, CEM et utilisation efficace du spectre. Actes délégués cybersécurité (Art. 3.3 d/e/f) et chargeur universel.' },
    { celex: '32023R2854', title: 'Règlement (UE) 2023/2854 — Data Act', date: '2023-12-13', apply: '12/09/2026 — Nouveaux produits IoT', summary: 'Règlement sur l\'accès équitable aux données générées par les produits connectés et services associés.' },
    { celex: '32024R1689', title: 'Règlement (UE) 2024/1689 — AI Act', date: '2024-07-12', apply: '02/08/2026 — Systèmes IA haut risque', summary: 'Règlement sur l\'intelligence artificielle, classification par niveau de risque.' },
    { celex: '32024R2847', title: 'Règlement (UE) 2024/2847 — Cyber Resilience Act (CRA)', date: '2024-10-23', apply: '11/09/2026 — Déclaration vulnérabilités', summary: 'Cyber-résilience des produits comportant des éléments numériques. Déclaration des vulnérabilités au 11/09/2026, pleine application au 11/12/2027.' },
    { celex: '32024L0825', title: 'Directive (UE) 2024/825 — EmpCo Anti-greenwashing', date: '2024-03-06', apply: '22/09/2026 — Application', summary: 'Interdit les allégations environnementales trompeuses et génériques.' },
    { celex: '32023R1542', title: 'Règlement (UE) 2023/1542 — Batteries et déchets de batteries', date: '2023-07-28', apply: '18/02/2027 — Batterie remplaçable', summary: 'Exigences sur les batteries, remplaçabilité par l\'utilisateur dans les appareils portables, passeport numérique batterie.' },
    { celex: '32023R1670', title: 'Règlement (UE) 2023/1670 — Écoconception smartphones et tablettes', date: '2023-06-16', apply: '20/06/2025 — En vigueur', summary: 'Exigences d\'écoconception pour smartphones, téléphones sans fil et tablettes : durabilité, réparabilité, mises à jour logicielles.' }
  ];
  for (const b of baseline) {
    results.push({
      id: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + b.celex,
      title: b.title, date: b.date, apply: b.apply, summary: b.summary
    });
  }

  // 2. Détection live des nouveautés par SPARQL
  const SPARQL_ENDPOINT = 'https://publications.europa.eu/webapi/rdf/sparql';
  const LOOKBACK_DAYS = 60;
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString().slice(0, 10);

  const query = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT DISTINCT ?celex ?title ?date WHERE {
  ?work cdm:resource_legal_id_celex ?celex .
  ?work cdm:work_date_document ?date .
  ?exp cdm:expression_belongs_to_work ?work ;
       cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/FRA> ;
       cdm:expression_title ?title .
  FILTER (?date >= "${since}"^^xsd:date)
  FILTER (REGEX(STR(?celex), "^3[0-9]{4}[RLD][0-9]{4}$"))
}
ORDER BY DESC(?date)
LIMIT 500`;

  const KEYWORDS = /radio[ée]lectri|radio equipment|2014\/53|smartphone|t[ée]l[ée]phone|tablette|ordinateur portable|[ée]quipement terminal|chargeur|usb|cyber.?(s[ée]curit[ée]|r[ée]silience|attaque)|r[ée]silience num[ée]rique|[ée]coconception|ecodesign|r[ée]parabilit|batterie|intelligence artificielle.{0,30}(produit|appareil|embarqu)|donn[ée]es.{0,20}(produit|connect|iot)|internet des objets|wearable|montre connect|lunettes connect|spectre radio|compatibilit[ée] [ée]lectromagn|normes? harmonis[ée]|durabilit[ée]|greenwashing|all[ée]gations? environnementales/i;

  try {
    console.log('[EUR-Lex] Requête SPARQL depuis', since);
    const res = await fetch(SPARQL_ENDPOINT + '?query=' + encodeURIComponent(query), {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'RED-Monitor/4.0 (github.com/Fabrice1974)'
      },
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
      console.error('[EUR-Lex] ERREUR HTTP', res.status, '— source live indisponible, seul le socle est utilisé');
      return results;
    }

    const json = await res.json();
    const rows = (json.results && json.results.bindings) || [];
    console.log('[EUR-Lex] Actes reçus :', rows.length);

    let kept = 0;
    for (const row of rows) {
      const celex = row.celex.value;
      const title = row.title.value;
      const date = row.date.value.slice(0, 10);
      if (!KEYWORDS.test(title)) continue;

      const id = 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex;
      if (results.some(r => r.id === id)) continue;

      results.push({ id, title, date });
      kept++;
      console.log('[EUR-Lex] NOUVEAU', celex, '—', title.slice(0, 70));
    }
    console.log('[EUR-Lex] Nouveautés pertinentes retenues :', kept);

  } catch (e) {
    console.error('[EUR-Lex] ERREUR SPARQL :', e.message, '— seul le socle est utilisé');
  }

  console.log('[EUR-Lex] Total :', results.length, 'textes');
  return results;
}
/* ── DATA.GOUV.FR — TEXTES NATIONAUX ── */

async function fetchDataGouv() {
  const results = [];
  let failures = 0;

  const searches = [
    'équipements radioélectriques',
    'cybersécurité produits connectés',
    'écoconception smartphones tablettes',
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
          'User-Agent': 'RED-Monitor/4.0 (github.com/Fabrice1974)'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!res.ok) {
        console.warn('[data.gouv]', q, '→ HTTP', res.status);
        failures++;
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
        console.log('[data.gouv] OK', (item.title || '').slice(0, 60));
      }

    } catch (e) {
      console.warn('[data.gouv]', q, '→ Erreur :', e.message);
      failures++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('[data.gouv] Total :', results.length, 'textes');
  return { results, failures, attempts: searches.length };
}

/* ── LÉGIFRANCE RSS VIA PROXY ALLORIGINS ── */
async function fetchLegifranceRSS() {
  const results = [];
  let failures = 0;

  const feeds = [
    { url: 'https://www.legifrance.gouv.fr/feeds/jorf/NOR/ECOI', label: 'JORF Économie' },
    { url: 'https://www.legifrance.gouv.fr/feeds/jorf/NOR/TRED', label: 'JORF Transition écologique' }
  ];

  for (const feed of feeds) {
    try {
      console.log('[Légifrance RSS]', feed.label);

      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RED-Monitor/4.1; +https://fabrice1974.github.io/)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        signal: AbortSignal.timeout(20000)
      });

      if (!res.ok) {
        console.warn('[Légifrance RSS]', feed.label, '→ HTTP', res.status);
        failures++;
        continue;
      }

      const xml   = await res.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      console.log('[Légifrance RSS]', feed.label, '→', items.length, 'items');

      for (const match of items) {
        const block = match[1];
        const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
          || block.match(/<title>(.*?)<\/title>/)?.[1]
          || '';
        const link  = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const date  = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

        if (!title) continue;

        const t = title.toLowerCase();
        if (!/radio|cyber|[eé]coconception|batterie|smartphone|tablette|ordinateur portable|iot|wearable|num[eé]rique/.test(t))
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
        console.log('[Légifrance RSS] OK', title.slice(0, 60));
      }

    } catch (e) {
      console.warn('[Légifrance RSS]', feed.label, '→ Erreur :', e.message);
      failures++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('[Légifrance RSS] Total :', results.length, 'textes');
  return { results, failures, attempts: feeds.length };
}


/* ── ONESIGNAL — PUSH NOTIFICATIONS ── */

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

/* ── MAIN ── */

async function main() {
  console.log('=== RED Monitor v4.0 — Scan du', new Date().toISOString(), '===');

  const knownIds    = loadJSON(KNOWN_IDS_FILE, []);
  const currentData = loadJSON(DATA_FILE, []);
  console.log('[Main] IDs connus :', knownIds.length,
              '| Textes en base :', currentData.length);

  const [eurLexRaw, dg, lf] = await Promise.all([
    fetchEurLex(),
    fetchDataGouv(),
    fetchLegifranceRSS()
  ]);
  const dataGouvRaw = dg.results;
  const lfRssRaw     = lf.results;

  const allRaw = [...eurLexRaw, ...dataGouvRaw, ...lfRssRaw];
  console.log('[Main] Bruts —',
              'EUR-Lex :', eurLexRaw.length,
              '| data.gouv :', dataGouvRaw.length,
              '| Légifrance RSS :', lfRssRaw.length,
              '| Total :', allRaw.length);

  // Détection des sources en panne : on prévient au lieu de dire « rien de nouveau »
  const sourcesHS = [];
  if (dg.failures >= dg.attempts) sourcesHS.push('data.gouv');
  if (lf.failures >= lf.attempts) sourcesHS.push('Légifrance');

  const newRaw = allRaw.filter(r => r.id && !knownIds.includes(r.id));
  console.log('[Main] Nouveaux textes :', newRaw.length);

  if (newRaw.length > 0) {
    const newItems = newRaw.map(buildItem);

    const updatedData = [
      ...newItems,
      ...currentData.map(i => ({ ...i, isNew: false }))
    ];
    saveJSON(DATA_FILE, updatedData);
    console.log('[Main] data.json mis à jour — total :', updatedData.length, 'textes');

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

  } else if (sourcesHS.length > 0) {
    await sendNotification(
      '⚠️ Scan RED incomplet',
      'Source(s) indisponible(s) : ' + sourcesHS.join(', ') + '. Aucun nouveau texte trouvé, mais la veille n\'est pas complète.'
    );
    console.log('[Main] Aucun nouveau texte, sources en panne :', sourcesHS.join(', '));

  } else {
    await sendNotification(
      '✅ Scan RED terminé',
      'Aucun nouveau texte réglementaire cette semaine. Votre veille est à jour.'
    );
    console.log('[Main] Aucun nouveau texte — data.json inchangé');
  }

  const updatedIds = [
    ...new Set([
      ...knownIds,
      ...allRaw.map(r => r.id).filter(Boolean)
    ])
  ];
  saveJSON(KNOWN_IDS_FILE, updatedIds);

  // Date du dernier scan, lue par l'application
  saveJSON('scan-meta.json', { lastScan: new Date().toISOString() });

  console.log('=== Scan terminé — IDs connus :', updatedIds.length, '===');
}

main().catch(e => {
  console.error('ERREUR FATALE :', e);
  process.exit(1);
});
