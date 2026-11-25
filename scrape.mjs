/**
 * RED Monitor — scrape.mjs — v4.1
 * Sources :
 *   - EUR-Lex SPARQL (détection live) + socle de textes de référence
 *   - data.gouv.fr API open data
 *   - Légifrance RSS via proxy allorigins
 *   - OneSignal push notifications
 * Pertinence et classement : voir classify.mjs (source unique)
 * Node 20 : fetch et AbortSignal.timeout sont natifs, pas d'import node-fetch.
 */

import fs from 'fs';
import { classify, detectDevices } from './classify.mjs';

// ── Secrets GitHub Actions ──
const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

// ── Constantes ──
const KNOWN_IDS_FILE = 'known-ids.json';
const DATA_FILE      = 'data.json';
const META_FILE      = 'scan-meta.json';
const SITE_URL       = 'https://fabrice1974.github.io/';
const CUTOFF_DATE    = '2023-01-01';   // Date minimale des textes retenus (à ajuster)

/* ── HELPERS FICHIERS ── */

/** Lit un JSON ; renvoie fallback si le fichier est absent ou invalide. */
function loadJSON(path, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (e) {
    console.warn(`[Fichier] Lecture impossible de ${path} (${e.code || e.message}), valeur par défaut utilisée`);
    return fallback;
  }
}

/** Écrit un JSON lisible. */
function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`[Fichier] Écrit : ${path}`);
}

/* ── MIGRATION DES DONNÉES EXISTANTES ── */

/**
 * Reclasse les textes déjà présents dans data.json avec les règles actuelles.
 * Les textes devenus hors périmètre sont retirés et tracés dans les logs.
 */
function recategoriser(items) {
  const resultat = [];
  let retires = 0;

  for (const item of items) {
    const titre = item.title || '';
    const classement = classify(titre);
    if (!classement) {
      retires++;
      console.warn('[Migration] Retiré (hors périmètre) :', titre.slice(0, 70));
      continue;
    }
    resultat.push({
      ...item,
      cat:     classement.cat,
      tag:     classement.tag,
      devices: detectDevices(titre)
    });
  }

  console.log(`[Migration] Conservés : ${resultat.length} | retirés : ${retires}`);
  return resultat;
}

/* ── CONSTRUCTION D'UN ITEM STRUCTURÉ ── */

/**
 * Transforme un texte brut en item affichable.
 * @returns {object|null} null si le texte est hors périmètre.
 */
function buildItem(raw) {
  const classement = classify(raw.title);
  if (!classement) {
    console.warn('[Build] Hors périmètre, ignoré :', raw.title.slice(0, 70));
    return null;
  }
  const { cat, tag } = classement;

  const celex = raw.id.match(/CELEX[:/]([0-9A-Z]+)/i)?.[1] || '';

  const link = raw.link
    || (celex
        ? 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex
        : (raw.id.startsWith('http') ? raw.id : 'https://eur-lex.europa.eu/search.html'));

  const dateStr   = raw.date ? raw.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const [y, m, d] = dateStr.split('-');

  const summary = raw.summary
    || 'Nouveau texte détecté automatiquement lors du scan du '
    + new Date().toLocaleDateString('fr-FR')
    + '. Consultez le texte officiel via le lien ci-dessous '
    + 'pour connaître le champ d\'application exact '
    + 'et la date d\'entrée en vigueur.';

  const type = raw.source === 'datagouv' ? 'Donnée ouverte'
             : cat === 'fr'              ? 'Texte national'
             :                             'Acte UE';

  return {
    id:      raw.id,
    cat,
    tag,
    isNew:   true,
    ref:     celex ? 'Acte (UE) ' + celex : raw.title.slice(0, 60),
    title:   raw.title,
    date:    (d || '??') + '/' + (m || '??') + '/' + (y || '????'),
    apply:   raw.apply || 'À confirmer — voir texte officiel',
    type,
    devices: detectDevices(raw.title),
    link,
    summary
  };
}

/* ── EUR-LEX : SOCLE + DÉTECTION LIVE PAR SPARQL ── */

async function fetchEurLex() {
  const results = [];

  // 1. Socle : textes de référence connus, toujours conservés
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
      id:      'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + b.celex,
      title:   b.title,
      date:    b.date,
      apply:   b.apply,
      summary: b.summary,
      source:  'socle'
    });
  }
  console.log('[EUR-Lex] Socle :', results.length, 'textes');

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

  try {
    console.log('[EUR-Lex] Requête SPARQL depuis', since);
    const res = await fetch(SPARQL_ENDPOINT + '?query=' + encodeURIComponent(query), {
      headers: {
        'Accept':     'application/sparql-results+json',
        'User-Agent': 'RED-Monitor/4.1 (github.com/Fabrice1974)'
      },
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
      console.error('[EUR-Lex] ❌ HTTP', res.status, '— source live indisponible, seul le socle est utilisé');
      return results;
    }

    const json = await res.json();
    const rows = json.results?.bindings || [];
    console.log('[EUR-Lex] Actes reçus :', rows.length);

    let retenus = 0;
    for (const row of rows) {
      const celex = row.celex.value;
      const title = row.title.value;
      const date  = row.date.value.slice(0, 10);

      if (!classify(title)) continue;   // garde-fou périmètre

      const id = 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex;
      if (results.some(r => r.id === id)) continue;

      results.push({ id, title, date, source: 'eurlex' });
      retenus++;
      console.log('[EUR-Lex] 🆕', celex, '—', title.slice(0, 70));
    }
    console.log('[EUR-Lex] Nouveautés pertinentes retenues :', retenus);

  } catch (e) {
    console.error('[EUR-Lex] ❌ Erreur SPARQL :', e.message, '— seul le socle est utilisé');
  }

  console.log('[EUR-Lex] Total :', results.length, 'textes');
  return results;
}

/* ── DATA.GOUV.FR — DONNÉES OUVERTES ── */

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
          'User-Agent': 'RED-Monitor/4.1 (github.com/Fabrice1974)'
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
        if (!classify(item.title || '')) continue;   // jeu de données hors sujet

        results.push({
          id:     'datagouv-' + item.id,
          title:  item.title || q,
          date:   created,
          link:   item.page,
          source: 'datagouv'
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
      const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(feed.url);

      const res = await fetch(proxyUrl, {
        headers: { 'User-Agent': 'RED-Monitor/4.1' },
        signal:  AbortSignal.timeout(20000)
      });

      if (!res.ok) {
        console.warn('[Légifrance RSS]', feed.label, '→ HTTP', res.status);
        failures++;
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
        if (!classify(title)) continue;   // garde-fou périmètre

        const dateISO = date
          ? new Date(date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);
        if (dateISO < CUTOFF_DATE) continue;

        results.push({
          id:     link || 'legifrance-' + title.slice(0, 40),
          title,
          date:   dateISO,
          link,
          source: 'legifrance'
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
    // Si l'API répond 401, essaie 'Key ' au lieu de 'Basic ' selon le type de clé
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
  console.log('=== RED Monitor v4.1 — Scan du', new Date().toISOString(), '===');

  const knownIds    = loadJSON(KNOWN_IDS_FILE, []);
  const currentData = recategoriser(loadJSON(DATA_FILE, []));
  console.log('[Main] IDs connus :', knownIds.length, '| Textes en base :', currentData.length);

  const [eurLexRaw, dg, lf] = await Promise.all([
    fetchEurLex(),
    fetchDataGouv(),
    fetchLegifranceRSS()
  ]);

  const allRaw = [...eurLexRaw, ...dg.results, ...lf.results];
  console.log('[Main] Bruts — EUR-Lex :', eurLexRaw.length,
              '| data.gouv :', dg.results.length,
              '| Légifrance :', lf.results.length,
              '| Total :', allRaw.length);

  // Sources en panne : garde corrigée (évite le faux positif quand attempts = 0)
  const sourcesHS = [];
  if (dg.attempts && dg.failures >= dg.attempts) sourcesHS.push('data.gouv');
  if (lf.attempts && lf.failures >= lf.attempts) sourcesHS.push('Légifrance');

  // Seuls les textes pertinents et inconnus deviennent « nouveaux »
  const newRaw   = allRaw.filter(r => r.id && !knownIds.includes(r.id) && classify(r.title));
  const newItems = newRaw.map(buildItem).filter(Boolean);
  console.log('[Main] Nouveaux textes pertinents :', newItems.length);

  if (newItems.length > 0) {
    const updatedData = [
      ...newItems,
      ...currentData.map(i => ({ ...i, isNew: false }))
    ];
    saveJSON(DATA_FILE, updatedData);
    console.log('[Main] data.json mis à jour — total :', updatedData.length, 'textes');

    for (const item of newItems.slice(0, 3)) {
      const shortTitle = item.title.length > 80 ? item.title.slice(0, 80) + '...' : item.title;
      await sendNotification('🆕 Nouveau texte RED', shortTitle);
    }
    if (newItems.length > 3) {
      await sendNotification(
        '🆕 ' + (newItems.length - 3) + ' autres nouveaux textes',
        'Ouvrez RED Monitor pour voir toutes les nouvelles réglementations détectées.'
      );
    }

  } else {
    // Persiste quand même la migration (textes retirés)
    saveJSON(DATA_FILE, currentData);

    if (sourcesHS.length > 0) {
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
      console.log('[Main] Aucun nouveau texte pertinent');
    }
  }

  // Mémorise uniquement les textes retenus : un texte rejeté sera réévalué après une amélioration des règles
  const updatedIds = [
    ...new Set([
      ...knownIds,
      ...allRaw.filter(r => r.id && classify(r.title)).map(r => r.id)
    ])
  ];
  saveJSON(KNOWN_IDS_FILE, updatedIds);
  saveJSON(META_FILE, { lastScan: new Date().toISOString() });

  console.log('=== Scan terminé — IDs connus :', updatedIds.length, '===');
}

main().catch(e => {
  console.error('ERREUR FATALE :', e);
  process.exit(1);
});
