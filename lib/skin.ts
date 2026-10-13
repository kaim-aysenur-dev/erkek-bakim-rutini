import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { deleteImage, imageUrl } from "@/lib/cloudinary";
import { addDays } from "@/lib/dates";
import { ALL_SKIN_METRICS, SLOTS, type SkinMetric, type Slot } from "@/lib/slots";

// Cilt bakımı veri katmanı. Bütün fonksiyonlar userId alır ve sorguları onunla sınırlar.

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function productImage(url: string | null, publicId: string | null, size: number): string | null {
  if (publicId) return imageUrl(publicId, { width: size, height: size, crop: "fit" });
  return url;
}

/* ---------- rutin ---------- */

export type RoutineItem = {
  id: string;
  slot: Slot;
  label: string;
  detail: string;
  weeklyTarget: number | null;
  /** rutine eklendiği gün (İstanbul) */
  since: string;
  timers: number[];
  productId: string | null;
  productName: string | null;
  image: string | null;
};

export async function getRoutine(userId: string): Promise<RoutineItem[]> {
  const rows = await sql()`
    select ri.id, ri.slot, ri.label, ri.detail, ri.weekly_target, ri.timer_seconds,
           to_char((ri.created_at at time zone ${"Europe/Istanbul"})::date, ${"YYYY-MM-DD"}) as since,
           p.id as product_id, p.name as product_name, p.image_url, p.image_public_id,
           p.area, p.duration, p.timer_seconds as product_timers
    from routine_items ri
    left join products p on p.id = ri.product_id
    where ri.user_id = ${userId} and ri.active and (p.id is null or not p.archived)
    order by array_position(${SLOTS as unknown as string[]}::text[], ri.slot), ri.sort_order, ri.created_at`;
  return rows.map((r) => ({
    id: r.id,
    slot: r.slot,
    label: r.label,
    detail: r.detail || [r.area, r.duration].filter(Boolean).join(" · "),
    weeklyTarget: r.weekly_target,
    since: r.since,
    timers: r.timer_seconds?.length ? r.timer_seconds : (r.product_timers ?? []),
    productId: r.product_id,
    productName: r.product_name,
    image: productImage(r.image_url, r.image_public_id, 200),
  }));
}

/* ---------- işaretler ---------- */

export async function getCheckKeys(userId: string, from: string, to: string): Promise<string[]> {
  const rows = await sql()`
    select to_char(day, 'YYYY-MM-DD') as day, item_id
    from checks where user_id = ${userId} and day between ${from} and ${to}`;
  return rows.map((r) => `${r.day}|${r.item_id}`);
}

/** Adımı işaretler / işareti kaldırır. Adım bu kullanıcıya ait değilse false döner. */
export async function setCheck(userId: string, day: string, itemId: string, done: boolean): Promise<boolean> {
  const owned = await sql()`select 1 from routine_items where id = ${itemId} and user_id = ${userId}`;
  if (!owned.length) return false;
  if (done) {
    await sql()`insert into checks (user_id, day, item_id) values (${userId}, ${day}, ${itemId}) on conflict do nothing`;
  } else {
    await sql()`delete from checks where user_id = ${userId} and day = ${day} and item_id = ${itemId}`;
  }
  return true;
}

/* ---------- seri ---------- */

export type Streak = { current: number; best: number; todayComplete: boolean };

/** Günlük adımların (sabah, akşam, duş) hepsinin yapıldığı aralıksız gün sayısı */
export async function getSkinStreak(userId: string, today: string): Promise<Streak> {
  const [{ n }] = await sql()`
    select count(*)::int as n from routine_items ri left join products p on p.id = ri.product_id
    where ri.user_id = ${userId} and ri.active and (p.id is null or not p.archived)
      and ri.slot in ('sabah', 'aksam', 'dus')`;
  if (!n) return { current: 0, best: 0, todayComplete: false };

  const rows = await sql()`
    select to_char(c.day, 'YYYY-MM-DD') as day
    from checks c
    join routine_items ri on ri.id = c.item_id
    left join products p on p.id = ri.product_id
    where c.user_id = ${userId} and c.day <= ${today} and ri.active and (p.id is null or not p.archived)
      and ri.slot in ('sabah', 'aksam', 'dus')
    group by c.day having count(*) >= ${n}
    order by c.day`;
  const days: string[] = rows.map((r) => r.day);
  const complete = new Set(days);

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of days) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }

  // Bugün henüz bitmediyse seri dünden sayılır, bozulmuş sayılmaz
  const todayComplete = complete.has(today);
  let current = 0;
  for (let d = todayComplete ? today : addDays(today, -1); complete.has(d); d = addDays(d, -1)) current++;
  return { current, best, todayComplete };
}

/* ---------- ürünler ---------- */

export type Product = {
  id: string;
  name: string;
  brand: string;
  image: string | null;
  imageLarge: string | null;
  hasUpload: boolean;
  purpose: string;
  area: string;
  duration: string;
  usageTime: string;
  ingredients: string;
  note: string;
  timers: number[];
  slots: Slot[];
  weeklyTarget: number | null;
  label: string | null;
};

function toProduct(r: Record<string, any>): Product {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    image: productImage(r.image_url, r.image_public_id, 240),
    imageLarge: productImage(r.image_url, r.image_public_id, 640),
    hasUpload: Boolean(r.image_public_id),
    purpose: r.purpose,
    area: r.area,
    duration: r.duration,
    usageTime: r.usage_time,
    ingredients: r.ingredients,
    note: r.note,
    timers: r.timer_seconds ?? [],
    slots: r.slots ?? [],
    weeklyTarget: r.weekly_target,
    label: r.label,
  };
}

export async function listProducts(userId: string, productId?: string): Promise<Product[]> {
  const rows = await sql()`
    select p.*,
           coalesce(array_agg(ri.slot order by array_position(${SLOTS as unknown as string[]}::text[], ri.slot))
                    filter (where ri.active), '{}') as slots,
           max(ri.weekly_target) filter (where ri.active and ri.slot = 'haftalik') as weekly_target,
           min(ri.label) filter (where ri.active) as label
    from products p
    left join routine_items ri on ri.product_id = p.id
    where p.user_id = ${userId} and not p.archived and (${productId ?? null}::uuid is null or p.id = ${productId ?? null}::uuid)
    group by p.id
    order by p.sort_order, p.created_at`;
  return rows.map(toProduct);
}

export async function getProduct(userId: string, productId: string): Promise<Product | null> {
  if (!UUID_RE.test(productId)) return null;
  return (await listProducts(userId, productId))[0] ?? null;
}

export type ProductInput = {
  name: string;
  brand: string;
  purpose: string;
  area: string;
  duration: string;
  usageTime: string;
  ingredients: string;
  note: string;
  label: string;
  timers: number[];
  slots: Slot[];
  weeklyTarget: number | null;
  /** undefined: dokunma, null: kaldır, string: yeni yüklenen Cloudinary public_id */
  imagePublicId?: string | null;
};

/** Ürünü kaydeder ve rutindeki adımlarını seçilen zaman gruplarına göre eşitler. */
export async function saveProduct(userId: string, productId: string | null, input: ProductInput): Promise<string | null> {
  const db = sql();
  let oldPublicId: string | null = null;
  if (productId) {
    const [row] = await db`select image_public_id from products where id = ${productId} and user_id = ${userId} and not archived`;
    if (!row) return null;
    oldPublicId = row.image_public_id;
  }
  const id = productId ?? randomUUID();
  const label = input.label || input.name;
  const queries = [];

  if (productId) {
    queries.push(db`
      update products set name = ${input.name}, brand = ${input.brand}, purpose = ${input.purpose},
        area = ${input.area}, duration = ${input.duration}, usage_time = ${input.usageTime},
        ingredients = ${input.ingredients}, note = ${input.note}, timer_seconds = ${input.timers},
        updated_at = now()
      where id = ${id} and user_id = ${userId}`);
  } else {
    queries.push(db`
      insert into products (id, user_id, name, brand, purpose, area, duration, usage_time, ingredients, note,
                            timer_seconds, sort_order)
      values (${id}, ${userId}, ${input.name}, ${input.brand}, ${input.purpose}, ${input.area}, ${input.duration},
              ${input.usageTime}, ${input.ingredients}, ${input.note}, ${input.timers},
              (select coalesce(max(sort_order), 0) + 1 from products where user_id = ${userId}))`);
  }

  if (input.imagePublicId !== undefined) {
    // Yeni fotoğraf yüklendiyse ya da kaldırıldıysa hazır görsel de bırakılır
    queries.push(db`update products set image_public_id = ${input.imagePublicId}, image_url = null
                    where id = ${id} and user_id = ${userId}`);
  }

  for (const slot of SLOTS) {
    if (input.slots.includes(slot)) {
      const target = slot === "haftalik" ? (input.weeklyTarget ?? 1) : null;
      queries.push(db`
        insert into routine_items (user_id, product_id, slot, label, weekly_target, sort_order)
        values (${userId}, ${id}, ${slot}, ${label}, ${target},
                (select coalesce(max(sort_order), 0) + 1 from routine_items where user_id = ${userId} and slot = ${slot}))
        on conflict (product_id, slot) where product_id is not null
        do update set label = excluded.label, weekly_target = excluded.weekly_target, active = true`);
    } else {
      queries.push(db`update routine_items set active = false
                      where product_id = ${id} and slot = ${slot} and user_id = ${userId}`);
    }
  }

  await db.transaction(queries);
  if (input.imagePublicId !== undefined && oldPublicId && oldPublicId !== input.imagePublicId) {
    await deleteImage(oldPublicId);
  }
  return id;
}

/** Ürünü listeden kaldırır; geçmiş işaretler silinmesin diye kayıt arşivlenir. */
export async function archiveProduct(userId: string, productId: string): Promise<boolean> {
  const db = sql();
  const [row] = await db`
    update products set archived = true, updated_at = now()
    where id = ${productId} and user_id = ${userId} and not archived returning id`;
  if (!row) return false;
  await db`update routine_items set active = false where product_id = ${productId} and user_id = ${userId}`;
  return true;
}

/* ---------- cilt günlüğü ---------- */

export type JournalEntry = {
  day: string;
  scores: Partial<Record<SkinMetric, number | null>>;
  note: string;
  photoPublicId: string | null;
  photoThumb: string | null;
  photoLarge: string | null;
};

export async function getJournal(userId: string, limit = 400): Promise<JournalEntry[]> {
  const rows = await sql()`
    select to_char(day, 'YYYY-MM-DD') as day, kuruluk, yaglanma, sivilce, hassasiyet, tiras, note, photo_public_id
    from skin_journal where user_id = ${userId}
    order by day desc limit ${limit}`;
  return rows.map((r) => ({
    day: r.day,
    scores: Object.fromEntries(ALL_SKIN_METRICS.map((m) => [m, r[m]])),
    note: r.note,
    photoPublicId: r.photo_public_id,
    photoThumb: r.photo_public_id ? imageUrl(r.photo_public_id, { width: 240, height: 240, crop: "fill", gravity: "auto" }) : null,
    photoLarge: r.photo_public_id ? imageUrl(r.photo_public_id, { width: 1200, crop: "limit" }) : null,
  }));
}

export async function saveJournal(
  userId: string,
  day: string,
  scores: Partial<Record<SkinMetric, number | null>>,
  note: string,
  photoPublicId: string | null | undefined,
): Promise<void> {
  const db = sql();
  const [old] = await db`select photo_public_id from skin_journal where user_id = ${userId} and day = ${day}`;
  const photo = photoPublicId === undefined ? (old?.photo_public_id ?? null) : photoPublicId;
  const v = (m: SkinMetric) => scores[m] ?? null;
  await db`
    insert into skin_journal (user_id, day, kuruluk, yaglanma, sivilce, hassasiyet, tiras, note, photo_public_id)
    values (${userId}, ${day}, ${v("kuruluk")}, ${v("yaglanma")}, ${v("sivilce")}, ${v("hassasiyet")}, ${v("tiras")},
            ${note}, ${photo})
    on conflict (user_id, day) do update set
      kuruluk = excluded.kuruluk, yaglanma = excluded.yaglanma, sivilce = excluded.sivilce,
      hassasiyet = excluded.hassasiyet, tiras = excluded.tiras, note = excluded.note,
      photo_public_id = excluded.photo_public_id, updated_at = now()`;
  if (old?.photo_public_id && old.photo_public_id !== photo) await deleteImage(old.photo_public_id);
}

export async function deleteJournal(userId: string, day: string): Promise<boolean> {
  const [row] = await sql()`delete from skin_journal where user_id = ${userId} and day = ${day} returning photo_public_id`;
  if (!row) return false;
  if (row.photo_public_id) await deleteImage(row.photo_public_id);
  return true;
}
