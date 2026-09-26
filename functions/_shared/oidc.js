import { fromBase64url } from "./crypto.js";

function decodeJson(encoded) {
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(fromBase64url(encoded)));
}

export async function verifyGoogleIdToken(token, clientId, expectedNonce) {
  if (typeof token !== "string") throw new Error("Missing ID token");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid ID token");
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJson(headerPart);
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) throw new Error("Invalid JWT header");

  const discoveryResponse = await fetch("https://accounts.google.com/.well-known/openid-configuration");
  if (!discoveryResponse.ok) throw new Error("OIDC discovery failed");
  const discovery = await discoveryResponse.json();
  if (discovery.issuer !== "https://accounts.google.com" || !/^https:\/\/(www\.googleapis\.com|accounts\.google\.com)\//.test(discovery.jwks_uri || "")) {
    throw new Error("Invalid OIDC discovery");
  }
  const keysResponse = await fetch(discovery.jwks_uri);
  if (!keysResponse.ok) throw new Error("JWKS fetch failed");
  const jwks = await keysResponse.json();
  const jwk = jwks.keys?.find((key) => key.kid === header.kid && key.kty === "RSA" && (!key.use || key.use === "sig") && (!key.alg || key.alg === "RS256"));
  if (!jwk) throw new Error("Signing key missing");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const signed = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, fromBase64url(signaturePart), signed)) throw new Error("Invalid ID token signature");

  const claims = decodeJson(payloadPart);
  const now = Math.floor(Date.now() / 1000);
  const audiences = typeof claims.aud === "string" ? [claims.aud] : claims.aud;
  if (!["https://accounts.google.com", "accounts.google.com"].includes(claims.iss) ||
      !Array.isArray(audiences) || !audiences.includes(clientId) ||
      (audiences.length > 1 && claims.azp !== clientId) ||
      typeof claims.exp !== "number" || claims.exp <= now - 60 ||
      typeof claims.iat !== "number" || claims.iat > now + 60 ||
      claims.iat > claims.exp || claims.nonce !== expectedNonce ||
      typeof claims.sub !== "string" || !claims.sub) throw new Error("Invalid ID token claims");
  return { issuer: "https://accounts.google.com", subject: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    displayName: typeof claims.name === "string" ? claims.name : null };
}
