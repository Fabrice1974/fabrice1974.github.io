/**
 * RED Monitor — scrape.mjs — v3.2
 * Sources :
 * - EUR-Lex API REST (remplace SPARQL trop lent)
 * - Légifrance API OAuth2 PISTE (remplace RSS bloqué)
 * - OneSignal push notifications
 */

import fetch from 'node-fetch';
import fs from 'fs';

const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const LF_CLIENT_ID      = process.env.LEGIFRANCE_CLIENT_ID;
const LF_CLIENT_SECRET  = process.env.LEGIFRANCE_CLIENT_SECRET;

const KNOWN_IDS_FILE = 'known-ids.json';
const DATA_FILE      = 'data.json';
const SITE_URL       = 'https://fabrice1974.github.io/';

// ✅ Date de publication des textes (pas leur date d'application)
const CUTOFF_DATE = '2023-01-01';

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
  if (/décret|ordonnance|loi\s|arrêté|jorf/.test(t))             return {cat:'fr',         tag:'Transposition FR'};
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

/* ── EUR-Lex API REST ── */
// ✅ Remplace SPARQL (trop lent / timeout)
// Recherches ciblées par mots-clés via l'API REST
async function fetchEurLex() {
  const results = [];

  // Mots-clés ciblés — une requête par thème
  const searches = [
    { q: 'cyber resilience act equipements radio',      label: 'CRA'          },
    { q: 'ecoconception smartphones tablettes',         label: 'ESPR phones'  },
    { q: 'greenwashing allegations environnementales',  label: 'EmpCo'        },
    { q: 'data act portabilite IoT',                    label: 'Data Act'     },
    { q: 'intelligence artificielle embarquee radio',   label: 'AI Act'       },
    { q: 'batterie remplacable smartphones',            label: 'Batteries'    },
    { q: 'equipements radioelectriques directive RED',  label: 'RED'          },
    { q: 'normes harmonisees radio ETSI',               label: 'Normes RED'   }
  ];

  for (const search of searches) {
    try {
      console.log('[EUR-Lex] Recherche :', search.label);

      // API REST EUR-Lex — endpoint de recherche
      const url = 'https://eur-lex.europa.eu/search.html'
        + '?scope=EURLEX'
        + '&type=quick'
        + '&lang=fr'
        + '&DD_YEAR_FROM=2023'
        + '&DD_YEAR_TO=2027'
        + '&text=' + encodeURIComponent(search.q)
        + '&FM_CODED=R,L,D'
        + '&format=json';

      const res = await fetch(url, {
        headers: {
          'Accept':     'application/json, text/html',
          'User-Agent': 'RED-Monitor/3.2 (veille-reglementaire; github.com/Fabrice1974)'
        },
        signal: AbortSignal.timeout(25000)
      });

      if (!res.ok) {
        console.warn('[EUR-Lex]', search.label, '→ HTTP', res.status);
        continue;
      }

      // EUR-Lex retourne du HTML ou JSON selon Accept
      const text = await res.text();

      // Parse les références CELEX dans la réponse
      const celexMatches = [...text.matchAll(/CELEX[:%3A]+([0-9][0-9A-Z]+)/gi)];
      const titleMatches = [...text.matchAll(/<title[^>]*>([^<]{20,200})<\/title>/gi)];

      console.log('[EUR-Lex]', search.label, '→', celexMatches.length, 'refs CELEX');

      // Dédoublonne les CELEX trouvés
      const seen = new Set();
      for (let i = 0; i < celexMatches.length; i++) {
        const celex = celexMatches[i][1];
        if (seen.has(celex)) continue;
        seen.add(celex);

        const id    = 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:' + celex;
        const title = titleMatches[i]?.[ 1]?.trim()
          || search.label + ' — ' + celex;

        results.push({ id, title, date: CUTOFF_DATE });
      }

    } catch (e) {
      console.warn('[EUR-Lex]', search.label, '→ Erreur :', e.message);
    }

    // Pause entre requêtes pour ne pas surcharger EUR-Lex
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('[EUR-Lex] Total résultats :', results.length);
  return results;
}

/* ── Légifrance API OAuth2 PISTE ── */
// ✅ Remplace RSS bloqué (HTTP 403)
async function fetchLegifrance() {
  if (!LF_CLIENT_ID || !LF_CLIENT_SECRET) {
    console.warn('[Légifrance] Credentials manquants — skip');
    return [];
  }

  try {
    // ── Étape 1 — Token OAuth2
    console.log('[Légifrance] Authentification OAuth2...');
    const tokenRes = await fetch(
      'https://oauth.piste.gouv.fr/api/oauth/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'client_credentials',
          client_id:     LF_CLIENT_ID,
          client_secret: LF_CLIENT_SECRET,
          scope:         'openid'
        }),
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.warn('[Légifrance] Token HTTP', tokenRes.status, ':', err.slice(0,200));
      return [];
    }

    const tokenData = await tokenRes.json();
    const token     = tokenData.access_token;

    if (!token) {
      console.warn('[Légifrance] Pas de token dans la réponse');
      return [];
    }
    console.log('[Légifrance] ✅ Token obtenu');

    // ── Étape 2 — Recherche dans le JORF
    const keywords = [
      'radio équipement cyber écoconception smartphone',
      'batterie réparabilité durabilité IoT wearable',
      'greenwashing allégation environnementale',
      'transposition directive européenne équipements'
    ];

    const items = [];

    for (const kw of keywords) {
      console.log('[Légifrance] Recherche :', kw.slice(0,40));

      const searchRes = await fetch(
        'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search',
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            recherche: {
              champs: [{
                typeChamp:  'TITLE',
                criteres: [{
                  typeRecherche: 'UN_DES_MOTS',
                  valeur:        kw,
                  operateur:     'ET'
                }],
                operateur: 'ET'
              }],
              filtres: [{
                facette:     'DATE_SIGNATURE',
                valeurDebut: CUTOFF_DATE,
                valeurFin:   new Date().toISOString().slice(0,10)
              }],
              pageNumber:     1,
              pageSize:       20,
              sort:           'PERTINENCE',
              typePagination: 'DEFAUT'
            },
            fond: 'JORF'
          }),
          signal: AbortSignal.timeout(20000)
        }
      );

      if (!searchRes.ok) {
        console.warn('[Légifrance] Search HTTP', searchRes.status);
        continue;
      }

      const data    = await searchRes.json();
      const results = data.results || [];
      console.log('[Légifrance]', kw.slice(0,30), '→', results.length, 'résultats');

      for (const item of results) {
        const id    = item.id || item.cid || '';
        const title = item.titre || item.titreComplet || '';
        const date  = item.dateSignature
          ? new Date(item.dateSignature).toISOString().slice(0,10)
          : '';

        if (id && title) {
          items.push({
            id:    'legifrance-' + id,
            title,
            date
          });
          console.log('[Légifrance] ✅ Match :', title.slice(0,60));
        }
      }

      // Pause entre requêtes
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('[Légifrance] Total items :', items.length);
    return items;

  } catch (e) {
    console.warn('[Légifrance] Erreur :', e.message);
    return [];
  }
}

/* ── OneSignal ── */
async function sendNotification(heading, message) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.log('[OneSignal] Simulation :', heading, '|', message);
    return;
  }

  const payload = {
    app_id:            ONESIGNAL_APP_ID,
    included_segments: ['Total Subscriptions'],
    headings:          { fr: heading, en: heading },
    contents:          { fr: message, en: message },
    url:               SITE_URL,
    chrome_web_icon:   SITE_URL + 'icons/icon-192.png',
    ttl:               604800
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
  console.log('=== RED Monitor v3.2 — Scan du', new Date().toISOString(), '===');

  const knownIds    = loadJSON(KNOWN_IDS_FILE, []);
  const currentData = loadJSON(DATA_FILE, []);
  console.log('[Main] IDs connus :', knownIds.length, '| Textes en base :', currentData.length);

  // ✅ Scraping parallèle EUR-Lex + Légifrance
  const [eurLexRaw, lfRaw] = await Promise.all([
    fetchEurLex(),
    fetchLegifrance()
  ]);

  const allRaw = [...eurLexRaw, ...lfRaw];
  console.log('[Main] Bruts — EUR-Lex :', eurLexRaw.length,
              '| Légifrance :', lfRaw.length,
              '| Total :', allRaw.length);

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
