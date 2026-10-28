/** Gabarit HTML commun des emails transactionnels CLS Travel. */
export function mailLayout(title: string, body: string, cta?: { label: string; url: string }) {
  const button = cta
    ? `<p style="margin:32px 0"><a href="${cta.url}" style="background:#C85A2A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700">${cta.label}</a></p>`
    : '';
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#FAF8F3;font-family:Inter,Arial,sans-serif;color:#1A1612">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#1C3A5E;padding:24px 32px;color:#fff;font-family:'Playfair Display',Georgia,serif;font-size:24px">CLS Travel</td></tr>
<tr><td style="padding:32px"><h1 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 16px">${title}</h1>
${body}${button}</td></tr>
<tr><td style="padding:16px 32px;background:#F1ECE2;color:#5A5042;font-size:12px">CLS Travel — Carthago Loisirs · carthagoloisirs.com<br>Cet email est envoyé automatiquement, merci de ne pas y répondre.</td></tr>
</table></td></tr></table></body></html>`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
