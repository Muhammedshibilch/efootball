# ⚽ eFootball Neighborhood League Manager

A modern, responsive, 100% free web app for organizing neighborhood **eFootball / PES** tournaments and leagues for 10–14+ players with live standings, dynamic round-robin scheduling, live countdown timers, and strict 24-hour match deadline enforcement.

---

## 🌟 Key Features

1. **Free Hosting & Free Database**:
   - Zero hosting cost. Works completely free with **GitHub Pages**, **Vercel**, or **Netlify**.
   - Database powered by **Supabase Free Tier** (PostgreSQL) or offline **LocalStorage**.

2. **Custom Neighborhood Rules Built-In**:
   - **Win**: 3 points
   - **Draw**: 1 point each
   - **Loss**: 0 points
   - **Strict 24-Hour Rule**: Each round has an active countdown timer (default 24 hours). If a match is not played in time, **both players get 0 points**, but the match counts toward their **Matches Played (P)** tally!

3. **Dynamic Fixtures (Round-Robin)**:
   - Supports **Single Round** (1 match against each opponent) or **Home & Away** (2 matches against each opponent: Leg 1 and Leg 2).
   - Berger algorithm generates balanced rounds automatically.

4. **Live Table & Scoreboard**:
   - Pos, Player, Played (P), Won (W), Drawn (D), Lost (L), Goals For (GF), Goals Against (GA), Goal Difference (GD), Points (PTS), and Form (last 5 matches).
   - Real-time countdowns (`⏳ 18h 42m left`).
   - One-click copy formatted table for **WhatsApp** groups.

5. **Admin Security**:
   - Admin PIN (default `1234`) prevents accidental editing by players.

---

## 🚀 Quick Start (Instant Local Test)

Simply double-click `index.html` or open it with Google Chrome, Microsoft Edge, or Safari. It works immediately right out of the box!

---

## 🌐 How to Host it for 100% FREE (So All Friends Can Access on Mobile)

### Method 1: GitHub Pages (Easiest & Free)
1. Create a free account at [GitHub.com](https://github.com).
2. Create a new public repository (e.g., `efootball-league`).
3. Upload all the files in this folder (`index.html`, `style.css`, `app.js`).
4. Go to **Settings** &rarr; **Pages** &rarr; Branch: select `main` / `root` and click **Save**.
5. GitHub will give you a free live URL: `https://<your-username>.github.io/efootball-league`.
6. Share this link on WhatsApp with all your friends!

### Method 2: Vercel or Netlify (Drag & Drop)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop this folder (`c:\Users\shibi\OneDrive\Desktop\pes`).
3. You get a free HTTPS link in 10 seconds!

---

## 🗄️ Setting Up Free Cloud Sync (Supabase)

If you want live updates synced across all your friends' phones:
1. Go to [Supabase.com](https://supabase.com) and create a free project.
2. Go to **SQL Editor** in Supabase and copy-paste the contents of [`supabase_schema.sql`](./supabase_schema.sql). Click **Run**.
3. In Supabase, go to **Project Settings &rarr; API** and copy:
   - **Project URL**
   - **anon / public key**
4. Open your league app, go to the **Manage & Setup** tab, paste the URL and Key under **Free Supabase Cloud Sync**, and click **Connect**.
5. All scores and fixtures will now sync in real time across all devices!

---

## 📁 File Structure

- `index.html` - Main user interface with dark eFootball console aesthetic.
- `app.js` - Dynamic fixture generation, standings calculation, countdown timers, and Supabase sync logic.
- `style.css` - Custom styles, podium gradients, and glowing urgency alerts.
- `supabase_schema.sql` - Ready-to-use PostgreSQL schema with auto-expire triggers.

