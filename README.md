# Amir Formula — وبلاگ شخصی فرمول ۱

وب‌سایت دوزبانه (فارسی/انگلیسی) با پنل مدیریت کامل، ساخته‌شده با Next.js 15 + Supabase.

**URLRequest:** [https://amir-formula.ir](https://amir-formula.ir) (پس از دیپلوی)

## امکانات

- 🌐 **دوزبانه**: فارسی (RTL) و انگلیسی (LTR) با سوییچر زبان
- 📝 **وبلاگ**: لیست مقالات صفحه‌بندی‌شده، صفحه تک‌مقاله، برچسب‌ها، جستجو (Ctrl+K)
- 💬 **نظرات تو در تو**: ثبت نظر + پاسخ به نظرات + جلوگیری از سوءاستفاده با نام جعلی (Fingerprint)
- ❤️ **لایک و بازدید**: شمارش خودکار برای هر مقاله
- ⏰ **زمان‌بندی انتشار**: انتشار خودکار مقاله در زمان مشخص (بدون نیاز به cron)
- 🔐 **پنل مدیریت سه سطحی**:
  - **مالک (Owner):** دسترسی کامل
  - **مدیر (Admin):** مدیریت مقالات، تنظیمات، شبکه‌های اجتماعی
  - **نویسنده (Author):** نوشتن مقاله و مدیریت کامنت‌ها
- 🎯 **Command Palette**: جستجوی سریع (Ctrl+K) در کل پنل ادمین
- ☕ **حمایت مالی (Coffeete)**: نوار پیشرفت اهداف + لیست حامیان اخیر
- 🎨 **شبکه‌های اجتماعی**: مدیریت داینامیک با آیکون واقعی (تگرام، اینستاگرام، X و...)
- 💾 **مدیریت فضا**: گالری عکس، تشخیص عکس‌های بی‌استفاده، پاکسازی خودکار
- ⚙️ **تنظیمات سایت**: نام، توضیحات، فاوآیکون، لوگوی اختصاصی
- ✉️ **فرم تماس**: متصل به Formspree
- 🖼 **آپلود تصویر**: آپلود مستقیم + تبدیل خودکار به WebP + برش دایره‌ای برای لوگو
- 🔒 **امنیت**: RLS روی همه جداول، اعتبارسنجی Zod، ضد XSS، محافظت CSRF

## تکنولوژی

| بخش | ابزار |
|-----|-------|
| فریم‌ورک | Next.js 15 (App Router) + TypeScript |
| استایل | Tailwind CSS |
| دیتابیس | Supabase (PostgreSQL + Auth + Storage) |
| چندزبانه | next-intl |
| ادیتور محتوا | TipTap (WYSIWYG با RTL) |
| حمایت مالی | Coffeete.ir API |
| فرم تماس | Formspree |
| فشرده‌سازی عکس | browser-image-compression + Canvas API |

---

## 🚀 راهنمای نصب صفر تا صد (کاملاً رایگان)

### مرحله ۱: ساخت دیتابیس (Supabase)

1. به [supabase.com](https://supabase.com) بروید و ثبت‌نام کنید.
2. **New Project** بزنید — نام: `amir-formula`، یک رمز قوی وارد کنید.
3. از **Project Settings → API** این سه مقدار رو کپی کنید:
   - `Project URL`
   - `anon public` key
   - `service_role` key (در پایین صفحه)

### مرحله ۲: اجرای ساختار دیتابیس

در **SQL Editor** سوپابیس، **دو مرحله را جداگانه** اجرا کنید:

1. **مرحله ۱:** محتوای `supabase/schema.sql` را کپی و **Run** کنید. منتظر پیغام `Success` باشید.
2. **مرحله ۲:** محتوای قبلی را پاک کنید، `supabase/triggers.sql` را کپی و **Run** کنید.

> ⚠️ این دو مرحله **حتماً باید جداگانه** اجرا شوند. اجرای همزمان باعث خطای `42P13` یا `Database error creating new user` می‌شود.

3. در **Storage → New Bucket**: نام `covers`، تیک **Public bucket** روشن.

### مرحله ۳: اتصال کدها به دیتابیس

فایل `.env.local` را با مقادیر زیر پر کنید:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=یک-رشته-تصادفی
NEXT_PUBLIC_FORMSPREE_ID=                   # فعلاً خالی
```

### مرحله ۴: ساخت اکانت مدیر کل

1. در Supabase → **Authentication → Add user → Create new user** با تیک `Auto Confirm User`.
2. در **SQL Editor** اجرا کنید:
   ```sql
   update public.profiles set role = 'owner' where email = 'ایمیل-شما@example.com';
   ```

### مرحله ۵: اجرا روی کامپیوتر

```bash
npm install
npm run dev
```

- سایت: `http://localhost:3000/fa`
- پنل مدیریت: `http://localhost:3000/admin`

### مرحله ۶: فرم تماس (اختیاری)

1. در [formspree.io](https://formspree.io) ثبت‌نام کنید.
2. فرم جدید بسازید و آیدی (مثل `xkjnwror`) رو در `.env.local` وارد کنید:
   ```env
   NEXT_PUBLIC_FORMSPREE_ID=xkjnwror
   ```

---

## ☁️ دیپلوی روی Vercel (رایگان)

### ۱. آپلود کدها به GitHub

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/amir-formula.git
git push -u origin main
```

### ۲. اتصال به Vercel

1. در [vercel.com](https://vercel.com) با GitHub لاگین کنید.
2. **Add New → Project** → ریپوی `amir-formula` رو Import کنید.
3. **قبل از Deploy:** بخش **Environment Variables** رو باز کنید و ۵ مورد زیر رو Add کنید:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | آدرس پروژه Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | کلید anon |
| `SUPABASE_SERVICE_ROLE_KEY` | کلید service_role |
| `CRON_SECRET` | رمز دلخواه |
| `NEXT_PUBLIC_FORMSPREE_ID` | آیدی فرم Formspree |

4. **Deploy** بزنید. بعد از ~۲ دقیقه سایت آماده‌ست!

### ۳. اتصال دامنه اختصاصی (اختیاری)

1. در Vercel → Settings → Domases → نام دامنه رو اضافه کنید.
2. DNS دامنه رو طبق راهنمای Vercel تنظیم کنید (A Record + CNAME).
3. HTTPS خودکار صادر می‌شه.

---

## 📊 نقش‌های کاربران

| بخش | مالک | مدیر | نویسنده | عمومی |
|------|------|------|---------|-------|
| صفحات عمومی | ✅ | ✅ | ✅ | ✅ |
| نوشتن/ویرایش مقاله | ✅ | ✅ | ✅ | ❌ |
| مدیریت کامنت/برچسب | ✅ | ✅ | ✅ | ❌ |
| تنظیمات سایت + شبکه اجتماعی | ✅ | ✅ | ❌ | ❌ |
| مدیریت حمایت مالی + فضای ذخیره | ✅ | ✅ | ❌ | ❌ |
| دعوت/حذف مدیران | ✅ | ❌ | ❌ | ❌ |

---

## 🛡️ امنیت

- ✅ Row Level Security روی تمام جداول دیتابیس
- ✅ احراز هویت سمت سرور با `getUser()` (اعتبارسنجی JWT)
- ✅ Service-role key فقط در سرور (هرگز سمت کلاینت)
- ✅ ضد XSS: رندر Markdown با `rehype-sanitize`
- ✅ اعتبارسنجی Zod روی همه ورودی‌ها
- ✅ CSRF محافظت‌شده با Server Actions
- ✅ Honeypot ضد اسپم + Fingerprint در فرم‌ها
- ✅ محافظت endpoint کرن با Bearer token
- ✅ نقش‌بندی سه سطحی (مالک/مدیر/نویسنده)

## نکات مهم

- **Supabase رایگان** بعد از ۱ هفته بی‌فعالیت pause می‌شه — cron روزانه Vercel این رو حل می‌کنه
- **Coffeete**: API Key در `.env.local` ذخیره میشه (هرگز در گیت پوش نکنید)
- **خودکار WebP**: همه عکس‌های آپلودی قبل از ذخیره‌سازی فشرده و تبدیل به WebP میشن
- برای تغییر رنگ‌ها: [tailwind.config.ts](tailwind.config.ts)
- برای تغییر متن‌ها: [messages/fa.json](messages/fa.json) و [messages/en.json](messages/en.json)
- شماتیک معماری: [ARCHITECTURE.html](ARCHITECTURE.html)
