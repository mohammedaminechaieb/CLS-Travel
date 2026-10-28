import { escapeHtml, mailLayout } from '../mail/mail.layout';

export interface BookingMailData {
  firstName: string;
  reference: string;
  packageTitle: string;
  departure: Date;
  returnDate: Date;
  participants: number;
  total: string;
  paid: string;
  url: string;
}

const fmtDate = (d: Date) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(d);
const tnd = (v: string) => `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;

function summary(b: BookingMailData) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#5A5042">${k}</td><td style="padding:6px 0;text-align:right;font-weight:600">${v}</td></tr>`;
  return `<table role="presentation" width="100%" style="border-top:1px solid #E2DBCD;border-bottom:1px solid #E2DBCD;margin:16px 0">
${row('Référence', escapeHtml(b.reference))}${row('Voyage', escapeHtml(b.packageTitle))}
${row('Dates', `${fmtDate(b.departure)} → ${fmtDate(b.returnDate)}`)}${row('Voyageurs', String(b.participants))}
${row('Total', tnd(b.total))}${row('Déjà réglé', tnd(b.paid))}</table>`;
}

export const emailTemplates = {
  bookingCreated: (b: BookingMailData) => ({
    subject: `Réservation ${b.reference} enregistrée — CLS Travel`,
    html: mailLayout(
      'Votre réservation est enregistrée',
      `<p>Bonjour ${escapeHtml(b.firstName)},</p><p>Nous avons bien reçu votre demande. Réglez l’acompte pour garantir vos places.</p>${summary(b)}`,
      { label: 'Finaliser le paiement', url: b.url },
    ),
    text: `Réservation ${b.reference} enregistrée. ${b.url}`,
  }),

  bookingConfirmed: (b: BookingMailData) => ({
    subject: `Réservation ${b.reference} confirmée ✈ — CLS Travel`,
    html: mailLayout(
      'Votre voyage est confirmé !',
      `<p>Bonjour ${escapeHtml(b.firstName)},</p><p>Excellente nouvelle : votre réservation est confirmée. Votre confirmation PDF est disponible dans votre espace client.</p>${summary(b)}`,
      { label: 'Voir ma réservation', url: b.url },
    ),
    text: `Réservation ${b.reference} confirmée. ${b.url}`,
  }),

  bookingStatus: (b: BookingMailData, status: 'cancelled' | 'completed') => ({
    subject:
      status === 'cancelled'
        ? `Réservation ${b.reference} annulée — CLS Travel`
        : `Merci d’avoir voyagé avec CLS Travel — ${b.reference}`,
    html: mailLayout(
      status === 'cancelled' ? 'Votre réservation a été annulée' : 'Bon retour parmi nous !',
      status === 'cancelled'
        ? `<p>Bonjour ${escapeHtml(b.firstName)},</p><p>Votre réservation ${escapeHtml(b.reference)} a été annulée. Votre agent reste disponible pour toute question sur un éventuel remboursement.</p>`
        : `<p>Bonjour ${escapeHtml(b.firstName)},</p><p>Nous espérons que votre voyage « ${escapeHtml(b.packageTitle)} » vous a plu. Partagez votre avis pour aider les futurs voyageurs !</p>`,
      { label: status === 'cancelled' ? 'Contacter mon agent' : 'Donner mon avis', url: b.url },
    ),
    text: `${b.reference} : ${status}. ${b.url}`,
  }),

  paymentReceipt: (b: BookingMailData, amount: string, currency: string, type: string) => ({
    subject: `Reçu de paiement ${b.reference} — CLS Travel`,
    html: mailLayout(
      'Paiement reçu',
      `<p>Bonjour ${escapeHtml(b.firstName)},</p><p>Nous confirmons la réception de votre paiement (${escapeHtml(type)}) de <strong>${escapeHtml(amount)} ${escapeHtml(currency)}</strong>.</p>${summary(b)}<p>Votre facture est téléchargeable depuis votre espace client.</p>`,
      { label: 'Télécharger ma facture', url: b.url },
    ),
    text: `Paiement de ${amount} ${currency} reçu pour ${b.reference}.`,
  }),

  paymentFailed: (b: BookingMailData) => ({
    subject: `Échec du paiement ${b.reference} — CLS Travel`,
    html: mailLayout(
      'Votre paiement n’a pas abouti',
      `<p>Bonjour ${escapeHtml(b.firstName)},</p><p>Le paiement de votre réservation ${escapeHtml(b.reference)} a échoué. Aucun montant n’a été débité. Vous pouvez réessayer à tout moment.</p>`,
      { label: 'Réessayer le paiement', url: b.url },
    ),
    text: `Échec du paiement pour ${b.reference}. ${b.url}`,
  }),

  newMessage: (firstName: string, reference: string, url: string) => ({
    subject: `Nouveau message concernant ${reference} — CLS Travel`,
    html: mailLayout(
      'Vous avez un nouveau message',
      `<p>Bonjour ${escapeHtml(firstName)},</p><p>Votre agent vous a écrit au sujet de la réservation ${escapeHtml(reference)}.</p>`,
      { label: 'Lire le message', url },
    ),
    text: `Nouveau message pour ${reference} : ${url}`,
  }),
};
