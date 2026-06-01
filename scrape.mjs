/**
 * RED Monitor — scrape.mjs — v3.3
 * Sources :
 * - EUR-Lex CELEX directs (pas de SPARQL)
 * - data.gouv.fr API open data (remplace Légifrance PISTE)
 * - OneSignal push notifications
 */

import fetch from 'node-fetch';
import fs from 'fs';

const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

const KNOWN_IDS_FILE = 'known-ids.json';
const DATA_FILE      = 'data.json';
const SITE_URL       = 'https://fabrice1974.github.io/';
const CUTOFF_DATE    = '2023-01-01';

/* ── Helpers fichiers ── */
function loadJSON(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); }
  catch { return fallback; }
}
function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

/* ── Catégorisation automatique ── */
function categorize(title) {
  const t = title.toLowerCase();
  if (/cyber.r[eé]silien|cra\b|2024\/2847/.test(t))              return { cat: 'eu_related', tag: 'Cybersécurité' };
  if (/[eé]coconception|espr|r[eé]parabilit/.test(t))             return { cat: 'eu_related', tag: 'Écoconception' };
  if (/greenwashing|empco|all[eé]gation.environ|2024\/825/.test(t)) return { cat: 'eu_related', tag: 'Greenwashing' };
  if (/data act|portabilit|2023\/2854/.test(t))                   return { cat: 'eu_related', tag: 'Données / IoT' };
  if (/intelligence artificielle|ai act|2024\/1689/.test(t))      return { cat: 'eu_related', tag: 'Intelligence Artificielle' };
  if (/batterie|remplaçable/.test(t))                             return { cat: 'eu_related', tag: 'Batteries' };
  if (/d[eé]cret|ordonnance|loi\s|arr[eê]t[eé]|jorf/.test(t))   return { cat: 'fr',         tag: 'Transposition FR' };
  return                                                                  { cat: 'eu_red',     tag: 'Normes RED' };
}

/* ── Construire un item structuré ── */
function buildItem(raw) {
  const { cat, tag } = categorize(raw.title);
  const celex  = raw.id.match(/CELEX[:/]([0-9A-Z]+)/i)?.[1] || '';
  const link   = celex
    ? 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex
    : (raw.id.startsWith('http') ? raw.id : 'https://eur-lex.europa.eu/search.html');
  const dateStr = raw.date ? raw.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const [y, m, d] = dateStr.split('-');
  return {
    id:      raw.id,
    cat,
    tag,
    isNew:   true,
    ref:     celex ? 'Acte (UE) ' + celex : raw.title.slice(0, 60),
    title:   raw.title,
    date:    (d || '??') + '/' + (m || '??') + '/' + (y || '????'),
    apply:   'À confirmer — voir texte officiel',
    type:    cat === 'fr' ? 'Texte national' : 'Acte UE',
    devices: ['Smartphones', 'IoT', 'Wearables'],
    link,
    summary: 'Nouveau texte détecté automatiquement lors du scan du '
      + new Date().toLocaleDateString('fr-FR')
      + '. Consultez le texte officiel via le lien ci-dessous.'
  };
}

/* ── EUR-Lex — CELEX directs ── */
// ✅ Textes RED pertinents hardcodés
// ✅ Pas de SPARQL, pas de parsing HTML
async function fetchEurLex() {
  const results = [];

  const celexIds = [
    { celex: '32014L0053', label: 'Directive RED'         },
    { celex: '32022R2065', label: 'DSA'                   },
    { celex: '32022R1925', label: 'DMA'                   },
    { celex: '32023R2854', label: 'Data Act'              },
    { celex: '32024R1689', label: 'AI Act'                },
    { celex: '32024R2847', label: 'CRA Cyber Resilience'  },
    { celex: '32024L0825', label: 'EmpCo Greenwashing'    },
    { celex: '32009L0125', label: 'Ecoconception'         },
    { celex: '32023R1542', label: 'Batteries'             },
    { celex: '32022R0414', label: 'Ecoconception phones'  }
  ];

  for (const { celex, label } of celexIds) {
    try {
      console.log('[EUR-Lex] Check :', label, '→', celex);

      const id    = 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex;
      const title = label + ' — CELEX ' + celex;

      results.push({ id, title, date: CUTOFF_DATE });
      console.log('[EUR-Lex] ✅', label);

    } catch (e) {
      console.warn('[EUR-Lex]', label, '→ Erreur :', e.message);
    }
  }

  console.log('[EUR-Lex] Total :', results.length);
  return results;
}

/* ── data.gouv.fr — textes nationaux ── */
// ✅ Open data — pas de token
// ✅ Décrets, ordonnances, arrêtés liés au numérique
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
          'User-Agent': 'RED-Monitor/3.3 (github.com/Fabrice1974)'
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

  console.log('[data.gouv] Total :', results.length);
  return results;
}

/* ── Légifrance RSS via allorigins proxy ── */
// ✅ Contourne le blocage CORS du RSS Légifrance
// ✅ Pas de token nécessaire
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

      // Proxy allorigins pour contourner le blocage
      const proxyUrl = 'https://api.allorigins.win/get?url='
        + encodeURIComponent(feed.url);

      const res = await fetch(proxyUrl, {
        headers: { 'User-Agent': 'RED-Monitor/3.3' },
        signal:  AbortSignal.timeout(20000)
      });

      if (!res.ok) {
        console.warn('[Légifrance RSS]', feed.label, '→ HTTP', res.status);
        continue;
      }

      const json    = await res.json();
      const xml     = json.contents || '';
      const items   = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

      console.log('[Légifrance RSS]', feed.label, '→', items.length, 'items');

      for (const match of items) {
        const block = match[1];
        const title = block.match(/<title><!$$CDATA\[(.*?)$$\]><\/title>/)?.[1]
          || block.match(/<title>(.*?)<\/title>/)?.[1]
          || '';
        const link  = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const date  = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

        if (!title) continue;

        // Filtre sur mots-clés pertinents
        const t = title.toLowerCase();
        if (!/radio|cyber|[eé]coconception|batterie|smartphone|iot|wearable|num[eé]rique/.test(t)) continue;

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

  console.log('[Légifrance RSS] Total :', results.length);
  return results;
}

/* ── OneSignal ── */
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
  console.log('=== RED Monitor v3.3 — Scan du', new Date().toISOString(), '===');

  const knownIds    = loadJSON(KNOWN_IDS_FILE, []);
  const currentData = loadJSON(DATA_FILE, []);
  console.log('[Main] IDs connus :', knownIds.length, '| Textes en base :', currentData.length);

  // ✅ Scraping parallèle — 3 sources
  const [eurLexRaw, dataGouvRaw, lfRssRaw] = await Promise.all([
    fetchEurLex(),
    fetchDataGouv(),
    fetchLegifranceRSS()
  ]);

  const allRaw = [...eurLexRaw, ...dataGouvRaw, ...lfRssRaw];
  console.log('[Main] EUR-Lex :', eurLexRaw.length,
              '| data.gouv :', dataGouvRaw.length,
              '| Légifrance RSS :', lfRssRaw.length,
              '| Total :', allRaw.length);

  // Nouveautés uniquement
  const newRaw = allRaw.filter(r => r.id && !knownIds.includes(r.id));
  console.log('[Main] Nouveaux textes :', newRaw.length);

  if (newRaw.length > 0) {
    const newItems    = newRaw.map(buildItem);
    const updatedData = [
      ...newItems,
      ...currentData.map(i => ({ ...i, isNew: false }))
    ];
    saveJSON(DATA_FILE, updatedData);
    console.log('[Main] data.json mis à jour — total :', updatedData.length);

    for (const item of newItems.slice(0, 3)) {
      const shortTitle = item.title.length > 80
        ? item.title.slice(0, 80) + '...'
        : item.title;
      await sendNotification('🆕 Nouveau texte RED', shortTitle);
    }
    if (newItems.length > 3) {
      await sendNotification(
        '🆕 ' + (newItems.length - 3) + ' autres nouveaux textes',
        'Ouvrez RED Monitor pour voir toutes les nouvelles réglementations.'
      );
    }

  } else {
    await sendNotification(
      '✅ Scan RED terminé',
      'Aucun nouveau texte réglementaire cette semaine. Votre veille est à jour.'
    );
    console.log('[Main] Aucun nouveau texte — data.json inchangé');
  }

  // Mise à jour known-ids
  const updatedIds = [
    ...new Set([...knownIds, ...allRaw.map(r => r.id).filter(Boolean)])
  ];
  saveJSON(KNOWN_IDS_FILE, updatedIds);
  console.log('=== Scan terminé — IDs connus :', updatedIds.length, '===');
}

main().catch(console.error);
