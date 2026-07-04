// ============================================================
// OgouMEDICAL — Base CIM-10 (classification OMS)
// Recherche locale sur un sous-set de codes fréquents en CI.
// Conçu par Romain OGOU (ogouromain@gmail.com | +225 05 76 10 32 77)
// ============================================================

export interface Icd10Entry {
  code: string;
  label: string;
  category: string;
  /** Sous-groupe clinique (pour filtres UI). */
  group:
    | "infectieux"
    | "cardiovasculaire"
    | "metabolique"
    | "respiratoire"
    | "digestif"
    | "gynecologie"
    | "pediatrie"
    | "traumatologie"
    | "mental"
    | "autre";
}

/**
 * Sous-set CIM-10 — codes fréquemment utilisés en médecine de ville ivoirienne.
 * En production : interroger la base CIM-10 complète (Supabase) ou l'API OMS.
 */
export const ICD10_ENTRIES: Icd10Entry[] = [
  // Infectieux
  { code: "A00", label: "Choléra", category: "Maladies intestinales infectieuses", group: "infectieux" },
  { code: "A00.0", label: "Choléra à Vibrio cholerae 01, biovar cholerae", category: "Maladies intestinales infectieuses", group: "infectieux" },
  { code: "A01", label: "Fièvres typhoïde et paratyphoïde", category: "Maladies intestinales infectieuses", group: "infectieux" },
  { code: "A01.0", label: "Fièvre typhoïde", category: "Maladies intestinales infectieuses", group: "infectieux" },
  { code: "A09", label: "Diarrhée et gastro-entérite présumée d'origine infectieuse", category: "Maladies intestinales infectieuses", group: "infectieux" },
  { code: "B50", label: "Paludisme à Plasmodium falciparum", category: "Paludisme", group: "infectieux" },
  { code: "B50.0", label: "Paludisme à Plasmodium falciparum avec complications cérébrales", category: "Paludisme", group: "infectieux" },
  { code: "B54", label: "Paludisme, sans précision", category: "Paludisme", group: "infectieux" },
  { code: "A15", label: "Tuberculose de l'appareil respiratoire, confirmée bactériologiquement et histologiquement", category: "Tuberculose", group: "infectieux" },
  { code: "A16", label: "Tuberculose de l'appareil respiratoire, sans confirmation bactériologique ou histologique", category: "Tuberculose", group: "infectieux" },
  { code: "B20", label: "Maladie à VIH à l'origine de maladies infectieuses et parasitaires", category: "VIH/SIDA", group: "infectieux" },
  { code: "B24", label: "Maladie à VIH, sans précision", category: "VIH/SIDA", group: "infectieux" },
  { code: "A90", label: "Dengue [dengue classique]", category: "Arboviroses", group: "infectieux" },
  { code: "A91", label: "Dengue hémorragique", category: "Arboviroses", group: "infectieux" },
  { code: "A92.0", label: "Fièvre de la vallée du Rift", category: "Arboviroses", group: "infectieux" },
  { code: "A95", label: "Fièvre jaune", category: "Arboviroses", group: "infectieux" },
  { code: "A98.0", label: "Fièvre hémorragique à virus Ebola", category: "Fièvres virales hémorragiques", group: "infectieux" },
  { code: "A30", label: "Lèpre", category: "Maladies bactériennes", group: "infectieux" },
  { code: "A33", label: "Tétanos néonatal", category: "Maladies bactériennes", group: "infectieux" },
  { code: "A35", label: "Autres formes de tétanos", category: "Maladies bactériennes", group: "infectieux" },
  { code: "A36", label: "Coqueluche", category: "Maladies bactériennes", group: "infectieux" },
  { code: "A37", label: "Infection à Bordetella pertussis", category: "Maladies bactériennes", group: "infectieux" },

  // Cardiovasculaire
  { code: "I10", label: "Hypertension artérielle (essentielle)", category: "Hypertension", group: "cardiovasculaire" },
  { code: "I11", label: "Cardiopathie hypertensive", category: "Hypertension", group: "cardiovasculaire" },
  { code: "I11.0", label: "Cardiopathie hypertensive avec insuffisance cardiaque", category: "Hypertension", group: "cardiovasculaire" },
  { code: "I20", label: "Angine de poitrine", category: "Cardiopathies ischémiques", group: "cardiovasculaire" },
  { code: "I20.0", label: "Angine instable", category: "Cardiopathies ischémiques", group: "cardiovasculaire" },
  { code: "I21", label: "Infarctus aigu du myocarde", category: "Cardiopathies ischémiques", group: "cardiovasculaire" },
  { code: "I21.0", label: "Infarctus aigu du myocarde avec sus-décalage ST du mur antérieur", category: "Cardiopathies ischémiques", group: "cardiovasculaire" },
  { code: "I21.9", label: "Infarctus aigu du myocarde, sans précision", category: "Cardiopathies ischémiques", group: "cardiovasculaire" },
  { code: "I25", label: "Cardiopathie ischémique chronique", category: "Cardiopathies ischémiques", group: "cardiovasculaire" },
  { code: "I50", label: "Insuffisance cardiaque", category: "Insuffisance cardiaque", group: "cardiovasculaire" },
  { code: "I50.0", label: "Insuffisance cardiaque congestive", category: "Insuffisance cardiaque", group: "cardiovasculaire" },
  { code: "I48", label: "Fibrillation auriculaire et flutter", category: "Arythmies", group: "cardiovasculaire" },
  { code: "I63", label: "Accident vasculaire cérébral ischémique", category: "AVC", group: "cardiovasculaire" },
  { code: "I63.9", label: "Accident vasculaire cérébral ischémique, sans précision", category: "AVC", group: "cardiovasculaire" },
  { code: "I64", label: "Accident vasculaire cérébral, non précisé comme hémorragique ou ischémique", category: "AVC", group: "cardiovasculaire" },
  { code: "I69", label: "Séquelles de maladies cérébrovasculaires", category: "AVC", group: "cardiovasculaire" },

  // Métabolique
  { code: "E10", label: "Diabète sucré de type 1", category: "Diabète", group: "metabolique" },
  { code: "E10.9", label: "Diabète sucré de type 1, sans précision", category: "Diabète", group: "metabolique" },
  { code: "E11", label: "Diabète sucré de type 2", category: "Diabète", group: "metabolique" },
  { code: "E11.0", label: "Diabète de type 2 avec coma", category: "Diabète", group: "metabolique" },
  { code: "E11.5", label: "Diabète de type 2 avec complications circulatoires périphériques", category: "Diabète", group: "metabolique" },
  { code: "E11.9", label: "Diabète sucré de type 2, sans précision", category: "Diabète", group: "metabolique" },
  { code: "E14", label: "Diabète sucré, sans précision", category: "Diabète", group: "metabolique" },
  { code: "E65", label: "Obésité", category: "Obésité", group: "metabolique" },
  { code: "E66", label: "Surpoids et obésité", category: "Obésité", group: "metabolique" },
  { code: "E66.0", label: "Obésité due à un excès de calories", category: "Obésité", group: "metabolique" },
  { code: "E66.9", label: "Obésité, sans précision", category: "Obésité", group: "metabolique" },
  { code: "E78", label: "Troubles du métabolisme des lipoprotéines et autres lipidémies", category: "Dyslipidémies", group: "metabolique" },
  { code: "E78.5", label: "Hyperlipidémie, sans précision", category: "Dyslipidémies", group: "metabolique" },
  { code: "E03", label: "Autres hypothyroïdies", category: "Thyroïde", group: "metabolique" },
  { code: "E03.9", label: "Hypothyroïdie, sans précision", category: "Thyroïde", group: "metabolique" },

  // Respiratoire
  { code: "J00", label: "Rhinopharyngite aiguë [coryza]", category: "Infections ORL", group: "respiratoire" },
  { code: "J01", label: "Sinusite aiguë", category: "Infections ORL", group: "respiratoire" },
  { code: "J02", label: "Pharyngite aiguë", category: "Infections ORL", group: "respiratoire" },
  { code: "J03", label: "Amygdalite aiguë", category: "Infections ORL", group: "respiratoire" },
  { code: "J06", label: "Infections aiguës des voies respiratoires supérieures, siège multiple", category: "Infections ORL", group: "respiratoire" },
  { code: "J11", label: "Grippe, virus non identifié", category: "Grippe", group: "respiratoire" },
  { code: "J11.8", label: "Grippe avec autres manifestations, virus non identifié", category: "Grippe", group: "respiratoire" },
  { code: "J20", label: "Bronchite aiguë", category: "Bronchopneumopathies", group: "respiratoire" },
  { code: "J20.9", label: "Bronchite aiguë, sans précision", category: "Bronchopneumopathies", group: "respiratoire" },
  { code: "J45", label: "Asthme", category: "Asthme", group: "respiratoire" },
  { code: "J45.0", label: "Asthme à prédominance allergique", category: "Asthme", group: "respiratoire" },
  { code: "J45.9", label: "Asthme, sans précision", category: "Asthme", group: "respiratoire" },
  { code: "J44", label: "Autres maladies pulmonaires obstructives chroniques", category: "BPCO", group: "respiratoire" },
  { code: "J44.9", label: "Maladie pulmonaire obstructive chronique, sans précision", category: "BPCO", group: "respiratoire" },
  { code: "J12", label: "Pneumonie à virus non classée ailleurs", category: "Pneumopathies", group: "respiratoire" },
  { code: "J15", label: "Pneumopathie bactérienne", category: "Pneumopathies", group: "respiratoire" },
  { code: "J18", label: "Pneumonie, micro-organisme non précisé", category: "Pneumopathies", group: "respiratoire" },
  { code: "J18.9", label: "Pneumonie, sans précision", category: "Pneumopathies", group: "respiratoire" },

  // Digestif
  { code: "K02", label: "Caries dentaires", category: "Affections dentaires", group: "digestif" },
  { code: "K29", label: "Gastrite et duodénite", category: "Affections gastriques", group: "digestif" },
  { code: "K29.7", label: "Gastrite, sans précision", category: "Affections gastriques", group: "digestif" },
  { code: "K21", label: "Reflux gastro-œsophagien", category: "Affections gastriques", group: "digestif" },
  { code: "K21.0", label: "Reflux gastro-œsophagien avec œsophagite", category: "Affections gastriques", group: "digestif" },
  { code: "K35", label: "Appendicite aiguë", category: "Appendicite", group: "digestif" },
  { code: "K35.9", label: "Appendicite aiguë, sans précision", category: "Appendicite", group: "digestif" },
  { code: "K56", label: "Occlusion intestinale sans hernie", category: "Occlusion", group: "digestif" },
  { code: "K59", label: "Constipation", category: "Troubles fonctionnels intestinaux", group: "digestif" },
  { code: "K58", label: "Syndrome de l'intestin irritable", category: "Troubles fonctionnels intestinaux", group: "digestif" },
  { code: "K80", label: "Calcul de la vesicule biliaire", category: "Voies biliaires", group: "digestif" },

  // Gynécologie / grossesse
  { code: "O00", label: "Grossesse extra-utérine", category: "Grossesse", group: "gynecologie" },
  { code: "O00.9", label: "Grossesse extra-utérine, sans précision", category: "Grossesse", group: "gynecologie" },
  { code: "O20", label: "Hémorragie au début de la grossesse", category: "Grossesse", group: "gynecologie" },
  { code: "O21", label: "Vomissements excessifs pendant la grossesse", category: "Grossesse", group: "gynecologie" },
  { code: "O80", label: "Accouchement unique spontané", category: "Accouchement", group: "gynecologie" },
  { code: "O82", label: "Accouchement unique par césarienne", category: "Accouchement", group: "gynecologie" },
  { code: "N70", label: "Salpingite et ovarite", category: "Infections gynécologiques", group: "gynecologie" },
  { code: "N72", label: "Inflammation du col de l'utérus", category: "Infections gynécologiques", group: "gynecologie" },
  { code: "N76", label: "Autres inflammations du vagin et de la vulve", category: "Infections gynécologiques", group: "gynecologie" },
  { code: "N92", label: "Menstruations abondantes, fréquentes et irrégulières", category: "Troubles menstruels", group: "gynecologie" },
  { code: "N39", label: "Autres affections de l'appareil urinaire", category: "Urologie", group: "gynecologie" },
  { code: "N39.0", label: "Infection des voies urinaires, siège non précisé", category: "Urologie", group: "gynecologie" },

  // Pédiatrie
  { code: "A04.7", label: "Entérocolite à Clostridium difficile", category: "Pédiatrie infectieuse", group: "pediatrie" },
  { code: "P05", label: "Retard de croissance et malnutrition fœtale", category: "Néonatologie", group: "pediatrie" },
  { code: "P07", label: "Troubles liés à une durée de gestation courte et à un faible poids de naissance", category: "Néonatologie", group: "pediatrie" },
  { code: "P23", label: "Pneumonite congénitale", category: "Néonatologie", group: "pediatrie" },
  { code: "E40", label: "Kwashiorkor", category: "Malnutrition", group: "pediatrie" },
  { code: "E41", label: "Marasme nutritionnel", category: "Malnutrition", group: "pediatrie" },
  { code: "E42", label: "Kwashiorkor marasmique", category: "Malnutrition", group: "pediatrie" },
  { code: "E43", label: "Malnutrition protéino-énergétique, sans précision", category: "Malnutrition", group: "pediatrie" },
  { code: "E45", label: "Retard staturo-pondéral d'origine nutritionnelle", category: "Malnutrition", group: "pediatrie" },
  { code: "E46", label: "Malnutrition protéino-énergétique, sans précision", category: "Malnutrition", group: "pediatrie" },

  // Traumatologie
  { code: "S00", label: "Lésion traumatique superficielle de la tête", category: "Traumatismes tête", group: "traumatologie" },
  { code: "S01", label: "Plaie ouverte de la tête", category: "Traumatismes tête", group: "traumatologie" },
  { code: "S02", label: "Fracture du crâne et des os de la face", category: "Fractures", group: "traumatologie" },
  { code: "S06", label: "Lésion traumatique intracrânienne", category: "Traumatismes tête", group: "traumatologie" },
  { code: "S52", label: "Fracture de l'avant-bras", category: "Fractures", group: "traumatologie" },
  { code: "S72", label: "Fracture du fémur", category: "Fractures", group: "traumatologie" },
  { code: "S82", label: "Fracture de la jambe", category: "Fractures", group: "traumatologie" },
  { code: "S93", label: "Entorse et foulure du pied", category: "Entorses", group: "traumatologie" },
  { code: "T14.0", label: "Plaie superficielle d'une région du corps non précisée", category: "Plaies", group: "traumatologie" },
  { code: "T14.1", label: "Plaie ouverte d'une région du corps non précisée", category: "Plaies", group: "traumatologie" },
  { code: "T15", label: "Corps étranger dans la conjonctive", category: "Corps étrangers", group: "traumatologie" },

  // Santé mentale
  { code: "F32", label: "Épisode dépressif", category: "Troubles de l'humeur", group: "mental" },
  { code: "F32.9", label: "Épisode dépressif, sans précision", category: "Troubles de l'humeur", group: "mental" },
  { code: "F33", label: "Trouble dépressif récurrent", category: "Troubles de l'humeur", group: "mental" },
  { code: "F41", label: "Autres troubles anxieux", category: "Troubles anxieux", group: "mental" },
  { code: "F41.1", label: "Anxiété généralisée", category: "Troubles anxieux", group: "mental" },
  { code: "F41.9", label: "Trouble anxieux, sans précision", category: "Troubles anxieux", group: "mental" },
  { code: "F43", label: "Réaction à un facteur de stress grave et troubles de l'adaptation", category: "Troubles liés au stress", group: "mental" },
  { code: "F43.1", label: "État de stress post-traumatique", category: "Troubles liés au stress", group: "mental" },
  { code: "F90", label: "Trouble hypercinétique", category: "Troubles du comportement", group: "mental" },

  // Autres / Affections courantes
  { code: "M54", label: "Dorsalgies", category: "Rhumatologie", group: "autre" },
  { code: "M54.5", label: "Douleur lombaire basse", category: "Rhumatologie", group: "autre" },
  { code: "M25.5", label: "Douleur articulaire", category: "Rhumatologie", group: "autre" },
  { code: "M79", label: "Affections des tissus mous, sans précision", category: "Rhumatologie", group: "autre" },
  { code: "R10", label: "Douleur abdominale et pelvienne", category: "Symptômes digestifs", group: "autre" },
  { code: "R10.4", label: "Douleurs abdominales autres et non précisées", category: "Symptômes digestifs", group: "autre" },
  { code: "R50", label: "Fièvre d'origine inconnue", category: "Symptômes généraux", group: "autre" },
  { code: "R50.9", label: "Fièvre, sans précision", category: "Symptômes généraux", group: "autre" },
  { code: "R51", label: "Céphalée", category: "Symptômes neurologiques", group: "autre" },
  { code: "R05", label: "Toux", category: "Symptômes respiratoires", group: "autre" },
  { code: "R11", label: "Nausées et vomissements", category: "Symptômes digestifs", group: "autre" },
  { code: "R53", label: "Malaise et fatigue", category: "Symptômes généraux", group: "autre" },
  { code: "Z00", label: "Examen médical général", category: "Préventif", group: "autre" },
  { code: "Z00.0", label: "Examen médical général de routine", category: "Préventif", group: "autre" },
  { code: "Z11", label: "Examen médical spécial de dépistage", category: "Préventif", group: "autre" },
];

/**
 * Recherche CIM-10 par terme libre ou code exact.
 * @param query texte libre (label, code, catégorie) — insensible à la casse
 * @param limit nombre maximum de résultats (défaut 25)
 */
export function searchIcd10(query: string, limit = 25): Icd10Entry[] {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return [];
  const results = ICD10_ENTRIES.filter((e) => {
    return (
      e.code.toLowerCase().startsWith(q) ||
      e.label.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  });
  return results.slice(0, limit);
}
