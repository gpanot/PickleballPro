-- Add royalty_rate to academies
-- Stores the percentage affiliated coaches pay back to the academy owner.
-- Defaults to 10 (the market standard). Validated 1-100.

ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS royalty_rate integer NOT NULL DEFAULT 10
    CONSTRAINT academies_royalty_rate_check CHECK (royalty_rate >= 1 AND royalty_rate <= 100);
