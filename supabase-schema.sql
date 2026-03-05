-- KYC Partner App — Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Partners table
create table partners (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  registration_number text not null default '',
  jurisdiction_code text not null default '',
  address text not null default '',
  incorporation_date text,
  company_status text,
  kyc_status text not null default 'draft',
  risk_level text,
  risk_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  notes text not null default ''
);

-- UBOs and Directors
create table partner_ubos (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid not null references partners(id) on delete cascade,
  full_name text not null,
  date_of_birth text,
  nationality text,
  role text not null default 'director',
  ownership_percentage real,
  sanctions_clear boolean,
  pep_status boolean,
  screened_at timestamptz
);

-- Sanctions/PEP screening results
create table screening_results (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid not null references partners(id) on delete cascade,
  entity_name text not null,
  entity_type text not null,
  source text not null default 'opensanctions',
  match_score real not null default 0,
  match_details jsonb not null default '{}',
  is_match boolean not null default false,
  screened_at timestamptz not null default now()
);

-- Document metadata (files in Supabase Storage bucket "kyc-documents")
create table partner_documents (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid not null references partners(id) on delete cascade,
  doc_type text not null,
  file_name text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

-- Risk assessments
create table risk_assessments (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid not null references partners(id) on delete cascade,
  score integer not null,
  level text not null,
  factors jsonb not null default '[]',
  assessed_at timestamptz not null default now()
);

-- Audit log (append-only)
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid not null references partners(id) on delete cascade,
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_partners_kyc_status on partners(kyc_status);
create index idx_partner_ubos_partner_id on partner_ubos(partner_id);
create index idx_screening_results_partner_id on screening_results(partner_id);
create index idx_partner_documents_partner_id on partner_documents(partner_id);
create index idx_risk_assessments_partner_id on risk_assessments(partner_id);
create index idx_audit_log_partner_id on audit_log(partner_id);

-- Enable Row Level Security (allow all for now; configure policies per your auth setup)
alter table partners enable row level security;
alter table partner_ubos enable row level security;
alter table screening_results enable row level security;
alter table partner_documents enable row level security;
alter table risk_assessments enable row level security;
alter table audit_log enable row level security;

-- Permissive policies (for development — restrict in production)
create policy "Allow all on partners" on partners for all using (true) with check (true);
create policy "Allow all on partner_ubos" on partner_ubos for all using (true) with check (true);
create policy "Allow all on screening_results" on screening_results for all using (true) with check (true);
create policy "Allow all on partner_documents" on partner_documents for all using (true) with check (true);
create policy "Allow all on risk_assessments" on risk_assessments for all using (true) with check (true);
create policy "Allow all on audit_log" on audit_log for all using (true) with check (true);
