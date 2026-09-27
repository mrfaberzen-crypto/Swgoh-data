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
    if (!match) return json({ error: "Not found" }, 404, origin);
    if (origin !== ALLOWED_ORIGIN) return json({ error: "Origin not allowed" }, 403);
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

    if (!env.MHANNDALORIAN_API_KEY || !env.DASHBOARD_ACCESS_TOKEN || !env.PRIVATE_DATA_GITHUB_TOKEN) {
      return json({ error: "Worker secrets are not configured" }, 503, origin);
    }

    const authorization = request.headers.get("Authorization") || "";
    const prefix = "Bearer ";
    const token = authorization.startsWith(prefix) ? authorization.slice(prefix.length) : "";
    if (!matchesToken(token, env.DASHBOARD_ACCESS_TOKEN)) {
      return json({ error: "Unauthorized" }, 401, origin);
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
