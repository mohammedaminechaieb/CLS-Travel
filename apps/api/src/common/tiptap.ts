import { registerDecorator, type ValidationOptions } from 'class-validator';

const MAX_DEPTH = 20;
const MAX_NODES = 20_000;

/** Validation structurelle d'un document Tiptap/ProseMirror : { type: 'doc', content: [...] }. */
export function isTiptapDoc(value: unknown): boolean {
  if (!value || typeof value !== 'object' || (value as { type?: unknown }).type !== 'doc') return false;
  let count = 0;
  const walk = (node: unknown, depth: number): boolean => {
    if (++count > MAX_NODES || depth > MAX_DEPTH) return false;
    if (!node || typeof node !== 'object') return false;
    const n = node as { type?: unknown; content?: unknown; text?: unknown; marks?: unknown };
    if (typeof n.type !== 'string') return false;
    if (n.text !== undefined && typeof n.text !== 'string') return false;
    if (n.marks !== undefined && !Array.isArray(n.marks)) return false;
    if (n.content === undefined) return true;
    return Array.isArray(n.content) && n.content.every((c) => walk(c, depth + 1));
  };
  return walk(value, 0);
}

export function IsTiptapDoc(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isTiptapDoc',
      target: object.constructor,
      propertyName,
      options: { message: `${propertyName} doit être un document Tiptap valide`, ...options },
      validator: { validate: isTiptapDoc },
    });
}

/** Texte brut d'un document Tiptap (extraits, temps de lecture, recherche). */
export function tiptapToText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as { text?: string; content?: unknown[] };
  return (n.text ?? '') + (n.content ?? []).map(tiptapToText).join(' ');
}
