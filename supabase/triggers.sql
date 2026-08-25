-- ============================================================
-- مرحله ۲ — توابع Trigger
-- بعد از اجرای موفق schema.sql، این فایل را اجرا کنید
-- ============================================================

-- تابع ساخت خودکار پروفایل هنگام ثبت‌نام کاربر جدید
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

-- اتصال تریگر به جدول auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
