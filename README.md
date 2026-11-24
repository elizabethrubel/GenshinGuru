# Genshin Guru — Team Circle & Spiral Abyss Visualizer

A calm, portrait-led Genshin Impact team visualizer and Spiral Abyss dual-team planner synced with your **Genshin Roster** Google Sheet (`All Characters` & `Party by Region`).

## Features

- **Team Constellation Circle**: Visualize 4-character parties as circular character portraits arranged around an orbital ring, with interactive curved reaction connections (`Stellar-Conduct`, `Stellar Swirl`, `Lunar-Charged`, `Lunar-Bloom`, `Lunar-Crystallize`, `Ascendant Gleam`, `Overloaded`, `Melt`, `Geo Resonance`, and more) showing exactly how teammates interact.
- **Official Character Portraits**: All 37 roster character icons sourced from the Genshin Impact Wiki (`Character/List`) and bundled locally in `public/portraits/` for instant, reliable loading.
- **Battle-Ready & Worth Leveling**: Defaults to Battle-Ready (`Lv 70+`) characters and enforces survivability (`Healer` / `Shielder`), with toggles for **Include Unbuilt (`Lv 1–69`)** (flagging high-synergy investment targets like Lv 1 Chevreuse or Baizhu) and **Glass Cannon** mode.
- **Spiral Abyss Dual Circles**: Plan two strictly non-overlapping 4-character teams side-by-side with automatic conflict locking and one-click `Auto-Fill`.
- **Region-First Party Presets**: Browse your `Party by Region` teams with nation jump filters (`Mondstadt`, `Liyue`, `Inazuma`, `Sumeru`, `Fontaine`, `Natlan`, `Nod-Krai`, `Snezhnaya`) and open any squad in the Team Circle or Abyss planner.
- **Live Google Sheets API v4 Sync + Optional Gemini Hook**: Bundled snapshot works out of the box; connect a read-only Google Sheets API v4 key for live syncing and an optional Gemini API key for freeform *"fight xyz"* queries.

## Local Development

```bash
npm install
npm run dev
```

## Connecting Live Google Sheets Sync

1. Set your Google Sheet sharing to **Anyone with the link (Viewer)**.
2. Create a read-only **Google Sheets API** key in Google Cloud Console.
3. Paste the key into the in-app **Settings** modal, or create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

```env
VITE_SPREADSHEET_ID=1e6rLtgtdnxARNx76t5mc0kJRcjXyKbEVntzV-rSIK74
VITE_GOOGLE_SHEETS_API_KEY=your_sheets_api_key
VITE_GEMINI_API_KEY=optional_gemini_api_key
```

## Production Build & Hosting

```bash
npm run build
```

Deploy `dist/` to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
