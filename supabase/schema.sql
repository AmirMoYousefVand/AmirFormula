-- ============================================================
-- Amir Formula — Supabase Schema
-- این فایل را در Supabase Dashboard > SQL Editor اجرا کنید
-- ============================================================

-- ============ PROFILES (نقش‌های ادمین) ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'editor' check (role in ('superadmin','editor')),
  created_at timestamptz not null default now()
);

-- تابع کمکی برای بررسی سوپرادمین (security definer تا از recursion جلوگیری شود)
create or replace function public.is_superadmin() returns boolean
language sql security definer stable set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  )
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_authed" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- فقط سوپرادمین می‌تواند نقش دیگران را تغییر دهد یا ادمین اضافه/حذف کند
create policy "profiles_manage_super" on public.profiles
  for update to authenticated using (public.is_superadmin());

create policy "profiles_insert_super" on public.profiles
  for insert to authenticated with check (public.is_superadmin());

create policy "profiles_delete_super" on public.profiles
  for delete to authenticated using (public.is_superadmin());

-- ساخت خودکار پروفایل هنگام ثبت‌نام در Auth
create or replace function public.handle_new_user()
returns trigger
language sql security definer set search_path = public
as $$
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ POSTS ============
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft','scheduled','published')),
  title_fa text not null,
  title_en text,
  excerpt_fa text,
  excerpt_en text,
  content_fa text not null default '',
  content_en text,
  cover_image_url text,
  author_id uuid references public.profiles(id),
  published_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (status, published_at desc);
create index if not exists posts_slug_idx on public.posts (slug);

alter table public.posts enable row level security;

-- خواندن عمومی: منتشرشده، یا زمان‌بندی‌شده‌ای که وقتش رسیده
create policy "posts_read_public" on public.posts
  for select to anon using (
    status = 'published'
    or (status = 'scheduled' and published_at <= now())
  );

create policy "posts_read_admin" on public.posts
  for select to authenticated using (true);

create policy "posts_insert_admin" on public.posts
  for insert to authenticated with check (true);

create policy "posts_update_admin" on public.posts
  for update to authenticated using (true) with check (true);

create policy "posts_delete_admin" on public.posts
  for delete to authenticated using (true);

-- ============ TAGS ============
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_fa text not null,
  name_en text not null,
  created_at timestamptz not null default now()
);

alter table public.tags enable row level security;

create policy "tags_read_all" on public.tags
  for select using (true);

create policy "tags_insert_admin" on public.tags
  for insert to authenticated with check (true);

create policy "tags_update_admin" on public.tags
  for update to authenticated using (true) with check (true);

create policy "tags_delete_admin" on public.tags
  for delete to authenticated using (true);

-- ============ POST_TAGS (رابطه چند به چند) ============
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

alter table public.post_tags enable row level security;

create policy "post_tags_read_all" on public.post_tags
  for select using (true);

create policy "post_tags_write_admin" on public.post_tags
  for all to authenticated using (true) with check (true);

-- ============ COMMENTS ============
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 80),
  content text not null check (char_length(content) between 2 and 2000),
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, status);

alter table public.comments enable row level security;

-- هرکسی می‌تواند نظر بدهد ولی همیشه به‌صورت pending
create policy "comments_insert_anon" on public.comments
  for insert to anon, authenticated with check (status = 'pending');

-- عمومی فقط تأییدشده‌ها را می‌بیند
create policy "comments_read_public" on public.comments
  for select using (status = 'approved');

create policy "comments_read_admin" on public.comments
  for select to authenticated using (true);

create policy "comments_moderate_admin" on public.comments
  for update to authenticated using (true) with check (true);

create policy "comments_delete_admin" on public.comments
  for delete to authenticated using (true);

-- ============ LIKES ============
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (post_id, fingerprint)
);

create index if not exists likes_post_idx on public.likes (post_id);

alter table public.likes enable row level security;

-- شمارش لایک‌ها عمومی است؛ نوشتن فقط از طریق service-role (API route)
create policy "likes_read_public" on public.likes
  for select using (true);

-- ============ شمارنده بازدید (اتمیک) ============
create or replace function public.increment_post_views(p_slug text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.posts set view_count = view_count + 1 where slug = p_slug;
end;
$$;

revoke execute on function public.increment_post_views(text) from anon, authenticated;
grant execute on function public.increment_post_views(text) to service_role;

-- ============================================================
-- مراحل بعدی (دستی از داشبورد):
-- 1. Storage > ساخت باکت public به نام covers
-- 2. Authentication > Users > Add user (ایمیل و رمز ادمین)
-- 3. SQL Editor:
--    update public.profiles set role='superadmin' where email='you@example.com';
-- ============================================================
