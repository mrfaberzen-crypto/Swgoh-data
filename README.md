# Faberzen's SWGOH Command Centre

A read-only roster dashboard for ally code **843153117**.

## What works

- Current saved character and ship roster, with official English unit names.
- Search by name or game identifier; filter characters, ships, seven-star units, or relic characters.
- Sort by name, stars, or upgrade level.
- Correct gear/relic labels and equipped-mod counts for characters.
- Fleet arena rank, guild name, and the exact snapshot refresh time.
- Visible warning for snapshots older than 24 hours.

The dashboard reads a saved snapshot. Reloading it does **not** make a new game API request.

## Refresh from the game

1. Open **Actions → Refresh SWGOH player data**.
2. Select **Run workflow**, choose **main**, and run it.
3. Wait for success, then click **Reload saved roster** in the dashboard.

A daily refresh also runs at 18:17 UTC (04:17 Sydney during AEST; 05:17 during AEDT). GitHub can delay scheduled runs.

The workflow starts Comlink temporarily inside GitHub Actions. No paid API account, EA login, or permanent server is required for this version. New game-data versions automatically refresh the unit-name catalog. Responses are validated before snapshots are replaced; workflow failure leaves the last committed data available.

## Open the dashboard

After GitHub Pages is enabled for **main / (root)**, the dashboard address is:

https://mrfaberzen-crypto.github.io/Swgoh-data/

GitHub Pages setup: **Settings → Pages → Deploy from a branch → main → / (root) → Save**.

For local preview, clone this repository, run `python3 -m http.server 8000` in its root, and open http://localhost:8000. Opening the HTML directly as a file does not work reliably.

## Files

- `index.html`, `app.js` — dashboard.
- `scripts/refresh.py` — Comlink retrieval, localization, validation and snapshot generation.
- `scripts/check-dashboard.mjs` — Chromium checks against the generated snapshot.
- `data/dashboard.json` — one consistent dashboard snapshot including its timestamp.
- `data/unit-catalog.json` — English unit names/types and source versions.
- `data/player.json` — full public Comlink response, retained for other analysis.
- `data/refresh.json` — compatibility refresh metadata.
- `.github/workflows/refresh-player.yml` — daily/manual refresh and verification.

## Scope

All committed data is public. This version cannot read unequipped mods, inventory, currencies or the active private GAC/TW map, and cannot move or sell mods. No private API keys should be committed here.

Relic levels follow Comlink's documented enum conversion: `relic.currentTier - 2`. Ships have no character gear/relic/mod labels. Missing definitions remain explicitly unknown.

Sources: [SWGoH Comlink](https://github.com/swgoh-utils/swgoh-comlink), [player-data mapping](https://github.com/swgoh-utils/swgoh-comlink/wiki/Player-Data), [API setup](https://github.com/swgoh-utils/swgoh-comlink/wiki/Getting-Started).
