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

1. Press **Refresh from game**. No browser password/token is needed for the public roster.
2. The Cloudflare Worker enforces a short rate limit and a 30-minute cooldown by checking GitHub workflow run history before dispatching another refresh.
3. The button reports whether the request was accepted and monitors the saved roster for an updated snapshot. Use **Reload saved roster** to re-read the latest saved data at any time.

Private inventory, GAC and TW requests **still require** the private dashboard access token in their separate field.

### One-time secure setup for direct refresh

The Cloudflare Worker is connected to this GitHub repo through Cloudflare Builds with Root directory set to `worker`. Commits to that folder deploy the existing `swgoh-data` Worker. Preserve its current `MHANNDALORIAN_API_KEY`, `DASHBOARD_ACCESS_TOKEN` and `PRIVATE_DATA_GITHUB_TOKEN` secrets.

Provide the Worker a GitHub credential capable of dispatching `.github/workflows/refresh-player.yml` in `mrfaberzen-crypto/Swgoh-data`: preferably add a Cloudflare Worker secret named `ROSTER_REFRESH_GITHUB_TOKEN`. Create a fine-grained GitHub personal access token scoped **only** to `Swgoh-data` with **Actions: Read and write** permission. The Worker tries the existing `PRIVATE_DATA_GITHUB_TOKEN` only when a dedicated token is absent; that fallback works only if it already has access to dispatch Actions for this public repository. Anonymous public roster refresh is limited by a 30-minute global cooldown checked against GitHub workflow run history. When deployed, Cloudflare's `ROSTER_REFRESH_LIMITER` binding also throttles local bursts; the missing binding is nonfatal, because the mandatory GitHub cooldown remains active. Requests that cannot verify the global cooldown fail closed. Repeated workflow dispatches no longer cancel a running refresh. Never put the GitHub token in frontend JS, in a GitHub file, or in a chat message.

If Cloudflare Workers Builds is connected to this repo, configure it to deploy `worker/index.js` with Node compatibility enabled. Otherwise deploy the updated code in Cloudflare Workers & Pages. After this one-time setup, everyday refreshes need no GitHub visit.

If the Worker is not configured, the dashboard has a separate [manual GitHub fallback](https://github.com/mrfaberzen-crypto/Swgoh-data/actions/workflows/refresh-player.yml).

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
