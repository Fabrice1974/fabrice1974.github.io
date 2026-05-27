/**
 * RED Monitor — scrape.mjs
 * Script Node.js lancé par GitHub Actions chaque semaine.
 * 1. Interroge EUR-Lex (CELLAR SPARQL) et JORF RSS
 * 2. Compare avec known-ids.json pour détecter les nouveautés
 * 3. Envoie une notification push OneSignal dans tous les cas
 */

import fetch from 'node-fetch';
import fs from 'fs';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const CUTOFF = '2026-06-01';
const KNOWN_IDS_FILE = 'known-ids.json';

/* ── Charger les IDs déjà connus ── */
function loadKnownIds() {
  try {
    return JSON.parse(fs.readFileSync(KNOWN_IDS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/* ── Sauvegarder les IDs ── */
function saveKnownIds(ids) {
  fs.writeFileSync(KNOWN_IDS_FILE, JSON.stringify(ids, null, 2));
}

/* ── Requête EUR-Lex SPARQL ── */
async function fetchEurLex() {
  const query = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    SELECT DISTINCT ?work ?title ?date WHERE {
      ?work cdm:work_date_document ?date .
      ?work cdm:work_title ?title .
      ?work a ?type .
      FILTER(?date >= "${CUTOFF}"^^xsd:date)
      FILTER(lang(?title) = "fr")
      FILTER(
        regex(?title,
          "radio.lectrique|.quipements radio|directive RED|2014/53|harmonisée|DECT|RLAN|wearable|IoT|cyber.résilience|écoconception|greenwashing|Data Act|intelligence artificielle",
          "i")
      )
    }
    ORDER BY DESC(?date) LIMIT 30
  `;

  const url = 'https://publications.europa.eu/webapi/rdf/sparql?'
    + new URLSearchParams({ query, format: 'application/sparql-results+json' });

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/sparql-results+json' },
      timeout: 15000
    });
    if (!res.ok) throw new Error('EUR-Lex HTTP ' + res.status);
    const json = await res.json();
    return (json.results?.bindings || []).map(b => ({
      id: b.work?.value || '',
      title: b.title?.value || '',
      date: b.date?.value || ''
    }));
  } catch (e) {
    console.warn('EUR-Lex SPARQL erreur:', e.message);
    return [];
  }
}

/* ── Requête JORF RSS (Légifrance) ── */
async function fetchJORF() {
  const feeds = [
    'https://www.legifrance.gouv.fr/search/rss?nature=LOI&nature=ORDONNANCE&nature=DECRET&nature=ARRETE&fond=LEGI&datePublication=' + CUTOFF,
  ];
  const items = [];
  for (const url of feeds) {
    try {
      const res = await fetch(url, { timeout: 10000 });
      if (!res.ok) continue;
      const text = await res.text();
      // Extraction XML basique
      const titles = [...text.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)].map(m => m[1]);
      const links  = [...text.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1]);
      const dates  = [...text.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map(m => m[1]);
      for (let i = 1; i < titles.length; i++) {
        const t = titles[i] || '';
        if (/radio|RED|équipement|cyber|écoconception|greenwashing|IoT|wearable|smartphone|tablette/i.test(t)) {
          items.push({ id: links[i] || t, title: t, date: dates[i] || '' });
        }
      }
    } catch (e) {
      console.warn('JORF fetch erreur:', e.message);
    }
  }
  return items;
}

/* ── Envoyer une notification OneSignal ── */
async function sendNotification(heading, message, url) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.log('OneSignal non configuré — simulation :', heading, '|', message);
    return;
  }
  const payload = {
    app_id: ONESIGNAL_APP_ID,
    included_segments: ['All'],
    headings: { fr: heading, en: heading },
    contents: { fr: message, en: message },
    url: url || 'https://fabrice1974.github.io/red-monitor/',
    chrome_web_icon: 'https://fabrice1974.github.io/red-monitor/icons/icon-192.png',
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
    console.log('OneSignal réponse:', json.id || json.errors);
  } catch (e) {
    console.error('OneSignal erreur:', e.message);
  }
}

/* ── MAIN ── */
async function main() {
  console.log('=== RED Monitor — Scan du', new Date().toISOString(), '===');

  const knownIds = loadKnownIds();
  console.log('IDs connus :', knownIds.length);

  // Scraping parallèle
  const [eurLexItems, jorFItems] = await Promise.all([fetchEurLex(), fetchJORF()]);
  const allItems = [...eurLexItems, ...jorFItems];
  console.log('Items trouvés — EUR-Lex:', eurLexItems.length, '| JORF:', jorFItems.length);

  // Détection des nouveautés
  const newItems = allItems.filter(item => item.id && !knownIds.includes(item.id));
  console.log('Nouveaux textes :', newItems.length);

  if (newItems.length > 0) {
    // Notification pour chaque nouveau texte (max 3)
    for (const item of newItems.slice(0, 3)) {
      const shortTitle = item.title.length > 80 ? item.title.slice(0, 80) + '...' : item.title;
      await sendNotification(
        '🆕 Nouveau texte RED',
        shortTitle + ' — Application : voir app',
        'https://fabrice1974.github.io/red-monitor/'
      );
    }
    if (newItems.length > 3) {
      await sendNotification(
        '🆕 ' + (newItems.length - 3) + ' autres nouveaux textes',
        'Ouvrez RED Monitor pour voir toutes les nouvelles réglementations détectées.',
      );
    }
    // Mettre à jour les IDs connus
    const updatedIds = [...new Set([...knownIds, ...allItems.map(i => i.id).filter(Boolean)])];
    saveKnownIds(updatedIds);
  } else {
    // Notification de confirmation : scan OK, rien de nouveau
    await sendNotification(
      '✅ Scan RED terminé',
      'Aucun nouveau texte réglementaire cette semaine. Votre veille est à jour.',
    );
    // Mettre à jour les IDs dans tous les cas
    if (allItems.length > 0) {
      const updatedIds = [...new Set([...knownIds, ...allItems.map(i => i.id).filter(Boolean)])];
      saveKnownIds(updatedIds);
    }
  }

  console.log('=== Scan terminé ===');
}

main().catch(console.error);
