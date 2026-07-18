# Azande News

A free, worldwide community news site for the Azande people of Western
Equatoria, South Sudan, and the diaspora. Anyone can read; anyone who
registers a free account can log in and publish a post.

**What's included in this version:**
- Free registration and secure login
- Publishing posts with categories, and an optional cover photo
- Comments under each post
- A "Report this post" button so readers can flag problem content
- An admin dashboard (`/admin`) to remove or delete posts, resolve reports,
  and promote other users to admin
- Category pages so people can browse just Culture, History, etc.

This guide takes you from this folder of code to a live website, using only
free accounts. No credit card required anywhere.

---

## What you're setting up

| Piece | Service | Cost |
|---|---|---|
| Website hosting | Vercel | Free |
| Database + login system | Supabase | Free |
| Code storage | GitHub | Free |

---

## Step 1 — Create your Supabase project (the database + login system)

1. Go to **https://supabase.com** and click **Start your project**. Sign up (free, no card).
2. Click **New project**. Give it a name like `azande-news`, set a database password (save it somewhere safe), pick the region closest to your main audience, and click **Create new project**. Wait ~2 minutes.
3. In the left sidebar, open **SQL Editor** → **New query**.
4. Open the file `supabase/schema.sql` from this project, copy **all** of it, paste it into the SQL editor, and click **Run**. This creates all the tables and — importantly — the security rules that:
   - let anyone in the world read posts, without logging in
   - only let a logged-in person post as themselves
   - only let the author (or an admin) edit or delete their own post
5. In the left sidebar, go to **Project Settings → API**. You'll need two values from this page in Step 3:
   - **Project URL**
   - **anon public** key

### Turn off email confirmation delay (optional, for easier testing)
By default Supabase emails a confirmation link on sign-up, which is good for
security. If you want to test faster while setting up, you can temporarily
turn this off under **Authentication → Providers → Email → Confirm email**.
Turn it back on before you launch publicly.

---

## Step 2 — Put the code on GitHub

1. Go to **https://github.com** and create a free account if you don't have one.
2. Click **New repository**, name it `azande-news`, keep it **Public** or **Private** (either works), and create it — leave it empty (no README).
3. On your own computer, open a terminal in this project folder and run:

```bash
git init
git add .
git commit -m "Azande News - initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/azande-news.git
git push -u origin main
```

(Replace `YOUR-USERNAME` with your actual GitHub username.)

---

## Step 3 — Deploy on Vercel (this makes it live, worldwide)

1. Go to **https://vercel.com** and sign up free using your GitHub account.
2. Click **Add New → Project**, and import the `azande-news` repository you just pushed.
3. Before clicking Deploy, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` → paste your Supabase **Project URL**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → paste your Supabase **anon public** key
4. Click **Deploy**. In about a minute, Vercel gives you a live link like
   `https://azande-news.vercel.app` — that's your worldwide, public website.

### Add your own domain name (optional)
In Vercel, go to your project → **Settings → Domains** and you can attach a
domain you own (e.g. `azandenews.org`) instead of the `.vercel.app` address.
Domain names themselves are the one thing in this stack that isn't free
(usually $10–15/year from a registrar) — the hosting to run it stays free.

---

## Step 4 — Try it out

1. Visit your live link, click **Join — it's free**, and register.
2. Check the email confirmation (if you left it on), log in.
3. Click **Write a post** and publish your first story.
4. Open the site in a private/incognito window — you should be able to read
   the post without being logged in, from anywhere in the world.

---

## How the security works, in plain terms

- **Passwords** are never stored or handled by this code — Supabase's login
  system does that, using industry-standard hashing.
- **Every write to the database is checked on the server**, not just hidden
  in the app. Even if someone tampers with the website's code in their
  browser, the database itself refuses to let them post as someone else,
  edit someone else's post, or write to a table they shouldn't touch. This
  is what the `supabase/schema.sql` policies do.
- **Reading is public, writing requires login.** Only signed-in users can
  create posts; only a post's author (or an admin) can edit or delete it.
- **Traffic to your site is encrypted (HTTPS)** automatically by Vercel.

## Making yourself the first admin

1. Register a normal account on your live site first.
2. In Supabase, go to **Table Editor → profiles**, find your row (match it
   by your username or email), and change the `role` column from `member`
   to `admin`.
3. Log out and back in on the site. You'll now see an **Admin** link in the
   top navigation, leading to `/admin`.
4. From there, you can promote other trusted people to admin too — you
   won't need to touch Supabase directly again.

## What the admin dashboard can do

- **Open reports** — see anything readers have flagged, with their reason,
  and mark it resolved once you've handled it.
- **All posts** — remove a post from public view (reversible) or delete it
  permanently.
- **Users** — promote someone to admin, or step someone down from admin.

## What's next (ideas for future versions)

- Video uploads on posts
- Zande-language interface toggle
- Search across posts
- Email digests of new posts
- A proper domain name, whenever you're ready for one

We can build any of these together whenever you're ready — just start a new
step with what you'd like next.
