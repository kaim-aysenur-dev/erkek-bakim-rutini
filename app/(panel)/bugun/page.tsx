import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Bugün" };

export default async function Page() {
  await requireUser();
  return <ComingSoon eyebrow="Ana panel" title="Bugün" items={["Cilt adımları, öğünler, su, antrenman ve alışkanlıklar tek listede", "Günlük tamamlanma yüzdesi ve seri", "Beklemeli adımlar için geri sayım"]} />;
}
