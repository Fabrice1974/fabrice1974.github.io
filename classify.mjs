/**
 * classify.mjs — Règles de pertinence et de classement (RED Monitor)
 * Source unique de vérité : scrape.mjs, nettoyer-data.mjs, test-classify.mjs.
 *
 * Logique :
 *  1. Exclusions explicites (agricole, drones, fiscal, etc.) : rejet immédiat.
 *  2. Actes précis (CRA, EmpCo, Data Act, écoconception smartphones) : retenus seuls.
 *  3. Thèmes généraux (IA, batteries, écoconception générique) : retenus
 *     uniquement si le texte vise aussi un produit ciblé ou la directive RED.
 *  4. Sans correspondance : null (hors périmètre). Aucune catégorie par défaut.
 */

/** Met en minuscules et supprime les accents. */
export function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/* ── 1. EXCLUSIONS ── */
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

/* ── 2. PRODUIT CIBLÉ OU DIRECTIVE RED ── */
const PERIMETRE_PRODUIT = /smartphones?|telephones? (mobiles?|portables?|sans fil)|tablettes?|\btablets?\b|\biot\b|internet des objets|(objets?|produits?|appareils?) connectes?|wearables?|montres? connectees?|lunettes connectees?|bracelets? connectes?|equipements? radioelectriques?|radio equipment|equipements? terminaux?|2014\/53|2014r0053|2014l0053|chargeur.{0,30}(usb|universel|commun)|usb-c/;

/* ── 3. RÈGLES PAR THÈME ──
 * directs     : citation précise, retenue même sans produit.
 * thematiques : retenus seulement si PERIMETRE_PRODUIT est vrai.
 */
const REGLES_THEME = [
  { tag: 'Cybersécurité',
    directs: [/cyber.?resilience act|2024\/2847|2024r2847/],
    thematiques: [/cyber.?resilien|\bcra\b/] },
  { tag: 'Écoconception',
    directs: [/2023\/1670|2023r1670/],
    thematiques: [/ecoconception|ecodesign|\bespr\b|reparabilite|2009\/125|2009l0125|2024\/1781|2024r1781/] },  // ESPR : numéro à vérifier
  { tag: 'Greenwashing',
    directs: [/greenwashing|empco|allegations? environnementales?|2024\/825|2024l0825/],
    thematiques: [] },
  { tag: 'Données / IoT',
    directs: [/data act|2023\/2854|2023r2854/],
    thematiques: [] },
  { tag: 'Intelligence Artificielle',
    directs: [],
    thematiques: [/intelligence artificielle|ai act|2024\/1689|2024r1689/] },
  { tag: 'Batteries',
    directs: [],
    thematiques: [/2023\/1542|2023r1542|remplacable|batteries?/] },
];

/* ── 4. RED ET DOCUMENTS NATIONAUX ── */
const MOTIF_RED      = /radioelectri|radio equipment|2014\/53|2014r0053|2014l0053|equipements? terminaux?|chargeur.{0,30}(usb|universel|commun)|usb-c/;
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

  // 1. Exclusions : rejet immédiat
  if (EXCLUSIONS.some(m => m.test(t))) return null;

  // 2. Contexte produit
  const produitCible = PERIMETRE_PRODUIT.test(t);
  const estRED       = MOTIF_RED.test(t);
  const estNational  = MOTIF_NATIONAL.test(t);

  // 3. Thème dominant : les citations précises comptent toujours,
  //    les thèmes généraux seulement avec un produit ciblé
  let meilleur = null;
  for (const regle of REGLES_THEME) {
    const score =
      regle.directs.filter(m => m.test(t)).length +
      (produitCible ? regle.thematiques.filter(m => m.test(t)).length : 0);
    if (score > 0 && (!meilleur || score > meilleur.score)) {
      meilleur = { tag: regle.tag, score };
    }
  }

  // 4. Classement
  if (estNational && (meilleur || estRED)) {
    return { cat: 'fr', tag: meilleur?.tag ?? 'Transposition FR' };
  }
  if (meilleur) return { cat: 'eu_related', tag: meilleur.tag };
  if (estRED)   return { cat: 'eu_red', tag: 'Normes RED' };

  // 5. Hors périmètre
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
