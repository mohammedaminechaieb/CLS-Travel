import { isTiptapDoc, tiptapToText } from './tiptap';

describe('tiptap helpers', () => {
  const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bonjour Djerba' }] }] };

  it('accepts a valid document', () => expect(isTiptapDoc(doc)).toBe(true));
  it('rejects non documents', () => {
    expect(isTiptapDoc({ type: 'paragraph' })).toBe(false);
    expect(isTiptapDoc({ type: 'doc', content: [{ text: 1 }] })).toBe(false);
  });
  it('extracts plain text', () => expect(tiptapToText(doc).trim()).toBe('Bonjour Djerba'));
});
