/** Offres de démonstration (seed avec SEED_DEMO=true). */
import { PackageCategory } from '@prisma/client';

const doc = (...paragraphs: string[]) => ({
  type: 'doc',
  content: paragraphs.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
});

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export interface DemoPackage {
  destination: string; // name_en de la destination
  slug: string;
  title_fr: string;
  title_ar: string;
  title_en: string;
  description_fr: string;
  description_ar: string;
  description_en: string;
  category: PackageCategory;
  duration_days: number;
  base_price: number;
  max_capacity: number;
  featured: boolean;
  gallery: string[];
  included: string[];
  excluded: string[];
  days: { title_fr: string; title_ar: string; title_en: string; text: string; accommodation?: string }[];
}

export const demoPackages: DemoPackage[] = [
  {
    destination: 'Tozeur & the Sahara',
    slug: 'circuit-grand-sud-tozeur-douz',
    title_fr: 'Circuit Grand Sud : Tozeur, Douz & Matmata',
    title_ar: 'جولة الجنوب الكبير: توزر، دوز ومطماطة',
    title_en: 'Great South Tour: Tozeur, Douz & Matmata',
    description_fr: "Cinq jours au cœur du Sahara tunisien : oasis de montagne de Chebika et Tamerza, traversée du chott el Jérid au lever du soleil, nuit sous tente berbère à Douz et maisons troglodytes de Matmata.",
    description_ar: 'خمسة أيام في قلب الصحراء التونسية: واحات الشبيكة وتمغزة الجبلية، عبور شط الجريد عند شروق الشمس، ليلة في خيمة بربرية بدوز ومنازل مطماطة المحفورة.',
    description_en: 'Five days in the heart of the Tunisian Sahara: the mountain oases of Chebika and Tamerza, a sunrise crossing of Chott el Djerid, a night in a Berber tent in Douz and the troglodyte houses of Matmata.',
    category: PackageCategory.circuit,
    duration_days: 5,
    base_price: 1290,
    max_capacity: 24,
    featured: true,
    gallery: [img('photo-1509316785289-025f5b846b35'), img('photo-1547234935-80c7145ec969'), img('photo-1473580044384-7ba9967e16a0')],
    included: ['Transport en 4x4 climatisé', 'Hébergement 4 nuits (hôtels 4* + bivouac)', 'Pension complète', 'Guide francophone', 'Balade à dos de dromadaire'],
    excluded: ['Vols internationaux', 'Boissons', 'Pourboires', 'Assurance voyage'],
    days: [
      { title_fr: 'Tunis → Tozeur', title_ar: 'تونس ← توزر', title_en: 'Tunis → Tozeur', text: 'Vol intérieur vers Tozeur, visite de la médina en briques ocre et coucher de soleil sur la palmeraie.', accommodation: 'Hôtel 4* Tozeur' },
      { title_fr: 'Oasis de montagne', title_ar: 'واحات الجبل', title_en: 'Mountain oases', text: 'Chebika, Tamerza et Mides en 4x4, baignade dans la cascade de Tamerza.', accommodation: 'Hôtel 4* Tozeur' },
      { title_fr: 'Chott el Jérid → Douz', title_ar: 'شط الجريد ← دوز', title_en: 'Chott el Djerid → Douz', text: 'Traversée du lac salé au lever du jour puis entrée dans le Grand Erg Oriental. Méharée au coucher du soleil.', accommodation: 'Bivouac sous tente berbère' },
      { title_fr: 'Matmata', title_ar: 'مطماطة', title_en: 'Matmata', text: 'Découverte des maisons troglodytes et déjeuner chez l’habitant.', accommodation: 'Hôtel 4* Douz' },
      { title_fr: 'Retour', title_ar: 'العودة', title_en: 'Return', text: 'Transfert vers l’aéroport de Tozeur et vol retour vers Tunis.' },
    ],
  },
  {
    destination: 'Djerba',
    slug: 'sejour-djerba-all-inclusive',
    title_fr: 'Séjour Djerba — 7 nuits en all inclusive',
    title_ar: 'إقامة في جربة — 7 ليالٍ شاملة كليًا',
    title_en: 'Djerba Stay — 7 nights all inclusive',
    description_fr: 'Une semaine de détente sur la plage de Sidi Mahrez dans un hôtel 5* les pieds dans l’eau, avec excursion à Houmt Souk et à la synagogue de la Ghriba.',
    description_ar: 'أسبوع من الاسترخاء على شاطئ سيدي محرز في فندق 5 نجوم مطل على البحر، مع رحلة إلى حومة السوق وكنيس الغريبة.',
    description_en: 'A relaxing week on Sidi Mahrez beach in a 5* beachfront hotel, with an excursion to Houmt Souk and the El Ghriba synagogue.',
    category: PackageCategory.sejour,
    duration_days: 8,
    base_price: 1850,
    max_capacity: 40,
    featured: true,
    gallery: [img('photo-1507525428034-b723cf961d3e'), img('photo-1571896349842-33c89424de2d'), img('photo-1540541338287-41700207dee6')],
    included: ['Hôtel 5* en formule tout compris', 'Transferts aéroport', 'Excursion Houmt Souk', 'Accès spa'],
    excluded: ['Vols', 'Activités nautiques motorisées', 'Taxe de séjour'],
    days: [
      { title_fr: 'Arrivée à Djerba', title_ar: 'الوصول إلى جربة', title_en: 'Arrival in Djerba', text: 'Accueil à l’aéroport de Djerba-Zarzis et transfert à l’hôtel.', accommodation: 'Hôtel 5* Sidi Mahrez' },
      { title_fr: 'Plage & détente', title_ar: 'الشاطئ والاسترخاء', title_en: 'Beach & relaxation', text: 'Journées libres en formule tout compris.', accommodation: 'Hôtel 5* Sidi Mahrez' },
      { title_fr: 'Houmt Souk & Guellala', title_ar: 'حومة السوق وقلالة', title_en: 'Houmt Souk & Guellala', text: 'Souks, fort Borj el Kebir, village des potiers de Guellala et la Ghriba.', accommodation: 'Hôtel 5* Sidi Mahrez' },
      { title_fr: 'Départ', title_ar: 'المغادرة', title_en: 'Departure', text: 'Transfert vers l’aéroport.' },
    ],
  },
  {
    destination: 'Tunis & Carthage',
    slug: 'excursion-carthage-sidi-bou-said',
    title_fr: 'Excursion Carthage, Sidi Bou Saïd & Médina de Tunis',
    title_ar: 'رحلة قرطاج وسيدي بوسعيد ومدينة تونس العتيقة',
    title_en: 'Carthage, Sidi Bou Said & Tunis Medina day trip',
    description_fr: "Une journée pour remonter 3000 ans d'histoire : thermes d'Antonin, colline de Byrsa, musée du Bardo et ruelles bleues et blanches de Sidi Bou Saïd.",
    description_ar: 'يوم واحد لاستكشاف 3000 عام من التاريخ: حمامات أنطونيوس، تلة بيرصا، متحف باردو وأزقة سيدي بوسعيد الزرقاء والبيضاء.',
    description_en: "One day to travel through 3,000 years of history: the Antonine Baths, Byrsa Hill, the Bardo Museum and the blue-and-white lanes of Sidi Bou Said.",
    category: PackageCategory.excursion,
    duration_days: 1,
    base_price: 145,
    max_capacity: 16,
    featured: true,
    gallery: [img('photo-1590059390047-f5e617690a0b'), img('photo-1568797629192-789acf8e4df3')],
    included: ['Transport en minibus', 'Guide conférencier', 'Entrées des sites', 'Déjeuner de poisson'],
    excluded: ['Boissons', 'Pourboires'],
    days: [
      { title_fr: 'Carthage, Bardo & Sidi Bou Saïd', title_ar: 'قرطاج، باردو وسيدي بوسعيد', title_en: 'Carthage, Bardo & Sidi Bou Said', text: 'Matin : sites puniques et romains de Carthage. Déjeuner à La Goulette. Après-midi : musée du Bardo et thé à la menthe au Café des Délices.' },
    ],
  },
  {
    destination: 'Makkah & Madinah',
    slug: 'omra-ramadan-15-jours',
    title_fr: 'Omra — 15 jours, hôtels proches du Haram',
    title_ar: 'عمرة — 15 يومًا، فنادق قريبة من الحرم',
    title_en: 'Umrah — 15 days, hotels near the Haram',
    description_fr: 'Omra accompagnée par un encadrant religieux : 8 nuits à La Mecque et 6 nuits à Médine en hôtels 4* à moins de 300 m du Haram, visa et vols inclus.',
    description_ar: 'عمرة مع مرافق ديني: 8 ليالٍ في مكة المكرمة و6 ليالٍ في المدينة المنورة في فنادق 4 نجوم على بعد أقل من 300 متر من الحرم، التأشيرة والطيران مشمولان.',
    description_en: 'Guided Umrah with a religious supervisor: 8 nights in Makkah and 6 nights in Madinah in 4* hotels less than 300 m from the Haram, visa and flights included.',
    category: PackageCategory.omra,
    duration_days: 15,
    base_price: 6900,
    max_capacity: 45,
    featured: true,
    gallery: [img('photo-1591604129939-f1efa4d9f7fa'), img('photo-1565552645632-d725f8bfc19a')],
    included: ['Vols Tunis–Djeddah A/R', 'Visa Omra', 'Hôtels 4* proches du Haram', 'Petits-déjeuners', 'Transferts en bus', 'Encadrement religieux'],
    excluded: ['Déjeuners et dîners', 'Dépenses personnelles'],
    days: [
      { title_fr: 'Tunis → Djeddah → La Mecque', title_ar: 'تونس ← جدة ← مكة', title_en: 'Tunis → Jeddah → Makkah', text: 'Vol vers Djeddah, transfert à La Mecque et accomplissement de la Omra avec l’encadrant.', accommodation: 'Hôtel 4* La Mecque' },
      { title_fr: 'Séjour à La Mecque', title_ar: 'الإقامة في مكة', title_en: 'Stay in Makkah', text: 'Prières au Haram et visites des lieux saints (Arafat, Mina, Jabal al-Nour).', accommodation: 'Hôtel 4* La Mecque' },
      { title_fr: 'Médine', title_ar: 'المدينة المنورة', title_en: 'Madinah', text: 'Transfert en bus vers Médine, visite de la mosquée du Prophète, Quba et Uhud.', accommodation: 'Hôtel 4* Médine' },
      { title_fr: 'Retour', title_ar: 'العودة', title_en: 'Return', text: 'Vol retour Médine → Tunis.' },
    ],
  },
  {
    destination: 'Istanbul',
    slug: 'circuit-istanbul-cappadoce',
    title_fr: 'Istanbul & Cappadoce — 8 jours',
    title_ar: 'إسطنبول وكابادوكيا — 8 أيام',
    title_en: 'Istanbul & Cappadocia — 8 days',
    description_fr: 'Sainte-Sophie, croisière sur le Bosphore, Grand Bazar puis vol vers la Cappadoce pour les cheminées de fées et un vol en montgolfière à l’aube.',
    description_ar: 'آيا صوفيا، رحلة بحرية على البوسفور، البازار الكبير ثم رحلة إلى كابادوكيا لمشاهدة المداخن الخرافية والتحليق بالمنطاد عند الفجر.',
    description_en: 'Hagia Sophia, a Bosphorus cruise and the Grand Bazaar, then a flight to Cappadocia for its fairy chimneys and a sunrise hot-air balloon ride.',
    category: PackageCategory.circuit,
    duration_days: 8,
    base_price: 3450,
    max_capacity: 30,
    featured: true,
    gallery: [img('photo-1524231757912-21f4fe3a7200'), img('photo-1641128324972-af3212f0f6bd'), img('photo-1527838832700-5059252407fa')],
    included: ['Vols Tunis–Istanbul A/R + vol intérieur', 'Hôtels 4*', 'Demi-pension', 'Guide francophone', 'Croisière Bosphore'],
    excluded: ['Vol en montgolfière (option 650 TND)', 'Boissons', 'Pourboires'],
    days: [
      { title_fr: 'Arrivée à Istanbul', title_ar: 'الوصول إلى إسطنبول', title_en: 'Arrival in Istanbul', text: 'Accueil et dîner de bienvenue à Sultanahmet.', accommodation: 'Hôtel 4* Sultanahmet' },
      { title_fr: 'Istanbul historique', title_ar: 'إسطنبول التاريخية', title_en: 'Historic Istanbul', text: 'Sainte-Sophie, Mosquée bleue, Topkapi et citerne Basilique.', accommodation: 'Hôtel 4* Sultanahmet' },
      { title_fr: 'Bosphore & Grand Bazar', title_ar: 'البوسفور والبازار الكبير', title_en: 'Bosphorus & Grand Bazaar', text: 'Croisière entre Europe et Asie, puis temps libre au Grand Bazar.', accommodation: 'Hôtel 4* Sultanahmet' },
      { title_fr: 'Vol vers la Cappadoce', title_ar: 'الطيران إلى كابادوكيا', title_en: 'Flight to Cappadocia', text: 'Vallée de Göreme et villages troglodytes.', accommodation: 'Hôtel troglodyte Göreme' },
    ],
  },
  {
    destination: 'Hammamet',
    slug: 'week-end-hammamet-thalasso',
    title_fr: 'Week-end Thalasso à Hammamet',
    title_ar: 'عطلة نهاية أسبوع للعلاج بمياه البحر في الحمامات',
    title_en: 'Thalasso weekend in Hammamet',
    description_fr: '3 jours de bien-être dans un centre de thalassothérapie de Yasmine Hammamet : 4 soins par jour, accès piscine d’eau de mer chauffée et hammam.',
    description_ar: '3 أيام من الاسترخاء في مركز للعلاج بمياه البحر في ياسمين الحمامات: 4 علاجات يوميًا، مسبح بمياه البحر المدفأة وحمام تقليدي.',
    description_en: '3 days of wellness in a Yasmine Hammamet thalassotherapy centre: 4 treatments a day, heated seawater pool and hammam.',
    category: PackageCategory.sejour,
    duration_days: 3,
    base_price: 690,
    max_capacity: 20,
    featured: false,
    gallery: [img('photo-1544161515-4ab6ce6db874'), img('photo-1600334129128-685c5582fd35')],
    included: ['2 nuits en hôtel 5*', 'Demi-pension', '8 soins de thalasso', 'Accès hammam et piscine'],
    excluded: ['Transport', 'Soins supplémentaires'],
    days: [
      { title_fr: 'Arrivée & premiers soins', title_ar: 'الوصول وأول العلاجات', title_en: 'Arrival & first treatments', text: 'Installation et bilan bien-être.', accommodation: 'Hôtel 5* Yasmine' },
      { title_fr: 'Journée thalasso', title_ar: 'يوم العلاج', title_en: 'Thalasso day', text: 'Enveloppement aux algues, hydromassage, massage sous affusion.', accommodation: 'Hôtel 5* Yasmine' },
      { title_fr: 'Départ', title_ar: 'المغادرة', title_en: 'Departure', text: 'Derniers soins et départ dans l’après-midi.' },
    ],
  },
  {
    destination: 'Dubai',
    slug: 'voyage-affaires-dubai-salon',
    title_fr: 'Voyage d’affaires Dubaï — salon & networking',
    title_ar: 'رحلة عمل إلى دبي — معرض وتواصل',
    title_en: 'Dubai business trip — trade fair & networking',
    description_fr: 'Formule clé en main pour les professionnels : vols, hôtel 4* à Downtown, transferts vers le Dubai World Trade Centre et dîner networking.',
    description_ar: 'باقة متكاملة للمهنيين: الطيران، فندق 4 نجوم في وسط المدينة، التنقلات إلى مركز دبي التجاري العالمي وعشاء للتواصل.',
    description_en: 'Turnkey package for professionals: flights, a 4* Downtown hotel, transfers to the Dubai World Trade Centre and a networking dinner.',
    category: PackageCategory.affaires,
    duration_days: 5,
    base_price: 4200,
    max_capacity: 25,
    featured: false,
    gallery: [img('photo-1512453979798-5ea266f8880c'), img('photo-1518684079-3c830dcef090')],
    included: ['Vols Tunis–Dubaï A/R', 'Hôtel 4* Downtown', 'Transferts salon', 'Dîner networking', 'Badge salon'],
    excluded: ['Repas non mentionnés', 'Frais de stand'],
    days: [
      { title_fr: 'Arrivée à Dubaï', title_ar: 'الوصول إلى دبي', title_en: 'Arrival in Dubai', text: 'Transfert et briefing.', accommodation: 'Hôtel 4* Downtown' },
      { title_fr: 'Salon (J1–J3)', title_ar: 'المعرض (اليوم 1–3)', title_en: 'Trade fair (D1–D3)', text: 'Navettes quotidiennes vers le DWTC.', accommodation: 'Hôtel 4* Downtown' },
      { title_fr: 'Retour', title_ar: 'العودة', title_en: 'Return', text: 'Vol retour vers Tunis.' },
    ],
  },
  {
    destination: 'Tabarka & Ain Draham',
    slug: 'escapade-tabarka-ain-draham',
    title_fr: 'Escapade nature Tabarka & Aïn Draham',
    title_ar: 'رحلة طبيعة إلى طبرقة وعين دراهم',
    title_en: 'Tabarka & Ain Draham nature getaway',
    description_fr: 'Randonnées dans les forêts de Kroumirie, plongée sur les récifs de corail de Tabarka et visite du site romain de Bulla Regia.',
    description_ar: 'جولات مشي في غابات خمير، غوص في الشعاب المرجانية بطبرقة وزيارة الموقع الروماني بلاريجيا.',
    description_en: 'Hikes in the Kroumirie forests, diving on the coral reefs of Tabarka and a visit to the Roman site of Bulla Regia.',
    category: PackageCategory.circuit,
    duration_days: 4,
    base_price: 890,
    max_capacity: 18,
    featured: false,
    gallery: [img('photo-1448375240586-882707db888b'), img('photo-1544551763-46a013bb70d5')],
    included: ['Transport', '3 nuits en hôtel 4*', 'Demi-pension', 'Baptême de plongée', 'Guide randonnée'],
    excluded: ['Déjeuners', 'Équipement personnel'],
    days: [
      { title_fr: 'Tunis → Aïn Draham', title_ar: 'تونس ← عين دراهم', title_en: 'Tunis → Ain Draham', text: 'Route par Béja, déjeuner montagnard.', accommodation: 'Hôtel 4* Aïn Draham' },
      { title_fr: 'Kroumirie', title_ar: 'خمير', title_en: 'Kroumirie', text: 'Randonnée de 12 km dans la forêt de chênes-lièges.', accommodation: 'Hôtel 4* Aïn Draham' },
      { title_fr: 'Tabarka', title_ar: 'طبرقة', title_en: 'Tabarka', text: 'Baptême de plongée et fort génois.', accommodation: 'Hôtel 4* Tabarka' },
      { title_fr: 'Bulla Regia & retour', title_ar: 'بلاريجيا والعودة', title_en: 'Bulla Regia & return', text: 'Villas romaines souterraines puis retour à Tunis.' },
    ],
  },
];

export function toItinerary(days: DemoPackage['days']) {
  return days.map((d, i) => ({
    day: i + 1,
    title_fr: d.title_fr,
    title_ar: d.title_ar,
    title_en: d.title_en,
    content_fr: doc(d.text),
    accommodation: d.accommodation,
  }));
}
