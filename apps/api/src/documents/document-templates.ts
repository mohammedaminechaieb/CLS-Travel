import type { Booking, Destination, Package, Payment, User } from '@prisma/client';
import { escapeHtml as e } from '../mail/mail.layout';

export type DocBooking = Booking & {
  user: Pick<User, 'first_name' | 'last_name' | 'email' | 'phone'>;
  package: Pick<Package, 'title_fr' | 'duration_days' | 'base_price' | 'included'> & { destination: Pick<Destination, 'name_fr' | 'country'> };
  payments: Payment[];
};

interface Participant {
  nom: string;
  prenom: string;
  passport: string;
  dob: string;
}

const COMPANY = {
  name: 'CLS Travel — Carthago Loisirs',
  address: 'Avenue Habib Bourguiba, 1000 Tunis, Tunisie',
  contact: 'contact@carthagoloisirs.com · +216 71 000 000 · carthagoloisirs.com',
  legal: 'Agence de voyage agréée ONTT — MF 0000000/A/M/000 — RC B000000000',
};

const date = (d: Date) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(d);
const tnd = (v: { toString(): string }) =>
  `${Number(v.toString()).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;
const TYPE_LABEL = { deposit: 'Acompte', balance: 'Solde', full: 'Règlement total' } as const;

function layout(title: string, subtitle: string, body: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box} body{font-family:Helvetica,Arial,sans-serif;color:#1A1612;font-size:11pt;margin:0}
  header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #B8872A;padding-bottom:12px;margin-bottom:20px}
  .brand{font-family:Georgia,serif;font-size:22pt;color:#1C3A5E;font-weight:bold} .brand span{color:#B8872A}
  .muted{color:#5A5042;font-size:9pt} h1{font-family:Georgia,serif;color:#1C3A5E;font-size:18pt;margin:0 0 4px}
  table{width:100%;border-collapse:collapse;margin:12px 0} th{background:#1C3A5E;color:#fff;text-align:left;padding:7px 8px;font-size:9.5pt}
  td{padding:7px 8px;border-bottom:1px solid #E2DBCD;font-size:10pt} .right{text-align:right} .box{background:#F5F1E8;border-radius:6px;padding:12px 14px;margin:12px 0}
  .grid{display:flex;gap:16px} .grid>div{flex:1} .total td{font-weight:bold;font-size:11pt;border-bottom:none} .badge{display:inline-block;padding:3px 10px;border-radius:10px;background:#1C3A5E;color:#fff;font-size:9pt}
  footer{position:fixed;bottom:0;left:0;right:0;text-align:center;font-size:8pt;color:#5A5042;border-top:1px solid #E2DBCD;padding-top:6px}
  </style></head><body>
  <header><div><div class="brand">CLS <span>Travel</span></div><div class="muted">${COMPANY.address}<br>${COMPANY.contact}</div></div>
  <div style="text-align:right"><h1>${e(title)}</h1><div class="muted">${subtitle}</div></div></header>
  ${body}
  <footer>${COMPANY.name} — ${COMPANY.legal}</footer></body></html>`;
}

function participantsTable(b: DocBooking) {
  const rows = (b.participants as unknown as Participant[])
    .map((p, i) => `<tr><td>${i + 1}</td><td>${e(p.nom.toUpperCase())}</td><td>${e(p.prenom)}</td><td>${e(p.passport)}</td><td>${e(p.dob)}</td></tr>`)
    .join('');
  return `<table><thead><tr><th>#</th><th>Nom</th><th>Prénom</th><th>Passeport</th><th>Naissance</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function confirmationHtml(b: DocBooking): string {
  const statusLabel = { pending: 'En attente', confirmed: 'Confirmée', cancelled: 'Annulée', completed: 'Terminée' }[b.status];
  return layout(
    'Confirmation de réservation',
    `Référence <strong>${e(b.reference)}</strong><br>Émise le ${date(new Date())}`,
    `<div class="grid">
      <div class="box"><strong>Client</strong><br>${e(b.user.first_name)} ${e(b.user.last_name)}<br>${e(b.user.email)}${b.user.phone ? `<br>${e(b.user.phone)}` : ''}</div>
      <div class="box"><strong>Statut</strong><br><span class="badge">${statusLabel}</span><br><span class="muted">Réservée le ${date(b.created_at)}</span></div>
    </div>
    <h2 style="font-family:Georgia,serif;color:#1C3A5E">${e(b.package.title_fr)}</h2>
    <p>${e(b.package.destination.name_fr)}, ${e(b.package.destination.country)} — ${b.package.duration_days} jour(s)<br>
    Du <strong>${date(b.departure_date)}</strong> au <strong>${date(b.return_date)}</strong></p>
    <h3>Voyageurs</h3>${participantsTable(b)}
    ${b.package.included.length ? `<h3>Prestations incluses</h3><ul>${b.package.included.map((i) => `<li>${e(i)}</li>`).join('')}</ul>` : ''}
    <table><tbody>
      <tr><td>Montant total</td><td class="right">${tnd(b.total_price)}</td></tr>
      <tr><td>Déjà réglé</td><td class="right">${tnd(b.paid_amount)}</td></tr>
      <tr class="total"><td>Reste à payer</td><td class="right">${tnd(b.total_price.sub(b.paid_amount))}</td></tr>
    </tbody></table>
    <p class="muted">Présentez ce document et le passeport de chaque voyageur lors du départ. Le solde doit être réglé au plus tard 30 jours avant le départ (voir CGV).</p>`,
  );
}

export function invoiceHtml(b: DocBooking): string {
  const paid = b.payments.filter((p) => p.status === 'succeeded' || p.status === 'refunded');
  const lines = paid
    .map(
      (p) =>
        `<tr><td>${date(p.paid_at ?? p.created_at)}</td><td>${TYPE_LABEL[p.payment_type]}${p.status === 'refunded' ? ' (remboursé)' : ''}</td><td>${e(p.stripe_payment_intent_id.slice(-10))}</td><td class="right">${p.amount.toFixed(2)} ${e(p.currency)}</td><td class="right">${tnd(p.amount_tnd)}</td></tr>`,
    )
    .join('');
  const count = (b.participants as unknown as Participant[]).length;
  const number = `FAC-${b.reference.slice(4)}`;
  return layout(
    'Facture',
    `N° <strong>${number}</strong><br>Réservation ${e(b.reference)}<br>Date : ${date(new Date())}`,
    `<div class="grid">
      <div class="box"><strong>Facturé à</strong><br>${e(b.user.first_name)} ${e(b.user.last_name)}<br>${e(b.user.email)}</div>
      <div class="box"><strong>Voyage</strong><br>${e(b.package.title_fr)}<br>${date(b.departure_date)} → ${date(b.return_date)}</div>
    </div>
    <table><thead><tr><th>Désignation</th><th class="right">Qté</th><th class="right">Prix unitaire</th><th class="right">Montant</th></tr></thead><tbody>
      <tr><td>${e(b.package.title_fr)}</td><td class="right">${count}</td><td class="right">${tnd(b.package.base_price)}</td><td class="right">${tnd(b.package.base_price.mul(count))}</td></tr>
      ${b.discount_amount.gt(0) ? `<tr><td>Remise (code promo)</td><td></td><td></td><td class="right">− ${tnd(b.discount_amount)}</td></tr>` : ''}
      <tr class="total"><td colspan="3">Total TTC</td><td class="right">${tnd(b.total_price)}</td></tr>
    </tbody></table>
    <h3>Règlements reçus</h3>
    ${paid.length ? `<table><thead><tr><th>Date</th><th>Type</th><th>Transaction</th><th class="right">Débité</th><th class="right">Crédité</th></tr></thead><tbody>${lines}</tbody></table>` : '<p class="muted">Aucun règlement enregistré.</p>'}
    <table><tbody>
      <tr><td>Total réglé</td><td class="right">${tnd(b.paid_amount)}</td></tr>
      <tr class="total"><td>Solde dû</td><td class="right">${tnd(b.total_price.sub(b.paid_amount))}</td></tr>
    </tbody></table>
    <p class="muted">Prix exprimés en dinars tunisiens (TND), taxes incluses (régime de la marge des agences de voyage). Paiements par carte traités par Stripe.</p>`,
  );
}
