<div dir="rtl">

# Amir Formula — وبلاگ شخصی فرمول ۱

وب‌سایت دوزبانه (فارسی/انگلیسی) با پنل مدیریت کامل، ساخته‌شده با Next.js 15 + Supabase.

## امکانات

- 🌐 **دوزبانه**: فارسی (RTL) و انگلیسی (LTR) با سوییچر زبان
- 📝 **وبلاگ**: لیست مقالات، صفحه تک‌مقاله، برچسب‌ها، جستجو (Ctrl+K)
- 💬 **نظرات**: ثبت نظر توسط بازدیدکننده + تأیید توسط ادمین
- ❤️ **لایک و بازدید**: شمارش خودکار برای هر مقاله
- ⏰ **زمان‌بندی انتشار**: انتشار خودکار مقاله در زمان مشخص
- 🔐 **پنل مدیریت**: داشبورد آمار، مدیریت مقالات/نظرات/برچسب‌ها/مدیران
- 📊 **بخش تحلیل داده**: صفحه «به‌زودی» + لینک کانال تلگرام
- ✉️ **فرم تماس**: متصل به Formspree
- 🔒 **امنیت**: RLS روی همه جداول، اعتبارسنجی Zod، ضد XSS، محافظت CSRF

## تکنولوژی

| بخش | ابزار |
|-----|-------|
| فریم‌ورک | Next.js 15 (App Router) + TypeScript |
| استایل | Tailwind CSS |
| دیتابیس | Supabase (PostgreSQL + Auth + Storage) |
| چندزبانه | next-intl |
| ادیتور | @uiw/react-md-editor |

## راه‌اندازی (گام به گام)

### 1. نصب

```bash
npm install
```

### 2. ساخت پروژه Supabase (رایگان)

1. برو به [supabase.com](https://supabase.com) و حساب بساز (رایگان)
2. **New Project** بزن — اسم: `amir-formula`، رمز دیتابیس رو جایی ذخیره کن
3. بعد از ساخت پروژه، از **Project Settings → API** این دو مقدار رو کپی کن:
   - `Project URL`
   - `anon public` key

### 3. اجرای اسکیما

1. در داشبورد Supabase، برو به **SQL Editor**
2. کل محتوای فایل `supabase/schema.sql` رو کپی و اجرا (**Run**) کن
3. حالا در **Storage → New Bucket**:
   - نام: `covers`
   - گزینه **Public bucket** رو فعال کن
   - Create بزن

### 4. ساخت اکانت ادمین (سوپرادمین)

1. در Supabase برو به **Authentication → Users → Add user → Create new user**
2. ایمیل و رمز عبور دلخواه بزن، **Auto Confirm User** رو هم فعال کن
3. حالا در **SQL Editor** اجرا کن:

```sql
update public.profiles set role = 'superadmin' where email = 'ایمیل-شما@example.com';
```

### 5. تنظیم Environment Variables

فایل `.env.local` رو پر کن:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # از Settings → API → service_role
CRON_SECRET=یک-رشته-تصادفی              # مثلاً: openssl rand -hex 32
NEXT_PUBLIC_FORMSPREE_ID=               # فعلاً خالی، بعداً پر می‌کنیم
```

### 6. اجرا

```bash
npm run dev
```

سایت: `http://localhost:3000/fa`
پنل مدیریت: `http://localhost:3000/admin`

---

## فرم تماس (Formspree — رایگان)

1. برو به [formspree.io](https://formspree.io) و با گیت‌هاب ثبت‌نام کن (رایگان — 50 پیام/ماه)
2. **New form** بساز — ایمیلت رو وارد کن
3. Form ID رو کپی کن (مثل `xaybzwqp`) و داخل `.env.local` بذار:

```env
NEXT_PUBLIC_FORMSPREE_ID=xaybzwqp
```

---

## دیپلوی روی Vercel (رایگان)

### 1. کد را به GitHub بفرست

```bash
git init && git add . && git commit -m "Amir Formula blog"
git remote add origin https://github.com/YOUR_USERNAME/amir-formula.git
git push -u origin main
```

### 2. Import در Vercel

1. برو به [vercel.com](https://vercel.com) و با گیت‌هاب لاگین کن
2. **Add New → Project** → ریپو رو انتخاب کن
3. در قسمت **Environment Variables** هر ۵ مقدار از `.env.local` رو دستی وارد کن
4. **Deploy** بزن — تمام!

### 3. Cron (انتشار خودکار مقالات زمان‌دار)

فایل `vercel.json` از قبل تنظیم شده — هر روز ساعت ۳ بامداد مقالات زمان‌داره منتشر می‌شن.
(نکته: حتی بدون cron هم مقاله دقیقاً سر ساعتش نمایش داده می‌شه؛ cron فقط وضعیت داشبورد رو به‌روز می‌کنه و مانع pause شدن رایگان Supabase می‌شه.)

---

## استفاده از پنل مدیریت

مسیر: `/admin`

| بخش | توضیح |
|-----|-------|
| **داشبورد** | آمار کلی: تعداد مقالات، بازدیدها، نظرات در انتظار |
| **مقالات** | نوشتن با Markdown + پیش‌نمایش زنده، پیش‌نویس/زمان‌بندی/انتشار |
| **نظرات** | تأیید یا حذف نظرات کاربران |
| **برچسب‌ها** | ساخت برچسب دوزبانه برای دسته‌بندی مقالات |
| **مدیران** | (فقط سوپرادمین) دعوت ادیتور با ایمیل، تغییر نقش، حذف |

## نقش‌ها

- **superadmin**: دسترسی کامل + مدیریت سایر مدیران
- **editor**: نوشتن مقاله، مدیریت نظرات و برچسب‌ها (بدون دسترسی به بخش مدیران)

## آپلود تصویر مقالات

1. در Supabase برو به **Storage → covers**
2. عکس رو Upload کن
3. روی فایل کلیک کن → **Get URL** → لینک public رو کپی کن
4. در فرم مقاله، قسمت «لینک تصویر کاور» بچسبون

## ساختار پروژه

```
src/
├── app/
│   ├── [locale]/          # صفحات عمومی (fa/en)
│   │   ├── page.tsx       # خانه
│   │   ├── blog/          # لیست + تک‌مقاله + برچسب
│   │   ├── analytics/     # به‌زودی + تلگرام
│   │   └── contact/       # فرم تماس
│   ├── admin/             # پنل مدیریت
│   └── api/               # views, likes, comments, search, cron
├── actions/               # Server Actions (امن)
├── components/            # UI components
├── i18n/                  # تنظیمات چندزبانه
└── lib/                   # Supabase clients, queries, validation
messages/fa.json, en.json  # ترجمه‌ها
supabase/schema.sql        # اسکیمای دیتابیس + RLS
```

## امنیت

- ✅ Row Level Security روی تمام جداول
- ✅ احراز هویت سمت سرور با `getUser()` (اعتبارسنجی JWT)
- ✅ Service-role key فقط در سرور (هرگز سمت کلاینت)
- ✅ ضد XSS: رندر Markdown بدون `rehype-raw`
- ✅ اعتبارسنجی Zod روی همه ورودی‌ها
- ✅ CSRF محافظت‌شده با Server Actions
- ✅ Honeypot ضد اسپم در فرم‌های عمومی
- ✅ محافظت endpoint کرن با Bearer token

## نکات مهم

- **Supabase رایگان** بعد از ۱ هفته بی‌فعالیتی pause می‌شه — cron روزانه Vercel این رو حل می‌کنه
- **Formspree رایگان**: ۵۰ پیام در ماه
- برای تغییر رنگ‌ها: [tailwind.config.ts](tailwind.config.ts)
- برای تغییر متن‌ها: [messages/fa.json](messages/fa.json) و [messages/en.json](messages/en.json)

</div>
