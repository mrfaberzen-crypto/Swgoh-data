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
