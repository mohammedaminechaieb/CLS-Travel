import { ogImage, OG_SIZE } from '@/lib/og';

export const alt = 'CLS Travel — Agence de voyage en Tunisie';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return ogImage({
    eyebrow: 'Agence de voyage — Tunisie',
    title: 'Circuits, séjours, Omra & voyages d’affaires',
    footer: 'carthagoloisirs.com',
  });
}
