import type { Metadata } from "next";
import { BrandMark } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { ProfilePicker } from "@/components/profile-picker";
import { requireAccount } from "@/lib/auth/session";
import { imageUrl } from "@/lib/cloudinary";
import { sql } from "@/lib/db";
import { safeNextPath } from "@/lib/identity";

export const metadata: Metadata = { title: "Kim kullanıyor?" };

// Ortak girişten sonra kişi seçimi. Seçim bu cihazın oturumunda saklanır.
export default async function ProfilePickPage({ searchParams }: PageProps<"/profil-sec">) {
  const session = await requireAccount();
  const rows = await sql()`
    select id, display_name, avatar_public_id, lock_hash is not null as locked from users
    where account_id = ${session.accountId} order by created_at, display_name`;
  const profiles = rows.map((r) => ({
    id: r.id as string,
    name: r.display_name as string,
    locked: Boolean(r.locked),
    avatarUrl: r.avatar_public_id
      ? imageUrl(r.avatar_public_id, { width: 160, height: 160, crop: "fill", gravity: "face" })
      : null,
  }));
  const { sonra } = await searchParams;

  return (
    <div className="login-page">
      <main className="login">
        <header className="login-hero">
          <BrandMark large />
          <h1>Kim kullanıyor?</h1>
          <p>Her kişinin rutini, ürünleri ve kayıtları ayrı tutulur. Seçimin bu cihazda hatırlanır; üst menüden değiştirebilirsin.</p>
        </header>
        <ProfilePicker profiles={profiles} currentId={session.profile?.id ?? null} next={safeNextPath(sonra) ?? "/bugun"} />
        <div className="login-foot">
          <LogoutButton variant="link" />
        </div>
      </main>
    </div>
  );
}
