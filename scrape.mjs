/**
 * RED Monitor — scrape.mjs
 * Script Node.js lancé par GitHub Actions chaque semaine.
 */

import fetch from 'node-fetch';
import fs from 'fs';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const CUTOFF = '2026-06-01';
const KNOWN_IDS_FILE = 'known-ids.json';
const SITE_URL = 'https://fabrice1974.github.io/';

function loadKnownIds() {
  try { return JSON.parse(fs.readFileSync(KNOWN_IDS_FILE, 'utf8')); }
  catch { return []; }
}

function saveKnownIds(ids) {
  fs.writeFileSync(KNOWN_IDS_FILE, JSON.stringify(ids, null, 2));
}

async function fetchEurLex() {
  const query = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    SELECT DISTINCT ?work ?title ?date WHERE {
      ?work cdm:work_date_document ?date .
      ?work cdm:work_title ?title .
      FILTER(?date >= "${CUTOFF}"^^xsd:date)
      FILTER(lang(?title) = "fr")
      FILTER(regex(?title,
        "radio.lectrique|.quipements radio|directive RED|2014/53|harmonisée|DECT|RLAN|wearable|IoT|cyber.résilience|écoconception|greenwashing|Data Act|intelligence artificielle",
        "i"))
    }
    ORDER BY DESC(?date) LIMIT 30
  `;
  const url = 'https://publications.europa.eu/webapi/rdf/sparql?'
    + new URLSearchParams({ query, format: 'application/sparql-results+json' });
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/sparql-results+json' } });
    if (!res.ok) throw new Error('EUR-Lex HTTP ' + res.status);
    const json = await res.json();
    return (json.results?.bindings || []).map(b => ({
      id: b.work?.value || '',
      title: b.title?.value || '',
      date: b.date?.value || ''
    }));
  } catch (e) {
    console.warn('EUR-Lex erreur:', e.message);
    return [];
  }
}

async function fetchJORF() {
  const items = [];
  try {
    const url = 'https://www.legifrance.gouv.fr/search/rss?nature=LOI&nature=ORDONNANCE&nature=DECRET&nature=ARRETE&fond=LEGI&datePublication=' + CUTOFF;
    const res = await fetch(url);
    if (!res.ok) return items;
    const text = await res.text();
    const titles = [...text.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)].map(m => m[1]);
    const links  = [...text.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1]);
    for (let i = 1; i < titles.length; i++) {
      const t = titles[i] || '';
      if (/radio|RED|équipement|cyber|écoconception|greenwashing|IoT|wearable|smartphone|tablette/i.test(t)) {
        items.push({ id: links[i] || t, title: t, date: '' });
      }
    }
  } catch (e) { console.warn('JORF erreur:', e.message); }
  return items;
}

async function sendNotification(heading, message) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.log('OneSignal non configuré — simulation:', heading);
    return;
  }
  const payload = {
    app_id: ONESIGNAL_APP_ID,
    included_segments: ['Total Subscriptions'],
    headings: { fr: heading, en: heading },
    contents: { fr: message, en: message },
    url: SITE_URL,
    chrome_web_icon: SITE_URL + 'icons/icon-192.png',
    ttl: 604800
  };
  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + ONESIGNAL_API_KEY
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    console.log('OneSignal réponse:', json.id || JSON.stringify(json.errors));
  } catch (e) { console.error('OneSignal erreur:', e.message); }
}

async function main() {
  console.log('=== RED Monitor — Scan du', new Date().toISOString(), '===');
  const knownIds = loadKnownIds();
  console.log('IDs connus:', knownIds.length);

  const [eurLexItems, jorFItems] = await Promise.all([fetchEurLex(), fetchJORF()]);
  const allItems = [...eurLexItems, ...jorFItems];
  console.log('Items — EUR-Lex:', eurLexItems.length, '| JORF:', jorFItems.length);

  const newItems = allItems.filter(i => i.id && !knownIds.includes(i.id));
  console.log('Nouveaux textes:', newItems.length);

  if (newItems.length > 0) {
    for (const item of newItems.slice(0, 3)) {
      const title = item.title.length > 80 ? item.title.slice(0, 80) + '...' : item.title;
      await sendNotification('🆕 Nouveau texte RED', title);
    }
    if (newItems.length > 3) {
      await sendNotification('🆕 ' + (newItems.length - 3) + ' autres nouveaux textes',
        'Ouvrez RED Monitor pour voir toutes les nouvelles réglementations.');
    }
  } else {
    await sendNotification('✅ Scan RED terminé',
      'Aucun nouveau texte réglementaire cette semaine. Votre veille est à jour.');
  }

  const updatedIds = [...new Set([...knownIds, ...allItems.map(i => i.id).filter(Boolean)])];
  saveKnownIds(updatedIds);
  console.log('=== Scan terminé ===');
}

main().catch(console.error);
