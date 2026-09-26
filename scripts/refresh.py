"""Refresh public Comlink data and build one consistent dashboard snapshot."""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ALLY_CODE = "843153117"
BASE = os.environ.get("COMLINK_URL", "http://127.0.0.1:3000").rstrip("/")
DATA = Path("data")


def post(path, body):
    request = Request(BASE + path, json.dumps(body).encode(),
                      {"Content-Type": "application/json"})
    with urlopen(request, timeout=120) as response:
        return json.load(response)


def string_values(value):
    """Flatten the requested English bundle's string leaves, across wrappers."""
    result = {}
    if isinstance(value, dict):
        for key, item in value.items():
            if isinstance(item, str):
                result[key] = item
            elif isinstance(item, (dict, list)):
                result.update(string_values(item))
    elif isinstance(value, list):
        for item in value:
            result.update(string_values(item))
    return result


def catalog_from(game, localization):
    names = string_values(localization)
    catalog = {}
    for unit in game["units"]:
        base_id = unit.get("baseId") or unit["id"].split(":")[0]
        if unit.get("combatType") not in (1, 2):
            continue
        name = names.get(unit.get("nameKey"))
        if name:
            catalog[base_id] = {"name": name, "combatType": unit["combatType"]}
    if not catalog:
        print("Localization shape:", str(localization)[:1400])
        print("Unit sample:", [{k: u.get(k) for k in ("id", "nameKey", "combatType")} for u in game["units"][:2]])
        raise ValueError("No localized units found; keeping previous data")
    return catalog


def dashboard(player, catalog, refreshed_at):
    if str(player.get("allyCode")) != ALLY_CODE or not player.get("rosterUnit"):
        raise ValueError("Wrong account or empty roster")
    roster = []
    for unit in player["rosterUnit"]:
        base_id = unit["definitionId"].split(":")[0]
        definition = catalog.get(base_id, {})
        kind = definition.get("combatType")
        tier = (unit.get("relic") or {}).get("currentTier", 0)
        roster.append({
            "id": base_id, "name": definition.get("name", base_id),
            "type": {1: "Character", 2: "Ship"}.get(kind, "Unknown"),
            "stars": unit["currentRarity"], "level": unit["currentLevel"],
            "gear": unit.get("currentTier") if kind == 1 else None,
            "relic": tier - 2 if kind == 1 and tier >= 2 else None,
            "mods": len(unit.get("equippedStatMod", [])) if kind == 1 else None,
        })
    arena = {str(item["tab"]): item.get("rank") for item in player.get("pvpProfile", [])}
    return {"name": player["name"], "allyCode": ALLY_CODE,
            "guild": player.get("guildName", ""), "refreshedAt": refreshed_at,
            "source": "SWGoH Comlink", "arena": arena, "units": roster}


def main():
    DATA.mkdir(exist_ok=True)
    metadata = post("/metadata", {})
    versions = {key: metadata[key] for key in
                ("latestGamedataVersion", "latestLocalizationBundleVersion")}
    cache_path = DATA / "unit-catalog.json"
    cached = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    if cached.get("versions") != versions:
        game = post("/data", {"payload": {
            "version": versions["latestGamedataVersion"], "includePveUnits": False,
            "items": "137438953472"}, "enums": False})
        localization = post("/localization", {"payload": {
            "id": versions["latestLocalizationBundleVersion"] + ":ENG_US"}, "unzip": True})
        cached = {"versions": versions, "units": catalog_from(game, localization)}
    player = post("/player", {"payload": {"allyCode": ALLY_CODE}, "enums": False})
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    view = dashboard(player, cached["units"], now)
    # Validate every response before replacing the last successful snapshot.
    outputs = {"player.json": player, "refresh.json": {
        "allyCode": ALLY_CODE, "refreshedAt": now, "source": "SWGoH Comlink"},
        "unit-catalog.json": cached, "dashboard.json": view}
    for filename, value in outputs.items():
        temporary = DATA / (filename + ".tmp")
        temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
        temporary.replace(DATA / filename)
    print(f"Refreshed {len(view['units'])} units for {view['name']} at {now}")


if __name__ == "__main__":
    main()
