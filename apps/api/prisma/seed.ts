/**
 * Seed initial : destinations + compte super_admin.
 * Usage : pnpm --filter @cls/api prisma:seed  (ADMIN_EMAIL / ADMIN_PASSWORD requis)
 */
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const destinations = [
  { key: 'tunis', name_fr: 'Tunis & Carthage', name_ar: 'تونس وقرطاج', name_en: 'Tunis & Carthage', country: 'Tunisie', region: 'Grand Tunis', description: 'La médina classée UNESCO, les ruines puniques de Carthage et le village bleu et blanc de Sidi Bou Saïd.', cover_url: 'https://images.unsplash.com/photo-1590059390047-f5e617690a0b?w=1600' },
  { key: 'djerba', name_fr: 'Djerba', name_ar: 'جربة', name_en: 'Djerba', country: 'Tunisie', region: 'Médenine', description: "L'île des rêves : plages de sable fin, Houmt Souk et la synagogue de la Ghriba.", cover_url: 'https://images.unsplash.com/photo-1583425423320-2386622cd2e4?w=1600' },
  { key: 'tozeur', name_fr: 'Tozeur & le Sahara', name_ar: 'توزر والصحراء', name_en: 'Tozeur & the Sahara', country: 'Tunisie', region: 'Tozeur', description: 'Oasis de montagne, chott el Jérid et dunes du Grand Erg Oriental.', cover_url: 'https://images.unsplash.com/photo-1548019979-e49b7c8a4a0c?w=1600' },
  { key: 'hammamet', name_fr: 'Hammamet', name_ar: 'الحمامات', name_en: 'Hammamet', country: 'Tunisie', region: 'Nabeul', description: 'Station balnéaire emblématique, médina fortifiée et jardins de jasmin.', cover_url: 'https://images.unsplash.com/photo-1589395937772-f67057e233a6?w=1600' },
  { key: 'sousse', name_fr: 'Sousse & Monastir', name_ar: 'سوسة والمنستير', name_en: 'Sousse & Monastir', country: 'Tunisie', region: 'Sahel', description: 'La perle du Sahel, son ribat et sa médina classée.', cover_url: null },
  { key: 'tabarka', name_fr: 'Tabarka & Aïn Draham', name_ar: 'طبرقة وعين دراهم', name_en: 'Tabarka & Ain Draham', country: 'Tunisie', region: 'Jendouba', description: 'Forêts de chênes-lièges, fonds marins coralliens et festival de jazz.', cover_url: null },
  { key: 'mecque', name_fr: 'La Mecque & Médine', name_ar: 'مكة المكرمة والمدينة المنورة', name_en: 'Makkah & Madinah', country: 'Arabie saoudite', region: 'Hijaz', description: 'Omra et pèlerinage accompagnés, hôtels proches du Haram.', cover_url: null },
  { key: 'istanbul', name_fr: 'Istanbul', name_ar: 'إسطنبول', name_en: 'Istanbul', country: 'Turquie', region: 'Marmara', description: 'Sainte-Sophie, le Bosphore et le Grand Bazar.', cover_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600' },
  { key: 'dubai', name_fr: 'Dubaï', name_ar: 'دبي', name_en: 'Dubai', country: 'Émirats arabes unis', region: null, description: 'Gratte-ciel, désert et shopping — idéal pour les voyages d’affaires.', cover_url: null },
  { key: 'paris', name_fr: 'Paris', name_ar: 'باريس', name_en: 'Paris', country: 'France', region: 'Île-de-France', description: 'La ville lumière : musées, gastronomie et salons professionnels.', cover_url: null },
  { key: 'caire', name_fr: 'Le Caire & Louxor', name_ar: 'القاهرة والأقصر', name_en: 'Cairo & Luxor', country: 'Égypte', region: null, description: 'Pyramides de Gizeh, croisière sur le Nil et temples de Louxor.', cover_url: null },
  { key: 'marrakech', name_fr: 'Marrakech', name_ar: 'مراكش', name_en: 'Marrakech', country: 'Maroc', region: 'Marrakech-Safi', description: 'Place Jemaa el-Fna, riads et contreforts de l’Atlas.', cover_url: null },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis pour le seed');
  }

  for (const { key, ...data } of destinations) {
    // upsert manuel sur name_en → seed idempotent
    const existing = await prisma.destination.findFirst({ where: { name_en: data.name_en } });
    if (existing) {
      await prisma.destination.update({ where: { id: existing.id }, data });
    } else {
      await prisma.destination.create({ data });
    }
    console.log(`  ✓ destination ${key}`);
  }

  const password_hash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { role: Role.super_admin },
    create: {
      email: adminEmail.toLowerCase(),
      password_hash,
      role: Role.super_admin,
      first_name: 'Admin',
      last_name: 'CLS Travel',
      is_verified: true,
    },
  });
  console.log(`  ✓ super_admin ${adminEmail}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
