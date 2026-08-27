-- ============================================================
-- مایگریشن جدید: جدول ویرایشگر لایو (translation_overrides)
-- و سیستم لاگ‌گیری (system_logs)
-- ============================================================

-- ============ TRANSLATION OVERRIDES ============
create table if not exists public.translation_overrides (
  key text not null,
  locale text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (key, locale)
);

alter table public.translation_overrides enable row level security;

create policy "translation_read_public" on public.translation_overrides
  for select using (true);

create policy "translation_write_admin" on public.translation_overrides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ SYSTEM LOGS ============
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info', 'warn', 'error')),
  action text not null,
  details jsonb,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ایندکس برای جستجوی سریعتر لاگ‌های اخیر
create index if not exists system_logs_created_at_idx on public.system_logs(created_at desc);

alter table public.system_logs enable row level security;

-- فقط مدیران می‌توانند لاگ‌ها را بخوانند
create policy "logs_read_admin" on public.system_logs
  for select to authenticated using (public.is_admin());

-- درج لاگ فقط از طریق ادمین یا Service Role
create policy "logs_insert_admin" on public.system_logs
  for insert to authenticated with check (public.is_admin());
