#!/usr/bin/env node
/**
 * test-classify.mjs — Vérifie la classification sur des cas connus.
 * Code de sortie 1 si un cas échoue (bloque le workflow).
 */
import { classify, detectDevices } from './classify.mjs';

// [titre, catégorie attendue, tag attendu] — null = hors périmètre
const CAS_CLASSEMENT = [
  ['Règlement (UE) 2024/2847 — Cyber Resilience Act (CRA)', 'eu_related', 'Cybersécurité'],
  ['Règlement (UE) 2023/1670 — Écoconception smartphones et tablettes', 'eu_related', 'Écoconception'],
  ['Directive 2014/53/UE — Équipements radioélectriques (RED)', 'eu_red', 'Normes RED'],
  ['Règlement (UE) 2023/2854 — Data Act', 'eu_related', 'Données / IoT'],
  ['Directive (UE) 2024/825 — allégations environnementales', 'eu_related', 'Greenwashing'],
  ['Décret relatif aux équipements radioélectriques', 'fr', 'Transposition FR'],
  // Faux positifs à rejeter
  ['Décret portant nomination des membres du comité', null, null],
  ["Loi relative à l'emploi des jeunes", null, null],
  ['Liste des pharmacies de la commune de Lyon', null, null],
  ['Actualités radiophoniques du service public', null, null],
  ['Biotechnologies et patrimoine', null, null],
  ['Décision d\'exécution (UE) 2026/2539 relative aux aéronefs sans équipage à bord', null, null],
];

// [titre, appareils attendus]
const CAS_APPAREILS = [
  ['Écoconception smartphones et tablettes', ['Smartphones', 'Tablettes']],
  ['Data Act — produits connectés', ['IoT']],
  ['Montre connectée', ['Wearables']],
  ['Directive 2014/53/UE — Équipements radioélectriques', ['Transversal']],
];

let echecs = 0;

console.log('=== Test de classement ===');
for (const [titre, catAttendue, tagAttendu] of CAS_CLASSEMENT) {
  const r = classify(titre);
  const cat = r ? r.cat : null;
  const tag = r ? r.tag : null;
  const ok = cat === catAttendue && tag === tagAttendu;
  if (!ok) echecs++;
  console.log(ok ? 'OK    ' : 'ÉCHEC ', '|', (cat ?? 'hors périmètre').padEnd(16),
              '|', (tag ?? '—').padEnd(24), '|', titre.slice(0, 60));
  if (!ok) console.log(`        attendu : ${catAttendue} / ${tagAttendu}`);
}

console.log('\n=== Test des appareils ===');
for (const [titre, attendus] of CAS_APPAREILS) {
  const obtenus = detectDevices(titre);
  const ok = JSON.stringify(obtenus) === JSON.stringify(attendus);
  if (!ok) echecs++;
  console.log(ok ? 'OK    ' : 'ÉCHEC ', '|', obtenus.join(', ').padEnd(30), '|', titre.slice(0, 60));
  if (!ok) console.log(`        attendu : ${attendus.join(', ')}`);
}

console.log(echecs === 0 ? '\n✅ Tous les tests passent' : `\n❌ ${echecs} échec(s)`);
process.exitCode = echecs ? 1 : 0;
