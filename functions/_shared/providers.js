export const providers = {
  google: { authorize: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token", issuer: "https://accounts.google.com" },
  github: { authorize: "https://github.com/login/oauth/authorize", token: "https://github.com/login/oauth/access_token", issuer: "https://github.com" }
};
export function baseUrl(env) {
  const base = env.PUBLIC_BASE_URL;
  if (!base || !/^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(base)) throw new Error("Invalid base URL configuration");
  return base;
}
export function client(env, provider) {
  const prefix = provider.toUpperCase();
  const id = env[`${prefix}_CLIENT_ID`];
  const secret = env[`${prefix}_CLIENT_SECRET`];
  if (!id || !secret || !env.DB) throw new Error("Missing application configuration");
  return { id, secret };
}
export function callbackUrl(env, provider) { return `${baseUrl(env)}/oauth/callback/${provider}`; }
