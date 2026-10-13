import type { Metadata } from "next";
import { TodayView } from "@/components/today/today-view";
import { requireUser } from "@/lib/auth/session";
import { formatDayLong, todayIstanbul, weekDays, weekStart } from "@/lib/dates";
import { getCheckKeys, getRoutine, getSkinStreak } from "@/lib/skin";

export const metadata: Metadata = { title: "Bugün" };

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", hourCycle: "h23" }).format(new Date()),
  );
  if (hour >= 5 && hour < 11) return "Günaydın";
  if (hour >= 11 && hour < 17) return "İyi günler";
  if (hour >= 17 && hour < 22) return "İyi akşamlar";
  return "İyi geceler";
}

export default async function TodayPage() {
  const user = await requireUser();
  const today = todayIstanbul();
  const week = weekDays(weekStart(today));
  const [items, checks, streak] = await Promise.all([
    getRoutine(user.id),
    getCheckKeys(user.id, week[0]!, week[6]!),
    getSkinStreak(user.id, today),
  ]);

  return (
    <main className="main narrow">
      <header className="page-head">
        <p className="eyebrow">
          {greeting()}, {user.displayName.split(" ")[0]}
        </p>
        <h1>{formatDayLong(today)}</h1>
      </header>
      <TodayView
        key={today}
        today={today}
        week={week}
        items={items}
        initialChecks={checks}
        streak={{ current: streak.current, todayComplete: streak.todayComplete }}
      />
    </main>
  );
}
