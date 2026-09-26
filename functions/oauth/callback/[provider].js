import { randomValue, sha256, sameValue } from "../../_shared/crypto.js";
import { cookie, clearTransaction, sessionCookie, noStore, errorResponse } from "../../_shared/cookies.js";
import { providers, baseUrl, client, callbackUrl } from "../../_shared/providers.js";
import { verifyGoogleIdToken } from "../../_shared/oidc.js";

const githubHeaders = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10", "User-Agent": "oauth-pages-lab" };
function fail(status = 400) {
  const response = errorResponse(status);
  response.headers.set("Set-Cookie", clearTransaction);
  return response;
}

async function exchangeCode(env, provider, code, verifier) {
  const { id, secret } = client(env, provider);
  const body = new URLSearchParams({ client_id: id, client_secret: secret, code,
    redirect_uri: callbackUrl(env, provider), code_verifier: verifier, grant_type: "authorization_code" });
  const response = await fetch(providers[provider].token, { method: "POST", headers: {
    "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json"
  }, body });
  if (!response.ok) throw new Error("Token exchange failed");
  const data = await response.json();
  if (data.error) throw new Error("Provider rejected code");
  return data;
}

async function githubIdentity(env, tokenResponse) {
  const token = tokenResponse.access_token;
  if (typeof token !== "string" || !token || !/^bearer$/i.test(tokenResponse.token_type || "")) throw new Error("Invalid GitHub token response");
  const profileResponse = await fetch("https://api.github.com/user", { headers: { ...githubHeaders, Authorization: `Bearer ${token}` } });
  if (!profileResponse.ok) throw new Error("GitHub profile failed");
  const profile = await profileResponse.json();
  if (!Number.isSafeInteger(profile.id) || profile.id <= 0) throw new Error("Invalid GitHub identity");
  const { id, secret } = client(env, "github");
  const basic = btoa(`${id}:${secret}`);
  const revoke = await fetch(`https://api.github.com/applications/${encodeURIComponent(id)}/grant`, {
    method: "DELETE", headers: { ...githubHeaders, Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: token })
  });
  if (revoke.status !== 204) throw new Error("GitHub grant revocation failed");
  return { issuer: "https://github.com", subject: String(profile.id),
    email: typeof profile.email === "string" ? profile.email : null,
    displayName: typeof profile.name === "string" && profile.name ? profile.name : profile.login };
}

export async function onRequestGet({ request, env, params }) {
  const provider = params.provider;
  if (!providers[provider]) return fail(404);
  try {
    if (new URL(request.url).origin !== baseUrl(env)) return fail();
    const url = new URL(request.url);
    const code = url.searchParams.get("code"), state = url.searchParams.get("state");
    if (url.searchParams.has("error") || !code || !state) return fail();
    const tx = cookie(request, "__Host-oauth-tx");
    if (!tx || !/^[A-Za-z0-9_-]{43}$/.test(tx)) return fail();
    const idHash = await sha256(tx);
    const row = await env.DB.prepare("SELECT provider, state_hash, nonce, code_verifier FROM oauth_transactions WHERE id_hash = ? AND expires_at > ?")
      .bind(idHash, Math.floor(Date.now() / 1000)).first();
    if (!row || row.provider !== provider || !sameValue(row.state_hash, await sha256(state))) return fail();
    const deletion = await env.DB.prepare("DELETE FROM oauth_transactions WHERE id_hash = ? AND expires_at > ?")
      .bind(idHash, Math.floor(Date.now() / 1000)).run();
    if (deletion.meta.changes !== 1) return fail();
    const tokenResponse = await exchangeCode(env, provider, code, row.code_verifier);
    const identity = provider === "google"
      ? await verifyGoogleIdToken(tokenResponse.id_token, client(env, "google").id, row.nonce)
      : await githubIdentity(env, tokenResponse);
    const session = randomValue(), now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("INSERT INTO sessions (id_hash, issuer, subject, email, display_name, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(await sha256(session), identity.issuer, identity.subject, identity.email, identity.displayName, now + 28800, now).run();
    const headers = new Headers({ ...noStore, Location: baseUrl(env) });
    headers.append("Set-Cookie", clearTransaction);
    headers.append("Set-Cookie", sessionCookie(session));
    return new Response(null, { status: 302, headers });
  } catch { return fail(400); }
}
