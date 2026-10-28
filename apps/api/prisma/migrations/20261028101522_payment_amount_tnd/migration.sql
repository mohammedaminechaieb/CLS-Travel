-- Montant crédité en TND (le montant débité peut être en EUR/USD : Stripe ne gère pas le TND)
ALTER TABLE "payments" ADD COLUMN "amount_tnd" DECIMAL(10,3) NOT NULL;
ALTER TABLE "payments" ADD CONSTRAINT "payments_currency_allowed" CHECK ("currency" IN ('TND', 'EUR', 'USD'));
