import { cookie, noStore } from "../_shared/cookies.js";
import { sha256 } from "../_shared/crypto.js";
export async function onRequestGet({ request, env }) {
  const raw = cookie(request, "__Host-session");
  if (!raw || !/^[A-Za-z0-9_-]{43}$/.test(raw)) return Response.json({ error: "Não autenticado" }, { status: 401, headers: noStore });
  const row = await env.DB.prepare("SELECT issuer, subject, email, display_name FROM sessions WHERE id_hash = ? AND expires_at > ?")
    .bind(await sha256(raw), Math.floor(Date.now() / 1000)).first();
  if (!row) return Response.json({ error: "Não autenticado" }, { status: 401, headers: noStore });
  return Response.json({ provider: row.issuer === "https://github.com" ? "github" : "google", subject: row.subject, email: row.email, displayName: row.display_name }, { headers: noStore });
}
