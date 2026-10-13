import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Beslenme programı" };

export default async function Page() {
  await requireUser();
  return <ComingSoon eyebrow="Beslenme" title="Beslenme programı" items={["Haftalık öğün planı ve şablonlar", "Su ve öğün takibi", "Kilo ve ölçü kaydı", "Otomatik alışveriş listesi"]} />;
}
