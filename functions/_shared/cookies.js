export function cookie(request, name) {
  const entry = (request.headers.get("Cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}
export const transactionCookie = (value) => `__Host-oauth-tx=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
export const clearTransaction = "__Host-oauth-tx=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
export const sessionCookie = (value) => `__Host-session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
export const clearSession = "__Host-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
export const noStore = { "Cache-Control": "no-store" };
export function errorResponse(status = 400) {
  return new Response("Solicitação inválida.", { status, headers: noStore });
}
