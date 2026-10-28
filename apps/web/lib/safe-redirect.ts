/** N'autorise que les redirections internes (évite les open redirects via ?next=). */
export function safeNext(next: string | null | undefined, fallback = '/espace-client'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
