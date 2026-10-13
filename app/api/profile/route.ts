import { sql } from "@/lib/db";
import { jsonError, jsonOk, readJson, str } from "@/lib/http";
import { withUser } from "@/lib/auth/session";
import { deleteImage, imageUrl, ownsPublicId } from "@/lib/cloudinary";

// Ad ve profil fotoğrafı güncelleme
export const PATCH = withUser(async (req, user) => {
  const body = await readJson(req);
  if (!body) return jsonError(400, "Geçersiz istek.");
  const db = sql();

  if ("displayName" in body) {
    const name = str(body.displayName, 60);
    if (name.length < 2) return jsonError(400, "Ad en az 2 karakter olmalı.");
    await db`update users set display_name = ${name}, updated_at = now() where id = ${user.id}`;
  }

  let avatarUrl: string | null | undefined;
  if ("avatarPublicId" in body) {
    const next = body.avatarPublicId;
    if (next !== null && !ownsPublicId(user.id, "avatar", next)) return jsonError(400, "Geçersiz fotoğraf.");
    await db`update users set avatar_public_id = ${next}, updated_at = now() where id = ${user.id}`;
    if (user.avatarPublicId && user.avatarPublicId !== next) await deleteImage(user.avatarPublicId);
    avatarUrl = next ? imageUrl(next, { width: 160, height: 160, crop: "fill", gravity: "face" }) : null;
  }

  return jsonOk({ ok: true, avatarUrl });
});
