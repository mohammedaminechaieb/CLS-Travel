/** Articles de démonstration (SEED_DEMO=true). */
const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const h = (text: string) => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] });
const list = (...items: string[]) => ({
  type: 'bulletList',
  content: items.map((t) => ({ type: 'listItem', content: [p(t)] })),
});

export const demoPosts = [
  {
    slug: 'que-faire-a-djerba-en-une-semaine',
    title_fr: 'Que faire à Djerba en une semaine ?',
    title_ar: 'ماذا تفعل في جربة خلال أسبوع؟',
    title_en: 'What to do in Djerba in one week?',
    excerpt_fr: 'Plages, souks de Houmt Souk, poterie de Guellala : notre itinéraire idéal pour découvrir l’île des rêves.',
    excerpt_ar: 'الشواطئ، أسواق حومة السوق، فخار قلالة: مسارنا المثالي لاكتشاف جزيرة الأحلام.',
    excerpt_en: 'Beaches, Houmt Souk markets, Guellala pottery: our ideal itinerary to discover the island of dreams.',
    cover_url: 'https://images.unsplash.com/photo-1583425423320-2386622cd2e4?auto=format&fit=crop&w=1600&q=80',
    tags: ['djerba', 'plage', 'conseils'],
    body: {
      type: 'doc',
      content: [
        p('Djerba, la plus grande île d’Afrique du Nord, se découvre idéalement en sept jours.'),
        h('Jours 1 à 3 : farniente à Sidi Mahrez'),
        p('Commencez par profiter des longues plages de sable blond de la zone touristique.'),
        h('Jours 4 et 5 : culture et artisanat'),
        list('Houmt Souk et son fort Borj el Kebir', 'La synagogue de la Ghriba', 'Le village des potiers de Guellala'),
        h('Jours 6 et 7 : Djerbahood et la lagune'),
        p('Flânez parmi les fresques de street art d’Erriadh puis observez les flamants roses.'),
      ],
    },
  },
  {
    slug: 'preparer-sa-omra-checklist',
    title_fr: 'Préparer sa Omra : la checklist complète',
    title_ar: 'التحضير للعمرة: القائمة الكاملة',
    title_en: 'Preparing your Umrah: the complete checklist',
    excerpt_fr: 'Visa, vaccins, bagages, ihram : tout ce qu’il faut prévoir avant le départ.',
    excerpt_ar: 'التأشيرة، التطعيمات، الأمتعة، الإحرام: كل ما يجب تحضيره قبل السفر.',
    excerpt_en: 'Visa, vaccines, luggage, ihram: everything to plan before departure.',
    cover_url: null,
    tags: ['omra', 'conseils'],
    body: {
      type: 'doc',
      content: [
        p('Une Omra réussie se prépare plusieurs semaines à l’avance.'),
        h('Documents'),
        list('Passeport valide 6 mois après le retour', 'Visa Omra (pris en charge par CLS Travel)', 'Certificat de vaccination méningite ACYW'),
        h('Dans la valise'),
        list('Deux tenues d’ihram', 'Sandales confortables', 'Petit sac à dos pour les déplacements au Haram'),
      ],
    },
  },
  {
    slug: 'sahara-tunisien-meilleure-saison',
    title_fr: 'Sahara tunisien : quelle est la meilleure saison ?',
    title_ar: 'الصحراء التونسية: ما هو أفضل موسم؟',
    title_en: 'Tunisian Sahara: when is the best season?',
    excerpt_fr: 'D’octobre à avril, le désert offre des températures idéales pour les méharées et les nuits en bivouac.',
    excerpt_ar: 'من أكتوبر إلى أبريل، توفر الصحراء درجات حرارة مثالية لرحلات الجمال والمبيت في المخيمات.',
    excerpt_en: 'From October to April, the desert offers ideal temperatures for camel treks and bivouac nights.',
    cover_url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=80',
    tags: ['sahara', 'tozeur', 'saisons'],
    body: {
      type: 'doc',
      content: [
        p('Le Grand Sud tunisien se visite de préférence entre octobre et avril.'),
        h('Automne et printemps'),
        p('Journées douces (20–28 °C), nuits fraîches : la période parfaite pour le Festival du Sahara de Douz en décembre.'),
        h('Été'),
        p('Les températures dépassent souvent 40 °C : privilégiez alors les oasis de montagne et les départs à l’aube.'),
      ],
    },
  },
];
