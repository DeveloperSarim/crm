-- ============================================================
-- Rayash CRM — Seed Lead Sources
-- ============================================================

insert into public.lead_sources (name, type) values
  ('Website',          'digital'),
  ('Facebook Ads',     'digital'),
  ('Instagram',        'digital'),
  ('Google Ads',       'digital'),
  ('Magicbricks',      'digital'),
  ('99acres',          'digital'),
  ('Housing.com',      'digital'),
  ('Walk-in',          'offline'),
  ('Referral',         'offline'),
  ('Event / Expo',     'offline'),
  ('Cold Call',        'offline'),
  ('External Realtor', 'external'),
  ('CSV Import',       'import'),
  ('Privyr CRM',       'crm'),
  ('Manual Entry',     'import')
on conflict (name) do nothing;
