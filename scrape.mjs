/**
 * RED Monitor — scrape.mjs — v3.1
 * Corrections :
 * - CUTOFF date de publication (pas d'application)
 * - URL JORF RSS corrigée
 * - User-Agent ajouté pour EUR-Lex
 * - Logs détaillés pour debug
 */

import fetch from 'node-fetch';
import fs from 'fs';

const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

// ✅ Date de PUBLICATION (pas d'application)
// On capture tous les textes publiés depuis 2023
// qui seront applicables en 2026+
const CUTOFF_PUBLICATION = '2023-01-01';

const KNOWN_IDS_FILE = 'known-ids.json';
const DATA_FILE      = 'data.json';
const SITE_URL       = 'https://fabrice1974.github.io/';

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
  if (/cyber.r[eé]silien|cra\b|2024\/2847/.test(t))             return {cat:'eu_related', tag:'Cybersécurité'};
  if (/[eé]coconception|espr|r[eé]parabilit/.test(t))            return {cat:'eu_related', tag:'Écoconception'};
  if (/greenwashing|empco|allégation.environ|2024\/825/.test(t)) return {cat:'eu_related', tag:'Greenwashing'};
  if (/data act|portabilit|2023\/2854/.test(t))                  return {cat:'eu_related', tag:'Données / IoT'};
  if (/intelligence artificielle|ai act|2024\/1689/.test(t))     return {cat:'eu_related', tag:'Intelligence Artificielle'};
  if (/garantie|durabilit|label/.test(t))                        return {cat:'eu_related', tag:'Garantie / Durabilité'};
  if (/jorf|légifrance|décret|ordonnance|loi\s/.test(t))         return {cat:'fr',         tag:'Transposition FR'};
  return                                                                 {cat:'eu_red',      tag:'Normes RED'};
}

/* ── Construire un item structuré ── */
function buildItem(raw) {
  const {cat, tag} = categorize(raw.title);
  const celex = raw.id.match(/CELEX[:/]([0-9A-Z]+)/i)?.[1] || '';
  const link = celex
    ? 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex
    : (raw.id.startsWith('http') ? raw.id : 'https://eur-lex.europa.eu/search.html');
  const dateStr = raw.date ? raw.date.slice(0,10) : new Date().toISOString().slice(0,10);
  const [y,m,d] = dateStr.split('-');
  return {
    id:      raw.id,
    cat,
    tag,
    isNew:   true,
    ref:     celex ? 'Acte (UE) ' + celex : raw.title.slice(0,60),
    title:   raw.title,
    date:    (d||'??') + '/' + (m||'??') + '/' + (y||'????'),
    apply:   'À confirmer — voir texte officiel',
    type:    cat === 'fr' ? 'Texte national' : 'Acte UE',
    devices: ['Smartphones','IoT','Wearables'],
    link,
    summary: 'Nouveau texte détecté automatiquement lors du scan du '
      + new Date().toLocaleDateString('fr-FR')
      + '. Consultez le texte officiel via le lien ci-dessous pour connaître '
      + 'le champ d\'application exact et la date d\'entrée en vigueur.'
  };
}

/* ── EUR-Lex SPARQL ── */
async function fetchEurLex() {
  // ✅ Filtre sur date de publication >= 2023
  // ✅ Mots-clés élargis pour capturer plus de textes pertinents
  const query = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    SELECT DISTINCT ?work ?title ?date WHERE {
      ?work cdm:work_date_document ?date .
      ?work cdm:work_title ?title .
      FILTER(?date >= "${CUTOFF_PUBLICATION}"^^xsd:date)
      FILTER(lang(?title) = "fr")
      FILTER(regex(?title,
        "radio.lectrique|.quipements radio|directive RED|2014/53|harmonisée|DECT|RLAN|wearable|IoT|cyber.résilience|écoconception|greenwashing|Data Act|intelligence artificielle|réparabilité|durabilité|batterie|smartphone|tablette",
        "i"))
    }
    ORDER BY DESC(?date) LIMIT 50
  `;

  const url = 'https://publications.europa.eu/webapi/rdf/sparql?'
    + new URLSearchParams({
        query,
        format: 'application/sparql-results+json'
      });

  try {
    console.log('[EUR-Lex] Requête SPARQL...');
    const res = await fetch(url, {
      headers: {
        'Accept':     'application/sparql-results+json',
        // ✅ User-Agent requis par EUR-Lex
        'User-Agent': 'RED-Monitor/3.1 (veille-reglementaire; contact: github.com/Fabrice1974)'
      },
      // ✅ Timeout 30s
      signal: AbortSignal.timeout(30000)
    });

    if (!res.ok) {
      console.warn('[EUR-Lex] HTTP', res.status, res.statusText);
      return [];
    }

    const json = await res.json();
    const results = json.results?.bindings || [];
    console.log('[EUR-Lex] Résultats bruts :', results.length);

    return results.map(b => ({
      id:    b.work?.value  || '',
      title: b.title?.value || '',
      date:  b.date?.value  || ''
    })).filter(r => r.id && r.title);

  } catch (e) {
    console.warn('[EUR-Lex] Erreur :', e.message);
    return [];
  }
}

/* ── JORF RSS ── */
async function fetchJORF() {
  const items = [];

  // ✅ URLs RSS Legifrance qui fonctionnent vraiment
  const RSS_URLS = [
    'https://www.legifrance.gouv.fr/rss/jorf.xml',
    'https://www.legifrance.gouv.fr/rss/loda.xml'
  ];

  const KEYWORDS = /radio|RED\b|équipement|cyber|écoconception|greenwashing|IoT|wearable|smartphone|tablette|réparabilité|batterie|durabilité/i;

  for (const url of RSS_URLS) {
    try {
      console.log('[JORF] Fetch :', url);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'RED-Monitor/3.1' },
        signal:  AbortSignal.timeout(15000)
      });

      if (!res.ok) {
        console.warn('[JORF] HTTP', res.status, 'pour', url);
        continue;
      }

      const text = await res.text();
      console.log('[JORF] Réponse reçue —', text.length, 'chars');

      // Parse RSS
      const titles = [...text.matchAll(/<title><!$$CDATA\[([^$$]+)\]\]><\/title>/g)].map(m => m[1]);
      const links  = [...text.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1].trim());
      const dates  = [...text.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map(m => m[1]);

      console.log('[JORF] Titres trouvés :', titles.length - 1);

      // i=1 pour sauter le titre du flux RSS lui-même
      for (let i = 1; i < titles.length; i++) {
        const t = titles[i] || '';
        if (KEYWORDS.test(t)) {
          items.push({
            id:    links[i] || ('jorf-' + i + '-' + Date.now()),
            title: t,
            date:  dates[i-1]
              ? new Date(dates[i-1]).toISOString().slice(0,10)
              : new Date().toISOString().slice(0,10)
          });
          console.log('[JORF] Match :', t.slice(0,80));
        }
      }

    } catch (e) {
      console.warn('[JORF] Erreur sur', url, ':', e.message);
    }
  }

  console.log('[JORF] Total items pertinents :', items.length);
  return items;
}

/* ── OneSignal ── */
async function sendNotification(heading, message) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.log('[OneSignal] Simulation :', heading, '|', message);
    return;
  }

  const payload = {
    app_id:             ONESIGNAL_APP_ID,
    included_segments:  ['Total Subscriptions'],
    headings:           { fr: heading, en: heading },
    contents:           { fr: message, en: message },
    url:                SITE_URL,
    chrome_web_icon:    SITE_URL + 'icons/icon-192.png',
    ttl:                604800
  };

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Basic ' + ONESIGNAL_API_KEY
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    console.log('[OneSignal] Envoyé :', json.id || JSON.stringify(json.errors));
  } catch (e) {
    console.error('[OneSignal] Erreur :', e.message);
  }
}

/* ── MAIN ── */
async function main() {
  console.log('=== RED Monitor — Scan du', new Date().toISOString(), '===');

  const knownIds    = loadJSON(KNOWN_IDS_FILE, []);
  const currentData = loadJSON(DATA_FILE, []);
  console.log('[Main] IDs connus :', knownIds.length, '| Textes en base :', currentData.length);

  // Scraping parallèle
  const [eurLexRaw, jorFRaw] = await Promise.all([fetchEurLex(), fetchJORF()]);
  const allRaw = [...eurLexRaw, ...jorFRaw];
  console.log('[Main] Bruts — EUR-Lex :', eurLexRaw.length, '| JORF :', jorFRaw.length, '| Total :', allRaw.length);

  // Nouveautés uniquement
  const newRaw = allRaw.filter(r => r.id && !knownIds.includes(r.id));
  console.log('[Main] Nouveaux textes :', newRaw.length);

  if (newRaw.length > 0) {
    const newItems = newRaw.map(buildItem);

    // Anciens → isNew:false, nouveaux en tête
    const updatedData = [
      ...newItems,
      ...currentData.map(i => ({ ...i, isNew: false }))
    ];
    saveJSON(DATA_FILE, updatedData);
    console.log('[Main] data.json mis à jour — total :', updatedData.length, 'textes');

    // Notifications — max 3 individuelles
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
    // Rien de nouveau — notif de confirmation
    await sendNotification(
      '✅ Scan RED terminé',
      'Aucun nouveau texte réglementaire cette semaine. Votre veille est à jour.'
    );
    console.log('[Main] Aucun nouveau texte — data.json inchangé');
  }

  // Mise à jour known-ids
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
