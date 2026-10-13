import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Spor listesi" };

export default async function Page() {
  await requireUser();
  return <ComingSoon eyebrow="Spor" title="Spor listesi" items={["Haftalık antrenman planı", "Hareket kütüphanesi", "Antrenman kaydı ve karşılaştırma", "Adım ve kardiyo kaydı"]} />;
}
