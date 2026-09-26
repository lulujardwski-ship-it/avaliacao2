import { randomValue, sha256 } from "../../_shared/crypto.js";
import { transactionCookie, noStore, errorResponse } from "../../_shared/cookies.js";
import { providers, baseUrl, client, callbackUrl } from "../../_shared/providers.js";

export async function onRequestGet({ request, env, params }) {
  const provider = params.provider;
  if (!providers[provider]) return errorResponse(404);
  try {
    const base = baseUrl(env);
    if (new URL(request.url).origin !== base) return errorResponse(400);
    const { id } = client(env, provider);
    const tx = randomValue(), state = randomValue(), verifier = randomValue();
    const nonce = provider === "google" ? randomValue() : null;
    await env.DB.prepare("INSERT INTO oauth_transactions (id_hash, provider, state_hash, nonce, code_verifier, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(await sha256(tx), provider, await sha256(state), nonce, verifier, Math.floor(Date.now() / 1000) + 600).run();
    const url = new URL(providers[provider].authorize);
    url.searchParams.set("client_id", id);
    url.searchParams.set("redirect_uri", callbackUrl(env, provider));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", await sha256(verifier));
    url.searchParams.set("code_challenge_method", "S256");
    if (provider === "google") {
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("nonce", nonce);
    }
    return new Response(null, { status: 302, headers: { ...noStore, Location: url.toString(), "Set-Cookie": transactionCookie(tx) } });
  } catch { return errorResponse(500); }
}
