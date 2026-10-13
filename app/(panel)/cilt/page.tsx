import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Cilt bakım serüveni" };

export default async function Page() {
  await requireUser();
  return <ComingSoon eyebrow="Cilt" title="Cilt bakım serüveni" items={["Ürünler ve rutin", "Haftalık takip", "Cilt günlüğü", "Önce/sonra karşılaştırması"]} />;
}
