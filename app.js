/* ============================================================
   RED Monitor — app.js — v2.3
   Veille réglementaire équipements radio (Directive 2014/53/UE)
   ============================================================ */

var APP_VERSION = '2.3';

// ─── DONNÉES RÉGLEMENTAIRES ───────────────────────────────────────────────────
var DATA = [
  {id:"red-1", cat:"eu_red", tag:"Normes RED", isNew:false,
   ref:"Directive 2014/53/UE — RED",
   title:"Directive RED — Equipements radioelectriques (texte de reference)",
   date:"16/04/2014", apply:"13/06/2016", type:"Directive UE",
   devices:["Smartphones","IoT","Routeurs","Wearables","SRD","Drones"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014L0053",
   summary:"Texte fondateur de la directive RED. Fixe les exigences essentielles de securite, compatibilite electromagnetique et utilisation efficace du spectre pour tous les equipements radioelectriques mis sur le marche UE. Tout appareil emettant ou recevant des ondes radio doit y etre conforme pour porter le marquage CE."},

  {id:"red-2", cat:"eu_red", tag:"Normes RED", isNew:false,
   ref:"Decision d'execution (UE) 2022/2444",
   title:"Normes harmonisees RED publiees au JOUE — liste consolidee 2022",
   date:"13/12/2022", apply:"En vigueur", type:"Decision d'execution",
   devices:["Smartphones","IoT","Routeurs","SRD","Wearables"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022D2444",
   summary:"Liste consolidee des normes harmonisees RED publiees au Journal officiel de l'UE. Les fabricants qui respectent ces normes beneficient de la presomption de conformite aux exigences essentielles RED."},

  {id:"red-3", cat:"eu_red", tag:"Cybersecurite RED", isNew:false,
   ref:"Reglement delegue (UE) 2022/30",
   title:"Acte delegue cybersecurite RED — Art. 3(3)(d)(e)(f) — Applicable depuis 01/08/2025",
   date:"29/10/2021", apply:"01/08/2025 au 10/12/2027", type:"Reglement delegue",
   devices:["Smartphones","IoT","Smartwatches","SmartGlasses","Routeurs","Cameras connectees"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0030",
   summary:"En vigueur depuis le 01/08/2025 pour tous les appareils connectes a internet. Obligations : protection des donnees personnelles, protection contre les acces non autorises, absence de fonctions frauduleuses. Ce reglement sera abroge le 11/12/2027 lors de la pleine application du Cyber Resilience Act (CRA)."},

  {id:"cra-rapport", cat:"eu_related", tag:"Cybersecurite", isNew:true,
   ref:"Reglement (UE) 2024/2847 — CRA Art. 64",
   title:"Cyber Resilience Act — Obligations de declaration vulnerabilites et incidents",
   date:"23/10/2024", apply:"11/09/2026", type:"Reglement UE",
   devices:["Smartphones","Tablettes","Smartwatches","SmartGlasses","Routeurs","IoT"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
   summary:"Des le 11 septembre 2026, les fabricants doivent declarer toute vulnerabilite activement exploitee et tout incident grave a l'ENISA dans un delai de 24 heures."},

  {id:"cra-1", cat:"eu_related", tag:"Cybersecurite", isNew:true,
   ref:"Reglement (UE) 2024/2847 — CRA pleine application",
   title:"Cyber Resilience Act — Pleine application toutes classes (I et II)",
   date:"23/10/2024", apply:"11/12/2027", type:"Reglement UE",
   devices:["Smartphones","Tablettes","Smartwatches","SmartGlasses","Routeurs","IoT","Cameras connectees","Passerelles domotiques"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R2847",
   summary:"A partir du 11/12/2027, tout produit numerique mis sur le marche UE doit satisfaire l'ensemble des exigences CRA : interdiction des mots de passe par defaut, correctifs de securite pendant toute la duree de vie, conformite evaluee."},

  {id:"espr-base", cat:"eu_related", tag:"Econception", isNew:false,
   ref:"Reglement (UE) 2024/1781 — ESPR",
   title:"ESPR — Reglement ecoconception pour produits durables (base)",
   date:"28/06/2024", apply:"19/07/2024", type:"Reglement UE",
   devices:["Smartphones","Tablettes","Wearables","Liseuses","IoT grand public"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781",
   summary:"Reglement cadre en vigueur depuis le 19/07/2024. Remplace la directive Ecoconception 2009/125/CE. Instaure le Passeport Numerique de Produit (DNP), les scores de reparabilite et les criteres de durabilite."},

  {id:"espr-phones", cat:"eu_related", tag:"Econception", isNew:true,
   ref:"Acte delegue ESPR smartphones — non encore publie au JOUE",
   title:"ESPR — Durabilite et reparabilite smartphones et tablettes",
   date:"En cours de publication", apply:"28/06/2026 (prevu)", type:"Acte delegue attendu",
   devices:["Smartphones","Tablettes","Liseuses connectees"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781",
   summary:"L'acte delegue specifique aux smartphones n'est pas encore publie au JOUE. Il imposera des juin 2026 : resistance IP54 minimum, mises a jour logicielles garanties 5 ans, pieces detachees 7 ans, score de reparabilite obligatoire sur l'emballage."},

  {id:"espr-wearables", cat:"eu_related", tag:"Econception", isNew:false,
   ref:"Acte delegue ESPR wearables — en preparation",
   title:"ESPR — Smartwatches, trackers fitness, ecouteurs, SmartGlasses",
   date:"En preparation", apply:"Horizon 2027", type:"Acte delegue attendu",
   devices:["Smartwatches","Trackers fitness","Ecouteurs sans fil","SmartGlasses"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1781",
   summary:"L'acte delegue specifique aux wearables est en cours de preparation. Il devrait imposer batterie remplacable, score de reparabilite affiche et duree de vie garantie."},

  {id:"data-1", cat:"eu_related", tag:"Donnees IoT", isNew:false,
   ref:"Reglement (UE) 2023/2854 — Data Act",
   title:"Data Act — Acces aux donnees des objets connectes — Applicable depuis 12/09/2025",
   date:"22/12/2023", apply:"12/09/2025 (en vigueur)", type:"Reglement UE",
   devices:["Smartphones","IoT","Smartwatches","Electromenager connecte","Vehicules connectes"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R2854",
   summary:"Applicable depuis le 12 septembre 2025. Les utilisateurs ont le droit legal de recuperer et transferer leurs donnees generees par leurs appareils."},

  {id:"ai-1", cat:"eu_related", tag:"Intelligence Artificielle", isNew:false,
   ref:"Reglement (UE) 2024/1689 — AI Act",
   title:"AI Act — IA embarquee dans les appareils connectes",
   date:"12/07/2024", apply:"02/08/2026", type:"Reglement UE",
   devices:["Smartphones","SmartGlasses","Wearables sante","IoT decision autonome"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
   summary:"Application progressive : pratiques IA interdites depuis le 02/02/2025, systemes a haut risque et IA embarquee dans les appareils connectes depuis le 02/08/2026."},

  {id:"empco-1", cat:"eu_related", tag:"Greenwashing", isNew:false,
   ref:"Directive (UE) 2024/825 — EmpCo",
   title:"EmpCo — Interdiction allegations environnementales non prouvees",
   date:"06/03/2024", apply:"27/09/2026", type:"Directive",
   devices:["Tous appareils RED"],
   link:"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024L0825",
   summary:"12 nouvelles pratiques commerciales trompeuses interdites, dont l'allegation neutre en carbone par compensation. Toute allegation ecologique doit etre prouvee par
