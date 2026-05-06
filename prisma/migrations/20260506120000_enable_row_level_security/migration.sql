-- Row Level Security for Supabase Advisor (rls_disabled_in_public, sensitive_columns_exposed).
-- App uses Prisma from the server only; anon/authenticated API cannot read rows without policies.
-- Supabase direct/pooled `postgres` role bypasses RLS, so Prisma keeps working.

ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Run" ENABLE ROW LEVEL SECURITY;
