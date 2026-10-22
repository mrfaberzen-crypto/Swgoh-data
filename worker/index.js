import { createHash, createHmac } from "node:crypto";

const ALLOWED_ORIGIN = "https://mrfaberzen-crypto.github.io";
const ALLY_CODE = "843153117";
const API_ENDPOINTS = {
  inventory: "/api/inventory",
  gac: "/api/gac",
  tw: "/api/tw"
};

function json(body, status, origin) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, private"
  });
  if (origin === ALLOWED_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Expose-Headers", "X-Snapshot-Saved");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function matchesToken(provided, expected) {
  if (!provided || !expected || provided.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i += 1) {
    difference |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return difference === 0;
}

function toBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function savePrivateSnapshot(resource, data, token) {
  const path = "data/" + resource + ".json";
  const url = "https://api.github.com/repos/mrfaberzen-crypto/swgoh-private-data/contents/" + path;
  const headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "swgoh-command-centre"
  };
  const existing = await fetch(url, { headers });
  let sha;
  if (existing.ok) {
    const file = await existing.json();
    sha = file.sha;
  } else if (existing.status !== 404) {
    throw new Error("GitHub snapshot lookup failed (HTTP " + existing.status + ")");
  }

  const snapshot = {
    allyCode: ALLY_CODE,
    resource,
    fetchedAt: new Date().toISOString(),
    data
  };
  const content = JSON.stringify(snapshot, null, 2) + "\n";
  const writeResponse = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Refresh SWGOH " + resource.toUpperCase() + " snapshot",
      content: toBase64Utf8(content),
      branch: "main",
      ...(sha ? { sha } : {})
    })
  });
  if (!writeResponse.ok) {
    throw new Error("GitHub snapshot save failed (HTTP " + writeResponse.status + ")");
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "swgoh-private-api" }, 200, origin);
    }

    const match = url.pathname.match(new RegExp("^/api/private/(inventory|gac|tw)$"));
    const isRosterRefresh = url.pathname === "/api/roster/refresh";
    if (!match && !isRosterRefresh) return json({ error: "Not found" }, 404, origin);
    if (origin !== ALLOWED_ORIGIN) return json({ error: "Origin not allowed" }, 403, origin);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "600",
          "Vary": "Origin"
        }
      });
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
    // Public roster refresh requires no browser token. Only the separate
    // private inventory/GAC/TW APIs require the dashboard access token.
    if (!isRosterRefresh) {
      if (!env.DASHBOARD_ACCESS_TOKEN) {
        return json({ error: "Dashboard access token is not configured on the Worker" }, 503, origin);
      }
      const authorization = request.headers.get("Authorization") || "";
      const prefix = "Bearer ";
      const token = authorization.startsWith(prefix) ? authorization.slice(prefix.length) : "";
      if (!matchesToken(token, env.DASHBOARD_ACCESS_TOKEN)) {
        return json({ error: "Unauthorized: incorrect dashboard access token" }, 401, origin);
      }
    }

    if (isRosterRefresh) {
      // This credential lives only in Cloudflare. Never put a GitHub API token in Pages JS.
      // Prefer a dedicated Actions:write token, falling back to the existing GitHub token
      // only if it was also granted Actions:write on Swgoh-data.
      const githubToken = env.ROSTER_REFRESH_GITHUB_TOKEN || env.PRIVATE_DATA_GITHUB_TOKEN;
      if (!githubToken) {
        return json({ error: "Roster refresh GitHub token is not configured on the Worker" }, 503, origin);
      }
      // Public POST endpoint: a Cloudflare local rate limit protects against bursts,
      // while GitHub's global run history enforces a 30-minute cooldown across POPs.
      // Never dispatch anonymously without both safeguards.
      if (!env.ROSTER_REFRESH_LIMITER) {
        return json({ error: "Roster refresh rate limiter has not been deployed" }, 503, origin);
      }
      let allowed;
      try {
        ({ success: allowed } = await env.ROSTER_REFRESH_LIMITER.limit({ key: "swgoh-843153117-roster" }));
      } catch {
        return json({ error: "Roster refresh rate limiter is temporarily unavailable" }, 503, origin);
      }
      if (!allowed) {
        return json({ error: "Too many refresh requests. Try again in a minute." }, 429, origin);
      }
      const githubHeaders = {
        "Authorization": "Bearer " + githubToken,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "swgoh-command-centre"
      };
      // GitHub workflow runs provide a cross-location cooldown, including while
      // a previous run is still queued. Fail closed if run history is unavailable.
      let runHistory;
      try {
        const runsResponse = await fetch(
          "https://api.github.com/repos/mrfaberzen-crypto/Swgoh-data/actions/workflows/refresh-player.yml/runs?per_page=1",
          { headers: githubHeaders, redirect: "manual", cache: "no-store" }
        );
        if (!runsResponse.ok) {
          return json({
            error: runsResponse.status === 401 || runsResponse.status === 403
              ? "GitHub token cannot read workflow runs. Check Actions permissions."
              : "Cannot check the last roster refresh on GitHub.",
            githubStatus: runsResponse.status
          }, 502, origin);
        }
        runHistory = await runsResponse.json();
      } catch {
        return json({ error: "Cannot check recent refreshes. Try again later." }, 502, origin);
      }
      if (!Array.isArray(runHistory.workflow_runs)) {
        return json({ error: "GitHub returned an unexpected refresh history" }, 502, origin);
      }
      const lastRun = runHistory.workflow_runs[0];
      const lastRunAt = lastRun ? Date.parse(lastRun.created_at) : NaN;
      if (Number.isFinite(lastRunAt) && Date.now() - lastRunAt < 30 * 60 * 1000) {
        return json({
          queued: false,
          recentlyRequested: true,
          message: "A roster refresh was requested recently; check the saved roster again shortly."
        }, 200, origin);
      }
      let response;
      try {
        response = await fetch(
          "https://api.github.com/repos/mrfaberzen-crypto/Swgoh-data/actions/workflows/refresh-player.yml/dispatches",
          {
            method: "POST",
            headers: { ...githubHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ ref: "main" }),
            redirect: "manual"
          }
        );
      } catch (error) {
        console.error("Roster dispatch transport error", error?.name || "Error");
        return json({ error: "Could not contact GitHub to start roster refresh" }, 502, origin);
      }
      if (!response.ok) {
        console.error("Roster dispatch rejected", response.status);
        return json({
          error: response.status === 401 || response.status === 403
            ? "GitHub rejected the refresh token. Grant Actions: write on the Swgoh-data repository."
            : "GitHub could not start the roster refresh.",
          githubStatus: response.status
        }, 502, origin);
      }
      // An accepted dispatch is NOT a completed refresh. The browser monitors
      // the newer public snapshot and shows completion only after the data changes.
      return json({ queued: true, message: "Roster refresh requested" }, 202, origin);
    }

    if (!env.MHANNDALORIAN_API_KEY || !env.PRIVATE_DATA_GITHUB_TOKEN) {
      return json({ error: "Private game data secrets are not configured" }, 503, origin);
    }

    const endpoint = API_ENDPOINTS[match[1]];
    const payload = { payload: { allyCode: ALLY_CODE, enums: false } };
    const body = JSON.stringify(payload);
    const timestamp = String(Date.now());
    const payloadHash = createHash("md5").update(body, "utf8").digest("hex");
    const signature = createHmac("sha256", env.MHANNDALORIAN_API_KEY)
      .update(timestamp)
      .update("POST")
      .update(endpoint.toLowerCase())
      .update(payloadHash)
      .digest("hex");

    let upstream;
    try {
      upstream = await fetch("https://mhanndalorianbot.work" + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-timestamp": timestamp,
          "Authorization": signature
        },
        body,
        // Do not follow redirects with a signed request; Cloudflare supports "manual".
        redirect: "manual"
      });
    } catch (error) {
      // Log only safe transport diagnostics; never include request headers or secrets.
      console.error("Mhanndalorian upstream fetch failed", error?.name || "Error", error?.message || "No details");
      return json({ error: "Could not reach the Mhanndalorian API" }, 502, origin);
    }

    if (!upstream.ok) {
      return json({ error: "Mhanndalorian API request failed", status: upstream.status }, 502, origin);
    }

    let data;
    try {
      data = await upstream.json();
    } catch {
      return json({ error: "Mhanndalorian API returned invalid JSON" }, 502, origin);
    }

    try {
      await savePrivateSnapshot(match[1], data, env.PRIVATE_DATA_GITHUB_TOKEN);
    } catch (error) {
      console.error("Private GitHub snapshot save failed", match[1], error?.name || "Error", error?.message || "No details");
      return json({ error: "Live data loaded but private GitHub snapshot could not be saved" }, 502, origin);
    }

    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Expose-Headers": "X-Snapshot-Saved",
      "Vary": "Origin",
      "X-Snapshot-Saved": "true"
    });
    return new Response(JSON.stringify(data), { status: 200, headers });
  }
};
