# SWGOH data

Automatically refreshed public roster data for **Faberzen**, ally code **843153117**.

## Files

- `data/player.json` — the latest public player and roster response from SWGoH Comlink.
- `data/refresh.json` — ally code and the UTC time of the last successful refresh.
- `.github/workflows/refresh-player.yml` — runs daily and can also be started manually.

## Run a refresh now

1. Open the repository's **Actions** tab.
2. Select **Refresh SWGOH player data**.
3. Select **Run workflow**.

A successful run commits the latest data to the `data` folder. The workflow is read-only toward the game and cannot access unequipped mods, gear inventory, currencies, or other private account data.

## Data source

This project downloads the latest Linux release of [SWGoH Comlink](https://github.com/swgoh-utils/swgoh-comlink), starts it temporarily inside GitHub Actions, fetches ally code `843153117`, validates the response, and saves the JSON here.

## Roster dashboard

The `index.html` page reads `data/player.json` and `data/refresh.json` from this repository. It shows a search/filter roster table, summary counts, fleet arena rank, and the saved-data timestamp. It does not require an API key or an EA login.

To preview locally after cloning, run `python3 -m http.server 8000` in the repository root and open `http://localhost:8000`. Opening `index.html` directly as a file will block the JSON fetch in most browsers.

To make the dashboard available on the web, enable GitHub Pages for the main branch and repository root after merging this change. The roster JSON is already public in this repository. The **Run roster refresh** link opens the existing manual GitHub Action; refresh the dashboard after the action finishes.

The dashboard currently uses raw game identifiers. Mapping those to display names and distinguishing ships from characters requires Comlink's game data and localization bundles; that is the next increment.
