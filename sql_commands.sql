-- 1. Drop existing constraints that depend on the old roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Update existing data to match the new roles
UPDATE public.profiles SET role = 'owner' WHERE role = 'superadmin';
UPDATE public.profiles SET role = 'author' WHERE role = 'editor';

-- 3. Add the new constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'author'));

-- 4. Update helper functions
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update RLS Policies that depended on is_superadmin()
-- First, drop the old policies that used it, or update them.
-- Since we are doing a migration, let's redefine the policies on profiles.
DROP POLICY IF EXISTS "profiles_manage_super" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_super" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_super" ON public.profiles;

-- Owner and admin can read all profiles (already public read might exist, but just in case)
CREATE POLICY "profiles_manage_admin" ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_owner())
  WITH CHECK (public.is_admin_or_owner());

-- Drop old is_superadmin if we want, but keeping it as an alias for owner might break less things temporarily. Let's replace it to check owner.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN public.is_owner();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ SOCIAL LINKS ============
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null, 
  url text not null,      
  icon_name text not null,
  is_active boolean not null default true, 
  sort_order integer not null default 0,   
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.social_links enable row level security;

-- Public read access so anyone visiting the site can see the social links
create policy "social_links_read_public" on public.social_links
  for select using (true);

-- Admin write access (similar to how site_settings is managed)
create policy "social_links_write_admin" on public.social_links
  for all to authenticated using (public.is_admin_or_owner()) with check (public.is_admin_or_owner());
