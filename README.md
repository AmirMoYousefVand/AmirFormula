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

---

## 🚀 راهنمای نصب صفر تا صد (کاملاً رایگان)

این راهنما برای کسانی نوشته شده که می‌خواهند بدون دانش قبلی، سایت را روی کامپیوتر خود اجرا کرده و سپس روی اینترنت (هاست رایگان) قرار دهند.

### مرحله ۱: ساخت دیتابیس (Supabase)
ما به یک دیتابیس رایگان نیاز داریم تا مقالات و تنظیمات در آن ذخیره شوند.
1. به سایت [Supabase.com](https://supabase.com) بروید و ثبت‌نام کنید.
2. دکمه **New Project** را بزنید. نام پروژه را `amir-formula` بگذارید و یک رمز عبور قوی وارد کنید (این رمز را حتماً جایی یادداشت کنید).
3. وقتی پروژه ساخته شد، از منوی تنظیمات (چرخ‌دنده) به بخش **API** بروید.
4. در اینجا دو مقدار مهم وجود دارد که باید کپی کنید:
   - `Project URL`
   - `anon public` key
   - `service_role` key (در قسمت پایین‌تر صفحه است)

### مرحله ۲: اجرای ساختار دیتابیس
حالا باید جداول مقالات و نظرات را در دیتابیس بسازیم.
1. در داشبورد Supabase، از منوی سمت چپ به بخش **SQL Editor** بروید. یک کادر جدید باز کنید (New Query).
2. **مرحله ۱:** کل محتوای فایل `supabase/schema.sql` (در پوشه پروژه خودتان) را کپی کرده، در ویرایشگر Supabase پیست کنید و دکمه **Run** را بزنید. منتظر بمانید تا پیغام `Success` نمایش داده شود.
3. **مرحله ۲:** حالا تمام متن‌های قبلی را پاک کنید، محتوای فایل `supabase/triggers.sql` را کپی کرده و **Run** کنید. 
**(نکته بسیار مهم: اگر این دو مرحله را جداگانه اجرا نکنید، یا مرحله ۱ با خطا مواجه شده باشد، در زمان ساخت یوزر با ارور Database error creating new user مواجه می‌شوید).**
4. برای اینکه عکس مقالات کار کند، از منوی سمت چپ به بخش **Storage** بروید، دکمه **New Bucket** را بزنید، نام آن را `covers` بگذارید و حتماً تیک **Public bucket** را روشن کنید.

### مرحله ۳: اتصال کدهای سایت به دیتابیس
سایت شما باید کدهایی که در مرحله ۱ کپی کردید را بشناسد.
1. در پوشه اصلی پروژه خود (`Web Blog`)، فایلی به نام `.env.local` وجود دارد (اگر نیست، فایلی دقیقاً با همین نام بسازید).
2. آن را با یک ادیتور ساده باز کنید و کلیدهای خود را به این شکل در آن قرار دهید:

```env
NEXT_PUBLIC_SUPABASE_URL=آدرس_پروژه_شما_در_سوپابیس
NEXT_PUBLIC_SUPABASE_ANON_KEY=کد_آنون_پابلیک_شما
SUPABASE_SERVICE_ROLE_KEY=کد_سرویس_رول_شما

CRON_SECRET=my-secret-amir-f1-password-1234
NEXT_PUBLIC_FORMSPREE_ID=
```
*(نکته: جلوی `CRON_SECRET` یک رمز انگلیسی سخت به دلخواه خودتان بنویسید. این رمز برای امنیت انتشار خودکار مقالات است).*

### مرحله ۴: ساخت اکانت مدیر کل (ادمین)
1. در Supabase به بخش **Authentication** (آیکون آدمک) بروید.
2. روی **Add user** و سپس **Create new user** کلیک کنید.
3. ایمیل و رمزی که می‌خواهید با آن وارد پنل مدیریت سایت شوید را وارد کرده و تیک `Auto Confirm User` را بزنید. (اگر در این مرحله ارور گرفتید، یعنی مرحله ۲ را درست اجرا نکرده‌اید).
4. حالا دوباره به **SQL Editor** بروید و این یک خط کد را اجرا کنید (ایمیل خودتان را جایگزین کنید):
   ```sql
   update public.profiles set role = 'superadmin' where email = 'ایمیل-شما@example.com';
   ```

### مرحله ۵: اجرای سایت روی کامپیوتر
1. در پوشه پروژه، کلیک راست کرده و Terminal (یا CMD) را باز کنید.
2. دستورات زیر را به ترتیب بزنید:
   ```bash
   npm install
   npm run dev
   ```
3. مرورگر را باز کرده و به آدرس `http://localhost:3000` بروید. سایت شما آماده است!
4. برای ورود به پنل مدیریت به آدرس `http://localhost:3000/admin` بروید و با ایمیل و رمزی که در مرحله ۴ ساختید وارد شوید.

---

## ☁️ بردن سایت روی اینترنت (هاست رایگان Vercel)

برای اینکه سایتتان برای همه دنیا قابل دسترسی باشد، از هاست قدرتمند و رایگان Vercel استفاده می‌کنیم.

### ۱. ذخیره کدها در Github
1. در سایت [Github.com](https://github.com) اکانت بسازید.
2. دکمه **New Repository** را بزنید، نامش را `amir-formula-blog` بگذارید و Create کنید.
3. در ترمینال کامپیوتر خودتان، این دستورات را بزنید (آدرس مخزن خودتان را در خط چهارم جایگزین کنید):
   ```bash
   git add .
   git commit -m "First upload"
   git branch -M main
   git remote add origin https://github.com/نام-شما/amir-formula-blog.git
   git push -u origin main
   ```

### ۲. اتصال به Vercel
1. به سایت [Vercel.com](https://vercel.com) بروید و با اکانت Github خود لاگین کنید.
2. دکمه **Add New → Project** را بزنید.
3. مخزن گیت‌هاب خود (`amir-formula-blog`) را می‌بینید؛ دکمه **Import** را بزنید.
4. **بسیار مهم:** قبل از زدن دکمه Deploy، بخش **Environment Variables** را باز کنید.
5. هر ۵ موردی که در فایل `.env.local` وارد کرده بودید را اینجا دانه دانه کپی و **Add** کنید (Name در کادر اول، مقدار در کادر دوم).
6. حالا دکمه **Deploy** را بزنید!

بعد از حدود ۲ دقیقه، Vercel یک لینک اختصاصی (مانند `amir-formula.vercel.app`) به شما می‌دهد که سایت شما روی اینترنت است!

---

## ✉️ راه‌اندازی فرم تماس با ما (اختیاری)
1. در سایت [formspree.io](https://formspree.io) ثبت‌نام کنید (۵۰ پیام در ماه رایگان است).
2. یک فرم جدید (`New form`) بسازید و ایمیل خود را وارد کنید.
3. به شما یک آیدی ۸ حرفی (مثل `xaybzwqp`) می‌دهد.
4. آن آیدی را در پنل Vercel (بخش Settings → Environment Variables) در متغیر `NEXT_PUBLIC_FORMSPREE_ID` ذخیره کنید تا فرم تماس سایت کار کند.

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
- ✅ محافظت endpoint کرن با Bearer token. Code explicitly checks if `process.env.CRON_SECRET` exists first, mitigating attacks where an undefined secret makes an expected header of `"Bearer undefined"`.
- ✅ Rate limiting consideration for comments/likes (can add Upstash later if needed)

## نکات مهم

- **Supabase رایگان** بعد از ۱ هفته بی‌فعالیتی pause می‌شه — cron روزانه Vercel این رو حل می‌کنه
- **Formspree رایگان**: ۵۰ پیام در ماه
- برای تغییر رنگ‌ها: [tailwind.config.ts](tailwind.config.ts)
- برای تغییر متن‌ها: [messages/fa.json](messages/fa.json) و [messages/en.json](messages/en.json)
