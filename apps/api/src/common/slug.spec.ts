import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('strips accents and punctuation', () => {
    expect(slugify('Circuit Sud Tunisien : Tozeur & Douz — 5 jours !')).toBe(
      'circuit-sud-tunisien-tozeur-et-douz-5-jours',
    );
    expect(slugify('Séjour à Djerba')).toBe('sejour-a-djerba');
  });

  it('appends a suffix when taken', async () => {
    const taken = new Set(['omra-2026', 'omra-2026-2']);
    expect(await uniqueSlug('Omra 2026', async (s) => taken.has(s))).toBe('omra-2026-3');
  });
});
