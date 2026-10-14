import "server-only";
import type { PlanItemInput } from "@/lib/sport";
import { intIn, optionalNumber, text } from "@/lib/validate";

/** Plan maddesi (set, tekrar, ağırlık, dinlenme) doğrulaması */
export function parsePlanItem(body: Record<string, unknown> | null): PlanItemInput | string {
  const sets = intIn(body?.sets, 1, 20);
  if (sets === null) return "Set sayısı 1 ile 20 arasında olmalı.";
  const weightKg = optionalNumber(body?.weightKg, 0, 1000);
  if (weightKg === undefined) return "Ağırlık geçersiz.";
  const restSeconds = intIn(body?.restSeconds, 0, 900);
  if (restSeconds === null) return "Dinlenme 0 ile 900 saniye arasında olmalı.";
  return { sets, reps: text(body?.reps, 30), weightKg, restSeconds, note: text(body?.note, 300) };
}
