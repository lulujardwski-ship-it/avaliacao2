import { noStore } from "../_shared/cookies.js";
export function onRequestGet() { return Response.json({ status: "ok" }, { headers: noStore }); }
