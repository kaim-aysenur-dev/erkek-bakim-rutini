"use client";

import Link from "next/link";
import { Check, ChevronDown, Flame, Play, Plus, Square } from "lucide-react";
import { ProductThumb } from "@/components/product-thumb";
import { Toast } from "@/components/toast";
import { useTimers } from "@/components/timers";
import { useChecks, useDayRollover } from "@/components/use-checks";
import { checkKey, dayProgress, weeklyCount } from "@/lib/progress";
import { DAILY_SLOTS, SLOT_LABEL, formatClock, formatDuration, type Slot } from "@/lib/slots";

export type TodayItem = {
  id: string;
  slot: Slot;
  label: string;
  detail: string;
  weeklyTarget: number | null;
  timers: number[];
  productName: string | null;
  image: string | null;
};

type Props = {
  today: string;
  week: string[];
  items: TodayItem[];
  initialChecks: string[];
  streak: { current: number; todayComplete: boolean };
};

export function TodayView({ today, week, items, initialChecks, streak }: Props) {
  const { checked, setDone, error, clearError } = useChecks(initialChecks);
  useDayRollover(today);

  const progress = dayProgress(items, today, checked);
  const isDone = (id: string) => checked.has(checkKey(today, id));
  // Seri: bugün tamamlanırsa canlı olarak bir artar
  const streakBefore = streak.todayComplete ? streak.current - 1 : streak.current;
  const streakNow = streakBefore + (progress.total > 0 && progress.done === progress.total ? 1 : 0);

  const weekly = items.filter((i) => i.slot === "haftalik");
  const weeklyVisible = weekly.filter((i) => weeklyCount(i.id, week, checked) < (i.weeklyTarget ?? 1) || isDone(i.id));
  const asNeeded = items.filter((i) => i.slot === "gerektiginde");

  if (!items.length) {
    return (
      <div className="empty">
        <span className="empty-icon">
          <Plus size={26} />
        </span>
        <h2>Cilt rutinin henüz boş</h2>
        <p>Ürünlerini ekleyip sabah, akşam, duş ya da haftalık gruplara yerleştirince adımların burada listelenir.</p>
        <Link href="/cilt/urunler/yeni" className="btn btn-primary">
          <Plus size={18} /> Ürün ekle
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="today-summary" aria-label="Günün özeti">
        <div className="ring" style={{ "--p": progress.percent } as React.CSSProperties}>
          <span className="num">%{progress.percent}</span>
        </div>
        <div className="today-summary-text">
          <strong>
            <span className="num">
              {progress.done}/{progress.total}
            </span>{" "}
            günlük adım tamam
          </strong>
          <span className="streak">
            <Flame size={16} aria-hidden="true" />
            <span>
              <span className="num">{streakNow}</span> günlük seri
            </span>
          </span>
        </div>
      </section>

      {DAILY_SLOTS.map((slot) => {
        const group = items.filter((i) => i.slot === slot);
        if (!group.length) return null;
        const doneCount = group.filter((i) => isDone(i.id)).length;
        return (
          <section key={slot} className="slot-block" aria-labelledby={`slot-${slot}`}>
            <div className="slot-head">
              <h2 id={`slot-${slot}`} className="tag" data-slot={slot}>
                Cilt · {SLOT_LABEL[slot]}
              </h2>
              <span className="slot-count num">
                {doneCount === group.length ? "Tamam ✓" : `${doneCount}/${group.length}`}
              </span>
            </div>
            <ol className="steps">
              {group.map((item, index) => (
                <Step
                  key={item.id}
                  item={item}
                  index={index + 1}
                  done={isDone(item.id)}
                  today={today}
                  onToggle={(done) => setDone(today, item.id, done)}
                />
              ))}
            </ol>
          </section>
        );
      })}

      {weekly.length > 0 && (
        <section className="slot-block" aria-labelledby="slot-haftalik">
          <div className="slot-head">
            <h2 id="slot-haftalik" className="tag" data-slot="haftalik">
              Haftalık hedefler
            </h2>
          </div>
          {weeklyVisible.length ? (
            <ol className="steps">
              {weeklyVisible.map((item) => (
                <Step
                  key={item.id}
                  item={item}
                  done={isDone(item.id)}
                  today={today}
                  meta={`${weeklyCount(item.id, week, checked)}/${item.weeklyTarget} bu hafta`}
                  onToggle={(done) => setDone(today, item.id, done)}
                />
              ))}
            </ol>
          ) : (
            <p className="muted">Bu haftanın hedefleri tamam. ✓</p>
          )}
        </section>
      )}

      {asNeeded.length > 0 && (
        <details className="slot-block as-needed" open={asNeeded.some((i) => isDone(i.id))}>
          <summary>
            <span className="tag" data-slot="gerektiginde">
              Gerektiğinde
            </span>
            <span className="muted">İşaretlenmezse kaçırılmış sayılmaz</span>
            <ChevronDown size={18} className="chev" aria-hidden="true" />
          </summary>
          <ol className="steps">
            {asNeeded.map((item) => (
              <Step
                key={item.id}
                item={item}
                done={isDone(item.id)}
                today={today}
                onToggle={(done) => setDone(today, item.id, done)}
              />
            ))}
          </ol>
        </details>
      )}

      <Toast message={error} onDone={clearError} />
    </>
  );
}

function Step({
  item,
  index,
  done,
  today,
  meta,
  onToggle,
}: {
  item: TodayItem;
  index?: number;
  done: boolean;
  today: string;
  meta?: string;
  onToggle: (done: boolean) => void;
}) {
  const { timers, now, start, stop } = useTimers();
  const running = timers.find((t) => t.itemId === item.id);
  const left = running ? (running.endsAt - now) / 1000 : 0;

  return (
    <li className={`step${done ? " is-done" : ""}`}>
      <button type="button" className="step-main" aria-pressed={done} onClick={() => onToggle(!done)}>
        <span className="step-check" aria-hidden="true">
          {done ? <Check size={16} strokeWidth={3} /> : index ? <span className="num">{index}</span> : null}
        </span>
        <ProductThumb src={item.image} alt="" size="sm" tooth={!item.productName && /diş/i.test(item.label)} />
        <span className="step-text">
          <span className="step-title">
            {item.label}
            <span className="sr-only">{done ? " (yapıldı)" : " (bekliyor)"}</span>
          </span>
          {item.detail && <span className="step-sub">{item.detail}</span>}
          {meta && <span className="step-meta num">{meta}</span>}
        </span>
      </button>

      {item.timers.length > 0 && (
        <div className="step-timer">
          {running ? (
            <>
              <span className="timer-left num" aria-live="off">
                {formatClock(left)}
              </span>
              <button type="button" className="timer-stop" onClick={() => stop(item.id)} aria-label="Sayacı durdur">
                <Square size={14} />
              </button>
            </>
          ) : (
            item.timers.map((seconds) => (
              <button
                key={seconds}
                type="button"
                className="timer-btn"
                onClick={() => start({ itemId: item.id, day: today, label: item.label, seconds })}
                aria-label={`${item.label} için ${formatDuration(seconds)} sayacı başlat`}
              >
                <Play size={14} aria-hidden="true" />
                {item.timers.length === 1 ? `Başlat · ${formatDuration(seconds)}` : formatDuration(seconds)}
              </button>
            ))
          )}
        </div>
      )}
      {running && (
        <span
          className="step-progress"
          style={{ width: `${Math.min(100, (1 - left / running.total) * 100)}%` }}
          aria-hidden="true"
        />
      )}
    </li>
  );
}
