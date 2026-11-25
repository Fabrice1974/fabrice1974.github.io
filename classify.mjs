/**
 * classify.mjs — Règles de pertinence et de classement (RED Monitor)
 * Source unique de vérité, utilisée par scrape.mjs, nettoyer-data.mjs et test-classify.mjs.
 *
 * Logique :
 *  1. Exclusions explicites (agricole, drones, fiscal, etc.) : rejet immédiat.
 *  2. Un texte doit viser un produit ciblé OU citer un acte cible (CRA, RED, Data Act...).
 *  3. Classement : thème européen, puis national, puis RED pur.
 *  4. Sans correspondance : null (hors périmètre). Aucune catégorie par défaut.
 */

/** Met en minuscules et supprime les accents. */
export function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/* ── 1. EXCLUSIONS : domaines explicitement hors périmètre ── */
const EXCLUSIONS = [
  /agricole|agriculture|pesticide|phytosanitaire|semence/,
  /alimentaire|denree|pharmaceutique|medicament|pharmacie/,
  /vehicule.{0,20}(electrique|automobile|moteur)|automobile|pneumatique/,
  /aeronef|aviation|\bdrones?\b|aerien/,
  /insolvabilite|faillite|redressement judiciaire/,
  /fiscal|douane|\btva\b|impot|accise/,
  /peche|maritime|navire/,
  /eau potable|dechets? menagers?/,
  /\bemploi\b|formation professionnelle|nomination/,
];

/* ── 2a. PÉRIMÈTRE PRODUIT : appareil ciblé ou directive RED ── */
const PERIMETRE_PRODUIT = /smartphones?|telephones? (mobiles?|portables?|sans fil)|tablettes?|\btablets?\b|\biot\b|internet des objets|(objets?|produits?|appareils?) connectes?|wearables?|montres? connectees?|lunettes connectees?|bracelets? connectes?|equipements? radioelectriques?|radio equipment|equipements? terminaux?|2014\/53|2014r0053|2014l0053|chargeur.{0,30}(usb|universel|commun)|usb-c/;

/* ── 2b. PÉRIMÈTRE ACTES : textes européens cibles cités par leur nom ou numéro ── */
const PERIMETRE_ACTES = /cyber.?resilien|\bcra\b|2024\/2847|2024r2847|ecoconception|ecodesign|reparabilite|2023\/1670|2023r1670|2009\/125|2009l0125|\bespr\b|greenwashing|empco|allegations? environnementales?|2024\/825|2024l0825|data act|2023\/2854|2023r2854|intelligence artificielle|ai act|2024\/1689|2024r1689|2023\/1542|2023r1542|batteries?|remplacable|digital services act|\bdsa\b|2022\/2065|digital markets act|\bdma\b|2022\/1925/;

/* ── 3. THÈMES EUROPÉENS : le thème avec le plus de motifs trouvés gagne ── */
const REGLES_THEME = [
  { tag: 'Cybersécurité', motifs: [/cyber.?resilien/, /\bcra\b/, /2024\/2847|2024r2847/] },
  { tag: 'Écoconception', motifs: [
      /ecoconception|ecodesign/, /\bespr\b/, /2024\/1781|2024r1781/, // ESPR : numéro à vérifier
      /reparabilite/, /2023\/1670|2023r1670/, /2009\/125|2009l0125/] },
  { tag: 'Greenwashing', motifs: [
      /greenwashing|empco|allegations? environnementales?/, /2024\/825|2024l0825/] },
  { tag: 'Données / IoT', motifs: [/data act|2023\/2854|2023r2854/] },
  { tag: 'Intelligence Artificielle', motifs: [/intelligence artificielle|ai act|2024\/1689|2024r1689/] },
  { tag: 'Batteries', motifs: [
      /2023\/1542|2023r1542/, /remplacable/, /batteries?.{0,40}(portable|appareil|utilisateur)/] },
  { tag: 'Services Numériques', motifs: [/digital services act|\bdsa\b|2022\/2065|2022r2065/] },
  { tag: 'Marchés Numériques', motifs: [/digital markets act|\bdma\b|2022\/1925|2022r1925/] },
];

/* ── 4. RED ET DOCUMENTS NATIONAUX ── */
const MOTIF_RED = /radioelectri|radio equipment|2014\/53|2014r0053|2014l0053|equipements? terminaux?|chargeur.{0,30}(usb|universel|commun)|usb-c/;
const MOTIF_NATIONAL = /\bdecret\b|\bordonnance\b|\barrete\b|\bloi\b|\bjorf\b/;

/* ── 5. APPAREILS CIBLÉS ── */
const APPAREILS = [
  ['Smartphones', /smartphones?|telephones? (mobiles?|portables?|sans fil)/],
  ['Tablettes',   /tablettes?|\btablets?\b/],
  ['IoT',         /\biot\b|internet des objets|(objets?|produits?|appareils?) connectes?/],
  ['Wearables',   /wearables?|montres? connectees?|lunettes connectees?|bracelets? connectes?/],
];

/**
 * Classe un titre.
 * @returns {{cat: string, tag: string} | null} null si hors périmètre.
 *   cat : 'eu_related' (thème européen), 'eu_red' (RED pur), 'fr' (national)
 */
export function classify(titre) {
  const t = normaliser(titre);
  if (!t) return null;

  // Exclusions : rejet immédiat
  if (EXCLUSIONS.some(m => m.test(t))) return null;

  // Périmètre : produit ciblé ou acte cible obligatoire
  if (!PERIMETRE_PRODUIT.test(t) && !PERIMETRE_ACTES.test(t)) return null;

  // Thème européen le plus fréquent
  let meilleur = null;
  for (const regle of REGLES_THEME) {
    const score = regle.motifs.filter(m => m.test(t)).length;
    if (score > 0 && (!meilleur || score > meilleur.score)) {
      meilleur = { tag: regle.tag, score };
    }
  }

  const estRED      = MOTIF_RED.test(t);
  const estNational = MOTIF_NATIONAL.test(t);

  if (estNational && (meilleur || estRED)) {
    return { cat: 'fr', tag: meilleur?.tag ?? 'Transposition FR' };
  }
  if (meilleur) return { cat: 'eu_related', tag: meilleur.tag };
  if (estRED)   return { cat: 'eu_red', tag: 'Normes RED' };

  return null;
}

/**
 * Déduit les appareils concernés à partir du titre.
 * @returns {string[]} ex. ['Smartphones','Tablettes'], ou ['Transversal'].
 */
export function detectDevices(titre) {
  const t = normaliser(titre);
  const trouves = APPAREILS.filter(([, motif]) => motif.test(t)).map(([nom]) => nom);
  return trouves.length ? trouves : ['Transversal'];
}
