-- Drop the old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update existing records
UPDATE public.profiles SET role = 'owner' WHERE role = 'superadmin';
UPDATE public.profiles SET role = 'author' WHERE role = 'editor';

-- Add new constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'author'));

-- Update default
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'author';

-- Update functions
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
$$;

-- Social Links
CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null, 
  url text not null,      
  icon_name text not null,
  is_active boolean not null default true, 
  sort_order integer not null default 0,   
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_links_read_public" ON public.social_links
  FOR SELECT USING (true);

CREATE POLICY "social_links_write_admin" ON public.social_links
  FOR ALL TO authenticated USING (public.is_admin_or_owner()) WITH CHECK (public.is_admin_or_owner());
