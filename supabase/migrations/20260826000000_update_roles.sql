-- ============================================================
-- مایگریشن نقش‌ها: superadmin→owner, editor→author
-- ============================================================

-- حذف محدودیت قدیمی
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- آپدیت رکوردهای موجود
UPDATE public.profiles SET role = 'owner' WHERE role = 'superadmin';
UPDATE public.profiles SET role = 'author' WHERE role = 'editor';

-- محدودیت جدید
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'author'));
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'author';

-- حذف توابع قدیمی و ایجاد توابع جدید
DROP FUNCTION IF EXISTS public.is_superadmin();
DROP FUNCTION IF EXISTS public.is_admin_or_owner();

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
$$;

-- به‌روزرسانی سیاست‌های RLS روی profiles
DROP POLICY IF EXISTS "profiles_manage_super" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_super" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_super" ON public.profiles;

CREATE POLICY "profiles_manage_admin" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "profiles_delete_owner" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_owner());

-- ایجاد جدول شبکه‌های اجتماعی
CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  icon_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_links_read_public" ON public.social_links
  FOR SELECT USING (true);

CREATE POLICY "social_links_write_admin" ON public.social_links
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
