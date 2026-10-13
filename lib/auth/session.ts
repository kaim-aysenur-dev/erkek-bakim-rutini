import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isSameOrigin, jsonError } from "@/lib/http";
import { SESSION_COOKIE, hashSessionId, readSessionCookie } from "./token";

export type SessionUser = {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  avatarPublicId: string | null;
  mustChangePassword: boolean;
  skinMetrics: string[];
  /** Bu oturumun veritabanındaki kimliği (özet) */
  sessionKey: string;
};

async function findSessionUser(cookieValue: string | undefined): Promise<SessionUser | null> {
  const sessionId = await readSessionCookie(cookieValue);
  if (!sessionId) return null;
  const sessionKey = await hashSessionId(sessionId);
  const rows = await sql()`
    select u.id, u.username, u.email, u.display_name, u.avatar_public_id,
           u.must_change_password, u.skin_metrics
    from sessions s
    join users u on u.id = s.user_id
    where s.id = ${sessionKey} and s.expires_at > now()`;
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    displayName: r.display_name,
    avatarPublicId: r.avatar_public_id,
    mustChangePassword: r.must_change_password,
    skinMetrics: r.skin_metrics,
    sessionKey,
  };
}

/** Sunucu bileşenlerinde oturumdaki kullanıcı. İstek başına bir kez sorgulanır. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return findSessionUser(store.get(SESSION_COOKIE)?.value);
});

/** Sayfalar için: oturum yoksa girişe, şifre değişmesi gerekiyorsa şifre ekranına yönlendirir. */
export async function requireUser(options?: { duringPasswordChange?: boolean }): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.mustChangePassword && !options?.duringPasswordChange) redirect("/sifre-degistir");
  return user;
}

type Handler<Ctx> = (req: NextRequest, user: SessionUser, ctx: Ctx) => Promise<Response>;

/**
 * API route sarmalayıcısı: oturumu sunucu tarafında doğrular ve kullanıcıyı handler'a verir.
 * Handler'lar veriyi her zaman `user.id` ile filtreler; istemciden gelen kullanıcı kimliğine güvenilmez.
 */
export function withUser<Ctx = unknown>(handler: Handler<Ctx>, options?: { duringPasswordChange?: boolean }) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    if (req.method !== "GET" && req.method !== "HEAD" && !isSameOrigin(req)) {
      return jsonError(403, "Geçersiz istek kaynağı.");
    }
    const user = await findSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
    if (!user) return jsonError(401, "Oturumun sona ermiş. Lütfen tekrar giriş yap.");
    if (user.mustChangePassword && !options?.duringPasswordChange) {
      return jsonError(403, "Devam etmeden önce şifreni değiştirmelisin.");
    }
    const res = await handler(req, user, ctx);
    res.headers.set("Cache-Control", "no-store");
    return res;
  };
}

export { findSessionUser };
