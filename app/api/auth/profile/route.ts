import { sql } from "@/lib/db";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { withAccount } from "@/lib/auth/session";
import { UUID_RE } from "@/lib/skin";

// "Kim kullanıyor?" seçimi: profil yalnızca bu hesaba aitse oturuma yazılır.
export const POST = withAccount(async (req, session) => {
  const body = await readJson(req);
  const userId = body?.userId;
  if (typeof userId !== "string" || !UUID_RE.test(userId)) return jsonError(400, "Geçersiz profil.");
  const db = sql();
  const [owned] = await db`select 1 from users where id = ${userId} and account_id = ${session.accountId}`;
  if (!owned) return jsonError(404, "Profil bulunamadı.");
  await db`update sessions set user_id = ${userId} where id = ${session.sessionKey} and account_id = ${session.accountId}`;
  return jsonOk({ ok: true });
});
