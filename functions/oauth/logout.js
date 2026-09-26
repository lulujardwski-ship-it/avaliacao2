import { cookie, clearSession, noStore, errorResponse } from "../_shared/cookies.js";
import { sha256 } from "../_shared/crypto.js";
import { baseUrl } from "../_shared/providers.js";

export async function onRequestPost({ request, env }) {
  try {
    const base = baseUrl(env);
    if (new URL(request.url).origin !== base || request.headers.get("Origin") !== base) return errorResponse(403);
    const raw = cookie(request, "__Host-session");
    if (raw && /^[A-Za-z0-9_-]{43}$/.test(raw)) {
      await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(await sha256(raw)).run();
    }
    const headers = new Headers({ ...noStore, Location: base });
    headers.set("Set-Cookie", clearSession);
    return new Response(null, { status: 303, headers });
  } catch { return errorResponse(500); }
}
